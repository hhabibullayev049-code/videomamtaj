import React from 'react';
import { Copy, FastForward, Play, Scissors, Trash2 } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

export const TrimTool: React.FC = () => {
  const {
    selectedClip,
    updateClip,
    deleteClip,
    duplicateClip,
    splitClipAtPlayhead,
    currentTime,
    seekTo,
    t,
  } = useEditor();

  if (!selectedClip) {
    return (
      <div className="p-6 text-center text-zinc-500 text-xs flex flex-col items-center justify-center h-full">
        <Scissors className="w-8 h-8 text-zinc-600 mb-2" />
        <p className="font-semibold text-zinc-400">{t.noClipSelected}</p>
        <p className="text-[11px] mt-1 text-zinc-500">{t.selectClipHint}</p>
      </div>
    );
  }

  const speedOptions = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div className="p-4 space-y-5 text-xs text-zinc-200">
      {/* Clip Header Info */}
      <div className="bg-zinc-800/60 p-3 rounded-lg border border-zinc-700/60 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-bold text-zinc-100 truncate text-sm">{selectedClip.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-600/30 text-violet-300 font-mono">
            {selectedClip.duration.toFixed(2)}s
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span>Asl video davomiyligi:</span>
          <span className="font-mono">{selectedClip.sourceDuration.toFixed(2)}s</span>
        </div>
      </div>

      {/* Trimming In/Out Sliders */}
      <div className="space-y-3">
        <div className="font-semibold text-zinc-300 flex items-center justify-between">
          <span>{t.startTrim} (In Point)</span>
          <span className="font-mono text-violet-400">{selectedClip.startOffset.toFixed(2)}s</span>
        </div>
        <input
          type="range"
          min="0"
          max={Math.max(0, selectedClip.sourceDuration - 0.5)}
          step="0.1"
          value={selectedClip.startOffset}
          onChange={(e) =>
            updateClip(selectedClip.id, {
              startOffset: parseFloat(e.target.value),
            })
          }
          className="w-full accent-violet-500 cursor-pointer"
        />

        <div className="font-semibold text-zinc-300 flex items-center justify-between pt-2">
          <span>{t.clipDuration} (Out Point)</span>
          <span className="font-mono text-violet-400">{selectedClip.duration.toFixed(2)}s</span>
        </div>
        <input
          type="range"
          min="0.5"
          max={Math.max(0.5, selectedClip.sourceDuration - selectedClip.startOffset)}
          step="0.1"
          value={selectedClip.duration}
          onChange={(e) =>
            updateClip(selectedClip.id, {
              duration: parseFloat(e.target.value),
            })
          }
          className="w-full accent-violet-500 cursor-pointer"
        />
      </div>

      {/* Speed Adjustment */}
      <div className="space-y-2 pt-2 border-t border-zinc-800">
        <div className="font-semibold text-zinc-300 flex items-center gap-1.5">
          <FastForward className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.speed}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {speedOptions.map((spd) => (
            <button
              key={spd}
              onClick={() => updateClip(selectedClip.id, { speed: spd })}
              className={`py-1.5 rounded-md text-center font-mono text-[11px] font-semibold transition-colors cursor-pointer border ${
                selectedClip.speed === spd
                  ? 'bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-600/30'
                  : 'bg-zinc-800 border-zinc-700/80 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Quick Cut & Split Actions */}
      <div className="space-y-2 pt-2 border-t border-zinc-800">
        <div className="font-semibold text-zinc-300">Tezkor montaj amallari</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => splitClipAtPlayhead(selectedClip.id)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-violet-300 border border-violet-500/30 font-semibold cursor-pointer transition-colors"
          >
            <Scissors className="w-3.5 h-3.5 text-violet-400" />
            <span>2 ga bo‘lish</span>
          </button>
          <button
            onClick={() => duplicateClip(selectedClip.id)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-indigo-300 border border-indigo-500/30 font-semibold cursor-pointer transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-indigo-400" />
            <span>Nusxa olish</span>
          </button>
        </div>

        <button
          onClick={() => deleteClip(selectedClip.id)}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 font-semibold cursor-pointer transition-colors mt-2"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Klipni o‘chirish</span>
        </button>
      </div>
    </div>
  );
};
