import React, { useRef, useState } from 'react';
import { Film, Loader2, Plus, Sparkles, Upload, Video, X } from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { VideoClip } from '../types/editor';
import { createDefaultSampleClip } from '../utils/sampleData';

export const MediaLibraryModal: React.FC = () => {
  const { isMediaLibraryOpen, setIsMediaLibraryOpen, addClip, t } = useEditor();

  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddSample = async (type: 'neon' | 'nature' | 'sunset') => {
    setIsGenerating(type);
    try {
      const clip = await createDefaultSampleClip(type);
      addClip(clip);
      setIsMediaLibraryOpen(false);
    } catch {
      // Sample generate fallback
    } finally {
      setIsGenerating(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.src = url;
      v.onloadedmetadata = () => {
        const duration = Number(v.duration.toFixed(2)) || 5;
        const newClip: VideoClip = {
          id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          src: url,
          duration,
          sourceDuration: duration,
          startOffset: 0,
          speed: 1.0,
          volume: 1.0,
          rotation: 0,
          flipH: false,
          flipV: false,
          fitMode: 'contain',
          transition: 'none',
          transitionDuration: 0.5,
          filters: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hueRotate: 0,
            sepia: 0,
            grayscale: 0,
            invert: 0,
            blur: 0,
          },
        };
        addClip(newClip);
      };
    });

    setIsMediaLibraryOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isMediaLibraryOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-zinc-100 text-sm">Media Kutubxonasi</h2>
          </div>
          <button
            onClick={() => setIsMediaLibraryOpen(false)}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs text-zinc-200">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="video/*"
            multiple
            className="hidden"
          />

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 font-semibold cursor-pointer transition-all shadow-md"
          >
            <Upload className="w-4 h-4 text-violet-400" />
            <span>{t.selectFromComputer}</span>
          </button>

          {/* Sample Presets */}
          <div className="space-y-3">
            <div className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Namuna videolar (Bir zumda sinash uchun)</span>
            </div>

            <div className="space-y-2">
              <button
                disabled={isGenerating !== null}
                onClick={() => handleAddSample('neon')}
                className="w-full p-3 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 flex items-center justify-between text-left cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-pink-600 to-purple-800 flex items-center justify-center text-lg">
                    🌆
                  </div>
                  <div>
                    <div className="font-bold text-zinc-100 group-hover:text-pink-400 transition-colors">
                      {t.sampleNeon}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      Cyberpunk sintveyv manzarasi, grid va quyosh
                    </div>
                  </div>
                </div>
                {isGenerating === 'neon' ? (
                  <Loader2 className="w-4 h-4 text-pink-400 animate-spin" />
                ) : (
                  <span className="text-[11px] text-violet-400 font-semibold flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    Qo‘shish
                  </span>
                )}
              </button>

              <button
                disabled={isGenerating !== null}
                onClick={() => handleAddSample('nature')}
                className="w-full p-3 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 flex items-center justify-between text-left cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-800 flex items-center justify-center text-lg">
                    🏔️
                  </div>
                  <div>
                    <div className="font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                      {t.sampleNature}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      Tog‘lar, quyosh chiqishi va qushlar parvozi
                    </div>
                  </div>
                </div>
                {isGenerating === 'nature' ? (
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                ) : (
                  <span className="text-[11px] text-violet-400 font-semibold flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    Qo‘shish
                  </span>
                )}
              </button>

              <button
                disabled={isGenerating !== null}
                onClick={() => handleAddSample('sunset')}
                className="w-full p-3 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 flex items-center justify-between text-left cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-amber-600 to-orange-800 flex items-center justify-center text-lg">
                    🌅
                  </div>
                  <div>
                    <div className="font-bold text-zinc-100 group-hover:text-amber-400 transition-colors">
                      {t.sampleSunset}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      Oltin rangli dengiz sohili va suzuvchi kema
                    </div>
                  </div>
                </div>
                {isGenerating === 'sunset' ? (
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                ) : (
                  <span className="text-[11px] text-violet-400 font-semibold flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    Qo‘shish
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-end">
          <button
            onClick={() => setIsMediaLibraryOpen(false)}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-semibold cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
