import { Display } from "./Display";
import { Input } from "./Input";

export enum EmuState {
  PAUSED = 1,
  RUNNING = 0,
}

export interface EmuConfig {
  signalBuffer?: SharedArrayBuffer;
  restartOnEnd?: boolean;
  display?: Display;
  input?: Input;
  debug?: boolean;
  disableGhosting?: boolean;
  tickRate?: number;
}

export class CHIP8Emulator {
  SIXTY_HZ = 1000 / 60;

  /**
   * How many instructions to run per second
   */
  tickRate = 1000;

  /**
   * The index at which the state signal is stored
   */
  static STATE_SIGNAL = 0;

  /**
   * Since the emulator is essentially running an infinite loop, we can use
   * a SharedArrayBuffer to communicate with the emulator.
   *
   * This Uint8Array MUST be a SharedArrayBuffer. It only has one element, and
   * if it is 1, then the emulator will pause after the next instruction, and if
   * it is 0, then the emulator will continue running. If SharedArrayBuffer is not
   * supported, then `pause` and `continue` methods will not work.
   */
  signals!: Uint8Array;

  /**
   * 4KB of RAM
   */
  ram: Uint8Array = new Uint8Array(4096);

  /**
   * 16 8-bit registers
   */
  // registers: number[] = Array(16).fill(0);
  registers: Uint8Array = new Uint8Array(16);

  /**
   * The stack is an array of 16 16-bit values, used to store the address that the
   * interpreter shoud return to when finished with a subroutine.
   *  Chip-8 allows for up to 16 levels of nested subroutines.
   */
  stack: Uint16Array = new Uint16Array(16);

  /**
   * The program counter
   */
  pc: number = 0x200;

  /**
   * Preloaded fonts.
   * http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#font
   */
  // prettier-ignore
  fonts: Uint8Array = new Uint8Array([
    0xf0, 0x90, 0x90, 0x90, 0xf0, // 0
    0x20, 0x60, 0x20, 0x20, 0x70, // 1
    0xf0, 0x10, 0xf0, 0x80, 0xf0, // 2
    0xf0, 0x10, 0xf0, 0x10, 0xf0, // 3
    0x90, 0x90, 0xf0, 0x10, 0x10, // 4
    0xf0, 0x80, 0xf0, 0x10, 0xf0, // 5
    0xf0, 0x80, 0xf0, 0x90, 0xf0, // 6
    0xf0, 0x10, 0x20, 0x40, 0x40, // 7
    0xf0, 0x90, 0xf0, 0x90, 0xf0, // 8
    0xf0, 0x90, 0xf0, 0x10, 0xf0, // 9
    0xf0, 0x90, 0xf0, 0x90, 0x90, // A
    0xe0, 0x90, 0xe0, 0x90, 0xe0, // B
    0xf0, 0x80, 0x80, 0x80, 0xf0, // C
    0xe0, 0x90, 0x90, 0x90, 0xe0, // D
    0xf0, 0x80, 0xf0, 0x80, 0xf0, // E
    0xf0, 0x80, 0xf0, 0x80, 0x80, // F
  ]);

  /**
   * The stack pointer (SP) can be 8-bit,
   * it is used to point to the topmost level of the stack.
   */
  stackPointer: number = 0;

  I: number = 0;

  /**
   * The index in the RAM where the program file ends
   */
  fileEnd: number = 0;

  /**
   * The delay timer is active whenever the delay timer register (DT) is non-zero.
   * This timer does nothing more than subtract 1 from the value of DT at a rate of 60Hz.
   * When DT reaches 0, it deactivates.
   */
  delayTimer: number = 0;

  /**
   * The sound timer is active whenever the sound timer register (ST) is non-zero.
   * This timer also decrements at a rate of 60Hz, however, as long as ST's value is greater than zero,
   * the Chip-8 buzzer will sound. When ST reaches zero, the sound timer deactivates.
   *
   * NOTE: For our implementation, we will not be playing any sounds.
   */
  soundTimer: number = 0;

  /**
   * Keeps track of when we last decremented the delay timer and sound timer
   */
  lastTimerDecrement: number = performance.now();

  /**
   * Halt rhe emulator
   */
  shouldHalt: boolean = false;

  /**
   * Restart the emulator when it reaches the end of the file.
   */
  restartOnEnd: boolean = false;

  /**
   * Display interface to draw to the screen
   */
  display!: Display;

