import Chip8Worker from "./worker?worker";
import { CHIP8Emulator, EmuState } from "./CHIP-8";

import type { WorkerPayload } from "./worker";
import { Input } from "./CHIP-8/Input";

const container = document.getElementById("container")!;
const menuCon = document.getElementById("menuCon")!;
const menuIcon = document.getElementById("menuIcon")!;
const display = document.getElementById("display")! as HTMLCanvasElement;

let isMenuOpen = true;

const config = {
  primaryColor: [0, 0, 0],
  secondaryColor: [255, 255, 255],
  disableGhosting: false,
  tickRate: 1000,
  theme: "",
};

menuIcon.addEventListener("click", (e) => {
  menuCon.style.transform = "translateX(0)";
  menuIcon.style.right = "-60px";
  isMenuOpen = true;
  changeScale(calculateCanvasScale());
});

const programs = {
  demos: [
    "Maze (alt) [David Winter, 199x].ch8",
    "Sierpinski [Sergey Naydenov, 2010].ch8",
    "Trip8 Demo (2008) [Revival Studios].ch8",
    "Maze [David Winter, 199x].ch8",
    "Sirpinski [Sergey Naydenov, 2010].ch8",
    "Zero Demo [zeroZshadow, 2007].ch8",
    "Particle Demo [zeroZshadow, 2008].ch8",
    "Stars [Sergey Naydenov, 2010].ch8",
  ],
  games: [
    "15 Puzzle [Roger Ivie] (alt).ch8",
    "15 Puzzle [Roger Ivie].ch8",
    "Addition Problems [Paul C. Moews].ch8",
    "Airplane.ch8",
    "Animal Race [Brian Astle].ch8",
    "Astro Dodge [Revival Studios, 2008].ch8",
    "Biorhythm [Jef Winsor].ch8",
    "Blinky [Hans Christian Egeberg, 1991].ch8",
    "Blinky [Hans Christian Egeberg] (alt).ch8",
    "Blitz [David Winter].ch8",
    "Bowling [Gooitzen van der Wal].ch8",
    "Breakout (Brix hack) [David Winter, 1997].ch8",
    "Breakout [Carmelo Cortez, 1979].ch8",
    "Brick (Brix hack, 1990).ch8",
    "Brix [Andreas Gustafsson, 1990].ch8",
    "Cave.ch8",
    "Coin Flipping [Carmelo Cortez, 1978].ch8",
    "Connect 4 [David Winter].ch8",
    "Craps [Camerlo Cortez, 1978].ch8",
    "Deflection [John Fort].ch8",
    "Figures.ch8",
    "Filter.ch8",
    "Guess [David Winter] (alt).ch8",
    "Guess [David Winter].ch8",
    "Hidden [David Winter, 1996].ch8",
    "Hi-Lo [Jef Winsor, 1978].ch8",
    "Kaleidoscope [Joseph Weisbecker, 1978].ch8",
    "Landing.ch8",
    "Lunar Lander (Udo Pernisz, 1979).ch8",
    "Mastermind FourRow (Robert Lindley, 1978).ch8",
    "Merlin [David Winter].ch8",
    "Missile [David Winter].ch8",
    "Most Dangerous Game [Peter Maruhnic].ch8",
    "Nim [Carmelo Cortez, 1978].ch8",
    "Paddles.ch8",
    "Pong (1 player).ch8",
    "Pong 2 (Pong hack) [David Winter, 1997].ch8",
    "Pong (alt).ch8",
    "Pong [Paul Vervalin, 1990].ch8",
    "Programmable Spacefighters [Jef Winsor].ch8",
    "Puzzle.ch8",
    "Reversi [Philip Baltzer].ch8",
    "Rocket [Joseph Weisbecker, 1978].ch8",
    "Rocket Launcher.ch8",
    "Rocket Launch [Jonas Lindstedt].ch8",
    "Rush Hour [Hap, 2006] (alt).ch8",
    "Rush Hour [Hap, 2006].ch8",
    "Russian Roulette [Carmelo Cortez, 1978].ch8",
    "Sequence Shoot [Joyce Weisbecker].ch8",
    "Shooting Stars [Philip Baltzer, 1978].ch8",
    "Slide [Joyce Weisbecker].ch8",
    "Soccer.ch8",
    "Space Flight.ch8",
    "Space Intercept [Joseph Weisbecker, 1978].ch8",
    "Space Invaders [David Winter] (alt).ch8",
    "Space Invaders [David Winter].ch8",
    "Spooky Spot [Joseph Weisbecker, 1978].ch8",
    "Squash [David Winter].ch8",
    "Submarine [Carmelo Cortez, 1978].ch8",
    "Sum Fun [Joyce Weisbecker].ch8",
    "Syzygy [Roy Trevino, 1990].ch8",
    "Tank.ch8",
    "Tapeworm [JDR, 1999].ch8",
    "Tetris [Fran Dachille, 1991].ch8",
    "Tic-Tac-Toe [David Winter].ch8",
    "Timebomb.ch8",
    "Tron.ch8",
    "UFO [Lutz V, 1992].ch8",
    "Vers [JMN, 1991].ch8",
    "Vertical Brix [Paul Robson, 1996].ch8",
    "Wall [David Winter].ch8",
    "Wipe Off [Joseph Weisbecker].ch8",
    "Worm V4 [RB-Revival Studios, 2007].ch8",
    "X-Mirror.ch8",
    "ZeroPong [zeroZshadow, 2007].ch8",
  ],
  programs: [
    "BMP Viewer - Hello (C8 example) [Hap, 2005].ch8",
    "Chip8 emulator Logo [Garstyciuks].ch8",
    "Chip8 Picture.ch8",
    "Clock Program [Bill Fisher, 1981].ch8",
    "Delay Timer Test [Matthew Mikolay, 2010].ch8",
    "Division Test [Sergey Naydenov, 2010].ch8",
    "Fishie [Hap, 2005].ch8",
    "Framed MK1 [GV Samways, 1980].ch8",
    "Framed MK2 [GV Samways, 1980].ch8",
    "IBM Logo.ch8",
    "Jumping X and O [Harry Kleinberg, 1977].ch8",
    "Keypad Test [Hap, 2006].ch8",
    "Life [GV Samways, 1980].ch8",
    "Minimal game [Revival Studios, 2007].ch8",
    "Random Number Test [Matthew Mikolay, 2010].ch8",
    "SQRT Test [Sergey Naydenov, 2010].ch8",
  ],
};

