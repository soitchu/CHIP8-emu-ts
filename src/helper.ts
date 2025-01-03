// https://v8.dev/features/atomics
/**
 * An implementation of a mutex using Atomics
 */
export class Mutex {
    private buffer: SharedArrayBuffer;
    private lockArray: Int32Array;
    private UNLOCKED: number;
    private LOCKED: number;

  constructor(buffer: SharedArrayBuffer) {
    // Shared buffer with one slot for the lock
    this.buffer = buffer; // 4 bytes for a single Int32
    this.lockArray = new Int32Array(this.buffer);
    this.UNLOCKED = 0;
    this.LOCKED = 1;
  }

  lock() {
    while (
      Atomics.compareExchange(this.lockArray, 0, this.UNLOCKED, this.LOCKED) !==
      this.UNLOCKED
    ) {
      // Wait until the mutex becomes available
      Atomics.wait(this.lockArray, 0, this.LOCKED);
    }
  }

  unlock() {
    // Unlock the mutex and notify all waiting threads
    Atomics.store(this.lockArray, 0, this.UNLOCKED);
    Atomics.notify(this.lockArray, 0);
  }
}

/**
 * Convert a hexadecimal color to an RGB array
 * @param hex The hexadecimal color
 * @returns An array of RGB values
 */
export function hexToRGBA(hex: string) {
  // Remove the '#' if present
  if (hex.startsWith("#")) {
    hex = hex.slice(1);
  }

  // Check the length of the hex code
  if (hex.length !== 6) {
    throw new Error("Invalid hexadecimal color format. Use #RRGGBB.");
  }

  // Parse the RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return [r, g, b];
}