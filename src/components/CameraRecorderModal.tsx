import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  Check,
  Disc,
  Mic,
  RefreshCw,
  Square,
  Video,
  X,
} from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { VideoClip } from '../types/editor';

export const CameraRecorderModal: React.FC = () => {
  const { isCameraModalOpen, setIsCameraModalOpen, addClip, t } = useEditor();

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>('');
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>('');

  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  // Initialize camera stream
  const startCamera = async (videoId?: string, audioId?: string) => {
    setPermissionError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: videoId ? { deviceId: { exact: videoId } } : { width: 1280, height: 720 },
        audio: audioId ? { deviceId: { exact: audioId } } : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }

      // Audio level analyser
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          if (!streamRef.current) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          requestAnimationFrame(updateMeter);
        };
        updateMeter();
      } catch {
        // Meter optional
      }

      // Enumerate devices
      const devList = await navigator.mediaDevices.enumerateDevices();
      setDevices(devList);
    } catch (err: unknown) {
      const error = err as Error;
      setPermissionError(error?.message || t.camPermissionError);
    }
  };

  useEffect(() => {
    if (isCameraModalOpen) {
      startCamera();
    } else {
      // Cleanup on modal close
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setRecordedBlobUrl(null);
      setIsRecording(false);
      setCountdown(null);
    }
  }, [isCameraModalOpen]);

  // Countdown and Start Record
  const handleStartCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          startActualRecording();
          return null;
        }
        return prev - 1;
      });
    }, 900);
  };

  const startActualRecording = () => {
    if (!streamRef.current) return;

    recordedChunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/mp4')
      ? 'video/mp4'
      : 'video/webm';

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setRecordedBlobUrl(url);
    };

    recorder.start(250);
    setIsRecording(true);
    recordingStartTimeRef.current = Date.now();

    timerIntervalRef.current = window.setInterval(() => {
      const sec = (Date.now() - recordingStartTimeRef.current) / 1000;
      setRecordedDuration(sec);
    }, 100);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const handleAddToTimeline = () => {
    if (!recordedBlobUrl) return;

    const duration = Math.max(1, Number(recordedDuration.toFixed(2)));
    const newClip: VideoClip = {
      id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: `Kamera yozuvi (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})`,
      src: recordedBlobUrl,
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
    setIsCameraModalOpen(false);
  };

  const handleRetake = () => {
    setRecordedBlobUrl(null);
    setRecordedDuration(0);
    startCamera(selectedVideoDeviceId, selectedAudioDeviceId);
  };

  if (!isCameraModalOpen) return null;

  const videoDevices = devices.filter((d) => d.kind === 'videoinput');
  const audioDevices = devices.filter((d) => d.kind === 'audioinput');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-zinc-100 text-sm">{t.recordModalTitle}</h2>
          </div>
          <button
            onClick={() => setIsCameraModalOpen(false)}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto">
          {permissionError ? (
            <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl text-rose-200 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Ruxsat xatosi</p>
                <p className="mt-1 text-rose-300/90">{permissionError}</p>
                <button
                  onClick={() => startCamera()}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium cursor-pointer"
                >
                  Qaytadan urinib ko‘rish
                </button>
              </div>
            </div>
          ) : (
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center shadow-inner">
              {recordedBlobUrl ? (
                <video
                  src={recordedBlobUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  ref={videoPreviewRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}

              {/* Countdown Overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-8xl font-black text-white animate-ping font-mono">
                    {countdown}
                  </span>
                </div>
              )}

              {/* Live Recording Indicator */}
              {isRecording && (
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600/90 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold shadow-lg animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-white" />
                  <span>REC: {recordedDuration.toFixed(1)}s</span>
                </div>
              )}

              {/* Audio visualizer bar in preview */}
              {!recordedBlobUrl && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg">
                  <Mic className="w-3.5 h-3.5 text-zinc-300" />
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-75 rounded-full"
                      style={{ width: `${audioLevel}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Device Selectors */}
          {!recordedBlobUrl && !permissionError && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">{t.cameraDevice}:</label>
                <select
                  value={selectedVideoDeviceId}
                  onChange={(e) => {
                    setSelectedVideoDeviceId(e.target.value);
                    startCamera(e.target.value, selectedAudioDeviceId);
                  }}
                  className="w-full p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 outline-none"
                >
                  {videoDevices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Kamera ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-medium">{t.micDevice}:</label>
                <select
                  value={selectedAudioDeviceId}
                  onChange={(e) => {
                    setSelectedAudioDeviceId(e.target.value);
                    startCamera(selectedVideoDeviceId, e.target.value);
                  }}
                  className="w-full p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 outline-none"
                >
                  {audioDevices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Mikrofon ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between">
          <button
            onClick={() => setIsCameraModalOpen(false)}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-semibold cursor-pointer"
          >
            {t.close}
          </button>

          <div className="flex items-center gap-2">
            {recordedBlobUrl ? (
              <>
                <button
                  onClick={handleRetake}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.recordAgain}</span>
                </button>
                <button
                  onClick={handleAddToTimeline}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-md shadow-emerald-600/30"
                >
                  <Check className="w-4 h-4" />
                  <span>{t.addToTimeline}</span>
                </button>
              </>
            ) : isRecording ? (
              <button
                onClick={handleStopRecording}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer shadow-md shadow-red-600/40 animate-pulse"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>{t.stopRecord}</span>
              </button>
            ) : (
              <button
                onClick={handleStartCountdown}
                disabled={!!permissionError}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer shadow-md shadow-emerald-600/30"
              >
                <Disc className="w-4 h-4" />
                <span>{t.startRecord}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
