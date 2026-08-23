import { deflateSync, inflateSync } from 'node:zlib';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CRC_TABLE = new Uint32Array(256);

for (let i = 0; i < 256; i += 1) {
  let value = i;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  CRC_TABLE[i] = value >>> 0;
}

function crc32(buffers) {
  let crc = 0xffffffff;
  for (const buffer of buffers) {
    for (let i = 0; i < buffer.length; i += 1) {
      crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function bytesPerPixel(colorType) {
  if (colorType === 2) return 3;
  if (colorType === 6) return 4;
  throw new Error(`Unsupported PNG color type ${colorType}; expected RGB or RGBA.`);
}

function paeth(left, up, upLeft) {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upLeftDistance = Math.abs(estimate - upLeft);
  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
  if (upDistance <= upLeftDistance) return up;
  return upLeft;
}

function unfilterScanlines(filtered, width, height, bpp) {
  const stride = width * bpp;
  const pixels = Buffer.alloc(stride * height);

  for (let y = 0; y < height; y += 1) {
    const sourceOffset = y * (stride + 1);
    const targetOffset = y * stride;
    const filter = filtered[sourceOffset];

    for (let x = 0; x < stride; x += 1) {
      const source = filtered[sourceOffset + 1 + x];
      const left = x >= bpp ? pixels[targetOffset + x - bpp] : 0;
      const up = y > 0 ? pixels[targetOffset + x - stride] : 0;
      const upLeft = y > 0 && x >= bpp ? pixels[targetOffset + x - stride - bpp] : 0;

      if (filter === 0) pixels[targetOffset + x] = source;
      else if (filter === 1) pixels[targetOffset + x] = (source + left) & 0xff;
      else if (filter === 2) pixels[targetOffset + x] = (source + up) & 0xff;
      else if (filter === 3) pixels[targetOffset + x] = (source + Math.floor((left + up) / 2)) & 0xff;
      else if (filter === 4) pixels[targetOffset + x] = (source + paeth(left, up, upLeft)) & 0xff;
      else throw new Error(`Unsupported PNG filter ${filter}.`);
    }
  }

  return pixels;
}

function encodeScanlines(pixels, width, height, bpp) {
  const stride = width * bpp;
  const filtered = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const sourceOffset = y * stride;
    const targetOffset = y * (stride + 1);
    filtered[targetOffset] = 0;
    pixels.copy(filtered, targetOffset + 1, sourceOffset, sourceOffset + stride);
  }
  return filtered;
}

function pngChunk(type, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  const checksum = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  checksum.writeUInt32BE(crc32([typeBuffer, data]), 0);
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

export function readPng(buffer) {
  if (!buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error('Invalid PNG signature.');
  }

  let offset = PNG_SIGNATURE.length;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  if (bitDepth !== 8) throw new Error(`Unsupported PNG bit depth ${bitDepth}; expected 8.`);
  const bpp = bytesPerPixel(colorType);
  const filtered = inflateSync(Buffer.concat(idatChunks));
  const pixels = unfilterScanlines(filtered, width, height, bpp);
  return { width, height, colorType, bpp, pixels };
}

export function writePng({ width, height, colorType, pixels }) {
  const bpp = bytesPerPixel(colorType);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = colorType;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const filtered = encodeScanlines(pixels, width, height, bpp);
  const compressed = deflateSync(filtered, { level: 9 });
  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk('IHDR', header),
    pngChunk('IDAT', compressed),
    pngChunk('IEND'),
  ]);
}

export function scaleNearest(image, scale) {
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const pixels = Buffer.alloc(width * height * image.bpp);

  for (let y = 0; y < height; y += 1) {
    const sourceY = Math.min(image.height - 1, Math.floor(y / scale));
    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.min(image.width - 1, Math.floor(x / scale));
      const sourceOffset = (sourceY * image.width + sourceX) * image.bpp;
      const targetOffset = (y * width + x) * image.bpp;
      image.pixels.copy(pixels, targetOffset, sourceOffset, sourceOffset + image.bpp);
    }
  }

  return { ...image, width, height, pixels };
}

export function rgbaAt(image, x, y) {
  const offset = (y * image.width + x) * image.bpp;
  const red = image.pixels[offset] ?? 0;
  const green = image.pixels[offset + 1] ?? 0;
  const blue = image.pixels[offset + 2] ?? 0;
  const alpha = image.bpp === 4 ? image.pixels[offset + 3] ?? 255 : 255;
  return [red, green, blue, alpha];
}