  /**
   * Input interface to get input from the user
   */
  input!: Input;

  /**
   * The instruction trace. Used for debugging. Instructions are pushed to
   * this array before they are executed. debug property must be set to true
   * to use this to happen.
   */
  instrTrace: string[] = [];

  /**
   * Debug mode
   */
  debug: boolean = false;

  /**
   * Used to calculate the number of instructions per second
   */
  ips: number = 0;
  numberOfHertzPassed: number = 0;

  constructor(fileBinary: Uint8Array, config: EmuConfig) {
    this.init(fileBinary, config);
  }

  reset() {
    this.ram.fill(0);
    this.registers.fill(0);
    this.stack.fill(0);
    this.pc = 0x200;
    this.stackPointer = 0;
    this.I = 0;
    this.fileEnd = 0;
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.lastTimerDecrement = performance.now();
    this.shouldHalt = false;
    this.instrTrace = [];

    this.display?.reset();
    // The rest can be handled by the applyConfig method
  }

  init(fileBinary: Uint8Array, config: EmuConfig) {
    // Reset the emulator
    this.reset();

    // Load the fonts into memory
    this.ram.set(this.fonts, 0);

    // Load the program into memory
    this.ram.set(fileBinary, this.pc);

    // Set where the file ends
    this.fileEnd = this.pc + fileBinary.length;

    if (!config.signalBuffer && !this.signals) {
      console.warn(
        "No signal buffer provided. The emulator will not be able to pause."
      );
    }

    if (!config.display && !this.display) {
      console.warn(
        "No display provided. The emulator will not be able to draw to the screen."
      );
    }

    if (!config.input && !this.input) {
      console.warn(
        "No input provided. The emulator will not be able to get input from the user."
      );
    }

    // Apply the emulator configuration
    this.applyConfig(config);
  }

  /**
   * Apply the emulator configuration
   *
   * @param config The emulator configuration
   */
  applyConfig(config: EmuConfig) {
    // Initialize display and input

    if (config.signalBuffer) {
      this.signals = new Uint8Array(config.signalBuffer);
    }

    if (config.display) {
      this.display = config.display;
    }

    if (config.input) {
      this.input = config.input;
    }

    if ("restartOnEnd" in config) {
      this.restartOnEnd = config.restartOnEnd!;
    }

    if ("tickRate" in config) {
      this.tickRate = config.tickRate!;
    }

    if ("debug" in config) {
      this.debug = config.debug!;
    }

    if ("disableGhosting" in config && this.display) {
      this.display.disableGhosting = config.disableGhosting!;
    }
  }

  /**
   * Adds the instruction to the instruction trace if debug mode is enabled.
   * @param instr The instruction
   */
  addToInstrTrace(instr: string) {
    if (this.debug) {
      this.instrTrace.push(instr);
    }
  }

  /**
   * 00E0 - CLS
   *
   * Clear the display.
   */
  cls() {
    // this.addToInstrTrace("CLS");

    this.display.displayState.fill(0);

    this.display.clear();
    this.display.flush();
  }

  /**
   * 00EE - RET
   *
   * Return from a subroutine.
   * The interpreter sets the program counter to the address at the top of the stack,
   * then subtracts 1 from the stack pointer.
   */
  ret() {
    // this.addToInstrTrace("RET");

    this.pc = this.stack[this.stackPointer];
    this.stackPointer--;
  }

  /**
   * 1NNN - JMP
   *
   * Jump to location nnn.
   * The interpreter sets the program counter to nnn.
   */
  jmp(instr: number) {
    const address = instr & 0x0fff;

    // this.addToInstrTrace(`JMP ${address}`);

    this.pc = address;
  }

  /**
   * 2NNN - CALL
   *
   * Call subroutine at nnn.
   * The interpreter increments the stack pointer, then puts the current PC on the top of the stack.
   * The PC is then set to nnn.
   */
  call(instr: number) {
    const address = instr & 0x0fff;

    // this.addToInstrTrace(`CALL ${address}`);

    this.stackPointer++;
    this.stack[this.stackPointer] = this.pc;
    this.pc = address;
  }

