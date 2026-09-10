import { requireElement } from './dom.js';

const SONGS = [
  'Africa',
  'Dear Abe',
  'Sundays',
  'Too much duolingo',
  'Outer wildeds',
  'One dimensional man',
  'Nowimfallingasleep',
  'Lemon jelly',
] as const;

const musicToggle = requireElement<HTMLButtonElement>('#music-toggle');
const musicPanel = requireElement<HTMLElement>('#music-panel');
const musicClose = requireElement<HTMLButtonElement>('#music-close');
const musicSelect = requireElement<HTMLSelectElement>('#music-select');
const playPauseButton = requireElement<HTMLButtonElement>('#music-play-pause');
const volumeSlider = requireElement<HTMLInputElement>('#music-volume');
const musicStatus = requireElement<HTMLElement>('#music-status');

const player = new Audio();
player.loop = true;
player.volume = Number(volumeSlider.value);

let selectedSong: (typeof SONGS)[number] | null = null;

function setPlayerButton(): void {
  playPauseButton.textContent = player.paused ? 'Play' : 'Pause';
  playPauseButton.setAttribute('aria-label', player.paused ? 'Play selected song' : 'Pause selected song');
}

function setPanelOpen(isOpen: boolean): void {
  musicPanel.hidden = !isOpen;
  musicToggle.setAttribute('aria-expanded', String(isOpen));
  if (!isOpen && musicPanel.contains(document.activeElement)) musicToggle.focus();
}

function playSelectedSong(): void {
  if (!selectedSong) return;
  void player.play().then(() => {
    musicStatus.textContent = `Playing ${selectedSong}.`;
    setPlayerButton();
  }).catch(() => {
    musicStatus.textContent = 'Playback was blocked. Press Play to try again.';
    setPlayerButton();
  });
}

export function setupMusicPlayer(): void {
  musicSelect.addEventListener('change', () => {
    const song = musicSelect.value as (typeof SONGS)[number] | '';
    if (!song) return;
    selectedSong = song;
    player.src = `audio/music/${encodeURIComponent(song)}.mp3`;
    player.currentTime = 0;
    playPauseButton.disabled = false;
    playSelectedSong();
  });

  playPauseButton.addEventListener('click', () => {
    if (!selectedSong) return;
    if (player.paused) playSelectedSong();
    else {
      player.pause();
      musicStatus.textContent = `Paused ${selectedSong}.`;
      setPlayerButton();
    }
  });

  volumeSlider.addEventListener('input', () => {
    player.volume = Number(volumeSlider.value);
  });

  player.addEventListener('play', setPlayerButton);
  player.addEventListener('pause', setPlayerButton);
  player.addEventListener('error', () => {
    musicStatus.textContent = 'That song could not be loaded.';
    setPlayerButton();
  });

  musicToggle.addEventListener('click', () => setPanelOpen(musicPanel.hidden));
  musicClose.addEventListener('click', () => setPanelOpen(false));
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setPanelOpen(false);
  });
  setPlayerButton();
}
