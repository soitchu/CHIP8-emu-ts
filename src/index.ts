import { CHIP8Host } from "./Chip8Host";
import { Display } from "./CHIP-8/Display";
import { EmuMenu } from "./Menu";

const menuCon = document.getElementById("menuCon")!;
const menuIcon = document.getElementById("menuIcon")!;
const display = document.getElementById("display")! as HTMLCanvasElement;
const container = document.getElementById("container")!;

const host = new CHIP8Host(display.transferControlToOffscreen());
new EmuMenu(container, menuCon, menuIcon, display, host);