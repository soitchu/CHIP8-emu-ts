import { CHIP8Emulator } from "./CHIP-8/index.js";
import { Input } from "./CHIP-8/Input.js";
import { Display } from "./CHIP-8/Display.js";

let currentEmulator: CHIP8Emulator | null = null;
let inputHandler: Input | null = null;
let currentOffscreenCanvas: OffscreenCanvas | null = null;
let currentDisplay: OffscreenDisplay | null = null;

const config = {
  // Throttles the execution rate of the emulator.
  // This isn't actually throttling the emulator, but rather the rate at
  // which the display is updated, which in turn throttles the emulator.
  executionWaitMS: 0,

  // The default scale of the display
  scale: 10,

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
      offscreenCanvas: OffscreenCanvas;
      scale: number;
      program: Uint8Array;
      disableGhosting: boolean;
      inputSharedBuffer: SharedArrayBuffer;
      signalBuffer: SharedArrayBuffer;
    }
  | {
      action: "config";
      config: Partial<typeof config>;
    };

class OffscreenDisplay extends Display {
  ctx: OffscreenCanvasRenderingContext2D;
  scale: number;

  constructor(offscreenCanvas: OffscreenCanvas, scale: number) {
    super();
    this.ctx = offscreenCanvas.getContext("2d")!;
    this.scale = scale;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.scale * 64, this.scale * 32);
  }

  draw(x: number, y: number, r: number, g: number, b: number) {
    this.ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
    this.ctx.fillRect(x * this.scale, y * this.scale, this.scale, this.scale);
  }

  async flush() {
    // Allow the event loop to run
    await new Promise((resolve) => setTimeout(resolve, config.executionWaitMS));
  }
}

addEventListener("message", (event) => {
  const data = event.data as WorkerPayload;

  if (data.action === "init") {
    const {
      offscreenCanvas,
      scale,
      program,
      disableGhosting,
      inputSharedBuffer,
      signalBuffer,
    } = data;

    config.scale = scale;
    config.disableGhosting = disableGhosting;

    if (!currentOffscreenCanvas) {
      currentOffscreenCanvas = offscreenCanvas;
    }

    // Resize the offscreen canvas
    currentOffscreenCanvas.width = 64 * scale;
    currentOffscreenCanvas.height = 32 * scale;

    // Create a new instance of the input handler
    inputHandler = new Input(inputSharedBuffer);

    currentDisplay = new OffscreenDisplay(currentOffscreenCanvas, scale);

    // Create a new instance of the emulator
    currentEmulator = new CHIP8Emulator(program, {
      display: currentDisplay,
      input: inputHandler,
      restartOnEnd: false,
      disableGhosting,
      signalBuffer,
    });

    Atomics.store(currentEmulator.signals, CHIP8Emulator.STATE_SIGNAL, 0);

    // Start the emulator
    currentEmulator.start();
  } else if (data.action === "config") {
    if (!currentEmulator || !currentOffscreenCanvas || !currentDisplay) return;

    // Update the configuration
    Object.assign(config, data.config);

    // Update the emulator with the new configuration
    currentEmulator.applyConfig(config);

    if ("scale" in data.config) {
      // Resize the offscreen canvas
      currentOffscreenCanvas.width = 64 * config.scale;
      currentOffscreenCanvas.height = 32 * config.scale;
      currentDisplay.scale = config.scale;

      currentEmulator.display.print();
    }

    if (data.config.primaryColor || data.config.secondaryColor) {
      console.log(
        "Updating colors",
        data.config.primaryColor,
        data.config.secondaryColor
      );
      currentDisplay.primaryColor =
        data.config.primaryColor || currentDisplay.primaryColor;
      currentDisplay.secondaryColor =
        data.config.secondaryColor || currentDisplay.secondaryColor;
      currentEmulator.display.print();
    }

    if (data.config.program) {
      currentEmulator.init(data.config.program, {});
      currentEmulator.display.print();
    }

    // Letting the OffscreenCanvas do its thing
    // without blocking this thread
    setTimeout(() => {
      // Resume the emulator
      currentEmulator!.resume();
    }, 0);
  }
});
