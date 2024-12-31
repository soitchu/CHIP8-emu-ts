// CHIP-8/Display.ts
class Display {
  WIDTH = 64;
  HEIGHT = 32;
  displayState = new Uint8Array(this.WIDTH * this.HEIGHT);
  prevDisplay = new Uint8Array(this.WIDTH * this.HEIGHT);
  powerLevel = new Uint8Array(this.WIDTH * this.HEIGHT);
  disableGhosting = false;
  reset() {
    this.displayState.fill(0);
    this.prevDisplay.fill(0);
    this.powerLevel.fill(0);
  }
  async print() {
    const color1 = [141, 198, 255];
    const color2 = [159, 211, 199];
    this.clear();
    for (let i = 0;i < this.displayState.length; i++) {
      const x = i % this.WIDTH;
      const y = Math.floor(i / this.WIDTH);
      if (this.displayState[i] === 1) {
        this.draw(x, y, color1[0], color1[1], color1[2]);
      } else {
        this.powerLevel[i] = Math.max(0, this.powerLevel[i] / 1.22);
        if (this.prevDisplay[i] === 1) {
          this.powerLevel[i] = 255;
        }
        const newPowerLevel = this.disableGhosting ? 0 : Math.floor(this.powerLevel[i]);
        const normalizedPowerLevel = newPowerLevel / 255;
        this.draw(x, y, color2[0] * normalizedPowerLevel, color2[1] * normalizedPowerLevel, color2[2] * normalizedPowerLevel);
      }
    }
    await this.flush();
  }
}
export {
  Display
};
