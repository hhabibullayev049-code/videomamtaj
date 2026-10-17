import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { translations } from '../i18n/translations';
import {
  ActiveToolTab,
  AspectRatio,
  AudioTrackClip,
  ImageWatermark,
  Language,
  TextOverlay,
  VideoClip,
  VideoFilters,
} from '../types/editor';
import { computeClipPositions } from '../utils/canvasRenderer';
import { createDefaultSampleClip } from '../utils/sampleData';

interface HistorySnapshot {
  clips: VideoClip[];
  audioClips: AudioTrackClip[];
  textOverlays: TextOverlay[];
  watermarks: ImageWatermark[];
  aspectRatio: AspectRatio;
}

interface EditorContextType {
  // State
  clips: VideoClip[];
  audioClips: AudioTrackClip[];
  textOverlays: TextOverlay[];
  watermarks: ImageWatermark[];
  aspectRatio: AspectRatio;
  currentTime: number;
  isPlaying: boolean;
  selectedClipId: string | null;
  selectedAudioId: string | null;
  selectedOverlayId: string | null;
  selectedWatermarkId: string | null;
  activeTab: ActiveToolTab;
  zoom: number;
  loop: boolean;
  snapEnabled: boolean;
  theme: 'dark' | 'light';
  language: Language;
  t: (typeof translations)['uz'];

  // Modal visibility
  isCameraModalOpen: boolean;
  isVoiceModalOpen: boolean;
  isExportModalOpen: boolean;
  isMediaLibraryOpen: boolean;

  // Computed
  totalDuration: number;
  selectedClip: VideoClip | null;
  selectedAudio: AudioTrackClip | null;
  selectedOverlay: TextOverlay | null;
  selectedWatermark: ImageWatermark | null;
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  setClips: React.Dispatch<React.SetStateAction<VideoClip[]>>;
  addClip: (clip: VideoClip) => void;
  updateClip: (id: string, updates: Partial<VideoClip>) => void;
  deleteClip: (id: string) => void;
  duplicateClip: (id: string) => void;
  splitClipAtPlayhead: (clipId?: string) => void;
  reorderClips: (startIndex: number, endIndex: number) => void;
  resetProject: () => void;

  addAudioClip: (audio: AudioTrackClip) => void;
  updateAudioClip: (id: string, updates: Partial<AudioTrackClip>) => void;
  deleteAudioClip: (id: string) => void;

  addTextOverlay: (overlay?: Partial<TextOverlay>) => void;
  updateTextOverlay: (id: string, updates: Partial<TextOverlay>) => void;
  deleteTextOverlay: (id: string) => void;

