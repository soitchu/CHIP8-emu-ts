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
      inputSharedBuffer: SharedArrayBuffer;
      signalBuffer: SharedArrayBuffer;
      config: Partial<typeof config>;
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

function applyConfig(emuConfig: Partial<typeof config>, isInit = false) {
  if (!currentEmulator || !currentOffscreenCanvas || !currentDisplay) return;

  // Update the configuration
  Object.assign(config, emuConfig);

  // Update the emulator with the new configuration
  currentEmulator.applyConfig(config);

  if ("scale" in emuConfig) {
    // Resize the offscreen canvas
    currentOffscreenCanvas.width = 64 * config.scale;
    currentOffscreenCanvas.height = 32 * config.scale;
    currentDisplay.scale = config.scale;

    currentEmulator.display.print();
  }

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

addEventListener("message", (event) => {
  const data = event.data as WorkerPayload;

  console.log("Worker received message", data);

  if (data.action === "init") {
    const {
      offscreenCanvas,
      scale,
      program,
      inputSharedBuffer,
      signalBuffer,
      config: emuConfig,
    } = data;

    config.scale = scale;

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
      disableGhosting: false,
      signalBuffer,
    });

    applyConfig(emuConfig, true);

    Atomics.store(currentEmulator.signals, CHIP8Emulator.STATE_SIGNAL, 0);

    // Start the emulator
    currentEmulator.start();
  } else if (data.action === "config") {
    applyConfig(data.config);
  }
});