  /**
   * 3xkk - SE Vx, byte
   *
   * Skip next instruction if Vx = kk.
   * The interpreter compares register Vx to kk, and if they are equal,
   * increments the program counter by 2.
   */
  skipIf(instr: number) {
    const register = (instr & 0x0f00) >> 8;
    const value = instr & 0x00ff;

    // this.addToInstrTrace(
    //   `SE V${register}, ${value.toString(16).padStart(2, "0")}`
    // );

    if (this.registers[register] === value) {
      this.pc += 2;
    }
  }

  /**
   * 4xkk - SNE Vx, byte
   *
   * Skip next instruction if Vx != kk.
   * The interpreter compares register Vx to kk, and if they are not equal,
   * increments the program counter by 2.
   */
  skipNotIf(instr: number) {
    const register = (instr & 0x0f00) >> 8;
    const value = instr & 0x00ff;

    // this.addToInstrTrace(
    //   `SNE V${register}, ${value.toString(16).padStart(2, "0")}`
    // );

    if (this.registers[register] !== value) {
      this.pc += 2;
    }
  }

  /**
   * 5xy0 - SE Vx, Vy
   *
   * Skip next instruction if Vx = Vy.
   * The interpreter compares register Vx to register Vy, and if they are equal,
   * increments the program counter by 2.
   */
  compareRegisters(instr: number) {
    const registerX = (instr & 0x0f00) >> 8;
    const registerY = (instr & 0x00f0) >> 4;

    // this.instrTrace.push(`SE V${registerX}, V${registerY}`);

    if (this.registers[registerX] === this.registers[registerY]) {
      this.pc += 2;
    }
  }

  /**
   * 6xkk - LD Vx, byte
   *
   * Set Vx = kk.
   * The interpreter puts the value kk into register Vx.
   */
  loadRegister(instr: number) {
    const register = (instr & 0x0f00) >> 8;
    const value = instr & 0x00ff;

    // this.addToInstrTrace(
    //   `LD V${register}, ${value.toString(16).padStart(2, "0")}`
    // );

    this.registers[register] = value & 0xff;
  }

  /**
   * 7xkk - ADD Vx, byte
   *
   * Set Vx = Vx + kk.
   * Adds the value kk to the value of register Vx, then stores the result in Vx.
   */
  add(instr: number) {
    const register = (instr & 0x0f00) >> 8;
    const toAdd = instr & 0x00ff;
    const valueX = this.registers[register];

    // this.addToInstrTrace(
    //   `ADD V${register}, ${toAdd.toString(16).padStart(2, "0")}`
    // );

    this.registers[register] = (valueX + toAdd) & 0xff;
  }

  /**
   * 8xy0 - LD Vx, Vy
   *
   * Set Vx = Vy.
   * Stores the value of register Vy in register Vx.
   */
  loadRegisterFromRegister(instr: number) {
    const registerX = (instr & 0x0f00) >> 8;
    const registerY = (instr & 0x00f0) >> 4;

    // this.addToInstrTrace(`LD V${registerX}, V${registerY}`);

    this.registers[registerX] = this.registers[registerY];
  }

  /**
   * Get the two registers for arithmetic operations
   * They all have the same format. The middle two nibbles are the two registers
   */
  getArithmeticRegisters(instr: number) {
    const registerX = (instr & 0x0f00) >> 8;
    const registerY = (instr & 0x00f0) >> 4;
    return [registerX, registerY];
  }

  /**
   * 8xy1 - OR Vx, Vy
   *
   * Set Vx = Vx OR Vy.
   * Performs a bitwise OR on the values of Vx and Vy,
   * then stores the result in Vx. A bitwise OR compares the corrseponding
   * bits from two values, and if either bit is 1, then the same bit in the
   * result is also 1. Otherwise, it is 0.
   */
  or(instr: number) {
    const [registerX, registerY] = this.getArithmeticRegisters(instr);

    // this.addToInstrTrace(`OR V${registerX}, V${registerY}`);

    this.registers[registerX] =
      this.registers[registerX] | this.registers[registerY];
  }

  /**
   * 8xy2 - AND Vx, Vy
   *
   * Set Vx = Vx AND Vy.
   * Performs a bitwise AND on the values of Vx and Vy, then stores the result in Vx.
   * A bitwise AND compares the corrseponding bits from two values, and if both bits
   * are 1, then the same bit in the result is also 1. Otherwise, it is 0.
   */
  and(instr: number) {
    const [registerX, registerY] = this.getArithmeticRegisters(instr);

    // this.addToInstrTrace(`AND V${registerX}, V${registerY}`);

    this.registers[registerX] =
      this.registers[registerX] & this.registers[registerY];
  }

