import { CHIP8Emulator, EmuState } from "./CHIP-8";
import { Display } from "./CHIP-8/Display";
import { Input } from "./CHIP-8/Input";
import { type WorkerPayload } from "./workers/emuWorker";
import Chip8Worker from "./workers/emuWorker?worker";
import displayWorker from "./workers/displayWorker?worker";
import { hexToRGBA } from "./helper";

export class CHIP8Host {
  // Used to signal the worker to pause the emulator
  pauseSignalBuffer = new SharedArrayBuffer(1 * Uint32Array.BYTES_PER_ELEMENT);
  pauseSignalArray = new Uint32Array(this.pauseSignalBuffer);

  // Shared buffer for input, so we don't have to send messages for every key press
  inputSharedBuffer = new SharedArrayBuffer(16 * Uint8Array.BYTES_PER_ELEMENT);
  inputArray = new Uint8Array(this.inputSharedBuffer);

  // Shared buffer for the frame buffer
  frameBuffer = new SharedArrayBuffer(
    Display.WIDTH * Display.HEIGHT * 4 * Uint8Array.BYTES_PER_ELEMENT
  );

  // Mutex buffer to synchronize the display worker and the emulator worker
  mutexBuffer = new SharedArrayBuffer(1 * Uint32Array.BYTES_PER_ELEMENT);

  // Initialize the workers
  emuWorker = new Chip8Worker();
  displayWorker = new displayWorker();

  config = {
    primaryColor: [0, 0, 0],
    secondaryColor: [255, 255, 255],
    disableGhosting: false,
    tickRate: 1000,
    theme: "",
  };

  // Whether the offscreen canvas has been transferred to the display worker
  offscreenHasBeenTransferred = false;

  constructor(offscreenCanvas: OffscreenCanvas) {
    // Initialize the display worker
    this.displayWorker.postMessage(
      {
        mutexBuffer: this.mutexBuffer,
        offscreenCanvas,
        frameBuffer: this.frameBuffer,
      },
      [offscreenCanvas]
    );

    // Initialize the input listeners
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

    // Load the configuration from local storage
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

  /**
   * Pause the emulator worker by setting the state signal to PAUSED
   * The emulator worker will read this shared array and pause the emulator
   * The emulator is resumed by the worker after a "config" message is received
   */
  pause() {
    Atomics.store(
      this.pauseSignalArray,
      CHIP8Emulator.STATE_SIGNAL,
      EmuState.PAUSED
    );
  }

  /**
   * Post a message to the emulator worker
   */
  postMessage(data: WorkerPayload, transfer: Transferable[] = []) {
    if (data.action === "config") {
      // Pause the emulator if the message is a configuration change
      this.pause();

      // Save the configuration to local storage
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

    // Post the message to the worker
    this.emuWorker.postMessage(data, transfer);
  }

  async loadProgram(program: Uint8Array) {
    // Reset the input buffer
    this.inputArray.fill(0);

    if (!this.offscreenHasBeenTransferred) {
      // Initialize the worker with the offscreen canvas
      this.postMessage({
        action: "init",
        program,
        inputSharedBuffer: this.inputSharedBuffer,
        signalBuffer: this.pauseSignalBuffer,
        frameBuffer: this.frameBuffer,
        displaySignalBuffer: this.mutexBuffer,
        config: this.config,
      } as WorkerPayload);

      // Set the offscreen canvas as transferred
      this.offscreenHasBeenTransferred = true;
    } else {
      // Since the worker has already been initialized, we can just send the program
      this.postMessage({
        action: "config",
        config: {
          program,
        },
      });
    }
  }
}
