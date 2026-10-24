// Match nearest-neighbour canvas sampling, including its lower-pixel tie break.
// Keep the original artwork; only bake the pixels used at the game's scale.
export function sampleFrame(image, frame, width, height) {
  const [left, top, sourceWidth, sourceHeight] = frame;
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    const sy = top + Math.floor((y + 0.5) * sourceHeight / height - 1e-7);
    if (sy < 0 || sy >= image.height) continue;
    for (let x = 0; x < width; x++) {
      const sx = left + Math.floor((x + 0.5) * sourceWidth / width - 1e-7);
      if (sx < 0 || sx >= image.width) continue;
      const from = (sy * image.width + sx) * 4;
      image.pixels.copy(pixels, (y * width + x) * 4, from, from + 4);
    }
  }
  return { width, height, pixels };
}

export function packFrames(images) {
  const width = Math.max(...images.map(image => image.width));
  const height = images.reduce((sum, image) => sum + image.height, 0);
  const pixels = Buffer.alloc(width * height * 4), frames = [];
  let top = 0;
  for (const image of images) {
    frames.push([0, top, image.width, image.height]);
    for (let y = 0; y < image.height; y++) image.pixels.copy(pixels, ((top + y) * width) * 4, y * image.width * 4, (y + 1) * image.width * 4);
    top += image.height;
  }
  return { width, height, pixels, frames };
}
