import React from 'react';
import { Palette, RotateCcw, Sliders } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { VideoFilters } from '../../types/editor';

export const FiltersTool: React.FC = () => {
  const { selectedClip, updateClip, t } = useEditor();

  if (!selectedClip) {
    return (
      <div className="p-6 text-center text-zinc-500 text-xs flex flex-col items-center justify-center h-full">
        <Palette className="w-8 h-8 text-zinc-600 mb-2" />
        <p className="font-semibold text-zinc-400">{t.noClipSelected}</p>
        <p className="text-[11px] mt-1 text-zinc-500">{t.selectClipHint}</p>
      </div>
    );
  }

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

  const presetFilters: { name: string; filters: VideoFilters; colorTag: string }[] = [
    {
      name: t.filterNone,
      colorTag: '#64748b',
      filters: { ...defaultFilters },
    },
    {
      name: t.filterCinematic,
      colorTag: '#0ea5e9',
      filters: {
        brightness: 105,
        contrast: 125,
        saturation: 115,
        hueRotate: 350,
        sepia: 15,
        grayscale: 0,
        invert: 0,
        blur: 0,
      },
    },
    {
      name: t.filterVintage,
      colorTag: '#d97706',
      filters: {
        brightness: 110,
        contrast: 95,
        saturation: 80,
        hueRotate: 15,
        sepia: 40,
        grayscale: 0,
        invert: 0,
        blur: 0,
      },
    },
    {
      name: t.filterNoir,
      colorTag: '#18181b',
      filters: {
        brightness: 95,
        contrast: 140,
        saturation: 0,
        hueRotate: 0,
        sepia: 0,
        grayscale: 100,
        invert: 0,
        blur: 0,
      },
    },
    {
      name: t.filterCyberpunk,
      colorTag: '#ec4899',
      filters: {
        brightness: 115,
        contrast: 130,
        saturation: 160,
        hueRotate: 290,
        sepia: 0,
        grayscale: 0,
        invert: 0,
        blur: 0,
      },
    },
    {
      name: t.filterSunset,
      colorTag: '#f97316',
      filters: {
        brightness: 105,
        contrast: 115,
        saturation: 130,
        hueRotate: 25,
        sepia: 25,
        grayscale: 0,
        invert: 0,
        blur: 0,
      },
    },
    {
      name: t.filterEmerald,
      colorTag: '#10b981',
      filters: {
        brightness: 100,
        contrast: 110,
        saturation: 120,
        hueRotate: 150,
        sepia: 10,
        grayscale: 0,
        invert: 0,
        blur: 0,
      },
    },
    {
      name: t.filterDramatic,
      colorTag: '#8b5cf6',
      filters: {
        brightness: 90,
        contrast: 150,
        saturation: 90,
        hueRotate: 0,
        sepia: 0,
        grayscale: 0,
        invert: 0,
        blur: 0,
      },
    },
  ];

  const currentFilters = selectedClip.filters;

  const updateFilterField = (field: keyof VideoFilters, value: number) => {
    updateClip(selectedClip.id, {
      filters: {
        ...currentFilters,
        [field]: value,
      },
    });
  };

  return (
    <div className="p-4 space-y-5 text-xs text-zinc-200">
      {/* Header and Reset */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-zinc-100 flex items-center gap-1.5 text-sm">
          <Sliders className="w-4 h-4 text-violet-400" />
          <span>{t.filtersTitle}</span>
        </span>
        <button
          onClick={() => updateClip(selectedClip.id, { filters: { ...defaultFilters } })}
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Tiklash</span>
        </button>
      </div>

      {/* Preset Filters Grid */}
      <div className="space-y-2">
        <div className="font-semibold text-zinc-400">{t.filterPresets}</div>
        <div className="grid grid-cols-2 gap-2">
          {presetFilters.map((p) => (
            <button
              key={p.name}
              onClick={() => updateClip(selectedClip.id, { filters: p.filters })}
              className="p-2.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/60 flex items-center gap-2 text-left cursor-pointer transition-all hover:scale-[1.02]"
            >
              <div
                className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                style={{ backgroundColor: p.colorTag }}
              />
              <span className="font-medium text-zinc-200 truncate">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Manual Fine-tuning Sliders */}
      <div className="space-y-3 pt-3 border-t border-zinc-800">
        <div className="font-semibold text-zinc-400">Aniq sozlash (Fine-tune)</div>

        {/* Brightness */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-zinc-300">
            <span>{t.brightness}</span>
            <span className="font-mono text-violet-400">{currentFilters.brightness}%</span>
          </div>
          <input
            type="range"
            min="40"
            max="180"
            value={currentFilters.brightness}
            onChange={(e) => updateFilterField('brightness', parseInt(e.target.value))}
            className="w-full accent-violet-500 cursor-pointer"
          />
        </div>

        {/* Contrast */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-zinc-300">
            <span>{t.contrast}</span>
            <span className="font-mono text-violet-400">{currentFilters.contrast}%</span>
          </div>
          <input
            type="range"
            min="40"
            max="180"
            value={currentFilters.contrast}
            onChange={(e) => updateFilterField('contrast', parseInt(e.target.value))}
            className="w-full accent-violet-500 cursor-pointer"
          />
        </div>

        {/* Saturation */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-zinc-300">
            <span>{t.saturation}</span>
            <span className="font-mono text-violet-400">{currentFilters.saturation}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={currentFilters.saturation}
            onChange={(e) => updateFilterField('saturation', parseInt(e.target.value))}
            className="w-full accent-violet-500 cursor-pointer"
          />
        </div>

        {/* Hue Rotate */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-zinc-300">
            <span>{t.hue}</span>
            <span className="font-mono text-violet-400">{currentFilters.hueRotate}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={currentFilters.hueRotate}
            onChange={(e) => updateFilterField('hueRotate', parseInt(e.target.value))}
            className="w-full accent-violet-500 cursor-pointer"
          />
        </div>

        {/* Sepia */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-zinc-300">
            <span>{t.sepia}</span>
            <span className="font-mono text-violet-400">{currentFilters.sepia}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={currentFilters.sepia}
            onChange={(e) => updateFilterField('sepia', parseInt(e.target.value))}
            className="w-full accent-violet-500 cursor-pointer"
          />
        </div>

        {/* Grayscale */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-zinc-300">
            <span>{t.grayscale}</span>
            <span className="font-mono text-violet-400">{currentFilters.grayscale}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={currentFilters.grayscale}
            onChange={(e) => updateFilterField('grayscale', parseInt(e.target.value))}
            className="w-full accent-violet-500 cursor-pointer"
          />
        </div>

        {/* Blur */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-zinc-300">
            <span>{t.blur}</span>
            <span className="font-mono text-violet-400">{currentFilters.blur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="12"
            value={currentFilters.blur}
            onChange={(e) => updateFilterField('blur', parseInt(e.target.value))}
            className="w-full accent-violet-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
