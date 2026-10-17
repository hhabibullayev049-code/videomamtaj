import { VideoClip, VideoFilters } from '../types/editor';

const defaultFilters: VideoFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hueRotate: 0,
  sepia: 0,
  grayscale: 0,
  invert: 0,
  blur: 0,
};

/**
 * Generates a real playable video blob directly in the browser using HTML5 Canvas + MediaRecorder.
 * This guarantees 100% reliable offline / immediate sample videos with rich motion graphics!
 */
export async function generateSampleVideoBlob(
  type: 'neon' | 'nature' | 'sunset',
  durationSec = 6
): Promise<string> {
  const width = 1280;
  const height = 720;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Try standard mime types
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/webm')
    ? 'video/webm'
    : 'video/mp4';

  const stream = canvas.captureStream(30);

  // Synthesize an ambient audio track to accompany the sample video
  let audioTrack: MediaStreamTrack | null = null;
  try {
    const audioCtx = new AudioContext();
    const dest = audioCtx.createMediaStreamDestination();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type === 'neon' ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(type === 'neon' ? 110 : 220, 0);
    gain.gain.setValueAtTime(0.05, 0);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(0);

    audioTrack = dest.stream.getAudioTracks()[0];
    if (audioTrack) {
      stream.addTrack(audioTrack);
    }
  } catch {
    // Audio optional if restricted
  }

  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType }));
    };
  });

  recorder.start();

  const fps = 30;
  const totalFrames = durationSec * fps;
  let currentFrame = 0;

  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (currentFrame >= totalFrames) {
        clearInterval(interval);
        recorder.stop();
        recordingPromise.then((blob) => {
          const url = URL.createObjectURL(blob);
          resolve(url);
        });
        return;
      }

      const progress = currentFrame / totalFrames;
      const time = currentFrame / fps;

      // Draw canvas scenes
      if (type === 'neon') {
        // Cyberpunk synthwave sunset
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#0f051d');
        bgGrad.addColorStop(0.5, '#2e0854');
        bgGrad.addColorStop(0.7, '#8b008b');
        bgGrad.addColorStop(1, '#05010a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Sun with horizontal stripes
        const sunX = width / 2;
        const sunY = height * 0.45;
        const sunRadius = 140;

        const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunRadius);
        sunGrad.addColorStop(0, '#ffea00');
        sunGrad.addColorStop(0.5, '#ff007f');
        sunGrad.addColorStop(1, '#7928ca');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        // Sun lines
        ctx.fillStyle = '#0f051d';
        for (let i = 0; i < 8; i++) {
          const lineY = sunY + 20 + i * 14;
          const lineH = 3 + i * 1.5;
          ctx.fillRect(sunX - sunRadius, lineY, sunRadius * 2, lineH);
        }

        // Perspective grid lines
        const horizonY = height * 0.65;
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 1.5;

        // Perspective radiating lines
        for (let x = -width; x < width * 2; x += 100) {
          ctx.beginPath();
          ctx.moveTo(sunX, horizonY);
          ctx.lineTo(x + (x - sunX) * 2, height);
          ctx.stroke();
        }

        // Moving horizontal grid lines
        const gridOffset = (time * 60) % 30;
        for (let y = horizonY; y < height; y += 25) {
          const actualY = y + gridOffset * ((y - horizonY) / (height - horizonY));
          if (actualY <= height) {
            ctx.beginPath();
            ctx.moveTo(0, actualY);
            ctx.lineTo(width, actualY);
            ctx.stroke();
          }
        }

        // City skyline silhouette
        ctx.fillStyle = '#060012';
        for (let b = 0; b < 20; b++) {
          const bx = b * 65;
          const bh = 50 + Math.sin(b * 3.7) * 40 + (b % 3) * 30;
          ctx.fillRect(bx, horizonY - bh, 60, bh);
        }

        // Title text
        ctx.font = 'bold 54px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 20;
        ctx.fillText('NEON CYBER VIBE', width / 2, 100);
        ctx.font = '24px monospace';
        ctx.fillText(`PRO STUDIO DEMO • 00:0${Math.floor(time)}`, width / 2, 140);
        ctx.shadowBlur = 0;

      } else if (type === 'nature') {
        // Nature mountain sunrise
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        skyGrad.addColorStop(0, '#1a365d');
        skyGrad.addColorStop(0.4, '#2b6cb0');
        skyGrad.addColorStop(0.7, '#f6ad55');
        skyGrad.addColorStop(1, '#feb2b2');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);

        // Sun
        const sunY = height * 0.5 - progress * 80;
        ctx.fillStyle = '#ffedd5';
        ctx.shadowColor = '#f6ad55';
        ctx.shadowBlur = 40;
        ctx.beginPath();
        ctx.arc(width * 0.35, sunY, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Distant Mountains
        ctx.fillStyle = '#2d3748';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.65);
        ctx.lineTo(250, height * 0.38);
        ctx.lineTo(550, height * 0.62);
        ctx.lineTo(850, height * 0.32);
        ctx.lineTo(1100, height * 0.55);
        ctx.lineTo(width, height * 0.45);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();

        // Fore Mountains with pine trees
        ctx.fillStyle = '#1a202c';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.75);
        ctx.lineTo(350, height * 0.55);
        ctx.lineTo(700, height * 0.72);
        ctx.lineTo(1000, height * 0.5);
        ctx.lineTo(width, height * 0.68);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();

        // Animated Birds
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
          const birdX = (width * 0.2 + time * 70 + i * 80) % width;
          const birdY = 180 + Math.sin(time * 3 + i) * 20 + i * 25;
          const wing = Math.sin(time * 12 + i) * 8;
          ctx.beginPath();
          ctx.moveTo(birdX - 14, birdY - wing);
          ctx.quadraticCurveTo(birdX - 7, birdY, birdX, birdY + 3);
          ctx.quadraticCurveTo(birdX + 7, birdY, birdX + 14, birdY - wing);
          ctx.stroke();
        }

        ctx.font = 'bold 54px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 10;
        ctx.fillText('NATURE HORIZON', width / 2, 100);
        ctx.font = '24px sans-serif';
        ctx.fillText('CINEMATIC 4K ULTRA HD', width / 2, 140);
        ctx.shadowBlur = 0;

      } else {
        // Golden Sunset Ocean
        const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
        oceanGrad.addColorStop(0, '#4a0e4e');
        oceanGrad.addColorStop(0.3, '#c2185b');
        oceanGrad.addColorStop(0.6, '#ff9800');
        oceanGrad.addColorStop(0.75, '#e65100');
        oceanGrad.addColorStop(1, '#1a0033');
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(0, 0, width, height);

        // Huge warm sun
        ctx.fillStyle = '#fff9c4';
        ctx.shadowColor = '#ffb74d';
        ctx.shadowBlur = 60;
        ctx.beginPath();
        ctx.arc(width * 0.65, height * 0.55, 120, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Ocean reflection ripples
        ctx.fillStyle = 'rgba(255, 235, 59, 0.4)';
        for (let r = 0; r < 20; r++) {
          const ry = height * 0.6 + r * 15;
          const rw = (180 + r * 18) * (1 + Math.sin(time * 4 + r) * 0.2);
          const rx = width * 0.65 - rw / 2;
          ctx.fillRect(rx, ry, rw, 4);
        }

        // Boat silhouette
        const boatX = (width * 0.8 - time * 35);
        const boatY = height * 0.72;
        ctx.fillStyle = '#110022';
        ctx.beginPath();
        ctx.moveTo(boatX, boatY);
        ctx.lineTo(boatX + 50, boatY);
        ctx.lineTo(boatX + 40, boatY + 12);
        ctx.lineTo(boatX + 10, boatY + 12);
        ctx.closePath();
        ctx.fill();
        // Sail
        ctx.beginPath();
        ctx.moveTo(boatX + 25, boatY);
        ctx.lineTo(boatX + 25, boatY - 35);
        ctx.lineTo(boatX + 42, boatY - 5);
        ctx.closePath();
        ctx.fill();

        ctx.font = 'bold 54px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 15;
        ctx.fillText('GOLDEN SUNSET', width / 2, 100);
        ctx.font = '24px sans-serif';
        ctx.fillText('COLOR GRADE DEMO', width / 2, 140);
        ctx.shadowBlur = 0;
      }

      currentFrame++;
    }, 1000 / fps);
  });
}

/**
 * Creates a default starter clip
 */
export async function createDefaultSampleClip(type: 'neon' | 'nature' | 'sunset' = 'neon'): Promise<VideoClip> {
  const url = await generateSampleVideoBlob(type, 6);
  return {
    id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    name: type === 'neon' ? 'Neon Cyber Vibe' : type === 'nature' ? 'Nature Horizon' : 'Golden Sunset',
    src: url,
    duration: 6,
    sourceDuration: 6,
    startOffset: 0,
    speed: 1.0,
    volume: 1.0,
    rotation: 0,
    flipH: false,
    flipV: false,
    fitMode: 'contain',
    transition: 'none',
    transitionDuration: 0.5,
    filters: { ...defaultFilters },
  };
}
