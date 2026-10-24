import { INTERIOR_RENDER_ASSETS } from '../generated/interiors/render-assets.generated.js';
import { webImageSource } from '../core/web-images.js';

type Frame = readonly [number, number, number, number];
interface RenderAssets {
  readonly backgrounds: Readonly<Record<string, { readonly source: string; readonly scaleX: number; readonly scaleY: number }>>;
  readonly doors: Readonly<Record<string, { readonly source: string; readonly frames: readonly Frame[] }>>;
  readonly siblings: { readonly source: string; readonly idle: Frame; readonly walk: readonly Frame[] };
}
export const interiorRenderAssets: RenderAssets = INTERIOR_RENDER_ASSETS;
export function preparedBackground(source: string): RenderAssets['backgrounds'][string] | undefined {
  return interiorRenderAssets.backgrounds[source.replace(/^\.\.\//, '').split('?')[0]!];
}
export function interiorBackgroundSource(source: string): string {
  const prepared = preparedBackground(source);
  return prepared ? `../${prepared.source}` : webImageSource(source);
}
