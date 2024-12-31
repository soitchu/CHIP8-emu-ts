import { Chips8Emulator } from "./js/CHIP-8-emulator.js";
import { Input } from "./js/Input.js";

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

    currentDisplay = {
      clear: () => {
        const scale = config.scale;

        ctx.clearRect(0, 0, scale * 64, scale * 32);
      },
      draw: (x, y, r, g, b) => {
        const scale = config.scale;

        ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        ctx.fillRect(x * scale, y * scale, scale, scale);
      },
      flush: async () => {
        // Allow the event loop to run
        await new Promise((resolve) => setTimeout(resolve, config.executionWaitMS));
      },
    };
    
    // Create a new instance of the emulator
    currentEmulator = new Chips8Emulator(program, {
      display: currentDisplay,
      input: inputHandler,
      restartOnEnd: false,
      disableGhosting,
      signalBuffer
    });

    // Start the emulator
    currentEmulator.execute();
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
      currentEmulator.printDisplay();

      // Letting the OffscreenCanvas do its thing
      // without blocking this thread
      setTimeout(() => {
        // Resume the emulator
        Atomics.store(currentEmulator.signals, currentEmulator.STATE_SIGNAL, 0);
        currentEmulator.execute();
      }, 0);

    }
  } else if(data.action === "resume") {
    currentEmulator.execute();
  } else if(data.action === "loadProgram") {
    console.log("Loading program");
    currentEmulator.init(data.program, {});
    currentEmulator.printDisplay();

    // Letting the OffscreenCanvas do its thing
    // without blocking this thread
    setTimeout(() => {
      // Resume the emulator
      Atomics.store(currentEmulator.signals, currentEmulator.STATE_SIGNAL, 0);
      currentEmulator.execute();
    }, 0);
  }
});
