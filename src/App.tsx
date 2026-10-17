import React, { useEffect, useState } from 'react';
import { CameraRecorderModal } from './components/CameraRecorderModal';
import { ExportModal } from './components/ExportModal';
import { MediaLibraryModal } from './components/MediaLibraryModal';
import { Navbar } from './components/Navbar';
import { Timeline } from './components/Timeline';
import { ToolsSidebar } from './components/ToolsSidebar';
import { VideoPlayer } from './components/VideoPlayer';
import { VoiceoverModal } from './components/VoiceoverModal';
import { EditorProvider, useEditor } from './context/EditorContext';
import { VideoClip } from './types/editor';

const MainEditorLayout: React.FC = () => {
  const { theme, addClip } = useEditor();
  const [isDragOver, setIsDragOver] = useState(false);

  // Global drag-and-drop video files onto studio
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      Array.from(files).forEach((file) => {
        if (file.type.startsWith('video/')) {
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
        }
      });
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [addClip]);

  return (
    <div
      className={`w-screen h-screen flex flex-col overflow-hidden font-sans ${
        theme === 'light' ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-950 text-zinc-100'
      }`}
    >
      {/* Studio Header */}
      <Navbar />

      {/* Center Stage & Tools Sidebar */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        <VideoPlayer />
        <ToolsSidebar />

        {/* Drag and drop overlay banner */}
        {isDragOver && (
          <div className="absolute inset-0 z-40 bg-violet-950/80 backdrop-blur-sm border-2 border-dashed border-violet-400 flex items-center justify-center p-6 pointer-events-none">
            <div className="text-center space-y-2">
              <div className="text-4xl">🎬</div>
              <div className="text-lg font-bold text-white">Videoni bu yerga tashlang!</div>
              <div className="text-xs text-violet-200">
                Fayl avtomatik tarzda montaj qatoriga qo‘shiladi
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Multi-Track Studio Timeline */}
      <Timeline />

      {/* Modals */}
      <CameraRecorderModal />
      <VoiceoverModal />
      <ExportModal />
      <MediaLibraryModal />
    </div>
  );
};

export default function App() {
  return (
    <EditorProvider>
      <MainEditorLayout />
    </EditorProvider>
  );
}
