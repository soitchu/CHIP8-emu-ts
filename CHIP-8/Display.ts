export abstract class Display {

  /**
   * The display is 64x32 pixels
   */
  WIDTH = 64;
  HEIGHT = 32;

  /**
   * The display state is a 1D array of 0s and 1s. 0 indicates off, 1 indicates on.
   */
  displayState: Uint8Array = new Uint8Array(
    this.WIDTH * this.HEIGHT
  );

  /**
   * XOR'ing sprites can cause flicker, so we will implement a power level system
   * where the brightness of the pixel is reduced over time.
   */
  prevDisplay: Uint8Array = new Uint8Array(
    this.WIDTH * this.HEIGHT
  );

  powerLevel: Uint8Array = new Uint8Array(
    this.WIDTH * this.HEIGHT
  );

  disableGhosting: boolean = false;

  abstract draw(x: number, y: number, r: number, g: number, b: number): void;
  abstract clear(): void;
  abstract flush(): Promise<void>;

  reset(): void {
    this.displayState.fill(0);
    this.prevDisplay.fill(0);
    this.powerLevel.fill(0);
  }

  async print(): Promise<void> {
    const color1 = [0x8d, 0xc6, 0xff];
    const color2 = [0x9f, 0xd3, 0xc7];

    this.clear();

    for (let i = 0; i < this.displayState.length; i++) {
      const x = i % this.WIDTH;
      const y = Math.floor(i / this.WIDTH);
      if (this.displayState[i] === 1) {
        // The pixel is on, so set the power level to max
        this.draw(x, y, color1[0], color1[1], color1[2]);
      } else {
        // The pixel is off, so decrease the power level (brightness) of the pixel
        this.powerLevel[i] = Math.max(0, this.powerLevel[i] / 1.22);

        // If the pixel was previously on, set the power level to max, i.e. max brightness
        if (this.prevDisplay[i] === 1) {
          this.powerLevel[i] = 255;
        }

        const newPowerLevel = this.disableGhosting
          ? 0
          : Math.floor(this.powerLevel[i]);

        // Normalize the power level to be between 0 and 1, so it can
        // be multiplied by the color values
        const normalizedPowerLevel = newPowerLevel / 255;

        this.draw(
          x,
          y,
          color2[0] * normalizedPowerLevel,
          color2[1] * normalizedPowerLevel,
          color2[2] * normalizedPowerLevel
        );
      }
    }

    // Flush the display to the screen
    await this.flush();
  }
}
