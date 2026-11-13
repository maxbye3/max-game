// Encryption hides readable photo links at rest. The browser still has the key;
// this is a spoiler deterrent, not authentication or protection from DevTools.
export async function decodeProtectedPhotos(data: unknown, bytes: readonly number[]): Promise<readonly string[]> {
  const payload = data as { version?: unknown; iv?: unknown; ciphertext?: unknown } | null;
  if (payload?.version !== 1 || typeof payload.iv !== 'string' || typeof payload.ciphertext !== 'string') {
    throw new Error('Invalid journal feed');
  }
  const decode = (value: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(value), char => char.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', new Uint8Array(bytes), 'AES-GCM', false, ['decrypt']);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(payload.iv) }, key, decode(payload.ciphertext));
  const { images } = JSON.parse(new TextDecoder().decode(plaintext)) as { images?: unknown };
  if (!Array.isArray(images) || !images.every(source => typeof source === 'string' && /^https:\/\/lh3\.googleusercontent\.com\//.test(source))) {
    throw new Error('Invalid journal images');
  }
  return images;
}
