import { CHIP8Emulator } from "../CHIP-8/index.js";
import { Input } from "../CHIP-8/Input.js";
import { Display } from "../CHIP-8/Display.js";
import { Mutex } from "../helper.js";

export enum DisplaySignal {
  IS_COPYING = 0,
  IS_DRAWING = 1,
  IDLE = 2,
}

let currentEmulator: CHIP8Emulator | null = null;
let inputHandler: Input | null = null;
let currentDisplay: OffscreenDisplay | null = null;

const config = {
  // Throttles the execution rate of the emulator.
  // This isn't actually throttling the emulator, but rather the rate at
  // which the display is updated, which in turn throttles the emulator.
  tickRate: 1000,

  // Disables ghosting by clearing the display before drawing each frame
  disableGhosting: false,

  // Restarts the emulator when it reaches the end of the program
  restartOnEnd: false,

  // The primary color of the display
  primaryColor: [0, 0, 0],

  // The secondary color of the display
  secondaryColor: [255, 255, 255],

  program: new Uint8Array(0),
};

export type WorkerPayload =
  | {
      action: "init";
      program: Uint8Array;
      inputSharedBuffer: SharedArrayBuffer;
      frameBuffer: SharedArrayBuffer;
      signalBuffer: SharedArrayBuffer;
      displaySignalBuffer: SharedArrayBuffer;
      config: Partial<typeof config>;
    }
  | {
      action: "config";
      config: Partial<typeof config>;
    };

class OffscreenDisplay extends Display {
  imageData: Uint8Array;
  mutex: Mutex;

  constructor(imageData: Uint8Array, displaySignalBuffer: SharedArrayBuffer) {
    super();
    this.imageData = imageData;
    this.mutex = new Mutex(displaySignalBuffer);
  }

  clear() {
    this.mutex.lock();
    this.imageData.fill(0);
  }

  draw(x: number, y: number, r: number, g: number, b: number) {
    const index = (x + y * 64) * 4;

    this.imageData[index] = r;
    this.imageData[index + 1] = g;
    this.imageData[index + 2] = b;
    this.imageData[index + 3] = 255;
  }

  flush() {
    this.mutex.unlock();
  }
}

async function applyConfig(emuConfig: Partial<typeof config>, isInit = false) {
  if (!currentEmulator || !currentDisplay) return;

  // Update the configuration
  Object.assign(config, emuConfig);

  // Update the emulator with the new configuration
  currentEmulator.applyConfig(config);

  if (emuConfig.primaryColor || emuConfig.secondaryColor) {
    console.log(
      "Updating colors",
      emuConfig.primaryColor,
      emuConfig.secondaryColor
    );
    currentDisplay.primaryColor =
      emuConfig.primaryColor || currentDisplay.primaryColor;
    currentDisplay.secondaryColor =
      emuConfig.secondaryColor || currentDisplay.secondaryColor;

    currentEmulator.display.print();
  }

  if (emuConfig.program) {
    currentEmulator.init(emuConfig.program, {});
    currentEmulator.display.print();
  }

  if (!isInit) {
    // Letting the OffscreenCanvas do its thing
    // without blocking this thread
    setTimeout(() => {
      // Resume the emulator
      currentEmulator!.resume();
    }, 0);
  }
}

addEventListener("message", async (event) => {
  const data = event.data as WorkerPayload;

  console.log("Worker received message", data);

  if (data.action === "init") {
    const {
      program,
      inputSharedBuffer,
      displaySignalBuffer,
      signalBuffer,
      config: emuConfig,
    } = data;

    // Create a new instance of the input handler
    inputHandler = new Input(inputSharedBuffer);

    currentDisplay = new OffscreenDisplay(
      new Uint8Array(data.frameBuffer),
      displaySignalBuffer
    );

    // Create a new instance of the emulator
    currentEmulator = new CHIP8Emulator(program, {
      display: currentDisplay,
      input: inputHandler,
      restartOnEnd: false,
      disableGhosting: false,
      signalBuffer,
    });

    await applyConfig(emuConfig, true);

    Atomics.store(currentEmulator.signals, CHIP8Emulator.STATE_SIGNAL, 0);

    // Start the emulator
    currentEmulator.start();
  } else if (data.action === "config") {
    await applyConfig(data.config);
  }
});
