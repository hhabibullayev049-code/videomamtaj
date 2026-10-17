import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  FileVideo,
  Film,
  HardDrive,
  Loader2,
  Play,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { ExportProgress, ExportResult, exportProjectVideo } from '../utils/exportEngine';

export const ExportModal: React.FC = () => {
  const {
    clips,
    audioClips,
    textOverlays,
    watermarks,
    aspectRatio,
    isExportModalOpen,
    setIsExportModalOpen,
    t,
  } = useEditor();

  const [resolution, setResolution] = useState<'1080p' | '720p' | '480p'>('1080p');
  const [format, setFormat] = useState<'mp4' | 'webm'>('mp4');
  const [filename, setFilename] = useState<string>('mening-videom');

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shouldCancelRef = useRef(false);

  const handleStartExport = async () => {
    setError(null);
    setExportResult(null);
    setIsExporting(true);
    shouldCancelRef.current = false;

    try {
      const result = await exportProjectVideo(
        clips,
        audioClips,
        textOverlays,
        watermarks,
        aspectRatio,
        {
          resolution,
          format,
          fps: 30,
          filename,
        },
        (prog) => setProgress(prog),
        () => shouldCancelRef.current
      );

      setExportResult(result);
      setIsExporting(false);
      setProgress(null);
    } catch (err: unknown) {
      const e = err as Error;
      setIsExporting(false);
      if (e.message !== 'Eksport bekor qilindi') {
        setError(e.message || 'Eksport davomida xatolik yuz berdi');
      }
    }
  };

  const handleCancelExport = () => {
    shouldCancelRef.current = true;
    setIsExporting(false);
    setProgress(null);
  };

  const handleDownload = () => {
    if (!exportResult) return;
    const a = document.createElement('a');
    a.href = exportResult.url;
    a.download = exportResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isExportModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-violet-400" />
            <h2 className="font-bold text-zinc-100 text-sm">{t.exportModalTitle}</h2>
          </div>
          <button
            onClick={() => {
              if (isExporting) handleCancelExport();
              setIsExportModalOpen(false);
            }}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5 text-xs text-zinc-200">
          {error && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-800 text-rose-200 rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Exporting in progress view */}
          {isExporting && progress && (
            <div className="p-6 bg-zinc-850 rounded-xl border border-zinc-750 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-violet-600/20 border-2 border-violet-500 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
              </div>

              <div className="space-y-1">
                <div className="text-base font-bold text-zinc-100">{t.exportProgress}</div>
                <div className="text-zinc-400 font-mono">{progress.statusText}</div>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-md h-3.5 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-150"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-zinc-400 font-mono text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-violet-400" />
                  <span>O‘tdi: {progress.elapsedSeconds}s</span>
                </div>
                <div>
                  <span>Qoldi: ~{progress.estimatedRemainingSeconds}s</span>
                </div>
              </div>

              <button
                onClick={handleCancelExport}
                className="mt-2 px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-rose-300 border border-zinc-700 cursor-pointer text-xs"
              >
                {t.cancelExport}
              </button>
            </div>
          )}

          {/* Export Success Finished view */}
          {!isExporting && exportResult && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-950/30 border border-emerald-800/80 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-200 text-sm">{t.exportSuccess}</div>
                  <div className="text-emerald-300/80 text-[11px] mt-0.5">
                    Hajmi: <span className="font-mono font-bold">{exportResult.fileSizeMb} MB</span> • Davomiyligi: <span className="font-mono">{exportResult.duration.toFixed(1)}s</span>
                  </div>
                </div>
              </div>

              {/* Preview player */}
              <div className="rounded-xl overflow-hidden border border-zinc-800 bg-black aspect-video flex items-center justify-center">
                <video
                  src={exportResult.url}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Download CTA */}
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>{t.downloadVideo} ({exportResult.filename})</span>
              </button>

              <div className="flex items-center gap-2 text-[11px] text-zinc-400 bg-zinc-850 p-3 rounded-lg border border-zinc-750">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t.exportReadyDesc}</span>
              </div>
            </div>
          )}

          {/* Export Configuration Form (when not exporting and no result yet) */}
          {!isExporting && !exportResult && (
            <div className="space-y-4">
              {/* Filename */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300">{t.filename}</label>
                <div className="flex items-center rounded-lg bg-zinc-850 border border-zinc-700 overflow-hidden focus-within:border-violet-500">
                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="flex-1 px-3 py-2 bg-transparent text-zinc-100 outline-none text-xs"
                    placeholder="Fayl nomini yozing..."
                  />
                  <span className="px-3 text-zinc-400 font-mono text-[11px] bg-zinc-800 py-2 border-l border-zinc-700">
                    .{format}
                  </span>
                </div>
              </div>

              {/* Resolution options */}
              <div className="space-y-2">
                <label className="font-semibold text-zinc-300">{t.resolution}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['1080p', '720p', '480p'] as const).map((res) => (
                    <button
                      key={res}
                      onClick={() => setResolution(res)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        resolution === res
                          ? 'bg-violet-600/30 border-violet-500 text-white shadow-md ring-1 ring-violet-500/50'
                          : 'bg-zinc-850 hover:bg-zinc-800 border-zinc-750 text-zinc-400'
                      }`}
                    >
                      <div className="font-bold text-sm text-zinc-100">{res}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        {res === '1080p' ? 'Full HD (Yuqori)' : res === '720p' ? 'HD (Standart)' : 'SD (Tezkor)'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Format selection */}
              <div className="space-y-2">
                <label className="font-semibold text-zinc-300">{t.format}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFormat('mp4')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      format === 'mp4'
                        ? 'bg-violet-600/30 border-violet-500 text-white ring-1 ring-violet-500/50'
                        : 'bg-zinc-850 hover:bg-zinc-800 border-zinc-750 text-zinc-400'
                    }`}
                  >
                    <div className="font-bold text-zinc-100">MP4 (Universal)</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">H.264 / AAC video konteyneri</div>
                  </button>

                  <button
                    onClick={() => setFormat('webm')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      format === 'webm'
                        ? 'bg-violet-600/30 border-violet-500 text-white ring-1 ring-violet-500/50'
                        : 'bg-zinc-850 hover:bg-zinc-800 border-zinc-750 text-zinc-400'
                    }`}
                  >
                    <div className="font-bold text-zinc-100">WebM (VP9)</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Tezkor internet va brauzer formati</div>
                  </button>
                </div>
              </div>

              {/* Project summary card */}
              <div className="bg-zinc-850 p-3.5 rounded-xl border border-zinc-750 space-y-2 text-[11px] text-zinc-400">
                <div className="flex justify-between">
                  <span>Kliplar soni:</span>
                  <span className="font-mono text-zinc-200">{clips.length} ta</span>
                </div>
                <div className="flex justify-between">
                  <span>Qatlamlar (Audio/Matn/Logo):</span>
                  <span className="font-mono text-zinc-200">
                    {audioClips.length + textOverlays.length + watermarks.length} ta
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Kadr o‘lchami (Aspect):</span>
                  <span className="font-mono text-violet-400">{aspectRatio}</span>
                </div>
              </div>

              {/* Start Export Button */}
              <button
                onClick={handleStartExport}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
              >
                <FileVideo className="w-4 h-4" />
                <span>{t.startExport}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-end">
          <button
            onClick={() => {
              if (isExporting) handleCancelExport();
              setIsExportModalOpen(false);
            }}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-semibold cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
