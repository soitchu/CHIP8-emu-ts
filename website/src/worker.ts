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
      offscreenCanvas: OffscreenCanvas;
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
  imageData: ImageData;

  constructor(offscreenCanvas: OffscreenCanvas) {
    super();
    this.ctx = offscreenCanvas.getContext("2d")!;
    this.imageData = this.ctx.getImageData(0, 0, 64, 32);
  }

  clear() {
    this.ctx.clearRect(0, 0, 64, 32);
  }

  draw(x: number, y: number, r: number, g: number, b: number) {
    const index = (x + y * 64) * 4;
    this.imageData.data[index] = r;
    this.imageData.data[index + 1] = g;
    this.imageData.data[index + 2] = b;
    this.imageData.data[index + 3] = 255;
  }

  async flush() {

    // const imageData = this.ctx.getImageData(0, 0, 64, 32);

    // for (let i = 0; i < this.displayState.length; i++) {
    //   if (this.displayState[i] === 1) {
    //     imageData.data[i * 4] = this.primaryColor[0];
    //     imageData.data[i * 4 + 1] = this.primaryColor[1];
    //     imageData.data[i * 4 + 2] = this.primaryColor[2];
    //     imageData.data[i * 4 + 3] = 255;
    //   } else {
    //     imageData.data[i * 4] = this.secondaryColor[0];
    //     imageData.data[i * 4 + 1] = this.secondaryColor[1];
    //     imageData.data[i * 4 + 2] = this.secondaryColor[2];
    //     imageData.data[i * 4 + 3] = 255;
    //   }
    // }

    this.ctx.putImageData(this.imageData, 0, 0);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

function applyConfig(emuConfig: Partial<typeof config>, isInit = false) {
  if (!currentEmulator || !currentOffscreenCanvas || !currentDisplay) return;

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

addEventListener("message", (event) => {
  const data = event.data as WorkerPayload;

  console.log("Worker received message", data);

  if (data.action === "init") {
    const {
      offscreenCanvas,
      program,
      inputSharedBuffer,
      signalBuffer,
      config: emuConfig,
    } = data;

    if (!currentOffscreenCanvas) {
      currentOffscreenCanvas = offscreenCanvas;
    }

    // Resize the offscreen canvas
    currentOffscreenCanvas.width = 64;
    currentOffscreenCanvas.height = 32;

    // Create a new instance of the input handler
    inputHandler = new Input(inputSharedBuffer);

    currentDisplay = new OffscreenDisplay(currentOffscreenCanvas);

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
