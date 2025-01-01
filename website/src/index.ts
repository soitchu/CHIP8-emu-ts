import Chip8Worker from "./worker?worker";
import displayWorker from "./displayWorker?worker";
import { CHIP8Emulator, EmuState } from "./CHIP-8";

import { DisplaySignal, type WorkerPayload } from "./worker";
import { Input } from "./CHIP-8/Input";
import { Display } from "./CHIP-8/Display";

const container = document.getElementById("container")!;
const menuCon = document.getElementById("menuCon")!;
const menuIcon = document.getElementById("menuIcon")!;
const display = document.getElementById("display")! as HTMLCanvasElement;

display.width = Display.WIDTH;
display.height = Display.HEIGHT;

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
const frameBuffer = new SharedArrayBuffer(
  Display.WIDTH * Display.HEIGHT * 4 * Uint8Array.BYTES_PER_ELEMENT
);
const displaySignalBuffer = new SharedArrayBuffer(
  1 * Uint32Array.BYTES_PER_ELEMENT
);
const inputArray = new Uint8Array(inputSharedBuffer);
let worker = new Chip8Worker() as Worker;
let offscreenHasBeenTransferred = false;

async function fetchProgram(url: string) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Load a program by fetching it from the GitHub repository
 */
async function loadProgram(type: "demos" | "games" | "programs", name: string) {
  const programURL = encodeURI(
    `https://raw.githubusercontent.com/dmatlack/chip8/refs/heads/master/roms/${type}/${name}`
  );

  inputArray.fill(0);

  const program = await fetchProgram(programURL);

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
        program,
        inputSharedBuffer,
        signalBuffer,
        frameBuffer,
        displaySignalBuffer,
        config: {
          primaryColor,
          secondaryColor,
          disableGhosting,
          tickRate: tickRate,
        },
      },
      []
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
    Math.floor((container.offsetWidth - (isMenuOpen ? 300 : 0)) / Display.WIDTH),
    Math.floor(container.offsetHeight / Display.HEIGHT)
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
    (container.offsetWidth - (isMenuOpen ? 300 : 0) - Display.WIDTH * scale) / 2;
  const translateY = (container.offsetHeight - Display.HEIGHT * scale) / 2;

  display.style.transform = `translate(calc(${
    50 * newScale
  }% - ${translateX}px), calc(${
    50 * newScale
  }% + ${translateY}px)) scale(${newScale})`;
}

window.addEventListener("resize", () => {
  changeScale(calculateCanvasScale());
});

// Send keyboard events to the worker
window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase() as keyof typeof Input.KEY_MAP;

  if(!(key in Input.KEY_MAP)) return; 
  Atomics.store(inputArray, Input.KEY_MAP[key], 1);
});

window.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase() as keyof typeof Input.KEY_MAP;

  if(!(key in Input.KEY_MAP)) return; 
  
  Atomics.store(inputArray, Input.KEY_MAP[key], 0);
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
    if (tickRate && JSON.parse(tickRate))
      config.tickRate = JSON.parse(tickRate);
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
          onInput: function (event: InputEvent) {
            postMessage({
              action: "config",
              config: {
                tickRate: parseInt((event.target as HTMLInputElement).value),
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
          onInput: function (event: InputEvent) {
            const target = event.target as HTMLInputElement;
            const color = hexToRGBA(target.value);

            localStorage.setItem("custom-primaryColor", target.value);

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
          onInput: function (event: InputEvent) {
            const target = event.target as HTMLInputElement;
            const color = hexToRGBA(target.value);

            localStorage.setItem("custom-secondaryColor", target.value);

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

const drawWorkerInstance = new displayWorker();
const offscreenCanvas = display.transferControlToOffscreen();

drawWorkerInstance.postMessage({
  mutexBuffer: displaySignalBuffer,
  offscreenCanvas,
  frameBuffer,
}, [offscreenCanvas]);

DMenu.open("initial");
init();