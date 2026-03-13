import { useState, useEffect } from 'react';
import { ShieldCheck, SlidersHorizontal, Layers } from 'lucide-react';
import SafetyAnalysis from './components/SafetyAnalysis';
import Generator from './components/Generator';
import Mixer from './components/Mixer';
import { enableBackgroundAudio } from './audio/audioContext';

type Page = 'generator' | 'safety' | 'mixer';

export default function App() {
  const [activePage, setActivePage] = useState<Page>('mixer');

  useEffect(() => {
    const handleInteraction = () => {
      enableBackgroundAudio();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  const NavButton = ({ page, label, children }: { page: Page, label: string, children: React.ReactNode }) => (
    <button 
      onClick={() => setActivePage(page)}
      className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${activePage === page ? 'bg-neutral-700 text-white' : 'hover:bg-neutral-800 text-neutral-400'}`}>
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
        <header className="p-4 sm:p-6 border-b border-neutral-800 flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tighter">Voicecode Suite</h1>
            <p className="text-sm text-neutral-400 font-mono">Audio-Analyse & Transformation</p>
          </div>
          <div className="flex items-center gap-2 bg-neutral-850 p-1 rounded-lg">
            <NavButton page="generator" label="Generator">
                <SlidersHorizontal className="w-5 h-5" />
            </NavButton>
            <NavButton page="safety" label="Sicherheitsanalyse">
                <ShieldCheck className="w-5 h-5" />
            </NavButton>
            <NavButton page="mixer" label="Mixer">
                <Layers className="w-5 h-5" />
            </NavButton>
          </div>
        </header>

        <main>
          {activePage === 'generator' && <Generator />}
          {activePage === 'safety' && <SafetyAnalysis />}
          {activePage === 'mixer' && <Mixer />}
        </main>
        
      </div>
    </div>
  );
}
