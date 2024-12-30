import { Chips8Emulator } from ".";

type InputEvent = "keydown" | "keyup" | "keypress";

export class Input {
  emu: Chips8Emulator;
  hasBeenRegistered: boolean = false;
  keyMap = {
    "1": 0x1,
    "2": 0x2,
    "3": 0x3,
    "4": 0xc,
    q: 0x4,
    w: 0x5,
    e: 0x6,
    r: 0xd,
    a: 0x7,
    s: 0x8,
    d: 0x9,
    f: 0xe,
    z: 0xa,
    x: 0x0,
    c: 0xb,
    v: 0xf,
  };
  activeKeys = new Uint8Array(16);
  isUsingSharedArrayBuffer = false;

  constructor(sharedArrayBuffer?: SharedArrayBuffer) {
    if (sharedArrayBuffer) {
      // Give the user the option to pass in a sharedArrayBuffer
      // which is useful when we don't want to block the thread
      // running the emulator for input events.
      this.activeKeys = new Uint8Array(sharedArrayBuffer);
      this.isUsingSharedArrayBuffer = true;
      console.info("Using SharedArrayBuffer for input");
    }
  }

  isActive(key: number): boolean {
    if(this.isUsingSharedArrayBuffer) {
      return Atomics.load(this.activeKeys, key) === 1;
    }

    return this.activeKeys[key] === 1;
  }

  keyDown(event: string): void {
    if (!this.keyMap[event]) {
      return;
    }

    const keyAddress = this.keyMap[event];
 
    if(this.isUsingSharedArrayBuffer) {
      Atomics.store(this.activeKeys, keyAddress, 1);
    } else {
      this.activeKeys[keyAddress] = 1;
    }
  }

  keyUp(event: string): void {
    if (!this.keyMap[event]) {
      return;
    }

    const keyAddress = this.keyMap[event];

    if(this.isUsingSharedArrayBuffer) {
      Atomics.store(this.activeKeys, keyAddress, 0);
    } else {
      this.activeKeys[keyAddress] = 0;
    }
  }

  registerEmulator(emu: Chips8Emulator) {
    this.hasBeenRegistered = true;
    this.emu = emu;
  }
}
