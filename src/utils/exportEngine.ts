import {
  AspectRatio,
  AudioTrackClip,
  ExportSettings,
  ImageWatermark,
  TextOverlay,
  VideoClip,
} from '../types/editor';
import { computeClipPositions, renderFrame } from './canvasRenderer';

export interface ExportProgress {
  percent: number;
  currentFrame: number;
  totalFrames: number;
  elapsedSeconds: number;
  estimatedRemainingSeconds: number;
  statusText: string;
}

export interface ExportResult {
  blob: Blob;
  url: string;
  filename: string;
  fileSizeMb: number;
  duration: number;
}

export function getExportResolutionDimensions(
  resolution: '1080p' | '720p' | '480p',
  aspect: AspectRatio
): { width: number; height: number } {
  let baseLongEdge = 1920;
  if (resolution === '720p') baseLongEdge = 1280;
  if (resolution === '480p') baseLongEdge = 854;

  switch (aspect) {
    case '16:9':
      return { width: baseLongEdge, height: Math.round((baseLongEdge * 9) / 16) };
    case '9:16':
      return { width: Math.round((baseLongEdge * 9) / 16), height: baseLongEdge };
    case '1:1': {
      const squareSize = resolution === '1080p' ? 1080 : resolution === '720p' ? 720 : 480;
      return { width: squareSize, height: squareSize };
    }
    case '4:5': {
      const h = resolution === '1080p' ? 1350 : resolution === '720p' ? 900 : 600;
      return { width: Math.round((h * 4) / 5), height: h };
    }
    case '21:9':
      return { width: baseLongEdge, height: Math.round((baseLongEdge * 9) / 21) };
    default:
      return { width: 1280, height: 720 };
  }
}

/**
 * Returns best supported video recording mime type on this device/browser
 */
export function getSupportedExportMimeType(preferredFormat: 'mp4' | 'webm'): {
  mimeType: string;
  ext: string;
} {
  if (preferredFormat === 'mp4') {
    if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')) {
      return { mimeType: 'video/mp4;codecs=avc1,mp4a.40.2', ext: 'mp4' };
    }
    if (MediaRecorder.isTypeSupported('video/mp4')) {
      return { mimeType: 'video/mp4', ext: 'mp4' };
    }
  }

  // Fallback to WebM
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
    return { mimeType: 'video/webm;codecs=vp9,opus', ext: 'webm' };
  }
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
    return { mimeType: 'video/webm;codecs=vp8,opus', ext: 'webm' };
  }
  if (MediaRecorder.isTypeSupported('video/webm')) {
    return { mimeType: 'video/webm', ext: 'webm' };
  }

  return { mimeType: '', ext: 'webm' };
}

/**
 * Executes full client-side video rendering and export
 */