  /**
   * 8xy3 - XOR Vx, Vy
   *
   * Set Vx = Vx XOR Vy.
   * Performs a bitwise exclusive OR on the values of Vx and Vy, then stores the result
   * in Vx. An exclusive OR compares the corrseponding bits from two values, and if
   * the bits are not both the same, then the corresponding bit in the result is set to 1.
   * Otherwise, it is 0.
   */
  xor(instr: number) {
    const [registerX, registerY] = this.getArithmeticRegisters(instr);

    // this.addToInstrTrace(`XOR V${registerX}, V${registerY}`);

    this.registers[registerX] =
      this.registers[registerX] ^ this.registers[registerY];
  }

  /**
   * 8xy4 - ADD Vx, Vy
   *
   * Set Vx = Vx + Vy, set VF = carry.
   * The values of Vx and Vy are added together. If the result is greater than 8 bits
   * (i.e., > 255,) VF is set to 1, otherwise 0.
   *  Only the lowest 8 bits of the result are kept, and stored in Vx.
   */
  addRegisters(instr: number) {
    const [registerX, registerY] = this.getArithmeticRegisters(instr);
    const valueX = this.registers[registerX];
    const valueY = this.registers[registerY];

    // this.addToInstrTrace(`ADD V${registerX}, V${registerY}`);

    this.registers[registerX] = valueX + valueY;

    if (valueX + valueY > 255) {
      this.registers[0xf] = 1;
    } else {
      this.registers[0xf] = 0;
    }
  }

  /**
   * 8xy5 - SUB Vx, Vy
   *
   * Set Vx = Vx - Vy, set VF = NOT borrow.
   * If Vx > Vy, then VF is set to 1, otherwise 0.
   * Then Vy is subtracted from Vx, and the results stored in Vx.
   */
  subRegisters(instr: number) {
    const [registerX, registerY] = this.getArithmeticRegisters(instr);
    const valueX = this.registers[registerX];
    const valueY = this.registers[registerY];

    // this.addToInstrTrace(`SUB V${registerX}, V${registerY}`);

    this.registers[registerX] = valueX - valueY;

    if (valueY > valueX) {
      this.registers[0xf] = 0;
    } else {
      this.registers[0xf] = 1;
    }
  }

  /**
   * 8xy6 - SHR Vx {, Vy}
   *
   * Set Vx = Vx SHR 1.
   * If the least-significant bit of Vx is 1,
   * then VF is set to 1, otherwise 0.
   * Then Vx is divided by 2.
   */
  shiftRight(instr: number) {
    const [registerX, registerY] = this.getArithmeticRegisters(instr);
    const valueX = this.registers[registerX];

    // this.addToInstrTrace(`SHR V${registerX} {, V${registerY}}`);

    this.registers[registerX] = valueX / 2;
    this.registers[0xf] = valueX & 0x01;
  }

  /**
   * 8xy7 - SUBN Vx, Vy
   *
   * Set Vx = Vy - Vx, set VF = NOT borrow.
   * If Vy > Vx,
   * then VF is set to 1, otherwise 0.
   * Then Vx is subtracted from Vy, and the results stored in Vx.
   */
  subRegistersReverse(instr: number) {
    const [registerX, registerY] = this.getArithmeticRegisters(instr);
    const valueX = this.registers[registerX];
    const valueY = this.registers[registerY];

    // this.addToInstrTrace(`SUBN V${registerX}, V${registerY}`);

    this.registers[registerX] = valueY - valueX;

    if (valueX > valueY) {
      this.registers[0xf] = 0;
    } else {
      this.registers[0xf] = 1;
    }
  }

  /**
   * 8xyE - SHL Vx {, Vy}
   *
   * Set Vx = Vx SHL 1.
   * If the most-significant bit of Vx is 1,
   * then VF is set to 1, otherwise to 0.
   * Then Vx is multiplied by 2.
   */
  shiftLeft(instr: number) {
    const [registerX, registerY] = this.getArithmeticRegisters(instr);
    const valueX = this.registers[registerX];

    // this.addToInstrTrace(`SHL V${registerX} {, V${registerY}}`);

    this.registers[registerX] = valueX << 1;
    this.registers[0xf] = valueX >> 7;
  }