let scale = calculateCanvasScale();
changeScale(scale);

const inputSharedBuffer = new SharedArrayBuffer(
  16 * Uint8Array.BYTES_PER_ELEMENT
);
const signalBuffer = new SharedArrayBuffer(1 * Uint32Array.BYTES_PER_ELEMENT);
const signalArray = new Uint8Array(signalBuffer);
const inputArray = new Uint8Array(inputSharedBuffer);
const offscreen = display.transferControlToOffscreen();
let worker = new Chip8Worker() as Worker;
let offscreenHasBeenTransferred = false;

async function fetchProgram(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Load a program by fetching it from the GitHub repository
 * @param {"demos" | "games" | "programs"} type
 * @param {string} name
 */
async function loadProgram(type, name) {
  const programURL = encodeURI(
    `https://raw.githubusercontent.com/dmatlack/chip8/refs/heads/master/roms/${type}/${name}`
  );

  inputArray.fill(0);

  const program = await fetchProgram(programURL);
  // const program = new Uint8Array([
  //   107, 4, 98, 0, 36, 138, 76, 0, 18, 94, 108, 0, 0, 224, 167, 220, 96, 0, 97,
  //   0, 209, 7, 113, 8, 49, 64, 18, 20, 0, 0, 241, 101, 98, 2, 99, 1, 36, 93,
  //   129, 176, 128, 160, 132, 0, 112, 4, 128, 23, 63, 0, 18, 56, 112, 4, 18, 58,
  //   96, 4, 128, 68, 128, 14, 162, 71, 240, 85, 132, 78, 101, 8, 68, 0, 18, 92,
  //   241, 101, 244, 30, 116, 2, 241, 101, 98, 5, 131, 80, 36, 93, 117, 6, 18, 70,
  //   36, 210, 36, 202, 240, 10, 64, 0, 19, 9, 64, 8, 18, 245, 64, 11, 19, 35, 64,
  //   10, 0, 0, 18, 6, 255, 252, 248, 244, 240, 236, 233, 229, 225, 221, 218, 214,
  //   210, 207, 203, 200, 196, 193, 189, 186, 182, 179, 176, 172, 169, 166, 163,
  //   159, 156, 153, 150, 147, 144, 141, 138, 135, 132, 129, 127, 124, 121, 118,
  //   116, 113, 110, 108, 105, 103, 100, 98, 95, 93, 90, 88, 86, 83, 81, 79, 77,
  //   74, 72, 70, 68, 66, 64, 62, 60, 58, 56, 54, 53, 51, 49, 47, 46, 44, 42, 41,
  //   39, 38, 36, 35, 33, 32, 30, 29, 28, 26, 25, 24, 23, 21, 20, 19, 18, 17, 16,
  //   15, 14, 13, 12, 11, 11, 10, 9, 8, 8, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 2, 1,
  //   1, 1, 1, 0, 0, 0, 0, 0, 0, 72, 0, 18, 6, 120, 255, 128, 160, 128, 135, 63,
  //   0, 19, 7, 122, 252, 108, 1, 18, 6, 120, 1, 88, 176, 19, 19, 120, 255, 18, 6,
  //   128, 160, 112, 3, 128, 133, 63, 0, 19, 33, 122, 4, 108, 1, 18, 6, 128, 128,
  //   128, 14, 0, 0, 240, 30, 241, 101, 163, 49, 241, 85, 0, 0, 0, 5, 0, 43, 1,
  //   203, 1, 246, 0, 23, 1, 251, 1, 248, 1, 208, 1, 214, 0, 29, 1, 192, 1, 235,
  //   1, 192, 0, 16, 1, 176, 0, 0, 24, 0, 4, 3, 1, 1, 3, 0, 8, 1, 203, 0, 16, 0,
  //   0, 0, 0, 1, 2, 75, 62, 60, 4, 58, 64, 6, 66, 79, 0, 0, 0, 0, 0, 6, 0, 0, 0,
  //   0, 0, 0, 111, 0, 48, 0, 129, 247, 163, 160, 240, 85, 128, 16, 97, 0, 98, 0,
  //   99, 0, 35, 179, 35, 173, 35, 167, 35, 165, 35, 165, 35, 165, 163, 112, 243,
  //   85, 163, 111, 96, 0, 240, 85, 0, 238, 131, 54, 130, 38, 63, 0, 115, 5, 129,
  //   22, 63, 0, 114, 5, 128, 6, 63, 0, 113, 5, 0, 238, 163, 112, 243, 101, 35,
  //   223, 35, 223, 35, 223, 35, 223, 35, 223, 35, 223, 111, 5, 129, 245, 128,
  //   244, 163, 111, 129, 0, 240, 101, 111, 0, 48, 0, 129, 247, 0, 238, 128, 14,
  //   143, 16, 113, 246, 129, 244, 79, 0, 113, 10, 128, 244, 143, 32, 114, 246,
  //   130, 244, 79, 0, 114, 10, 129, 244, 143, 48, 115, 246, 131, 244, 79, 0, 115,
  //   10, 130, 244, 0, 238, 163, 116, 96, 6, 240, 85, 163, 111, 240, 101, 64, 0,
  //   20, 25, 96, 88, 20, 27, 96, 84, 163, 117, 240, 85, 163, 112, 243, 101, 36,
  //   49, 163, 118, 240, 85, 96, 44, 163, 119, 243, 85, 0, 238, 163, 101, 243, 30,
  //   143, 0, 240, 101, 131, 0, 128, 240, 163, 101, 242, 30, 143, 0, 240, 101,
  //   130, 0, 128, 240, 163, 101, 241, 30, 143, 0, 240, 101, 129, 0, 128, 240,
  //   163, 101, 240, 30, 240, 101, 0, 238, 164, 103, 241, 85, 164, 117, 241, 85,
  //   97, 0, 0, 0, 240, 101, 164, 112, 240, 85, 65, 0, 20, 133, 113, 1, 0, 0, 241,
  //   30, 240, 101, 167, 241, 240, 30, 210, 53, 114, 4, 20, 111, 0, 238, 0, 0, 0,
  //   104, 0, 106, 0, 108, 1, 96, 170, 97, 131, 129, 36, 128, 244, 162, 28, 241,
  //   85, 36, 176, 162, 74, 241, 85, 36, 176, 163, 39, 241, 85, 36, 176, 162, 112,
  //   241, 85, 0, 238, 170, 131, 114, 2, 242, 30, 241, 101, 0, 238, 128, 165, 128,
  //   14, 164, 199, 240, 85, 128, 14, 112, 8, 112, 0, 0, 238, 153, 128, 20, 216,
  //   128, 144, 36, 218, 137, 128, 128, 128, 36, 218, 0, 238, 36, 186, 167, 236,
  //   97, 1, 209, 5, 0, 238, 97, 0, 111, 16, 97, 1, 111, 203, 129, 176, 143, 112,
  //   129, 160, 143, 96, 163, 92, 243, 101, 132, 0, 133, 16, 134, 32, 164, 228,
  //   242, 101, 129, 96, 167, 4, 243, 85, 164, 232, 242, 101, 129, 64, 131, 80,
  //   167, 38, 243, 85, 21, 38, 164, 236, 243, 101, 167, 4, 243, 85, 164, 240,
  //   243, 101, 167, 38, 243, 85, 163, 84, 240, 101, 167, 147, 240, 85, 163, 83,
  //   240, 101, 166, 113, 240, 85, 167, 143, 240, 85, 163, 86, 240, 101, 167, 66,
  //   128, 14, 240, 30, 241, 101, 167, 74, 241, 85, 163, 85, 240, 101, 97, 4, 129,
  //   7, 63, 0, 21, 96, 128, 14, 130, 0, 96, 23, 97, 190, 21, 106, 98, 6, 129, 30,
  //   130, 21, 96, 23, 97, 198, 129, 36, 128, 244, 167, 148, 241, 85, 163, 87,
  //   240, 101, 98, 32, 99, 16, 132, 0, 68, 1, 0, 255, 68, 2, 0, 250, 0, 224, 38,
  //   82, 163, 100, 240, 101, 132, 0, 96, 1, 134, 32, 135, 48, 38, 82, 166, 35,
  //   240, 85, 166, 49, 240, 85, 100, 1, 163, 96, 241, 101, 166, 11, 38, 98, 166,
  //   13, 240, 85, 163, 98, 241, 101, 166, 1, 38, 98, 166, 3, 240, 85, 166, 31,
  //   134, 110, 128, 96, 240, 85, 166, 45, 135, 126, 128, 112, 240, 85, 163, 88,
  //   240, 101, 129, 0, 163, 89, 240, 101, 167, 220, 49, 0, 241, 1, 64, 0, 21,
  //   250, 128, 6, 79, 0, 21, 244, 99, 0, 98, 0, 210, 56, 114, 8, 82, 96, 21, 230,
  //   115, 8, 83, 112, 21, 228, 49, 0, 242, 1, 21, 216, 49, 0, 243, 1, 109, 0,
  //   107, 0, 103, 0, 135, 212, 139, 243, 108, 0, 106, 0, 102, 0, 134, 196, 138,
  //   243, 38, 112, 39, 74, 96, 15, 224, 161, 22, 62, 124, 1, 76, 64, 22, 42, 111,
  //   0, 134, 244, 138, 245, 22, 18, 125, 1, 77, 32, 22, 56, 111, 0, 135, 244,
  //   139, 245, 22, 8, 240, 10, 48, 15, 22, 56, 163, 87, 240, 101, 48, 0, 0, 254,
  //   0, 224, 163, 88, 240, 101, 48, 0, 241, 1, 18, 0, 68, 0, 22, 96, 128, 14,
  //   130, 46, 131, 62, 116, 255, 22, 82, 0, 238, 128, 67, 129, 37, 128, 243, 130,
  //   48, 240, 85, 128, 16, 0, 238, 110, 0, 132, 96, 133, 112, 136, 160, 137, 176,
  //   129, 80, 161, 244, 128, 16, 128, 14, 95, 144, 0, 238, 57, 0, 22, 140, 129,
  //   151, 241, 30, 240, 101, 131, 0, 129, 64, 161, 244, 128, 16, 128, 14, 95,
  //   128, 0, 238, 56, 0, 22, 164, 129, 135, 241, 30, 240, 101, 130, 0, 128, 52,
  //   62, 0, 63, 0, 0, 238, 126, 255, 56, 0, 132, 247, 57, 0, 133, 247, 137, 131,
  //   136, 80, 101, 0, 136, 134, 63, 0, 133, 68, 133, 86, 136, 134, 63, 0, 133,
  //   68, 133, 86, 136, 134, 63, 0, 133, 68, 133, 86, 136, 134, 63, 0, 133, 68,
  //   133, 86, 136, 134, 63, 0, 133, 68, 133, 86, 133, 241, 136, 134, 63, 0, 133,
  //   68, 132, 78, 56, 0, 133, 68, 63, 0, 0, 238, 69, 0, 105, 0, 57, 0, 133, 247,
  //   0, 0, 0, 0, 133, 244, 153, 16, 23, 22, 137, 243, 137, 19, 96, 0, 23, 26,
  //   128, 240, 128, 147, 48, 0, 0, 238, 104, 1, 132, 32, 132, 53, 136, 245, 0, 0,
  //   0, 0, 132, 244, 152, 16, 23, 56, 136, 243, 136, 19, 96, 0, 23, 60, 128, 240,
  //   128, 131, 48, 0, 0, 238, 22, 122, 23, 180, 23, 152, 23, 76, 23, 80, 23, 180,
  //   39, 142, 23, 118, 39, 142, 131, 0, 128, 6, 128, 6, 111, 3, 131, 242, 129,
  //   192, 67, 0, 97, 0, 51, 1, 23, 106, 113, 1, 129, 210, 67, 2, 129, 211, 67, 3,
  //   129, 209, 129, 22, 128, 244, 97, 192, 128, 21, 79, 0, 128, 20, 129, 22, 49,
  //   3, 23, 120, 128, 14, 167, 208, 240, 30, 220, 209, 0, 238, 96, 0, 128, 229,
  //   112, 0, 39, 196, 0, 238, 78, 0, 23, 178, 128, 224, 128, 6, 63, 0, 23, 170,
  //   129, 208, 129, 195, 129, 22, 79, 0, 23, 178, 167, 214, 220, 209, 0, 238, 78,
  //   0, 23, 188, 167, 214, 220, 209, 0, 238, 128, 14, 128, 14, 128, 14, 0, 238,
  //   128, 6, 128, 6, 128, 6, 128, 6, 0, 238, 0, 0, 128, 0, 0, 128, 128, 128, 0,
  //   128, 128, 0, 255, 255, 255, 255, 255, 255, 255, 255, 248, 248, 248, 248,
  //   248, 248, 248, 248, 128, 192, 224, 192, 128, 224, 160, 224, 160, 160, 160,
  //   224, 32, 32, 32, 32, 160, 224, 224, 224, 160, 224, 128, 128, 128, 224, 128,
  //   160, 160, 224, 160, 160, 224, 224, 160, 160, 192, 160, 160, 160, 192, 160,
  //   160, 160, 160, 64, 160, 160, 0, 0, 0, 0, 0, 64, 224, 128, 224, 128, 224,
  //   128, 128, 128, 128, 224, 128, 224, 32, 224, 32, 224, 128, 224, 160, 224,
  //   160, 224, 192, 160, 192, 160, 192, 64, 64, 64, 224, 160, 224, 32, 224, 0,
  //   64, 224, 64, 0, 0, 224, 0, 0, 160, 160, 160, 160, 224, 64, 64, 64, 64, 64,
  //   32, 64, 64, 64, 128, 96, 0, 40, 113, 96, 2, 40, 119, 96, 5, 24, 125, 96,
  //   255, 40, 113, 96, 255, 24, 119, 169, 22, 240, 85, 0, 238, 168, 164, 240, 85,
  //   0, 238, 169, 158, 240, 85, 0, 238, 170, 32, 240, 85, 0, 238, 43, 232, 167,
  //   236, 111, 1, 223, 5, 111, 5, 223, 5, 112, 255, 0, 238, 160, 0, 0, 238, 163,
  //   111, 244, 30, 0, 238, 98, 2, 130, 71, 130, 240, 130, 68, 130, 46, 130, 46,
  //   99, 0, 114, 0, 0, 238, 40, 163, 167, 228, 114, 255, 115, 255, 210, 55, 0,
  //   238, 168, 153, 241, 85, 40, 137, 101, 57, 169, 158, 240, 101, 134, 0, 128,
  //   14, 128, 14, 133, 5, 169, 22, 240, 101, 135, 0, 40, 153, 241, 101, 71, 0,
  //   25, 3, 163, 111, 240, 51, 163, 111, 242, 101, 163, 111, 54, 1, 24, 245, 128,
  //   32, 240, 85, 54, 2, 24, 255, 128, 16, 129, 32, 241, 85, 117, 4, 25, 5, 35,
  //   123, 43, 232, 97, 114, 130, 80, 168, 176, 242, 85, 100, 0, 40, 181, 128, 64,
  //   48, 0, 25, 87, 240, 10, 64, 10, 25, 167, 64, 8, 25, 45, 64, 0, 25, 49, 64,
  //   11, 25, 153, 25, 25, 97, 0, 25, 51, 97, 1, 40, 157, 240, 101, 144, 16, 25,
  //   85, 143, 0, 96, 88, 79, 0, 96, 84, 167, 241, 240, 30, 40, 163, 210, 53, 128,
  //   16, 79, 0, 25, 59, 40, 157, 240, 85, 25, 153, 240, 10, 64, 10, 25, 167, 64,
  //   11, 25, 153, 97, 11, 129, 5, 79, 0, 25, 87, 130, 0, 40, 157, 240, 101, 144,
  //   32, 25, 151, 163, 101, 240, 30, 240, 101, 167, 241, 240, 30, 129, 32, 40,
  //   163, 210, 53, 40, 157, 128, 16, 240, 85, 163, 101, 241, 30, 240, 101, 167,
  //   241, 240, 30, 40, 163, 210, 53, 25, 153, 40, 181, 116, 1, 52, 6, 25, 163,
  //   25, 175, 40, 181, 25, 19, 40, 181, 116, 255, 52, 255, 25, 163, 71, 0, 25,
  //   197, 163, 111, 242, 101, 36, 61, 163, 117, 242, 85, 128, 96, 163, 116, 240,
  //   85, 25, 199, 36, 7, 43, 232, 130, 80, 131, 0, 96, 163, 97, 116, 36, 93, 68,
  //   255, 26, 63, 71, 0, 26, 41, 163, 111, 242, 101, 54, 1, 25, 233, 130, 0, 97,
  //   0, 96, 0, 54, 2, 25, 243, 130, 16, 129, 0, 96, 0, 129, 22, 63, 0, 114, 10,
  //   129, 22, 63, 0, 114, 20, 129, 22, 63, 0, 114, 40, 129, 22, 63, 0, 114, 80,
  //   128, 6, 63, 0, 114, 100, 97, 200, 128, 6, 63, 0, 130, 20, 63, 0, 98, 255,
  //   128, 32, 98, 255, 130, 5, 79, 0, 128, 36, 26, 43, 35, 187, 40, 153, 71, 0,
  //   26, 53, 240, 85, 26, 63, 49, 0, 26, 61, 48, 0, 96, 0, 241, 85, 40, 153, 71,
  //   0, 26, 109, 240, 101, 163, 111, 240, 51, 163, 111, 242, 101, 36, 61, 163,
  //   117, 54, 1, 26, 93, 128, 32, 240, 85, 26, 107, 54, 2, 26, 105, 128, 16, 129,
  //   32, 241, 85, 26, 107, 242, 85, 26, 115, 241, 101, 35, 123, 36, 13, 43, 232,
  //   130, 80, 131, 0, 96, 163, 97, 116, 36, 93, 40, 137, 0, 238, 170, 187, 170,
  //   238, 170, 246, 18, 6, 170, 214, 171, 204, 171, 212, 18, 0, 170, 224, 172,
  //   80, 172, 48, 18, 0, 172, 54, 172, 86, 172, 214, 28, 40, 172, 64, 173, 47,
  //   173, 91, 28, 40, 172, 73, 173, 192, 173, 228, 28, 40, 173, 137, 174, 115,
  //   30, 129, 29, 198, 11, 51, 68, 0, 16, 97, 0, 54, 43, 58, 49, 97, 14, 26, 0,
  //   11, 31, 49, 54, 71, 68, 2, 97, 43, 58, 49, 97, 9, 8, 93, 54, 98, 0, 43, 58,
  //   49, 97, 7, 2, 14, 97, 98, 2, 11, 58, 5, 0, 71, 2, 93, 97, 170, 199, 170,
  //   214, 170, 224, 170, 232, 21, 22, 27, 154, 28, 40, 27, 41, 10, 51, 2, 68, 43,
  //   16, 22, 98, 14, 88, 66, 15, 62, 2, 75, 66, 88, 16, 68, 49, 0, 97, 49, 31,
  //   43, 71, 95, 15, 0, 88, 33, 2, 93, 62, 75, 103, 33, 2, 93, 62, 49, 68, 93, 0,
  //   224, 98, 10, 99, 1, 96, 170, 97, 187, 36, 93, 98, 2, 99, 25, 96, 171, 97,
  //   25, 36, 93, 98, 12, 99, 7, 96, 170, 97, 254, 36, 93, 98, 2, 99, 19, 96, 171,
  //   97, 9, 36, 93, 96, 0, 97, 14, 167, 220, 208, 18, 112, 8, 48, 64, 27, 89,
  //   240, 10, 18, 0, 8, 58, 49, 49, 31, 58, 44, 44, 44, 14, 43, 68, 49, 0, 54,
  //   43, 43, 43, 43, 43, 43, 43, 43, 43, 14, 43, 98, 26, 0, 20, 43, 43, 43, 43,
  //   43, 43, 43, 43, 43, 13, 16, 2, 26, 14, 93, 97, 49, 43, 8, 93, 54, 98, 0,
  //   107, 4, 98, 8, 36, 138, 43, 166, 40, 93, 18, 6, 163, 92, 241, 101, 35, 123,
  //   43, 190, 163, 94, 241, 101, 35, 123, 27, 196, 36, 13, 163, 117, 245, 101, 0,
  //   238, 43, 182, 171, 119, 27, 200, 43, 182, 171, 134, 245, 85, 0, 238, 171,
  //   101, 171, 110, 171, 125, 171, 140, 27, 238, 27, 220, 27, 226, 20, 244, 96,
  //   163, 97, 92, 29, 28, 96, 163, 97, 94, 29, 28, 128, 128, 36, 186, 0, 238,
  //   163, 90, 241, 101, 112, 1, 144, 16, 96, 0, 163, 90, 240, 85, 128, 14, 128,
  //   14, 163, 51, 240, 30, 243, 101, 163, 92, 243, 85, 96, 171, 97, 110, 98, 5,
  //   99, 14, 36, 93, 96, 171, 97, 125, 98, 5, 99, 20, 36, 93, 79, 0, 28, 38, 43,
  //   166, 28, 10, 18, 6, 107, 3, 98, 16, 36, 138, 18, 6, 28, 154, 29, 53, 29,
  //   198, 9, 98, 97, 49, 68, 0, 97, 98, 2, 11, 8, 14, 2, 58, 98, 97, 98, 2, 11,
  //   6, 58, 16, 68, 49, 49, 11, 172, 54, 172, 64, 172, 73, 172, 94, 172, 109,
  //   172, 124, 172, 139, 14, 43, 26, 0, 38, 98, 26, 93, 26, 43, 43, 43, 43, 43,
  //   43, 14, 43, 2, 51, 51, 58, 49, 97, 43, 43, 43, 43, 43, 43, 43, 14, 43, 58,
  //   22, 98, 51, 97, 43, 43, 43, 43, 43, 43, 43, 43, 14, 43, 71, 0, 11, 31, 43,
  //   43, 43, 43, 43, 43, 43, 43, 43, 107, 4, 98, 24, 36, 138, 99, 0, 100, 12,
  //   163, 83, 243, 30, 240, 101, 115, 1, 172, 94, 244, 30, 240, 51, 172, 94, 244,
  //   30, 242, 101, 36, 61, 172, 94, 244, 30, 242, 85, 116, 15, 51, 4, 28, 164,
  //   96, 43, 97, 43, 172, 151, 241, 85, 172, 136, 241, 85, 40, 105, 18, 6, 28,
  //   222, 28, 240, 29, 2, 29, 16, 96, 3, 40, 125, 96, 255, 40, 131, 96, 163, 97,
  //   83, 29, 28, 40, 193, 18, 6, 96, 3, 40, 125, 96, 255, 40, 131, 96, 163, 97,
  //   84, 29, 28, 40, 193, 18, 6, 96, 1, 40, 125, 96, 7, 40, 131, 96, 163, 97, 85,
  //   29, 28, 96, 1, 40, 125, 96, 3, 40, 131, 96, 163, 97, 86, 40, 193, 18, 6, 14,
  //   43, 14, 54, 2, 97, 43, 58, 97, 49, 14, 43, 43, 43, 43, 171, 110, 171, 125,
  //   173, 32, 107, 3, 98, 32, 36, 138, 163, 100, 240, 101, 163, 101, 240, 30,
  //   240, 101, 173, 46, 240, 85, 163, 96, 241, 101, 35, 123, 43, 190, 163, 98,
  //   241, 101, 35, 123, 43, 196, 18, 6, 29, 97, 29, 105, 29, 113, 40, 93, 96,
  //   163, 97, 96, 29, 28, 40, 93, 96, 163, 97, 98, 29, 28, 40, 105, 96, 1, 40,
  //   125, 163, 87, 240, 101, 97, 2, 128, 23, 170, 32, 240, 85, 96, 163, 97, 100,
  //   29, 28, 14, 68, 49, 58, 2, 54, 93, 97, 98, 2, 11, 43, 43, 43, 43, 14, 16, 2,
  //   54, 2, 68, 43, 26, 2, 31, 49, 43, 43, 43, 43, 14, 43, 71, 0, 16, 33, 20, 68,
  //   2, 93, 11, 31, 43, 43, 43, 54, 2, 22, 98, 38, 22, 62, 16, 4, 16, 173, 137,
  //   173, 152, 173, 167, 174, 76, 240, 101, 98, 40, 107, 3, 36, 138, 163, 89,
  //   240, 101, 163, 101, 240, 30, 240, 101, 173, 181, 240, 85, 40, 105, 45, 248,
  //   18, 6, 30, 121, 30, 16, 29, 234, 96, 1, 40, 125, 96, 3, 40, 131, 96, 163,
  //   97, 89, 29, 28, 163, 87, 240, 101, 173, 182, 240, 30, 240, 30, 241, 101,
  //   173, 150, 241, 85, 46, 62, 173, 165, 241, 85, 0, 238, 163, 116, 96, 2, 240,
  //   85, 46, 62, 163, 117, 241, 85, 128, 128, 36, 186, 98, 53, 131, 0, 96, 163,
  //   97, 116, 36, 93, 79, 0, 30, 60, 163, 88, 240, 101, 111, 1, 128, 247, 163,
  //   88, 240, 85, 30, 22, 18, 6, 163, 88, 240, 101, 173, 188, 240, 30, 240, 30,
  //   241, 101, 0, 238, 11, 54, 2, 68, 49, 58, 88, 64, 4, 38, 60, 62, 12, 22, 98,
  //   68, 49, 58, 88, 75, 62, 66, 38, 64, 4, 13, 38, 22, 68, 49, 58, 88, 62, 58,
  //   64, 38, 75, 62, 66, 174, 76, 174, 88, 174, 101, 107, 3, 98, 48, 36, 138, 18,
  //   6, 128, 144, 163, 87, 240, 85, 96, 2, 128, 149, 163, 100, 240, 85, 29, 198,
  // ]);

  // Initialize the worker with the offscreen canvas
  if (!offscreenHasBeenTransferred) {
    const {
      primaryColor,
      secondaryColor,
      disableGhosting,
      tickRate: tickRate,
    } = config;

    offscreenHasBeenTransferred = true;
    postMessage(
      {
        action: "init",
        offscreenCanvas: offscreen,
        program,
        inputSharedBuffer,
        signalBuffer,
        config: {
          primaryColor,
          secondaryColor,
          disableGhosting,
          tickRate: tickRate,
        },
      },
      [offscreen]
    );
  } else {
    postMessage({
      action: "config",
      config: {
        program,
      },
    });
  }
}

// loadProgram("games", programs.games[18]);

function pauseEmulator() {
  if (!worker) return;

  Atomics.store(signalArray, CHIP8Emulator.STATE_SIGNAL, EmuState.PAUSED);
}

function calculateCanvasScale() {
  return Math.min(
    Math.floor((container.offsetWidth - (isMenuOpen ? 300 : 0)) / 64),
    Math.floor(container.offsetHeight / 32)
  );
}

function hexToRGBA(hex) {
  // Remove the '#' if present
  if (hex.startsWith("#")) {
    hex = hex.slice(1);
  }

  // Check the length of the hex code
  if (hex.length !== 6) {
    throw new Error("Invalid hexadecimal color format. Use #RRGGBB.");
  }

  // Parse the RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return [r, g, b];
}

function changeScale(newScale: number) {
  // Update the scale and send the new configuration to the worker
  scale = newScale;

  const translateX =
    (container.offsetWidth - (isMenuOpen ? 300 : 0) - 64 * scale) / 2;
  const translateY = (container.offsetHeight - 32 * scale) / 2;


  display.style.transform = `translate(calc(${
    50 * newScale
  }% - ${translateX}px), calc(${50 * newScale}% + ${translateY}px)) scale(${newScale})`;
}

window.addEventListener("resize", () => {
  changeScale(calculateCanvasScale());
});

// Send keyboard events to the worker
window.addEventListener("keydown", (e) => {
  Atomics.store(inputArray, Input.KEY_MAP[e.key], 1);
});

window.addEventListener("keyup", (e) => {
  Atomics.store(inputArray, Input.KEY_MAP[e.key], 0);
});

function postMessage(data: WorkerPayload, transfer: Transferable[] = []) {
  // Pause the emulator if the message is a configuration change
  // The worker will handle the configuration change and resume the emulator
  if (data.action === "config") {
    pauseEmulator();

    const config = data.config;

    if (config.primaryColor) {
      localStorage.setItem("primaryColor", JSON.stringify(config.primaryColor));
    }

    if (config.secondaryColor) {
      localStorage.setItem(
        "secondaryColor",
        JSON.stringify(config.secondaryColor)
      );
    }

    if ("disableGhosting" in config) {
      localStorage.setItem(
        "disableGhosting",
        JSON.stringify(config.disableGhosting)
      );
    }

    if ("tickRate" in config) {
      localStorage.setItem("tickRate", JSON.stringify(config.tickRate));
    }
  }

  worker.postMessage(data, transfer);
}

const customColors = [
  {
    name: "Palette #1",
    primary: "#02343F",
    secondary: "#F0EDCC",
  },
  {
    name: "Palette #1 - Inverted",
    primary: "#F0EDCC",
    secondary: "#02343F",
  },
  {
    name: "Palette #2",
    primary: "#FFD662",
    secondary: "#00539C",
  },
  {
    name: "Palette #2 - Inverted",
    primary: "#00539C",
    secondary: "#FFD662",
  },
  {
    name: "Palette #3",
    primary: "#FFFFFF",
    secondary: "#F95700",
  },
  {
    name: "Palette #3 - Inverted",
    primary: "#F95700",
    secondary: "#FFFFFF",
  },
  {
    name: "Palette #4",
    primary: "#02343F",
    secondary: "#F0EDCC",
  },
  {
    name: "Palette #4 - Inverted",
    primary: "#F0EDCC",
    secondary: "#02343F",
  },
];

function deselectROMs(selectedScene: "demos" | "games" | "programs") {
  const scenes = ["demos", "games", "programs"];

  for (const scene of scenes) {
    if (scene === selectedScene) continue;

    delete DMenu.selectedValues[scene];

    for (const elem of DMenu.selectedValuesDOM[scene]?.elements) {
      elem.innerText = "";
    }

    DMenu.scenes[scene].element
      .querySelector(".selected")
      ?.classList.toggle("selected");
  }
}

function loadROM(type: "demos" | "games" | "programs", name: string) {
  loadProgram(type, name);
  deselectROMs(type);
  DMenu.selectedValuesDOM.roms.elements[0].innerText = name;

  localStorage.setItem("selectedROM", name);
  localStorage.setItem("selectedROMType", type);
}

function init() {
  const selectedROM = localStorage.getItem("selectedROM");
  const selectedROMType = localStorage.getItem("selectedROMType");

  if (selectedROM && selectedROMType) {
    loadROM(selectedROMType as "demos" | "games" | "programs", selectedROM);

    if (selectedROM in DMenu.selections) {
      DMenu.selections[selectedROM].select();
    }
  }

  if (config.theme === "theme-custom") {
    showCustomColorPickers();
  }
}

function loadConfig() {
  const primaryColor = localStorage.getItem("primaryColor");
  const secondaryColor = localStorage.getItem("secondaryColor");
  const disableGhosting = localStorage.getItem("disableGhosting");
  const tickRate = localStorage.getItem("tickRate");
  const theme = localStorage.getItem("theme");

  try {
    if (primaryColor) config.primaryColor = JSON.parse(primaryColor);
  } catch {}

  try {
    if (secondaryColor) config.secondaryColor = JSON.parse(secondaryColor);
  } catch {}

  try {
    if (theme === "theme-custom") {
      const primaryColor = localStorage.getItem("custom-primaryColor");
      config.primaryColor = hexToRGBA(primaryColor);
    }
  } catch {}

  try {
    if (theme === "theme-custom") {
      const secondaryColor = localStorage.getItem("custom-secondaryColor");
      config.secondaryColor = hexToRGBA(secondaryColor);
    }
  } catch {}

  try {
    if (disableGhosting) config.disableGhosting = JSON.parse(disableGhosting);
  } catch {}

  try {
    if (tickRate && JSON.parse(tickRate)) config.tickRate = JSON.parse(tickRate);
  } catch {}

  try {
    if (theme) config.theme = theme;
  } catch {}
}

function showCustomColorPickers() {
  const customColorPicker = document.getElementsByClassName("custom-color");

  for (let i = 0; i < customColorPicker.length; i++) {
    customColorPicker[i].classList.remove("none");
  }
}

loadConfig();

let DMenu = new dropDownMenu(
  [
    {
      id: "initial",
      heading: {
        text: "Settings",
        hideArrow: true,
        callback: () => {
          menuCon.style.transform = "translateX(100%)";
          menuIcon.style.right = "10px";
          isMenuOpen = false;
          changeScale(calculateCanvasScale());
        },
      },
      items: [
        {
          text: "ROMs",
          iconID: "romIcon",
          open: "roms",
          subMenu: true,
        },
        {
          text: "Theme",
          iconID: "themeIcon",
          open: "theme",
          subMenu: true,
        },
        {
          text: "Enable Ghosting",
          toggle: true,
          on: !config.disableGhosting,
          toggleOn: () => {
            postMessage({
              action: "config",
              config: {
                disableGhosting: false,
              },
            });
          },
          toggleOff: () => {
            postMessage({
              action: "config",
              config: {
                disableGhosting: true,
              },
            });
          },
        },
        {
          text: "Tick Rate",
          textBox: true,
          value: config.tickRate,
          onInput: function (event) {
            postMessage({
              action: "config",
              config: {
                tickRate: parseInt(event.target.value),
              },
            });
          },
        },
      ],
    },
    {
      id: "theme",
      selectableScene: true,
      heading: {
        text: "Theme",
      },
      items: [
        ...customColors.map(({ primary, secondary, name }) => ({
          text: name,
          highlightable: true,
          selected: config.theme === `theme-${name}`,
          callback: () => {
            const customColorPicker =
              document.getElementsByClassName("custom-color");

            for (let i = 0; i < customColorPicker.length; i++) {
              customColorPicker[i].classList.add("none");
            }

            localStorage.setItem("theme", `theme-${name}`);

            postMessage({
              action: "config",
              config: {
                primaryColor: hexToRGBA(primary),
                secondaryColor: hexToRGBA(secondary),
              },
            });
          },
        })),
        {
          highlightable: true,
          text: "Custom",
          selected: config.theme === "theme-custom",
          callback: () => {
            const customColorPicker =
              document.getElementsByClassName("custom-color");

            for (let i = 0; i < customColorPicker.length; i++) {
              customColorPicker[i].classList.remove("none");
            }

            localStorage.setItem("theme", "theme-custom");
          },
        },
        {
          text: "Primary Color",
          color: true,
          id: "primaryColor",
          classes: ["custom-color", "none"],
          value: localStorage.getItem("custom-primaryColor") || "#000000",
          onInput: function (event) {
            const color = hexToRGBA(event.target.value);

            localStorage.setItem("custom-primaryColor", event.target.value);

            postMessage({
              action: "config",
              config: {
                primaryColor: color,
              },
            });
          },
        },
        {
          text: "Secondary Color",
          color: true,
          id: "secondaryColor",
          classes: ["none", "custom-color"],
          value: localStorage.getItem("custom-secondaryColor") || "#FFFFFF",
          onInput: function (event) {
            const color = hexToRGBA(event.target.value);

            localStorage.setItem("custom-secondaryColor", event.target.value);

            postMessage({
              action: "config",
              config: {
                secondaryColor: color,
              },
            });
          },
        },
      ],
    },
    {
      id: "roms",
      selectableScene: true,
      heading: {
        text: "ROMs",
      },
      items: [
        {
          text: "Source: dmatlack/chip8",
          iconID: "githubIcon",
          classes: ["source", "clickable"],
          callback: () => {
            window.open("https://github.com/dmatlack/chip8/");
          },
        },
        {
          text: "Demos",
          iconID: "demoIcon",
          open: "demos",
          subMenu: true,
        },
        {
          text: "Games",
          iconID: "gamesIcon",
          open: "games",
          subMenu: true,
        },
        {
          text: "Programs",
          iconID: "programIcon",
          open: "programs",
          subMenu: true,
        },
      ],
    },
    {
      id: "demos",
      selectableScene: true,
      heading: {
        text: "Demos",
      },
      items: programs.demos.map((name) => ({
        text: name,
        id: name,
        highlightable: true,
        callback: () => loadROM("demos", name),
      })),
    },
    {
      id: "games",
      selectableScene: true,
      heading: {
        text: "Games",
      },
      items: programs.games.map((name) => ({
        text: name,
        id: name,
        highlightable: true,
        callback: () => loadROM("games", name),
      })),
    },
    {
      id: "programs",
      selectableScene: true,
      heading: {
        text: "Programs",
      },
      items: programs.programs.map((name) => ({
        text: name,
        id: name,
        highlightable: true,
        callback: () => loadROM("programs", name),
      })),
    },
  ],
  menuCon
);

DMenu.open("initial");
init();

window["DMenu"] = DMenu;
