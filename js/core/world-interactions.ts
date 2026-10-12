/** Notify open menus that the player has reached an overworld or room interaction. */
export function announceWorldInteraction(): void {
  window.dispatchEvent(new Event('max-game:world-interaction-opened'));
}
