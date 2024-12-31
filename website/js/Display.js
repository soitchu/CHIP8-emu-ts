// CHIP-8/Display.ts
class Display {
  WIDTH = 64;
  HEIGHT = 32;
  displayState = new Uint8Array(this.WIDTH * this.HEIGHT);
  prevDisplay = new Uint8Array(this.WIDTH * this.HEIGHT);
  powerLevel = new Uint8Array(this.WIDTH * this.HEIGHT);
  disableGhosting = false;
  primaryColor = [141, 198, 255];
  secondaryColor = [0, 0, 0];
  reset() {
    this.displayState.fill(0);
    this.prevDisplay.fill(0);
    this.powerLevel.fill(0);
  }
  async print() {
    const primaryColor = this.primaryColor;
    const secondaryColor = this.secondaryColor;
    this.clear();
    for (let i = 0;i < this.displayState.length; i++) {
      const x = i % this.WIDTH;
      const y = Math.floor(i / this.WIDTH);
      if (this.displayState[i] === 1) {
        this.draw(x, y, primaryColor[0], primaryColor[1], primaryColor[2]);
      } else {
        this.powerLevel[i] = Math.max(0, this.powerLevel[i] / 1.22);
        if (this.prevDisplay[i] === 1) {
          this.powerLevel[i] = 255;
        }
        const newPowerLevel = this.disableGhosting ? 0 : Math.floor(this.powerLevel[i]);
        const normalizedPowerLevel = newPowerLevel / 255;
        this.draw(x, y, primaryColor[0] * normalizedPowerLevel + secondaryColor[0] * (1 - normalizedPowerLevel), primaryColor[1] * normalizedPowerLevel + secondaryColor[1] * (1 - normalizedPowerLevel), primaryColor[2] * normalizedPowerLevel + secondaryColor[2] * (1 - normalizedPowerLevel));
      }
    }
    await this.flush();
  }
}
export {
  Display
};
