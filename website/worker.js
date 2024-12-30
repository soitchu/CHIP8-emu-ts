import { Chips8Emulator } from "./js/CHIP-8-emulator.js";
import { Input } from "./js/Input.js";

/** @type {Chips8Emulator} */
let currentEmulator = null;
/** @type {Input} */
let inputHandler = null;
/** @type {OffscreenCanvas} */
let currentOffscreenCanvas = null;

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
    const { offscreenCanvas, scale, program, disableGhosting, inputSharedBuffer } = data;
    const ctx = offscreenCanvas.getContext("2d");

    config.scale = scale;
    config.disableGhosting = disableGhosting;

    currentOffscreenCanvas = offscreenCanvas;

    // Resize the offscreen canvas
    currentOffscreenCanvas.width = 64 * scale;
    currentOffscreenCanvas.height = 32 * scale;

    // Create a new instance of the input handler
    inputHandler = new Input(inputSharedBuffer);
    
    // Create a new instance of the emulator
    currentEmulator = new Chips8Emulator(program, {
      display: {
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
      },
      input: inputHandler,
      restartOnEnd: false,
      disableGhosting,
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
    }
  }
});
