/**
 * In-browser Web Audio API synthesizer for royalty-free demo tracks,
 * sound effects, and audio waveform extraction.
 */

// Helper to convert AudioBuffer to WAV format Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const outBuffer = new ArrayBuffer(length);
  const view = new DataView(outBuffer);
  const channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // 16-bit

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (sample < 0 ? sample * 0x8000 : sample * 0x7fff) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([outBuffer], { type: 'audio/wav' });
}

export async function createLofiBeat(durationSec = 15): Promise<string> {
  const sampleRate = 44100;
  const ctx = new OfflineAudioContext(2, sampleRate * durationSec, sampleRate);

  // Chords progression (Fm9 - Ebmaj7 - Dbmaj7 - C7)
  const chordFrequencies = [
    [174.61, 207.65, 261.63, 311.13, 349.23], // Fm9
    [155.56, 196.00, 233.08, 293.66, 349.23], // Ebmaj7
    [138.59, 174.61, 207.65, 261.63, 329.63], // Dbmaj7
    [130.81, 164.81, 196.00, 233.08, 293.66], // C7
  ];

  const barDuration = 3.5;
  for (let t = 0; t < durationSec; t += barDuration) {
    const chordIndex = Math.floor(t / barDuration) % chordFrequencies.length;
    const freqs = chordFrequencies[chordIndex];

    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.04, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + barDuration - 0.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + barDuration);
    });

    // Soft beat kicks & claps
    for (let beat = 0; beat < 4; beat++) {
      const beatTime = t + beat * (barDuration / 4);
      if (beatTime >= durationSec) break;

      // Kick on 1 and 3
      if (beat === 0 || beat === 2) {
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kickOsc.frequency.setValueAtTime(120, beatTime);
        kickOsc.frequency.exponentialRampToValueAtTime(30, beatTime + 0.2);
        kickGain.gain.setValueAtTime(0.3, beatTime);
        kickGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.25);
        kickOsc.connect(kickGain);
        kickGain.connect(ctx.destination);
        kickOsc.start(beatTime);
        kickOsc.stop(beatTime + 0.25);
      }

      // Snare/Hat on 2 and 4
      if (beat === 1 || beat === 3) {
        const noiseBuffer = ctx.createBuffer(1, sampleRate * 0.1, sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(1800, beatTime);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.12, beatTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.1);

        whiteNoise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        whiteNoise.start(beatTime);
      }
    }
  }

  const rendered = await ctx.startRendering();
  const wavBlob = audioBufferToWav(rendered);
  return URL.createObjectURL(wavBlob);
}

export async function createCinematicPad(durationSec = 16): Promise<string> {
  const sampleRate = 44100;
  const ctx = new OfflineAudioContext(2, sampleRate * durationSec, sampleRate);

  // Ethereal drone chords
  const rootFreqs = [110, 164.81, 220, 329.63, 440];
  rootFreqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, 0);
    // subtle detune
    osc.detune.setValueAtTime((idx % 2 === 0 ? 5 : -5), 0);

    gain.gain.setValueAtTime(0.001, 0);
    gain.gain.linearRampToValueAtTime(0.06 / (idx + 1), 2);
    gain.gain.linearRampToValueAtTime(0.06 / (idx + 1), durationSec - 2);
    gain.gain.exponentialRampToValueAtTime(0.001, durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(0);
    osc.stop(durationSec);
  });

  const rendered = await ctx.startRendering();
  const wavBlob = audioBufferToWav(rendered);
  return URL.createObjectURL(wavBlob);
}

export async function createUpbeatPulse(durationSec = 15): Promise<string> {
  const sampleRate = 44100;
  const ctx = new OfflineAudioContext(2, sampleRate * durationSec, sampleRate);
  const tempo = 120; // 0.5s per beat
  const beatTime = 60 / tempo;

  for (let t = 0; t < durationSec; t += beatTime) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    const note = (Math.floor(t / beatTime) % 4 === 0) ? 130.81 : 164.81;
    osc.frequency.setValueAtTime(note, t);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + beatTime * 0.8);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + beatTime * 0.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + beatTime);
  }

  const rendered = await ctx.startRendering();
  const wavBlob = audioBufferToWav(rendered);
  return URL.createObjectURL(wavBlob);
}

export async function extractWaveformPeaks(audioBlobOrUrl: Blob | string, samplesCount = 100): Promise<number[]> {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    let arrayBuffer: ArrayBuffer;
    if (typeof audioBlobOrUrl === 'string') {
      const res = await fetch(audioBlobOrUrl);
      arrayBuffer = await res.arrayBuffer();
    } else {
      arrayBuffer = await audioBlobOrUrl.arrayBuffer();
    }

    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / samplesCount);
    const peaks: number[] = [];

    for (let i = 0; i < samplesCount; i++) {
      let sum = 0;
      const start = i * blockSize;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[start + j] || 0);
      }
      peaks.push(Math.min(1, (sum / blockSize) * 2.5));
    }
    audioContext.close();
    return peaks;
  } catch {
    // Return pseudo waveform if decoding fails
    return Array.from({ length: samplesCount }, (_, i) => 0.2 + 0.6 * Math.abs(Math.sin(i * 0.15)));
  }
}
