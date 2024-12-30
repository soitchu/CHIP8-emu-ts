website: $(shell find CHIP-8/)
	bun build CHIP-8/index.ts --target="browser" > ./website/js/CHIP-8-emulator.js
	bun build CHIP-8/Input.ts --target="browser" > ./website/js/Input.js