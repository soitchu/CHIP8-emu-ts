import { CHIP8Emulator, EmuState } from "../CHIP-8/index.js";
import { Input } from "../CHIP-8/Input.js";
import { Display } from "../CHIP-8/Display.js";
import { Mutex } from "../helper.js";

let currentEmulator: CHIP8Emulator | null = null;
let inputHandler: Input | null = null;
let currentDisplay: OffscreenDisplay | null = null;

const config = {
  // Throttles the execution rate of the emulator.
  tickRate: 1000,

  // Disables ghosting by clearing the display before drawing each frame
  disableGhosting: false,

  // Restarts the emulator when it reaches the end of the program
  restartOnEnd: false,

  // The primary color of the display
  primaryColor: [0, 0, 0],

  // The secondary color of the display
  secondaryColor: [255, 255, 255],

  // The binary program to run
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

/**
 * An offscreen display for the emulator
 */
class OffscreenDisplay extends Display {
  imageData: Uint8Array;
  mutex: Mutex;

  constructor(imageData: Uint8Array, displaySignalBuffer: SharedArrayBuffer) {
    super();
    this.imageData = imageData;
    this.mutex = new Mutex(displaySignalBuffer);
  }

  clear() {
    // Lock the mutex to indicate that we're drawing
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
    // Signal that we're done writing to the buffer
    this.mutex.unlock();
  }
}

/**
 * Applies the configuration to the emulator
 * 
 * @param emuConfig The configuration to apply
 * @param isInit Whether it's being called during initialization
 */
async function applyConfig(emuConfig: Partial<typeof config>, isInit = false) {
  if (!currentEmulator || !currentDisplay) return;

  // Update the configuration
  Object.assign(config, emuConfig);

  // Update the emulator with the new configuration
  currentEmulator.applyConfig(config);

  if (emuConfig.primaryColor || emuConfig.secondaryColor) {
    currentDisplay.primaryColor =
      emuConfig.primaryColor || currentDisplay.primaryColor;
    currentDisplay.secondaryColor =
      emuConfig.secondaryColor || currentDisplay.secondaryColor;

    // This config change requires a redraw since it affects what's displayed
    currentEmulator.display.print();
  }

  if (emuConfig.program) {
    currentEmulator.init(emuConfig.program, {});

    // This config change requires a redraw since it affects what's displayed
    currentEmulator.display.print();
  }

  if (!isInit) {
    // If this wasn't called during initialization, resume the emulator
    // since it was paused to apply the configuration by the host
    currentEmulator!.resume();
  }
}

addEventListener("message", async (event) => {
  const data = event.data as WorkerPayload;

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

    // Initialize the state signal to RUNNING
    Atomics.store(currentEmulator.signals, CHIP8Emulator.STATE_SIGNAL, EmuState.RUNNING);

    // Start the emulator
    currentEmulator.start();
  } else if (data.action === "config") {
    await applyConfig(data.config);
  }
});
