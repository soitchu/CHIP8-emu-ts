# CHIP-8 Emulator
The emulator is written in Typescript. It uses two web workers: one for the emulator and one for the display. `SharedArrayBuffer` is used to communicate with the workers and synchronize them. This was done to prevent the emulator from blocking the main thread. It was also necessary to use a web worker for the display since flushing the OffscreenCanvas doesn't work well with the synchronous nature of the emulator.

NOTE: Since `SharedArrayBuffer` is used, the website must be served with the appropriate headers for things to work properly. Refer to [this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer) for more information.

# Demo
https://emu.soitchu.com/

## Repository Structure
The entirety of the emulator source code is located in [src/CHIP-8](src/CHIP-8/). The rest of the code in `src` is used to run the emulator on the web.

## Development
Clone the repository:
```bash
   git clone https://github.com/soitchu/CHIP8-emu-ts --recurse-submodules
```

And To run the emulator locally, run the following commands:
```bash
   npm install
   npm run dev
```


## Hosting
Clone the repository:
```bash
   git clone https://github.com/soitchu/CHIP8-emu-ts --recurse-submodules
```

The website can be built using the following command:
```bash
   npm install
   npm run build
```

Then the contents of the `dist` folder can be hosted on a web server. Make sure to serve the website with the appropriate headers for `SharedArrayBuffer` to work properly. An example how to do this can be found in [server/index.js](server/index.js). The server can be started with the following command:
```bash
   npm run start
```

