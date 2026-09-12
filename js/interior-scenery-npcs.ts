export interface InteriorSceneryNpc {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly image: HTMLImageElement;
}

export function drawSceneryNpcs(
  context: CanvasRenderingContext2D,
  npcs: readonly InteriorSceneryNpc[],
  cameraX: number,
  cameraY: number,
  scaleX: number,
  scaleY: number,
): void {
  context.save();
  context.imageSmoothingEnabled = false;
  npcs.forEach((npc) => {
    context.drawImage(
      npc.image,
      Math.round((npc.x - cameraX - npc.width / 2) * scaleX),
      Math.round((npc.y - cameraY - npc.height) * scaleY),
      npc.width * scaleX,
      npc.height * scaleY,
    );
  });
  context.restore();
}
