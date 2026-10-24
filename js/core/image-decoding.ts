/** A successfully loaded image remains drawable if decode rejects or stalls. */
export function decodeLoadedImage(image: HTMLImageElement): Promise<void> {
  if (!image.decode) return Promise.resolve();
  return new Promise(resolve => {
    const finish = (): void => { window.clearTimeout(timeout); resolve(); };
    const timeout = window.setTimeout(finish, 1500);
    void image.decode().then(finish, finish);
  });
}
