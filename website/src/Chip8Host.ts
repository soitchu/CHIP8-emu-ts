import { CHIP8Emulator, EmuState } from "./CHIP-8";
import { Display } from "./CHIP-8/Display";
import { Input } from "./CHIP-8/Input";
import { type WorkerPayload } from "./worker";
import Chip8Worker from "./worker?worker";
import displayWorker from "./displayWorker?worker";
import { hexToRGBA } from "./helper";

export class CHIP8Host {
  signalBuffer = new SharedArrayBuffer(1 * Uint32Array.BYTES_PER_ELEMENT);
  signalArray = new Uint32Array(this.signalBuffer);

  inputSharedBuffer = new SharedArrayBuffer(16 * Uint8Array.BYTES_PER_ELEMENT);
  inputArray = new Uint8Array(this.inputSharedBuffer);

  frameBuffer = new SharedArrayBuffer(
    Display.WIDTH * Display.HEIGHT * 4 * Uint8Array.BYTES_PER_ELEMENT
  );

  displaySignalBuffer = new SharedArrayBuffer(
    1 * Uint32Array.BYTES_PER_ELEMENT
  );

  emuWorker = new Chip8Worker();
  displayWorker = new displayWorker();

  config = {
    primaryColor: [0, 0, 0],
    secondaryColor: [255, 255, 255],
    disableGhosting: false,
    tickRate: 1000,
    theme: "",
  };

  offscreenHasBeenTransferred = false;

  constructor(offscreenCanvas: OffscreenCanvas) {
    this.displayWorker.postMessage(
      {
        mutexBuffer: this.displaySignalBuffer,
        offscreenCanvas,
        frameBuffer: this.frameBuffer,
      },
      [offscreenCanvas]
    );

    window.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase() as keyof typeof Input.KEY_MAP;

      if (!(key in Input.KEY_MAP)) return;
      Atomics.store(this.inputArray, Input.KEY_MAP[key], 1);
    });

    window.addEventListener("keyup", (e) => {
      const key = e.key.toLowerCase() as keyof typeof Input.KEY_MAP;

      if (!(key in Input.KEY_MAP)) return;

      Atomics.store(this.inputArray, Input.KEY_MAP[key], 0);
    });

    this.loadConfig();
  }

  loadConfig() {
    const config = this.config;
    
    const primaryColor = localStorage.getItem("primaryColor");
    const secondaryColor = localStorage.getItem("secondaryColor");
    const disableGhosting = localStorage.getItem("disableGhosting");
    const tickRate = localStorage.getItem("tickRate");
    const theme = localStorage.getItem("theme");
  
    try {
      if (primaryColor) config.primaryColor = JSON.parse(primaryColor);
    } catch {}
  
    try {
      if (secondaryColor) config.secondaryColor = JSON.parse(secondaryColor);
    } catch {}
  
    try {
      if (theme === "theme-custom") {
        const primaryColor = localStorage.getItem("custom-primaryColor");
        config.primaryColor = hexToRGBA(primaryColor as string);
      }
    } catch {}
  
    try {
      if (theme === "theme-custom") {
        const secondaryColor = localStorage.getItem("custom-secondaryColor");
        config.secondaryColor = hexToRGBA(secondaryColor as string);
      }
    } catch {}
  
    try {
      if (disableGhosting) config.disableGhosting = JSON.parse(disableGhosting);
    } catch {}
  
    try {
      if (tickRate && JSON.parse(tickRate))
        config.tickRate = JSON.parse(tickRate);
    } catch {}
  
    try {
      if (theme) config.theme = theme;
    } catch {}
  }

  pause() {
    Atomics.store(
      this.signalArray,
      CHIP8Emulator.STATE_SIGNAL,
      EmuState.PAUSED
    );
  }

  postMessage(data: WorkerPayload, transfer: Transferable[] = []) {
    // Pause the emulator if the message is a configuration change
    // The worker will handle the configuration change and resume the emulator
    if (data.action === "config") {
      this.pause();

      const config = data.config;

      if (config.primaryColor) {
        localStorage.setItem(
          "primaryColor",
          JSON.stringify(config.primaryColor)
        );
      }

      if (config.secondaryColor) {
        localStorage.setItem(
          "secondaryColor",
          JSON.stringify(config.secondaryColor)
        );
      }

      if ("disableGhosting" in config) {
        localStorage.setItem(
          "disableGhosting",
          JSON.stringify(config.disableGhosting)
        );
      }

      if ("tickRate" in config) {
        localStorage.setItem("tickRate", JSON.stringify(config.tickRate));
      }
    }

    this.emuWorker.postMessage(data, transfer);
  }

  async loadProgram(program: Uint8Array) {
    this.inputArray.fill(0);

    // Initialize the worker with the offscreen canvas
    if (!this.offscreenHasBeenTransferred) {
      this.postMessage({
        action: "init",
        program,
        inputSharedBuffer: this.inputSharedBuffer,
        signalBuffer: this.signalBuffer,
        frameBuffer: this.frameBuffer,
        displaySignalBuffer: this.displaySignalBuffer,
        config: this.config,
      } as WorkerPayload);
      this.offscreenHasBeenTransferred = true;
    } else {
      this.postMessage({
        action: "config",
        config: {
          program,
        },
      });
    }
  }
}