export async function exportProjectVideo(
  clips: VideoClip[],
  audioClips: AudioTrackClip[],
  textOverlays: TextOverlay[],
  watermarks: ImageWatermark[],
  aspectRatio: AspectRatio,
  settings: ExportSettings,
  onProgress: (prog: ExportProgress) => void,
  shouldCancel: () => boolean
): Promise<ExportResult> {
  const { totalDuration, positions } = computeClipPositions(clips);

  if (totalDuration <= 0 || clips.length === 0) {
    throw new Error('Eksport qilish uchun kamida bitta klip bo‘lishi kerak');
  }

  const { width, height } = getExportResolutionDimensions(settings.resolution, aspectRatio);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false })!;

  // Pre-load all video elements in DOM
  const videoElementsMap = new Map<string, HTMLVideoElement>();
  const imageElementsMap = new Map<string, HTMLImageElement>();
  const watermarkImagesMap = new Map<string, HTMLImageElement>();

  // Load videos
  await Promise.all(
    clips.map(async (clip) => {
      const v = document.createElement('video');
      v.crossOrigin = 'anonymous';
      v.muted = true; // render muted on element; audio mixed via audio context
      v.src = clip.src;
      v.playsInline = true;
      v.preload = 'auto';

      await new Promise<void>((resolve) => {
        if (v.readyState >= 2) return resolve();
        v.onloadeddata = () => resolve();
        v.onerror = () => resolve(); // continue even if error
      });
      videoElementsMap.set(clip.id, v);
    })
  );

  // Load watermarks
  await Promise.all(
    watermarks.map(async (wm) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = wm.src;
      await new Promise<void>((resolve) => {
        if (img.complete) return resolve();
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
      watermarkImagesMap.set(wm.id, img);
    })
  );

  // Setup Audio Context for mixing
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextClass();
  const audioDestination = audioCtx.createMediaStreamDestination();

  // Create stream from canvas
  const canvasStream = canvas.captureStream(settings.fps);

  // Combine video + audio streams
  const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
  const audioTracks = audioDestination.stream.getAudioTracks();
  if (audioTracks.length > 0) {
    tracks.push(audioTracks[0]);
  }
  const combinedStream = new MediaStream(tracks);

  const { mimeType, ext } = getSupportedExportMimeType(settings.format);
  const bitrates = {
    '1080p': 7000000,
    '720p': 3500000,
    '480p': 1800000,
  };

  const recorderOptions: MediaRecorderOptions = {
    videoBitsPerSecond: bitrates[settings.resolution],
  };
  if (mimeType) {
    recorderOptions.mimeType = mimeType;
  }

  const recorder = new MediaRecorder(combinedStream, recorderOptions);
  const recordedChunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  const recorderFinishPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const finalBlob = new Blob(recordedChunks, {
        type: recorder.mimeType || 'video/mp4',
      });
      resolve(finalBlob);
    };
  });

  // Pre-load audio buffers to accurately mix audio
  const audioBuffers = new Map<string, AudioBuffer>();
  const allAudioItems = [
    ...clips.filter((c) => c.volume > 0).map((c) => ({ id: c.id, src: c.src, volume: c.volume })),
    ...audioClips.map((a) => ({ id: a.id, src: a.src, volume: a.volume })),
  ];

  for (const item of allAudioItems) {
    try {
      const res = await fetch(item.src);
      const ab = await res.arrayBuffer();
      const decoded = await audioCtx.decodeAudioData(ab);
      audioBuffers.set(item.id, decoded);
    } catch {
      // Audio decode fail, proceed silently
    }
  }

  recorder.start(100);

  // Play audio sources scheduled along the timeline
  positions.forEach((pos) => {
    const buf = audioBuffers.get(pos.clip.id);
    if (buf && pos.clip.volume > 0) {
      const source = audioCtx.createBufferSource();
      const gainNode = audioCtx.createGain();
      source.buffer = buf;
      gainNode.gain.value = pos.clip.volume;
      source.playbackRate.value = pos.clip.speed || 1.0;
      source.connect(gainNode);
      gainNode.connect(audioDestination);

      const scheduledStart = audioCtx.currentTime + pos.startTime;
      source.start(scheduledStart, pos.clip.startOffset, pos.clip.duration);
    }
  });

  audioClips.forEach((ac) => {
    const buf = audioBuffers.get(ac.id);
    if (buf && ac.volume > 0) {
      const source = audioCtx.createBufferSource();
      const gainNode = audioCtx.createGain();
      source.buffer = buf;
      gainNode.gain.value = ac.volume;
      source.connect(gainNode);
      gainNode.connect(audioDestination);

      const scheduledStart = audioCtx.currentTime + ac.startTime;
      source.start(scheduledStart, ac.startOffset, ac.duration);
    }
  });

  const fps = settings.fps;
  const totalFrames = Math.ceil(totalDuration * fps);
  const frameIntervalMs = 1000 / fps;
  const startTimeStamp = Date.now();

  // Step through every frame
  for (let frame = 0; frame <= totalFrames; frame++) {
    if (shouldCancel()) {
      recorder.stop();
      audioCtx.close();
      throw new Error('Eksport bekor qilindi');
    }

    const currentExportTime = frame / fps;

    // Seek all relevant video elements to their local time
    for (const pos of positions) {
      const v = videoElementsMap.get(pos.clip.id);
      if (v) {
        if (currentExportTime >= pos.startTime && currentExportTime <= pos.endTime + 0.5) {
          const localTime =
            (currentExportTime - pos.startTime) * (pos.clip.speed || 1.0) + pos.clip.startOffset;
          v.currentTime = Math.min(v.duration || 9999, Math.max(0, localTime));
        }
      }
    }

    // Render frame
    renderFrame(
      canvas,
      ctx,
      clips,
      textOverlays,
      watermarks,
      currentExportTime,
      videoElementsMap,
      imageElementsMap,
      watermarkImagesMap
    );

    // Update progress
    const elapsed = (Date.now() - startTimeStamp) / 1000;
    const percent = Math.min(100, Math.round((frame / totalFrames) * 100));
    const estimatedTotalSec = percent > 0 ? (elapsed / percent) * 100 : 0;
    const remainingSec = Math.max(0, Math.round(estimatedTotalSec - elapsed));

    onProgress({
      percent,
      currentFrame: frame,
      totalFrames,
      elapsedSeconds: Math.round(elapsed),
      estimatedRemainingSeconds: remainingSec,
      statusText: `${frame}/${totalFrames} kadr (${percent}%)`,
    });

    // Small delay to let media recorder encode frame
    await new Promise((r) => setTimeout(r, Math.min(30, frameIntervalMs * 0.4)));
  }

  // Finalize recording
  recorder.stop();
  const finalBlob = await recorderFinishPromise;
  audioCtx.close();

  const finalUrl = URL.createObjectURL(finalBlob);
  const baseFilename = settings.filename.trim() || 'video-edit';
  const finalFilename = baseFilename.endsWith(`.${ext}`)
    ? baseFilename
    : `${baseFilename}.${ext}`;

  return {
    blob: finalBlob,
    url: finalUrl,
    filename: finalFilename,
    fileSizeMb: Number((finalBlob.size / (1024 * 1024)).toFixed(2)),
    duration: totalDuration,
  };
}
