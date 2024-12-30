website: $(shell find CHIP-8/emulator)
	bun build CHIP-8/emulator/index.ts --target="browser" > ./website/js/CHIP-8-emulator.js
	bun build CHIP-8/emulator/Input.ts --target="browser" > ./website/js/Input.js