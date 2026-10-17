import React, { useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Layers,
  Magnet,
  Maximize2,
  Mic,
  Music,
  Scissors,
  Trash2,
  Type,
  Video,
  Volume2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { computeClipPositions } from '../utils/canvasRenderer';

export const Timeline: React.FC = () => {
  const {
    clips,
    audioClips,
    textOverlays,
    watermarks,
    currentTime,
    seekTo,
    totalDuration,
    zoom,
    setZoom,
    snapEnabled,
    setSnapEnabled,
    selectedClipId,
    setSelectedClipId,
    selectedAudioId,
    setSelectedAudioId,
    selectedOverlayId,
    setSelectedOverlayId,
    splitClipAtPlayhead,
    deleteClip,
    duplicateClip,
    updateClip,
    updateAudioClip,
    deleteAudioClip,
    updateTextOverlay,
    deleteTextOverlay,
    reorderClips,
    t,
  } = useEditor();

  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Drag-to-trim state
  const [trimmingClip, setTrimmingClip] = useState<{
    id: string;
    edge: 'start' | 'end';
    initialX: number;
    initialOffset: number;
    initialDuration: number;
  } | null>(null);

  const { positions } = computeClipPositions(clips);

  // Convert pixel offset in timeline to seconds
  const pixelToTime = (x: number): number => {
    return Math.max(0, x / zoom);
  };

  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineContainerRef.current) return;
    const rect = timelineContainerRef.current.getBoundingClientRect();
    const scrollLeft = timelineContainerRef.current.scrollLeft;
    const clickX = e.clientX - rect.left + scrollLeft;
    const targetTime = pixelToTime(clickX);

    seekTo(targetTime);
    setIsScrubbing(true);
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isScrubbing && timelineContainerRef.current) {
      const rect = timelineContainerRef.current.getBoundingClientRect();
      const scrollLeft = timelineContainerRef.current.scrollLeft;
      const clickX = e.clientX - rect.left + scrollLeft;
      seekTo(pixelToTime(clickX));
    }

    // Handle drag-trimming clip edges
    if (trimmingClip) {
      const deltaPixels = e.clientX - trimmingClip.initialX;
      const deltaTime = deltaPixels / zoom;

      if (trimmingClip.edge === 'start') {
        const newOffset = Math.max(0, trimmingClip.initialOffset + deltaTime);
        const newDuration = Math.max(0.5, trimmingClip.initialDuration - deltaTime);
        updateClip(trimmingClip.id, {
          startOffset: Number(newOffset.toFixed(2)),
          duration: Number(newDuration.toFixed(2)),
        });
      } else {
        const newDuration = Math.max(0.5, trimmingClip.initialDuration + deltaTime);
        updateClip(trimmingClip.id, {
          duration: Number(newDuration.toFixed(2)),
        });
      }
    }
  };

  const handleTimelineMouseUp = () => {
    setIsScrubbing(false);
    setTrimmingClip(null);
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(200, z * 1.25));
  const handleZoomOut = () => setZoom((z) => Math.max(15, z / 1.25));
  const handleZoomFit = () => {
    if (!timelineContainerRef.current || totalDuration <= 0) return;
    const containerWidth = timelineContainerRef.current.clientWidth - 100;
    const optimalZoom = containerWidth / totalDuration;
    setZoom(Math.max(15, Math.min(200, optimalZoom)));
  };

  // Generate ruler markers every N seconds
  const stepSec = zoom < 30 ? 5 : zoom < 70 ? 2 : 1;
  const rulerMarks: number[] = [];
  const maxRulerSec = Math.max(totalDuration + 5, 20);
  for (let s = 0; s <= maxRulerSec; s += stepSec) {
    rulerMarks.push(s);
  }

  const formatSec = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="h-64 md:h-72 bg-zinc-950 border-t border-zinc-800 flex flex-col select-none shrink-0"
      onMouseMove={handleTimelineMouseMove}
      onMouseUp={handleTimelineMouseUp}
      onMouseLeave={handleTimelineMouseUp}
    >
      {/* Timeline Controls Header */}
      <div className="h-9 px-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs">
        {/* Left Actions for Selected Item */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => splitClipAtPlayhead(selectedClipId || undefined)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors cursor-pointer text-[11px]"
            title={t.splitAtPlayhead}
          >
            <Scissors className="w-3.5 h-3.5 text-violet-400" />
            <span>Split</span>
          </button>

          {selectedClipId && (
            <>
              <button
                onClick={() => duplicateClip(selectedClipId)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors cursor-pointer text-[11px]"
                title={t.duplicateClip}
              >
                <Copy className="w-3.5 h-3.5 text-indigo-400" />
                <span>Nusxa</span>
              </button>
              <button
                onClick={() => deleteClip(selectedClipId)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/40 transition-colors cursor-pointer text-[11px]"
                title={t.deleteClip}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>O‘chirish</span>
              </button>
            </>
          )}

          {selectedAudioId && (
            <button
              onClick={() => deleteAudioClip(selectedAudioId)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/40 transition-colors cursor-pointer text-[11px]"
              title="Audioni o‘chirish"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Audioni o‘chirish</span>
            </button>
          )}

          {selectedOverlayId && (
            <button
              onClick={() => deleteTextOverlay(selectedOverlayId)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/40 transition-colors cursor-pointer text-[11px]"
              title="Matnni o‘chirish"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Matnni o‘chirish</span>
            </button>
          )}
        </div>

        {/* Right: Snapping & Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSnapEnabled(!snapEnabled)}
            className={`p-1 rounded text-xs transition-colors cursor-pointer ${
              snapEnabled
                ? 'text-violet-400 bg-violet-500/20 border border-violet-500/40'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title={t.snapping}
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-0.5 bg-zinc-800/80 rounded border border-zinc-700/60 p-0.5">
            <button
              onClick={handleZoomOut}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors cursor-pointer"
              title="Kichraytirish"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] text-zinc-400 px-1 font-mono">
              {Math.round(zoom)}px/s
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors cursor-pointer"
              title="Kattalashtirish"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={handleZoomFit}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors cursor-pointer ml-0.5"
              title="Ekranga sig‘dirish"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Track Canvas & Lanes */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers (Left sidebar) */}
        <div className="w-24 md:w-32 bg-zinc-900/90 border-r border-zinc-800 shrink-0 flex flex-col text-[11px] font-medium text-zinc-400">
          <div className="h-6 border-b border-zinc-800 px-2 flex items-center text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
            Vaqt
          </div>
          <div className="h-10 border-b border-zinc-800/60 px-2 flex items-center gap-1.5 bg-zinc-900/40">
            <Type className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Matn / FX</span>
          </div>
          <div className="h-16 border-b border-zinc-800/60 px-2 flex items-center gap-1.5 bg-zinc-900/60">
            <Video className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <span className="truncate">Video</span>
          </div>
          <div className="h-12 border-b border-zinc-800/60 px-2 flex items-center gap-1.5 bg-zinc-900/40">
            <Music className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">Audio</span>
          </div>
        </div>

        {/* Scrollable Tracks Area */}
        <div
          ref={timelineContainerRef}
          onMouseDown={handleTimelineMouseDown}
          className="flex-1 overflow-x-auto overflow-y-hidden relative bg-zinc-950/80 cursor-pointer"
        >
          <div
            className="relative min-w-full h-full"
            style={{ width: `${Math.max(1200, (totalDuration + 5) * zoom)}px` }}
          >
            {/* 1. Ruler Header */}
            <div className="h-6 border-b border-zinc-800 bg-zinc-900/70 relative">
              {rulerMarks.map((sec) => (
                <div
                  key={sec}
                  className="absolute top-0 bottom-0 border-l border-zinc-700/50 pl-1 text-[9px] font-mono text-zinc-400 pointer-events-none"
                  style={{ left: `${sec * zoom}px` }}
                >
                  {formatSec(sec)}
                </div>
              ))}
            </div>

            {/* 2. Text Overlays Lane */}
            <div className="h-10 border-b border-zinc-800/40 relative bg-zinc-950/40">
              {textOverlays.map((txt) => {
                const left = txt.startTime * zoom;
                const width = Math.max(20, txt.duration * zoom);
                const isSelected = selectedOverlayId === txt.id;

                return (
                  <div
                    key={txt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOverlayId(txt.id);
                      setSelectedClipId(null);
                      setSelectedAudioId(null);
                    }}
                    className={`absolute top-1 bottom-1 rounded-md px-2 flex items-center justify-between text-[11px] truncate cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-amber-600/30 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400'
                        : 'bg-amber-950/40 border-amber-800/60 text-amber-300/90 hover:bg-amber-900/50'
                    }`}
                    style={{ left: `${left}px`, width: `${width}px` }}
                  >
                    <span className="truncate flex items-center gap-1 font-semibold">
                      <Type className="w-3 h-3 shrink-0" />
                      {txt.text || 'Matn'}
                    </span>
                    <span className="text-[9px] font-mono opacity-70 ml-1">
                      {txt.duration}s
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 3. Main Video Clips Lane */}
            <div className="h-16 border-b border-zinc-800/40 relative bg-zinc-950/80 flex items-center">
              {positions.map((pos, idx) => {
                const left = pos.startTime * zoom;
                const width = Math.max(30, pos.clip.duration * zoom);
                const isSelected = selectedClipId === pos.clip.id;

                return (
                  <div
                    key={pos.clip.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClipId(pos.clip.id);
                      setSelectedAudioId(null);
                      setSelectedOverlayId(null);
                      seekTo(pos.startTime);
                    }}
                    className={`group absolute top-1 bottom-1 rounded-lg overflow-hidden flex flex-col justify-between border cursor-pointer select-none transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-violet-900/60 to-indigo-900/60 border-violet-400 ring-2 ring-violet-500/50 shadow-lg shadow-violet-950'
                        : 'bg-zinc-800/80 border-zinc-700/80 hover:bg-zinc-750 hover:border-zinc-600'
                    }`}
                    style={{ left: `${left}px`, width: `${width}px` }}
                  >
                    {/* Left Trim Handle */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setTrimmingClip({
                          id: pos.clip.id,
                          edge: 'start',
                          initialX: e.clientX,
                          initialOffset: pos.clip.startOffset,
                          initialDuration: pos.clip.duration,
                        });
                      }}
                      className="absolute left-0 top-0 bottom-0 w-2.5 bg-violet-500/30 hover:bg-violet-400 group-hover:w-3 cursor-ew-resize z-10 transition-all flex items-center justify-center"
                      title="Boshlanishini kesish (Trim Start)"
                    >
                      <div className="w-0.5 h-5 bg-white/70 rounded-full" />
                    </div>

                    {/* Clip Details Bar */}
                    <div className="px-3 pt-1 flex items-center justify-between text-xs text-zinc-100 z-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-4 h-4 rounded bg-violet-600/40 text-violet-300 text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-[11px] truncate">
                          {pos.clip.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {pos.clip.speed !== 1.0 && (
                          <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-mono">
                            {pos.clip.speed}x
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-zinc-400">
                          {pos.clip.duration.toFixed(1)}s
                        </span>
                      </div>
                    </div>

                    {/* Reorder Buttons & Bottom Waveform Vibe */}
                    <div className="px-3 pb-1 flex items-center justify-between z-0">
                      <div className="flex items-center gap-1">
                        {idx > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              reorderClips(idx, idx - 1);
                            }}
                            className="p-0.5 rounded bg-zinc-900/60 hover:bg-zinc-700 text-zinc-300"
                            title={t.moveLeft}
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                        )}
                        {idx < positions.length - 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              reorderClips(idx, idx + 1);
                            }}
                            className="p-0.5 rounded bg-zinc-900/60 hover:bg-zinc-700 text-zinc-300"
                            title={t.moveRight}
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {pos.clip.transition !== 'none' && (
                        <span className="text-[9px] px-1 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-semibold">
                          FX: {pos.clip.transition}
                        </span>
                      )}
                    </div>

                    {/* Right Trim Handle */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setTrimmingClip({
                          id: pos.clip.id,
                          edge: 'end',
                          initialX: e.clientX,
                          initialOffset: pos.clip.startOffset,
                          initialDuration: pos.clip.duration,
                        });
                      }}
                      className="absolute right-0 top-0 bottom-0 w-2.5 bg-violet-500/30 hover:bg-violet-400 group-hover:w-3 cursor-ew-resize z-10 transition-all flex items-center justify-center"
                      title="Tugashini kesish (Trim End)"
                    >
                      <div className="w-0.5 h-5 bg-white/70 rounded-full" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 4. Audio Clips Lane */}
            <div className="h-12 border-b border-zinc-800/40 relative bg-zinc-950/60 flex items-center">
              {audioClips.map((ac) => {
                const left = ac.startTime * zoom;
                const width = Math.max(25, ac.duration * zoom);
                const isSelected = selectedAudioId === ac.id;

                return (
                  <div
                    key={ac.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAudioId(ac.id);
                      setSelectedClipId(null);
                      setSelectedOverlayId(null);
                    }}
                    className={`absolute top-1 bottom-1 rounded-md px-2 flex items-center justify-between text-[11px] truncate cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-cyan-900/40 border-cyan-400 text-cyan-100 shadow-md ring-1 ring-cyan-400'
                        : 'bg-cyan-950/50 border-cyan-800/60 text-cyan-300/90 hover:bg-cyan-900/50'
                    }`}
                    style={{ left: `${left}px`, width: `${width}px` }}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {ac.isVoiceover ? (
                        <Mic className="w-3 h-3 text-rose-400 shrink-0" />
                      ) : (
                        <Music className="w-3 h-3 text-cyan-400 shrink-0" />
                      )}
                      <span className="font-medium truncate">{ac.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 font-mono text-[9px] text-cyan-300/80">
                      <span>{Math.round(ac.volume * 100)}%</span>
                      <span>•</span>
                      <span>{ac.duration.toFixed(1)}s</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 5. Master Playhead Needle */}
            <div
              className="absolute top-0 bottom-0 z-20 pointer-events-none flex flex-col items-center"
              style={{ left: `${currentTime * zoom}px` }}
            >
              {/* Playhead Triangle Head */}
              <div className="w-3 h-3 bg-rose-500 rotate-45 -mt-1 shadow-md shadow-rose-500/50" />
              {/* Vertical Laser Line */}
              <div className="w-[1.5px] flex-1 bg-gradient-to-b from-rose-500 via-rose-500 to-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
