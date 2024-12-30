// CHIP-8/index.ts
class Chips8Emulator {
  SIXTY_HZ = 1000 / 60;
  signals;
  STATE_SIGNAL = 0;
  ram = new Uint8Array(4096);
  registers = new Uint8Array(16);
  stack = new Uint16Array(16);
  pc = 512;
  fonts = new Uint8Array([
    240,
    144,
    144,
    144,
    240,
    32,
    96,
    32,
    32,
    112,
    240,
    16,
    240,
    128,
    240,
    240,
    16,
    240,
    16,
    240,
    144,
    144,
    240,
    16,
    16,
    240,
    128,
    240,
    16,
    240,
    240,
    128,
    240,
    144,
    240,
    240,
    16,
    32,
    64,
    64,
    240,
    144,
    240,
    144,
    240,
    240,
    144,
    240,
    16,
    240,
    240,
    144,
    240,
    144,
    144,
    224,
    144,
    224,
    144,
    224,
    240,
    128,
    128,
    128,
    240,
    224,
    144,
    144,
    144,
    224,
    240,
    128,
    240,
    128,
    240,
    240,
    128,
    240,
    128,
    128
  ]);
  stackPointer = 0;
  I = 0;
  fileEnd = 0;
  DISPLAY_WIDTH = 64;
  DISPLAY_HEIGHT = 32;
  displayState = new Uint8Array(this.DISPLAY_WIDTH * this.DISPLAY_HEIGHT);
  delayTimer = 0;
  soundTimer = 0;
  lastTimerDecrement = performance.now();
  prevDisplay = new Uint8Array(this.DISPLAY_WIDTH * this.DISPLAY_HEIGHT);
  powerLevel = new Uint8Array(this.DISPLAY_WIDTH * this.DISPLAY_HEIGHT);
  shouldHalt = false;
  lastDraw = 0;
  DISPLAY_RATE = this.SIXTY_HZ;
  drawTimeout;
  restartOnEnd = false;
  display;
  input;
  instrTrace = [];
  debug = false;
  disableGhosting = false;
  constructor(fileBinary, config) {
    this.ram.set(this.fonts, 0);
    this.ram.set(fileBinary, this.pc);
    this.fileEnd = this.pc + fileBinary.length;
    if (!config.signalBuffer) {
      console.warn("No signal buffer provided. The emulator will not be able to pause.");
    }
    if (!config.display) {
      console.warn("No display provided. The emulator will not be able to draw to the screen.");
    }
    if (!config.input) {
      console.warn("No input provided. The emulator will not be able to get input from the user.");
    }
    this.applyConfig(config);
  }
  applyConfig(config) {
    if (config.signalBuffer) {
      this.signals = new Uint8Array(config.signalBuffer);
    }
    if (config.display) {
      this.display = config.display;
    }
    if (config.input) {
      config.input.registerEmulator(this);
      this.input = config.input;
    }
    if ("restartOnEnd" in config) {
      this.restartOnEnd = config.restartOnEnd;
    }
    if ("debug" in config) {
      this.debug = config.debug;
    }
    if ("disableGhosting" in config) {
      this.disableGhosting = config.disableGhosting;
    }
  }
  addToInstrTrace(instr) {
    if (this.debug) {
      this.instrTrace.push(instr);
    }
  }
  cls() {
    this.addToInstrTrace("CLS");
    this.displayState.fill(0);
    this.display.clear();
    this.display.flush(this.displayState, this.DISPLAY_WIDTH);
  }
  ret() {
    this.addToInstrTrace("RET");
    this.pc = this.stack[this.stackPointer];
    this.stackPointer--;
  }
  jmp(instr) {
    const address = instr & 4095;
    this.addToInstrTrace(`JMP ${address}`);
    this.pc = address;
  }
  call(instr) {
    const address = instr & 4095;
    this.addToInstrTrace(`CALL ${address}`);
    this.stackPointer++;
    this.stack[this.stackPointer] = this.pc;
    this.pc = address;
  }
  skipIf(instr) {
    const register = (instr & 3840) >> 8;
    const value = instr & 255;
    this.addToInstrTrace(`SE V${register}, ${value.toString(16).padStart(2, "0")}`);
    if (this.registers[register] === value) {
      this.pc += 2;
    }
  }
  skipNotIf(instr) {
    const register = (instr & 3840) >> 8;
    const value = instr & 255;
    this.addToInstrTrace(`SNE V${register}, ${value.toString(16).padStart(2, "0")}`);
    if (this.registers[register] !== value) {
      this.pc += 2;
    }
  }
  compareRegisters(instr) {
    const registerX = (instr & 3840) >> 8;
    const registerY = (instr & 240) >> 4;
    this.instrTrace.push(`SE V${registerX}, V${registerY}`);
    if (this.registers[registerX] === this.registers[registerY]) {
      this.pc += 2;
    }
  }
  loadRegister(instr) {
    const register = (instr & 3840) >> 8;
    const value = instr & 255;
    this.addToInstrTrace(`LD V${register}, ${value.toString(16).padStart(2, "0")}`);
    this.registers[register] = value;
  }
  add(instr) {
    const register = (instr & 3840) >> 8;
    const toAdd = instr & 255;
    const valueX = this.registers[register];
    this.addToInstrTrace(`ADD V${register}, ${toAdd.toString(16).padStart(2, "0")}`);
    this.registers[register] = valueX + toAdd;
  }
  loadRegisterFromRegister(instr) {
    const registerX = (instr & 3840) >> 8;
    const registerY = (instr & 240) >> 4;
    this.addToInstrTrace(`LD V${registerX}, V${registerY}`);
    this.registers[registerX] = this.registers[registerY];
  }
  getArithmeticRegisters(instr) {
    const registerX = (instr & 3840) >> 8;
    const registerY = (instr & 240) >> 4;
    return [registerX, registerY];
  }
  or(instr) {
    const [registerX, registerY] = this.getArithmeticRegisters(instr);
    this.addToInstrTrace(`OR V${registerX}, V${registerY}`);
    this.registers[registerX] = this.registers[registerX] | this.registers[registerY];
  }
  and(instr) {
    const [registerX, registerY] = this.getArithmeticRegisters(instr);
    this.addToInstrTrace(`AND V${registerX}, V${registerY}`);
    this.registers[registerX] = this.registers[registerX] & this.registers[registerY];
  }
  xor(instr) {
    const [registerX, registerY] = this.getArithmeticRegisters(instr);
    this.addToInstrTrace(`XOR V${registerX}, V${registerY}`);
    this.registers[registerX] = this.registers[registerX] ^ this.registers[registerY];
  }
  addRegisters(instr) {
    const [registerX, registerY] = this.getArithmeticRegisters(instr);
    const valueX = this.registers[registerX];
    const valueY = this.registers[registerY];
    this.addToInstrTrace(`ADD V${registerX}, V${registerY}`);
    this.registers[registerX] = valueX + valueY;
    if (valueX + valueY > 255) {
      this.registers[15] = 1;
    } else {
      this.registers[15] = 0;
    }
  }
  subRegisters(instr) {
    const [registerX, registerY] = this.getArithmeticRegisters(instr);
    const valueX = this.registers[registerX];
    const valueY = this.registers[registerY];
    this.addToInstrTrace(`SUB V${registerX}, V${registerY}`);
    this.registers[registerX] = valueX - valueY;
    if (valueY > valueX) {
      this.registers[15] = 0;
    } else {
      this.registers[15] = 1;
    }
  }
  shiftRight(instr) {
    const [registerX, registerY] = this.getArithmeticRegisters(instr);
    const valueX = this.registers[registerX];
    this.addToInstrTrace(`SHR V${registerX} {, V${registerY}}`);
    this.registers[registerX] = valueX / 2;
    this.registers[15] = valueX & 1;
  }
  subRegistersReverse(instr) {
    const [registerX, registerY] = this.getArithmeticRegisters(instr);
    const valueX = this.registers[registerX];
    const valueY = this.registers[registerY];
    this.addToInstrTrace(`SUBN V${registerX}, V${registerY}`);
    this.registers[registerX] = valueY - valueX;
    if (valueX > valueY) {
      this.registers[15] = 0;
    } else {
      this.registers[15] = 1;
    }
  }
  shiftLeft(instr) {
    const [registerX, registerY] = this.getArithmeticRegisters(instr);
    const valueX = this.registers[registerX];
    this.addToInstrTrace(`SHL V${registerX} {, V${registerY}}`);
    this.registers[registerX] = valueX << 1;
    this.registers[15] = valueX >> 7;
  }
  skipIfNotEqualRegisters(instr) {
    const [registerX, registerY] = this.getArithmeticRegisters(instr);
    const valueX = this.registers[registerX];
    const valueY = this.registers[registerY];
    this.addToInstrTrace(`SNE V${registerX}, V${registerY}`);
    if (valueX !== valueY) {
      this.pc += 2;
    }
  }
  changeI(instr) {
    const value = instr & 4095;
    this.addToInstrTrace(`LD I, ${value.toString(16).padStart(3, "0")}`);
    this.I = value;
  }
  jmpByOffsetV0(instr) {
    const offset = instr & 4095;
    this.addToInstrTrace(`JMP V0, ${offset.toString(16).padStart(3, "0")}`);
    this.pc = this.registers[0] + offset;
  }
  randomAnd(instr) {
    const register = (instr & 3840) >> 8;
    const value = instr & 255;
    const randomByte = this.genRandomByte();
    this.addToInstrTrace(`RND V${register}, ${value.toString(16).padStart(2, "0")}`);
    this.registers[register] = randomByte & value;
  }
  async draw(instr) {
    const [registerX, registerY] = this.getArithmeticRegisters(instr);
    const bytes = instr & 15;
    this.addToInstrTrace(`DRW V${registerX}, V${registerY}, ${bytes.toString(16).padStart(2, "0")}`);
    this.registers[15] = 0;
    const valueX = this.registers[registerX];
    const valueY = this.registers[registerY];
    const xCoord = valueX % this.DISPLAY_WIDTH;
    const yCoord = valueY % this.DISPLAY_HEIGHT;
    const bitsPrinted = [];
    this.prevDisplay = this.displayState.slice();
    for (let i = 0;i < bytes; i++) {
      const bits = this.ram[this.I + i];
      const cy = (yCoord + i) % this.DISPLAY_WIDTH;
      bitsPrinted.push(bits.toString(16).padStart(2, "0"));
      for (let j = 0;j < 8; j++) {
        const cx = (xCoord + j) % this.DISPLAY_WIDTH;
        const currentDisplayValue = this.displayState[cy * this.DISPLAY_WIDTH + cx];
        const bit = bits & 1 << 7 - j;
        if (bit > 0) {
          if (currentDisplayValue === 1) {
            this.displayState[cy * this.DISPLAY_WIDTH + cx] = 0;
            this.registers[15] = 1;
          } else {
            this.displayState[cy * this.DISPLAY_WIDTH + cx] = 1;
          }
        }
        if (cx === this.DISPLAY_WIDTH - 1) {
          break;
        }
      }
      if (cy === this.DISPLAY_HEIGHT - 1) {
        break;
      }
    }
    await this.printDisplay();
  }
  skipIfKeyPressed(instr) {
    const register = (instr & 3840) >> 8;
    const valueX = this.registers[register];
    this.addToInstrTrace(`SKP V${register}`);
    if (this.input.isActive(valueX)) {
      this.pc += 2;
    }
  }
  skipIfNotPressed(instr) {
    const register = (instr & 3840) >> 8;
    const valueX = this.registers[register];
    this.addToInstrTrace(`SKNP V${register}`);
    if (!this.input.isActive(valueX)) {
      this.pc += 2;
    }
  }
  readDelayIntoRegister(instr) {
    const register = (instr & 3840) >> 8;
    this.addToInstrTrace(`LD V${register}, DT`);
    this.registers[register] = this.delayTimer;
  }
  async readKey() {
    while (true) {
      if (Atomics.load(this.signals, this.STATE_SIGNAL) === 1 /* PAUSED */) {
        this.pc -= 2;
        return;
      }
      for (let i = 0;i < 16; i++) {
        if (this.input.isActive(i)) {
          return i;
        }
      }
      if (!this.input.isUsingSharedArrayBuffer) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
  }
  async readKeyIntoRegister(instr) {
    const register = (instr & 3840) >> 8;
    const key = await this.readKey();
    if (key === undefined)
      return false;
    this.addToInstrTrace(`LD V${register}, K`);
    this.registers[register] = key;
    return true;
  }
  loadRegisterIntoDelayTimer(instr) {
    const register = (instr & 3840) >> 8;
    this.addToInstrTrace(`LD DT, V${register}`);
    this.delayTimer = this.registers[register];
  }
  loadRegisterIntoSoundTimer(instr) {
    const register = (instr & 3840) >> 8;
    this.addToInstrTrace(`LD ST, V${register}`);
    this.soundTimer = this.registers[register];
  }
  addRegisterToI(instr) {
    const register = (instr & 3840) >> 8;
    this.addToInstrTrace(`ADD I, V${register}`);
    this.I += this.registers[register];
  }
  assignIToSpriteMemory(instr) {
    const register = (instr & 3840) >> 8;
    this.addToInstrTrace(`LD F, V${register}`);
    this.I = this.registers[register] * 5;
  }
  storeDigitsAtI(instr) {
    const register = (instr & 3840) >> 8;
    const value = this.registers[register];
    const hundreds = Math.floor(value / 100);
    const tens = Math.floor(value % 100 / 10);
    const ones = value % 10;
    this.addToInstrTrace(`LD B, V${register}`);
    this.ram[this.I] = hundreds;
    this.ram[this.I + 1] = tens;
    this.ram[this.I + 2] = ones;
  }
  storeRegistersAtI(instr) {
    const register = (instr & 3840) >> 8;
    this.addToInstrTrace(`LD [I], V${register}`);
    for (let i = 0;i <= register; i++) {
      this.ram[this.I + i] = this.registers[i];
    }
  }
  loadRegisterFromI(instr) {
    const register = (instr & 3840) >> 8;
    this.addToInstrTrace(`LD V${register}, [I]`);
    for (let i = 0;i <= register; i++) {
      this.registers[i] = this.ram[this.I + i];
    }
  }
  halt() {
    this.shouldHalt = true;
  }
  async executeInstruction(instr) {
    const mostSignificantNibble = (instr & 61440) >> 12;
    const leastSignifiantNibble = instr & 15;
    const leastSignificantByte = instr & 255;
    if (instr === 224) {
      this.cls();
    } else if (instr === 238) {
      this.ret();
    }
    switch (mostSignificantNibble) {
      case 1:
        this.jmp(instr);
        break;
      case 2:
        this.call(instr);
        break;
      case 3:
        this.skipIf(instr);
        break;
      case 4:
        this.skipNotIf(instr);
        break;
      case 5:
        this.compareRegisters(instr);
        break;
      case 6:
        this.loadRegister(instr);
        break;
      case 7:
        this.add(instr);
        break;
      case 8:
        switch (leastSignifiantNibble) {
          case 0:
            this.loadRegisterFromRegister(instr);
            break;
          case 1:
            this.or(instr);
            break;
          case 2:
            this.and(instr);
            break;
          case 3:
            this.xor(instr);
            break;
          case 4:
            this.addRegisters(instr);
            break;
          case 5:
            this.subRegisters(instr);
            break;
          case 6:
            this.shiftRight(instr);
            break;
          case 7:
            this.subRegistersReverse(instr);
            break;
          case 14:
            this.shiftLeft(instr);
            break;
        }
        break;
      case 9:
        this.skipIfNotEqualRegisters(instr);
        break;
      case 10:
        this.changeI(instr);
        break;
      case 11:
        this.jmpByOffsetV0(instr);
        break;
      case 12:
        this.randomAnd(instr);
        break;
      case 13:
        await this.draw(instr);
        break;
      case 14:
        switch (instr & 255) {
          case 158:
            this.skipIfKeyPressed(instr);
            break;
          case 161:
            this.skipIfNotPressed(instr);
            break;
          default:
            throw new Error("Unknown instruction");
        }
        break;
      case 15:
        switch (leastSignificantByte) {
          case 7:
            this.readDelayIntoRegister(instr);
            break;
          case 10:
            await this.readKeyIntoRegister(instr);
            break;
          case 21:
            this.loadRegisterIntoDelayTimer(instr);
            break;
          case 24:
            this.loadRegisterIntoSoundTimer(instr);
            break;
          case 30:
            this.addRegisterToI(instr);
            break;
          case 41:
            this.assignIToSpriteMemory(instr);
            break;
          case 51:
            this.storeDigitsAtI(instr);
            break;
          case 85:
            this.storeRegistersAtI(instr);
            break;
          case 101:
            this.loadRegisterFromI(instr);
            break;
        }
        break;
    }
  }
  genRandomByte() {
    return Math.floor(Math.random() * 256);
  }
  async printDisplay() {
    const color1 = [141, 198, 255];
    const color2 = [159, 211, 199];
    this.display.clear();
    for (let i = 0;i < this.displayState.length; i++) {
      const x = i % this.DISPLAY_WIDTH;
      const y = Math.floor(i / this.DISPLAY_WIDTH);
      if (this.displayState[i] === 1) {
        this.display.draw(x, y, color1[0], color1[1], color1[2]);
      } else {
        this.powerLevel[i] = Math.max(0, this.powerLevel[i] / 1.22);
        if (this.prevDisplay[i] === 1) {
          this.powerLevel[i] = 255;
        }
        const newPowerLevel = this.disableGhosting ? 0 : Math.floor(this.powerLevel[i]);
        const normalizedPowerLevel = newPowerLevel / 255;
        this.display.draw(x, y, color2[0] * normalizedPowerLevel, color2[1] * normalizedPowerLevel, color2[2] * normalizedPowerLevel);
      }
    }
    await this.display.flush(this.displayState, this.DISPLAY_WIDTH);
  }
  async execute() {
    while (this.pc < this.fileEnd && !this.shouldHalt) {
      if (Atomics.load(this.signals, this.STATE_SIGNAL) === 1 /* PAUSED */) {
        break;
      }
      const instr = this.getCurrentInstruction();
      await this.executeInstruction(instr);
      if (this.stackPointer < 0)
        return;
      if (performance.now() - this.lastTimerDecrement >= this.SIXTY_HZ) {
        this.lastTimerDecrement = performance.now();
        if (this.delayTimer > 0) {
          this.delayTimer--;
        }
        if (this.soundTimer > 0) {
          this.soundTimer--;
        }
      }
    }
  }
  programHexDump(count = Infinity) {
    let pc = this.pc;
    let hexDump = "";
    for (let i = 0;i < count; i++) {
      const instruction = this.ram[pc] << 8 | this.ram[pc + 1];
      hexDump += instruction.toString(16).padStart(4, "0") + " ";
      pc += 2;
    }
    console.log(hexDump);
  }
  getCurrentInstruction() {
    const pc = this.pc;
    this.pc += 2;
    return this.ram[pc] << 8 | this.ram[pc + 1];
  }
}
export {
  Chips8Emulator
};
