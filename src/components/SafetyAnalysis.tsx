import { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileAudio, X, Save, Trash2, HelpCircle } from 'lucide-react';
import { analyzeAudioSafety } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

export default function SafetyAnalysis() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string>('// Warte auf Datei...');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      setError('Ungültiger Dateityp. Bitte eine Audio-Datei auswählen.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAudioFile(file);
    setAnalysisResult('Analyse wird durchgeführt...');

    try {
        const result = await analyzeAudioSafety(file);
        setAnalysisResult(result);
    } catch (e: any) {
        setError(e.message);
        setAnalysisResult('// Fehler bei der Analyse.');
    }

    setIsLoading(false);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  const handleRemoveFile = () => {
    setAudioFile(null);
    setError(null);
    setAnalysisResult('// Warte auf Datei...');
    if(fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 flex flex-col gap-6">
                <div 
                  id="file-upload-section" 
                  className={`border border-dashed border-neutral-700 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors bg-neutral-850/30 ${!audioFile && 'cursor-pointer hover:border-neutral-600'}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={!audioFile ? triggerFileSelect : undefined}
                >
                  {isLoading ? (
                    <p className="font-mono">Analysiere...</p>
                  ) : audioFile ? (
                    <div className='flex flex-col items-center gap-2'>
                      <FileAudio className="w-10 h-10 text-emerald-400" />
                      <p className='font-mono text-sm truncate max-w-full'>{audioFile.name}</p>
                      <button onClick={handleRemoveFile} className='mt-2 text-xs text-neutral-400 hover:text-white flex items-center gap-1'>
                        <X className='w-3 h-3'/> Entfernen
                      </button>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-12 h-12 text-neutral-500 mb-4" />
                      <h2 className="text-lg font-semibold text-white">Audio-Datei für Analyse</h2>
                      <p className="text-sm text-neutral-400">Drag & Drop oder Klicken</p>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" className="hidden" accept="audio/*" onChange={handleFileChange} />
                  {error && <p className='text-xs text-red-400 mt-2'>{error}</p>}
                </div>

                {audioFile && !isLoading && (
                    <div className="bg-neutral-850/30 border border-neutral-800 rounded-xl p-4">
                        <h3 className="font-bold text-white mb-4">Dateiverwaltung</h3>
                        <div className="flex gap-4">
                            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                                <Save className="w-4 h-4"/> Speichern
                            </button>
                            <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                                <Trash2 className="w-4 h-4"/> Löschen
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="col-span-1 flex flex-col gap-6">
                <div className="bg-neutral-850/30 border border-neutral-800 rounded-xl p-4 flex-grow">
                    <h3 className="font-bold text-white mb-2">Analyseergebnisse</h3>
                    <div className="bg-black rounded-md p-3 font-mono text-sm text-cyan-400 h-48 overflow-y-auto prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown>{analysisResult}</ReactMarkdown>
                    </div>
                </div>
                 <a href="https://www.image-line.com/fl-studio-learning/fl-studio-mobile-video-tutorials/" target="_blank" rel="noopener noreferrer" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                    <HelpCircle className="w-4 h-4"/> Hilfe für FL Studio Mobile
                </a>
            </div>
        </div>
    </div>
  );
}