  addWatermark: (wm: Partial<ImageWatermark> & { src: string }) => void;
  updateWatermark: (id: string, updates: Partial<ImageWatermark>) => void;
  deleteWatermark: (id: string) => void;

  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  seekTo: (time: number) => void;
  stepFrame: (deltaFrames: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stop: () => void;

  setSelectedClipId: (id: string | null) => void;
  setSelectedAudioId: (id: string | null) => void;
  setSelectedOverlayId: (id: string | null) => void;
  setSelectedWatermarkId: (id: string | null) => void;
  setActiveTab: (tab: ActiveToolTab) => void;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setLoop: React.Dispatch<React.SetStateAction<boolean>>;
  setSnapEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setAspectRatio: (aspect: AspectRatio) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setLanguage: (lang: Language) => void;

  setIsCameraModalOpen: (open: boolean) => void;
  setIsVoiceModalOpen: (open: boolean) => void;
  setIsExportModalOpen: (open: boolean) => void;
  setIsMediaLibraryOpen: (open: boolean) => void;

  undo: () => void;
  redo: () => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [audioClips, setAudioClips] = useState<AudioTrackClip[]>([]);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [watermarks, setWatermarks] = useState<ImageWatermark[]>([]);
  const [aspectRatio, setAspectRatioState] = useState<AspectRatio>('16:9');

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [selectedWatermarkId, setSelectedWatermarkId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveToolTab>('clips');
  const [zoom, setZoom] = useState<number>(60); // pixels per second
  const [loop, setLoop] = useState<boolean>(false);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [language, setLanguage] = useState<Language>('uz');

  // Modals
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);

  // Undo / Redo history
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isHistoryAction = useRef(false);

  const totalDuration = useMemo(() => {
    return computeClipPositions(clips).totalDuration;
  }, [clips]);

  const selectedClip = useMemo(() => {
    return clips.find((c) => c.id === selectedClipId) || null;
  }, [clips, selectedClipId]);

  const selectedAudio = useMemo(() => {
    return audioClips.find((a) => a.id === selectedAudioId) || null;
  }, [audioClips, selectedAudioId]);

  const selectedOverlay = useMemo(() => {
    return textOverlays.find((t) => t.id === selectedOverlayId) || null;
  }, [textOverlays, selectedOverlayId]);

  const selectedWatermark = useMemo(() => {
    return watermarks.find((w) => w.id === selectedWatermarkId) || null;
  }, [watermarks, selectedWatermarkId]);

  const t = translations[language] || translations.uz;

  // Push current state into history snapshot
  const pushHistory = useCallback(
    (newClips = clips, newAudio = audioClips, newTexts = textOverlays, newWms = watermarks, newAspect = aspectRatio) => {
      if (isHistoryAction.current) {
        isHistoryAction.current = false;
        return;
      }
      const snapshot: HistorySnapshot = {
        clips: JSON.parse(JSON.stringify(newClips)),
        audioClips: JSON.parse(JSON.stringify(newAudio)),
        textOverlays: JSON.parse(JSON.stringify(newTexts)),
        watermarks: JSON.parse(JSON.stringify(newWms)),
        aspectRatio: newAspect,
      };

      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        next.push(snapshot);
        if (next.length > 30) next.shift();
        return next;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 29));
    },
    [clips, audioClips, textOverlays, watermarks, aspectRatio, historyIndex]
  );

  // Initialize with a high-quality starter clip on mount
  useEffect(() => {
    let isMounted = true;
    createDefaultSampleClip('neon').then((sampleClip) => {
      if (!isMounted) return;
      setClips([sampleClip]);
      setSelectedClipId(sampleClip.id);

      // Add a starter text overlay
      const sampleText: TextOverlay = {
        id: 'txt-starter',
        text: 'PRO VIDEO STUDIO',
        startTime: 0.5,
        duration: 4.5,
        x: 50,
        y: 85,
        fontSize: 32,
        color: '#ffffff',
        bgColor: 'rgba(0,0,0,0.65)',
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        hasShadow: true,
        align: 'center',
        animation: 'fadeIn',
      };
      setTextOverlays([sampleText]);

      const initialSnapshot: HistorySnapshot = {
        clips: [sampleClip],
        audioClips: [],
        textOverlays: [sampleText],
        watermarks: [],
        aspectRatio: '16:9',
      };
      setHistory([initialSnapshot]);
      setHistoryIndex(0);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const undo = useCallback(() => {
    if (!canUndo) return;
    isHistoryAction.current = true;
    const target = history[historyIndex - 1];
    setClips(JSON.parse(JSON.stringify(target.clips)));
    setAudioClips(JSON.parse(JSON.stringify(target.audioClips)));
    setTextOverlays(JSON.parse(JSON.stringify(target.textOverlays)));
    setWatermarks(JSON.parse(JSON.stringify(target.watermarks)));
    setAspectRatioState(target.aspectRatio);
    setHistoryIndex((prev) => prev - 1);
  }, [canUndo, history, historyIndex]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    isHistoryAction.current = true;
    const target = history[historyIndex + 1];
    setClips(JSON.parse(JSON.stringify(target.clips)));
    setAudioClips(JSON.parse(JSON.stringify(target.audioClips)));
    setTextOverlays(JSON.parse(JSON.stringify(target.textOverlays)));
    setWatermarks(JSON.parse(JSON.stringify(target.watermarks)));
    setAspectRatioState(target.aspectRatio);
    setHistoryIndex((prev) => prev + 1);
  }, [canRedo, history, historyIndex]);

  // Keyboard shortcuts (Undo, Redo, Play/Pause, Split, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        splitClipAtPlayhead();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipId) {
          e.preventDefault();
          deleteClip(selectedClipId);
        } else if (selectedAudioId) {
          e.preventDefault();
          deleteAudioClip(selectedAudioId);
        } else if (selectedOverlayId) {
          e.preventDefault();
          deleteTextOverlay(selectedOverlayId);
        } else if (selectedWatermarkId) {
          e.preventDefault();
          deleteWatermark(selectedWatermarkId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedClipId, selectedAudioId, selectedOverlayId, selectedWatermarkId]);

  // Video Clip Operations
  const addClip = useCallback(
    (clip: VideoClip) => {
      setClips((prev) => {
        const next = [...prev, clip];
        pushHistory(next);
        return next;
      });
      setSelectedClipId(clip.id);
      setActiveTab('trim');
    },
    [pushHistory]
  );

  const updateClip = useCallback(
    (id: string, updates: Partial<VideoClip>) => {
      setClips((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
        pushHistory(next);
        return next;
      });
    },
    [pushHistory]
  );

  const deleteClip = useCallback(
    (id: string) => {
      setClips((prev) => {
        const next = prev.filter((c) => c.id !== id);
        pushHistory(next);
        return next;
      });
      if (selectedClipId === id) setSelectedClipId(null);
    },
    [selectedClipId, pushHistory]
  );

  const duplicateClip = useCallback(
    (id: string) => {
      const target = clips.find((c) => c.id === id);
      if (!target) return;
      const clone: VideoClip = {
        ...JSON.parse(JSON.stringify(target)),
        id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: `${target.name} (Copy)`,
      };
      setClips((prev) => {
        const index = prev.findIndex((c) => c.id === id);
        const next = [...prev];
        next.splice(index + 1, 0, clone);
        pushHistory(next);
        return next;
      });
      setSelectedClipId(clone.id);
    },
    [clips, pushHistory]
  );

  const splitClipAtPlayhead = useCallback(
    (targetId?: string) => {
      const { positions } = computeClipPositions(clips);
      const targetPos = targetId
        ? positions.find((p) => p.clip.id === targetId)
        : positions.find((p) => currentTime > p.startTime && currentTime < p.endTime);

      if (!targetPos) return;

      const clip = targetPos.clip;
      const splitTimeOffset = currentTime - targetPos.startTime;

      // Don't split if too close to edges (< 0.2s)
      if (splitTimeOffset < 0.2 || splitTimeOffset > clip.duration - 0.2) return;

      const firstPartDuration = Number(splitTimeOffset.toFixed(2));
      const secondPartDuration = Number((clip.duration - splitTimeOffset).toFixed(2));

      const firstClip: VideoClip = {
        ...clip,
        duration: firstPartDuration,
      };

      const secondClip: VideoClip = {
        ...JSON.parse(JSON.stringify(clip)),
        id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: `${clip.name} (Part 2)`,
        startOffset: clip.startOffset + firstPartDuration * (clip.speed || 1.0),
        duration: secondPartDuration,
      };

      setClips((prev) => {
        const next = [...prev];
        next.splice(targetPos.index, 1, firstClip, secondClip);
        pushHistory(next);
        return next;
      });
      setSelectedClipId(secondClip.id);
    },
    [clips, currentTime, pushHistory]
  );

  const reorderClips = useCallback(
    (startIndex: number, endIndex: number) => {
      setClips((prev) => {
        const next = [...prev];
        const [removed] = next.splice(startIndex, 1);
        next.splice(endIndex, 0, removed);
        pushHistory(next);
        return next;
      });
    },
    [pushHistory]
  );

  const resetProject = useCallback(() => {
    setClips([]);
    setAudioClips([]);
    setTextOverlays([]);
    setWatermarks([]);
    setCurrentTime(0);
    setIsPlaying(false);
    setSelectedClipId(null);
    pushHistory([], [], [], [], '16:9');
  }, [pushHistory]);

  // Audio operations
  const addAudioClip = useCallback(
    (audio: AudioTrackClip) => {
      setAudioClips((prev) => {
        const next = [...prev, audio];
        pushHistory(clips, next);
        return next;
      });
      setSelectedAudioId(audio.id);
      setActiveTab('audio');
    },
    [clips, pushHistory]
  );

  const updateAudioClip = useCallback(
    (id: string, updates: Partial<AudioTrackClip>) => {
      setAudioClips((prev) => {
        const next = prev.map((a) => (a.id === id ? { ...a, ...updates } : a));
        pushHistory(clips, next);
        return next;
      });
    },
    [clips, pushHistory]
  );

  const deleteAudioClip = useCallback(
    (id: string) => {
      setAudioClips((prev) => {
        const next = prev.filter((a) => a.id !== id);
        pushHistory(clips, next);
        return next;
      });
      if (selectedAudioId === id) setSelectedAudioId(null);
    },
    [clips, selectedAudioId, pushHistory]
  );

  // Text overlay operations
  const addTextOverlay = useCallback(
    (overlay?: Partial<TextOverlay>) => {
      const newOverlay: TextOverlay = {
        id: `txt-${Date.now()}`,
        text: 'Matnni kiriting',
        startTime: currentTime,
        duration: 3,
        x: 50,
        y: 80,
        fontSize: 36,
        color: '#ffffff',
        bgColor: 'rgba(0, 0, 0, 0.6)',
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        hasShadow: true,
        align: 'center',
        animation: 'fadeIn',
        ...overlay,
      };

      setTextOverlays((prev) => {
        const next = [...prev, newOverlay];
        pushHistory(clips, audioClips, next);
        return next;
      });
      setSelectedOverlayId(newOverlay.id);
      setActiveTab('text');
    },
    [currentTime, clips, audioClips, pushHistory]
  );

  const updateTextOverlay = useCallback(
    (id: string, updates: Partial<TextOverlay>) => {
      setTextOverlays((prev) => {
        const next = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
        pushHistory(clips, audioClips, next);
        return next;
      });
    },
    [clips, audioClips, pushHistory]
  );

  const deleteTextOverlay = useCallback(
    (id: string) => {
      setTextOverlays((prev) => {
        const next = prev.filter((t) => t.id !== id);
        pushHistory(clips, audioClips, next);
        return next;
      });
      if (selectedOverlayId === id) setSelectedOverlayId(null);
    },
    [clips, audioClips, selectedOverlayId, pushHistory]
  );

  // Watermark operations
  const addWatermark = useCallback(
    (wm: Partial<ImageWatermark> & { src: string }) => {
      const newWm: ImageWatermark = {
        id: `wm-${Date.now()}`,
        name: wm.name || 'Watermark Logo',
        x: 88,
        y: 12,
        scale: 0.8,
        opacity: 0.9,
        startTime: 0,
        duration: Math.max(10, totalDuration),
        ...wm,
        src: wm.src,
      };

      setWatermarks((prev) => {
        const next = [...prev, newWm];
        pushHistory(clips, audioClips, textOverlays, next);
        return next;
      });
      setSelectedWatermarkId(newWm.id);
      setActiveTab('overlays');
    },
    [totalDuration, clips, audioClips, textOverlays, pushHistory]
  );

  const updateWatermark = useCallback(
    (id: string, updates: Partial<ImageWatermark>) => {
      setWatermarks((prev) => {
        const next = prev.map((w) => (w.id === id ? { ...w, ...updates } : w));
        pushHistory(clips, audioClips, textOverlays, next);
        return next;
      });
    },
    [clips, audioClips, textOverlays, pushHistory]
  );

  const deleteWatermark = useCallback(
    (id: string) => {
      setWatermarks((prev) => {
        const next = prev.filter((w) => w.id !== id);
        pushHistory(clips, audioClips, textOverlays, next);
        return next;
      });
      if (selectedWatermarkId === id) setSelectedWatermarkId(null);
    },
    [clips, audioClips, textOverlays, selectedWatermarkId, pushHistory]
  );

  // Playback control
  const seekTo = useCallback(
    (time: number) => {
      const clamped = Math.max(0, Math.min(time, totalDuration));
      setCurrentTime(Number(clamped.toFixed(3)));
    },
    [totalDuration]
  );

  const stepFrame = useCallback(
    (deltaFrames: number) => {
      const fps = 30;
      seekTo(currentTime + deltaFrames / fps);
    },
    [currentTime, seekTo]
  );

  const play = useCallback(() => {
    if (currentTime >= totalDuration) {
      setCurrentTime(0);
    }
    setIsPlaying(true);
  }, [currentTime, totalDuration]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const setAspectRatio = useCallback(
    (aspect: AspectRatio) => {
      setAspectRatioState(aspect);
      pushHistory(clips, audioClips, textOverlays, watermarks, aspect);
    },
    [clips, audioClips, textOverlays, watermarks, pushHistory]
  );

  return (
    <EditorContext.Provider
      value={{
        clips,
        audioClips,
        textOverlays,
        watermarks,
        aspectRatio,
        currentTime,
        isPlaying,
        selectedClipId,
        selectedAudioId,
        selectedOverlayId,
        selectedWatermarkId,
        activeTab,
        zoom,
        loop,
        snapEnabled,
        theme,
        language,
        t,
        isCameraModalOpen,
        isVoiceModalOpen,
        isExportModalOpen,
        isMediaLibraryOpen,
        totalDuration,
        selectedClip,
        selectedAudio,
        selectedOverlay,
        selectedWatermark,
        canUndo,
        canRedo,
        setClips,
        addClip,
        updateClip,
        deleteClip,
        duplicateClip,
        splitClipAtPlayhead,
        reorderClips,
        resetProject,
        addAudioClip,
        updateAudioClip,
        deleteAudioClip,
        addTextOverlay,
        updateTextOverlay,
        deleteTextOverlay,
        addWatermark,
        updateWatermark,
        deleteWatermark,
        setCurrentTime,
        seekTo,
        stepFrame,
        play,
        pause,
        togglePlay,
        stop,
        setSelectedClipId,
        setSelectedAudioId,
        setSelectedOverlayId,
        setSelectedWatermarkId,
        setActiveTab,
        setZoom,
        setLoop,
        setSnapEnabled,
        setAspectRatio,
        setTheme,
        setLanguage,
        setIsCameraModalOpen,
        setIsVoiceModalOpen,
        setIsExportModalOpen,
        setIsMediaLibraryOpen,
        undo,
        redo,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within EditorProvider');
  return ctx;
}
