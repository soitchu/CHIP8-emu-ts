import { Chips8Emulator } from "./js/CHIP-8-emulator.js";
import { Input } from "./js/Input.js";
import { Display } from "./js/Display.js";

/** @type {import("../CHIP-8/index.js").Chips8Emulator} */
let currentEmulator = null;
/** @type {import("../CHIP-8/Input.js").Input}*/
let inputHandler = null;
/** @type {OffscreenCanvas} */
let currentOffscreenCanvas = null;
/** @type {import("../CHIP-8/index.js").Display} */
let currentDisplay = null;

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
};

class OffscreenDisplay extends Display {
  constructor(offscreenCanvas, scale) {
    super();
    this.ctx = offscreenCanvas.getContext("2d");
    this.scale = scale;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.scale * 64, this.scale * 32);
  }

  draw(x, y, r, g, b) {
    this.ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
    this.ctx.fillRect(x * this.scale, y * this.scale, this.scale, this.scale);
  }

  flush() {
    // Allow the event loop to run
    return new Promise((resolve) => setTimeout(resolve, config.executionWaitMS));
  }
}


addEventListener("message", (event) => {
  const data = event.data;

  if (data.action === "init") {
    /** @type {OffscreenCanvas} */
    const { offscreenCanvas, scale, program, disableGhosting, inputSharedBuffer, signalBuffer } = data;

    config.scale = scale;
    config.disableGhosting = disableGhosting;

    if(offscreenCanvas){
      currentOffscreenCanvas = offscreenCanvas;
    }

    const ctx = currentOffscreenCanvas.getContext("2d");

    // Resize the offscreen canvas
    currentOffscreenCanvas.width = 64 * scale;
    currentOffscreenCanvas.height = 32 * scale;

    // Create a new instance of the input handler
    inputHandler = new Input(inputSharedBuffer);

    currentDisplay = new OffscreenDisplay(currentOffscreenCanvas, scale);
    
    // Create a new instance of the emulator
    currentEmulator = new Chips8Emulator(program, {
      display: currentDisplay,
      input: inputHandler,
      restartOnEnd: false,
      disableGhosting,
      signalBuffer
    });

    Atomics.store(currentEmulator.signals, currentEmulator.STATE_SIGNAL, 0);

    // Start the emulator
    currentEmulator.start();
  } else if (data.action === "config") {
    if(currentEmulator === null) return;

    // Update the configuration
    Object.assign(config, data.config);

    // Update the emulator with the new configuration
    currentEmulator.applyConfig(config);

    if("scale" in data.config) {
      // Resize the offscreen canvas
      currentOffscreenCanvas.width = 64 * config.scale;
      currentOffscreenCanvas.height = 32 * config.scale;
      currentDisplay.scale = config.scale;

      currentEmulator.display.print();

      // Letting the OffscreenCanvas do its thing
      // without blocking this thread
      setTimeout(() => {
        // Resume the emulator
        currentEmulator.resume();
      }, 0);

    }
  } else if(data.action === "loadProgram") {
    console.log("Loading program");
    currentEmulator.init(data.program, {});
    currentEmulator.display.print();

    // Letting the OffscreenCanvas do its thing
    // without blocking this thread
    setTimeout(() => {
      // Resume the emulator
      currentEmulator.resume();
    }, 0);
  } else if(data.action === "color") {
    if(!currentDisplay) return;

    if("primary" in data) {
      currentDisplay.primaryColor = data.primary;
    }

    if("secondary" in data) {
      currentDisplay.secondaryColor = data.secondary;
    }
    currentEmulator.display.print();

    console.log("Colors updated", currentDisplay.primaryColor, currentDisplay.secondaryColor);
    setTimeout(async () => {
      // Resume the emulator
      currentEmulator.resume();
    }, 0);

  }
});
