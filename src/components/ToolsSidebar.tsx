import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Film,
  Layers,
  Music,
  Palette,
  RotateCw,
  Scissors,
  Sparkles,
  Type,
} from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { ActiveToolTab } from '../types/editor';
import { AudioTool } from './tools/AudioTool';
import { FiltersTool } from './tools/FiltersTool';
import { OverlaysTool } from './tools/OverlaysTool';
import { TextTool } from './tools/TextTool';
import { TransformTool } from './tools/TransformTool';
import { TransitionsTool } from './tools/TransitionsTool';
import { TrimTool } from './tools/TrimTool';

export const ToolsSidebar: React.FC = () => {
  const { activeTab, setActiveTab, t } = useEditor();

  const tabs: { id: ActiveToolTab; label: string; icon: React.ReactNode }[] = [
    { id: 'trim', label: t.tabTrim, icon: <Scissors className="w-4 h-4" /> },
    { id: 'transform', label: t.tabTransform, icon: <RotateCw className="w-4 h-4" /> },
    { id: 'filters', label: t.tabFilters, icon: <Palette className="w-4 h-4" /> },
    { id: 'audio', label: t.tabAudio, icon: <Music className="w-4 h-4" /> },
    { id: 'text', label: t.tabText, icon: <Type className="w-4 h-4" /> },
    { id: 'overlays', label: t.tabOverlays, icon: <Sparkles className="w-4 h-4" /> },
    { id: 'transitions', label: t.tabTransitions, icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <div className="w-80 md:w-88 bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0 select-none overflow-hidden z-10">
      {/* Top Tab Navigator Buttons */}
      <div className="flex items-center overflow-x-auto bg-zinc-950 border-b border-zinc-800 scrollbar-none py-1.5 px-2 gap-1 shrink-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel Body */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'trim' && <TrimTool />}
        {activeTab === 'transform' && <TransformTool />}
        {activeTab === 'filters' && <FiltersTool />}
        {activeTab === 'audio' && <AudioTool />}
        {activeTab === 'text' && <TextTool />}
        {activeTab === 'overlays' && <OverlaysTool />}
        {activeTab === 'transitions' && <TransitionsTool />}
      </div>
    </div>
  );
};
