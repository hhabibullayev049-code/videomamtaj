export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '21:9';

export type ClipTransition = 'none' | 'fade' | 'dip-black' | 'wipe-left' | 'zoom-in';

export interface VideoFilters {
  brightness: number; // 50 to 150, default 100
  contrast: number;   // 50 to 150, default 100
  saturation: number; // 0 to 200, default 100
  hueRotate: number;  // 0 to 360, default 0
  sepia: number;      // 0 to 100, default 0
  grayscale: number;  // 0 to 100, default 0
  invert: number;     // 0 to 100, default 0
  blur: number;       // 0 to 10, default 0
}

export interface VideoClip {
  id: string;
  name: string;
  src: string;
  duration: number;        // effective play duration on timeline (seconds)
  sourceDuration: number;  // original full video duration (seconds)
  startOffset: number;     // start cut offset inside original video (seconds)
  speed: number;           // 0.25 to 2.0
  volume: number;          // 0.0 to 2.0
  rotation: number;        // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  fitMode: 'contain' | 'cover';
  transition: ClipTransition;
  transitionDuration: number; // e.g. 0.5s
  filters: VideoFilters;
  thumbnailUrl?: string;
}

export interface AudioTrackClip {
  id: string;
  name: string;
  src: string;
  startTime: number;    // start position on master timeline (seconds)
  duration: number;     // duration on master timeline (seconds)
  startOffset: number;  // start trim offset in audio source (seconds)
  sourceDuration: number;
  volume: number;       // 0.0 to 2.0
  isVoiceover?: boolean;
}

export interface TextOverlay {
  id: string;
  text: string;
  startTime: number;
  duration: number;
  x: number;            // 0 - 100% of canvas width
  y: number;            // 0 - 100% of canvas height
  fontSize: number;     // base pixel size (e.g. 36)
  color: string;
  bgColor: string;      // background pill color (or 'transparent')
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | '900';
  hasShadow: boolean;
  align: 'left' | 'center' | 'right';
  animation: 'none' | 'fadeIn' | 'pop' | 'slideUp';
}

export interface ImageWatermark {
  id: string;
  name: string;
  src: string;
  x: number;            // 0 - 100%
  y: number;            // 0 - 100%
  scale: number;        // 0.2 to 2.0
  opacity: number;      // 0.1 to 1.0
  startTime: number;
  duration: number;
}

export interface ExportSettings {
  resolution: '1080p' | '720p' | '480p';
  format: 'mp4' | 'webm';
  fps: number;
  filename: string;
}

export type ActiveToolTab = 
  | 'clips'
  | 'trim'
  | 'transform'
  | 'filters'
  | 'audio'
  | 'text'
  | 'overlays'
  | 'transitions';

export type Language = 'uz' | 'ru' | 'en';
