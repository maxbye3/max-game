// Explicit navigation state follows the player through doors without persisting
// a chase into unrelated visits or saves.
let active = new URLSearchParams(window.location.search).get('chase') === '1';
export const isSiblingPursuitActive = (): boolean => active;
export const setSiblingPursuitActive = (value: boolean): void => { active = value; };
