// CHIP-8/Input.ts
class Input {
  emu;
  hasBeenRegistered = false;
  keyMap = {
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 12,
    q: 4,
    w: 5,
    e: 6,
    r: 13,
    a: 7,
    s: 8,
    d: 9,
    f: 14,
    z: 10,
    x: 0,
    c: 11,
    v: 15
  };
  activeKeys = new Uint8Array(16);
  isUsingSharedArrayBuffer = false;
  constructor(sharedArrayBuffer) {
    if (sharedArrayBuffer) {
      this.activeKeys = new Uint8Array(sharedArrayBuffer);
      this.isUsingSharedArrayBuffer = true;
      console.info("Using SharedArrayBuffer for input");
    }
  }
  isActive(key) {
    if (this.isUsingSharedArrayBuffer) {
      return Atomics.load(this.activeKeys, key) === 1;
    }
    return this.activeKeys[key] === 1;
  }
  keyDown(event) {
    if (!this.keyMap[event]) {
      return;
    }
    const keyAddress = this.keyMap[event];
    if (this.isUsingSharedArrayBuffer) {
      Atomics.store(this.activeKeys, keyAddress, 1);
    } else {
      this.activeKeys[keyAddress] = 1;
    }
  }
  keyUp(event) {
    if (!this.keyMap[event]) {
      return;
    }
    const keyAddress = this.keyMap[event];
    if (this.isUsingSharedArrayBuffer) {
      Atomics.store(this.activeKeys, keyAddress, 0);
    } else {
      this.activeKeys[keyAddress] = 0;
    }
  }
  registerEmulator(emu) {
    this.hasBeenRegistered = true;
    this.emu = emu;
  }
}
export {
  Input
};
