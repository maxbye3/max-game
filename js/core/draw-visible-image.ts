/** Static world art uses screen coordinates and an untransformed context. */
export function drawVisibleImage(context: CanvasRenderingContext2D, image: HTMLImageElement, ...coordinates: number[]): void {
  if (!image.complete || image.naturalWidth === 0) return;
  const destination = coordinates.length === 8 ? 4 : 0;
  const x = coordinates[destination]!, y = coordinates[destination + 1]!;
  const width = coordinates.length === 2 ? image.naturalWidth : coordinates[destination + 2]!;
  const height = coordinates.length === 2 ? image.naturalHeight : coordinates[destination + 3]!;
  if (Math.max(x, x + width) <= 0 || Math.max(y, y + height) <= 0 || Math.min(x, x + width) >= context.canvas.width || Math.min(y, y + height) >= context.canvas.height) return;
  context.drawImage.apply(context, [image, ...coordinates] as Parameters<typeof context.drawImage>);
}
