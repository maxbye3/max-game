import type { InteriorScene } from './interior-scenes.js';

const OPEN_DISTANCE = 53;
const EXIT_DISTANCE = 18;
const PASSAGE_HALF_WIDTH = 24;
const PASSAGE_TOP_OFFSET = 30;
const PASSAGE_BOTTOM_OFFSET = 24;

interface InteriorDoorOptions {
  readonly enteredDoor: string | null;
  readonly sealMode: boolean;
  readonly hasCaveColander: () => boolean;
}

export class InteriorDoorsController {
  private readonly sound = new Audio('../audio/open-door.mp3');
  private openDoorIndex: number | null = null;
  private navigationStarted = false;

  constructor(
    private readonly scene: InteriorScene,
    private readonly options: InteriorDoorOptions,
  ) {
    this.sound.preload = 'auto';
  }

  syncExitLink(link: HTMLAnchorElement | null): void {
    if (link && this.options.enteredDoor) link.href = this.returnUrl();
  }

  update(playerX: number, playerY: number): void {
    const nextOpenDoorIndex = this.scene.doors.findIndex((door) =>
      Math.hypot(playerX - door.triggerX, playerY - door.triggerY) <= OPEN_DISTANCE,
    );
    if (nextOpenDoorIndex >= 0 && nextOpenDoorIndex !== this.openDoorIndex) {
      this.sound.currentTime = 0;
      void this.sound.play().catch(() => {
        // Audio can be rejected until the browser observes a keyboard or pointer gesture.
      });
    }
    this.openDoorIndex = nextOpenDoorIndex >= 0 ? nextOpenDoorIndex : null;

    if (this.navigationStarted) return;
    const exitDoor = this.scene.doors.find((door) =>
      Math.hypot(playerX - door.exitX, playerY - door.exitY) <= EXIT_DISTANCE,
    );
    if (!exitDoor) return;
    this.navigationStarted = true;
    window.location.assign(this.returnUrl());
  }

  passageIsOpen(x: number, y: number): boolean {
    if (this.scene.kind === 'cave' || this.openDoorIndex === null) return false;
    const door = this.scene.doors[this.openDoorIndex];
    return Boolean(
      door &&
      x >= door.triggerX - PASSAGE_HALF_WIDTH &&
      x <= door.triggerX + PASSAGE_HALF_WIDTH &&
      y >= door.triggerY - PASSAGE_TOP_OFFSET &&
      y <= door.exitY + PASSAGE_BOTTOM_OFFSET,
    );
  }

  drawOverlay(
    context: CanvasRenderingContext2D,
    overlay: HTMLImageElement,
    cameraX: number,
    cameraY: number,
    scale: number,
  ): void {
    if (!this.scene.doorOverlaySource || this.openDoorIndex === null) return;
    const door = this.scene.doors[this.openDoorIndex];
    if (!door) return;
    context.drawImage(
      overlay,
      door.sourceX, door.sourceY, door.sourceWidth, door.sourceHeight,
      (door.x - cameraX) * scale, (door.y - cameraY) * scale,
      door.width * scale, door.height * scale,
    );
  }

  private returnUrl(): string {
    const params = new URLSearchParams();
    if (this.options.enteredDoor) params.set('door', this.options.enteredDoor);
    if (this.scene.kind === 'cave' && this.options.hasCaveColander()) params.set('colander', '1');
    if (this.options.sealMode) params.set('seal', '1');
    return `../index.html${params.size > 0 ? `?${params.toString()}` : ''}`;
  }
}
