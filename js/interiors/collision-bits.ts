/** Expand only the selected room's collision grid, preserving every byte. */
export function decodeCollisionBits(encoded: string): Uint8Array {
  const packed = encoded.startsWith('rle:');
  const bytes = Uint8Array.from(atob(packed ? encoded.slice(4) : encoded), character => character.charCodeAt(0));
  if (!packed) return bytes;
  let length = 0;
  for (let index = 0; index < bytes.length; index += 2) length += bytes[index]!;
  const result = new Uint8Array(length);
  let offset = 0;
  for (let index = 0; index < bytes.length; index += 2) {
    result.fill(bytes[index + 1]!, offset, offset + bytes[index]!);
    offset += bytes[index]!;
  }
  return result;
}
