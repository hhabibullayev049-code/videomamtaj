import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Mic, RefreshCw, Square, Volume2, X } from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { AudioTrackClip } from '../types/editor';

export const VoiceoverModal: React.FC = () => {
  const { isVoiceModalOpen, setIsVoiceModalOpen, addAudioClip, currentTime, t } = useEditor();

  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState<number>(0);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!isVoiceModalOpen) {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
        audioStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setRecordedAudioUrl(null);
      setIsRecording(false);
      setRecordedDuration(0);
      setPermissionError(null);
    }
  }, [isVoiceModalOpen]);

  const handleStartRecord = async () => {
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      // Audio level analyser
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        if (!audioStreamRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        requestAnimationFrame(updateMeter);
      };
      updateMeter();

      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);
      };

      recorder.start(250);
      setIsRecording(true);
      startTimeRef.current = Date.now();

      timerIntervalRef.current = window.setInterval(() => {
        const sec = (Date.now() - startTimeRef.current) / 1000;
        setRecordedDuration(sec);
      }, 100);
    } catch (err: unknown) {
      const error = err as Error;
      setPermissionError(error.message || 'Mikrofondan foydalanishga ruxsat berilmadi');
    }
  };

  const handleStopRecord = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    }
  };

  const handleAddToTimeline = () => {
    if (!recordedAudioUrl) return;

    const duration = Math.max(0.5, Number(recordedDuration.toFixed(2)));
    const newAudio: AudioTrackClip = {
      id: `voice-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: `Ovoz yozuvi (${duration}s)`,
      src: recordedAudioUrl,
      startTime: currentTime,
      duration,
      startOffset: 0,
      sourceDuration: duration,
      volume: 1.0,
      isVoiceover: true,
    };

    addAudioClip(newAudio);
    setIsVoiceModalOpen(false);
  };

  const handleRetake = () => {
    setRecordedAudioUrl(null);
    setRecordedDuration(0);
    handleStartRecord();
  };

  if (!isVoiceModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-rose-400" />
            <h2 className="font-bold text-zinc-100 text-sm">{t.voiceModalTitle}</h2>
          </div>
          <button
            onClick={() => setIsVoiceModalOpen(false)}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-xs text-zinc-400 max-w-xs">{t.voiceHint}</p>

          {permissionError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{permissionError}</span>
            </div>
          )}

          {recordedAudioUrl ? (
            <div className="w-full space-y-3">
              <div className="p-4 bg-zinc-850 rounded-xl border border-zinc-750 flex flex-col items-center gap-2">
                <Volume2 className="w-8 h-8 text-rose-400" />
                <span className="font-mono text-lg font-bold text-zinc-100">
                  {recordedDuration.toFixed(1)}s
                </span>
                <audio src={recordedAudioUrl} controls className="w-full mt-2" />
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-3">
              {/* Big pulsating record circle */}
              <button
                onClick={isRecording ? handleStopRecord : handleStartRecord}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                  isRecording
                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse scale-110 shadow-rose-600/50'
                    : 'bg-zinc-800 hover:bg-zinc-750 border-2 border-rose-500/60 text-rose-400 hover:scale-105'
                }`}
              >
                {isRecording ? (
                  <Square className="w-7 h-7 fill-white" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>

              <div className="font-mono text-sm text-zinc-300">
                {isRecording ? `Yozilmoqda: ${recordedDuration.toFixed(1)}s` : 'Boshlash uchun bosing'}
              </div>

              {/* Audio visualizer level bar */}
              {isRecording && (
                <div className="w-full max-w-xs h-3 bg-zinc-800 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-rose-500 transition-all duration-75 rounded-full"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between">
          <button
            onClick={() => setIsVoiceModalOpen(false)}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-semibold cursor-pointer"
          >
            {t.close}
          </button>

          {recordedAudioUrl && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleRetake}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Qaytadan</span>
              </button>
              <button
                onClick={handleAddToTimeline}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-md shadow-emerald-600/30"
              >
                <Check className="w-4 h-4" />
                <span>{t.addToTimeline}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
