import { playAlexVoice } from '../core/alex-w-voice.js';
import { setAlexEatenDoughnut } from '../core/alex-w-state.js';
import { announceWorldInteraction } from '../core/world-interactions.js';

export class DoughnutShopController {
  eating = false;
  private entranceFinished = false;
  private stopEntranceVoice: () => void = () => {};

  constructor(private readonly returnUrl: () => string, private readonly releaseInput: () => void) {}

  enter(): void {
    this.stopEntranceVoice = playAlexVoice('../char/alex-w/sounds/entering-doghnut-house.m4a', () => {
      this.entranceFinished = true;
    });
  }

  update(x: number, y: number): void {
    // The table occupies x=163..349, y=350..474. Trigger within reach of any side.
    const distance = Math.hypot(Math.max(163 - x, 0, x - 349), Math.max(350 - y, 0, y - 474));
    if (this.eating || !this.entranceFinished || distance > 38) return;
    this.eating = true;
    this.releaseInput();
    this.stopEntranceVoice();
    announceWorldInteraction();
    const blackout = document.createElement('div');
    blackout.id = 'doughnut-blackout';
    blackout.setAttribute('role', 'status');
    blackout.setAttribute('aria-label', 'Alex is eating the doughnuts');
    blackout.style.cssText = 'position:fixed;inset:0;background:#000;z-index:10000;touch-action:none';
    document.body.append(blackout);
    const shell = document.querySelector<HTMLElement>('.game-shell');
    if (shell) shell.inert = true;
    playAlexVoice('../char/alex-w/sounds/yumyum.m4a', () => {
      setAlexEatenDoughnut(true);
      const url = new URL(this.returnUrl(), window.location.href);
      url.searchParams.set('doughnut', 'eaten');
      window.location.assign(url.href);
    });
  }
}
