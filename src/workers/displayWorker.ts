import { Display } from "../CHIP-8/Display";
import { Mutex } from "../helper";

export interface DisplayWorkerPayload {
  offscreenCanvas: OffscreenCanvas;
  mutexBuffer: SharedArrayBuffer;
  frameBuffer: SharedArrayBuffer;
}

// The offscreen canvas context
let offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;
// The mutex to synchronize the display worker and the emulator worker
let mutex: Mutex | null = null;
// The frameBuffer to draw
let frameBuffer: SharedArrayBuffer | null = null;

function draw() {
  const currentImageData = offscreenCtx!.getImageData(0, 0, Display.WIDTH, Display.HEIGHT);
  const sharedImageBuffer = new Uint8ClampedArray(frameBuffer!);

  // Lock the mutex before copying the frame buffer to make sure
  // the emulator worker isn't writing to it at the same time
  mutex!.lock();
  // Copy the frame buffer to the current image data
  currentImageData.data.set(sharedImageBuffer);
  // Unlock the mutex so the emulator worker can write to the frame buffer
  mutex!.unlock();

  // Draw the image data
  offscreenCtx!.putImageData(currentImageData, 0, 0);


  // Wait for the next frame to draw
  requestAnimationFrame(draw);
}

onmessage = (event) => {
  const data = event.data as DisplayWorkerPayload;

  const offscreenCanvas = data.offscreenCanvas as OffscreenCanvas;

  // Initialize the variables
  offscreenCtx = offscreenCanvas.getContext("2d");
  mutex = new Mutex(data.mutexBuffer);
  frameBuffer = data.frameBuffer;

  // Start the draw loop
  draw();
};
