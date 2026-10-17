import React, { useRef } from 'react';
import { Image as ImageIcon, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { ImageWatermark } from '../../types/editor';

// Helper to generate crisp canvas stickers/badges as data URLs
function generateBadgeDataUrl(type: 'rec' | '4k' | 'live' | 'verified'): string {
  const c = document.createElement('canvas');
  c.width = 240;
  c.height = 70;
  const ctx = c.getContext('2d')!;

  if (type === 'rec') {
    // Red REC badge with pulsating circle
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.roundRect(5, 5, 230, 60, 12);
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(38, 35, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 30px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('REC', 65, 45);
  } else if (type === '4k') {
    // Gold 4K UHD badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.roundRect(5, 5, 230, 60, 12);
    ctx.fill();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '900 32px sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.fillText('4K', 25, 45);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('ULTRA HD', 75, 43);
  } else if (type === 'live') {
    // Red LIVE badge
    ctx.fillStyle = '#dc2626';
    ctx.roundRect(5, 5, 230, 60, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(40, 35, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('LIVE STREAM', 65, 46);
  } else {
    // Cyan Verified badge
    ctx.fillStyle = 'rgba(2, 132, 199, 0.9)';
    ctx.roundRect(5, 5, 230, 60, 12);
    ctx.fill();

    ctx.font = 'bold 26px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('✓ VERIFIED', 40, 44);
  }

  return c.toDataURL('image/png');
}

export const OverlaysTool: React.FC = () => {
  const {
    watermarks,
    addWatermark,
    updateWatermark,
    deleteWatermark,
    selectedWatermarkId,
    setSelectedWatermarkId,
    selectedWatermark,
    totalDuration,
    t,
  } = useEditor();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        addWatermark({
          src: ev.target.result as string,
          name: file.name.replace(/\.[^/.]+$/, ''),
          startTime: 0,
          duration: Math.max(10, totalDuration),
        });
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddPresetBadge = (type: 'rec' | '4k' | 'live' | 'verified') => {
    const dataUrl = generateBadgeDataUrl(type);
    const names = {
      rec: 'REC Red Badge',
      '4k': '4K UHD Gold Badge',
      live: 'LIVE Stream Badge',
      verified: 'Verified Creator Badge',
    };
    addWatermark({
      src: dataUrl,
      name: names[type],
      startTime: 0,
      duration: Math.max(10, totalDuration),
      scale: 0.6,
    });
  };

  return (
    <div className="p-4 space-y-5 text-xs text-zinc-200">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
      />

      {/* Upload Logo Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-indigo-300 border border-indigo-700/60 font-semibold transition-all cursor-pointer shadow-md"
      >
        <ImageIcon className="w-4 h-4 text-indigo-400" />
        <span>{t.addLogoBtn}</span>
      </button>

      {/* Preset Broadcast Badges */}
      <div className="space-y-2">
        <div className="font-semibold text-zinc-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.presetBadges}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleAddPresetBadge('rec')}
            className="p-2 rounded-lg bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-left flex items-center gap-2 cursor-pointer transition-colors"
          >
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-bold text-rose-300">REC</span>
          </button>
          <button
            onClick={() => handleAddPresetBadge('4k')}
            className="p-2 rounded-lg bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-left flex items-center gap-2 cursor-pointer transition-colors"
          >
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="font-bold text-yellow-300">4K UHD</span>
          </button>
          <button
            onClick={() => handleAddPresetBadge('live')}
            className="p-2 rounded-lg bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-left flex items-center gap-2 cursor-pointer transition-colors"
          >
            <span className="w-3 h-3 rounded-full bg-red-600" />
            <span className="font-bold text-red-400">LIVE</span>
          </button>
          <button
            onClick={() => handleAddPresetBadge('verified')}
            className="p-2 rounded-lg bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-left flex items-center gap-2 cursor-pointer transition-colors"
          >
            <span className="text-cyan-400 font-bold">✓</span>
            <span className="font-bold text-cyan-300">Verified</span>
          </button>
        </div>
      </div>

      {/* Selected Watermark Settings */}
      {selectedWatermark ? (
        <div className="space-y-4 pt-3 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-200 truncate">{selectedWatermark.name}</span>
            <button
              onClick={() => deleteWatermark(selectedWatermark.id)}
              className="p-1 text-zinc-400 hover:text-rose-400 cursor-pointer"
              title="O‘chirish"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scale Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-zinc-300 text-[11px]">
              <span>{t.scale}</span>
              <span className="font-mono text-indigo-400">
                {Math.round(selectedWatermark.scale * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.0"
              step="0.05"
              value={selectedWatermark.scale}
              onChange={(e) =>
                updateWatermark(selectedWatermark.id, {
                  scale: parseFloat(e.target.value),
                })
              }
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Opacity Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-zinc-300 text-[11px]">
              <span>{t.opacity}</span>
              <span className="font-mono text-indigo-400">
                {Math.round(selectedWatermark.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={selectedWatermark.opacity}
              onChange={(e) =>
                updateWatermark(selectedWatermark.id, {
                  opacity: parseFloat(e.target.value),
                })
              }
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Quick Corner Presets */}
          <div className="space-y-1">
            <div className="text-zinc-400 text-[11px]">{t.position}</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => updateWatermark(selectedWatermark.id, { x: 12, y: 12 })}
                className="py-1 rounded bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] cursor-pointer"
              >
                Tepada Chapda
              </button>
              <button
                onClick={() => updateWatermark(selectedWatermark.id, { x: 88, y: 12 })}
                className="py-1 rounded bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] cursor-pointer"
              >
                Tepada O‘ngda
              </button>
              <button
                onClick={() => updateWatermark(selectedWatermark.id, { x: 12, y: 88 })}
                className="py-1 rounded bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] cursor-pointer"
              >
                Pastda Chapda
              </button>
              <button
                onClick={() => updateWatermark(selectedWatermark.id, { x: 88, y: 88 })}
                className="py-1 rounded bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] cursor-pointer"
              >
                Pastda O‘ngda
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="font-semibold text-zinc-400">Mavjud suv belgilari:</div>
          {watermarks.length === 0 ? (
            <p className="text-[11px] text-zinc-500">Hozircha hech qanday logo qo‘shilmagan.</p>
          ) : (
            <div className="space-y-1.5">
              {watermarks.map((wm) => (
                <button
                  key={wm.id}
                  onClick={() => setSelectedWatermarkId(wm.id)}
                  className="w-full p-2.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 flex items-center justify-between text-left cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2 truncate">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="font-medium text-zinc-200 truncate">{wm.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {Math.round(wm.opacity * 100)}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
