import { AspectRatio, ImageWatermark, TextOverlay, VideoClip } from '../types/editor';

export function getAspectRatioDimensions(
  aspect: AspectRatio,
  baseWidth = 1280
): { width: number; height: number } {
  switch (aspect) {
    case '16:9':
      return { width: baseWidth, height: Math.round((baseWidth * 9) / 16) }; // 1280 x 720
    case '9:16':
      return { width: Math.round((baseWidth * 9) / 16), height: baseWidth }; // 720 x 1280
    case '1:1':
      return { width: 900, height: 900 }; // 900 x 900
    case '4:5':
      return { width: 800, height: 1000 }; // 800 x 1000
    case '21:9':
      return { width: baseWidth, height: Math.round((baseWidth * 9) / 21) }; // 1280 x 548
    default:
      return { width: 1280, height: 720 };
  }
}

export interface ClipTimelinePosition {
  clip: VideoClip;
  startTime: number;
  endTime: number;
  index: number;
}

export function computeClipPositions(clips: VideoClip[]): {
  positions: ClipTimelinePosition[];
  totalDuration: number;
} {
  let currentStart = 0;
  const positions: ClipTimelinePosition[] = [];

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const duration = clip.duration;
    positions.push({
      clip,
      startTime: currentStart,
      endTime: currentStart + duration,
      index: i,
    });
    currentStart += duration;
  }

  return { positions, totalDuration: currentStart };
}

export function buildFilterString(filters: VideoClip['filters']): string {
  const parts: string[] = [];
  if (filters.brightness !== 100) parts.push(`brightness(${filters.brightness}%)`);
  if (filters.contrast !== 100) parts.push(`contrast(${filters.contrast}%)`);
  if (filters.saturation !== 100) parts.push(`saturate(${filters.saturation}%)`);
  if (filters.hueRotate !== 0) parts.push(`hue-rotate(${filters.hueRotate}deg)`);
  if (filters.sepia > 0) parts.push(`sepia(${filters.sepia}%)`);
  if (filters.grayscale > 0) parts.push(`grayscale(${filters.grayscale}%)`);
  if (filters.invert > 0) parts.push(`invert(${filters.invert}%)`);
  if (filters.blur > 0) parts.push(`blur(${filters.blur}px)`);
  return parts.length > 0 ? parts.join(' ') : 'none';
}

/**
 * Draws a single video element onto the target canvas with transformation, rotation, flip, and fit mode.
 */
