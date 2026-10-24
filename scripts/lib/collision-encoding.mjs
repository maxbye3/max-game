// Most collision bytes repeat across walls and open floor. Keep raw base64
// when run-length encoding would be larger (for example a noisy guide).
export function encodeCollisionBits(bits) {
  const runs = [];
  for (let index = 0; index < bits.length;) {
    const value = bits[index];
    let count = 1;
    while (count < 255 && index + count < bits.length && bits[index + count] === value) count++;
    runs.push(count, value);
    index += count;
  }
  const packed = Buffer.from(runs).toString('base64');
  const raw = bits.toString('base64');
  return packed.length + 4 < raw.length ? `rle:${packed}` : raw;
}