  /**
   * 9xy0 - SNE Vx, Vy
   *
   * Skip next instruction if Vx != Vy.
   * The values of Vx and Vy are compared, and if they are not equal,
   * the program counter is increased by 2.
   */
  skipIfNotEqualRegisters(instr: number) {
    const [registerX, registerY] = this.getArithmeticRegisters(instr);
    const valueX = this.registers[registerX];
    const valueY = this.registers[registerY];

    // this.addToInstrTrace(`SNE V${registerX}, V${registerY}`);

    if (valueX !== valueY) {
      this.pc += 2;
    }
  }

  /**
   * Annn - LD I, addr
   *
   * Set I = nnn.
   * The value of register I is set to nnn.
   */
  changeI(instr: number) {
    const value = instr & 0x0fff;

    // this.addToInstrTrace(`LD I, ${value.toString(16).padStart(3, "0")}`);

    this.I = value;
  }

  /**
   * Bnnn - JP V0, addr
   *
   * Jump to location nnn + V0.
   * The program counter is set to nnn plus the value of V0.
   */
  jmpByOffsetV0(instr: number) {
    const offset = instr & 0x0fff;

    // this.addToInstrTrace(`JMP V0, ${offset.toString(16).padStart(3, "0")}`);

    this.pc = this.registers[0] + offset;
  }

  /**
   * Cxkk - RND Vx, byte
   *
   * Set Vx = random byte AND kk.
   * The interpreter generates a random number from 0 to 255,
   * which is then ANDed with the value kk. The results are
   * stored in Vx. See instruction 8xy2 for more information on AND.
   */
  randomAnd(instr: number) {
    const register = (instr & 0x0f00) >> 8;
    const value = instr & 0x00ff;
    const randomByte = this.genRandomByte();

    // this.addToInstrTrace(
    //   `RND V${register}, ${value.toString(16).padStart(2, "0")}`
    // );

    this.registers[register] = randomByte & value;
  }

  /**
   * Dxyn - DRW Vx, Vy, nibble
   *
   * Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.
   * The interpreter reads n bytes from memory, starting at the address stored in I.
   * These bytes are then displayed as sprites on screen at coordinates (Vx, Vy).
   * Sprites are XORed onto the existing screen. If this causes any pixels to be erased,
   * VF is set to 1, otherwise it is set to 0. If the sprite is positioned so part of it
   * is outside the coordinates of the display, it wraps around to the opposite side of
   * the screen.
   */
  draw(instr: number) {
    const [registerX, registerY] = this.getArithmeticRegisters(instr);
    const bytes = instr & 0x000f;

    // this.addToInstrTrace(
    //   `DRW V${registerX}, V${registerY}, ${bytes.toString(16).padStart(2, "0")}`
    // );

    this.registers[0xf] = 0;

    const valueX = this.registers[registerX];
    const valueY = this.registers[registerY];

    const displayWidth = Display.WIDTH;
    const displayHeight = Display.HEIGHT;
    const displayState = this.display.displayState;

    const xCoord = valueX % displayWidth;
    const yCoord = valueY % displayHeight;

    for (let i = 0; i < bytes; i++) {
      const bits = this.ram[this.I + i];
      const cy = (yCoord + i) % displayHeight;

      for (let j = 0; j < 8; j++) {
        const cx = (xCoord + j) % displayWidth;
        const currentDisplayValue = displayState[cy * displayWidth + cx];
        const bit = bits & (0x01 << (7 - j));

        if (bit > 0) {
          if (currentDisplayValue === 1) {
            displayState[cy * displayWidth + cx] = 0;
            this.registers[0xf] = 1;
          } else {
            displayState[cy * displayWidth + cx] = 1;
          }
        }

        if (cx === displayWidth - 1) {
          break;
        }
      }

      if (cy === displayHeight - 1) {
        break;
      }
    }

    // This has major performance implications, but it minimizes display lag and flickering
    // It makes sense to do this for games, but not for other applications
    this.display.print();
  }

  /**
   * Ex9E - SKP Vx
   *
   * Skip next instruction if key with the value of Vx is pressed.
   * Checks the keyboard, and if the key corresponding to the value of Vx is
   * currently in the down position, PC is increased by 2.
   */
  skipIfKeyPressed(instr: number) {
    const register = (instr & 0x0f00) >> 8;
    const valueX = this.registers[register];

    // this.addToInstrTrace(`SKP V${register}`);

    if (this.input.isActive(valueX)) {
      this.pc += 2;
    }
  }

