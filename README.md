# CHIP-8 Emulator
The emulator is written in Typescript. It uses two web workers: one for the emulator and one for the display. `SharedArrayBuffer` is used to communicate with the workers and synchronize them. This was done to prevent the emulator from blocking the main thread. It was also necessary to use a web worker for the display since flushing the OffscreenCanvas doesn't work well with the synchronous nature of the emulator.

## Repository Structure
The entirety of the emulator source code is located in [src/CHIP-8](src/CHIP-8/). The rest of the code in `src` is used to run the emulator on the web.




