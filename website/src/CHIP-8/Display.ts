export abstract class Display {
  /**
   * The display is 64x32 pixels
   */
  static WIDTH = 64;
  static HEIGHT = 32;

  /**
   * The display state is a 1D array of 0s and 1s. 0 indicates off, 1 indicates on.
   */
  displayState: Uint8Array = new Uint8Array(Display.WIDTH * Display.HEIGHT);

  /**
   * XOR'ing sprites can cause flicker, so we will implement a power level system
   * where the brightness of the pixel is reduced over time.
   */
  prevDisplay: Uint8Array = new Uint8Array(Display.WIDTH * Display.HEIGHT);

  powerLevel: Uint8Array = new Uint8Array(Display.WIDTH * Display.HEIGHT);

  /**
   * Ghosting avoids flickers. Enabled by default. Set to false to disable.
   */
  disableGhosting: boolean = false;

  /**
   * The time of the last print operation
   */
  lastDrawTime: number = 0;

  // Default colors
  primaryColor: number[] = [0x8d, 0xc6, 0xff];
  secondaryColor: number[] = [0x0, 0x0, 0x0];

  queuePrint: boolean = false;

  abstract draw(x: number, y: number, r: number, g: number, b: number): void;
  abstract clear(): void;
  abstract flush(): void;

  reset(): void {
    this.displayState.fill(0);
    this.prevDisplay.fill(0);
    this.powerLevel.fill(0);
  }

  printIfQueued(): void {
    if (this.queuePrint) {
      this.print();
    }
  }

  print(): void {
    if (performance.now() - this.lastDrawTime < 1000 / 60) {
      this.queuePrint = true;
      return;
    }

    this.queuePrint = false;
    this.lastDrawTime = performance.now();

    const primaryColor = this.primaryColor;
    const secondaryColor = this.secondaryColor;

    this.clear();

    let hadGhostPixels = false;

    for (let i = 0; i < this.displayState.length; i++) {
      const x = i % Display.WIDTH;
      const y = ~~(i / Display.WIDTH);
      if (this.displayState[i] === 1) {
        // The pixel is on, so set the power level to max
        this.draw(x, y, primaryColor[0], primaryColor[1], primaryColor[2]);
      } else {
        // The pixel is off, so decrease the power level (brightness) of the pixel
        this.powerLevel[i] = Math.max(0, this.powerLevel[i] / 1.8);

        // If the pixel was previously on, set the power level to max, i.e. max brightness
        if (this.prevDisplay[i] === 1) {
          this.powerLevel[i] = 255;
        }

        const newPowerLevel = this.disableGhosting ? 0 : ~~this.powerLevel[i];

        // Normalize the power level to be between 0 and 1, so it can
        // be multiplied by the color values
        const normalizedPowerLevel = newPowerLevel / 255;

        if(normalizedPowerLevel > 0) {
          hadGhostPixels = true;
        }

        this.draw(
          x,
          y,
          primaryColor[0] * normalizedPowerLevel +
            secondaryColor[0] * (1 - normalizedPowerLevel),
          primaryColor[1] * normalizedPowerLevel +
            secondaryColor[1] * (1 - normalizedPowerLevel),
          primaryColor[2] * normalizedPowerLevel +
            secondaryColor[2] * (1 - normalizedPowerLevel)
        );
      }
    }

    if(hadGhostPixels) {
      this.queuePrint = true;
    } 

    // Flush the display to the screen
    this.flush();
    this.prevDisplay = this.displayState.slice();
  }
}
