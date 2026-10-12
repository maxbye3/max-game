/**
 * Resolves a root-relative asset path (e.g. 'chat/lucy/item.png') against the
 * site root rather than the current page's own directory, so the same path
 * works whether it is loaded from the top-level index.html or a page nested
 * under a subdirectory like internal/index.html.
 */
export function resolveSiteAsset(path: string): string {
  const bundleScript = document.querySelector<HTMLScriptElement>('script[src*="dist/"]');
  const siteRoot = bundleScript?.src ? new URL('../', bundleScript.src) : new URL('./', document.baseURI);
  return new URL(path, siteRoot).href;
}
