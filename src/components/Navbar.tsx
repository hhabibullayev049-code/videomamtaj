import React, { useRef } from 'react';
import {
  Camera,
  Download,
  Film,
  Globe,
  Mic,
  Moon,
  Plus,
  Redo2,
  Sun,
  Undo2,
  Upload,
  Video,
} from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { AspectRatio, Language, VideoClip } from '../types/editor';

export const Navbar: React.FC = () => {
  const {
    t,
    aspectRatio,
    setAspectRatio,
    canUndo,
    canRedo,
    undo,
    redo,
    theme,
    setTheme,
    language,
    setLanguage,
    setIsCameraModalOpen,
    setIsVoiceModalOpen,
    setIsExportModalOpen,
    setIsMediaLibraryOpen,
    addClip,
  } = useEditor();

  const fileInputRef = useRef<HTMLInputElement>(null);

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

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const aspectOptions: { label: string; value: AspectRatio; icon: string }[] = [
    { label: '16:9 YouTube / Gorizontal', value: '16:9', icon: '📺' },
    { label: '9:16 TikTok / Reels / Shorts', value: '9:16', icon: '📱' },
    { label: '1:1 Instagram Post', value: '1:1', icon: '🔲' },
    { label: '4:5 Portret', value: '4:5', icon: '📐' },
    { label: '21:9 Kinematik Ultrawide', value: '21:9', icon: '🎬' },
  ];

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md px-3 md:px-5 flex items-center justify-between select-none z-30 shrink-0">
      {/* Brand & History */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Film className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block leading-tight">
            <span className="font-bold text-sm tracking-wide bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              PRO VIDEO
            </span>
            <span className="text-[10px] px-1.5 py-0.5 ml-1.5 rounded-full bg-violet-500/20 text-violet-300 font-mono font-semibold border border-violet-500/30">
              STUDIO
            </span>
          </div>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-1 ml-2 pl-3 border-l border-zinc-800">
          <button
            onClick={undo}
            disabled={!canUndo}
            title={t.undo}
            className={`p-1.5 rounded-md text-xs flex items-center transition-colors ${
              canUndo
                ? 'text-zinc-200 hover:bg-zinc-800 hover:text-white cursor-pointer'
                : 'text-zinc-600 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title={t.redo}
            className={`p-1.5 rounded-md text-xs flex items-center transition-colors ${
              canRedo
                ? 'text-zinc-200 hover:bg-zinc-800 hover:text-white cursor-pointer'
                : 'text-zinc-600 cursor-not-allowed'
            }`}
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="hidden md:flex items-center pl-2">
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="bg-zinc-800/80 hover:bg-zinc-800 text-xs text-zinc-200 border border-zinc-700/60 rounded-md px-2.5 py-1 outline-none cursor-pointer focus:border-violet-500 transition-colors"
          >
            {aspectOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-zinc-900 text-zinc-100">
                {opt.icon} {opt.value}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center Actions (Upload / Camera / Voice / Sample) */}
      <div className="flex items-center gap-1.5 md:gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/*"
          multiple
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-violet-400" />
          <span className="hidden sm:inline">{t.uploadVideo}</span>
        </button>

        <button
          onClick={() => setIsCameraModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">{t.recordCamera}</span>
        </button>

        <button
          onClick={() => setIsVoiceModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
        >
          <Mic className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">{t.recordVoice}</span>
        </button>

        <button
          onClick={() => setIsMediaLibraryOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
        >
          <Video className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">{t.addSample}</span>
        </button>
      </div>

      {/* Right Controls: Theme, Language, Export */}
      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <div className="flex items-center gap-1 bg-zinc-800/80 rounded-md p-0.5 border border-zinc-700/60 text-[11px] font-semibold text-zinc-400">
          <button
            onClick={() => setLanguage('uz')}
            className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
              language === 'uz' ? 'bg-violet-600 text-white font-bold' : 'hover:text-zinc-200'
            }`}
          >
            UZ
          </button>
          <button
            onClick={() => setLanguage('ru')}
            className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
              language === 'ru' ? 'bg-violet-600 text-white font-bold' : 'hover:text-zinc-200'
            }`}
          >
            RU
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
              language === 'en' ? 'bg-violet-600 text-white font-bold' : 'hover:text-zinc-200'
            }`}
          >
            EN
          </button>
        </div>

        {/* Export Button */}
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-violet-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span className="font-semibold">{t.exportVideo}</span>
        </button>
      </div>
    </header>
  );
};
