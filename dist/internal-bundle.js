"use strict";
(() => {
  // js/colander.ts
  var CAVE_DOOR_ID = "northwest-portal";
  function hasCaveColander() {
    return new URLSearchParams(window.location.search).get("colander") === "1";
  }
  function drawColander(context2, centerX, topY, scale = 1) {
    const pixel = Math.max(1, scale);
    const width = 26 * pixel;
    const left = Math.round(centerX - width / 2);
    const top = Math.round(topY);
    context2.save();
    context2.imageSmoothingEnabled = false;
    context2.fillStyle = "#1d1d22";
    context2.fillRect(left + 2 * pixel, top + 5 * pixel, 22 * pixel, 4 * pixel);
    context2.fillRect(left, top + 9 * pixel, 4 * pixel, 5 * pixel);
    context2.fillRect(left + 22 * pixel, top + 9 * pixel, 4 * pixel, 5 * pixel);
    context2.fillRect(left + 5 * pixel, top + 19 * pixel, 16 * pixel, 3 * pixel);
    context2.fillStyle = "#b7bcc3";
    context2.fillRect(left + 4 * pixel, top + 3 * pixel, 18 * pixel, 4 * pixel);
    context2.fillRect(left + 3 * pixel, top + 8 * pixel, 20 * pixel, 4 * pixel);
    context2.fillRect(left + 5 * pixel, top + 12 * pixel, 16 * pixel, 8 * pixel);
    context2.fillStyle = "#6d737e";
    for (let y = 13; y <= 18; y += 3) {
      for (let x = 7; x <= 18; x += 4) {
        context2.fillRect(left + x * pixel, top + y * pixel, 2 * pixel, 2 * pixel);
      }
    }
    context2.fillStyle = "#eceff2";
    context2.fillRect(left + 6 * pixel, top + 4 * pixel, 12 * pixel, 1 * pixel);
    context2.restore();
  }

  // js/cave-siblings.ts
  var CAVE_SIBLINGS = {
    x: 320,
    startY: 45,
    // Tall enough that the sprite's top clears the 47px-tall top wall band at
    // rest; a smaller endY left their hair rendering inside the rock texture.
    endY: 132,
    width: 96,
    height: 83,
    interactionDistance: 86
  };
  var CAVE_SIBLINGS_IDLE_FRAME = [181, 16, 235, 176];
  var CAVE_SIBLINGS_WALK_FRAMES = [
    [163, 206, 212, 183],
    [657, 206, 211, 183],
    [1103, 206, 180, 183]
  ];
  var ENTRANCE_DURATION = 1.35;
  var FINAL_DARKNESS_ALPHA = 0.68;
  var DIALOGUES = {
    welcome: [
      { speaker: "Maddy", line: "welcome." },
      { speaker: "Marina", line: "stranger." },
      { speaker: "Maddy", line: "would you" },
      { speaker: "Marina", line: "like to see" },
      { speaker: "Maddy", line: "the website" },
      { speaker: "Marina", line: "our brother" },
      { speaker: "Maddy", line: "made" },
      { speaker: "Marina", line: "made?" }
    ],
    warning: [
      { speaker: "Maddy", line: "do not" },
      { speaker: "Marina", line: "touch" },
      { speaker: "Maddy", line: "the colander" }
    ]
  };
  var DIALOGUE_DURATION = {
    welcome: 5e3,
    warning: 1500
  };
  var CaveSiblingsController = class {
    constructor(view) {
      this.view = view;
      this.entranceElapsed = 0;
      this.dialoguePhase = "idle";
      this.dialogueSequence = "welcome";
      this.dialogueStartedAt = 0;
      this.dialogueLineIndex = -1;
      this.completedWhileNearby = false;
      this.websiteWasLeft = false;
      this.y = CAVE_SIBLINGS.startY;
      this.walkFrame = 0;
      this.darknessAlpha = 1;
      this.voices = {
        Maddy: new Audio("../chat/siblings/maddy.mp3"),
        Marina: new Audio("../chat/siblings/marina.mp3")
      };
      Object.values(this.voices).forEach((voice) => {
        voice.preload = "auto";
      });
    }
    get isEntering() {
      return this.entranceElapsed < ENTRANCE_DURATION;
    }
    get isWaiting() {
      return !this.isEntering;
    }
    get isDialoguePlaying() {
      return this.dialoguePhase === "playing";
    }
    get canResumeAfterWebsite() {
      return this.dialoguePhase === "awaitingReturn" && this.websiteWasLeft;
    }
    startWelcome(time) {
      if (!this.isWaiting || this.dialoguePhase !== "idle" || this.completedWhileNearby) return false;
      this.beginDialogue("welcome", time);
      return true;
    }
    leaveRange() {
      this.completedWhileNearby = false;
      if (this.dialoguePhase === "idle" || this.dialoguePhase === "complete") {
        this.dialoguePhase = "idle";
      }
    }
    chooseWebsite() {
      this.completedWhileNearby = true;
      this.websiteWasLeft = false;
      this.dialoguePhase = "awaitingReturn";
      this.stopVoices();
    }
    declineWebsite(time) {
      this.completedWhileNearby = true;
      this.beginDialogue("warning", time);
    }
    notePageLeft() {
      if (this.dialoguePhase === "awaitingReturn") this.websiteWasLeft = true;
    }
    resumeAfterWebsite(time) {
      if (!this.canResumeAfterWebsite) return false;
      this.websiteWasLeft = false;
      this.beginDialogue("warning", time);
      return true;
    }
    closeDialogue() {
      if (this.dialoguePhase === "playing" || this.dialoguePhase === "choice") {
        this.dialoguePhase = "idle";
      }
      this.stopVoices();
    }
    update(deltaTime, time) {
      this.updateEntrance(deltaTime);
      if (this.dialoguePhase !== "playing") return;
      const lines = DIALOGUES[this.dialogueSequence];
      const lineDuration = DIALOGUE_DURATION[this.dialogueSequence] / lines.length;
      const nextLineIndex = Math.floor((time - this.dialogueStartedAt) / lineDuration);
      if (nextLineIndex >= lines.length) {
        this.completedWhileNearby = true;
        this.stopVoices();
        if (this.dialogueSequence === "welcome") {
          this.dialoguePhase = "choice";
          this.view.showOptions();
        } else {
          this.dialoguePhase = "complete";
          this.view.closeDialogue();
        }
        return;
      }
      if (nextLineIndex !== this.dialogueLineIndex) this.showLine(nextLineIndex);
    }
    updateEntrance(deltaTime) {
      if (!this.isEntering) return;
      this.entranceElapsed = Math.min(ENTRANCE_DURATION, this.entranceElapsed + deltaTime);
      const progress = this.entranceElapsed / ENTRANCE_DURATION;
      this.y = CAVE_SIBLINGS.startY + (CAVE_SIBLINGS.endY - CAVE_SIBLINGS.startY) * progress;
      this.walkFrame = Math.min(
        CAVE_SIBLINGS_WALK_FRAMES.length - 1,
        Math.floor(progress * CAVE_SIBLINGS_WALK_FRAMES.length)
      );
      this.darknessAlpha = 1 - (1 - FINAL_DARKNESS_ALPHA) * progress;
    }
    beginDialogue(sequence, time) {
      this.stopVoices();
      this.dialogueSequence = sequence;
      this.dialogueStartedAt = time;
      this.dialogueLineIndex = -1;
      this.dialoguePhase = "playing";
      this.showLine(0);
    }
    showLine(index) {
      const dialogue = DIALOGUES[this.dialogueSequence][index];
      if (!dialogue) return;
      this.dialogueLineIndex = index;
      this.view.showLine(dialogue, index, DIALOGUES[this.dialogueSequence].length);
      this.playVoice(dialogue.speaker);
    }
    // Only the speaker whose line is currently shown should be heard: pause
    // the other sibling's clip (without losing their place) and resume this
    // one from wherever it left off, only rewinding once it's fully ended.
    playVoice(speaker) {
      Object.keys(this.voices).forEach((other) => {
        if (other === speaker) return;
        this.voices[other].pause();
      });
      const voice = this.voices[speaker];
      if (voice.ended) voice.currentTime = 0;
      void voice.play().catch(() => {
      });
    }
    stopVoices() {
      Object.values(this.voices).forEach((voice) => {
        voice.pause();
        voice.currentTime = 0;
      });
    }
  };

  // js/storage.ts
  function readStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
    }
  }

  // js/cinema-audience.ts
  var DIALOGUE_INDEX_KEY = "max-game:cinema-audience-dialogue-index";
  var INTERACTION_DISTANCE = 78;
  var AUDIENCE = [
    { x: 153, y: 373 },
    { x: 207, y: 375 },
    { x: 262, y: 373 },
    { x: 153, y: 440 },
    { x: 207, y: 441 },
    { x: 262, y: 440 }
  ];
  var DIALOGUE_LINES = [
    "Shhh!",
    "The film's on.",
    "This is where it gets good.",
    "I need to pee.",
    "Got any popcorn?",
    "This film is long.",
    "Is that Nicolas Cage?",
    "Move your head.",
    "You're blocking the screen.",
    "What did they say?",
    "Wait, who's that?",
    "Who's the bad guy again?",
    "No spoilers!",
    "Have you seen this before?",
    "This bit is scary.",
    "That was disgusting.",
    "That was actually pretty funny.",
    "This film is weird.",
    "I have no idea what's happening.",
    "I'm so confused.",
    "How long is left?",
    "I'm getting tired.",
    "Can you pass the popcorn?",
    "You've eaten all the popcorn.",
    "Got any sweets?",
    "Stop rustling the bag.",
    "Turn your phone off.",
    "That screen is so bright.",
    "Why is everyone laughing?",
    "That wasn't funny.",
    "There's no way he'd survive that.",
    "That makes absolutely no sense.",
    "Why would you go in there?",
    "Don't open the door!",
    "Behind you!",
    "Run!",
    "He's definitely dead.",
    "She's definitely not dead.",
    "Called it.",
    "Oh come on.",
    "That was brutal.",
    "This soundtrack is great.",
    "I think someone kicked my chair.",
    "Stop kicking my chair.",
    "I'm going to the toilet.",
    "Tell me what I miss.",
    "You missed the best bit.",
    "He's obviously evil.",
    "Is there a post-credit scene?",
    "That's it?"
  ];
  var CinemaAudienceController = class {
    constructor(view) {
      this.view = view;
      this.nearbyAudienceIndex = null;
      this.fallbackDialogueIndex = 0;
    }
    update(playerX, playerY, dialogueOpen) {
      const nextAudienceIndex = AUDIENCE.map((member, index) => ({ index, distance: Math.hypot(playerX - member.x, playerY - member.y) })).filter(({ distance }) => distance <= INTERACTION_DISTANCE).sort((first, second) => first.distance - second.distance)[0]?.index ?? null;
      if (nextAudienceIndex === this.nearbyAudienceIndex) return;
      const previousAudienceIndex = this.nearbyAudienceIndex;
      this.nearbyAudienceIndex = nextAudienceIndex;
      if (previousAudienceIndex !== null && dialogueOpen) this.view.closeDialogue();
      if (nextAudienceIndex !== null) {
        const { line, index } = this.nextDialogueLine();
        this.view.openDialogue(line, index, DIALOGUE_LINES.length);
      }
    }
    nextDialogueLine() {
      const stored = Number.parseInt(
        readStorage(DIALOGUE_INDEX_KEY) ?? String(this.fallbackDialogueIndex),
        10
      );
      const current = Number.isFinite(stored) && stored >= 0 ? stored % DIALOGUE_LINES.length : 0;
      const next = (current + 1) % DIALOGUE_LINES.length;
      this.fallbackDialogueIndex = next;
      writeStorage(DIALOGUE_INDEX_KEY, String(next));
      return { line: DIALOGUE_LINES[current] ?? "", index: current };
    }
  };

  // js/config.ts
  var FRAME_WIDTH = 23;
  var FRAME_HEIGHT = 36;
  var SCALE = 1;
  var WORLD_WIDTH = 1254;
  var BASE_MAP_HEIGHT = 1254;
  var ROAD_Y = BASE_MAP_HEIGHT - 59;
  var ROAD_WIDTH = 1086;
  var ROAD_HEIGHT = 158;
  var ROAD_X = (WORLD_WIDTH - ROAD_WIDTH) / 2 + 30;
  var WORLD_HEIGHT = ROAD_Y + ROAD_HEIGHT;
  var ROAD_TREE_X = ROAD_X + 403;
  var ROAD_TREE_Y = ROAD_Y - 29;
  var ROAD_BUS_ROOF_X = ROAD_X + 529;
  var ROAD_BUS_ROOF_Y = ROAD_Y + 4;
  var BUS_INTRO_BUS_BASELINE_Y = ROAD_Y + 130;
  var BUS_INTRO_CAMERA_Y = WORLD_HEIGHT - 240;
  var BUS_INTRO_PLAYER_START_Y = ROAD_Y + 125;
  var BUS_INTRO_PLAYER_END_Y = ROAD_Y + 68;
  var BILLBOARD_X = 402;
  var BILLBOARD_Y = 420;
  var BILLBOARD_SCREEN_X = BILLBOARD_X + 12;
  var BILLBOARD_SCREEN_Y = BILLBOARD_Y + 9;
  var GYM_X = 979;
  var GYM_Y = 442;
  var GYM_ROOF_X = GYM_X + 8;
  var GYM_ROOF_Y = GYM_Y + 5;
  var ZEN_GARDEN_X = 539;
  var ZEN_GARDEN_Y = 420;
  var TORI_X = ZEN_GARDEN_X + 76;
  var TORI_Y = ZEN_GARDEN_Y + 146;
  var HALF_WIDTH = FRAME_WIDTH * SCALE / 2;
  var SPRITE_HEIGHT = FRAME_HEIGHT * SCALE;
  var BOOST_MULTIPLIER = 1.6;
  var BOOST_DURATION = 1e4;
  var RECHARGE_DURATION = 2e4;
  var APOCALYPSE_DURATION = 6e3;
  var SHOW_COLLISION_SHAPES = true;

  // js/bookshop-npcs.ts
  var BOOKSHOP_NPCS = [
    {
      source: "../chat/alex w/map-sprite.png",
      x: 160,
      y: 500,
      width: 56,
      height: 82
    },
    {
      source: "../chat/helen/map-sprite.png",
      x: 350,
      y: 505,
      width: 47,
      height: 84
    }
  ];

  // js/elements.ts
  function requireElement(selector) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Missing required element: ${selector}`);
    return element;
  }

  // js/dom.ts
  var canvas = requireElement("#game");
  var canvasContext = canvas.getContext("2d");
  if (!canvasContext) throw new Error("This browser does not support the 2D canvas context.");
  var context = canvasContext;
  context.imageSmoothingEnabled = false;

  // js/diary-lab-features.ts
  var PHONE_NUMBERS = /* @__PURE__ */ new Set(["2026527772", "07815437754"]);
  var DiaryLabFeatures = class {
    constructor() {
      this.diaryPanel = requireElement("#diary-panel");
      this.unlockForm = requireElement("#diary-unlock-form");
      this.password = requireElement("#diary-password");
      this.unlockMessage = requireElement("#diary-unlock-message");
      this.diaryLink = requireElement("#diary-link");
      this.experimentsPanel = requireElement("#experiments-panel");
      this.lightbox = requireElement("#experiment-lightbox");
      this.lightboxImage = requireElement("#experiment-lightbox-image");
    }
    open(feature) {
      if (feature === "diary") {
        this.experimentsPanel.hidden = true;
        this.resetDiary();
        this.diaryPanel.hidden = false;
        this.password.focus();
        return;
      }
      this.diaryPanel.hidden = true;
      this.experimentsPanel.hidden = false;
    }
    hide() {
      this.diaryPanel.hidden = true;
      this.experimentsPanel.hidden = true;
      if (this.lightbox.open) this.lightbox.close();
      this.lightboxImage.removeAttribute("src");
      this.lightboxImage.alt = "";
      this.resetDiary();
    }
    closeLightbox() {
      if (!this.lightbox.open) return false;
      this.lightbox.close();
      return true;
    }
    bind(onOpen, onClose) {
      requireElement("#noel-read-diary").addEventListener("click", () => onOpen("diary"));
      requireElement("#noel-view-experiments").addEventListener("click", () => onOpen("experiments"));
      this.unlockForm.addEventListener("submit", (event) => this.unlockDiary(event));
      document.querySelectorAll(".internal-feature-close").forEach((button) => {
        button.addEventListener("click", onClose);
      });
      document.querySelectorAll("[data-experiment-src]").forEach((button) => {
        button.addEventListener("click", () => this.openExperimentImage(button));
      });
      requireElement("#experiment-lightbox-close").addEventListener("click", () => this.lightbox.close());
      this.lightbox.addEventListener("click", (event) => {
        if (event.target === this.lightbox) this.lightbox.close();
      });
    }
    resetDiary() {
      this.unlockForm.reset();
      this.unlockMessage.textContent = "";
      this.unlockMessage.classList.remove("success");
      this.diaryLink.hidden = true;
    }
    unlockDiary(event) {
      event.preventDefault();
      const phoneNumber = this.password.value.replace(/\D/g, "");
      if (!PHONE_NUMBERS.has(phoneNumber)) {
        this.unlockMessage.textContent = "That isn't Max's phone number.";
        this.unlockMessage.classList.remove("success");
        this.diaryLink.hidden = true;
        this.password.select();
        return;
      }
      this.unlockMessage.textContent = "Diary unlocked.";
      this.unlockMessage.classList.add("success");
      this.diaryLink.hidden = false;
      this.diaryLink.focus();
    }
    openExperimentImage(button) {
      const source = button.dataset.experimentSrc;
      const thumbnail = button.querySelector("img");
      if (!source || !thumbnail) return;
      this.lightboxImage.src = source;
      this.lightboxImage.alt = thumbnail.alt;
      this.lightbox.showModal();
    }
  };

  // js/julian-dialogue.ts
  var JULIAN_DIALOGUE_LINES = [
    "Julian here. You always know how to make an entrance, Max.",
    "You're back. Did the suspiciously powerful sandwich work?",
    "Three conversations? We're basically best friends now."
  ];

  // js/tim-dialogue.ts
  var TIM_DIALOGUE_LINES = [
    "Julian here. You always know how to make an entrance, Max.",
    "You're back. Did the suspiciously powerful sandwich work?",
    "Three conversations? We're basically best friends now."
  ];

  // js/site-assets.ts
  function resolveSiteAsset(path) {
    const bundleScript = document.querySelector('script[src*="dist/"]');
    const siteRoot = bundleScript?.src ? new URL("../", bundleScript.src) : new URL("./", document.baseURI);
    return new URL(path, siteRoot).href;
  }

  // js/inventory-gifts.ts
  var GIFT_LINES = [
    "Here. You\u2019ll need this.",
    "This is for you.",
    "You\u2019ll make better use of this.",
    "Found this. Figured you could use it.",
    "Hold onto this for me.",
    "Here, catch.",
    "This might come in handy.",
    "Here. Don\u2019t lose it.",
    "Take this and get out of here."
  ];
  var JULIAN_ITEM = {
    id: "julian-item",
    name: "Julian's item",
    imageSource: "chat/julian/item.png",
    description: "The world opens up."
  };
  var TIM_ITEM = {
    id: "tim-item",
    name: "Tim's item",
    imageSource: "chat/tim/item.png",
    description: "Face implodes."
  };
  var LUCY_ITEM = {
    id: "lucy-item",
    name: "Lucy's item",
    imageSource: "chat/lucy/item.png",
    description: "World spins around and around."
  };
  var PORTABLE_WALKMAN = {
    id: "portable-walkman",
    name: "Portable walkman",
    imageSource: "img/portable-walkman.png",
    description: "You can now play music.",
    hiddenFromInventory: true
  };
  var GEORGIA_ITEM = {
    id: "georgia-item",
    name: "Georgia's item",
    imageSource: "chat/georgia/item.png",
    description: "Creates the apocalypse."
  };
  var ANDY_ITEM = {
    id: "andy-item",
    name: "Andy's item",
    imageSource: "chat/andy/item.png",
    description: "Creates the apocalypse."
  };
  var REI_ITEM = {
    id: "rei-item",
    name: "Rei's item",
    imageSource: "chat/rei/player/item.png",
    description: "Makes the protagonist move 20% faster."
  };
  var INVENTORY_GIFTS_KEY = "max-game:inventory-gifts";
  var GIFT_LINE_INDEX_KEY = "max-game:gift-line-index";
  var ITEM_RECEIVED_OVERLAY_DURATION = 3200;
  function showItemReceivedOverlay(item) {
    const gameShell2 = document.querySelector(".game-shell");
    if (!gameShell2) return;
    const overlay = document.createElement("div");
    overlay.className = "quest-accepted-overlay item-received-overlay";
    overlay.setAttribute("aria-label", `${item.name} added to inventory`);
    const image = document.createElement("img");
    image.src = resolveSiteAsset(item.imageSource);
    image.alt = item.name;
    overlay.append(image);
    gameShell2.append(overlay);
    window.setTimeout(() => overlay.remove(), ITEM_RECEIVED_OVERLAY_DURATION);
  }
  var GIFT_ITEMS = [
    {
      id: "mike-item",
      name: "Mike's item",
      imageSource: "chat/mike/item.png",
      description: "Makes the protagonist 36% happier."
    },
    {
      id: "alex-s-item",
      name: "Alex S's item",
      imageSource: "chat/alex s/item.png",
      description: "Creates the apocalypse."
    },
    {
      id: "katy-item",
      name: "Katy's item",
      imageSource: "chat/katy/item.png",
      description: "Character trips over occasionally"
    },
    LUCY_ITEM,
    JULIAN_ITEM,
    TIM_ITEM,
    PORTABLE_WALKMAN,
    GEORGIA_ITEM,
    ANDY_ITEM,
    REI_ITEM
  ];
  function readGiftIds() {
    try {
      const value = JSON.parse(window.localStorage.getItem(INVENTORY_GIFTS_KEY) ?? "[]");
      return Array.isArray(value) ? value.filter((id) => typeof id === "string") : [];
    } catch {
      return [];
    }
  }
  function writeGiftIds(ids) {
    try {
      window.localStorage.setItem(INVENTORY_GIFTS_KEY, JSON.stringify(ids));
    } catch {
    }
  }
  function hasGift(item) {
    return readGiftIds().includes(item.id);
  }
  function addGift(item) {
    const ids = readGiftIds();
    if (ids.includes(item.id)) return false;
    writeGiftIds([...ids, item.id]);
    showItemReceivedOverlay(item);
    window.dispatchEvent(new CustomEvent("max-game:inventory-gift-added", { detail: item }));
    return true;
  }
  function removeGift(item) {
    writeGiftIds(readGiftIds().filter((id) => id !== item.id));
    window.dispatchEvent(new Event("max-game:inventory-gift-removed"));
  }
  function nextGiftLine() {
    let index = 0;
    try {
      const stored = Number.parseInt(window.localStorage.getItem(GIFT_LINE_INDEX_KEY) ?? "0", 10);
      index = Number.isFinite(stored) && stored >= 0 ? stored % GIFT_LINES.length : 0;
      window.localStorage.setItem(GIFT_LINE_INDEX_KEY, String((index + 1) % GIFT_LINES.length));
    } catch {
    }
    return GIFT_LINES[index] ?? GIFT_LINES[0];
  }
  function getCollectedGifts() {
    const ids = readGiftIds();
    return GIFT_ITEMS.filter((item) => ids.includes(item.id) && !item.hiddenFromInventory);
  }

  // js/workout-gallery.ts
  var WORKOUT_IMAGE_SOURCES = [
    "https://lh3.googleusercontent.com/pw/AP1GczPIj4FDDAnGuV7vTNyJ4G7GF98MVyefBUHpBFXCHRHnyiUWR6riy_QrVBMuoGPjLDDQom1ree-2wWeRSoqT8fDQrPHfQEurkFKmfQsr6tw1E7Qi1n9C",
    "https://lh3.googleusercontent.com/pw/AP1GczM5HVtUGjB4LzG57uJ98eXWiF_jw16Ozp6pp5R-vgJKYiZ2v7osCgg90lJQxcc7kPUOFSlyuvBAtyGsqOCkrSLRXjuV-hVeJQrb049pOsq5HUl_s-3h",
    "https://lh3.googleusercontent.com/pw/AP1GczNM_KvML9BUxc6teKxa8xRE9OqgcP_EM5EOkSFtNC6tQaBBj97rl3wr1zK1qxGoK6w8PFp4ioRyJKdNVOADvTYT_5O1GpWCI2ovRgt912uBjkxy6C0p",
    "https://lh3.googleusercontent.com/pw/AP1GczN459two3DtG6wp4AZtzKuvIBFBvHezIlLuapkXl_KsuubkBHgrrbA6RnjovExrD29TbgkQ12aVaLn9AR-gIpMeXC2fNHlc168XfUl-Qb6HXRZcWyT-",
    "https://lh3.googleusercontent.com/pw/AP1GczMc5jAKewPidrvk-Tq2wfZpgRXcpOYnmAr3UqyDJTt-UOygnsCPVWF6zCnFYR-k2d4JLTVdLSnOidZ67c4F3YptkrPXNLrDjpO4FWIIFc-u0v0QfSBu",
    "https://lh3.googleusercontent.com/pw/AP1GczMaJ_FVlgqH65d7aL8E1Zu42MC5WOyG79YW8YrjLY-XTqdDS6bCKquK3jvR9z7_3oOnpPeX791Id2joqkXMKKsxP1q87zzpCkybVLvthRcuUPyRA9NE",
    "https://lh3.googleusercontent.com/pw/AP1GczMiJK72oOLD1fiUEOgsxCLZy26dpInKMDJ6noncaVHGVFdZBHqRLcdYDrgEv-72BstLbBLF0A_QTYcAiDcZdUdh5UFjQkOBiniCzSeUUv_BAlw30b3y",
    "https://lh3.googleusercontent.com/pw/AP1GczM9ECpvYxtgqi_opGN0rOvu2f7dXMrfyLSEBh9HiFcr54XKbQI9DhRIYlWplaRhDzwEkdJWw38H3Dv1NXePGl_DBMlNytD8S2Plk_1GVW7tkt99IZLs",
    "https://lh3.googleusercontent.com/pw/AP1GczOGzVfrkD6h3K1q24mReYfmfTcqJCdEHF9QIpwPrTwdrbrVQ7nIgSG6mUMoknLVf-Q0CdfjqMKzKOC9FOPc8jTAxNEFg23bOQJyjSrybmjjj7DWOoqn",
    "https://lh3.googleusercontent.com/pw/AP1GczMynUJVELSonM0yQJZFAngz2dOdFJgguErAP-ix811hEgJNBsCVHloLWCJAoMKh5zq6IiBpxCSbrNazbL_AVziIlHO52hFWlPE4rkjJFnX36xlKPkLy",
    "https://lh3.googleusercontent.com/pw/AP1GczP0gDCVzIPUL_GwSqPt0zbFnyG0cvg1npxWE9KPfeR9YDd7Y6d0U-GabTnR_9zmDEoKMhB_srRq5VvKiGBmw-LAS6XBE9DgC_YB3H_RInV7xlW2Gp91",
    "https://lh3.googleusercontent.com/pw/AP1GczOblKfLKVCPE-vIlKdMZ8G4P4NREYKrLI5SOPDwuYKVgc1cBKlspgdl6odKMUcb6g28SV-kpHnIdKHHgeMUXyEBF0raAuiIIvdVsXaCEuhj0iI-8Cs6",
    "https://lh3.googleusercontent.com/pw/AP1GczN0y6VGO8fjoiTqUtWDHqND92iANS-XD30uAAPkOxpIPFWbOiPqIKBeLj4vlsxvXuPz661FDauqkeIO1RekfKHG01LMFRIX0wr_T6NPU_jBF5Na5E_k",
    "https://lh3.googleusercontent.com/pw/AP1GczOFAYhkh7lfXt_GYb4FsJBC-CzugEq_c82HGPP4XkTWgcToZaW7N6eEuwJNMlMw4rmFMuCDtUCdmdT27ZSrYnudennVz2iAm_1TUURBxxjEQV36sKj7",
    "https://lh3.googleusercontent.com/pw/AP1GczMIiJQQiGtIwalVi8BTBf6qOSFWFq9wa-_yKs14oyTtZDfQMR_GMUBYKeASE9l98ekuyKy3e_Xyg1jRsF9EY97uW1UBCW-Tdyl7asPnvs-zdOtTx9GP",
    "https://lh3.googleusercontent.com/pw/AP1GczOUGZ2KPZlrtAP_cwH2rJ8pHNakxdLgYj_fDedF8ipMiNtHJ8QWuBlV61ZYRBqdVQ-SPhFhdOmHaYABA17SlZMtOPmpz-HHjmp-nJZBbg4WSWFdPY7R",
    "https://lh3.googleusercontent.com/pw/AP1GczNopeIpj93wbxXOkPFpYwGbsVD2eOc96UeuzN3nwaPsivG0EfEy72PV2uH7Vvl8kLWTCAgHcJpgk5B3aotyIGDnbCnofYEesuxt-npBGSproeDaVV1c",
    "https://lh3.googleusercontent.com/pw/AP1GczMmuGaqjCiKz8dc1ZaY9IgiMO7k15GnJUGjhaL_oVtil-lu0wD5qpojuEF8UqgmYzBlNq56DNCJQoahtM5u_lI508i8lvdh28cgsQHUBFCkS--YCekn",
    "https://lh3.googleusercontent.com/pw/AP1GczM712DrdbjyiQ2LmLJN1Jpt0DQjKtjQ-B8WGy2sgDCvepFf1D_LA4HmVmdVrqr_3RtcD7aS0XIlu4d6HgpyUQv_n9R5u2o0WQuWwpxBSHlv7XLZ1EEk",
    "https://lh3.googleusercontent.com/pw/AP1GczPYIUTj5RI4YMx6C1FOncfxAvF2GhlZsoDMScmKDyzV5c1z9zH44Ucreip43lar1NNbdoT8HiZ1icL_cLOfKUb9BrJpOhzm-VT1Cv1tAr6257g9c4OW",
    "https://lh3.googleusercontent.com/pw/AP1GczNlP0g1NakFoi6PdNJcLewmSL4K46x_tx7qokj9AwCacG4-SWBywYGHsFBfoz8XCUP3QZCHUyGHLPeIZ4q83PTnoz2M3fn7DhPoUE2PIFL9mzXE54Fk",
    "https://lh3.googleusercontent.com/pw/AP1GczMQjjysnDvo_YBneHw9WPbjW02jk28FYqnDpyMLXy1LNLUjA2HWtdEcD7XyxifZYQXjifHGbKj7Q6N1-Q7ylSU87To3xm_aAkHdDJl7_TQm2odrKMHY",
    "https://lh3.googleusercontent.com/pw/AP1GczNAo3XhnT8UJfsdv-d5yeGZ_0wf3nUdls17cKivLhjhrpXTuNz_o3l2WfN5-GLYNUrdLItOne8PM3tO90rDhH9GB-oxtGomiQVD3Gol8lPgGXsCTCeI",
    "https://lh3.googleusercontent.com/pw/AP1GczMHvhYWIx8iDaO0QwUNcMAqugGlXX0eMT2qyFNgS0lmZmUddILlWPu1D0JVPWxRRvyARsT4aYo1k_VQLW-18iRYCrYzoeL4WjiRY56e3RsepGphSHt1",
    "https://lh3.googleusercontent.com/pw/AP1GczNx8n-lMDqYUdLWCW4SVd2rWgklMV5DP3Bl-oV3F0y94dORAIgvleSdojEEsfvmEz1iwKR0gMfOD-6RDGgvTlCdfdWVxr_30h4RYiCmZbbVtlBBVwy5",
    "https://lh3.googleusercontent.com/pw/AP1GczOZQkm63AYQZp2VUQklMFp43DIPk1Uyc_ZF0auOaUtp3Y8090teY4iTl_9XT6ircsZKPvLhyw3UgT5E7gVLEkIbisudr-iOpWLbQtX8oUjSr2_bgRwD",
    "https://lh3.googleusercontent.com/pw/AP1GczO2Zf7Ukw2eulc_dDXrSjcDM3_vF1iVeOdsLF_JsVuDRZlMrmvsbRRfwmgP7tvRRbmKKWP5MXCnf0GodV-z7hasmqhaeH1N3n5EwnDc8r6CLKdhYEfh",
    "https://lh3.googleusercontent.com/pw/AP1GczP4kgZXtDM7V7j4iOhIZ03kbNrQ1hASVfUz6VJasLun1vXyCFwp47x9gB-iRqwo1KHJlU4xYCcOc5lm-Gkm6qtapUi4dHh_PJYMcXfq6cLYZdizjELF",
    "https://lh3.googleusercontent.com/pw/AP1GczPkNP58bICsXbWBzkzvUZuLJFVVbIYhSgGxHJRDJPg7UVE5uRDhGqlCdYZwZpgQ_oSQk8wfvVKkH6hf46UQGSYSGmEAbf869pIPoHG7N6XHyRcdinn-",
    "https://lh3.googleusercontent.com/pw/AP1GczMGAHJAZD88uKNKJMokPoBaD3pPiba0n_cioO0Qq4Xk8awJ9FP5WWu_XxWnenLpBIo3nzsGmMzGLhYvnpz7VG7VWfXBTiECTdCL_KNgvYVcFg-HDa_J",
    "https://lh3.googleusercontent.com/pw/AP1GczNz8AtauWZ6MtxKXMYFyR3fz0na1ihskrtR9S7P-WXuyAincdkhHJLk-Cgo7TlQa_lb4iASn037pDRFSrmjMNqTvs75Qq5R9oN07EsLUkDdsnVsV5CJ",
    "https://lh3.googleusercontent.com/pw/AP1GczPjQ4CvX8B_wKo9dmOFCwjwMzL8sWwEKFPRaYOni3n_cd-mDhr2NMrkjINK1mwsr08W4F6QB3RfTrmuV6JDEFTesfJ7xTsDFpx2L9flQjJ4zf5m2Kl8",
    "https://lh3.googleusercontent.com/pw/AP1GczPuuifYVw_ibTiYZiMVOPjD-k8jAu51u870-l9hYFymV7-Vts0RD87JP9s8RIuyo4G_fn2YrDUMMMbVMpjua3k2jZewZ7SUhV5FHeZ2zILjRUhhFgBy",
    "https://lh3.googleusercontent.com/pw/AP1GczPiOJ7et9snkNUvPq3oQAOqGswElvf-Haqp6fJ44Bgqt_mbNSRTlljkyqelYF_7jQm3O4jjUYfajy1ybflZjnOacG8LPsX9um2XCRrNo4Bt3iMPaKCj",
    "https://lh3.googleusercontent.com/pw/AP1GczO_g7TWvOFh1S6mIBalGh_eJZ1dp_Fah7xtmD-XSZB5zfqUA9bSZH-HsRgsMS-_RjKWw_8tdc8QJXC7Von3tpWyCE2Yp8MHDN4LCid5wGYow_RxnBwi",
    "https://lh3.googleusercontent.com/pw/AP1GczM7DhJet_U57XpnrG7qXD1Q7D1NluN4dgNG2AGokcpgkwNj8TF05UNDMp6UX_55zRqWlDASr1s-gGWabtSB2-0WLml3AS1GPgGTE1uI6-Aq7pmVXX36",
    "https://lh3.googleusercontent.com/pw/AP1GczNpY0VKoTN1-jyW6WBYCLtROjIW_5fN7KfBRJbMP5x_XLmMZxR7w3oIO51_8qhsnFHfBIFjV-DZZ870Tm3Ce2QYLYGX82qjH12q8O-WB4AC6Mp1az8m",
    "https://lh3.googleusercontent.com/pw/AP1GczNfoRurdJubOYMiOyePlq9d7sKEyYqs4ToYF0XSch-CNkP3NuPotpKuunaiiNJsz2XPQH1kRDbLUSyKq0R8BZOusuYhGX402Wt645KMZoVcZyags_lh",
    "https://lh3.googleusercontent.com/pw/AP1GczOPauf9QN4W3CLyuXyYFS49kGmQwXlcVtLXeOn4I4SsdLSCRlKtHetaDXfPSPjxAxhuno80p5NH1W01nIHCojrKz6CDHSpDxqD04rIUfKwqeCVsT7qN",
    "https://lh3.googleusercontent.com/pw/AP1GczM2isd2mY0M0it9LkNYmMSwdqM1jdKWp5-A1jPCY9HzffyUJfBVa3QKdBYt0nKQHd7add9hw2kaUAIHTKrMCzGdiIZUW-31Y2NZq3Bv2egzFXEBfMw1",
    "https://lh3.googleusercontent.com/pw/AP1GczPD7g5u_4XUVPbUbzmnSIaPxpSm4YVjc1MOE7ijqFpbdGCvGJ33ajEEw68y_fiD9ABEIoaV9CxMCZq-kIekk4BaNc9ZZewZvaSJM9B9RLxp60yH8MNV",
    "https://lh3.googleusercontent.com/pw/AP1GczOZlDa3nycs3wKhOcbhn6dXDos0ZoIHyaIQgE6-Z32WIHQ6u36chgAbNDIAOHUtz4JSh5XOWwtz9mCg0V293TgGmr6STezb5kd7Jm3AphKgz--sw-Et",
    "https://lh3.googleusercontent.com/pw/AP1GczN2tHOcnS7VoYhJHk6vvC-CfLh1hHX9skYOfhhDUEJXKvTK4gaRcv6vfHNbQnw5nQG9XEzTRn65eVu0P_k01VXSCNghY_7xkRICNUuJhzhs2eO2pYfB",
    "https://lh3.googleusercontent.com/pw/AP1GczMSHAL2ch_-72CGf9y_L5CQnR4Aqxcf7fdJmmum2WP1JCHS4Gs-EWDHVaicwtMiLYFTPc4kMGUDRtbYqv6lOPUR0fIRCWsQ4Ngk5l2dIxfcRV8KJfXX",
    "https://lh3.googleusercontent.com/pw/AP1GczM1ZKeSiEtgnE_lad7CSxNs4T7l9nuPrTIS_ErQRa4in-H_RWXgfGGZ4Cnk9KBvUC_h2hfkIDNug8z9dIqtMtCS_MP61ST2vCLjf0T4ChcSAMEwCOSH",
    "https://lh3.googleusercontent.com/pw/AP1GczOACoHdqc9lfxUf-CfFAlr7T2vsJ-hBSbwP0_E3ndJTwWurEZmaifDAN12BKejuDg0i_SlalmJTDgCnyU8wv7iCDV7kI3C7L8LLFBg1K8lu92atykU1",
    "https://lh3.googleusercontent.com/pw/AP1GczPKTs0lPEvA6RWQCGg1Hc7auikynxcT7IblXNgkSkz-j7bbFOSPYdR2c16bGKCuq6i3ed63gMnW_jLM5sl7O7qXYITTmn-yG4P-OzRd4qymRJDpClpd",
    "https://lh3.googleusercontent.com/pw/AP1GczPPW9RpAMEAAYXQ7UorpHgnawE7Zy55cEKKt5Bx6hMPAdWkwa_g86k8MWDtYsBc3rAIkN8pxG8UixIaBgZ99Vk2y5-pXnN8LyIGNm41yVsHdC1gCpxN",
    "https://lh3.googleusercontent.com/pw/AP1GczOXq59CUnDuJhL4AwrALsvg4y_HI3PuJZK9U6jbdKHjEp1qzTlmcXzL30wyoqU755IAHvhrb7VkiJZpZyfbNhUedXp_hiEOFO1xIiWcaleYJAD2E-Js",
    "https://lh3.googleusercontent.com/pw/AP1GczNfDJr3d9IekyYK-2BJrYXFPzGhBeSoD-LyDJ1-hbmfxRb5lTLt8nhqlaCY9Lh7Hm5PAXy8pvKWG2WpcQBtW_RqzywsMTpkWDGdRs1Dllgg5eRp0ZXr",
    "https://lh3.googleusercontent.com/pw/AP1GczNkI2ftph_IPWH0fVdyRKqZ-ZaeISVM7sqnMXvY79MDggiyXfGA9W5xNFNwGJf8CYo0DnD_XKMqcqjdCrovNA4xbnFxMGTK99cYaNTJaWwP2gCIDVmD",
    "https://lh3.googleusercontent.com/pw/AP1GczOrCmXt0n7-x-yQow98XWpQtiCwhn_9UUbvldxp-84OOtPJac0PEQjAf6k9lpPwk5SSecByd7U7qfknJAS2jJTYu2QruXOkLbWG-qeEJq_cu5tbG1ML",
    "https://lh3.googleusercontent.com/pw/AP1GczNq_PoGV4TkmJLcajN25tF-2YSv6Mv9_UmcrpcC53Shh0aSHTiNV9ywhRw70kEfykWfCc9xRYw1pQPZ0uDN_qyYXJpenzjF8P2qcC_NLDutGKRjg4Hf",
    "https://lh3.googleusercontent.com/pw/AP1GczPZsTCXT9sOLivW6H-wEowhZgzrXyB-qq-NNKzAX1QdQ5hLFlXZ0bOR_QbTB0GJ6FZIC9qql-rg8Wf8kYyeJG8X_Cv4FZDYrvOoDNKQxrzwJqxEiv58",
    "https://lh3.googleusercontent.com/pw/AP1GczOpDqV-bg-Agu-xC7xEX7itlRFHUG-_4KiIkDEigWff2uYqUT8LvaiE9Ths9EMDPfx2AZk_ooWTagqsh_xQfLDI5f48EwkB4stvtpqtWE-P8Xd4KtcG",
    "https://lh3.googleusercontent.com/pw/AP1GczMBLUYPUxQxx7MFKN0BtvYlmdAiB39m5YHsPBeZAPQDYzDgiS5tIGaDPBOwdz9JMOgRwnn0N1Hv3kAIabevbH5_MW2kSAdId69VbAJ-RO2yTe2hgzFB",
    "https://lh3.googleusercontent.com/pw/AP1GczPbF83t2FJx5TlwDJe_J34fugGefvehr1mrqCGU6RrDVjcRsE0bIRu8FHjk-59UL-B6qCafX_eExuPpev_pKYu_vkLHIrWRP8we2xvYESEDujaE9ean",
    "https://lh3.googleusercontent.com/pw/AP1GczOV6Mz0EcGR1K-RKFOfCV1Bkvf1x9gELc9zb04_GZOdVXS3wayEjZr8rBQpDdE-SiVv648bMP8vv3rRBdmSqIWHHKr7uBaJIibA0U8ycfvVjELt6UCJ",
    "https://lh3.googleusercontent.com/pw/AP1GczOB2lhnsO2MMCuX9E-z4Pe1ymmivarE1V_i08sOAG8nanogaomvuY_3i8Q6avycsu93BJxj2BLFkWo1zlEpfvJ9PFfS0CFz018Za5IyTHoh9aYmzLL-",
    "https://lh3.googleusercontent.com/pw/AP1GczNBqlr2pQhWOEVh3EHcg0-MlKhPuqX5t3k4XDoe4PlAi1WIxUM4Ibnhf7j9xBy5S99NKAEg1mGn6C-hgWC9m7yjXuTUk0UkjSNkdBBMY5ObJjq6jHGX",
    "https://lh3.googleusercontent.com/pw/AP1GczPWoH9HzZotXMbrz6-eeoWgfMQ_Eh2DXUBQeNQ1OYUOpH0LkG-LGt2A1EHX-TCzZhOfMuFOK4RXi_LwPD4p5YfCM9WsbZyY13dm7UFGmOz7TGXMTA6R",
    "https://lh3.googleusercontent.com/pw/AP1GczO7wokhhQEjBZAs0AFHhkniAFJwrCOCVl1kt1Xl7R8cDw3TvM1X5_1zzwPqoUKCxtO_SkiqC4AalYMnNkXKZW5GyaytvW0C5AqAEPcir3WWqvjSAogd",
    "https://lh3.googleusercontent.com/pw/AP1GczNFEVDQoZkD-hslvJLZryPCOd34m-VmljWTUYlRIaE8ZJ1fLXZ3OXYehCe-Ikzw-pOpYfsrxvr31LkMSF0d6dkZlQCpJ07JzMCJwhCO4M0xMQeFLRox",
    "https://lh3.googleusercontent.com/pw/AP1GczMxIsuXVVSXFvnawKeeFbC61S6D0sYE_nfQWSUC7gJJyUBqoWG6Nnv69ACVWZltT-xe9riiYyiAvuwUTv9QajsLDAijjQMVftgrfpwS2-z5t-EZI17b",
    "https://lh3.googleusercontent.com/pw/AP1GczN1oSA8DPZplFNeXiwyJHjMpb7-Lzzf7tmRJpeL28s0WyNHG7hWrDD2wh8o0QUO8rqz_Fiv14PIH_OXVgTDcDWqm3ffNFabhjJ43Xtjz-v-L9EC9s_v",
    "https://lh3.googleusercontent.com/pw/AP1GczP5opSduWodxR9v3VB4ARASncjepqhXW3BUk6ASuOJETHcSpxjscnevasV81wPYdugHUnrt1pPG2KM7p91atcJqx19CZzWGtixkRu80v7kvckHFBA7d"
  ];
  var thumbnailSource = (source) => `${source}=w480-h360-c`;
  var fullSource = (source) => `${source}=w1800-h1800`;
  var WorkoutGalleryController = class {
    constructor(onClose) {
      this.onClose = onClose;
      this.panel = requireElement("#tim-workout-journal-panel");
      this.gallery = requireElement("#workout-gallery");
      this.closeButton = requireElement("#tim-workout-journal-close");
      this.lightbox = requireElement("#workout-lightbox");
      this.lightboxImage = requireElement("#workout-lightbox-image");
      this.counter = requireElement("#workout-lightbox-counter");
      this.lightboxClose = requireElement("#workout-lightbox-close");
      this.previousButton = requireElement("#workout-lightbox-previous");
      this.nextButton = requireElement("#workout-lightbox-next");
      this.currentIndex = 0;
      this.buildThumbnails();
      this.closeButton.addEventListener("click", () => this.closePanel());
      this.lightboxClose.addEventListener("click", () => this.closeLightbox());
      this.previousButton.addEventListener("click", () => this.showImage(this.currentIndex - 1));
      this.nextButton.addEventListener("click", () => this.showImage(this.currentIndex + 1));
      this.lightbox.addEventListener("click", (event) => {
        if (event.target === this.lightbox) this.closeLightbox();
      });
      window.addEventListener("keydown", (event) => this.handleKeydown(event));
    }
    open() {
      this.panel.hidden = false;
      this.gallery.querySelector("button")?.focus();
    }
    hide() {
      this.panel.hidden = true;
      if (this.lightbox.open) this.lightbox.close();
    }
    buildThumbnails() {
      WORKOUT_IMAGE_SOURCES.forEach((source, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("aria-label", `View workout image ${index + 1} full screen`);
        const image = document.createElement("img");
        image.src = thumbnailSource(source);
        image.alt = `Workout ${index + 1}`;
        image.loading = "lazy";
        image.referrerPolicy = "no-referrer";
        button.append(image);
        button.addEventListener("click", () => this.showImage(index));
        this.gallery.append(button);
      });
    }
    showImage(index) {
      this.currentIndex = (index + WORKOUT_IMAGE_SOURCES.length) % WORKOUT_IMAGE_SOURCES.length;
      this.lightboxImage.src = fullSource(WORKOUT_IMAGE_SOURCES[this.currentIndex]);
      this.lightboxImage.alt = `Workout ${this.currentIndex + 1}`;
      this.counter.textContent = `${this.currentIndex + 1} / ${WORKOUT_IMAGE_SOURCES.length}`;
      if (!this.lightbox.open) this.lightbox.showModal();
    }
    closeLightbox() {
      this.lightbox.close();
      this.gallery.querySelectorAll("button")[this.currentIndex]?.focus();
    }
    closePanel() {
      this.hide();
      this.onClose();
    }
    handleKeydown(event) {
      if (this.lightbox.open && event.code === "ArrowLeft") {
        event.preventDefault();
        this.showImage(this.currentIndex - 1);
      } else if (this.lightbox.open && event.code === "ArrowRight") {
        event.preventDefault();
        this.showImage(this.currentIndex + 1);
      } else if (event.code === "Escape" && this.lightbox.open) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.closeLightbox();
      } else if (event.code === "Escape" && !this.panel.hidden) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.closePanel();
      }
    }
  };

  // js/gym-npc-dialogue.ts
  var GYM_NPC_CHATS = {
    julian: {
      id: "julian",
      name: "Julian",
      dialogueLines: JULIAN_DIALOGUE_LINES,
      item: JULIAN_ITEM
    },
    tim: {
      id: "tim",
      name: "Tim",
      dialogueLines: TIM_DIALOGUE_LINES,
      profileSource: "../chat/tim/profile.png",
      item: TIM_ITEM
    }
  };
  var GymNpcDialogueController = class {
    constructor(line, nextButton, progress, confirmation) {
      this.line = line;
      this.nextButton = nextButton;
      this.progress = progress;
      this.confirmation = confirmation;
      this.active = null;
      this.lineIndex = 0;
      this.pendingGiftLine = null;
      this.journalOfferPending = false;
      this.journalOptions = document.querySelector("#tim-workout-journal-options");
      this.dialogue = document.querySelector("#noel-dialogue");
      this.workoutGallery = new WorkoutGalleryController(() => {
        if (this.dialogue) this.dialogue.hidden = false;
        this.giveGift();
      });
      document.querySelector("#tim-workout-journal-yas")?.addEventListener("click", () => this.showJournal());
      document.querySelector("#tim-workout-journal-neh")?.addEventListener("click", () => this.giveGift());
    }
    start(id) {
      const npc = GYM_NPC_CHATS[id];
      this.active = npc;
      this.lineIndex = this.nextLineIndex(npc);
      this.pendingGiftLine = hasGift(npc.item) ? null : nextGiftLine();
      this.journalOfferPending = id === "julian" && this.pendingGiftLine !== null;
      if (this.journalOptions) this.journalOptions.hidden = true;
      this.workoutGallery.hide();
      this.confirmation.hidden = true;
      this.showLine();
      return npc;
    }
    next() {
      if (!this.active) return;
      if (this.journalOfferPending) {
        this.journalOfferPending = false;
        this.line.textContent = "hey wanna see Max's work out journal";
        this.progress.hidden = true;
        this.nextButton.hidden = true;
        if (this.journalOptions) this.journalOptions.hidden = false;
        return;
      }
      if (this.pendingGiftLine) {
        this.giveGift();
        return;
      }
      if (this.active.dialogueLines.length < 2) return;
      this.lineIndex = (this.lineIndex + 1) % this.active.dialogueLines.length;
      this.showLine();
    }
    stop() {
      this.active = null;
      this.pendingGiftLine = null;
      this.journalOfferPending = false;
      if (this.journalOptions) this.journalOptions.hidden = true;
      this.workoutGallery.hide();
      this.confirmation.hidden = true;
      this.progress.hidden = true;
    }
    nextLineIndex(npc) {
      if (npc.dialogueLines.length === 0) return 0;
      const key = `max-game:${npc.id}-dialogue-index`;
      const stored = Number.parseInt(readStorage(key) ?? "0", 10);
      const index = Number.isFinite(stored) && stored >= 0 ? stored % npc.dialogueLines.length : 0;
      writeStorage(key, String((index + 1) % npc.dialogueLines.length));
      return index;
    }
    showLine() {
      if (!this.active) return;
      this.line.textContent = this.active.dialogueLines[this.lineIndex] ?? "";
      this.progress.textContent = `${this.lineIndex + 1}/${this.active.dialogueLines.length}`;
      this.progress.hidden = this.active.dialogueLines.length === 0;
      this.nextButton.hidden = this.pendingGiftLine === null && this.active.dialogueLines.length <= 1;
    }
    showJournal() {
      if (this.journalOptions) this.journalOptions.hidden = true;
      if (this.dialogue) this.dialogue.hidden = true;
      this.workoutGallery.open();
    }
    giveGift() {
      if (!this.active || !this.pendingGiftLine) return;
      if (this.journalOptions) this.journalOptions.hidden = true;
      this.line.textContent = this.pendingGiftLine;
      this.pendingGiftLine = null;
      const added = addGift(this.active.item);
      this.progress.hidden = true;
      this.confirmation.textContent = added ? "An item has been added to your inventory." : "";
      this.confirmation.hidden = !added;
      this.nextButton.hidden = true;
    }
  };

  // js/input.ts
  var DIRECTION_CODES = {
    ArrowUp: "up",
    KeyW: "up",
    ArrowDown: "down",
    KeyS: "down",
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right"
  };
  function parseDirections(button) {
    const directions = button.dataset.directions;
    if (!directions) return [];
    return directions.split(" ").filter((value) => value === "up" || value === "down" || value === "left" || value === "right");
  }
  var DirectionInputController = class {
    constructor(options = {}) {
      this.options = options;
      this.heldDirections = /* @__PURE__ */ new Map();
      this.heldCodes = /* @__PURE__ */ new Set();
      this.releaseButtonHandlers = [];
    }
    isHeld(direction) {
      return this.heldDirections.has(direction);
    }
    releaseAll() {
      this.heldCodes.clear();
      this.heldDirections.clear();
      this.releaseButtonHandlers.forEach((release) => release());
    }
    setup() {
      document.querySelectorAll(".dpad-button").forEach((button) => this.bindDpadButton(button));
      window.addEventListener("keydown", (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey) {
          this.releaseAll();
          return;
        }
        if (!DIRECTION_CODES[event.code]) return;
        event.preventDefault();
        this.pressCode(event.code);
      });
      window.addEventListener("keyup", (event) => this.releaseCode(event.code));
      window.addEventListener("blur", () => this.releaseAll());
    }
    holdDirection(direction) {
      if (this.options.canHold && !this.options.canHold()) return;
      this.heldDirections.set(direction, (this.heldDirections.get(direction) ?? 0) + 1);
    }
    releaseDirection(direction) {
      const remaining = (this.heldDirections.get(direction) ?? 0) - 1;
      if (remaining > 0) this.heldDirections.set(direction, remaining);
      else this.heldDirections.delete(direction);
    }
    pressCode(code) {
      const direction = DIRECTION_CODES[code];
      if (!direction || this.heldCodes.has(code)) return;
      this.heldCodes.add(code);
      this.holdDirection(direction);
    }
    releaseCode(code) {
      const direction = DIRECTION_CODES[code];
      if (!direction || !this.heldCodes.delete(code)) return;
      this.releaseDirection(direction);
    }
    bindDpadButton(button) {
      const directions = parseDirections(button);
      let heldPointerId = null;
      let pressed = false;
      const press = () => {
        if (pressed) return;
        pressed = true;
        directions.forEach((direction) => this.holdDirection(direction));
        button.classList.add("pressed");
      };
      const release = () => {
        if (!pressed) return;
        pressed = false;
        directions.forEach((direction) => this.releaseDirection(direction));
        button.classList.remove("pressed");
      };
      this.releaseButtonHandlers.push(release);
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        heldPointerId = event.pointerId;
        press();
        try {
          button.setPointerCapture(event.pointerId);
        } catch {
        }
      });
      ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => {
        button.addEventListener(type, (event) => {
          event.preventDefault();
          heldPointerId = null;
          release();
        });
      });
      button.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (!event.repeat) press();
      });
      button.addEventListener("keyup", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        release();
      });
      button.addEventListener("blur", () => {
        if (heldPointerId === null) release();
      });
    }
  };
  var overworldInput = new DirectionInputController();
  var isHeld = (direction) => overworldInput.isHeld(direction);
  var releaseAllInput = () => overworldInput.releaseAll();

  // js/cinema-collision-mask.ts
  var CINEMA_COLLISION_CELL_SIZE = 2;
  var CINEMA_COLLISION_COLUMNS = 256;
  var CINEMA_COLLISION_ROWS = 384;
  var CINEMA_COLLISION_BITS = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPD3/////////////////////////////////wcAAAAA8Pf/////////////////////////////////BwAAAADw9/////////////////////////////////8HAAAAAPD3/////////////////////////////////wcAAAAA8Pf/////////////////////////////////BwAAAADw9/////////////////////////////////8HAAAAAPD3/////////////////////////////////wcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAADAHwAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAMD//////////38AAADwBwAAAAAAAAAAAAAAAAAAAAAAwP//////////fwAAAPAHAAAAAAAAAAAAAAAAAAAAAADA//////////9/AAAA8AcAAAAAAAAAAAAAAAAAAAAAAMD//////////38AAADwBwAAAAAAAAAAAAAAAAAAAAAAwP//////////fwAAAPAHAAAAAAAAAAAAAAAAAAAAAADA//////////9/AAAA8AcAAAAAAAAAAAAAAAAAAAAAAMD//////////38AAADwBwAAAAAAAAAAAAAAAAAAAAAAwB8Amv//////fwAAAPAHAAAAAAAAAAAAAAAAAAAAAADAHwAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAMAfAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAwB8AAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAADAHwAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAMAfAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAwB8AAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAADAHwAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAMAfAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAwB8AAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAADAHwAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAMAfAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAwB8AAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAADAHwAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAwP////8DAMAfAAAAAADwBwAAAADwBwAAAP7//////////////wMAwB8AAAAAAPAHAAAAAPAHAAAA/v//////////////AwDAHwAAAAAA8AcAAAAA8AcAAAD+//////////////8DAMAfAAAAAADwBwAAAADwBwAAAP7//////////////wMAwB8AAAAAAPAHAAAAAPAHAAAA/v//////////////AwDAHwAAAAAA8AcAAAAA8AcAAAD+//////////////8DAMAfAAAAAADwBwAAAADwBwAAAP7//////////////wMAwB8AAAAAAPAHAAAAAPAHAAAA/gAAAAAAAAAAAAD4AwDAHwAAAAAA8AcAAAAA8AcAAAD+AAAAAAAAAAAAAPgDAMAfAAAAAADwBwAAAADwBwAAAP4AAAAAAAAAAAAA+AMAwB8AAAAAAPAHAAAAAPAHAAAA/gAAAAAAAAAAAAD4AwDAHwAAAAAA8AcAAAAA8AcAAAD+AAAAAAAAAAAAAPgDAMAfAAAAAADwBwAAAADwBwAAAP4AAAAAAAAAAAAA+AMAwB8AAAAAAPAHAAAAAPAHAAAA/gAAAAAAAAAAAAD4AwDAHwAAAAAA8AcAAAAA8AcAAAD+AAAAAAAAAAAAAPgDAMAfAAAAAADwBwAAAADwBwAAAP4AAAAAAAAAAAAA+AMAwP//GAAAAPAHAAAAAPAHAAAA/gAAAAAAAAAAAAD4AwDA////////////AAAA8AcAAAD+AAAAAAAAAAAAAPgDAMD///////////8AAADwBwAAAP4AAAAAAAAAAAAA+AMAwP///////////wAAAPAHAAAA/v//////////////BwDA////////////AAAA8AcAAAD+//////////////8HAMD///////////8AAADwBwAAAP7//////////////wcAwP///////////wAAAPAHAAAA/v//////////////BwCA////////////AAAA8AcAAAD+//////////////8HAAAAAAAAAADwBwAAAADwBwAAAP7//////////////wcAAAAAAAAAAPAHAAAAAPAHAAAA/v//////////////BwAAAAAAAAAA8AcAAAAA8AcAAAD+/wEAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAP7//////////////wcAAAAAAAAAAPAHAAAAAPAHAAAA/v//////////////BwAAAAAAAAAA8AcAAAAA8AcAAAD+//////////////8HAAAAAAAAAADwBwAAAADwBwAAAP7//////////////wcAAAAAAAAAAPAHAAAAAPAHAAAA/v//////////////BwAAAAAAAAAA8AcAAAAA8AcAAAD+//////////////8HAAAAAAAAAADwBwAAAADwBwAAAP7//////////////wcAAAAAAAAAAPAHAAAAAPAHAAAA/gEAAAAAAAAAAAD4AwAAAAAAAAAA8AcAAAAA8AcAAAD+AQAAAAAAAAAAAPgDAAAAAAAAAADwBwAAAADwBwAAAP4BAAAAAAAAAAAA+AMAAAAAAAAAAPAHAAAAAPAHAAAA/gEAAAAAAAAAAAD4AwAAAAAAAAAA8AcAAAAA8AcAAAD+AQAAAAAAAAAAAPgDAAAAAAAAAADwBwAAAADwBwAAAP4BAAAAAAAAAAAA+AMAAAAAAAAAAPAHAAAAAPAHAAAA/gEAAAAAAAAAAAD4AwAAAAAAAAAA8AcAAAAA8AcAAAD+AQAAAAAAAAAAAPgDAAAAAAAAAADwBwAAAADwBwAAAP4AAAAAAAAAAAAA+AMAAAAAAAAAAPAHAAAAAPAHAAAA/gAAAAAAAAAAAAD4AwAAAAAAAAAA8AcAAAAA8AcAAAD+AAAAAAAAAAAAAPgDAAAAAAAAAADwBwAAAADwBwAAAP4AAAAAAAAAAAAA+AMAAAAAAAAAAPAHAAAAAPAHAAAA////////////////AwAAAAAAAAAA8AcAAAAA8AcAAAD///////////////8DAAAAAAAAAADwBwAAAADwBwAAAP///////////////wMAAAAAAAAAAPAHAAAAAPAHAAAA////////////////AwAAAAAAAAAA8AcAAAAA8AcAAAD///////////////8DAAAAAAAAAADwBwAAAADwBwAAAP///////////////wMAAAAAAAAAAPAHAAAAAPAHAAAA////////////////AwAAAAAAAAAA8AcAAAAA8AcAAAD//x8AAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AcAAAAA8P//////////////AwAAAP7/////////////fwAAAADw//////////////8DAAAA/v////////////9/AAAAAPD//////////////wMAAAD+/////////////38AAAAA8P//////////////AwAAAP7/////////////fwAAAADw//////////////8DAAAA/v////////////9/AAAAAPD//////////////wMAAAD+/////////////38AAAAA8P//////////////AwAAAP7/////////////fwAAAADw//////////////8DAAAA/v////////////9/AAAAAPAHAAAAAAAAAAAA/gEAAAD+AAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAD+AQAAAP4AAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAP4BAAAA/gAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAA/gEAAAD+AAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAD+AQAAAP4AAAAAAAAAAADwBwAAAADwBwAAAAAAAAAAAP4BAAAA/gAAAAAAAAAAAPAHAAAAAPAHAAAAAAAAAAAA/gEAAAD+AAAAAAAAAAAA8AcAAAAA8AcAAAAAAAAAAAD+AQAAAP4AAAAAAAAAAADwBwAAAAAAAAAAAAAAAAAAAP4BAAAA/gAAAAAAAAAAAPAHAAAAAAAAAAAAAAAAAAAA/gEAAAD+AAAAAAAAAAAA8AcAAAAAAAAAAAAAAAAAAAD+AQAAAP4AAAAAAAAAAADwBwAAAAAAAAAAAAAAAAAAAP4BAAAA/gAAAAAAAAAAAPAHAAAAAAAAAAAAAAAAAAAA/gEAAAD+AAAAAAAAAAAA8AcAAAAAAAAAAAAAAAAAAAD+AQAAAP4AAAAAAAAAAADwBwAAAAAAAAAAAAAAAAAAAP4BAAAA/gAAAAAAAAAAAPAHAAAAAAAAAAAAAAAAAAAA/gEAAAD+AAAAAAAAAAAA8AcAAAAAAAAAAAAAAAAAAAD+AQAAAP4AAAAAAAAAAADwBwAAAAAAAAAAAAAAAAAAAP4BAAAA/gAAAAAAAAAAAPAHAAAAAAAAAAAAAAAAAAAA/gEAAAD+AAAAAAAAAAAA8AcAAAAAAAAAAAAAAAAAAAD+AQAAAP4AAAAAAAAAAADwBwAAAAAAAAAAAAAAAAAAAP4BAAAA/gAAAAAAAAAAAPAHAAAAAAAAAAAAAAAAAAAA/gEAAAD+AAAAAAAAAAAA8AcAAAAAAAAAAAAAAAAAAAD+AQAAAP4AAAAAAAAAAADwBwAAAAAAAAAAAAAAAAAAAP4BAAAA/gAAAAAAAAAAAPAHAAAAAAAAAAAAAAAAAAAA/gEAAAD+AAAAAAAAAAAA8AcAAAAAAAAAAAAAAAAAAAD+AQAAAP4AAAAAAAAAAADwBwAAAAAAAAAAAAAAAAAAAP4BAAAA/gAAAAAAAAAAAPAHAAAAAAAAAAAAAAAAAAAA/gEAAAD+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+AQAAAP4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP4BAAAA/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

  // js/bookshop-collision-mask.ts
  var BOOKSHOP_COLLISION_CELL_SIZE = 2;
  var BOOKSHOP_COLLISION_COLUMNS = 256;
  var BOOKSHOP_COLLISION_ROWS = 384;
  var BOOKSHOP_COLLISION_BITS = "////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AP///////////////////////////////////////w8A/v//////////////////////////////////////AAD+////////////////////////////////PwAAAAAAAP7///////////////////////////////8/AAAAAAAA/v///////////////////////////////x8AAAAAAAD+////////////////////////////////HwAAAAAAAP7///////////////////////////////8fAAAAAAAA/v///////////////////////////////x8AAAAAAAD+////////////////////////////////HwAAAAAAAP////////////////////////////////8fAAAAAAAA/////////////////////////////////x8AAAAAAAD/////////////////////////////////HwAAAAAAAP////////////////////////////////8fAAAAAAAA/////////////////////////////////x8AAAAAAAD/////////////////////////////////HwAAAAAAAP////////////////////////////////8fAAAAAAAA/////////////////////////////////x8AAAAAAAD/////////////////////////////////HwAAAAAAAP////////////////////////////////8fAAAAAAAA/////////////////////////////////x8AAAAAAAD/////////////////////////////////HwAAAAAAAP////////////////////////////////8fAAAAAAAA/////////////////////////////////x8AAAAAAAD/////////////////////////////////HwAAAAAAAP7///////////////////////////////8fAAAAAAAA/P///////////////////////////////w8AAAAAAADw/////w8AAAD///////////////8/AAAAAAAAAAAAAAAAAAAAAAAAAP7//////////////x8AAAAAAAAAAAAAAAAAAAAAAAAA/v//////////////HwAAAAAAAAAAAAAAAAAAAAAAAAD+//////////////8fAAAAAAAAAAAAAAAAAAAAAAAAAP7//////////////x8AAAAAAAAAAAAAAAAAAAAAAAAA/v//////////////HwAAAAAAAAAAAAAAAAAAAAAAAAD+//////////////8fAAAAAAAAAAAAAAAAAAAAAAAAAP7//////////////x8AAAAAAAAAAAAAAAAAAAAAAAAA/v//////////////HwAAAAAAAAAAAAAAAAAAAAAAAAD+//////////////8fAAAAAAAAAAAAAAAAAAAAAAAAAP7//////////////x8AAAAAAAAAAAAAAAAAAAAAAAAA/v//////////////HwAAAAAAAAAAAAAAAAAAAAAAAAD+//////////////8fAAAAAAAAAAAAAAAAAAAAAAAAAP7//////////////w8AAAAAAAAAAAAAAAAAAAAAAAAA/v//////////////DwAAAAAAAAAAAAAAAAAAAAAAAAD+//////////////8PAAAAAAAAAAAAAAAAAAAAAAAAAP7//////////////wcAAAAAAAAAAAAAAAAAAAAAAAAA/v//////////////AwAAAAAAAAAAAAAAAAAAAAAAAAD+//////////////8BAAAAAAAAAAAAAAAAAAAAAAAAAP//////////////fwAAAAAAAAAAAAAAAAAAAAAAAAAA//////////////8/AAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////x8AAAAAAAAAAAAAAAAAAAAAAAAAAP//////////////DwAAAAAAAAAAAAAAAAAAAAAAAACA//////////////8HAAAAAAAAAAAAAAAAAAAAAAAAAID//////////////wEAAAAAAAAAAAAAAAAAAAAAAAAAgP//////////////AAAAAAAAAAAAAAAAAAAAAAAAAACA/////////////z8AAAAA8P//////////DwAAAAAAAID/////////////DwAAAADw//////////8PAAAAAAAAgP////////////8HAAAAAPD//////////w8AAAAAAADA/////////////wEAAAAA8P//////////DwAAAAAAAMD///////////9/AAAAAADw//////////8PAAAAAAAAwP///////////z8AAAAAAPD//////////w8AAAAAAADA////////////DwAAAAAA8P//////////DwAAAAAAAMD///////////8HAAAAAADw//////////8PAAAAAAAAwP///////////wEAAAAAAPD//////////w8AAAAAAADA//////////9/AAAAAAAA8P//////////DwAAAAAAAMD//////////z8AAAAAAADw//////////8PAAAAAAAAwP//////////DwAAAAAAAPD//////////w8AAAAAAADg//////////8DAAAAAAAA8P//////////DwAAAAAAAOD//////////wEAAAAAAADw//////////8PAAAAAAAA4P////////9/AAAAAAAAAPD//////////w8AAAAAAADg/////////z8AAAAAAAAA8P//////////DwAAAAAAAOD/////////HwAAAAAAAADw//////////8PAAAAAAAA4P////////8PAAAAAAAAAPD//////////w8AAAAAAADg/////////wcAAAAAAAAA8P//////////DwAAAAAAAOD/////////AwAAAAAAAADw//////////8PAAAAAAAA4P////////8DAAAAAAAAAPD//////////w8AAAAAAADg/////////wMAAAAAAAAA8P//////////DwAAAAAAAOD/////////AwAAAAAAAADw//////////8PAAAAAAAA4P////////8DAAAAAAAAAPD//////////w8AAAAAAADg/////////wMAAAAAAAAA8P//////////DwAAAAAAAOD/////////AwAAAAAAAADw//////////8PAAAAAAAA4P////////8DAAAAAAAAAPD//////////w8AAAAAAADg/////////wcAAAAAAAAA8P//////////DwAAAAAAAOD/////////BwAAAAAAAADw//////////8PAAAAAAAA4P////////8HAAAAAAAAAPD//////////w8AAAAAAADg/////////wcAAAAAAAAA8P//////////DwAAAAAAAOD/////////BwAAAAAAAADw//////////8PAAAAAAAA4P////////8PAAAAAAAAAPD//////////w8AAAAAAADg/////////w8AAAAAAAAA8P//////////DwAAAAAAAOD/////////DwAAAAAAAADw//////////8PAAAAAAAA4P////////8fAAAAAAAAAPD//////////w8AAAAAAADA/////////x8AAAAAAAAA8P//////////DwAAAAAAAMD/////////HwAAAAAAAADw//////////8PAAAAAAAAwP////////8/AAAAAAAAAPD//////////w8AAAAAAADA/////////z8AAAAAAAAA8P//////////DwAAAAAAAMD/////////PwAAAAAAAADw//////////8PAAAAAAAAwP////////9/AAAAAAAAAPD//////////w8AAAAAAADA/////////38AAAAAAAAA8P//////////DwAAAAAAAMD/////////fwAAAAAAAADw//////////8PAAAAAAAAwP////////9/AAAAAAAAAPD//////////w8AAAAAAADA//////////8AAAAAAAAA8P//////////DwAAAAAAAMD//////////wAAAAAAAADw//////////8PAAAAAAAAwP//////////AAAAAAAAAPD//////////w8AAAAAAACA/////////38AAAAAAAAA8P//////////DwAAAAAAAID/////////fwAAAAAAAADw//////////8PAAAAAAAAgP////////9/AAAAAAAAAPD//////////w8AAAAAAACA/////////38AAAAAAAAA8P//////////DwAAAAAAAID/////////fwAAAAAAAADw//////////8PAAAAAAAAgP////////8/AAAAAAAAAPD//////////w8AAAAAAACA/////////z8AAAAAAAAA8P//////////DwAAAAAAAID/////////PwAAAAAAAADw//////////8PAAAAAAAAAP////////8fAAAAAAAAAPD//////////w8AAAAAAAAA/////////x8AAAAAAAAA8P//////////DwAAAAAAAAD/////////HwAAAAAAAADw//////////8PAAAAAAAAAP////////8PAAAAAAAAAPD//////////w8AAAAAAAAA/////////w8AAAAAAAAA8P//////////DwAAAAAAAAD/////////DwAAAAAAAADw//////////8PAAAAAAAAAP7///////8HAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v///////wcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+////////BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7///////8DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/P///////wMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8////////AwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPz///////8DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/P///////wEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8////////AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPz///////8BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/P///////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPz///////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/P///////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8//////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPz//////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/P//////fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+//////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7//////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v//////PwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+//////8/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7//////z8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v//////PwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+//////8/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7//////z8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v//////PwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+//////8/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7//////z8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v//////PwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+//////8/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///////z8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////////PwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////8/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///////z8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////////PwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////8/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///////z8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////////fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////////fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////wEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////wMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////AwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////wMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////AwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////wMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8HAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////wcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8HAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////wcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8HAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v///////w8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+////////DwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7///////8PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v///////w8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+////////DwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////";

  // js/gym-collision-mask.ts
  var GYM_COLLISION_CELL_SIZE = 2;
  var GYM_COLLISION_COLUMNS = 256;
  var GYM_COLLISION_ROWS = 384;
  var GYM_COLLISION_BITS = "////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////j////////////////////////////////////////weA//////////////////////////////////////8fAID//////////////////////////////////////wMAgP//////////////////////////////fwAAAA0AAACA//////////////////////////////8/AAAAAAAAAID//////////////////////////////z8AAAAAAAAAgP//////////////////////////////PwAAAAAAAACA//////////////////////////////8/AAAAAAAAAID//////////////////////////////z8AAAAAAAAAgP//////////////////////////////PwAAAAAAAACA//////////////////////////////8/AAAAAAAAAID//////////////////////////////z8AAAAAAAAAgP//////////////////////////////PwAAAAAAAACA//////////////////////////////8/AAAAAAAAAID//////////////////////////////z8AAAAAAAAAgP//////////////////////////////HwAAAAAAAACA//////////////////////////////8fAAAAAAAAAID//////////////////////////////x8AAAAAAAAAgP//////////////////////////////HwAAAAAAAACA//////////////////////////////8fAAAAAAAAAID//////////////////////////////x8AAAAAAAAAgP//////////////////////////////HwAAAAAAAACA//////////////////////////////8fAAAAAAAAAID//////////////////////////////x8AAAAAAAAAgP//////////////////////////////HwAAAAAAAACA//////////////////////////////8fAAAAAAAAAID//////////////////////////////x8AAAAAAAAAAP//////////////////////////////HwAAAAAAAAAA//////////////////////////////8fAAAAAAAAAAD//////////////////////////////x8AAAAAAAAAAP//////////////////////////////HwAAAAAAAAAA//////////////////////////////8fAAAAAAAAAAD//////////////////////////////x8AAAAAAAAAAP//////////////////////////////HwAAAAAAAAAA//////////////////////////////8fAAAAAAAAAAD//////////////////////////////x8AAAAAAAAAAP//////////////////////////////HwAAAAAAAAAA//////////////////////////////8fAAAAAAAAAAD//////////////////////////////x8AAAAAAAAAAP//////////////////////////////HwAAAAAAAAAA////////////////BwD8//////////8PAAAAAAAAAAD///////////////8DAAD+/////x8A/wcAAAAAAAAAAP///////////////wEAAID///8AAAAAAAAAAAAAAAAA////////////////AQAAAAAAAAAAAAAAAAAAAAAAAAD///////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAP//////////////fwAAAAAAAAAAAAAAAAAAAAAAAAAA//////////////9/AAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////38AAAAAAAAAAAAAAAAAAAAAAAAAAP//////////////PwAAAAAAAAAAAAAAAAAAAAAAAAAA//////////////8/AAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////z8AAAAAAAAAAAAAAAAAAAAAAAAAAP//////////////PwAAAAAAAAAAAAAAAAAAAAAAAAAA//////////////8/AAAAAAAAAAAAAAAAAAAAAAAAAAD+/////////////z8AAAAAAAAAAAAAAAAAAAAAAAAAAP7/////////////PwAAAAAAAAAAAAAAAAAAAAAAAAAA/v////////////8/AAAAAAAAAAAAAAAAAAAAAAAAAAD+/////////////z8AAAAAAAAAAAAAAAAAAAAAAAAAAPz/////////////PwAAAAAAAAAAAAAAAAAAAAAAAAAA/P////////////8//v///////////z8AAAAAAAAAAAD8/////////////z/+////////////PwAAAAAAAAAAAPz/////////////P/7///////////8/AAAAAAAAAAAA/P////////////8//v///////////z8AAAAAAAAAAAD4/////////////z/+////////////PwAAAAAAAAAAAPj/////////////P/7///////////8/AAAAAAAAAAAA4P////////////8//v///////////z8AAAAAAAAAAAAA/v///////////z/+////////////PwAAAAAAAAAAAADg////////////P/7///////////8/AAAAAAAAAAAAAAD8//////////8//v///////////z8AAAAAAAAAAAAAAPz//////////z/+////////////PwAAAAAAAAAAAAAA/P//////////P/7///////////8/AAAAAAAAAAAAAAD8//////////8//v///////////z8AAAAAAAAAAAAAAPz//////////z/+////////////PwAAAAAAAAAAAAAA/P//////////P/7///////////8/AAAAAAAAAAAAAAD+//////////8//v///////////z8AAAAAAAAAAAAAAP7//////////z/+////////////PwAAAAAAAAAAAACA////////////P/7///////////8/AAAAAAAAAAAAAP7///////////8//v///////////z8AAAAAAAAAAAD4/////////////z/+////////////PwAAAAAAAAAAgP//////////////P/7///////////8/AAAAAAAAAAD4//////////////8//v///////////z8AAAAAAAAAAP7//////////////z/+////////////PwAAAAAAAAAA////////////////P/7///////////8/AAAAAAAAAAD///////////////8//v///////////z8AAAAAAAAAgP///////////////z/+////////////PwAAAAAAAACA////////////////PwAAAP//////AAAAAAAAAAAAAID///////////////8/AAAA//////8AAAAAAAAAAAAAgP///////////////38AAAD//////wAAAAAAAAAAAACA////////////////fwAAAP//////AAAAAAAAAAAAAID///////////////9/AAAA//////8AAAAAAAAAAAAAgP///////////////38AAAD//////wAAAAAAAAAAAACA////////////////fwAAAP//////AAAAAAAAAAAAAID///////////////9/AAAA//////8AAAAAAAAAAAAAgP///////////////38AAAD//////wAAAAAAAAAAAACA////////////////fwAAAP//////AAAAAAAAAAAAAAD/////////////////AAAA//////8AAAAAAAAAAAAAAP////////////////8AAAD//////wAAAAAAAAAAAAAA/////////////////wAAAP//////AAAAAAAAAAAAAAD/////////////////AAAA//////8AAAAAAAAAAAAAAP////////////////8AAAD//////wAAAAAAAAAAAAAA/////////////////wEAAP//////AAAAAAAAAAAAAAD/////////////////AQAA//////8AAAAAAAAAAAAAAP////////////////8BAAD//////wAAAAAAAAAAAAAA/v///////////////wEAAP//////AAAAAAAAAAAAAAD8////////////////AwAA//////8AAAAAAAAAAAAAAOD///////////////8DAAD//////wAAAAAAAAAAAAAAAAAAAOD//////////wMAAP//////AAAAAAAAAAAAAAAAAAAAAP7/////////AwAA//////8AAAAAAAAAAAAAAAAAAAAA8P////////8DAAD//////wAAAAAAAAAAAAAAAAAAAACA/////////wMAAP//////AAAAAAAAAAAAAAAAAAAAAAD8////////AwAA//////8AAAAAAAAAAAAAAAAAAAAAAPj///////8BAAD//////wAAAAAAAAAAAAAAAAAAAAAA+P///////wEAAP//////AAAAAAAAAAAAAAAAAAAAAAD4////////AQAA//////8AAAAAAAAAAAAAAAAAAAAAAPj///////8BAAD//////wAAAAAAAAAAAAAAAAAAAAAA+P///////wEAAP//////AAAAAAAAAAAAAAAAAAAAAAD4////////AQAA//////8AAAAAAAAAAAAAAAAAAAAAAPD///////8BAAD//////wAAAAAAAAAAAAAAAAAAAAAA8P///////wEAAP//////AAAAAAAAAAAAAAAAAAAAAADw////////AQAA//////8AAAAAAAAAAAAAAAAAAAAAAPD///////8BAAD//////wAAAAAAAAAAAAAAAAAAAAAA8P///////wEAAP//////AAAAAAAAAAAAAAAAAAAAAADw////////AQAA//////8AAAAAAAAAAAAAAAAAAAAAAPD///////8AAAD//////wAAAAAAAAAAAAAAAAAAAAAA8P///////wAAAP//////AAAAAAAAAAAAAAAAAAAAAADw////////AAAA//////8AAAAAAAAAAAAAAAAAAAAAAPD///////8AAAD//////wAAAAAAAAAAAAAAAAAAAAAA8P///////wAAAP//////AAAAAAAAAAAAAAAAAAAAAADw////////AAAA//////8AAAAAAAAAAAAAAAAAAAAAAPD///////8AAAD//////wAAAAAAAAAAAAAAAAAAAAAA8P///////wAAAP//////AAAAAAAAAAAAAAAAAAAAAADw////////AAAA//////8AAAAAAAAAAAAAAAAAAAAAAPD///////8AAAD//////wAAAAAAAAAAAAAAAAAAAAAA8P///////wAAAP//////AAAAAAAAAAAAAAAAAAAAAADw////////AAAA//////8AAAAAAAAAAAAAAAAAAAAAAPD///////8AAAD//////wAAAAAAAAAAAAAAAAAAAAAA4P///////wAAAP//////AAAAAAAAAAAAAAAAAAAAAADg////////AAAA//////8AAAAAAAAAAAAAAAAAAAAAAOD///////8AAAD//////wAAAAAAAAAAAAAAAAAAAAAA4P///////wAAAP//////AAAAAAAAAAAAAAAAAAAAAADw////////AAAA//////8AAAAAAAAAAAAAAAAAAAAAAPD///////8AAAD//////wAAAAAAAAAAAAAAAAAAAAAA8P///////wAAAP//////AAAAAAAAAAAAAAAAAAAAAADw////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPD///////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8P///////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADw////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPD///////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8P///////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADw////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPD///////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8P///////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADw////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPD///////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8P///////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADw////////AAAAAAAAAAAAAAAAAAAAAMD/////PwAAAPD///////8AAAAAAAAAAAAAAAAAAAAAwP////8/AAAA8P///////wAAAAAAAAAAAAAAAAAAAADA/////z8AAADw////////AAAAAAAAAAAAAAAAAAAAAMD/////PwAAAOD///////8AAAAAAAAAAAAAAAAAAAAAwP////8/AAAA4P///////wAAAAAAAAAAAAAAAAAAAADA/////z8AAADg////////AAAAAAAAAAAAAAAAAAAAAMD/////PwAAAOD///////8AAAAAAAAAAAAAAAAAAAAAwP////8/AAAA4P///////wAAAAAAAAAAAAAAAAAAAADA/////z8AAADg////////AAAAAAAAAAAAAAAAAAAAAMD/////PwAAAMD///////8AAAAAAAAAAAAAAAAAAAAAwP////8/AAAAwP///////wAAAAAAAAAAAAAAAAAAAADA/////z8AAADA////////AAAAAAAAAAAAAAAAAAAAAMD/////PwAAAMD///////8AAAAAAAAAAAAAAAAAAAAAwP////8/AAAA4P///////wAAAAAAAAAAAAAAAAAAAADA/////z8AAADg////////AAAAAAAAAAAAAAAAAAAAAMD/////PwAAAOD///////8AAAAAAAAAAAAAAAAAAAAAwP////8/AAAA4P///////wAAAAAAAAAAAAAAAAAAAADA/////z8AAADg////////AAAAAAAAAAAAAAAAAAAAAMD/////PwAAAOD///////8AAAAAAAAAAAAAAAAAAAAAwP////8/AAAA4P///////wAAAAAAAAAAAAAAAAAAAADA/////z8AAADg////////AAAAAAAAAAAAAAAAAAAAAMD/////PwAAAOD///////8AAAAAAAAAAAAAAAAAAAAAwP////8/AAAA4P///////wAAAAAAAAAAAAAAAAAAAADA/////z8AAADg////////AAAAAAAAAAAAAAAAAAAAAMD/////PwAAAOD///////8AAAAAAAAAAAAAAAAAAAAAwP////8/AAAAwP///////wAAAAAAAAAAAAAAAAAAAADA/////z8AAADA////////AAAAAAAAAAAAAAAAAAAAAMD/////PwAAAMD///////8AAAAAAAAAAAAAAAAAAAAAwP////8/AAAAwP///////wAAAAAAAAAAAAAAAAAAAADA/////z8AAADA////////AAAAAAAAAAAAAAAAAAAAAMD/////PwAAAMD///////8AAAAAAAAAAAAAAAAAAAAAwP////8/AAAAwP///////wAAAAAAAAAAAAAAAAAAAADA/////z8AAADA////////AAAAAAAAAAAAAAAAAAAAAMD/////PwAAAMD///////8AAAAAAAAAAAAAAAAAAAAAwP////8/AAAAwP///////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADA////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMD///////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4P///////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADg////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOD///////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4P///////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADg////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOD///////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4P///////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADg////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOD///////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4P///////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADg////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOD///////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4P///////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADg////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOD///////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4P///////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADg////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOD///////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4P///////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADg////////AAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAOD///////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4P///////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADg////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOD///////8AAAAAAAD4/wAAAAAAAAAAAAAAAAAAAAAA8P///////wAAAAAA8P///z8AAAAAAAAAAAAAAAAAAOD/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////";

  // js/garden-collision-mask.ts
  var GARDEN_COLLISION_CELL_SIZE = 2;
  var GARDEN_COLLISION_COLUMNS = 256;
  var GARDEN_COLLISION_ROWS = 384;
  var GARDEN_COLLISION_BITS = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAgAACAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAALwBAAAAAAAAAAAAAAAAAAAAAACgAAAAEQAAAAAAAAAAARu5AAAAAAAAAAAAAAAAAAAAAAAQ+CEAAAAAAAAAAAAAAEIAAAAAAAAAAAAAAAAAAAAAAADkHQAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAF4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAACAAQAAgAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAADAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAQAAAAAAAAAAAAB4AAAAAAAAAAAAAAA4EAAAAAAAAMAAAAAAAAAAAAAAAHQAAAAAAAAAAAAAAPAfAAAAAAAAAAAAQAACAAAAAAAA8AMAAAAAAAAAAAAQAAgYAAAAAAAAADAMAAAAAAAAAAAABjwAAAAAAAAAAD4ACB4AAAAAAAAAAAAAAAAAAAAA/AoEHwAAAAAAAAAAAQgICAAAAAAAAAAAAAAAAAAAAABAAAAAAAgAAAAAAAAAOBgIAAAAAAAAAAAAAAAAAAAAAAAMCAAAAAAAAAAAAAAgDAAAAAAAAAAAAAAAAAAAAAAAABACAAAAAAAAAAAAAOAGAAAAAAAAAAAAAAAAAAAAAAAAMAMAAAAAAAAAAAAAgAMAAAAAAAAAAAACAABAAAAAAADgAAAACAAAAAAgAAAIEAAAAAAAAQAAAAIAAAAAAAAAAMAAAAAMAAAAAAAAgIABAAAAAAAAAAAAAAgAAAAAAAAAwAQAAAwAAAAAIAAAQAwIAAAAAAAAEAAAIAAAAAAAAEAwAQAADAAAAAAAAACIAwAAAAAAAAAAAAAAAAAAAAAAQIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgZAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAADgAQAAAAAAAAAAAAAAAAAAAAAAAMAIAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAACAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAIAAAACAAQAAAAAAAAAAAAAAAAAAAAAAAAAAQQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAAABAAEAAAAAAAAAAAAAAAAPAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAHIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAA4P7PcQEAAEAAAAAAAAAAAAAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgA8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAHwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgB8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAADkAAAAAAAAAAAAAAAAAAAAGAAAAAAAAAAAAAAAAAGAAfQAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAIB/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgP8MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAACA/w8AAAAAAAAAAAAAAAAAAAAAAAAAAAAABACAAAAAAOz/PwAAAAAAAAAAAAAAAAAA0L/9E4AAAAAAAIAAAAAA8D4/AAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAgAAAAAD+DD8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAPgBHgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/wEaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAABAAAP4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAAAOAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAABIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAABAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAwAAEAMAAAAEAAAAAAAAAAAAAAAAAPwHAAAAAAAAAAAAAACAAAAAAAAAEAACAAAAAAAAAAAAEAAAAAAAAAAAAAAAACAAAAAAAAAAgP8fAAAAAAAAAAAQAAAAAAAAAAAAAAAA4AAAAAAAAAD8//8AAAAAAAAAAAAAAAAAAAAAAAAAAADgAAAAAAAA4P///w8AAAAAAAAAEAAAAAAAAAAAAAAAAMAAAAAAAAD+/wf4fwEAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAPz///8fAID/AwAAAAAAABAAAAAAAAAAAAAAAAAAAAAA/////wAAAPwHAAAAAAAAAAAAAAAAAAAAAFj/i6MAAID///8PAAAA8B8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAgP//DwAAAADAHwAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAwAAAAAAAIBnAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMABAAAAAAAAgPcAAAAAAAAAAAAAAAAAAAAAAAAAwAAAwAEAAAAAAAAAh4b/gAEUbB8AAAAAAAAAAAAAAADAAQDgAQAAAAAAAAAHAAAAAAAAAAAAAAAAAAAAAAAAAOACAPAAAAAAAAAAAA8AAAAAAAAAAAAAAAAAAAAAAAAA/BgA8AAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAAAAAAC/PAB4AAAAAAAAAAAPAAAAAAAAAAAAAAAAAAAAAAAAAB48ADwAAAAAAAAAAA8AAAAAAAAAAAAAAAAAAAAAAAAAHwcAHAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAAAAAACfDwAcAAAAAAAAAAAPAAAAAAAAAAAAAAAAAAAAAAAAAAwPABwAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAAAAAAAAYAMADAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAAAAAAABABAAOAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAA4AAAAAAAAYAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAADgAAAQAAABAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAOAAACAAAAAAAAAAAAAAAAAAAAAAAAgAcAAAAAAAAAAA4AAAYAAAAAAAwAAAAAAAAAAAAAAADAAwAAAAAAAAAADgAA9AAAAAAACAAAAAAAAAAAAAAAAOABAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAASBcA8AAAAAAAAAAAAB4AAAAAAAAQAAAAAAAAAAAAAAAAAAB+AAAAAAAAAAAAHgAAAAAAAAAAAAAAAAAAAAAAAPj//38AAAAAAAAAAAB+AAAAAAAAAAAAAAAAAAAAAAAA/v//PwAAAAAAAAAAAPwHAAQAAAAAAAAAAAAAAAAAAAD+//8HAAAAAAAAAAAA+P8/AAAAAAAAAAAAAAAAAAAAAP7/AQAAAAAAAAAAAADg/38AAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAAAAAAAD89wAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAOAAAAAQAAAAAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAA4AEAABAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAADgAwD/GQAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAMAH4P8fAAAAAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAgD/+/x8AAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAA///3HwAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAAD+fwAeAAAAAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAPgPAD4AAAAAAAAAAAAAAIAPAAAAAAAAAAAAAAAAAAAAAAAAHgAAAAAAAAAAAAAAwAcAAAAAAAAAAAAAAAAAAAAAAAA+AAAAAAAAAAAAAAD8AwAAAAAAAAAAAAAAAAAAAAAAAL4hAAAAAAAAAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAADiAAAAAAAAAAAAAAfwAAAAAAAAAAAAAAAAAAAAAAAAAOwAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAAAAAAAAAA7gAAAAAAAAAAAAgAcAAAAAAAAAAAAAAAAAAAAAAAAAD+AAAAAAAAAAAACwAwAAAAAAAAAAAAAAAAAAAAAAAAAPggAAAAAAAAAACLADAAAAAAAAAAAAAAAAAAAAAAAAAA+jAAAAAAAAAAAAgAMAAAAAAAAAAAAAAAAAAAAAAAAADwYeAAAAAAAAAACAAwAAAAAAAAAAAAAAAAAAAAAAAABPBw4AAAAAAAAAAIADAAAAAAAAAAAAAAAAAAAAAAAAAA8DDwAAAAAAAACAgQMAAAAAAAAAAAAAAAAAAAAAAAAADxMHAAAAAAAAAACAAwAAAAAAAAAAAAAAAAAAAAAAAAAPAAEAAAAAAAAAAMADAAAAAAAAAAAAAAAAAAAAAAAAAA8AAAAAAAAAAAAAwAEAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAADAAQAAAAAAAAAAAAAAAAAAAAAAAAAPgAAAAAAAAAAAAMABAAAAAAAAAAAAAAAAAAAAAAAAAA+AAAAAAAAAAAAA4AEAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AAAAAAAAAAAAA8AAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAAAAAAAAAPkAAAAAAAAAAAAPAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAAAAADwQAAAAAAAAAgAB4AAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAAAAAAAAAAHgAAAAAAAAAAAAAAAAAAAAAAAAAAA8AAAAAAAAAAAAAeAAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAAAAAAAAAAvAAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAAAAAAAAAD8AAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAfwAAAAAAAAAAAAA8AAAAAAAAAAAAAAAAAAAAAAAAAAC/AQAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAAAAAAAAAAHgAAAAAAAAAAAAAAAAAAAAAAAAAAA8AAAAAAAAAAAAAeAAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAAAAAAAAAAHgAAAAAAAAAAAAAAAAAAAAAAAAAAA8AAAAAAAAAAAAAcgAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAAAAAAAAAMPAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AAAAAAAAAAAAA8AAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAAAAAAAAAAPAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AAAAAAAAAAAAA8AAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAAADgAQAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAOABAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAA8AEAAAAAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAAADgAQAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAOABAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAA8AEAAAAAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAAADwAQAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAOgAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAA6AAAAAAAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAAADoAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAA6AAAAAAAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAAADiAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAADYz+gAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAh4AAAAAAAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAfgAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAAAAAAAAAA+AAAAAAAAAAAAAOADAAAAAAAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAA4B8AAAAAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAAADA/wEAAAAAAAAAAAAAAAAAAAAAAAA+EAAAAAAAAAAAAAD+AwAAAAAAAAAAAAAAAAAAAAAAAD44AAAAAAAAAAAAAMADAAAAAAAAAAAAAAAAAAAAAAAAPngCAAAAAAAAwAAA4AMAAAAAAAAAAAAAAAAAAAAAAAAefB8AAAAAAADCAQDAAwAAAAAAAAAAAAAAAAAAAAAAAJ7/HwAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAA3Ic/AAAAAAAACIAAAAMAAAAAAAAAAAAAAAAAAAAAAAD8zz8AAAAAAAAIAAAABwAAAAAAAAAAAAAAAAAAAAAAAPyPHwAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAAAAAAAA/I8eAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAD4DwYAAAAAAAAAAABABwAAAAAAAAAAAAAAAAAAAAAAAPjzAAAAAAAAAAAAAEAHAAAAAAAAAAAAAAAAAAAAAAAA+PAAAAAAAAAAAAAAwAcAAAAAAAAAAAAAAAAAAAAAAABw+AEAAAAAAAAAAACABwAAAAAAAAAAAAAAAAAAAAAAAHj8AQAAAAAAAAAAICAHAAAAAAAAAAAAAAAAAAAAAAAAePgAAAAAAAAAAAAgIAcAAAAAAAAAAAAAAAAAAAAAAAB4YAAAAAAAAAAAAOCQBwAAAAAAAAAAAAAAAAAAAAAAAHgAAAAAAAAAAAAAgI8HAAAAAAAAAAAAAAAAAAAAAAAAeAAAAAAAAAAAAAAAAgcAAAAAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAICDBwAAAAAAAAAAAAAAAAAAAAAAAHgAAAAAAAAAAAIAgIcHAAAAAAAAAAAAAAAAAAAAAAAAeAAAAAAAAAAAAACAhwcAAAAAAAAAAAAAAAAAAAAAAAD4AwAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAHicAQAAAAAAAADmTgAHAAAAAAAAAAAAAAAAAAAAAAAAeAAAAAAAAAAAEBREAAcAAAAAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAHgAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAAAAAAAAeAgAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAB4GAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAHiAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAAAAAAAAeAAKAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAB4ABgAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAHgAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAAAAAAAAeAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAHgAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAAAAAAAAeAAAAAAAAAAAAAAACAcAAAAAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAHgAAAAAAAAAAAAAAAEHAAAAAAAAAAAAAAAAAAAAAAAAeAAAAAAAAAAAAAAAQAcAAAAAAAAAAAAAAAAAAAAAAAD4AAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAACAK2QvBwAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAABAAAAAHAAAAAAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAHAAAAAAAAAP4bAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAcAAAAAAADgBrgDAAAAAAAAAABwAAAAAAAAAAAAAAAABwAAAAAAANhCOA8AAAAAAAAAAPAAAAAAAAAAAAAAAAAHAAAAAAAAjGIgPAAAAAAAAAAAcAAAAAAAAAAAAAAAAAcAAAAAAACPISB0AAAAAAAAAABwHgAAAAAAAAAAAAAABwAAAAAAAI8BIGAAAAAAAAAAAHAAAAAAAAAAAAAAAAAHAAAAAAAAg30/YAAAAAAAAAAAcAAAAAAAAAAAAAAAAAcAAAAAAICABEAhAAAAAAAAAAB4AAAAAAAAAAAAAAAABwAAAAAAgDAEQIwBAAAAAAAAADgAAAAAAAAAAAAAAAAAAAAAAADABQQA8AEAAAAAAAAAPAAAAAAAAAAAAAAAAP7///8PAOADgCHAgwcAAAAAAAA/AAAAAAAAAAAAAAAA//////8A8AEAAMDDHwCA/////x8AAAAAAAAAAAAAAAD//////x/4AgAAgOd/AP//////DwAAAAAAAAAAAAAAAAAAAAD4/38GAAAA7/////////8HAAAAAAAAAAAAAAAAAAAAAID/HwQAAADs////////AwAAAAAAAAAAAAAAAAAAAAAAAIAfAAAAAPj7//8DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAA6OP/BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAAAADgAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeAAAAQPgDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH8AAAAA/gMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9wAAAIDnAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADHmPP/GOMDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMcAAAAA4QMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAxwAAAADhAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACHAAAAAOADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMcAAAAA4AMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAADgAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAAAAOEDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAAA4QcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////////BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////8HAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///////wcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////////BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAD///////8HAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///////wcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////////BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////8HAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///////wcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////////BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////8HAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAAAwAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAADAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAAAAMADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAAAwAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAADAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAwDAMADAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAgAAcAAAAAwgMEAAIAAAAAAAAAAAAAAAAAAAAAAADAAAAABwAAAADAAwgAAAAAAAAAAAAAAAAAAAAAAAAAAIABCAAGAAAAAMADEIABAAAAAAAAAAAAAAAAAAAAAAAAAA8OAAYAAAAAwAPw4AAAAAAAAAAAAAAAAAAAAAAAAAAA/gMABgAAAADAA+A/AAAAAAAAAAAAAAAAAAAAAAAAAACcAQAGAAAAAMADwBkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAwAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAABgAAAADAA8AyAAAAAAAAAAAAAAAAAAAAAAAAAAD+AAAGAAAAAMADwD8AAAAAAAAAAAAAAAAAAAAAAAAAAPwAAAAAAAAAwAPAHwAAAAAAAAAAAAAAAAAAAAAAAAAA+AAAAAAAAADAA8AfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

  // js/internal-collision-mask.ts
  var INTERNAL_COLLISION_CELL_SIZE = 2;
  var INTERNAL_COLLISION_COLUMNS = 256;
  var INTERNAL_COLLISION_ROWS = 384;
  var INTERNAL_COLLISION_BITS = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAD+AQAAAAAAAPj///////8HAAAAAQAAAAAAAAAAAAAAAP4BAAAAAAAA/P///////wcAAEAAAAAAAAAAAAAAAAAA/gEAAAAAAAD+////////BwAAAAAAAAAAAAAAAAAAAAD+AQAAAAAAAP7///////8HAAAAAAAAAAAAAAAAAAAAAP4BAAAAAAAA/////////wcAAAAAAAAAAAAAAAAAAAAA/gEAAAAAAAD/////////BwAAAAAAAAAAAAAAAAAAAAD+AQAAAAAA8P////////8HAAAAAAAAAAAAAAAAAAAAAP4BAAAAAMD///////////////////8fAAAAAAAAAAAA/gEAAAAA/P//AwAAAAD8/////////38AAAAAAAAAAAD+AQAAAPj///8HAAAAAPz//////////wAAAAAAAAAAAP5/AADA/////wcAAAAA/P//////////AAAAAAAAAAAA/v//////////DwAAAAD8//////////8BAAAAAAAAAAD+//////////8PAAAAAPz//////////wEAAAAAAAAAAP7//////////w8AAAAA/P//////////AQAAAAAAAAAA/v//////////DwAAAAD8//////////8BAAAAAAAAAAD+//////////8PAAAAAPyfAAAAAAAA/gEAAAAAAAAAAP7//////////w8AAAAA/B8AAAAAAAD+AQAAAAAAAAAA/v//////////DwAAAAD8HwAAAAAAAP4BAAAAAAAAAAD+//////////8PAAAAAPwfAAAAAAAA/gEAAAAAAAAAAP7//////////w8AAAAA/P//////////AQAAAAAAAAAA/v//////////DwAAAAD8//////////8BAAAAAAAAAAD+//////////8PAAAAAPz//////////wEAAAAAAAAAAP7//////////w8AAAAA/P//////////AwAAAAAAAAAA/v//////////DwAAAAD8//////////8DAAAAAAAAAAD+//////////8PAAAAAPz//////////wMAAAAAAAAAAP7//////////w8AAAAA/P//////////AwAAAAAAAAAA/v//////////DwAAAAD8//////////8DAAAAAAAAAAD+//////////8HAAAAAPz//////////wMAAAAAAAAAAP7//////////wcAAAAA/P//////////BwAAAAAAAAAA/v//////////BwAAAAD8//////////8HAAAAAAAAAAD+//////////8HAAAAAPz//////////w8AAAAAAAAAAP7//////////wcAAAAA/P//////////DwAAAAAAAAAA/v//////////BwAAAAD8//////////9/AAAAAAAAAAD+//////////8HAAAAAPz/////////////BwAAAAAAAP7//////////wcAAAAA/P//////////////AwAAAAAA/v//////////BwAAAAD8//////////////8HAAAAAAD+//////////8HAAAAAPz//////////////w8AAAAAAP7//////////wcAAAAA/P//////////////DwAAAAAA/gEAAAAAAAAAAAAAAAD8//////////////8fAAAAAAD+AQAAAAAAAAAAAAAAAPz//////////////x8AAAAAAP4BAAAAAAAAAAAAAAAA/P////////9/wP//HwAAAAAA/gEAAAAAAAAAAAAAAAD8/////////38AAP4fAAAAAAD+AQAAAAAAAAAAAAAAAPz/////////fwAA4B8AAAAAAP4BAAAAAAAAAAAAAAAA/P////////9/AADwHwAAAAAA/gEAAAAAAAAAAAAAAAD8/////////38AAPAfAAAAAAD+AQAAAAAAAAAAAAAAAPz/////////fwAA8A8AAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwDwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAPAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8A8AAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwDwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAPAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8A8AAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwDwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAPAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8A8AAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwDwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAPAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8A8AAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwDwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAPAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8A8AAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwDwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAPAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8A8AAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwDwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAPAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8A8AAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwDwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAPAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8A8AAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwDwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAPAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8A8AAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwDwAAAAAA/gEAAOD/PwAAAAAAAAAAAAAAAAAAAAAAAPAPAAAAAAD+AQAA+P//AAAAAAAAAAAAAAAAAAAAAAAA8A8AAAAAAP4BAAD4//8BAAAAAAAAAAAAAAAAAAAAAADwDwAAAAAA/gEAAPz//wEAAAAAAAAAAAAAAAAAAAAAAPAPAAAAAAD+AQAA/P//AwAAAAAAAAAAAAAAAAAAAAAA8A8AAAAAAP4BAAD8//8DAAAAAAAAAAAAAAAAAAAAAADwDwAAAAAA/gEAAPz//wMAAAAAAAAAAAAAAAAAAAAAAPAPAAAAAAD+AQAA/P//AwAAAAAAAAAAAAAAAAAAAAAA8A8AAAAAAP4BAAD8//8DAAAAAAAAAAAAAAAAAAAAAMD/DwAAAAAA/gEAAPz//wMAAAAAAAAAAAAAAAAAAAD///8PAAAAAAD+AQAA/P//AwAAAAAAAAAAAAAAAMD//////w8AAAAAAP4BAAD8//8DAAAAAAAAAAAAAAAA4P//////DwAAAAAA/gEAAPz//wMAAAAAAAAAAAAAAADw//////8HAAAAAAD+AQAA/P//AwAAAAAAAAAAAAAAAPD//////wMAAAAAAP4BAAD8//8DAAAAAAAAAAAAAAAA8P//////AAAAAAAA/gEAAPj//wMAAAAAAAAAAAAAAADw/////x8AAAAAAAD+AQAA+P//AwAAAAAAAAAAAAAAAPD///9/AAAAAAAAAP4BAAD4//8DAAAAAAAAAAAAAAAA8P//AQAAAAAAAAAA/gEAAPj//wMAAAAAAAAAAAAAAADwDwAAAAAAAAAAAAD+AQAA+P//AwAAAAAAAAAAAAAAAPAPAAAAAAAAAAAAAP4BAAD4////HwAAAAAAAAAAAAAA8A8AAAAAAAAAAAAA/gEAAPj/////AAAAAAAAAAAAAADwDwAAAAAAAAAAAAD+AQAA+P////8DAAAAAAAAAAAAAPAPAAAAAAAAAAAAAP4B+P///////wMAAAAAAAAAAAAA8A8AAAAAAAAAAAAA/gH8////////BwAAAAAAAAAAAADwDwAAAAAAAAAAAAD+Af7///////8HAAAAAAAAAAAAAPAPAAAAAAAAAAAAAP4B/////////wcAAAAAAAAAAAAA8A8AAAAAAAAAAAAA/oH/////////DwAAAAAAAAAAAADwDwAAAAAAAAAAAAD+gf////////8PAAAAAAAAAAAAAPAPAAAAAAAAAAAAAP7B/////////w8AAAAAAAAAAAAA8A8AAAAAAAAAAAAA/sH/////////DwAAAAAAAAAAAADwDwAAAAAAAAAAAAD+wf////////8PAAAAAAAAAAAAAPAPAAAAAAAAAAAAAP7h/////////w8AAAAAAAAAAAAA8A8AAAAAAAAAAAAA/uH/////////DwAAAAAAAAAAAADwDwAAAAAAAAAAAAD+4f////////8PAAAAAAAAAAAAAPAPAAAAAAAAAAAAAP7h/////////w8AAAAAAAAAAAAA+P//////DwAAAAAA/uH/////////DwAAAAAAAAAAAAD4//////8PAAAAAAD+4f////////8PAAAAAAAAAAAAAPj//////w8AAAAAAP7h/////////w8AAAAAAAAAAAAA+P//////DwAAAAAA/uH/////////DwAAAAAAAAAAAAD4//////8PAAAAAAD+4f////////8PAAAAAAAAAAAAAPj//////w8AAAAAAP7h/////////w8AAAAAAAAAAAAA+P//////DwAAAAAA/uH/////////DwAAAAAAAAAAAAD4//////8PAAAAAAD+4f////////8PAAAAAAAAAAAAAPj//////w8AAAAAAP7h/////////w8AAAAAAAAAAAAA+P//////DwAAAAAA/sH/////////DwAAAAAAAAAAAAD4//////8PAAAAAAD+wf////////8PAAAAAAAAAAAAAPj//////w8AAAAAAP7B/////////w8AAAAAAAAAAAAA+P//////DwAAAAAA/sH/////////DwAAAAAAAAAAAAD4//////8PAAAAAAD+wf////////8PAAAAAAAAAAAAAPj//////w8AAAAAAP7B/////////wcAAAAAAAAAAAAA+P//////DwAAAAAA/oH/////////BwAAAAAAAAAAAAD4//////8PAAAAAAD+gf////////8HAAAAAAAAAAAAAPj//////w8AAAAAAP6B/////////wcAAAAAAAAAAAAA+P//////DwAAAAAA/gH/////////BwAAAAAAAAAAAAD4//////8PAAAAAAD+Af////////8HAAAAAAAAAAAAAPj//////w8AAAAAAP4B/v///////wcAAAAAAAAAAAAA+P//////DwAAAAAA/gH8////////BwAAAAAAAAAAAAD4//////8PAAAAAAD+Afj///////8HAAAAAAAAAAAAAPj//////w8AAAAAAP4B+P///////wcAAAAAAAAAAAAA+P//////DwAAAAAA/gH4////////BwAAAAAAAAAAAAD4//////8PAAAAAAD+Afj///////8HAAAAAAAAAAAAAPj//////w8AAAAAAP4B+P///////wcAAAAAAAAAAAAAAAAAAAD4BwAAAAAA/gH4////////BwAAAAAAAAAAAAAAAAAAAPgHAAAAAAD+Afj///////8HAAAAAAAAAAAAAAAAAAAA+AcAAAAAAP4B+P///////wcAAAAAAAAAAAAAAAAAAAD4BwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgHAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AcAAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4BwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgHAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AcAAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4BwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgHAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AcAAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4BwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgHAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AcAAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4BwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgHAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AcAAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4BwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgHAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AcAAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4BwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgHAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AcAAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4BwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgHAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AcAAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4BwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgHAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AcAAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4BwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgHAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AcAAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4BwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgHAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AcAAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4BwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgHAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AcAAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4BwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgHAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AcAAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4BwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgHAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AcAAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4BwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgHAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AcAAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4BwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgHAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AcAAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4BwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgHAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AcAAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4BwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgPAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+A8AAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwDwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAPAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8A8AAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwHwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAfAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4B8AAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgHwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAfAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4B8AAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgHwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAfAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4B8AAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgHwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAfAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4B8AAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgHwAAAAAA/gEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAfAAAAAAD+AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4B8AAAAA/P/////////////////////////////////vHwAAAAD8/////////////////////////////////+8fAAAAAPz/////////////////////////////////7x8AAAAA/P/////////////////////////////////vHwAAAAD8/////////////////////////////////+8fAAAAAPz//////////////////////////////////x8AAAAA/P//////////////////////////////////HwAAAAD8/////////////////////////////////w8PAAAAAAD+AwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP4DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/gMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8AwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPwDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/AMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8AwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPwDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/AMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8AwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPwDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/AMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8AwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPwDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/AMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8AwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPwDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

  // js/music-house-collision-mask.ts
  var MUSIC_HOUSE_COLLISION_CELL_SIZE = 2;
  var MUSIC_HOUSE_COLLISION_COLUMNS = 272;
  var MUSIC_HOUSE_COLLISION_ROWS = 363;
  var MUSIC_HOUSE_COLLISION_BITS = "//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////7///////////////////////////////////////8/AAD8////////////////////////////////////////PwAA/P////////////////////8PAAD+/////////////x8AAPz/////////////////////BwAA/P////////////8fAAD8/////////////////////wcAAPz/////////////HwAA/P////////////////////8HAAD8/////////////x8AAPz/////////////////////AwAA/P////////////8fAAD8/////////////////////wMAAPz/////////////HwAA/P////////////////////8DAAD8/////////////x8AAPz/////////////////////AwAA+P////////////8fAAD8/////////////////////wMAAPj/////////////HwAA/P////////////////////8DAAD4/////////////z8AAPz/////////////////////AwAA+P////////////8/AAD8/////////////////////wMAAPj/////////////PwAA+P////////////////////8DAAD4/////////////z8AAPj/////////////////////AwAA+P////////////8/AAD4/////////////////////wMAAPj/////////////PwAA+P////////////////////8DAAD4/////////////z8AAPj/////////////////////AwAA+P////////////9/AAD4/////////////////////wMAAPj/////////////fwAA+P////////////////////8DAAD4//////////////8AAPj/////////////////////AwAA+P//////////////AQD4/////////////////////wMAAPj//////////////wMA+P////////////////////8DAAD4//////////////8HAPj/////////////////////AwAA8P//////////////DwD4/////////////////////wMAAPD//////////////w8A+P////////////////////8DAADw//////////////8fAPj/////////////////////AwAA8P//////////////PwD4/////////////////////wMAAPD//////////////z8A+P////////////////////8DAADw//////////////9/APj/////////////////////AwAA8P//////////////fwDw/////////////////////wMAAPD//////////////38A8P////////////////////8DAADw//////////////9/APD/////////////////////AwAA4P//////////////fwDg/////////////////////wMAAOD//////////////38AwP////////////////////8DAADg//////////////9/AID/////////////////////AwAA4P//////////////fwAA/////////////////////wMAAOD//////////////38AAP7///////////////////8DAADg//////////////9/AAD8////////////////////AwAA4P//////////////fwAA+P///////////////////wEAAMD//////////////38AAPj///////////////////8BAADA//////////////9/AADw////////////////////AAAAwP//////////////fwAA4P//////////////////PwAAAMD//////////////38AAMD//////////////////x8AAADA//////////////9/AADA//////////////////8PAAAAgP//////////////fwAAgP//////////////////BwAAAID//////////////z8AAAD//////////////////wMAAACA//////////////8/AAAA//////////////////8BAAAAgP//////////////PwAAAP7/////////////////AAAAAID//////////////z8AAAD8////////////////fwAAAACA//////////////8/AAAA8P///////////////z8AAAAAAP//////////////PwAAAOD///////////////8fAAAAAAD//////////////z8AAADA////////////////DwAAAAAA//////////////8/AAAAgP///////////////wcAAAAAAP//////////////PwAAAAD///////////////8DAAAAAAD//////////////z8AAAAA////////////////AQAAAAAA//////////////8/AAAAAP7//////////////wAAAAAAAP//////////////PwAAAAD8/////////////38AAAAAAAD//////////////z8AAAAA/P////////////8/AAAAwP8D//////////////8/AAAAAPj/////////////DwAAAOD/n///////////////PwAAAADw/////////////wcAAADg/////////////////x8AAAAA8P////////////8DAAAA4P////////////////8fAAAAAMD/////////////AQAAAOD/////////////////HwAAAACA/////////////wAAAADg/////////////////x8AAAAAAP7//////////38AAAAA4P////////////////8fAAAAAAD4//////////8/AAAAAOD/////////////////HwAAAAAA4P//////////HwAAAADg/////////////////x8AAAAAAAD8/////////x8AAAAA4P////////////////8fAAAAAAAAAP////////8PAAAAAOD/////////////////HwAAAAAAAAAAAAAAgP//BwAAAADg/////////////////x8AAAAAAAAAAAAAAAAAAAAAAAAA4P////////////////8fAAAAAAAAAAAAAAAAAAAAAAAAAOD/////////////////HwAAAAAAAAAAAAAAAAAAAAAAAADg/////////////////x8AAAAAAAAAAAAAAAAAAAAAAAAAwP////////////////8fAAAAAAAAAAAAAAAAAAAAAAAAAMD/////////////////HwAAAAAAAAAAAAAAAAAAAAAAAADA/////////////////x8AAAAAAAAAAAAAAAAAAAAAAAAAwP////////////////8fAAAAAAAAAAAAAAAAAAAAAAAAAID/////////////////HwAAAAAAAAAAAAAAAAAAAAAAAACA/////////////////x8AAAAAAAAAAAAAAAAAAAAAAAAAgP////////////////8fAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////////////HwAAAAAAAAAAAAAAAAAAAAAAAAAA/////////////////x8AAAAAAAAAAAAAAAAAAAAAAAAAAP////////////////8fAAAAAAAAAAAAAAAAAAAAAAAAAAD+////////////////HwAAAAAAAAAAAAAAAAAAAAAAAAAA/v///////////////x8AAAAAAAAAAAAAAAAAAAAAAAAAAP7///////////////8fAAAAAAAAAAAAAAAAAAAAAAAAAAD8////////////////HwAAAAAAAAAAAAAAAAAAAAAAAAAA/P///////////////x8AAAAAAAAAAAAAAAAAAAAAAAAAAPz///////////////8fAAAAAAAAAAAAAAAAAAAAAAAAAAD8////////////////HwAAAAAAAAAAAAAAAAAAAAAAAAAA/P///////////////x8AAAAAAAAAAAAAAAAAAAAAAAAAAPz///////////////8fAAAAAAAAAAAAAAAAAAAAAAAAAAD4////////////////HwAAAAAAAAAAAAAAAAAAAAAAAAAA+P///////////////x8AAAAAAAAAAAAAAAAAAAAAAAAAAPj///////////////8fAAAAAAAAAAAAAAAAAAAAAAAAAAD4////////////////HwAAAAAAAAAAAAAAAAAAAAAAAAAA+P///////////////x8AAAAAAAAAAAAAAAAAAAAAAAAAAPj///////////////8fAAAAAAAAAAAAAAAAAAAAAAAAAAD4////////////////HwAAAAAAAAAAAAAAAAAAAAAAAAAA+P///////////////x8AAAAAAAAAAAAAAAAAAAAAAAAAAPD///////////////8fAAAAAAAAAAAAAAAAAAAAAAAAAADw////////////////HwAAAAAAAAAAAAAAAAAAAAAAAAAA8P///////////////x8AAAAAAAAAAAAAAAAAAAAAAAAAAPD///////////////8fAAAAAAAAAAAAAAAAAAAAAAAAAADw////////////////HwAAAAAAAAAAAAAAAAAAAAAAAAAA8P///////////////x8AAAAAAAAAAAAAAAAAAAAAAAAAAPD///////////////8fAAAAAAAAAAAAAAAAAAAAAAAAAADw////////////////HwAAAAAAAAAAAAAAAAAAAAAAAAAA8P///////////////x8AAAAAAAAAAAAAAAAAAAAAAAAAAOD///////////////8fAAAAAAAAAAAAAAAAAAAAAAAAAADg////////////////HwAAAAAAAAAAAAAAAAAAAAAAAAAA4P///////////////x8AAAAAAAAAAAAAAAAAAAAAAAAAAPD///////////////8PAAAAAAAAAAAAAAAAAAAAAAAAAADw////////////////DwAAAAAAAAAAAAAAAAAAAAAAAAAA8P///////////////w8AAAAAAAAAAAAAAAAAAAAAAAAAAPD///////////////8PAAAAAAAAAAAAAAAAAAAAAAAAAADw////////////////DwAAAAAAAAAAAAAAAAAAAAAAAAAA+P///////////////w8AAAAAAAAAAAAAAAAAAAAAAAAAAPz///////////////8PAAAAAAAAAAAAAAAAAAAAAAAA8P///////////////////38AAAAAAAAAAAAAAAAAAAAAAPj/////////////////////AQAAAAAAAAAAAAAAAAAAAAD8/////////////////////wMAAAAAAAAAAAAAAAAAAAAA/v////////////////////8HAAAAAAAAAAAAAAAAAAAAAP7/////////////////////BwAAAAAAAAAAAAAAAAAAAAD+/////////////////////w8AAAAAAAAAAAAAAAAAAAAA/v////////////////////8PAAAAAAAAAAAAAAAAAAAAAP7/////////////////////HwAAAAAAAAAAAAAAAAAAAAD+/////////////////////x8AAAAAAAAAAAAAAAAAAAAA/v////////////////////8fAAAAAAAAAAAAAAAAAAAAAP7/////////////////////PwAAAAAAAAAAAAAAAAAAAAD+/////////////////////z8AAAAAAAAAAAAAAAAAAAAA/v////////////////////8/AAAAAAAAAAAAAAAAAAAAAP7/////////////////////PwAAAAAAAAAAAAAAAAAAAAD+/////////////////////38AAAAAAAAAAAAAAAAAAAAA//////////////////////9/AAAAAAAAAAAAAAAAAAAAAP///////////////////////wAAAAAAAAAAAAAAAAAAAAD///////////////////////8AAAAAAAAAAAAAAAAAAAAA////////////////////////AQAAAAAAAAAAAAAAAAAAAP///////////////////////wMAAAAAAAAAAAAAAAAAAID///////////////////////8DAAAAAAAAAAAAAAAAAACA////////////////////////BwAAAAAAAAAAAAAAAAAAgP///////////////////////wcAAAAAAAAAAAAAAAAAAMD///////////////////////8PAAAAAAAAAAAAAAAAAADg////////////////////////DwAAAAAAAAAAAAAAAAAA/////////////////////////38AAAAAAAAAAAAAAAAA8P///////////////////////////wEAAAAAAAAAAAAAgP////////////////////////////8HAAAAAAAAAAAAAPj/////////////////////////////DwAAAAAAAAAAAAD//////////////////////////////x8AAAAAAAAAAACA//////////////////////////////8fAAAAAAAAAAAAwP//////////////////////////////PwAAAAAAAAAAAOD///////////////////////////////8AAAAAAAAAAADg////////////////////////////////AAAAAAAAAAAA4P///////////////////////////////wEAAAAAAAAAAPD///////////////////////////////8DAAAAAAAAAADw////////////////////////////////BwAAAAAAAAAA+P///////////////////////////////w8AAAAAAAAAAPz///////////////////////////////8PAAAAAAAAAAD8////////////////////////////////HwAAAAAAAAAA/v///////////////////////////////x8AAAAAAAAAAP////////////////////////////////8/AAAAAAAAAAD/////////////////////////////////PwAAAAAAAAAA/////////////////////////////////z8AAAAAAAAAAP////////////////////////////////8/AAAAAAAAAAD/////////////////////////////////PwAAAAAAAAAA/////////////////////////////////z8AAAAAAAAAAP////////////////////////////////8/AAAAAAAAAAD+////////////////////////////////PwAAAAAAAAAA/v///////////////////////////////z8AAAAAAAAAAP7///////////////////////////////8/AAAAAAAAAAD+////////////////////////////////PwAAAAAAAAAA/P///////////////////////////////z8AAAAAAAAAAPz///////////////////////////////8/AAAAAAAAAAD+////////////////////////////////PwAAAAAAAAAA/v///////////////////////////////z8AAAAAAAAAAP7///////////////////////////////8/AAAAAAAAAAD+////////////////////////////////PwAAAAAAAAAA/v///////////////////////////////38AAAAAAAAAAP7///////////////////////////////9/AAAAAAAAAAD+////////////////////////////////fwAAAAAAAAAA/v///////////////////////////////38AAAAAAAAAAP7///////////////////////////////9/AAAAAAAAAAD+////////////////////////////////fwAAAAAAAAAA/v////////////////////////////////8AAAAAAAAAAP7/////////////////////////////////AAAAAAAAAAD//////////////////////////////////wAAAAAAAAAA//////////////////////////////////8AAAAAAAAAAP//////////////////////////////////AAAAAAAAAAD//////////////////////////////////wAAAAAAAAAA//////////////////////////////////8AAAAAAAAAAP//////////////////////////////////AAAAAAAAAAD//////////////////////////////////wAAAAAAAAAA//////////////////////////////////8AAAAAAAAAAP//////////////////////////////////AAAAAAAAAAD//////////////////////////////////wAAAAAAAAAA//////////////////////////////////8AAAAAAAAAAP//////////////////////////////////AAAAAAAAAAD//////////////////////////////////wAAAAAAAAAA//////////////////////////////////8AAAAAAAAAAP//////////////////////////////////AAAAAAAAAAD//////////////////////////////////wAAAAAAAAAA////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////";

  // js/mansion-collision-mask.ts
  var MANSION_COLLISION_CELL_SIZE = 2;
  var MANSION_COLLISION_COLUMNS = 256;
  var MANSION_COLLISION_ROWS = 384;
  var MANSION_COLLISION_BITS = "/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////3/4////////////////////////////////////////f4D///8BAID///////////////////////////////9/APD/AQAAAADw////HwD4/////////////////////38AAAAAAAAAAAAAAAAAAAD+/3/+////////////////fwAAAAAAAAAAAAAAAAAAAAAAAP7///////////////9/AAAAAAAAAAAAAAAAAAAAAAAA/v///////////////38AAAAAAAAAAAAAAAAAAAAAAAD+////////////////fwAAAAAAAAAAAAAAAAAAAAAAAP7///////////////9/AAAAAAAAAAAAAAAAAAAAAAAA/P///////////////38AAAAAAAAAAAAAAAAAAAAAAAD8////////////////fwAAAAAAAAAAAAAAAAAAAAAAAPD///////////////9/AAAAAAAAAAAAAAAAAAAAAAAAwP///////////////38AAAAAAAAAAAAAAAAAAAAAAAAAAP//P4D/////////fwAAAAAAAAAAAAAAAAAAAAAAAAAAgP8AgP////////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA/////////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/////////fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgP////////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA/////////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/////////fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgP////////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA/////////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/////////fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgP////////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA/////////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/////////fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgP////////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA/////////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/////////PwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgP////////8/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA/////////z8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/////////PwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgP////////8/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA/////////z8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/////////PwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgP////////8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA/////////x8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/////////HwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgP////////8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA/////////x8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/////////HwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgP////////8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA/////////w8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/////////DwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgP////////8PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA/////////w8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/////////DwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgP////////8PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA/////////w8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/////////DwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgP////////8PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA/////////w8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/////////DwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgP////////8PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA/////////w8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/////////DwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgP////////8PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA/////////w8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/////////DwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgP////////8PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////w8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////DwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////w8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////DwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////w8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////DwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////w8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////DwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7///////8PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v///////w8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+////////DwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7///////8PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v///////w8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+////////DwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7///////8PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v///////w8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+////////DwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7///////8PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v///////w8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+////////DwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7///////8PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v///////w8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+////////DwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7///////8PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v///////w8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////DwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////w8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////HwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////x8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////HwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////x8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////HwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////x8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////HwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////x8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////HwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////x8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////HwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7///////8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v///////x8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+////////HwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7///////8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v///////x8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+////////HwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7///////8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v///////x8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+////////HwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7///////8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v///////x8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+////////HwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7///////8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v///////x8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+////////HwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7///////8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v///////x8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+////////HwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////x8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////PwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////z8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////PwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////z8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////PwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////z8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v///////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+////////fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7///////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v///////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+////////fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7///////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v///////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+////////fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7///////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v///////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////fwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////9/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////38AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////PwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////z8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////PwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA/////////z8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/////////PwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgP////////8/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA/////////z8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAID/////////PwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgP//////////AAAAAAAAAAAAAAAAAAAAAACA////////////////////AwAAAAAAAAAAAAAAAADw////////////////////////AQAAAAAAAAAAAAAAAPz///////////////////////////////9/AAAAAAAA/v////////////////////////////////8DAAAAAAD//////////////////////////////////wcAAAAAgP//////////////////////////////////BwAAAACA////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////";

  // js/tim-location.ts
  var TIM_AT_MUSIC_SHOP_KEY = "max-game:tim-at-music-shop";
  function isTimAtMusicShop() {
    return readStorage(TIM_AT_MUSIC_SHOP_KEY) === "true";
  }

  // js/interior-scenes.ts
  var DEFAULT_WIDTH = 512;
  var DEFAULT_HEIGHT = 768;
  var CAVE_WIDTH = 640;
  var CAVE_HEIGHT = 320;
  var NOEL = {
    x: DEFAULT_WIDTH / 2,
    y: DEFAULT_HEIGHT / 2 + 36,
    width: 52,
    height: 72
  };
  var CAVE_COLANDER = {
    x: 518,
    y: 292,
    eraseX: 486,
    eraseY: 268,
    eraseWidth: 63,
    eraseHeight: 46
  };
  var CAVE_WALLS = [
    [0, 0, CAVE_WIDTH, 47],
    [0, 0, 66, CAVE_HEIGHT],
    [574, 0, 66, CAVE_HEIGHT]
  ];
  var DIARY_LAB_DOORS = [
    {
      triggerX: 153,
      triggerY: 595,
      exitX: 153,
      exitY: 650,
      sourceX: 60,
      sourceY: 15,
      sourceWidth: 280,
      sourceHeight: 325,
      x: 80,
      y: 559,
      width: 126,
      height: 130
    },
    {
      triggerX: 359,
      triggerY: 595,
      exitX: 359,
      exitY: 650,
      sourceX: 645,
      sourceY: 15,
      sourceWidth: 280,
      sourceHeight: 325,
      x: 308,
      y: 559,
      width: 126,
      height: 130
    }
  ];
  var CINEMA_DOORS = [{
    triggerX: 256,
    triggerY: 700,
    exitX: 256,
    exitY: 700,
    sourceX: 0,
    sourceY: 0,
    sourceWidth: 1246,
    sourceHeight: 1262,
    x: 194,
    y: 564,
    width: 124,
    height: 126
  }];
  var CAVE_DOORS = [{
    triggerX: CAVE_WIDTH / 2,
    triggerY: CAVE_HEIGHT - 10,
    exitX: CAVE_WIDTH / 2,
    exitY: CAVE_HEIGHT - 10,
    sourceX: 0,
    sourceY: 0,
    sourceWidth: 1,
    sourceHeight: 1,
    x: CAVE_WIDTH / 2 - 10,
    y: CAVE_HEIGHT - 32,
    width: 20,
    height: 32
  }];
  var MUSIC_SHOP_DOORS = [{
    triggerX: 272,
    triggerY: 660,
    exitX: 272,
    exitY: 682,
    sourceX: 0,
    sourceY: 0,
    sourceWidth: 1,
    sourceHeight: 1,
    x: 272,
    y: 660,
    width: 1,
    height: 1
  }];
  var GYM_DOORS = [{
    triggerX: 256,
    triggerY: 620,
    exitX: 256,
    exitY: 650,
    sourceX: 0,
    sourceY: 0,
    sourceWidth: 1219,
    sourceHeight: 1290,
    x: 212,
    y: 572,
    width: 90,
    height: 105
  }];
  var PLANT_ROOM_DOORS = [{
    // triggerY sits well above the visual door so the passage-open box
    // (triggerY - 30) fully covers the solid door-frame threshold in the
    // collision mask (blocked from y=563 to y=596) - otherwise a thin
    // unbridged strip there permanently walls the player out of the doorway.
    triggerX: 256,
    triggerY: 580,
    openDistance: 78,
    exitX: 256,
    exitY: 650,
    passageHalfWidth: 42,
    sourceX: 0,
    sourceY: 0,
    sourceWidth: 215,
    sourceHeight: 255,
    x: 202,
    y: 560,
    width: 108,
    height: 128
  }];
  var BOOKSHOP_DOORS = [{
    triggerX: 256,
    triggerY: 610,
    exitX: 256,
    exitY: 645,
    sourceX: 0,
    sourceY: 0,
    sourceWidth: 1024,
    sourceHeight: 1536,
    x: 208,
    y: 558,
    width: 95,
    height: 130
  }];
  var MANSION_DOORS = [{
    triggerX: 256,
    triggerY: 620,
    exitX: 256,
    exitY: 650,
    sourceX: 0,
    sourceY: 0,
    sourceWidth: 1,
    sourceHeight: 1,
    x: 256,
    y: 620,
    width: 1,
    height: 1
  }];
  var DIARY_COLLISION = {
    bits: INTERNAL_COLLISION_BITS,
    cellSize: INTERNAL_COLLISION_CELL_SIZE,
    columns: INTERNAL_COLLISION_COLUMNS,
    rows: INTERNAL_COLLISION_ROWS
  };
  var CINEMA_COLLISION = {
    bits: CINEMA_COLLISION_BITS,
    cellSize: CINEMA_COLLISION_CELL_SIZE,
    columns: CINEMA_COLLISION_COLUMNS,
    rows: CINEMA_COLLISION_ROWS
  };
  var MUSIC_COLLISION = {
    bits: MUSIC_HOUSE_COLLISION_BITS,
    cellSize: MUSIC_HOUSE_COLLISION_CELL_SIZE,
    columns: MUSIC_HOUSE_COLLISION_COLUMNS,
    rows: MUSIC_HOUSE_COLLISION_ROWS
  };
  var GYM_COLLISION = {
    bits: GYM_COLLISION_BITS,
    cellSize: GYM_COLLISION_CELL_SIZE,
    columns: GYM_COLLISION_COLUMNS,
    rows: GYM_COLLISION_ROWS
  };
  var GARDEN_COLLISION = {
    bits: GARDEN_COLLISION_BITS,
    cellSize: GARDEN_COLLISION_CELL_SIZE,
    columns: GARDEN_COLLISION_COLUMNS,
    rows: GARDEN_COLLISION_ROWS
  };
  var BOOKSHOP_COLLISION = {
    bits: BOOKSHOP_COLLISION_BITS,
    cellSize: BOOKSHOP_COLLISION_CELL_SIZE,
    columns: BOOKSHOP_COLLISION_COLUMNS,
    rows: BOOKSHOP_COLLISION_ROWS
  };
  var MANSION_COLLISION = {
    bits: MANSION_COLLISION_BITS,
    cellSize: MANSION_COLLISION_CELL_SIZE,
    columns: MANSION_COLLISION_COLUMNS,
    rows: MANSION_COLLISION_ROWS
  };
  function getInteriorScene(enteredDoor2) {
    if (enteredDoor2 === CAVE_DOOR_ID || enteredDoor2 === "cave") {
      return {
        kind: "cave",
        title: "Cave",
        ariaLabel: "Cave interior",
        width: CAVE_WIDTH,
        height: CAVE_HEIGHT,
        sourceScale: 1,
        backgroundSource: "../img/internal/cave.jpg?v=20260901-half-size-no-sword",
        doors: CAVE_DOORS,
        interactions: [
          {
            kind: "siblings",
            label: "Talk to Maddy and Marina",
            x: CAVE_SIBLINGS.x,
            y: CAVE_SIBLINGS.endY,
            distance: CAVE_SIBLINGS.interactionDistance
          },
          { kind: "colander", label: "Pick up colander", x: CAVE_COLANDER.x, y: CAVE_COLANDER.y, distance: 78 }
        ],
        playerStart: { x: CAVE_WIDTH / 2, y: CAVE_HEIGHT - 36 }
      };
    }
    if (enteredDoor2 === "cinema") {
      return {
        kind: "cinema",
        title: "Cinema",
        ariaLabel: "Cinema interior",
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        sourceScale: 1,
        backgroundSource: "../img/internal/cinema-popcorn-redrawn.png?v=20260902-clean-popcorn",
        collisionMaskSource: "../img/internal/cinema-collisions.png?v=20260831-no-bottom-bench",
        doorOverlaySource: "../img/internal/cinema-open-door.png",
        collision: CINEMA_COLLISION,
        doors: CINEMA_DOORS,
        interactions: [],
        playerStart: { x: 256, y: 650 }
      };
    }
    if (enteredDoor2 === "garden-room") {
      return {
        kind: "plantRoom",
        title: "Plant Room",
        ariaLabel: "Plant Room interior",
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        sourceScale: 2,
        backgroundSource: "../img/internal/garden.png",
        doorOverlaySource: "../img/internal/garden-door.png",
        collision: GARDEN_COLLISION,
        doors: PLANT_ROOM_DOORS,
        interactions: [
          { kind: "lucy", label: "Talk to Lucy", x: 355, y: 350, distance: 68 }
        ],
        playerStart: { x: 256, y: 530 }
      };
    }
    if (enteredDoor2 === "music-shop") {
      return {
        kind: "musicShop",
        title: "Music House",
        ariaLabel: "Music House interior",
        width: 543,
        height: 724,
        sourceScale: 2,
        backgroundSource: "../img/internal/internal-music.png?v=20260831-interior",
        collision: MUSIC_COLLISION,
        doors: MUSIC_SHOP_DOORS,
        interactions: [
          // Andy is behind the decks, so his interaction point sits just in
          // front of the booth where the player can reach it.
          { kind: "andy", label: "Talk to Andy", x: 258, y: 352, distance: 108 },
          { kind: "aliya", label: "Talk to Aliya", x: 130, y: 350, distance: 82 },
          ...isTimAtMusicShop() ? [{ kind: "tim", label: "Talk to Tim", x: 380, y: 475, distance: 80 }] : []
        ],
        playerStart: { x: 272, y: 625 }
      };
    }
    if (enteredDoor2 === "gym") {
      return {
        kind: "gym",
        title: "Gym",
        ariaLabel: "Gym interior",
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        sourceScale: 2,
        backgroundSource: "../img/internal/internal-gym.png",
        doorOverlaySource: "../img/internal/gym-door-open.png",
        collision: GYM_COLLISION,
        doors: GYM_DOORS,
        interactions: [
          { kind: "julian", label: "Talk to Julian", x: 331, y: 310, distance: 82 },
          { kind: "tim", label: "Talk to Tim", x: 160, y: 445, distance: 105 }
        ],
        playerStart: { x: 256, y: 575 }
      };
    }
    if (enteredDoor2 === "bookshop") {
      return {
        kind: "bookshop",
        title: "Bookshop",
        ariaLabel: "Bookshop interior",
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        sourceScale: 1,
        backgroundSource: "../img/internal/bookshop-internal.png",
        doorOverlaySource: "../img/internal/bookshop-door-open.png",
        collision: BOOKSHOP_COLLISION,
        doors: BOOKSHOP_DOORS,
        interactions: [],
        playerStart: { x: 256, y: 560 }
      };
    }
    if (enteredDoor2 === "snow-mansion") {
      return {
        kind: "mansion",
        title: "Snow Mansion",
        ariaLabel: "Snow Mansion interior",
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        sourceScale: 1,
        backgroundSource: "../img/internal/mansion.png",
        collision: MANSION_COLLISION,
        doors: MANSION_DOORS,
        interactions: [
          { kind: "noel", label: "Talk to noel", x: NOEL.x, y: NOEL.y, distance: 62 }
        ],
        playerStart: { x: 256, y: 575 }
      };
    }
    return {
      kind: "diaryLab",
      title: "Max's Diary and Laboratory",
      ariaLabel: "Diary and Laboratory interior",
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      sourceScale: 1,
      backgroundSource: "../img/internal/diary-lab.png",
      collisionMaskSource: "../img/internal/diary-lab-collision.png",
      doorOverlaySource: "../img/internal/diary-lab-doors-out.png",
      collision: DIARY_COLLISION,
      doors: DIARY_LAB_DOORS,
      interactions: [
        { kind: "noel", label: "Talk to noel", x: NOEL.x, y: NOEL.y, distance: 62 },
        { kind: "diary", label: "See journal", x: 170, y: 466, distance: 54 },
        { kind: "experiments", label: "See experiments", x: 350, y: 285, distance: 54 }
      ],
      playerStart: { x: enteredDoor2 === "diary-lab-right" ? 359 : 153, y: 563 }
    };
  }

  // js/interior-collision.ts
  var PLAYER_FRAME_WIDTH = 23;
  var PLAYER_FRAME_HEIGHT = 36;
  var PLAYER_SCALE = 2;
  var InteriorCollision = class {
    constructor(scene2, passageIsOpen) {
      this.scene = scene2;
      this.passageIsOpen = passageIsOpen;
      this.cellSize = scene2.collision?.cellSize ?? 1;
      this.columns = scene2.collision?.columns ?? 0;
      this.rows = scene2.collision?.rows ?? 0;
      const encodedBits = scene2.collision ? atob(scene2.collision.bits) : "";
      this.bits = Uint8Array.from(encodedBits, (character) => character.charCodeAt(0));
    }
    isBlocked(x, y) {
      if (x < 0 || x >= this.scene.width || y < 0 || y >= this.scene.height) return true;
      if (this.passageIsOpen(x, y)) return false;
      if (this.scene.kind === "cave") {
        return CAVE_WALLS.some(
          ([wallX, wallY, width, height]) => x >= wallX && x < wallX + width && y >= wallY && y < wallY + height
        );
      }
      const column = Math.floor(x / this.cellSize);
      const row = Math.floor(y / this.cellSize);
      if (column >= this.columns || row >= this.rows) return true;
      const cellIndex = row * this.columns + column;
      const byte = this.bits[Math.floor(cellIndex / 8)] ?? 0;
      return (byte & 1 << cellIndex % 8) !== 0;
    }
    playerIsBlocked(x, y) {
      const halfWidth = PLAYER_FRAME_WIDTH * PLAYER_SCALE * 0.29;
      const footHeight = PLAYER_FRAME_HEIGHT * PLAYER_SCALE * 0.17;
      const left = x - halfWidth;
      const right = x + halfWidth;
      const top = y - footHeight;
      for (let sampleY = top; sampleY <= y; sampleY += 3) {
        for (let sampleX = left; sampleX <= right; sampleX += 3) {
          if (this.isBlocked(sampleX, sampleY)) return true;
        }
      }
      return this.isBlocked(right, y);
    }
  };

  // js/interior-doors.ts
  var OPEN_DISTANCE = 53;
  var EXIT_DISTANCE = 18;
  var PASSAGE_HALF_WIDTH = 24;
  var PASSAGE_TOP_OFFSET = 30;
  var PASSAGE_BOTTOM_OFFSET = 24;
  var InteriorDoorsController = class {
    constructor(scene2, options) {
      this.scene = scene2;
      this.options = options;
      this.sound = new Audio("../audio/open-door.mp3");
      this.openDoorIndex = null;
      this.hasSyncedInitialDoorState = false;
      this.navigationStarted = false;
      this.sound.preload = "auto";
    }
    syncExitLink(link) {
      if (link && this.options.enteredDoor) link.href = this.returnUrl();
    }
    update(playerX, playerY) {
      const nextOpenDoorIndex = this.scene.doors.findIndex(
        (door) => Math.hypot(playerX - door.triggerX, playerY - door.triggerY) <= (door.openDistance ?? OPEN_DISTANCE)
      );
      if (this.hasSyncedInitialDoorState && this.scene.kind !== "cave" && nextOpenDoorIndex >= 0 && nextOpenDoorIndex !== this.openDoorIndex) {
        this.sound.currentTime = 0;
        void this.sound.play().catch(() => {
        });
      }
      this.openDoorIndex = nextOpenDoorIndex >= 0 ? nextOpenDoorIndex : null;
      this.hasSyncedInitialDoorState = true;
      if (this.navigationStarted) return;
      const exitDoor = this.scene.doors.find(
        (door) => Math.hypot(playerX - door.exitX, playerY - door.exitY) <= EXIT_DISTANCE
      );
      if (!exitDoor) return;
      this.navigationStarted = true;
      window.location.assign(this.returnUrl());
    }
    passageIsOpen(x, y) {
      if (this.scene.kind === "cave" || this.openDoorIndex === null) return false;
      const door = this.scene.doors[this.openDoorIndex];
      return Boolean(
        door && x >= door.triggerX - (door.passageHalfWidth ?? PASSAGE_HALF_WIDTH) && x <= door.triggerX + (door.passageHalfWidth ?? PASSAGE_HALF_WIDTH) && y >= door.triggerY - PASSAGE_TOP_OFFSET && y <= door.exitY + PASSAGE_BOTTOM_OFFSET
      );
    }
    drawOverlay(context2, overlay, cameraX, cameraY, scale) {
      if (!this.scene.doorOverlaySource) return;
      const overlayDoorIndex = this.scene.kind === "cinema" ? 0 : this.openDoorIndex;
      if (overlayDoorIndex === null) return;
      const door = this.scene.doors[overlayDoorIndex];
      if (!door) return;
      context2.drawImage(
        overlay,
        door.sourceX,
        door.sourceY,
        door.sourceWidth,
        door.sourceHeight,
        (door.x - cameraX) * scale,
        (door.y - cameraY) * scale,
        door.width * scale,
        door.height * scale
      );
    }
    returnUrl() {
      const params = new URLSearchParams();
      if (this.options.enteredDoor) params.set("door", this.options.enteredDoor);
      if (this.options.hasCaveColander()) params.set("colander", "1");
      if (this.options.sealMode) params.set("seal", "1");
      return `../index.html${params.size > 0 ? `?${params.toString()}` : ""}`;
    }
  };

  // js/interior-scenery-npcs.ts
  function drawSceneryNpcs(context2, npcs, cameraX, cameraY, scaleX, scaleY, timeMs = 0) {
    context2.save();
    context2.imageSmoothingEnabled = false;
    npcs.forEach((npc) => {
      const destinationX = Math.round((npc.x - cameraX - npc.width / 2) * scaleX);
      const destinationY = Math.round((npc.y - cameraY - npc.height) * scaleY);
      const destinationWidth = npc.width * scaleX;
      const destinationHeight = npc.height * scaleY;
      if (npc.animation) {
        const frame = Math.floor(timeMs / npc.animation.frameDurationMs) % npc.animation.frameCount;
        const framesPerRow = npc.animation.framesPerRow ?? npc.animation.frameCount;
        context2.drawImage(
          npc.image,
          frame % framesPerRow * npc.animation.frameWidth,
          Math.floor(frame / framesPerRow) * npc.animation.frameHeight,
          npc.animation.frameWidth,
          npc.animation.frameHeight,
          destinationX,
          destinationY,
          destinationWidth,
          destinationHeight
        );
        return;
      }
      context2.drawImage(npc.image, destinationX, destinationY, destinationWidth, destinationHeight);
    });
    context2.restore();
  }

  // js/katy-power.ts
  var KATY_POWER_DURATION = 1e4;
  var FIRST_TRIP_DELAY = 700;
  var TRIP_DURATION = 650;
  var TRIP_INTERVAL = 1800;
  var powerEndsAt = 0;
  var tripEndsAt = 0;
  var nextTripAt = 0;
  function movementIsHeld() {
    return isHeld("left") || isHeld("right") || isHeld("up") || isHeld("down");
  }
  function activateKatyPower(now = performance.now()) {
    powerEndsAt = now + KATY_POWER_DURATION;
    tripEndsAt = 0;
    nextTripAt = now + FIRST_TRIP_DELAY;
  }
  function updateKatyPower(now, moving = movementIsHeld()) {
    if (powerEndsAt === 0) return false;
    if (now >= powerEndsAt) {
      powerEndsAt = 0;
      tripEndsAt = 0;
      nextTripAt = 0;
      return true;
    }
    if (moving && now >= nextTripAt && now >= tripEndsAt) {
      tripEndsAt = Math.min(now + TRIP_DURATION, powerEndsAt);
      nextTripAt = now + TRIP_INTERVAL;
    }
    return false;
  }
  function katyPowerSecondsLeft(now) {
    return powerEndsAt === 0 ? 0 : Math.max(0, (powerEndsAt - now) / 1e3);
  }

  // js/inventory.ts
  var gameShell = requireElement(".game-shell");
  var METEOR_COUNT = 14;
  var ITEM_THEME_DURATION = 1e4;
  var KATY_THEME_SOURCE = "chat/katy/theme.m4a";
  var MIKE_THEME_SOURCE = "chat/mike/player/theme.mp3";
  var LUCY_THEME_SOURCE = "chat/lucy/player/theme.mp3";
  var JULIAN_THEME_SOURCE = "chat/julian/theme.mp3";
  var TIM_THEME_SOURCE = "chat/tim/theme.mp3";
  var inventoryToggle = requireElement("#inventory-toggle");
  var inventoryPanel = requireElement("#inventory-panel");
  var inventoryClose = requireElement("#inventory-close");
  var inventoryItem = requireElement("#inventory-item");
  var deleteItemButton = requireElement("#delete-item");
  var itemActions = requireElement("#item-actions");
  var useItemButton = requireElement("#use-item");
  var inventoryMessage = requireElement("#inventory-message");
  var inventoryCount = requireElement(".inventory-count");
  var powerupStatus = requireElement("#powerup-status");
  var itemStatus = requireElement("#item-status");
  var readyBadge = requireElement("#ready-badge");
  var rechargeFill = requireElement("#recharge-fill");
  var announcer = requireElement("#announcer");
  var giftItems = requireElement("#gift-items");
  function announce(message) {
    inventoryMessage.textContent = message;
    announcer.textContent = message;
  }
  function playApocalypseRumble() {
    const AudioContextClass = window.AudioContext;
    const audioContext = new AudioContextClass();
    const rumble = audioContext.createOscillator();
    const rumbleGain = audioContext.createGain();
    const noise = audioContext.createBufferSource();
    const noiseFilter = audioContext.createBiquadFilter();
    const noiseGain = audioContext.createGain();
    const duration = 2.4;
    const noiseBuffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * duration), audioContext.sampleRate);
    const noiseSamples = noiseBuffer.getChannelData(0);
    for (let index = 0; index < noiseSamples.length; index += 1) {
      const fade = 1 - index / noiseSamples.length;
      noiseSamples[index] = (Math.random() * 2 - 1) * fade;
    }
    rumble.type = "sawtooth";
    rumble.frequency.setValueAtTime(55, audioContext.currentTime);
    rumble.frequency.exponentialRampToValueAtTime(28, audioContext.currentTime + duration);
    rumbleGain.gain.setValueAtTime(0.18, audioContext.currentTime);
    rumbleGain.gain.exponentialRampToValueAtTime(1e-3, audioContext.currentTime + duration);
    noise.buffer = noiseBuffer;
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 320;
    noiseGain.gain.setValueAtTime(0.16, audioContext.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(1e-3, audioContext.currentTime + duration);
    rumble.connect(rumbleGain);
    rumbleGain.connect(audioContext.destination);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioContext.destination);
    rumble.start();
    noise.start();
    rumble.stop(audioContext.currentTime + duration);
    noise.stop(audioContext.currentTime + duration);
    rumble.addEventListener("ended", () => void audioContext.close(), { once: true });
  }
  function triggerApocalypse(onExpired) {
    const overlay = document.createElement("div");
    overlay.className = "apocalypse-overlay";
    overlay.setAttribute("aria-hidden", "true");
    for (let index = 0; index < METEOR_COUNT; index += 1) {
      const meteor = document.createElement("span");
      meteor.className = "apocalypse-meteor";
      meteor.style.setProperty("--meteor-x", `${Math.round(Math.random() * 100)}%`);
      meteor.style.setProperty("--meteor-delay", `${(Math.random() * 1.6).toFixed(2)}s`);
      overlay.append(meteor);
    }
    gameShell.append(overlay);
    gameShell.classList.add("apocalypse-shake");
    window.setTimeout(() => {
      overlay.remove();
      gameShell.classList.remove("apocalypse-shake");
      onExpired?.();
    }, APOCALYPSE_DURATION);
    playApocalypseRumble();
  }
  function triggerGiftPower(className, duration) {
    gameShell.classList.remove(className);
    void gameShell.offsetWidth;
    gameShell.classList.add(className);
    window.setTimeout(() => gameShell.classList.remove(className), duration);
  }
  function playItemTheme(source) {
    itemTheme?.pause();
    itemTheme = new Audio(resolveSiteAsset(source));
    itemTheme.preload = "auto";
    void itemTheme.play().catch(() => {
    });
    window.setTimeout(() => {
      itemTheme?.pause();
      if (itemTheme) itemTheme.currentTime = 0;
      itemTheme = null;
    }, ITEM_THEME_DURATION);
  }
  function stopKatyTheme() {
    if (katyThemeTimeout) window.clearTimeout(katyThemeTimeout);
    katyThemeTimeout = 0;
    katyTheme?.pause();
    if (katyTheme) katyTheme.currentTime = 0;
    katyTheme = null;
  }
  function playKatyTheme() {
    stopKatyTheme();
    katyTheme = new Audio(resolveSiteAsset(KATY_THEME_SOURCE));
    katyTheme.preload = "auto";
    katyTheme.loop = true;
    void katyTheme.play().catch(() => {
    });
    katyThemeTimeout = window.setTimeout(stopKatyTheme, KATY_POWER_DURATION);
  }
  var speedMultiplier = 1;
  var speedBoostEndsAt = 0;
  var hasPowerSandwich = true;
  var sandwichDeleted = readStorage("max-game:power-sandwich-deleted") === "true";
  var itemRechargesAt = 0;
  var itemTheme = null;
  var katyTheme = null;
  var katyThemeTimeout = 0;
  var katyItemDescription = "";
  var getSpeedMultiplier = () => speedMultiplier;
  function setItemReady(isReady) {
    hasPowerSandwich = isReady;
    inventoryCount.textContent = String((isReady ? 1 : 0) + getCollectedGifts().length);
    inventoryItem.disabled = !isReady;
    inventoryItem.classList.toggle("item-ready", isReady);
    readyBadge.hidden = !isReady;
    rechargeFill.style.width = isReady ? "100%" : "0%";
    itemStatus.textContent = sandwichDeleted ? "Deleted" : isReady ? "Ready to use" : "Recharging";
    deleteItemButton.disabled = sandwichDeleted;
  }
  function renderGiftItems() {
    giftItems.replaceChildren();
    getCollectedGifts().forEach((item) => {
      const card = document.createElement("div");
      card.className = "inventory-gift";
      const image = document.createElement("img");
      image.src = resolveSiteAsset(item.imageSource);
      image.alt = item.name;
      const text = document.createElement("span");
      text.className = "item-text";
      const name = document.createElement("strong");
      name.textContent = item.name;
      text.append(name);
      const actions = document.createElement("span");
      actions.className = "inventory-gift-actions";
      const useButton = document.createElement("button");
      useButton.type = "button";
      useButton.textContent = "Use";
      useButton.addEventListener("click", () => {
        if (item.id === "alex-s-item") {
          playItemTheme("chat/alex s/theme.mp3");
          triggerApocalypse(() => announce(`${item.name}: ${item.description}`));
        } else if (item.id === "julian-item") {
          playItemTheme(JULIAN_THEME_SOURCE);
          triggerGiftPower("world-opening", 2400);
          announce(`${item.name}: ${item.description}`);
        } else if (item.id === "tim-item") {
          playItemTheme(TIM_THEME_SOURCE);
          triggerGiftPower("face-implosion", 1100);
          announce(`${item.name}: ${item.description}`);
        } else if (item.id === "katy-item") {
          const now = performance.now();
          activateKatyPower(now);
          playKatyTheme();
          katyItemDescription = `${item.name}: ${item.description}`;
          powerupStatus.textContent = "Katy effect 10.0s";
          powerupStatus.hidden = false;
          announce("Katy's item activated.");
        } else if (item.id === "mike-item") {
          playItemTheme(MIKE_THEME_SOURCE);
          announce(`${item.name}: ${item.description}`);
        } else if (item.id === "lucy-item") {
          playItemTheme(LUCY_THEME_SOURCE);
          triggerGiftPower("world-spinning", 1e4);
          announce(`${item.name}: ${item.description}`);
        } else {
          announce(`${item.name}: ${item.description}`);
        }
        removeGift(item);
      });
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => {
        removeGift(item);
        announce(`${item.name} deleted.`);
      });
      actions.append(useButton, deleteButton);
      card.append(image, text, actions);
      giftItems.append(card);
    });
  }
  function setItemActionsOpen(isOpen) {
    itemActions.hidden = !isOpen;
    inventoryItem.classList.toggle("selected", isOpen);
    inventoryItem.setAttribute("aria-expanded", String(isOpen));
  }
  function setInventoryOpen(isOpen) {
    const hadFocusInside = inventoryPanel.contains(document.activeElement);
    inventoryPanel.hidden = !isOpen;
    inventoryToggle.setAttribute("aria-expanded", String(isOpen));
    if (!isOpen && hadFocusInside) inventoryToggle.focus();
  }
  function setupInventory() {
    renderGiftItems();
    setItemReady(!sandwichDeleted);
    setItemActionsOpen(false);
    window.addEventListener("max-game:inventory-gift-added", () => {
      renderGiftItems();
      setItemReady(hasPowerSandwich);
      inventoryToggle.classList.remove("inventory-added-wobble");
      void inventoryToggle.offsetWidth;
      inventoryToggle.classList.add("inventory-added-wobble");
      window.setTimeout(() => inventoryToggle.classList.remove("inventory-added-wobble"), 1e3);
    });
    window.addEventListener("max-game:inventory-gift-removed", () => {
      renderGiftItems();
      setItemReady(hasPowerSandwich);
    });
    inventoryToggle.addEventListener("click", () => setInventoryOpen(inventoryPanel.hidden));
    inventoryClose.addEventListener("click", () => setInventoryOpen(false));
    inventoryItem.addEventListener("click", () => {
      if (!hasPowerSandwich) return;
      setItemActionsOpen(itemActions.hidden);
    });
    deleteItemButton.addEventListener("click", () => {
      if (sandwichDeleted) return;
      sandwichDeleted = true;
      writeStorage("max-game:power-sandwich-deleted", "true");
      itemRechargesAt = 0;
      setItemReady(false);
      setItemActionsOpen(false);
      announce("Power Sandwich deleted.");
    });
    useItemButton.addEventListener("click", () => {
      if (!hasPowerSandwich) return;
      const now = performance.now();
      speedMultiplier = BOOST_MULTIPLIER;
      speedBoostEndsAt = now + BOOST_DURATION;
      itemRechargesAt = now + RECHARGE_DURATION;
      setItemReady(false);
      setItemActionsOpen(false);
      inventoryClose.focus();
      announce("Power Sandwich used - speed increased for 10 seconds!");
      powerupStatus.hidden = false;
    });
    window.addEventListener("keydown", (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (key === "i") setInventoryOpen(inventoryPanel.hidden);
      else if (key === "Escape") setInventoryOpen(false);
    });
  }
  function updatePowerups(now) {
    if (speedBoostEndsAt > 0) {
      const secondsLeft = Math.max(0, (speedBoostEndsAt - now) / 1e3);
      const status = `Speed boost ${secondsLeft.toFixed(1)}s`;
      if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
      if (secondsLeft === 0) {
        speedMultiplier = 1;
        speedBoostEndsAt = 0;
        powerupStatus.hidden = true;
        announce("The speed boost has worn off.");
      }
    }
    if (!hasPowerSandwich && itemRechargesAt > 0) {
      const rechargeRemaining = Math.max(0, itemRechargesAt - now);
      const status = `Recharging ${(rechargeRemaining / 1e3).toFixed(1)}s`;
      if (itemStatus.textContent !== status) {
        itemStatus.textContent = status;
        rechargeFill.style.width = `${(1 - rechargeRemaining / RECHARGE_DURATION) * 100}%`;
      }
      if (rechargeRemaining === 0) {
        itemRechargesAt = 0;
        setItemReady(true);
        announce("The Power Sandwich is ready to use again!");
      }
    }
    const katyEffectExpired = updateKatyPower(now);
    const katySecondsLeft = katyPowerSecondsLeft(now);
    if (katySecondsLeft > 0) {
      const status = `Katy effect ${katySecondsLeft.toFixed(1)}s`;
      if (powerupStatus.textContent !== status) powerupStatus.textContent = status;
      powerupStatus.hidden = false;
    } else if (katyEffectExpired) {
      stopKatyTheme();
      if (speedBoostEndsAt === 0) powerupStatus.hidden = true;
      if (katyItemDescription) announce(katyItemDescription);
      katyItemDescription = "";
    }
  }

  // js/bus-intro.ts
  var searchParams = new URLSearchParams(window.location.search);
  var shouldPlay = !searchParams.has("door") && searchParams.get("niall") !== "bus";
  var skipButton = document.querySelector("#bus-intro-skip");
  var controls = document.querySelector(".controls");
  var inventoryToggle2 = document.querySelector("#inventory-toggle");
  var jumpToggle = document.querySelector("#jump-toggle");
  var musicToggle = document.querySelector("#music-toggle");
  var active = shouldPlay;
  function isBusIntroActive() {
    return active;
  }

  // js/jump.ts
  var JUMP_DESTINATIONS = [
    { id: "northwest-portal", label: "Cave" },
    { id: "garden-room", label: "Plant Room" },
    { id: "diary-lab-center", label: "Diary Lab - Center Door" },
    { id: "diary-lab-right", label: "Diary Lab - Right Door" },
    { id: "music-shop", label: "Music House" },
    { id: "gym", label: "Gym" },
    { id: "cinema", label: "Cinema" },
    { id: "bookshop", label: "Bookshop" }
  ];
  var jumpToggle2 = document.querySelector("#jump-toggle");
  var jumpPanel = document.querySelector("#jump-panel");
  var jumpClose = document.querySelector("#jump-close");
  var jumpOptions = document.querySelector("#jump-options");
  var jumpMenuOpen = false;
  var navigationStarted = false;
  var isJumpMenuOpen = () => jumpMenuOpen;
  function setJumpMenuOpen(open) {
    if (!jumpToggle2 || !jumpPanel) return;
    jumpMenuOpen = open;
    jumpPanel.hidden = !open;
    jumpToggle2.setAttribute("aria-expanded", String(open));
    if (open) {
      releaseAllInput();
      jumpPanel.querySelector(".jump-option")?.focus();
    } else {
      jumpToggle2.focus();
    }
  }
  function internalPageHref() {
    return window.location.pathname.includes("/internal/") ? "index.html" : "internal/index.html";
  }
  function jumpTo(destinationId) {
    if (navigationStarted) return;
    navigationStarted = true;
    releaseAllInput();
    const params = new URLSearchParams({ door: destinationId });
    if (hasCaveColander()) params.set("colander", "1");
    if (new URLSearchParams(window.location.search).has("seal")) params.set("seal", "1");
    window.location.assign(`${internalPageHref()}?${params.toString()}`);
  }
  function buildOptions() {
    if (!jumpOptions) return;
    JUMP_DESTINATIONS.forEach((destination) => {
      const button = document.createElement("button");
      button.className = "jump-option";
      button.type = "button";
      button.textContent = destination.label;
      button.addEventListener("click", () => jumpTo(destination.id));
      jumpOptions.append(button);
    });
  }
  function setupJump() {
    if (!jumpToggle2 || !jumpPanel || !jumpClose || !jumpOptions) return;
    buildOptions();
    jumpToggle2.addEventListener("click", () => setJumpMenuOpen(!jumpMenuOpen));
    jumpClose.addEventListener("click", () => setJumpMenuOpen(false));
    window.addEventListener("keydown", (event) => {
      if (event.code === "Escape" && jumpMenuOpen) {
        event.preventDefault();
        setJumpMenuOpen(false);
      }
    });
    document.addEventListener("click", (event) => {
      if (!jumpMenuOpen) return;
      if (event.target instanceof Node && !jumpPanel.contains(event.target) && !jumpToggle2.contains(event.target)) {
        setJumpMenuOpen(false);
      }
    });
    jumpToggle2.classList.toggle("opening-intro-hidden", isBusIntroActive());
  }

  // js/gym-npcs.ts
  var GYM_NPCS = [
    {
      // Julian is positioned just to the left of the heavy bag, cycling through
      // the selected hand-wrapping frames.
      source: "../img/internal/julian-boxing-sprite.png",
      x: 331,
      y: 310,
      width: 64,
      height: 118,
      animation: {
        frameWidth: 260,
        frameHeight: 470,
        frameCount: 7,
        frameDurationMs: 150
      }
    },
    {
      // Tim's bench-press animation is placed over the fixed bench in the
      // background, so the animated rack cleanly replaces the empty one.
      source: "../img/internal/tim-bench-press-sprite.png",
      x: 160,
      y: 445,
      width: 150,
      height: 200,
      animation: {
        frameWidth: 384,
        frameHeight: 512,
        frameCount: 8,
        frameDurationMs: 125,
        framesPerRow: 4
      }
    }
  ];

  // js/lucy-dialogue.ts
  var LUCY_DIALOGUE_LINES = [
    "Lucy here \u2014 I've saved a story just for you, Max.",
    "You're back. Did the suspiciously powerful sandwich work?",
    "Three conversations? We're basically best friends now."
  ];

  // js/lucy.ts
  var LucyController = class {
    constructor(dialogueLine, nextButton, dialogueProgress, giftConfirmation, closeDialogue) {
      this.dialogueLine = dialogueLine;
      this.nextButton = nextButton;
      this.dialogueProgress = dialogueProgress;
      this.giftConfirmation = giftConfirmation;
      this.closeDialogue = closeDialogue;
      this.sprite = new Image();
      this.lineIndex = 0;
      this.pendingGiftLine = null;
      this.pendingGiftItem = LUCY_ITEM;
      this.pendingGiftConfirmation = null;
      this.plantDiaryOfferPending = false;
      this.plantDiaryOptions = document.querySelector("#lucy-plant-diary-options");
      this.sprite.src = "../chat/lucy/avatar.png";
      document.querySelector("#lucy-plant-diary-yeh")?.addEventListener("click", this.closeDialogue);
      document.querySelector("#lucy-plant-diary-neh")?.addEventListener("click", this.closeDialogue);
    }
    start() {
      this.lineIndex = 0;
      const hasNewGift = !hasGift(this.pendingGiftItem);
      this.pendingGiftLine = hasNewGift ? nextGiftLine() : null;
      this.pendingGiftConfirmation = hasNewGift ? "An item has been added to your inventory." : null;
      this.plantDiaryOfferPending = hasNewGift;
      if (this.plantDiaryOptions) this.plantDiaryOptions.hidden = true;
      this.showLine();
    }
    next() {
      if (this.pendingGiftLine) {
        this.dialogueLine.textContent = this.pendingGiftLine;
        this.pendingGiftLine = null;
        const giftWasAdded = addGift(this.pendingGiftItem);
        this.dialogueProgress.hidden = true;
        this.giftConfirmation.textContent = giftWasAdded ? this.pendingGiftConfirmation : "";
        this.pendingGiftConfirmation = null;
        this.giftConfirmation.hidden = !giftWasAdded;
        this.nextButton.hidden = !this.plantDiaryOfferPending;
        return;
      }
      if (this.plantDiaryOfferPending) {
        this.plantDiaryOfferPending = false;
        this.dialogueLine.textContent = "Do you want to see Max's plant diary?";
        this.dialogueProgress.hidden = true;
        this.giftConfirmation.hidden = true;
        this.nextButton.hidden = true;
        if (this.plantDiaryOptions) this.plantDiaryOptions.hidden = false;
        return;
      }
      this.lineIndex = (this.lineIndex + 1) % LUCY_DIALOGUE_LINES.length;
      this.showLine();
    }
    stop() {
      this.pendingGiftLine = null;
      this.pendingGiftConfirmation = null;
      this.plantDiaryOfferPending = false;
      if (this.plantDiaryOptions) this.plantDiaryOptions.hidden = true;
      this.giftConfirmation.hidden = true;
      this.dialogueProgress.hidden = true;
    }
    showLine() {
      this.dialogueLine.textContent = LUCY_DIALOGUE_LINES[this.lineIndex] ?? "";
      this.dialogueProgress.textContent = `${this.lineIndex + 1}/${LUCY_DIALOGUE_LINES.length}`;
      this.dialogueProgress.hidden = false;
      this.nextButton.hidden = LUCY_DIALOGUE_LINES.length <= 1;
    }
  };

  // js/andy-dialogue.ts
  var ANDY_DIALOGUE_LINES = [
    "Hi there, I'm Andy. This is my first line.",
    "Hi there, I'm Andy. This is my second line.",
    "Hi there, I'm Andy. This is my third line."
  ];

  // js/music-house-dialogue.ts
  var MusicHouseDialogueController = class {
    constructor(line, nextButton, progress, confirmation) {
      this.line = line;
      this.nextButton = nextButton;
      this.progress = progress;
      this.confirmation = confirmation;
      this.andyStage = "none";
      this.andyDialogueIndex = 0;
      this.options = document.querySelector("#music-dialogue-options");
      document.querySelector("#music-yes")?.addEventListener("click", () => this.giveAndyItem());
      document.querySelector("#music-no")?.addEventListener("click", () => this.giveAndyItem());
    }
    start(kind) {
      this.andyStage = kind === "andy" ? "askMusic" : "none";
      if (kind === "andy") {
        const lineIndex = this.andyDialogueIndex;
        this.andyDialogueIndex = (lineIndex + 1) % ANDY_DIALOGUE_LINES.length;
        this.line.textContent = ANDY_DIALOGUE_LINES[lineIndex] ?? "";
        this.progress.textContent = `${lineIndex + 1}/${ANDY_DIALOGUE_LINES.length}`;
        this.progress.hidden = false;
      } else {
        this.line.textContent = "When is Andy done? It's my turn to DJ.";
        this.progress.hidden = true;
      }
      this.confirmation.hidden = true;
      this.nextButton.hidden = kind !== "andy";
      if (this.options) this.options.hidden = true;
    }
    next() {
      if (this.andyStage === "askMusic") {
        this.andyStage = "giveItem";
        this.line.textContent = "Would you like to hear Max's music?";
        this.progress.hidden = true;
        this.nextButton.hidden = true;
        if (this.options) this.options.hidden = false;
        return;
      }
      if (this.andyStage === "giveWalkman") this.giveWalkman();
    }
    stop() {
      this.andyStage = "none";
      if (this.options) this.options.hidden = true;
    }
    giveAndyItem() {
      if (this.andyStage !== "giveItem") return;
      this.andyStage = "giveWalkman";
      const received = addGift(ANDY_ITEM);
      this.line.textContent = "Here, take this.";
      this.confirmation.textContent = received ? "Andy's item was added to your inventory!" : "You already have Andy's item.";
      this.confirmation.hidden = false;
      this.nextButton.hidden = false;
      if (this.options) this.options.hidden = true;
    }
    giveWalkman() {
      if (this.andyStage !== "giveWalkman") return;
      this.andyStage = "none";
      const received = addGift(PORTABLE_WALKMAN);
      this.line.textContent = "Here, take this.";
      this.confirmation.textContent = received ? "A portable walkman was added to your inventory! You can now play music!" : "You already have a portable walkman. You can play music!";
      this.confirmation.hidden = false;
      this.nextButton.hidden = true;
      if (this.options) this.options.hidden = true;
    }
  };

  // js/music-house-npcs.ts
  var MUSIC_HOUSE_NPCS = [
    {
      source: "../chat/andy/overworld-sprite.png",
      x: 258,
      y: 280,
      width: 90,
      height: 100
    },
    {
      source: "../chat/aliya/overworld-sprite.png",
      x: 130,
      y: 350,
      width: 51,
      height: 80
    },
    {
      id: "tim",
      source: "../chat/tim/dancing.png",
      x: 380,
      y: 475,
      width: 56,
      height: 72,
      animation: {
        frameWidth: 58,
        frameHeight: 77,
        frameCount: 8,
        framesPerRow: 4,
        frameDurationMs: 270
      }
    }
  ];

  // js/world-state.ts
  var INTERIOR_VISITED_KEY = "max-game:interior-visited";
  function markInteriorVisited() {
    writeStorage(INTERIOR_VISITED_KEY, "true");
  }

  // js/noel-dialogue.ts
  var NOEL_DIALOGUE_LINES = [
    "Noel here \u2014 welcome to the lab, Max.",
    "You're back. Did the suspiciously powerful sandwich work?",
    "Three conversations? We're basically best friends now."
  ];

  // js/player-sprite.ts
  var FRAME_WIDTH2 = 23;
  var FRAME_HEIGHT2 = 36;
  var SEAL_RENDER_WIDTH = 40;
  var SEAL_RENDER_HEIGHT = 52;
  var SEAL_BASELINE_OFFSET = 6;
  var SEAL_FRAME_X = [0, 130, 254, 380, 506, 630, 754, 881];
  var SEAL_FRAME_WIDTH = [130, 124, 126, 126, 124, 124, 127, 126];
  var SEAL_ROW_Y = [0, 162, 323, 486, 646, 805, 970, 1134, 1290];
  var SEAL_ROW_HEIGHT = [162, 161, 163, 160, 159, 165, 164, 156, 164];
  var DEFAULT_DIRECTION_ROWS = {
    down: 0,
    downRight: 1,
    right: 2,
    upRight: 3,
    up: 4,
    upLeft: 5,
    left: 6,
    downLeft: 7
  };
  var SEAL_DIRECTION_ROWS = {
    down: 8,
    downRight: 7,
    right: 2,
    upRight: 5,
    up: 4,
    upLeft: 5,
    left: 3,
    downLeft: 0
  };
  function getPlayerSpriteFrame(sealMode, direction, frame, scale) {
    if (!sealMode) {
      return {
        sourceX: frame * FRAME_WIDTH2,
        sourceY: DEFAULT_DIRECTION_ROWS[direction] * FRAME_HEIGHT2,
        sourceWidth: FRAME_WIDTH2,
        sourceHeight: FRAME_HEIGHT2,
        width: FRAME_WIDTH2 * scale,
        height: FRAME_HEIGHT2 * scale,
        baselineOffset: 0
      };
    }
    const sourceFrame = frame % SEAL_FRAME_X.length;
    const sourceRow = SEAL_DIRECTION_ROWS[direction];
    return {
      sourceX: SEAL_FRAME_X[sourceFrame] ?? 0,
      sourceY: SEAL_ROW_Y[sourceRow] ?? 0,
      sourceWidth: SEAL_FRAME_WIDTH[sourceFrame] ?? 126,
      sourceHeight: SEAL_ROW_HEIGHT[sourceRow] ?? 162,
      width: SEAL_RENDER_WIDTH,
      height: SEAL_RENDER_HEIGHT,
      baselineOffset: SEAL_BASELINE_OFFSET
    };
  }

  // js/movement.ts
  function moveWithCollisions(position, movementX, movementY, isBlocked) {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(movementX), Math.abs(movementY)) / 4));
    const stepX = movementX / steps;
    const stepY = movementY / steps;
    for (let step = 0; step < steps; step += 1) {
      const nextX = position.x + stepX;
      if (!isBlocked(nextX, position.y)) position.x = nextX;
      const nextY = position.y + stepY;
      if (!isBlocked(position.x, nextY)) position.y = nextY;
    }
  }

  // js/profile-images.generated.ts
  var PROFILE_IMAGE_SOURCES = {
    "alex s": "chat/alex s/profile.jpg",
    "alice": "chat/alice/player/profile.png",
    "andy": "chat/andy/profile.jpg",
    "chris": "chat/chris/player/profile.png",
    "georgia": "chat/georgia/profile.jpg",
    "ju": "chat/ju/player/profile.png",
    "lucy": "chat/lucy/player/profile.png",
    "adam": "chat/adam/player/profile.png",
    "alex w": "chat/alex w/player/profile.png",
    "aliya": "chat/aliya/example/profile.png",
    "dan": "chat/dan/player/profile.png",
    "bochra": "chat/bochra/player/profile.png",
    "ed": "chat/ed/player/profile.png",
    "helen": "chat/helen/player/profile.png",
    "joe": "chat/joe/player/profile.png",
    "josh": "chat/josh/example/profile.png",
    "katie": "chat/katie/player/profile.png",
    "maddy": "chat/maddy/example/profile.png",
    "marina d": "chat/marina d/player/profile.png",
    "mason": "chat/mason/player/profile.png",
    "mike": "chat/mike/player/profile.png",
    "meli": "chat/meli/player/profile.png",
    "noel": "chat/noel/player/profile.png",
    "niall": "chat/niall/player/profile.png",
    "oscar": "chat/oscar/player/profile.png",
    "real": "chat/real/alex s/player/profile.png",
    "rei": "chat/rei/player/profile.png",
    "sam": "chat/sam/player/profile.png"
  };

  // js/profile-images.ts
  function profileImageSource(name) {
    const normalizedName = name.trim().toLowerCase();
    const exactMatch = PROFILE_IMAGE_SOURCES[normalizedName];
    if (exactMatch) return exactMatch;
    const matchingKey = Object.keys(PROFILE_IMAGE_SOURCES).find(
      (key) => normalizedName.startsWith(`${key} `) || key.startsWith(`${normalizedName} `)
    );
    return matchingKey ? PROFILE_IMAGE_SOURCES[matchingKey] : null;
  }
  function setProfileImage(image, name, prefix = "") {
    const source = profileImageSource(name);
    image.hidden = !source;
    image.alt = source ? `${name} profile` : "";
    if (source) image.src = `${prefix}${source}`;
    else image.removeAttribute("src");
  }

  // js/internal.ts
  var searchParams2 = new URLSearchParams(window.location.search);
  var SEAL_MODE = searchParams2.has("seal");
  var interactionPrompt = requireElement("#interaction-prompt");
  var noelDialogue = requireElement("#noel-dialogue");
  var noelSpeaker = requireElement("#noel-speaker");
  var noelDialogueLine = requireElement("#noel-dialogue-line");
  var noelDialogueProfile = requireElement("#noel-dialogue-profile");
  var noelDialogueProgress = requireElement("#noel-dialogue-progress");
  var noelGiftConfirmation = requireElement("#noel-gift-confirmation");
  var noelDialogueNext = requireElement("#noel-dialogue-next");
  var noelDialogueQuestion = requireElement("#noel-dialogue-question");
  var noelDialogueOptions = requireElement("#noel-dialogue-options");
  var siblingsDialogueOptions = requireElement("#siblings-dialogue-options");
  var siblingsViewWebsite = requireElement("#siblings-view-website");
  var siblingsDeclineButton = requireElement("#siblings-decline");
  var musicDialogueOptions = requireElement("#music-dialogue-options");
  var noelDialogueClose = requireElement("#noel-dialogue-close");
  var noelDeclineButton = requireElement("#noel-decline");
  var FRAME_COUNT2 = SEAL_MODE ? 8 : 9;
  var PLAYER_SCALE2 = 2;
  var VIEW_SCALE = 1;
  var SPEED = 145;
  var NOEL_FOLDER = "chat/noel";
  var NOEL_NAME = NOEL_FOLDER.slice(NOEL_FOLDER.lastIndexOf("/") + 1);
  var NOEL_QUESTION = "would you like to checkout some experiments Max is working on or his journal (this will require you to know his phone number)";
  var enteredDoor = searchParams2.get("door");
  var scene = getInteriorScene(enteredDoor);
  markInteriorVisited();
  var isCinemaInterior = scene.kind === "cinema";
  var isMusicShopInterior = scene.kind === "musicShop";
  var isGymInterior = scene.kind === "gym";
  var isBookshopInterior = scene.kind === "bookshop";
  var isPlantRoomInterior = scene.kind === "plantRoom";
  var isMansionInterior = scene.kind === "mansion";
  var isCaveInterior = scene.kind === "cave";
  var isDiaryLabInterior = scene.kind === "diaryLab";
  document.title = scene.title;
  canvas.setAttribute("aria-label", scene.ariaLabel);
  var WORLD_WIDTH2 = scene.width;
  var WORLD_HEIGHT2 = scene.height;
  var INTERACTION_TARGETS = scene.interactions;
  if (isCaveInterior) {
    canvas.width = WORLD_WIDTH2;
    canvas.height = WORLD_HEIGHT2;
    context.imageSmoothingEnabled = false;
    requireElement(".game-shell").classList.add("cave-shell");
  }
  var interior = new Image();
  var collisionMask = new Image();
  var doorOverlay = new Image();
  var spriteSheet = new Image();
  var noelSprite = new Image();
  var siblingsSprite = new Image();
  var musicDjMachine = new Image();
  var gymGloves = new Image();
  var bookshopNpcs = BOOKSHOP_NPCS.map((npc) => ({ ...npc, image: new Image() }));
  var musicHouseNpcs = MUSIC_HOUSE_NPCS.filter((npc) => npc.id !== "tim" || isTimAtMusicShop()).map((npc) => ({ ...npc, image: new Image() }));
  var gymNpcs = GYM_NPCS.map((npc) => ({ ...npc, image: new Image() }));
  interior.src = scene.backgroundSource;
  if (scene.collisionMaskSource) collisionMask.src = scene.collisionMaskSource;
  if (scene.doorOverlaySource) doorOverlay.src = scene.doorOverlaySource;
  spriteSheet.src = SEAL_MODE ? "../player/seal-game.png?v=20260831-transparent" : "../player/SpriteSheet.png";
  if (isDiaryLabInterior || isMansionInterior) noelSprite.src = "../chat/noel/interior-avatar.png";
  if (isCaveInterior) siblingsSprite.src = "../chat/siblings/girls-sprite.png";
  if (isMusicShopInterior) musicDjMachine.src = "../img/internal/music-dj-machine.png";
  if (isBookshopInterior) {
    bookshopNpcs.forEach((npc) => {
      npc.image.src = npc.source;
    });
  }
  if (isMusicShopInterior) {
    musicHouseNpcs.forEach((npc) => {
      npc.image.src = npc.source;
    });
  }
  if (isGymInterior) {
    gymGloves.src = "../img/internal/gloves.png";
    gymNpcs.forEach((npc) => {
      npc.image.src = npc.source;
    });
  }
  var colanderWarningVoices = [
    new Audio("../chat/siblings/maddy.mp3"),
    new Audio("../chat/siblings/marina.mp3")
  ];
  colanderWarningVoices.forEach((voice) => {
    voice.preload = "auto";
  });
  var player = {
    x: scene.playerStart.x,
    y: scene.playerStart.y,
    direction: "up",
    frame: 0,
    animationTime: 0
  };
  var previousTime = 0;
  var nearbyInteraction = null;
  var noelDialogueOpen = false;
  var noelDialogueFollowsProximity = false;
  var noelDialogueLineIndex = 0;
  var isCharacterInteraction = (interaction) => interaction === "noel" || interaction === "siblings" || interaction === "lucy" || interaction === "andy" || interaction === "aliya" || interaction === "julian" || interaction === "tim";
  var input = new DirectionInputController({
    canHold: () => !noelDialogueOpen || noelDialogueFollowsProximity
  });
  var diaryLabFeatures = new DiaryLabFeatures();
  var lucy = isPlantRoomInterior ? new LucyController(noelDialogueLine, noelDialogueNext, noelDialogueProgress, noelGiftConfirmation, closeNoelDialogue) : null;
  var gymNpcDialogue = new GymNpcDialogueController(noelDialogueLine, noelDialogueNext, noelDialogueProgress, noelGiftConfirmation);
  var musicHouseDialogue = new MusicHouseDialogueController(noelDialogueLine, noelDialogueNext, noelDialogueProgress, noelGiftConfirmation);
  var caveColanderHeld = hasCaveColander();
  var interiorDoors = new InteriorDoorsController(scene, {
    enteredDoor,
    sealMode: SEAL_MODE,
    hasCaveColander: () => caveColanderHeld
  });
  var collision = new InteriorCollision(
    scene,
    (x, y) => interiorDoors.passageIsOpen(x, y)
  );
  var caveSiblings = isCaveInterior ? new CaveSiblingsController({
    showLine: ({ speaker, line }, index, total) => {
      noelSpeaker.textContent = speaker;
      setProfileImage(noelDialogueProfile, speaker, "../");
      noelDialogueLine.textContent = line;
      noelDialogueProgress.textContent = `${index + 1}/${total}`;
      noelDialogueProgress.hidden = false;
    },
    showOptions: () => {
      siblingsDialogueOptions.hidden = false;
    },
    closeDialogue: () => closeNoelDialogue()
  }) : null;
  var cinemaAudience = isCinemaInterior ? new CinemaAudienceController({
    openDialogue: (line, index, total) => {
      noelDialogueOpen = true;
      noelDialogueFollowsProximity = true;
      noelSpeaker.textContent = "cinema audience";
      setProfileImage(noelDialogueProfile, "cinema audience", "../");
      noelDialogueLine.textContent = line;
      noelDialogueProgress.textContent = `${index + 1}/${total}`;
      noelDialogueProgress.hidden = false;
      noelDialogueNext.hidden = true;
      noelDialogueQuestion.hidden = true;
      noelDialogueOptions.hidden = true;
      musicDialogueOptions.hidden = true;
      noelDialogue.hidden = false;
      interactionPrompt.hidden = true;
    },
    closeDialogue: () => closeNoelDialogue()
  }) : null;
  function finishNoelIntroduction() {
    noelDialogueNext.hidden = true;
    noelDialogueQuestion.textContent = NOEL_QUESTION;
    noelDialogueQuestion.hidden = false;
    noelDialogueOptions.hidden = false;
  }
  function showNoelDialogueLine() {
    noelDialogueLine.textContent = NOEL_DIALOGUE_LINES[noelDialogueLineIndex] ?? "";
    noelDialogueProgress.textContent = `${noelDialogueLineIndex + 1}/${NOEL_DIALOGUE_LINES.length}`;
    noelDialogueProgress.hidden = false;
    noelDialogueNext.hidden = false;
  }
  function showNextNoelDialogueLine() {
    if (!noelDialogueOpen) return;
    if (noelDialogueLineIndex < NOEL_DIALOGUE_LINES.length - 1) {
      noelDialogueLineIndex += 1;
      showNoelDialogueLine();
      return;
    }
    finishNoelIntroduction();
  }
  function closeNoelDialogue() {
    caveSiblings?.closeDialogue();
    noelDialogueOpen = false;
    noelDialogueFollowsProximity = false;
    noelDialogue.hidden = true;
    noelDialogueNext.hidden = true;
    noelDialogueProgress.hidden = true;
    noelGiftConfirmation.hidden = true;
    noelDialogueOptions.hidden = true;
    siblingsDialogueOptions.hidden = true;
    musicDialogueOptions.hidden = true;
    diaryLabFeatures.hide();
    lucy?.stop();
    gymNpcDialogue.stop();
    musicHouseDialogue.stop();
    colanderWarningVoices.forEach((voice) => {
      voice.pause();
      voice.currentTime = 0;
    });
    interactionPrompt.hidden = nearbyInteraction === null || isCharacterInteraction(nearbyInteraction);
  }
  function showSiblingsDialogue() {
    noelDialogueProgress.hidden = true;
    noelGiftConfirmation.hidden = true;
    noelDialogueNext.hidden = true;
    noelDialogueQuestion.hidden = true;
    noelDialogueOptions.hidden = true;
    siblingsDialogueOptions.hidden = true;
    noelDialogue.hidden = false;
    interactionPrompt.hidden = true;
  }
  function startSiblingsDialogue(time) {
    if (nearbyInteraction !== "siblings" || noelDialogueOpen || !caveSiblings?.startWelcome(time)) return;
    noelDialogueOpen = true;
    noelDialogueFollowsProximity = true;
    showSiblingsDialogue();
  }
  function startSiblingsWebsiteReturnDialogue() {
    if (!caveSiblings?.canResumeAfterWebsite) return;
    if (noelDialogueOpen) closeNoelDialogue();
    caveSiblings.resumeAfterWebsite(performance.now());
    noelDialogueOpen = true;
    noelDialogueFollowsProximity = true;
    showSiblingsDialogue();
  }
  function startNoelDialogue() {
    if (nearbyInteraction !== "noel" || noelDialogueOpen) return;
    noelDialogueOpen = true;
    noelDialogueFollowsProximity = true;
    noelDialogueLineIndex = 0;
    noelSpeaker.textContent = NOEL_NAME;
    setProfileImage(noelDialogueProfile, NOEL_NAME, "../");
    showNoelDialogueLine();
    noelDialogueQuestion.hidden = true;
    noelDialogueOptions.hidden = true;
    noelDialogue.hidden = false;
    interactionPrompt.hidden = true;
  }
  function startLucyDialogue() {
    if (nearbyInteraction !== "lucy" || noelDialogueOpen) return;
    input.releaseAll();
    noelDialogueOpen = true;
    noelDialogueFollowsProximity = true;
    noelSpeaker.textContent = "Lucy";
    setProfileImage(noelDialogueProfile, "Lucy", "../");
    lucy?.start();
    noelDialogueQuestion.hidden = true;
    noelDialogueOptions.hidden = true;
    siblingsDialogueOptions.hidden = true;
    musicDialogueOptions.hidden = true;
    noelDialogue.hidden = false;
    interactionPrompt.hidden = true;
  }
  function openFeature(kind) {
    input.releaseAll();
    noelDialogueOpen = true;
    noelDialogueFollowsProximity = false;
    interactionPrompt.hidden = true;
    noelDialogueNext.hidden = true;
    noelDialogue.hidden = true;
    diaryLabFeatures.open(kind);
  }
  function startFeatureInteraction(kind) {
    if (!noelDialogueOpen) openFeature(kind);
  }
  function startColanderPickup() {
    if (!isCaveInterior || noelDialogueOpen || caveColanderHeld) return;
    input.releaseAll();
    caveSiblings?.closeDialogue();
    caveColanderHeld = true;
    interiorDoors.syncExitLink(document.querySelector(".interior-exit"));
    nearbyInteraction = null;
    noelDialogueOpen = true;
    noelDialogueFollowsProximity = false;
    noelSpeaker.textContent = "THE GIRLS";
    setProfileImage(noelDialogueProfile, "Maddy", "../");
    noelDialogueLine.textContent = "PUT THAT DOWN NOW";
    noelDialogueProgress.hidden = true;
    noelGiftConfirmation.hidden = true;
    noelDialogueNext.hidden = true;
    noelDialogueQuestion.hidden = true;
    noelDialogueOptions.hidden = true;
    musicDialogueOptions.hidden = true;
    noelDialogue.hidden = false;
    interactionPrompt.hidden = true;
    colanderWarningVoices.forEach((voice) => {
      voice.pause();
      voice.currentTime = 0;
      void voice.play().catch(() => {
      });
    });
  }
  function startMusicHouseDialogue(kind) {
    if (nearbyInteraction !== kind || noelDialogueOpen) return;
    input.releaseAll();
    noelDialogueOpen = true;
    noelDialogueFollowsProximity = true;
    noelSpeaker.textContent = kind === "andy" ? "Andy" : "Aliya";
    if (kind === "andy") {
      setProfileImage(noelDialogueProfile, "Andy", "../");
    } else {
      noelDialogueProfile.hidden = true;
      noelDialogueProfile.alt = "";
      noelDialogueProfile.removeAttribute("src");
    }
    musicHouseDialogue.start(kind);
    noelDialogueQuestion.hidden = true;
    noelDialogueOptions.hidden = true;
    siblingsDialogueOptions.hidden = true;
    noelDialogue.hidden = false;
    interactionPrompt.hidden = true;
  }
  function startGymNpcDialogue(kind) {
    if (nearbyInteraction !== kind || noelDialogueOpen) return;
    input.releaseAll();
    noelDialogueOpen = true;
    noelDialogueFollowsProximity = true;
    const npc = gymNpcDialogue.start(kind);
    noelSpeaker.textContent = npc.name;
    noelDialogueProfile.src = npc.profileSource ?? "";
    noelDialogueProfile.alt = npc.profileSource ? `${npc.name} profile` : "";
    noelDialogueProfile.hidden = !npc.profileSource;
    noelDialogueQuestion.hidden = true;
    noelDialogueOptions.hidden = true;
    siblingsDialogueOptions.hidden = true;
    musicDialogueOptions.hidden = true;
    noelDialogue.hidden = false;
    interactionPrompt.hidden = true;
  }
  function activateNearbyInteraction() {
    if (nearbyInteraction === "noel") startNoelDialogue();
    else if (nearbyInteraction === "siblings") startSiblingsDialogue(performance.now());
    else if (nearbyInteraction === "diary" || nearbyInteraction === "experiments") {
      startFeatureInteraction(nearbyInteraction);
    } else if (nearbyInteraction === "colander") {
      startColanderPickup();
    } else if (nearbyInteraction === "andy" || nearbyInteraction === "aliya") {
      startMusicHouseDialogue(nearbyInteraction);
    } else if (nearbyInteraction === "lucy") {
      startLucyDialogue();
    } else if (nearbyInteraction === "julian" || nearbyInteraction === "tim") {
      startGymNpcDialogue(nearbyInteraction);
    }
  }
  function bindControls() {
    window.addEventListener("keydown", (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        input.releaseAll();
        return;
      }
      if (event.code === "Escape" && noelDialogueOpen) {
        event.preventDefault();
        if (diaryLabFeatures.closeLightbox()) return;
        closeNoelDialogue();
        return;
      }
      if ((event.code === "KeyE" || event.code === "Enter" || event.code === "Space") && nearbyInteraction) {
        event.preventDefault();
        activateNearbyInteraction();
        return;
      }
    });
    window.addEventListener("blur", () => {
      caveSiblings?.notePageLeft();
    });
    window.addEventListener("focus", startSiblingsWebsiteReturnDialogue);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        caveSiblings?.notePageLeft();
        return;
      }
      startSiblingsWebsiteReturnDialogue();
    });
    interactionPrompt.addEventListener("click", activateNearbyInteraction);
    noelDialogueNext.addEventListener("click", () => {
      if (nearbyInteraction === "lucy") lucy?.next();
      else if (nearbyInteraction === "andy" || nearbyInteraction === "aliya") musicHouseDialogue.next();
      else if (nearbyInteraction === "julian" || nearbyInteraction === "tim") gymNpcDialogue.next();
      else showNextNoelDialogueLine();
    });
    noelDialogueClose.addEventListener("click", closeNoelDialogue);
    noelDeclineButton.addEventListener("click", closeNoelDialogue);
    siblingsViewWebsite.addEventListener("click", () => {
      caveSiblings?.chooseWebsite();
      closeNoelDialogue();
    });
    siblingsDeclineButton.addEventListener("click", () => {
      siblingsDialogueOptions.hidden = true;
      caveSiblings?.declineWebsite(performance.now());
      showSiblingsDialogue();
    });
    diaryLabFeatures.bind(openFeature, closeNoelDialogue);
    input.setup();
  }
  function updatePlayer(deltaTime) {
    if (caveSiblings?.isEntering) {
      player.animationTime = 0;
      player.frame = 0;
      return;
    }
    if (noelDialogueOpen && !noelDialogueFollowsProximity) return;
    let dx = 0;
    let dy = 0;
    if (input.isHeld("left")) dx -= 1;
    if (input.isHeld("right")) dx += 1;
    if (input.isHeld("up")) dy -= 1;
    if (input.isHeld("down")) dy += 1;
    if (dx === 0 && dy === 0) {
      player.animationTime = 0;
      player.frame = 0;
      return;
    }
    const length = Math.hypot(dx, dy);
    moveWithCollisions(
      player,
      dx / length * SPEED * getSpeedMultiplier() * deltaTime,
      dy / length * SPEED * getSpeedMultiplier() * deltaTime,
      (x, y) => collision.playerIsBlocked(x, y)
    );
    if (dx < 0 && dy < 0) player.direction = "upLeft";
    else if (dx > 0 && dy < 0) player.direction = "upRight";
    else if (dx < 0 && dy > 0) player.direction = "downLeft";
    else if (dx > 0 && dy > 0) player.direction = "downRight";
    else if (dx < 0) player.direction = "left";
    else if (dx > 0) player.direction = "right";
    else if (dy < 0) player.direction = "up";
    else player.direction = "down";
    player.animationTime += deltaTime;
    player.frame = Math.floor(player.animationTime * 11) % FRAME_COUNT2;
  }
  function updateNearbyInteraction() {
    if (isCinemaInterior) {
      nearbyInteraction = null;
      interactionPrompt.hidden = true;
      cinemaAudience?.update(player.x, player.y, noelDialogueOpen);
      return;
    }
    const target = INTERACTION_TARGETS.filter((interaction) => interaction.kind !== "colander" || !caveColanderHeld).map((interaction) => ({
      ...interaction,
      playerDistance: Math.hypot(player.x - interaction.x, player.y - interaction.y)
    })).filter((interaction) => interaction.playerDistance <= interaction.distance).sort((first, second) => first.playerDistance - second.playerDistance)[0];
    const nextInteraction = target?.kind ?? null;
    if (nextInteraction === nearbyInteraction) return;
    const previousInteraction = nearbyInteraction;
    nearbyInteraction = nextInteraction;
    if (previousInteraction === "siblings" && nextInteraction !== "siblings") {
      caveSiblings?.leaveRange();
    }
    if (isCharacterInteraction(previousInteraction) && nextInteraction !== previousInteraction && noelDialogueOpen && noelDialogueFollowsProximity) {
      closeNoelDialogue();
    }
    if (nextInteraction === "noel") {
      startNoelDialogue();
      return;
    }
    if (nextInteraction === "siblings") {
      interactionPrompt.hidden = true;
      startSiblingsDialogue(performance.now());
      return;
    }
    if (nextInteraction === "lucy") {
      interactionPrompt.hidden = true;
      startLucyDialogue();
      return;
    }
    if (nextInteraction === "andy" || nextInteraction === "aliya") {
      interactionPrompt.hidden = true;
      startMusicHouseDialogue(nextInteraction);
      return;
    }
    if (nextInteraction === "julian" || nextInteraction === "tim") {
      interactionPrompt.hidden = true;
      startGymNpcDialogue(nextInteraction);
      return;
    }
    if (target) interactionPrompt.textContent = target.label;
    interactionPrompt.hidden = !target || noelDialogueOpen;
  }
  function draw(timeMs = 0) {
    const viewportWidth = isCaveInterior ? WORLD_WIDTH2 : Math.min(WORLD_WIDTH2, canvas.width / VIEW_SCALE);
    const viewportHeight = isCaveInterior ? WORLD_HEIGHT2 : Math.min(WORLD_HEIGHT2, canvas.height / VIEW_SCALE);
    const cameraX = Math.round(Math.max(0, Math.min(WORLD_WIDTH2 - viewportWidth, player.x - viewportWidth / 2)));
    const cameraY = Math.round(Math.max(0, Math.min(WORLD_HEIGHT2 - viewportHeight, player.y - viewportHeight / 2)));
    const scaleX = canvas.width / viewportWidth;
    const scaleY = canvas.height / viewportHeight;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#0b0d0d";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.save();
    const interiorSourceScale = scene.sourceScale;
    context.drawImage(
      interior,
      cameraX * interiorSourceScale,
      cameraY * interiorSourceScale,
      viewportWidth * interiorSourceScale,
      viewportHeight * interiorSourceScale,
      0,
      0,
      viewportWidth * scaleX,
      viewportHeight * scaleY
    );
    if (isCaveInterior) {
      context.fillStyle = "#0b0d0d";
      context.fillRect(
        (CAVE_COLANDER.eraseX - cameraX) * scaleX,
        (CAVE_COLANDER.eraseY - cameraY) * scaleY,
        CAVE_COLANDER.eraseWidth * scaleX,
        CAVE_COLANDER.eraseHeight * scaleY
      );
    }
    if (isCaveInterior) {
      const frame = caveSiblings?.isEntering ? CAVE_SIBLINGS_WALK_FRAMES[caveSiblings.walkFrame] : CAVE_SIBLINGS_IDLE_FRAME;
      if (frame) {
        const [sourceX2, sourceY2, sourceWidth2, sourceHeight2] = frame;
        context.drawImage(
          siblingsSprite,
          sourceX2,
          sourceY2,
          sourceWidth2,
          sourceHeight2,
          Math.round((CAVE_SIBLINGS.x - cameraX - CAVE_SIBLINGS.width / 2) * scaleX),
          Math.round(((caveSiblings?.y ?? CAVE_SIBLINGS.endY) - cameraY - CAVE_SIBLINGS.height) * scaleY),
          CAVE_SIBLINGS.width * scaleX,
          CAVE_SIBLINGS.height * scaleY
        );
      }
    }
    if (isDiaryLabInterior || isMansionInterior) {
      context.drawImage(
        noelSprite,
        Math.round((NOEL.x - cameraX - NOEL.width / 2) * scaleX),
        Math.round((NOEL.y - cameraY - NOEL.height) * scaleY),
        NOEL.width * scaleX,
        NOEL.height * scaleY
      );
    }
    if (isMusicShopInterior) {
      drawSceneryNpcs(context, musicHouseNpcs, cameraX, cameraY, scaleX, scaleY, timeMs);
    }
    if (isGymInterior) {
      context.drawImage(gymGloves, Math.round((292 - cameraX) * scaleX + 50), Math.round((270 - cameraY - 195) * scaleY), 50 * scaleX, 81 * scaleY);
      drawSceneryNpcs(context, gymNpcs, cameraX, cameraY, scaleX, scaleY, timeMs);
    }
    if (isBookshopInterior) drawSceneryNpcs(context, bookshopNpcs, cameraX, cameraY, scaleX, scaleY);
    if (isPlantRoomInterior) drawSceneryNpcs(context, [{ x: 355, y: 350, width: 42, height: 75, image: lucy.sprite }], cameraX, cameraY, scaleX, scaleY);
    if (SHOW_COLLISION_SHAPES) {
      context.save();
      context.globalAlpha = 0.55;
      if (isCaveInterior) {
        context.fillStyle = "#005cff";
        for (const [wallX, wallY, wallWidth, wallHeight] of CAVE_WALLS) {
          context.fillRect(
            (wallX - cameraX) * scaleX,
            (wallY - cameraY) * scaleY,
            wallWidth * scaleX,
            wallHeight * scaleY
          );
        }
      } else if (isMusicShopInterior || isGymInterior || isBookshopInterior || scene.kind === "mansion" || scene.kind === "plantRoom") {
        context.fillStyle = "#005cff";
        const firstColumn = Math.max(0, Math.floor(cameraX / collision.cellSize));
        const lastColumn = Math.min(collision.columns - 1, Math.ceil((cameraX + viewportWidth) / collision.cellSize));
        const firstRow = Math.max(0, Math.floor(cameraY / collision.cellSize));
        const lastRow = Math.min(collision.rows - 1, Math.ceil((cameraY + viewportHeight) / collision.cellSize));
        for (let row = firstRow; row <= lastRow; row += 1) {
          for (let column = firstColumn; column <= lastColumn; column += 1) {
            const x = column * collision.cellSize;
            const y = row * collision.cellSize;
            if (!collision.isBlocked(x + collision.cellSize / 2, y + collision.cellSize / 2)) continue;
            context.fillRect(
              (x - cameraX) * scaleX,
              (y - cameraY) * scaleY,
              collision.cellSize * scaleX,
              collision.cellSize * scaleY
            );
          }
        }
      } else {
        const collisionSourceScale = 1;
        context.drawImage(
          collisionMask,
          cameraX * collisionSourceScale,
          cameraY * collisionSourceScale,
          viewportWidth * collisionSourceScale,
          viewportHeight * collisionSourceScale,
          0,
          0,
          canvas.width,
          canvas.height
        );
      }
      context.restore();
    }
    if (isCaveInterior) {
      context.save();
      context.globalAlpha = caveSiblings?.darknessAlpha ?? 0.2;
      context.fillStyle = "#000";
      context.fillRect(0, 0, viewportWidth * scaleX, viewportHeight * scaleY);
      context.restore();
    }
    if (isCaveInterior && !caveColanderHeld) {
      drawColander(
        context,
        Math.round((CAVE_COLANDER.x - cameraX) * scaleX),
        Math.round((CAVE_COLANDER.eraseY + 12 - cameraY) * scaleY),
        Math.min(scaleX, scaleY)
      );
    }
    const spriteFrame = getPlayerSpriteFrame(SEAL_MODE, player.direction, player.frame, PLAYER_SCALE2);
    const { sourceX, sourceY, sourceWidth, sourceHeight, width, height, baselineOffset } = spriteFrame;
    context.drawImage(
      spriteSheet,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      Math.round((player.x - cameraX - width / 2) * scaleX),
      Math.round((player.y - cameraY - height + baselineOffset) * scaleY),
      width * scaleX,
      height * scaleY
    );
    if (caveColanderHeld) {
      drawColander(
        context,
        Math.round((player.x - cameraX + 19) * scaleX),
        Math.round((player.y - cameraY - 30) * scaleY),
        Math.min(scaleX, scaleY)
      );
    }
    interiorDoors.drawOverlay(context, doorOverlay, cameraX, cameraY, scaleX);
    if (isMusicShopInterior) context.drawImage(
      musicDjMachine,
      Math.round((247 - cameraX) * scaleX),
      Math.round((254 - cameraY) * scaleY),
      48 * scaleX,
      30 * scaleY
    );
    context.restore();
  }
  function gameLoop(time) {
    const deltaTime = previousTime === 0 ? 0 : Math.min((time - previousTime) / 1e3, 0.05);
    previousTime = time;
    updatePowerups(time);
    if (isJumpMenuOpen()) {
      draw(time);
      requestAnimationFrame(gameLoop);
      return;
    }
    caveSiblings?.update(deltaTime, time);
    updatePlayer(deltaTime);
    updateNearbyInteraction();
    interiorDoors.update(player.x, player.y);
    draw(time);
    requestAnimationFrame(gameLoop);
  }
  interiorDoors.syncExitLink(document.querySelector(".interior-exit"));
  bindControls();
  setupInventory();
  setupJump();
  var requiredImages = [
    interior,
    spriteSheet,
    ...scene.collisionMaskSource ? [collisionMask] : [],
    ...scene.doorOverlaySource ? [doorOverlay] : [],
    ...isDiaryLabInterior || isMansionInterior ? [noelSprite] : [],
    ...lucy ? [lucy.sprite] : [],
    ...isBookshopInterior ? bookshopNpcs.map((npc) => npc.image) : [],
    ...isCaveInterior ? [siblingsSprite] : [],
    ...isMusicShopInterior ? [...musicHouseNpcs.map((npc) => npc.image), musicDjMachine] : [],
    ...isGymInterior ? [gymGloves, ...gymNpcs.map((npc) => npc.image)] : []
  ];
  Promise.all(requiredImages.map((image) => image.decode())).then(() => {
    context.imageSmoothingEnabled = false;
    requestAnimationFrame(gameLoop);
  }).catch((error) => {
    console.error(error);
    context.fillStyle = "#f5fff6";
    context.font = "13px monospace";
    context.fillText("Could not load the interior.", 120, 240);
  });
})();
