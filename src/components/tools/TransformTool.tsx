import React from 'react';
import { FlipHorizontal, FlipVertical, RotateCw, Scan, Tv } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { AspectRatio } from '../../types/editor';

export const TransformTool: React.FC = () => {
  const {
    selectedClip,
    updateClip,
    aspectRatio,
    setAspectRatio,
    t,
  } = useEditor();

  const aspectOptions: { label: string; value: AspectRatio; desc: string }[] = [
    { label: '16:9', value: '16:9', desc: 'YouTube, TV & Gorizontal' },
    { label: '9:16', value: '9:16', desc: 'TikTok, Reels, Shorts' },
    { label: '1:1', value: '1:1', desc: 'Instagram kvadrat post' },
    { label: '4:5', value: '4:5', desc: 'Portret ijtimoiy tarmoq' },
    { label: '21:9', value: '21:9', desc: 'Kinematik Ultra-keng' },
  ];

  return (
    <div className="p-4 space-y-5 text-xs text-zinc-200">
      {/* Master Canvas Aspect Ratio */}
      <div className="space-y-2">
        <div className="font-semibold text-zinc-300 flex items-center gap-1.5">
          <Tv className="w-3.5 h-3.5 text-violet-400" />
          <span>Kadr formati (Aspect Ratio)</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {aspectOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setAspectRatio(opt.value)}
              className={`p-2.5 rounded-lg flex items-center justify-between text-left transition-all cursor-pointer border ${
                aspectRatio === opt.value
                  ? 'bg-violet-600/30 border-violet-500 text-white shadow-md ring-1 ring-violet-500/50'
                  : 'bg-zinc-800/70 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <div>
                <div className="font-bold font-mono text-zinc-100">{opt.label}</div>
                <div className="text-[11px] text-zinc-400">{opt.desc}</div>
              </div>
              {aspectRatio === opt.value && (
                <span className="w-2 h-2 rounded-full bg-violet-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Clip Transform */}
      {selectedClip ? (
        <div className="space-y-4 pt-3 border-t border-zinc-800">
          <div className="font-semibold text-zinc-300">Tanlangan klipni burish va akslantirish</div>

          {/* Rotation */}
          <div className="space-y-2">
            <div className="text-zinc-400 flex items-center justify-between">
              <span>{t.rotation}</span>
              <span className="font-mono text-violet-400">{selectedClip.rotation}°</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[0, 90, 180, 270].map((deg) => (
                <button
                  key={deg}
                  onClick={() => updateClip(selectedClip.id, { rotation: deg })}
                  className={`py-1.5 rounded-md font-mono text-[11px] font-semibold border transition-colors cursor-pointer ${
                    selectedClip.rotation === deg
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>

          {/* Flips */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => updateClip(selectedClip.id, { flipH: !selectedClip.flipH })}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                selectedClip.flipH
                  ? 'bg-violet-600/30 border-violet-500 text-violet-200'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
              }`}
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>{t.flipHorizontal}</span>
            </button>

            <button
              onClick={() => updateClip(selectedClip.id, { flipV: !selectedClip.flipV })}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                selectedClip.flipV
                  ? 'bg-violet-600/30 border-violet-500 text-violet-200'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
              }`}
            >
              <FlipVertical className="w-3.5 h-3.5" />
              <span>{t.flipVertical}</span>
            </button>
          </div>

          {/* Fit Mode: Contain vs Cover */}
          <div className="space-y-2 pt-2">
            <div className="text-zinc-400">{t.fitMode}</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateClip(selectedClip.id, { fitMode: 'contain' })}
                className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                  selectedClip.fitMode === 'contain'
                    ? 'bg-violet-600/30 border-violet-500 text-violet-200'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750'
                }`}
              >
                <div className="font-semibold text-zinc-200">Contain</div>
                <div className="text-[10px] text-zinc-400">To‘liq sig‘dirish</div>
              </button>
              <button
                onClick={() => updateClip(selectedClip.id, { fitMode: 'cover' })}
                className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                  selectedClip.fitMode === 'cover'
                    ? 'bg-violet-600/30 border-violet-500 text-violet-200'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750'
                }`}
              >
                <div className="font-semibold text-zinc-200">Cover</div>
                <div className="text-[10px] text-zinc-400">Kadrni to‘ldirish</div>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-zinc-800/40 rounded-lg text-center text-zinc-500">
          Klipni burish va akslantirish uchun avval klipni tanlang
        </div>
      )}
    </div>
  );
};
