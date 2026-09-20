export interface InteriorSceneryNpc {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly image: HTMLImageElement;
  readonly animation?: {
    readonly frameWidth: number;
    readonly frameHeight: number;
    readonly frameCount: number;
    readonly frameDurationMs: number;
    readonly framesPerRow?: number;
  };
}

export function drawSceneryNpcs(
  context: CanvasRenderingContext2D,
  npcs: readonly InteriorSceneryNpc[],
  cameraX: number,
  cameraY: number,
  scaleX: number,
  scaleY: number,
  timeMs = 0,
): void {
  context.save();
  context.imageSmoothingEnabled = false;
  npcs.forEach((npc) => {
    const destinationX = Math.round((npc.x - cameraX - npc.width / 2) * scaleX);
    const destinationY = Math.round((npc.y - cameraY - npc.height) * scaleY);
    const destinationWidth = npc.width * scaleX;
    const destinationHeight = npc.height * scaleY;
    if (npc.animation) {
      const frame = Math.floor(timeMs / npc.animation.frameDurationMs) % npc.animation.frameCount;
      const framesPerRow = npc.animation.framesPerRow ?? npc.animation.frameCount;
      context.drawImage(
        npc.image,
        (frame % framesPerRow) * npc.animation.frameWidth,
        Math.floor(frame / framesPerRow) * npc.animation.frameHeight,
        npc.animation.frameWidth,
        npc.animation.frameHeight,
        destinationX,
        destinationY,
        destinationWidth,
        destinationHeight,
      );
      return;
    }
    context.drawImage(npc.image, destinationX, destinationY, destinationWidth, destinationHeight);
  });
  context.restore();
}
