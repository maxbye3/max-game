import { requireElement } from './dom.js';
import { addGift, hasGift, removeGift, PORTABLE_WALKMAN } from './inventory-gifts.js';
import { getUnlockedSongs, type Song } from './music-library.js';

const musicToggle = requireElement<HTMLButtonElement>('#music-toggle');
const musicPanel = requireElement<HTMLElement>('#music-panel');
const musicClose = requireElement<HTMLButtonElement>('#music-close');
const musicControlsGroup = requireElement<HTMLElement>('#music-controls-group');
const musicSelect = requireElement<HTMLSelectElement>('#music-select');
const playPauseButton = requireElement<HTMLButtonElement>('#music-play-pause');
const volumeSlider = requireElement<HTMLInputElement>('#music-volume');
const musicStatus = requireElement<HTMLElement>('#music-status');

const player = new Audio();
player.loop = true;
player.volume = Number(volumeSlider.value);

let selectedSong: Song | null = null;

function refreshSongOptions(): void {
  const unlocked = getUnlockedSongs();
  musicSelect.replaceChildren(new Option('Select a song', ''));
  unlocked.forEach((song) => musicSelect.add(new Option(song, song)));
  if (!selectedSong || !unlocked.includes(selectedSong)) {
    selectedSong = null;
    player.pause();
    player.removeAttribute('src');
  } else {
    musicSelect.value = selectedSong;
  }
}

function setPlayerButton(): void {
  playPauseButton.textContent = player.paused ? 'Play' : 'Pause';
  playPauseButton.setAttribute('aria-label', player.paused ? 'Play selected song' : 'Pause selected song');
}

function setPanelOpen(isOpen: boolean): void {
  musicPanel.hidden = !isOpen;
  musicToggle.setAttribute('aria-expanded', String(isOpen));
  if (!isOpen && musicPanel.contains(document.activeElement)) musicToggle.focus();
}

function hasWalkman(): boolean {
  return hasGift(PORTABLE_WALKMAN);
}

function updateWalkmanAvailability(): void {
  const unlocked = hasWalkman();
  const hasSongs = getUnlockedSongs().length > 0;
  musicControlsGroup.hidden = !unlocked;
  musicSelect.disabled = !unlocked;
  volumeSlider.disabled = !unlocked;
  playPauseButton.disabled = !unlocked || !selectedSong;
  if (!unlocked) {
    player.pause();
    musicStatus.textContent = "You don't have a way to play music";
    setPlayerButton();
  } else if (!hasSongs) {
    musicStatus.textContent = 'You have not earned any songs yet.';
  } else if (!selectedSong) {
    musicStatus.textContent = 'Choose a song to start playing.';
  }
}

function playSelectedSong(): void {
  if (!selectedSong || !hasWalkman()) return;
  void player.play().then(() => {
    musicStatus.textContent = `Playing ${selectedSong}.`;
    setPlayerButton();
  }).catch(() => {
    musicStatus.textContent = 'Playback was blocked. Press Play to try again.';
    setPlayerButton();
  });
}

export function setupMusicPlayer(): void {
  refreshSongOptions();
  musicSelect.addEventListener('change', () => {
    if (!hasWalkman()) return;
    const song = musicSelect.value as Song | '';
    if (!song) return;
    selectedSong = song;
    player.src = `audio/music/${encodeURIComponent(song)}.mp3`;
    player.currentTime = 0;
    playPauseButton.disabled = false;
    playSelectedSong();
  });

  playPauseButton.addEventListener('click', () => {
    if (!selectedSong || !hasWalkman()) return;
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

  musicToggle.addEventListener('click', () => {
    setPanelOpen(musicPanel.hidden);
    updateWalkmanAvailability();
  });
  musicClose.addEventListener('click', () => setPanelOpen(false));
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setPanelOpen(false);
  });
  window.addEventListener('max-game:inventory-gift-added', updateWalkmanAvailability);
  window.addEventListener('max-game:inventory-gift-removed', updateWalkmanAvailability);
  window.addEventListener('max-game:music-unlocked', () => {
    refreshSongOptions();
    updateWalkmanAvailability();
    musicToggle.classList.remove('inventory-added-wobble');
    void musicToggle.offsetWidth;
    musicToggle.classList.add('inventory-added-wobble');
    window.setTimeout(() => musicToggle.classList.remove('inventory-added-wobble'), 1000);
  });
  updateWalkmanAvailability();

  // TEMP: testing-only toggle, remove before shipping (along with the button in index.html).
  document.querySelector<HTMLButtonElement>('#walkman-debug-toggle')?.addEventListener('click', () => {
    if (hasWalkman()) removeGift(PORTABLE_WALKMAN);
    else addGift(PORTABLE_WALKMAN);
  });
}
