import React from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Eye,
  Plus,
  Sparkles,
  Trash2,
  Type,
} from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { TextOverlay } from '../../types/editor';

export const TextTool: React.FC = () => {
  const {
    textOverlays,
    addTextOverlay,
    updateTextOverlay,
    deleteTextOverlay,
    selectedOverlayId,
    setSelectedOverlayId,
    selectedOverlay,
    currentTime,
    t,
  } = useEditor();

  const fontOptions = [
    { label: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans, sans-serif' },
    { label: 'JetBrains Mono', value: 'JetBrains Mono, monospace' },
    { label: 'Impact Classic', value: 'Impact, sans-serif' },
    { label: 'Cinematic Serif', value: 'Georgia, serif' },
  ];

  const colorPresets = [
    '#ffffff',
    '#ffea00',
    '#f43f5e',
    '#a855f7',
    '#06b6d4',
    '#10b981',
    '#000000',
  ];

  const bgPresets = [
    'transparent',
    'rgba(0, 0, 0, 0.75)',
    'rgba(15, 23, 42, 0.85)',
    'rgba(124, 58, 237, 0.8)',
    'rgba(225, 29, 72, 0.8)',
    'rgba(255, 255, 255, 0.9)',
  ];

  return (
    <div className="p-4 space-y-5 text-xs text-zinc-200">
      {/* Add New Text Button */}
      <button
        onClick={() => addTextOverlay({ startTime: currentTime, duration: 4 })}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-bold transition-all shadow-md shadow-amber-600/30 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>{t.addTextBtn}</span>
      </button>

      {/* Selected Text Layer Editor */}
      {selectedOverlay ? (
        <div className="space-y-4 pt-2 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-300">Matn sozlamalari</span>
            <button
              onClick={() => deleteTextOverlay(selectedOverlay.id)}
              className="p-1 text-zinc-400 hover:text-rose-400 cursor-pointer"
              title="O‘chirish"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Text Input */}
          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400">{t.textContent}</label>
            <textarea
              rows={2}
              value={selectedOverlay.text}
              onChange={(e) => updateTextOverlay(selectedOverlay.id, { text: e.target.value })}
              className="w-full p-2 rounded-md bg-zinc-850 border border-zinc-700 text-zinc-100 outline-none focus:border-amber-500 transition-colors resize-none"
              placeholder="Matn kiriting..."
            />
          </div>

          {/* Font Family & Size */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400">{t.fontFamily}</label>
              <select
                value={selectedOverlay.fontFamily}
                onChange={(e) =>
                  updateTextOverlay(selectedOverlay.id, { fontFamily: e.target.value })
                }
                className="w-full p-1.5 rounded-md bg-zinc-850 border border-zinc-700 text-zinc-100 outline-none text-xs"
              >
                {fontOptions.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400 flex justify-between">
                <span>{t.fontSize}</span>
                <span className="font-mono text-amber-400">{selectedOverlay.fontSize}px</span>
              </label>
              <input
                type="range"
                min="16"
                max="80"
                value={selectedOverlay.fontSize}
                onChange={(e) =>
                  updateTextOverlay(selectedOverlay.id, {
                    fontSize: parseInt(e.target.value),
                  })
                }
                className="w-full accent-amber-500 cursor-pointer mt-1"
              />
            </div>
          </div>

          {/* Alignment & Style Buttons */}
          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={() => updateTextOverlay(selectedOverlay.id, { align: 'left' })}
              className={`p-1.5 rounded border transition-colors cursor-pointer ${
                selectedOverlay.align === 'left'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-zinc-850 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
              title="Chapdan tekislash"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => updateTextOverlay(selectedOverlay.id, { align: 'center' })}
              className={`p-1.5 rounded border transition-colors cursor-pointer ${
                selectedOverlay.align === 'center'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-zinc-850 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
              title="Markazdan tekislash"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => updateTextOverlay(selectedOverlay.id, { align: 'right' })}
              className={`p-1.5 rounded border transition-colors cursor-pointer ${
                selectedOverlay.align === 'right'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-zinc-850 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
              title="O‘ngdan tekislash"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() =>
                updateTextOverlay(selectedOverlay.id, {
                  fontWeight: selectedOverlay.fontWeight === 'bold' ? 'normal' : 'bold',
                })
              }
              className={`p-1.5 rounded border transition-colors cursor-pointer ml-2 ${
                selectedOverlay.fontWeight === 'bold'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-zinc-850 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
              title="Qalin shrift"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() =>
                updateTextOverlay(selectedOverlay.id, {
                  hasShadow: !selectedOverlay.hasShadow,
                })
              }
              className={`p-1.5 rounded border transition-colors cursor-pointer ${
                selectedOverlay.hasShadow
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-zinc-850 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
              title="Soya (Shadow)"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Colors */}
          <div className="space-y-2">
            <label className="text-[11px] text-zinc-400">{t.textColor}</label>
            <div className="flex items-center gap-1.5">
              {colorPresets.map((c) => (
                <button
                  key={c}
                  onClick={() => updateTextOverlay(selectedOverlay.id, { color: c })}
                  className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                    selectedOverlay.color === c ? 'scale-125 border-white ring-2 ring-amber-400' : 'border-zinc-700'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={selectedOverlay.color}
                onChange={(e) =>
                  updateTextOverlay(selectedOverlay.id, { color: e.target.value })
                }
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
              />
            </div>
          </div>

          {/* Background Pill Color */}
          <div className="space-y-2">
            <label className="text-[11px] text-zinc-400">{t.bgColor}</label>
            <div className="flex items-center gap-1.5">
              {bgPresets.map((bg) => (
                <button
                  key={bg}
                  onClick={() => updateTextOverlay(selectedOverlay.id, { bgColor: bg })}
                  className={`w-5 h-5 rounded-md border text-[8px] flex items-center justify-center font-bold transition-all cursor-pointer ${
                    selectedOverlay.bgColor === bg ? 'scale-110 border-white ring-2 ring-amber-400' : 'border-zinc-700'
                  }`}
                  style={{ backgroundColor: bg === 'transparent' ? '#334155' : bg }}
                >
                  {bg === 'transparent' ? '✕' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Animation */}
          <div className="space-y-1 pt-1">
            <label className="text-[11px] text-zinc-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{t.textAnimation}</span>
            </label>
            <div className="grid grid-cols-4 gap-1">
              {(['none', 'fadeIn', 'pop', 'slideUp'] as const).map((anim) => (
                <button
                  key={anim}
                  onClick={() => updateTextOverlay(selectedOverlay.id, { animation: anim })}
                  className={`py-1 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                    selectedOverlay.animation === anim
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-zinc-850 border-zinc-750 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {anim === 'none'
                    ? 'Oddiy'
                    : anim === 'fadeIn'
                    ? 'Fade'
                    : anim === 'pop'
                    ? 'Pop'
                    : 'Slide'}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Preset Positions */}
          <div className="space-y-1 pt-1">
            <label className="text-[11px] text-zinc-400">Tezkor joylashuv</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => updateTextOverlay(selectedOverlay.id, { y: 15 })}
                className="py-1 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] cursor-pointer"
              >
                Yuqorida
              </button>
              <button
                onClick={() => updateTextOverlay(selectedOverlay.id, { y: 50 })}
                className="py-1 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] cursor-pointer"
              >
                Markazda
              </button>
              <button
                onClick={() => updateTextOverlay(selectedOverlay.id, { y: 85 })}
                className="py-1 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] cursor-pointer"
              >
                Subtitr (Pastda)
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="font-semibold text-zinc-400">Mavjud matn qatlamlari:</div>
          {textOverlays.length === 0 ? (
            <p className="text-[11px] text-zinc-500">Hozircha hech qanday matn qo‘shilmagan.</p>
          ) : (
            <div className="space-y-1.5">
              {textOverlays.map((tItem) => (
                <button
                  key={tItem.id}
                  onClick={() => setSelectedOverlayId(tItem.id)}
                  className="w-full p-2.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 flex items-center justify-between text-left cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Type className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-medium text-zinc-200 truncate">{tItem.text}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">{tItem.duration}s</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
