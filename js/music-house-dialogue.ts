import { ANDY_DIALOGUE_LINES } from './andy-dialogue.js';
import { createGameAudio } from './audio-mute.js';
import { addGift, ANDY_ITEM, hasGift, PORTABLE_WALKMAN } from './inventory-gifts.js';
import { getSongArtwork, getUnlockedSongs, unlockSong } from './music-library.js';
import { resolveSiteAsset } from './site-assets.js';
import { nextDialogueVisitIndex } from './dialogue-visit.js';

const SPOTIFY_URL = 'https://open.spotify.com/artist/2YrF5w9qKkRINFpWCOtl6o';

const ANDY_SONG = 'Too much duolingo';
type AndyDialogueStage = 'none' | 'askMusic' | 'giveItem' | 'giveWalkman' | 'giveSong';

export class MusicHouseDialogueController {
  private andyStage: AndyDialogueStage = 'none';
  private andyDialogueIndex = 0;
  private readonly options = document.querySelector<HTMLElement>('#music-dialogue-options');

  constructor(
    private readonly line: HTMLElement,
    private readonly nextButton: HTMLButtonElement,
    private readonly progress: HTMLElement,
    private readonly confirmation: HTMLElement,
    private readonly closeDialogue: () => void,
  ) {
    document.querySelector<HTMLButtonElement>('#music-yes')?.addEventListener('click', () => this.acceptMusic());
    document.querySelector<HTMLButtonElement>('#music-no')?.addEventListener('click', () => this.declineMusic());
  }

  start(kind: 'andy' | 'aliya'): void {
    this.andyStage = kind === 'andy' ? 'askMusic' : 'none';
    if (kind === 'andy') {
      this.andyDialogueIndex = nextDialogueVisitIndex('andy', ANDY_DIALOGUE_LINES.length);
      this.line.textContent = ANDY_DIALOGUE_LINES[this.andyDialogueIndex] ?? '';
      this.progress.textContent = `${this.andyDialogueIndex + 1}/${ANDY_DIALOGUE_LINES.length}`;
      this.progress.hidden = false;
    } else {
      this.line.textContent = "When is Andy done? It's my turn to DJ.";
      this.progress.hidden = true;
    }
    this.confirmation.hidden = true;
    this.nextButton.hidden = kind !== 'andy';
    if (this.options) this.options.hidden = true;
  }

  next(): void {
    if (this.andyStage === 'askMusic') {
      this.andyStage = 'giveItem';
      this.line.textContent = "Would you like to hear Max's music?";
      this.progress.hidden = true;
      this.nextButton.hidden = true;
      if (this.options) this.options.hidden = false;
      return;
    }
    if (this.andyStage === 'giveWalkman') this.giveWalkman();
    else if (this.andyStage === 'giveSong') this.giveSong();
  }

  stop(): void {
    this.andyStage = 'none';
    if (this.options) this.options.hidden = true;
  }

  private acceptMusic(): void {
    if (this.andyStage !== 'giveItem') return;
    // Opening must happen directly in the button click handler so browsers do
    // not treat it as an unsolicited popup. First-time listeners still get
    // Andy's rewards after the Spotify tab is opened.
    window.open(SPOTIFY_URL, '_blank', 'noopener,noreferrer');
    this.giveAndyItem();
  }

  private declineMusic(): void {
    if (this.andyStage !== 'giveItem') return;
    this.giveAndyItem();
  }

  private giveAndyItem(): void {
    if (this.andyStage !== 'giveItem') return;
    if (hasGift(ANDY_ITEM)) {
      this.andyStage = 'giveWalkman';
      this.giveWalkman();
      return;
    }
    this.andyStage = 'giveWalkman';
    const received = addGift(ANDY_ITEM);
    this.line.textContent = 'Here, take this.';
    this.confirmation.textContent = received
      ? "Andy's item was added to your inventory!"
      : "You already have Andy's item.";
    this.confirmation.hidden = false;
    this.prepareNextReward();
    if (this.options) this.options.hidden = true;
  }

  private giveWalkman(): void {
    if (this.andyStage !== 'giveWalkman') return;
    if (hasGift(PORTABLE_WALKMAN)) {
      if (!getUnlockedSongs().includes(ANDY_SONG)) {
        this.andyStage = 'giveSong';
        this.giveSong();
      } else {
        this.closeDialogue();
      }
      return;
    }
    this.andyStage = 'none';
    const received = addGift(PORTABLE_WALKMAN);
    this.line.textContent = 'Here, take this.';
    this.confirmation.textContent = received
      ? 'A portable walkman was added to your inventory! You can now play music!'
      : 'You already have a portable walkman. You can play music!';
    this.confirmation.hidden = false;
    this.prepareNextReward();
    if (this.options) this.options.hidden = true;
  }

  private prepareNextReward(): void {
    this.andyStage = !hasGift(PORTABLE_WALKMAN)
      ? 'giveWalkman'
      : !getUnlockedSongs().includes(ANDY_SONG) ? 'giveSong' : 'none';
    this.nextButton.hidden = this.andyStage === 'none';
  }

  private giveSong(): void {
    if (this.andyStage !== 'giveSong') return;
    this.andyStage = 'none';
    this.line.textContent = 'Here’s a song for you, too.';
    this.progress.hidden = true;
    this.confirmation.hidden = true;
    if (unlockSong(ANDY_SONG)) {
      this.confirmation.textContent = `${ANDY_SONG} was added to your music playlist. A Walkman is required to play it.`;
      this.confirmation.hidden = false;
      const gameShell = document.querySelector<HTMLElement>('.game-shell');
      if (gameShell) {
        const overlay = document.createElement('div');
        overlay.className = 'quest-accepted-overlay item-received-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        const image = document.createElement('img');
        image.src = resolveSiteAsset(getSongArtwork(ANDY_SONG));
        image.alt = '';
        overlay.append(image);
        gameShell.append(overlay);
        window.setTimeout(() => overlay.remove(), 3200);
        void createGameAudio(resolveSiteAsset('audio/music-accepted.mp3')).play().catch(() => {});
      }
    }
    this.nextButton.hidden = true;
    if (this.options) this.options.hidden = true;
  }
}