  /**
   * ExA1 - SKNP Vx
   *
   * Skip next instruction if key with the value of Vx is not pressed.
   *
   * Checks the keyboard, and if the key corresponding to the value of
   * Vx is currently in the up position, PC is increased by 2.
   */
  skipIfNotPressed(instr: number) {
    const register = (instr & 0x0f00) >> 8;
    const valueX = this.registers[register];

    // this.addToInstrTrace(`SKNP V${register}`);

    if (!this.input.isActive(valueX)) {
      this.pc += 2;
    }
  }

  /**
   * Fx07 - LD Vx, DT
   *
   * Set Vx = delay timer value.
   * The value of DT is placed into Vx.
   */

  readDelayIntoRegister(instr: number) {
    const register = (instr & 0x0f00) >> 8;

    // this.addToInstrTrace(`LD V${register}, DT`);

    this.registers[register] = this.delayTimer & 0xff;
  }

  /**
   * Fx0A - LD Vx, K
   *
   * Wait for a key press, store the value of the key in Vx.
   * All execution stops until a key is pressed,
   * then the value of that key is stored in Vx.
   */
  readKey(): number | undefined {
    let wasActive = false;
    let activeIndex = -1;

    while (true) {
      this.display.printIfQueued();

      if (
        Atomics.load(this.signals, CHIP8Emulator.STATE_SIGNAL) ===
        EmuState.PAUSED
      ) {
        // Can't execute this instruction since the emulator is paused
        // so decrement the program counter by 2 to ensure this instruction
        // can be executed when the emulator is resumed
        this.pc -= 2;
        return;
      }

      for (let i = 0; i < 16; i++) {
        if (this.input.isActive(i) && !wasActive && activeIndex !== i) {
          activeIndex = i;
          wasActive = true;
          break;
        } else if (!this.input.isActive(i) && activeIndex === i) {
          return i;
        }
      }

    }
  }

  readKeyIntoRegister(instr: number) {
    const register = (instr & 0x0f00) >> 8;
    const key = this.readKey();

    if (key === undefined) return false;

    // this.addToInstrTrace(`LD V${register}, K`);

    this.registers[register] = key;

    return true;
  }

  /**
   * Fx15 - LD DT, Vx
   *
   * Set delay timer = Vx.
   * DT is set equal to the value of Vx.
   *
   */
  loadRegisterIntoDelayTimer(instr: number) {
    const register = (instr & 0x0f00) >> 8;

    // this.addToInstrTrace(`LD DT, V${register}`);

    this.delayTimer = this.registers[register];
  }

  /**
   * Fx18 - LD ST, Vx
   *
   * Set sound timer = Vx.
   * ST is set equal to the value of Vx.
   */
  loadRegisterIntoSoundTimer(instr: number) {
    const register = (instr & 0x0f00) >> 8;

    // this.addToInstrTrace(`LD ST, V${register}`);

    this.soundTimer = this.registers[register];
  }

  /**
   * Fx1E - ADD I, Vx
   *
   * Set I = I + Vx.
   * The values of I and Vx are added, and the results are stored in I.
   */
  addRegisterToI(instr: number) {
    const register = (instr & 0x0f00) >> 8;

    // this.addToInstrTrace(`ADD I, V${register}`);

    this.I += this.registers[register];
  }

  /**
   * Fx29 - LD F, Vx
   *
   * Set I = location of sprite for digit Vx.
   * The value of I is set to the location for the hexadecimal sprite
   * corresponding to the value of Vx.
   */
  assignIToSpriteMemory(instr: number) {
    const register = (instr & 0x0f00) >> 8;

    // this.addToInstrTrace(`LD F, V${register}`);

    this.I = this.registers[register] * 5;
  }

  /**
   * Fx33 - LD B, Vx
   *
   * Store BCD representation of Vx in memory locations I, I+1, and I+2.
   * The interpreter takes the decimal value of Vx, and places the
   * hundreds digit in memory at location in I, the tens digit at location I+1,
   * and the ones digit at location I+2.
   *
   * NOTE: If you aren't sure what BCD is, check out
   * https://en.wikipedia.org/wiki/Binary-coded_decimal
   */
  storeDigitsAtI(instr: number) {
    const register = (instr & 0x0f00) >> 8;
    const value = this.registers[register];
    // ~~ is equivalent to Math.floor
    const hundreds = ~~(value / 100);
    const tens = ~~((value % 100) / 10);
    const ones = value % 10;

    // this.addToInstrTrace(`LD B, V${register}`);

    this.ram[this.I] = hundreds;
    this.ram[this.I + 1] = tens;
    this.ram[this.I + 2] = ones;
  }

