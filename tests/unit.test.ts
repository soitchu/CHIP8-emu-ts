const file = Bun.file("./program.c8");
import { expect, test } from "bun:test";
import { Chips8Emulator, Display, EmuConfig } from "../CHIP-8/emulator/index";
import { Input } from "../CHIP-8/emulator/Input";

const emuConfig = {
  display: {
    clear: () => {},
    draw: () => {},
    flush: () => {},
  } as unknown as Display,
  input: {
    keyDown: () => {},
    keyUp: () => {},
    keyPress: () => {},
    registerEmulator: () => {},
    isActive: () => {
        return true;
    },
  } as unknown as Input,
  restartOnEnd: false,
  debug: true
} as EmuConfig;

const program = new Uint8Array([]);

test("skipIf", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0x3100);

  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("SE V1, 00");

  emu.skipIf(0x3833);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("SE V8, 33");
});

test("skipNotIf", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0x4100);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("SNE V1, 00");

  emu.executeInstruction(0x4833);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("SNE V8, 33");
});

test("compareRegisters", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.registers[1] = 0x20;
  emu.registers[2] = 0x20;
  emu.executeInstruction(0x5120);

  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("SE V1, V2");
});

test("loadRegister", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0x6120);

  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("LD V1, 20");
});

test("add", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0x7155);

  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("ADD V1, 55");
});

test("loadRegisterFromRegister", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0x8120);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("LD V1, V2");

  emu.executeInstruction(0x8680);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("LD V6, V8");
});

test("or", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0x8121);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("OR V1, V2");

  emu.executeInstruction(0x8681);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("OR V6, V8");
});

test("and", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0x8122);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("AND V1, V2");

  emu.executeInstruction(0x8682);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("AND V6, V8");
});

test("xor", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0x8123);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("XOR V1, V2");

  emu.executeInstruction(0x8683);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("XOR V6, V8");
});

test("addRegisters", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0x8124);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("ADD V1, V2");

  emu.executeInstruction(0x8684);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("ADD V6, V8");
});

test("subRegisters", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0x8125);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("SUB V1, V2");

  emu.executeInstruction(0x8685);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("SUB V6, V8");
});

test("shiftRight", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0x8126);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("SHR V1 {, V2}");

  emu.executeInstruction(0x8686);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("SHR V6 {, V8}");
});

test("subRegistersReverse", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0x8127);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("SUBN V1, V2");

  emu.executeInstruction(0x8687);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("SUBN V6, V8");
});

test("shiftLeft", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0x812e);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("SHL V1 {, V2}");

  emu.executeInstruction(0x868e);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("SHL V6 {, V8}");
});

test("skipIfNotEqualRegisters", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0x9120);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("SNE V1, V2");

  emu.executeInstruction(0x9680);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("SNE V6, V8");
});

test("changeI", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0xa120);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("LD I, 120");

  emu.executeInstruction(0xa680);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("LD I, 680");
});

test("jmpByOffsetV0", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0xb120);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("JMP V0, 120");

  emu.executeInstruction(0xb680);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("JMP V0, 680");
});

test("randomAnd", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0xc120);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("RND V1, 20");

  emu.executeInstruction(0xc680);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("RND V6, 80");
});

test("draw", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0xd126);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("DRW V1, V2, 06");

  emu.executeInstruction(0xd68a);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("DRW V6, V8, 0a");
});

test("skipIfKeyPressed", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0xe29e);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("SKP V2");

  emu.executeInstruction(0xea9e);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("SKP V10");
});

test("skipIfKeyPressed", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0xe2a1);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("SKNP V2");

  emu.executeInstruction(0xeaa1);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("SKNP V10");
});

test("readDelayIntoRegister", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0xf207);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("LD V2, DT");

  emu.executeInstruction(0xfa07);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("LD V10, DT");
});

test("readKeyIntoRegister", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  await emu.executeInstruction(0xf20a);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("LD V2, K");

  await emu.executeInstruction(0xfa0a);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("LD V10, K");
});

test("loadRegisterIntoDelayTimer", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0xf215);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("LD DT, V2");

  emu.executeInstruction(0xfa15);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("LD DT, V10");
});

test("loadRegisterIntoSoundTimer", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0xf218);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("LD ST, V2");

  emu.executeInstruction(0xfa18);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("LD ST, V10");
});

test("addRegisterToI", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0xf21e);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("ADD I, V2");

  emu.executeInstruction(0xfa1e);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("ADD I, V10");
});

test("assignIToSpriteMemory", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0xf229);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("LD F, V2");

  emu.executeInstruction(0xfa29);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("LD F, V10");
});

test("storeDigitsAtI", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0xf233);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("LD B, V2");

  emu.executeInstruction(0xfa33);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("LD B, V10");
  ``;
});

test("storeRegistersAtI", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0xf255);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("LD [I], V2");

  emu.executeInstruction(0xfa55);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("LD [I], V10");
  ``;
});

test("loadRegisterFromI", async () => {
  const emu = new Chips8Emulator(program, emuConfig);

  emu.executeInstruction(0xf265);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("LD V2, [I]");

  emu.executeInstruction(0xfa65);
  expect(emu.instrTrace[emu.instrTrace.length - 1]).toEqual("LD V10, [I]");
  ``;
});
