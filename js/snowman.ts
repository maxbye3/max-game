export const SNOWMAN = {
  // Matches the snowman baked into snow-mansion.png.
  x: 925,
  y: 1110,
  fallenWidth: 82,
  fallenHeight: 67,
} as const;

const COLLISION_RADIUS = 25;

let fallen = false;

export const isSnowmanFallen = () => fallen;

function playFallSound(): void {
  const AudioContextClass = window.AudioContext;
  const audioContext = new AudioContextClass();
  const oscillator = audioContext.createOscillator();
  const bonkGain = audioContext.createGain();
  const noise = audioContext.createBufferSource();
  const noiseFilter = audioContext.createBiquadFilter();
  const noiseGain = audioContext.createGain();
  const noiseBuffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * 0.16), audioContext.sampleRate);
  const noiseSamples = noiseBuffer.getChannelData(0);

  for (let index = 0; index < noiseSamples.length; index += 1) {
    const fade = 1 - index / noiseSamples.length;
    noiseSamples[index] = (Math.random() * 2 - 1) * fade;
  }

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(180, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(65, audioContext.currentTime + 0.18);
  bonkGain.gain.setValueAtTime(0.14, audioContext.currentTime);
  bonkGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);

  noise.buffer = noiseBuffer;
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 900;
  noiseFilter.Q.value = 0.7;
  noiseGain.gain.setValueAtTime(0.09, audioContext.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.16);

  oscillator.connect(bonkGain);
  bonkGain.connect(audioContext.destination);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(audioContext.destination);
  oscillator.start();
  noise.start();
  oscillator.stop(audioContext.currentTime + 0.2);
  noise.stop(audioContext.currentTime + 0.16);
  oscillator.addEventListener('ended', () => void audioContext.close(), { once: true });
}

export function playerCollidesWithSnowman(x: number, y: number): boolean {
  if (fallen) return false;
  if (Math.hypot(x - SNOWMAN.x, y - SNOWMAN.y) >= COLLISION_RADIUS) return false;

  fallen = true;
  playFallSound();
  return true;
}