function drawTransformedVideo(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  canvasW: number,
  canvasH: number,
  clip: VideoClip,
  alpha = 1.0,
  scaleMod = 1.0
) {
  if (video.videoWidth === 0 || video.videoHeight === 0) return;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Move origin to canvas center
  ctx.translate(canvasW / 2, canvasH / 2);

  // Rotation
  if (clip.rotation !== 0) {
    ctx.rotate((clip.rotation * Math.PI) / 180);
  }

  // Flip horizontal / vertical
  const scaleX = (clip.flipH ? -1 : 1) * scaleMod;
  const scaleY = (clip.flipV ? -1 : 1) * scaleMod;
  ctx.scale(scaleX, scaleY);

  // Filter application
  ctx.filter = buildFilterString(clip.filters);

  // Compute fit (cover or contain)
  const isRotated90or270 = clip.rotation === 90 || clip.rotation === 270;
  const targetAreaW = isRotated90or270 ? canvasH : canvasW;
  const targetAreaH = isRotated90or270 ? canvasW : canvasH;

  const videoRatio = video.videoWidth / video.videoHeight;
  const targetRatio = targetAreaW / targetAreaH;

  let drawW = targetAreaW;
  let drawH = targetAreaH;

  if (clip.fitMode === 'cover') {
    if (videoRatio > targetRatio) {
      drawH = targetAreaH;
      drawW = drawH * videoRatio;
    } else {
      drawW = targetAreaW;
      drawH = drawW / videoRatio;
    }
  } else {
    // contain
    if (videoRatio > targetRatio) {
      drawW = targetAreaW;
      drawH = drawW / videoRatio;
    } else {
      drawH = targetAreaH;
      drawW = drawH * videoRatio;
    }
  }

  ctx.drawImage(video, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

/**
 * Main rendering procedure for canvas frame
 */
export function renderFrame(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  clips: VideoClip[],
  textOverlays: TextOverlay[],
  watermarks: ImageWatermark[],
  currentTime: number,
  videoElementsMap: Map<string, HTMLVideoElement>,
  imageElementsMap: Map<string, HTMLImageElement>,
  watermarkImagesMap: Map<string, HTMLImageElement>
) {
  const w = canvas.width;
  const h = canvas.height;

  // Clear canvas
  ctx.fillStyle = '#09090b'; // dark zinc background
  ctx.fillRect(0, 0, w, h);

  const { positions, totalDuration } = computeClipPositions(clips);

  if (positions.length === 0 || currentTime > totalDuration) {
    // Empty state preview
    ctx.fillStyle = '#71717a';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Hech qanday video klip yo‘q', w / 2, h / 2);
    ctx.font = '16px sans-serif';
    ctx.fillText('Yuqoridan video yuklang yoki kamera orqali yozing', w / 2, h / 2 + 35);
    return;
  }

  // Find active clip position
  let activeIndex = positions.findIndex(
    (pos) => currentTime >= pos.startTime && currentTime <= pos.endTime
  );

  if (activeIndex === -1) {
    if (currentTime < 0) activeIndex = 0;
    else activeIndex = positions.length - 1;
  }

  const currentPos = positions[activeIndex];
  const activeClip = currentPos.clip;
  const activeVideo = videoElementsMap.get(activeClip.id);

  // Check if we are in transition with next clip
  const nextPos = positions[activeIndex + 1];
  const timeIntoClip = currentTime - currentPos.startTime;
  const timeLeftInClip = currentPos.endTime - currentTime;
  const transDuration = activeClip.transitionDuration || 0.5;

  const isTransitioning =
    nextPos &&
    activeClip.transition !== 'none' &&
    timeLeftInClip <= transDuration;

  if (isTransitioning) {
    const nextVideo = videoElementsMap.get(nextPos.clip.id);
    const progress = 1 - (timeLeftInClip / transDuration); // 0 to 1

    switch (activeClip.transition) {
      case 'fade':
        if (activeVideo) drawTransformedVideo(ctx, activeVideo, w, h, activeClip, 1 - progress);
        if (nextVideo) drawTransformedVideo(ctx, nextVideo, w, h, nextPos.clip, progress);
        break;

      case 'dip-black':
        // Dips down to black then fades in next clip
        if (progress < 0.5) {
          const dipProgress = progress * 2; // 0 to 1
          if (activeVideo) drawTransformedVideo(ctx, activeVideo, w, h, activeClip, 1 - dipProgress);
        } else {
          const riseProgress = (progress - 0.5) * 2; // 0 to 1
          if (nextVideo) drawTransformedVideo(ctx, nextVideo, w, h, nextPos.clip, riseProgress);
        }
        break;

      case 'wipe-left':
        // Wipe clip B sliding over clip A from right
        if (activeVideo) drawTransformedVideo(ctx, activeVideo, w, h, activeClip, 1.0);
        if (nextVideo) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(w * (1 - progress), 0, w * progress, h);
          ctx.clip();
          drawTransformedVideo(ctx, nextVideo, w, h, nextPos.clip, 1.0);
          ctx.restore();
        }
        break;

      case 'zoom-in':
        if (activeVideo) drawTransformedVideo(ctx, activeVideo, w, h, activeClip, 1 - progress, 1 + progress * 0.4);
        if (nextVideo) drawTransformedVideo(ctx, nextVideo, w, h, nextPos.clip, progress, 1.3 - progress * 0.3);
        break;

      default:
        if (activeVideo) drawTransformedVideo(ctx, activeVideo, w, h, activeClip);
        break;
    }
  } else {
    // Normal single clip rendering
    if (activeVideo) {
      drawTransformedVideo(ctx, activeVideo, w, h, activeClip);
    }
  }

  // Draw Watermarks & Logos
  watermarks.forEach((wm) => {
    if (currentTime >= wm.startTime && currentTime <= wm.startTime + wm.duration) {
      const img = watermarkImagesMap.get(wm.id);
      if (img && img.complete) {
        ctx.save();
        ctx.globalAlpha = wm.opacity;
        const targetX = (wm.x / 100) * w;
        const targetY = (wm.y / 100) * h;
        const drawW = img.width * wm.scale;
        const drawH = img.height * wm.scale;
        ctx.drawImage(img, targetX - drawW / 2, targetY - drawH / 2, drawW, drawH);
        ctx.restore();
      }
    }
  });

  // Draw Text Overlays
  textOverlays.forEach((txt) => {
    if (currentTime >= txt.startTime && currentTime <= txt.startTime + txt.duration) {
      const activeAge = currentTime - txt.startTime;
      let alpha = 1.0;
      let scale = 1.0;
      let offsetY = 0;

      if (txt.animation === 'fadeIn') {
        alpha = Math.min(1, activeAge / 0.4);
      } else if (txt.animation === 'pop') {
        const p = Math.min(1, activeAge / 0.3);
        scale = 0.5 + 0.5 * Math.sin(p * (Math.PI / 2));
      } else if (txt.animation === 'slideUp') {
        const p = Math.min(1, activeAge / 0.35);
        offsetY = (1 - p) * 30;
      }

      ctx.save();
      ctx.globalAlpha = alpha;

      const px = (txt.x / 100) * w;
      const py = (txt.y / 100) * h + offsetY;

      ctx.font = `${txt.fontWeight} ${Math.round(txt.fontSize * scale)}px ${txt.fontFamily || 'sans-serif'}`;
      ctx.textAlign = txt.align;
      ctx.textBaseline = 'middle';

      const metrics = ctx.measureText(txt.text);
      const textWidth = metrics.width;
      const textHeight = txt.fontSize * scale;

      // Draw background pill/box if specified
      if (txt.bgColor && txt.bgColor !== 'transparent') {
        const padX = 14;
        const padY = 8;
        let boxX = px - padX;
        if (txt.align === 'center') boxX = px - textWidth / 2 - padX;
        if (txt.align === 'right') boxX = px - textWidth - padX;

        ctx.fillStyle = txt.bgColor;
        ctx.beginPath();
        const r = 6;
        const rectW = textWidth + padX * 2;
        const rectH = textHeight + padY * 2;
        const rectY = py - textHeight / 2 - padY;
        ctx.roundRect(boxX, rectY, rectW, rectH, r);
        ctx.fill();
      }

      // Draw drop shadow
      if (txt.hasShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      }

      ctx.fillStyle = txt.color;
      ctx.fillText(txt.text, px, py);
      ctx.restore();
    }
  });
}
