import { Display } from "./CHIP-8/Display";
import { Mutex } from "./helper";

export interface DisplayWorkerPayload {
  offscreenCanvas: OffscreenCanvas;
  mutexBuffer: SharedArrayBuffer;
  frameBuffer: SharedArrayBuffer;
}

let offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;
let mutex: Mutex | null = null;
let frameBuffer: SharedArrayBuffer | null = null;

function draw() {
  const currentImageData = offscreenCtx!.getImageData(0, 0, Display.WIDTH, Display.HEIGHT);
  const sharedImageBuffer = new Uint8ClampedArray(frameBuffer!);

  mutex!.lock();
  currentImageData.data.set(sharedImageBuffer);
  mutex!.unlock();

  offscreenCtx!.putImageData(currentImageData, 0, 0);

  requestAnimationFrame(draw);
}

onmessage = (event) => {
  const data = event.data as DisplayWorkerPayload;

  const offscreenCanvas = data.offscreenCanvas as OffscreenCanvas;

  offscreenCtx = offscreenCanvas.getContext("2d");
  mutex = new Mutex(data.mutexBuffer);
  frameBuffer = data.frameBuffer;

  draw();
};