  /**
   * Fx55 - LD [I], Vx
   *
   * Store registers V0 through Vx in memory starting at location I.
   * The interpreter copies the values of registers V0 through Vx into memory,
   * starting at the address in I.
   */
  storeRegistersAtI(instr: number) {
    const register = (instr & 0x0f00) >> 8;

    // this.addToInstrTrace(`LD [I], V${register}`);

    for (let i = 0; i <= register; i++) {
      this.ram[this.I + i] = this.registers[i];
    }
  }

  /**
   * Fx65 - LD Vx, [I]
   *
   * Read registers V0 through Vx from memory starting at location I.
   * The interpreter reads values from memory starting at location I
   * into registers V0 through Vx.
   */
  loadRegisterFromI(instr: number) {
    const register = (instr & 0x0f00) >> 8;

    // this.addToInstrTrace(`LD V${register}, [I]`);

    for (let i = 0; i <= register; i++) {
      this.registers[i] = this.ram[this.I + i];
    }
  }

  halt() {
    this.shouldHalt = true;
  }

  /**
   * The main loop of the emulator.
   * We assume that the provided instruction is valid.
   *
   * @param instr The instruction to execute
   */
  executeInstruction(instr: number) {
    const mostSignificantNibble = (instr & 0xf000) >> 12;
    const leastSignifiantNibble = instr & 0x000f;
    const leastSignificantByte = instr & 0x00ff;

    if (instr === 0x00e0) {
      this.cls();
    } else if (instr === 0x00ee) {
      this.ret();
    }

    switch (mostSignificantNibble) {
      case 0x1:
        // JMP — 1NNN
        this.jmp(instr);
        break;
      case 0x2:
        // CALL NNN — 2NNN
        this.call(instr);
        break;
      case 0x3:
        // SE VX, NN — 3XNN
        this.skipIf(instr);
        break;
      case 0x4:
        // SNE VX, NN — 4XNN
        this.skipNotIf(instr);
        break;
      case 0x5:
        // SE VX, VY — 5XY0
        this.compareRegisters(instr);
        break;
      case 0x6:
        // LD VX, NN — 6XNN
        this.loadRegister(instr);
        break;
      case 0x7:
        // ADD VX, NN — 7XNN
        this.add(instr);
        break;
      case 0x8:
        switch (leastSignifiantNibble) {
          case 0x0:
            // LD VX, VY — 8XY0
            this.loadRegisterFromRegister(instr);
            break;
          case 0x1:
            // OR VX, VY — 8XY1
            this.or(instr);
            break;
          case 0x2:
            // AND VX, VY — 8XY2
            this.and(instr);
            break;
          case 0x3:
            // XOR VX, VY — 8XY3
            this.xor(instr);
            break;
          case 0x4:
            // ADD VX, VY — 8XY4
            this.addRegisters(instr);
            break;
          case 0x5:
            // SUB VX, VY — 8XY5
            this.subRegisters(instr);
            break;
          case 0x6:
            // SHR VX {, VY} — 8XY6
            this.shiftRight(instr);
            break;
          case 0x7:
            // SUBN VX, VY — 8XY7
            this.subRegistersReverse(instr);
            break;
          case 0xe:
            // SHL VX {, VY} — 8XYE
            this.shiftLeft(instr);
            break;
        }
        break;
      case 0x9:
        // SNE VX, VY — 9XY0
        this.skipIfNotEqualRegisters(instr);
        break;
      case 0xa:
        // LD I, NNN — ANNN
        this.changeI(instr);
        break;
      case 0xb:
        // JP V0, NNN — BNNN
        this.jmpByOffsetV0(instr);
        break;
      case 0xc:
        // RND VX, NN — CXNN
        this.randomAnd(instr);
        break;
      case 0xd:
        // DRW VX, VY, N — DXYN
        this.draw(instr);
        break;
      case 0xe:
        switch (instr & 0x00ff) {
          case 0x9e:
            // SKP VX — EX9E
            this.skipIfKeyPressed(instr);
            break;
          case 0xa1:
            // SKNP VX — EXA1
            this.skipIfNotPressed(instr);
            break;
          default:
            throw new Error("Unknown instruction");
        }
        break;
      case 0xf:
        // We need to use leastSignificantByte in this case instead of leastSignifiantNibble
        // since we some instructions have the same leastSignifiantNibble
        // Eg. Fx65 and Fx55
        switch (leastSignificantByte) {
          case 0x07:
            // LD Vx, DT — Fx07
            this.readDelayIntoRegister(instr);
            break;
          case 0x0a:
            // LD Vx, K — Fx0A
            this.readKeyIntoRegister(instr);
            break;
          case 0x15:
            // LD DT, Vx — Fx15
            this.loadRegisterIntoDelayTimer(instr);
            break;
          case 0x18:
            // LD ST, Vx — Fx18
            this.loadRegisterIntoSoundTimer(instr);
            break;
          case 0x1e:
            // ADD I, Vx — Fx1E
            this.addRegisterToI(instr);
            break;
          case 0x29:
            // LD F, Vx — Fx29
            this.assignIToSpriteMemory(instr);
            break;
          case 0x33:
            // LD B, Vx — Fx33
            this.storeDigitsAtI(instr);
            break;
          case 0x55:
            // LD [I], Vx — Fx55
            this.storeRegistersAtI(instr);
            break;
          case 0x65:
            // LD Vx, [I] — Fx65
            this.loadRegisterFromI(instr);
            break;
        }
        break;
    }
  }

