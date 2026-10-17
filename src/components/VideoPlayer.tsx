import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Repeat,
  Scissors,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { computeClipPositions, getAspectRatioDimensions, renderFrame } from '../utils/canvasRenderer';

export const VideoPlayer: React.FC = () => {
  const {
    clips,
    audioClips,
    textOverlays,
    watermarks,
    aspectRatio,
    currentTime,
    setCurrentTime,
    isPlaying,
    togglePlay,
    stop,
    stepFrame,
    loop,
    setLoop,
    splitClipAtPlayhead,
    totalDuration,
    selectedClip,
    selectedOverlay,
    updateTextOverlay,
    selectedWatermark,
    updateWatermark,
    t,
  } = useEditor();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Hidden video elements cache
  const videoElementsMapRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const imageElementsMapRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const watermarkImagesMapRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const audioElementsMapRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Master audio mute preview toggle
  const [isMuted, setIsMuted] = useState(false);

  // Dragging overlay element on canvas
  const [isDraggingOverlay, setIsDraggingOverlay] = useState(false);
  const dragTargetRef = useRef<'text' | 'watermark' | null>(null);

  // Keep video elements in sync with clips array
  useEffect(() => {
    const map = videoElementsMapRef.current;
    clips.forEach((clip) => {
      let v = map.get(clip.id);
      if (!v) {
        v = document.createElement('video');
        v.crossOrigin = 'anonymous';
        v.playsInline = true;
        v.muted = true; // Video element plays muted; audio handled separately for volume control
        v.src = clip.src;
        map.set(clip.id, v);
      } else if (v.src !== clip.src) {
        v.src = clip.src;
      }
    });

    // Clean up removed clips
    map.forEach((_, id) => {
      if (!clips.some((c) => c.id === id)) {
        map.delete(id);
      }
    });
  }, [clips]);

  // Keep watermark image elements in sync
  useEffect(() => {
    const map = watermarkImagesMapRef.current;
    watermarks.forEach((wm) => {
      let img = map.get(wm.id);
      if (!img) {
        img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = wm.src;
        map.set(wm.id, img);
      } else if (img.src !== wm.src) {
        img.src = wm.src;
      }
    });
    map.forEach((_, id) => {
      if (!watermarks.some((w) => w.id === id)) {
        map.delete(id);
      }
    });
  }, [watermarks]);

  // Audio elements synchronization
  useEffect(() => {
    const audioMap = audioElementsMapRef.current;
    // Audio from audio tracks
    audioClips.forEach((ac) => {
      let a = audioMap.get(ac.id);
      if (!a) {
        a = new Audio(ac.src);
        audioMap.set(ac.id, a);
      } else if (a.src !== ac.src) {
        a.src = ac.src;
      }
    });

    // Audio from video clips
    clips.forEach((c) => {
      const audioKey = `vid-audio-${c.id}`;
      let a = audioMap.get(audioKey);
      if (!a) {
        a = new Audio(c.src);
        audioMap.set(audioKey, a);
      } else if (a.src !== c.src) {
        a.src = c.src;
      }
    });

    // Cleanup deleted
    audioMap.forEach((a, id) => {
      const isClipAudio = id.startsWith('vid-audio-');
      const exists = isClipAudio
        ? clips.some((c) => `vid-audio-${c.id}` === id)
        : audioClips.some((ac) => ac.id === id);
      if (!exists) {
        a.pause();
        audioMap.delete(id);
      }
    });
  }, [audioClips, clips]);

  // Main playback animation loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loopPlayback = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + delta;
          if (next >= totalDuration) {
            if (loop) return 0;
            togglePlay();
            return totalDuration;
          }
          return next;
        });
      }

      animId = requestAnimationFrame(loopPlayback);
    };

    animId = requestAnimationFrame(loopPlayback);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, totalDuration, loop, setCurrentTime, togglePlay]);

  // Sync video elements & audio playback with currentTime
  useEffect(() => {
    const { positions } = computeClipPositions(clips);

    // Sync video elements
    positions.forEach((pos) => {
      const v = videoElementsMapRef.current.get(pos.clip.id);
      if (v) {
        const localTime =
          (currentTime - pos.startTime) * (pos.clip.speed || 1.0) + pos.clip.startOffset;
        const clampedLocal = Math.max(0, Math.min(v.duration || 9999, localTime));

        // Only seek if difference is noticeable to prevent stutter
        if (Math.abs(v.currentTime - clampedLocal) > 0.08) {
          v.currentTime = clampedLocal;
        }

        if (isPlaying && currentTime >= pos.startTime && currentTime <= pos.endTime) {
          v.playbackRate = pos.clip.speed || 1.0;
          if (v.paused) v.play().catch(() => {});
        } else {
          if (!v.paused) v.pause();
        }
      }
    });

    // Sync Audio
    const audioMap = audioElementsMapRef.current;
    // 1. Video clip audio tracks
    positions.forEach((pos) => {
      const a = audioMap.get(`vid-audio-${pos.clip.id}`);
      if (a) {
        const localTime =
          (currentTime - pos.startTime) * (pos.clip.speed || 1.0) + pos.clip.startOffset;
        const isActive =
          isPlaying &&
          !isMuted &&
          currentTime >= pos.startTime &&
          currentTime <= pos.endTime &&
          pos.clip.volume > 0;

        a.volume = isMuted ? 0 : Math.min(1, pos.clip.volume);
        a.playbackRate = pos.clip.speed || 1.0;

        if (Math.abs(a.currentTime - localTime) > 0.15) {
          a.currentTime = Math.max(0, localTime);
        }

        if (isActive) {
          if (a.paused) a.play().catch(() => {});
        } else {
          if (!a.paused) a.pause();
        }
      }
    });

    // 2. Audio track clips (music/voiceover)
    audioClips.forEach((ac) => {
      const a = audioMap.get(ac.id);
      if (a) {
        const localTime = (currentTime - ac.startTime) + ac.startOffset;
        const isActive =
          isPlaying &&
          !isMuted &&
          currentTime >= ac.startTime &&
          currentTime <= ac.startTime + ac.duration &&
          ac.volume > 0;

        a.volume = isMuted ? 0 : Math.min(1, ac.volume);

        if (Math.abs(a.currentTime - localTime) > 0.15) {
          a.currentTime = Math.max(0, localTime);
        }

        if (isActive) {
          if (a.paused) a.play().catch(() => {});
        } else {
          if (!a.paused) a.pause();
        }
      }
    });
  }, [currentTime, isPlaying, clips, audioClips, isMuted]);

  // Render canvas frame on currentTime change or state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = getAspectRatioDimensions(aspectRatio, 1280);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    renderFrame(
      canvas,
      ctx,
      clips,
      textOverlays,
      watermarks,
      currentTime,
      videoElementsMapRef.current,
      imageElementsMapRef.current,
      watermarkImagesMapRef.current
    );
  }, [clips, textOverlays, watermarks, currentTime, aspectRatio]);

  // Canvas interactive drag to position text overlay / watermark
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    if (selectedOverlay) {
      dragTargetRef.current = 'text';
      setIsDraggingOverlay(true);
      updateTextOverlay(selectedOverlay.id, {
        x: Math.round(clickX),
        y: Math.round(clickY),
      });
    } else if (selectedWatermark) {
      dragTargetRef.current = 'watermark';
      setIsDraggingOverlay(true);
      updateWatermark(selectedWatermark.id, {
        x: Math.round(clickX),
        y: Math.round(clickY),
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingOverlay) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const moveX = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const moveY = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));

    if (dragTargetRef.current === 'text' && selectedOverlay) {
      updateTextOverlay(selectedOverlay.id, {
        x: Math.round(moveX),
        y: Math.round(moveY),
      });
    } else if (dragTargetRef.current === 'watermark' && selectedWatermark) {
      updateWatermark(selectedWatermark.id, {
        x: Math.round(moveX),
        y: Math.round(moveY),
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingOverlay(false);
    dragTargetRef.current = null;
  };

  // Format time (00:00.0)
  const formatTimecode = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col bg-zinc-950 min-h-0 relative select-none overflow-hidden"
    >
      {/* Top player badge info */}
      <div className="h-8 px-4 flex items-center justify-between text-xs text-zinc-400 bg-zinc-900/40 border-b border-zinc-800/60 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[11px] text-zinc-300">
            {formatTimecode(currentTime)} / {formatTimecode(totalDuration)}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
            {aspectRatio}
          </span>
        </div>

        {selectedClip && (
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-300 truncate max-w-[200px] md:max-w-[320px]">
            <span className="text-violet-400 font-medium">Faol klip:</span>
            <span className="truncate">{selectedClip.name}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1 rounded text-zinc-400 hover:text-white cursor-pointer"
            title={isMuted ? 'Ovozni yoqish' : 'Ovozni o‘chirish'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1 rounded text-zinc-400 hover:text-white cursor-pointer"
            title="To‘liq ekran"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Center Canvas Stage */}
      <div className="flex-1 flex items-center justify-center p-3 overflow-hidden relative">
        <div className="relative max-w-full max-h-full flex items-center justify-center rounded-xl overflow-hidden shadow-2xl shadow-black border border-zinc-800/80 bg-zinc-900">
          <canvas
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            className="max-w-full max-h-[calc(100vh-340px)] object-contain cursor-crosshair"
            style={{
              aspectRatio:
                aspectRatio === '16:9'
                  ? '16/9'
                  : aspectRatio === '9:16'
                  ? '9/16'
                  : aspectRatio === '1:1'
                  ? '1/1'
                  : aspectRatio === '4:5'
                  ? '4/5'
                  : '21/9',
            }}
          />

          {(selectedOverlay || selectedWatermark) && (
            <div className="absolute top-2 left-2 pointer-events-none bg-black/70 backdrop-blur-md px-2 py-1 rounded text-[10px] text-violet-300 font-mono border border-violet-500/40">
              Kadr ustiga bosib joyini siljiting (X, Y)
            </div>
          )}
        </div>
      </div>

      {/* Bottom Transport Controls */}
      <div className="h-12 bg-zinc-900 border-t border-zinc-800 px-4 flex items-center justify-between shrink-0">
        {/* Left: Stop & Step Frame */}
        <div className="flex items-center gap-1">
          <button
            onClick={stop}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            title={t.stop}
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={() => stepFrame(-1)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            title={t.stepBack}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => stepFrame(1)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            title={t.stepForward}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Play/Pause Large Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-md shadow-violet-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title={isPlaying ? t.pause : t.play}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>
        </div>

        {/* Right: Loop, Split & Timecode */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => splitClipAtPlayhead()}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-zinc-800 hover:bg-zinc-700 text-violet-300 border border-violet-500/30 transition-colors cursor-pointer"
            title={t.splitAtPlayhead}
          >
            <Scissors className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline">Split</span>
          </button>

          <button
            onClick={() => setLoop(!loop)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              loop
                ? 'text-violet-400 bg-violet-500/20 border border-violet-500/40'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
            }`}
            title={t.loop}
          >
            <Repeat className="w-4 h-4" />
          </button>

          <div className="hidden sm:block font-mono text-xs text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
            {formatTimecode(currentTime)}
          </div>
        </div>
      </div>
    </div>
  );
};
