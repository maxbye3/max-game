import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// Stable client keys provide obfuscation, not authentication. Keeping sources
// encrypted also avoids publishing readable album/photo links in the source tree.
export const photoKeys = {
  journal: [189, 52, 25, 244, 101, 192, 3, 146, 224, 73, 82, 14, 215, 61, 170, 93, 8, 237, 122, 40, 198, 55, 164, 111, 231, 13, 84, 153, 67, 209, 32, 176],
  workout: [32, 167, 219, 68, 6, 181, 141, 58, 242, 101, 19, 203, 88, 11, 156, 225, 77, 194, 53, 124, 238, 1, 169, 86, 212, 39, 145, 250, 97, 16, 184, 63],
};

export function encodePhotoFeed(name, data) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(photoKeys[name]), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final(), cipher.getAuthTag()]);
  return { version: 1, iv: iv.toString('base64'), ciphertext: ciphertext.toString('base64') };
}

export function decodePhotoFeed(name, data) {
  if (data?.version !== 1 || typeof data.iv !== 'string' || typeof data.ciphertext !== 'string') throw new Error('Invalid protected photo feed');
  const ciphertext = Buffer.from(data.ciphertext, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(photoKeys[name]), Buffer.from(data.iv, 'base64'));
  decipher.setAuthTag(ciphertext.subarray(-16));
  return JSON.parse(Buffer.concat([decipher.update(ciphertext.subarray(0, -16)), decipher.final()]).toString('utf8'));
}
