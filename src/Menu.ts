import { Display } from "./CHIP-8/Display";
import { CHIP8Host } from "./Chip8Host";
import { hexToRGBA } from "./helper";

export class EmuMenu {
  isOpen = localStorage.getItem("menu-isOpen") === "true";
  customColors = [
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
  ];
  dMenu: dropDownMenu;
  container: HTMLElement;
  displayElement: HTMLElement;
  menuCon: HTMLElement;
  menuIcon: HTMLElement;
  chip8Host: CHIP8Host;
  programs = {
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

  constructor(
    container: HTMLElement,
    menuCon: HTMLElement,
    menuIcon: HTMLElement,
    display: HTMLElement,
    chip8Host: CHIP8Host
  ) {
    const config = chip8Host.config;

    this.container = container;
    this.displayElement = display;
    this.chip8Host = chip8Host;
    this.menuCon = menuCon;
    this.menuIcon = menuIcon;
    this.changeScale();
    this.container = container;
    this.dMenu = new dropDownMenu(
      [
        {
          id: "initial",
          heading: {
            html: `<div class="menuItemIcon menuItemIconBack"></div><div class="menuItemText">Settings</div>`,
            hideArrow: true,
            callback: this.close.bind(this),
          },
          items: [
            {
              text: "ROMs",
              iconID: "romIcon",
              open: "roms",
            },
            {
              text: "Theme",
              iconID: "themeIcon",
              open: "theme",
            },
            {
              text: "Enable Ghosting",
              toggle: true,
              on: !config.disableGhosting,
              toggleOn: () => {
                this.changeConfig({
                  disableGhosting: false,
                });
              },
              toggleOff: () => {
                this.changeConfig({
                  disableGhosting: true,
                });
              },
            },
            {
              text: "Tick Rate",
              textBox: true,
              value: config.tickRate.toString(),
              onInput: (event: InputEvent) => {
                this.changeConfig({
                  tickRate: parseInt((event.target as HTMLInputElement).value),
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
            },
            {
              text: "Games",
              iconID: "gamesIcon",
              open: "games",
            },
            {
              text: "Programs",
              iconID: "programIcon",
              open: "programs",
            },
          ],
        },
        ...this.getROMsConfig(),
        this.getThemeConfig(),
      ],
      menuCon
    );

    const selectedROM = localStorage.getItem("selectedROM");
    const selectedROMType = localStorage.getItem("selectedROMType");

    if (selectedROM && selectedROMType) {
      this.loadROM(
        selectedROMType as "demos" | "games" | "programs",
        selectedROM
      );

      if (selectedROM in this.dMenu.selections) {
        this.dMenu.selections[selectedROM].select();
      }
    }

    if (config.theme === "theme-custom") {
      this.showCustomColorPickers();
    }

    menuIcon.addEventListener("click", this.open.bind(this));

    window.addEventListener("resize", () => {
      this.changeScale();
    });

    this.dMenu.open("initial");

    if(this.isOpen) {
      this.open(); 
    } else {
      this.close();
    }
  }

  open() {
    this.menuCon.style.transform = "translateX(0)";
    this.menuIcon.style.right = "-60px";
    this.isOpen = true;
    this.changeScale();

    localStorage.setItem("menu-isOpen", "true");
  }

  close() {
    this.menuCon.style.transform = "translateX(100%)";
    this.menuIcon.style.right = "10px";
    this.isOpen = false;
    this.changeScale();

    localStorage.setItem("menu-isOpen", "false");
  }

  changeScale() {
    const scale = this.calculateCanvasScale();
    const container = this.container;
    const display = this.displayElement;
    const translateX =
      (container.offsetWidth -
        (this.isOpen ? 300 : 0) -
        Display.WIDTH * scale) /
      2;
    const translateY = (container.offsetHeight - Display.HEIGHT * scale) / 2;

    display.style.transform = `translate(calc(${
      (100 * scale) / 2 - 50
    }% + ${translateX}px), calc(${
      (100 * scale) / 2 - 50
    }% + ${translateY}px)) scale(${scale})`;
  }

  getThemeConfig() {
    const config = this.chip8Host.config;

    return {
      id: "theme",
      selectableScene: true,
      heading: {
        text: "Theme",
      },
      items: [
        ...this.customColors.map(({ primary, secondary, name }) => ({
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

            this.changeConfig({
              primaryColor: hexToRGBA(primary),
              secondaryColor: hexToRGBA(secondary),
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

            const primaryColor = localStorage.getItem("custom-primaryColor");
            const secondaryColor = localStorage.getItem("custom-secondaryColor");

            this.changeConfig({
              primaryColor: hexToRGBA(primaryColor || "#000000"),
              secondaryColor: hexToRGBA(secondaryColor || "#FFFFFF"),
            });
          },
        },
        {
          text: "Primary Color",
          color: true,
          id: "primaryColor",
          classes: ["custom-color", "none"],
          value: localStorage.getItem("custom-primaryColor") || "#000000",
          onInput: (event: InputEvent) => {
            const target = event.target as HTMLInputElement;
            const color = hexToRGBA(target.value);

            localStorage.setItem("custom-primaryColor", target.value);

            this.changeConfig({
              primaryColor: color,
            });
          },
        },
        {
          text: "Secondary Color",
          color: true,
          id: "secondaryColor",
          classes: ["none", "custom-color"],
          value: localStorage.getItem("custom-secondaryColor") || "#FFFFFF",
          onInput: (event: InputEvent) => {
            const target = event.target as HTMLInputElement;
            const color = hexToRGBA(target.value);

            localStorage.setItem("custom-secondaryColor", target.value);

            this.changeConfig({
              secondaryColor: color,
            });
          },
        },
      ],
    };
  }

  getROMsConfig() {
    return [
      {
        id: "demos",
        selectableScene: true,
        heading: {
          text: "Demos",
        },
        items: this.programs.demos.map((name) => ({
          text: name,
          id: name,
          highlightable: true,
          callback: () => this.loadROM("demos", name),
        })),
      },
      {
        id: "games",
        selectableScene: true,
        heading: {
          text: "Games",
        },
        items: this.programs.games.map((name) => ({
          text: name,
          id: name,
          highlightable: true,
          callback: () => this.loadROM("games", name),
        })),
      },
      {
        id: "programs",
        selectableScene: true,
        heading: {
          text: "Programs",
        },
        items: this.programs.programs.map((name) => ({
          text: name,
          id: name,
          highlightable: true,
          callback: () => this.loadROM("programs", name),
        })),
      },
    ];
  }

  calculateCanvasScale() {
    return Math.min(
      Math.floor(
        (this.container.offsetWidth - (this.isOpen ? 300 : 0)) / Display.WIDTH
      ),
      Math.floor(this.container.offsetHeight / Display.HEIGHT)
    );
  }

  deselectMenuROMs(selectedScene: "demos" | "games" | "programs") {
    const scenes = ["demos", "games", "programs"];

    for (const scene of scenes) {
      if (scene === selectedScene) continue;

      delete this.dMenu.selectedValues[scene];

      for (const elem of this.dMenu.selectedValuesDOM[scene]?.elements) {
        elem.innerText = "";
      }

      this.dMenu.scenes[scene].element
        .querySelector(".selected")
        ?.classList.toggle("selected");
    }
  }

  showCustomColorPickers() {
    const customColorPicker = document.getElementsByClassName("custom-color");

    for (let i = 0; i < customColorPicker.length; i++) {
      customColorPicker[i].classList.remove("none");
    }
  }

  async loadROM(type: "demos" | "games" | "programs", name: string) {
    const programURL = encodeURI(
      `https://raw.githubusercontent.com/dmatlack/chip8/refs/heads/master/roms/${type}/${name}`
    );

    const program = await this.fetchProgram(programURL);

    this.chip8Host.loadProgram(program);
    this.deselectMenuROMs(type);
    this.dMenu.selectedValuesDOM.roms.elements[0].innerText = name;

    localStorage.setItem("selectedROM", name);
    localStorage.setItem("selectedROMType", type);
  }

  async fetchProgram(url: string) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

  changeConfig(config: Partial<CHIP8Host["config"]>) {
    this.chip8Host.postMessage({
      action: "config",
      config,
    });
  }
}
