import React from 'react';
import { ArrowRight, Layers, Sparkles } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { ClipTransition } from '../../types/editor';

export const TransitionsTool: React.FC = () => {
  const { selectedClip, updateClip, t } = useEditor();

  if (!selectedClip) {
    return (
      <div className="p-6 text-center text-zinc-500 text-xs flex flex-col items-center justify-center h-full">
        <Layers className="w-8 h-8 text-zinc-600 mb-2" />
        <p className="font-semibold text-zinc-400">{t.noClipSelected}</p>
        <p className="text-[11px] mt-1 text-zinc-500">{t.selectClipHint}</p>
      </div>
    );
  }

  const transitionOptions: {
    type: ClipTransition;
    label: string;
    desc: string;
    icon: string;
  }[] = [
    {
      type: 'none',
      label: t.transNone,
      desc: 'Standart to‘g‘ridan-to‘g‘ri kesish',
      icon: '✂️',
    },
    {
      type: 'fade',
      label: t.transFade,
      desc: 'Yumshoq erish (Crossfade)',
      icon: '✨',
    },
    {
      type: 'dip-black',
      label: t.transDipBlack,
      desc: 'Qorayish orqali yangi kadrga o‘tish',
      icon: '🌑',
    },
    {
      type: 'wipe-left',
      label: t.transWipeLeft,
      desc: 'Kadrning chapga surilish effekti',
      icon: '⬅️',
    },
    {
      type: 'zoom-in',
      label: t.transZoomIn,
      desc: 'Yaqinlashish orqali dinamik o‘tish',
      icon: '🔍',
    },
  ];

  return (
    <div className="p-4 space-y-5 text-xs text-zinc-200">
      <div className="space-y-1">
        <div className="font-bold text-zinc-100 flex items-center gap-1.5 text-sm">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span>{t.transitionsTitle}</span>
        </div>
        <p className="text-[11px] text-zinc-400">
          Ushbu klip tugashi va keyingi klip boshlanishi oralig‘idagi vizual o‘tish effekti.
        </p>
      </div>

      {/* Transition Type Cards */}
      <div className="space-y-2">
        {transitionOptions.map((opt) => (
          <button
            key={opt.type}
            onClick={() => updateClip(selectedClip.id, { transition: opt.type })}
            className={`w-full p-3 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all ${
              selectedClip.transition === opt.type
                ? 'bg-violet-600/30 border-violet-500 text-white shadow-md ring-1 ring-violet-500/50'
                : 'bg-zinc-850 hover:bg-zinc-800 border-zinc-750 text-zinc-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{opt.icon}</span>
              <div>
                <div className="font-semibold text-zinc-100">{opt.label}</div>
                <div className="text-[10px] text-zinc-400">{opt.desc}</div>
              </div>
            </div>
            {selectedClip.transition === opt.type && (
              <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
            )}
          </button>
        ))}
      </div>

      {/* Duration Slider if not none */}
      {selectedClip.transition !== 'none' && (
        <div className="space-y-2 pt-3 border-t border-zinc-800">
          <div className="flex justify-between text-zinc-300">
            <span>O‘tish davomiyligi</span>
            <span className="font-mono text-violet-400">
              {selectedClip.transitionDuration || 0.5}s
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.5"
            step="0.1"
            value={selectedClip.transitionDuration || 0.5}
            onChange={(e) =>
              updateClip(selectedClip.id, {
                transitionDuration: parseFloat(e.target.value),
              })
            }
            className="w-full accent-violet-500 cursor-pointer"
          />
        </div>
      )}
    </div>
  );
};
