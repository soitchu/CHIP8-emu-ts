// https://v8.dev/features/atomics
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