  // Helper methods

  genRandomByte() {
    return Math.floor(Math.random() * 256);
  }


  start() {
    this.execute();
  }

  execute() {
    const msPerTick = 1000 / this.tickRate;
    const throttled = this.tickRate >= 0;

    while (
      this.pc < this.fileEnd &&
      !this.shouldHalt &&
      this.stackPointer >= 0
    ) {
      if (
        Atomics.load(this.signals, CHIP8Emulator.STATE_SIGNAL) ===
        EmuState.PAUSED
      ) {
        return;
      }

      let start: number;

      // Throttle the execution of the emulator
      // Note: we need to put it in an if statement since
      // performance.now() is relatively expensive
      if(throttled) start = performance.now();

      this.tick();

      // @ts-expect-error TS is being dumb, start is defined
      while (throttled && performance.now() - start < msPerTick) {
        if (
          Atomics.load(this.signals, CHIP8Emulator.STATE_SIGNAL) ===
          EmuState.PAUSED
        ) {
          return;
        }
      }
    }

    if (this.restartOnEnd) {
      this.pc = 0x200;
      this.execute();
    }
  }

  resume() {
    Atomics.store(this.signals, CHIP8Emulator.STATE_SIGNAL, 0);
    this.start();
  }

  /**
   * Executes the program until the end of the file is reached
   * or if the emulator is halted forcefully.
   */
  tick() {
    const instr = this.getCurrentInstruction();
    this.executeInstruction(instr);
    this.ips++;

    // The timers should be decremented every 60Hz
    if (performance.now() - this.lastTimerDecrement >= this.SIXTY_HZ) {
      this.display.printIfQueued();

      this.numberOfHertzPassed++;

      if(this.numberOfHertzPassed === 60) {
        console.log("IPS: ", this.ips, performance.now());

        this.numberOfHertzPassed = 0;
        this.ips = 0;
      }

      this.lastTimerDecrement = performance.now();
      if (this.delayTimer > 0) {
        this.delayTimer--;
      }

      if (this.soundTimer > 0) {
        this.soundTimer--;
      }
    }
  }

  /**
   * Print the hex dump of the program
   *
   * @param count The number of instructions to print
   */
  programHexDump(count: number = Infinity) {
    let pc = this.pc;
    let hexDump = "";
    for (let i = 0; i < count; i++) {
      const instruction = (this.ram[pc] << 8) | this.ram[pc + 1];
      hexDump += instruction.toString(16).padStart(4, "0") + " ";
      pc += 2;
    }
    console.log(hexDump);
  }

  /**
   * Increment the program counter and return the current instruction
   *
   * @returns The current instruction at the program counter
   */
  getCurrentInstruction() {
    const pc = this.pc;

    // Increment the program counter. We need to increment it by 2
    // since each instruction is 2 bytes
    this.pc += 2;
    return (this.ram[pc] << 8) | this.ram[pc + 1];
  }
}
