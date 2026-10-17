import React, { useRef, useState } from 'react';
import {
  Mic,
  Music,
  Plus,
  Radio,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { AudioTrackClip } from '../../types/editor';
import { createCinematicPad, createLofiBeat, createUpbeatPulse } from '../../utils/audioSynth';

export const AudioTool: React.FC = () => {
  const {
    selectedClip,
    updateClip,
    audioClips,
    addAudioClip,
    updateAudioClip,
    deleteAudioClip,
    setIsVoiceModalOpen,
    currentTime,
    t,
  } = useEditor();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGeneratingBeat, setIsGeneratingBeat] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        const duration = Number(audio.duration.toFixed(2)) || 10;
        const newAudio: AudioTrackClip = {
          id: `audio-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          src: url,
          startTime: currentTime,
          duration,
          startOffset: 0,
          sourceDuration: duration,
          volume: 1.0,
        };
        addAudioClip(newAudio);
      };
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddPresetTune = async (type: 'lofi' | 'cinematic' | 'upbeat') => {
    setIsGeneratingBeat(true);
    try {
      let url = '';
      let name = '';
      if (type === 'lofi') {
        url = await createLofiBeat(16);
        name = 'Lofi Chill Beat (Royalty-Free)';
      } else if (type === 'cinematic') {
        url = await createCinematicPad(18);
        name = 'Cinematic Atmosphere (Ambient)';
      } else {
        url = await createUpbeatPulse(16);
        name = 'Upbeat Pulse Beat';
      }

      const newAudio: AudioTrackClip = {
        id: `audio-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name,
        src: url,
        startTime: currentTime,
        duration: 16,
        startOffset: 0,
        sourceDuration: 16,
        volume: 0.8,
      };
      addAudioClip(newAudio);
    } catch {
      // Audio synth error fallback
    } finally {
      setIsGeneratingBeat(false);
    }
  };

  return (
    <div className="p-4 space-y-5 text-xs text-zinc-200">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/*"
        multiple
        className="hidden"
      />

      {/* 1. Original Video Audio Volume */}
      {selectedClip && (
        <div className="space-y-3 bg-zinc-850 p-3.5 rounded-lg border border-zinc-750">
          <div className="font-semibold text-zinc-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-violet-400" />
              <span>{t.clipOriginalVolume}</span>
            </span>
            <span className="font-mono text-violet-400">
              {Math.round(selectedClip.volume * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                updateClip(selectedClip.id, {
                  volume: selectedClip.volume > 0 ? 0 : 1.0,
                })
              }
              className={`p-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
                selectedClip.volume === 0
                  ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
              title={selectedClip.volume === 0 ? 'Ovozni yoqish' : t.muteOriginal}
            >
              {selectedClip.volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={selectedClip.volume}
              onChange={(e) =>
                updateClip(selectedClip.id, { volume: parseFloat(e.target.value) })
              }
              className="flex-1 accent-violet-500 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* 2. Add Background Music & Voiceover */}
      <div className="space-y-2">
        <div className="font-semibold text-zinc-300">Yangi audio qo‘shish</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-cyan-300 border border-cyan-800/60 font-semibold cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Audio yuklash</span>
          </button>

          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-rose-300 border border-rose-800/60 font-semibold cursor-pointer transition-all"
          >
            <Mic className="w-4 h-4 text-rose-400" />
            <span>Ovoz yozish</span>
          </button>
        </div>
      </div>

      {/* 3. Royalty-Free Presets Generator */}
      <div className="space-y-2 pt-2 border-t border-zinc-800">
        <div className="font-semibold text-zinc-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.presetTracks}</span>
          </span>
          {isGeneratingBeat && (
            <span className="text-[10px] text-amber-400 animate-pulse font-mono">
              Sintez qilinmoqda...
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <button
            disabled={isGeneratingBeat}
            onClick={() => handleAddPresetTune('lofi')}
            className="w-full p-2.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/60 flex items-center justify-between text-left cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">☕</span>
              <div>
                <div className="font-semibold text-zinc-200">Lofi Chill Melodiya</div>
                <div className="text-[10px] text-zinc-400">Yumshoq pianino & hip-hop ritm</div>
              </div>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono">+ Qo‘shish</span>
          </button>

          <button
            disabled={isGeneratingBeat}
            onClick={() => handleAddPresetTune('cinematic')}
            className="w-full p-2.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/60 flex items-center justify-between text-left cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🌌</span>
              <div>
                <div className="font-semibold text-zinc-200">Kinematik Muhit (Ambient)</div>
                <div className="text-[10px] text-zinc-400">Chuqur hissiy fon musiqasi</div>
              </div>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono">+ Qo‘shish</span>
          </button>

          <button
            disabled={isGeneratingBeat}
            onClick={() => handleAddPresetTune('upbeat')}
            className="w-full p-2.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/60 flex items-center justify-between text-left cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <div>
                <div className="font-semibold text-zinc-200">Upbeat Pulse Energiya</div>
                <div className="text-[10px] text-zinc-400">Dinamik va zamonaviy temp</div>
              </div>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono">+ Qo‘shish</span>
          </button>
        </div>
      </div>

      {/* 4. Active Audio Tracks List */}
      <div className="space-y-2 pt-2 border-t border-zinc-800">
        <div className="font-semibold text-zinc-300 flex items-center justify-between">
          <span>{t.audioTracks}</span>
          <span className="font-mono text-zinc-400">{audioClips.length}</span>
        </div>

        {audioClips.length === 0 ? (
          <div className="p-3 bg-zinc-850 rounded-lg text-center text-zinc-500 text-[11px]">
            {t.noAudioTracks}
          </div>
        ) : (
          <div className="space-y-2">
            {audioClips.map((ac) => (
              <div
                key={ac.id}
                className="p-2.5 bg-zinc-850 rounded-lg border border-zinc-750 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    {ac.isVoiceover ? (
                      <Mic className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    ) : (
                      <Music className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    )}
                    <span className="font-medium text-zinc-200 truncate">{ac.name}</span>
                  </div>
                  <button
                    onClick={() => deleteAudioClip(ac.id)}
                    className="p-1 text-zinc-400 hover:text-rose-400 cursor-pointer"
                    title="O‘chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 w-12 shrink-0">Ovoz:</span>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={ac.volume}
                    onChange={(e) =>
                      updateAudioClip(ac.id, { volume: parseFloat(e.target.value) })
                    }
                    className="flex-1 accent-cyan-500 cursor-pointer"
                  />
                  <span className="font-mono text-[10px] text-cyan-400 w-8 text-right">
                    {Math.round(ac.volume * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
