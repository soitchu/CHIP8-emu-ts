import { Display } from "./CHIP-8/Display";
import { CHIP8Host } from "./Chip8Host";
import { arrayBufferToBase64, base64ToArrayBuffer, hexToRGBA } from "./helper";

export class EmuMenu {
  // Whether the menu is open
  isOpen = localStorage.getItem("menu-isOpen") === "true";

  // Colors for themes
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

  // An instance of the drop down menu
  dMenu: dropDownMenu;

  // The container element where the emulator canvas is displayed
  container: HTMLElement;

  // The emulator canvas element
  displayElement: HTMLCanvasElement;

  // The container element where the drop down menu is displayed
  menuCon: HTMLElement;

  // The icon which opens the menu
  menuIcon: HTMLElement;

  // The CHIP-8 host instance
  chip8Host: CHIP8Host;

  // A list of programs loaded from the dmatlack/chip8 repository
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
    display: HTMLCanvasElement,
    chip8Host: CHIP8Host
  ) {
    const config = chip8Host.config;

    this.container = container;
    this.displayElement = display;
    this.chip8Host = chip8Host;
    this.menuCon = menuCon;
    this.menuIcon = menuIcon;
    this.container = container;
    this.changeScale();

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
              html: "Instructions per second <br/> (-1 to uncap)",
              textBox: true,
              value: config.tickRate.toString(),
              onInput: (event: InputEvent) => {
                const value = parseInt((event.target as HTMLInputElement).value);

                this.changeConfig({
                  tickRate: isNaN(value) ? -1 : value,
                });
              },
            },
            {
              text: "Controls",
              iconID: "controlsIcon",
              open: "controls",
            }
          ],
        },
        ...this.getROMsConfig(),
        this.getThemeConfig(),
        {
          id: "controls",
          heading: {
            text: "Controls",
          },
          items: [
            {
              html: `The controls are mapped to the following keys:
              <br/> <br/>
              <code>
                1, 2, 3, 4 <br/>
                Q, W, E, R <br/>
                A, S, D, F <br/>
                Z, X, C, V <br/>
              </code>
              </pre>
              `,
            }
          ]
        },
      ],
      menuCon
    );

    const customROMInput = document.getElementById(
      "customROM"
    ) as HTMLInputElement;

    // Load the selected ROM from local storage
    const selectedROM = localStorage.getItem("selectedROM");
    const selectedROMType = localStorage.getItem("selectedROMType");

    if (selectedROM && selectedROMType) {
      if (selectedROMType === "custom") {
        try {
          const name = localStorage.getItem("selectedROMName")!;
          const buffer = base64ToArrayBuffer(selectedROM);

          this.loadCustomBuffer(buffer, name);
        } catch (e) {
          console.error(e);
          alert("Error loading custom ROM");
        }
      } else {
        this.loadROM(
          selectedROMType as "demos" | "games" | "programs",
          selectedROM
        );

        if (selectedROM in this.dMenu.selections) {
          this.dMenu.selections[selectedROM].select();
        }
      }
    }

    // If the theme is custom, show the custom color pickers
    if (config.theme === "theme-custom") {
      this.showCustomColorPickers();
    }

    // Add event listeners
    menuIcon.addEventListener("click", this.open.bind(this));

    customROMInput.addEventListener("change", this.loadCustomROM.bind(this));

    window.addEventListener("resize", () => {
      this.changeScale();
    });

    // Initialize the menu to show the initial scene
    this.dMenu.open("initial");

    // Open the menu if it was open last time
    if (this.isOpen) {
      this.open();
    } else {
      this.close();
    }
  }

  /**
   * Open the menu
   */
  open() {
    this.menuCon.style.transform = "translateX(0)";
    this.menuIcon.style.right = "-60px";
    this.isOpen = true;
    this.changeScale();

    localStorage.setItem("menu-isOpen", "true");
  }

  /**
   * Close the menu
   */
  close() {
    this.menuCon.style.transform = "translateX(100%)";
    this.menuIcon.style.right = "10px";
    this.isOpen = false;
    this.changeScale();

    localStorage.setItem("menu-isOpen", "false");
  }

  /**
   * Changes the scale of the 64x32 display to fit the container
   * and centers it
   */
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
    const centerPercentage = (100 * scale) / 2 - 50;

    display.style.transform = `translate(calc(${centerPercentage}% + ${translateX}px), calc(${centerPercentage}% + ${translateY}px)) scale(${scale})`;
  }

  /**
   * Returns the scene configuration for the theme settings
   *
   * @returns The theme configuration for DropDownMenu
   */
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
            const secondaryColor = localStorage.getItem(
              "custom-secondaryColor"
            );

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

  /**
   * Returns the scene configuration for the ROMs settings
   *
   * @returns The ROMs configuration for DropDownMenu
   */
  getROMsConfig() {
    return [
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
          {
            html: `
                <label for="customROM" id="cusomROMLabel">
                  <div>Custom ROM</div>
                </label>
                <input type="file" id="customROM" accept=".ch8, .c8">
                <div class="menuItemValue" id="customROMValue"></div>
              `,
            classes: ["clickable"],
            callback: () => {
              document.getElementById("cusomROMLabel")!.click();
            }
          },
        ],
      },
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

  /**
   * Returns the scale of the canvas based on the container size so that
   * the CHIP-8 display fits within the container
   *
   * @returns The scale of the canvas
   */
  calculateCanvasScale() {
    return Math.min(
      Math.floor(
        (this.container.offsetWidth - (this.isOpen ? 300 : 0)) / Display.WIDTH
      ),
      Math.floor(this.container.offsetHeight / Display.HEIGHT)
    );
  }

  /**
   * Deselects all other scenes in the ROMs menu
   *
   * @param selectedScene the scene whose selections should be preserved
   */
  deselectMenuROMs(selectedScene: "demos" | "games" | "programs" | "custom") {
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

  /**
   * Shows the custom color pickers
   */
  showCustomColorPickers() {
    const customColorPicker = document.getElementsByClassName("custom-color");

    for (let i = 0; i < customColorPicker.length; i++) {
      customColorPicker[i].classList.remove("none");
    }
  }

  /**
   * Loads a ROM from the dmatlack/chip8 repository
   */
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

    document.getElementById("customROMValue")!.innerText = "";
  }

  /**
   * Loads a custom ROM
   */
  async loadCustomROM(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      const name = file.name;

      this.loadCustomBuffer(buffer, name);
    };

    reader.onerror = () => {
      alert("Error reading the file");
    };

    reader.readAsArrayBuffer(file);
  }

  async loadCustomBuffer(buffer: ArrayBuffer, name: string) {
    const programBuffer = buffer;
    const program = new Uint8Array(programBuffer);

    if (program.byteLength > 4096 - 0x200) {
      alert(
        "The program is too large to fit in memory. Most likely not a CHIP-8 program."
      );
      return;
    }

    localStorage.setItem("selectedROM", arrayBufferToBase64(programBuffer));

    this.chip8Host.loadProgram(program);
    this.deselectMenuROMs("custom");
    this.dMenu.selectedValuesDOM.roms.elements[0].innerText = name;

    localStorage.setItem("selectedROMName", name);
    localStorage.setItem("selectedROMType", "custom");

    document.getElementById("customROMValue")!.innerText = name;
  }

  async fetchProgram(url: string) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

  /**
   * Changes the configuration of the CHIP-8 host
   *
   * @param config The new configuration
   */
  changeConfig(config: Partial<CHIP8Host["config"]>) {
    this.chip8Host.postMessage({
      action: "config",
      config,
    });
  }
}
