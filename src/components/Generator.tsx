import { useState, useRef, useCallback, useEffect } from 'react';
import { UploadCloud, Music, FileAudio, X, Play, Square, Download } from 'lucide-react';
import * as d3 from 'd3-shape';
import { scaleLinear } from 'd3-scale';
import { generateMidiFromAudio } from '../services/geminiService';
import Tooltip from './Tooltip';
import Switch from './Switch';
import { audioContext } from '../audio/audioContext';
import MidiWriter from 'midi-writer-js';

interface WaveformProps {
  audioBuffer: AudioBuffer | null;
  width: number;
  height: number;
}

function Waveform({ audioBuffer, width, height }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const channelData = audioBuffer.getChannelData(0);
    const samples = Math.floor(channelData.length / width);
    const filteredData = [];
    for (let i = 0; i < width; i++) {
        let blockStart = samples * i;
        let sum = 0;
        for (let j = 0; j < samples; j++) {
            sum = sum + Math.abs(channelData[blockStart + j]);
        }
        filteredData.push(sum / samples);
    }

    const y = scaleLinear().domain([0, d3.max(filteredData) ?? 0]).range([height, 0]);
    const line = d3.line<number>()
        .x((d, i) => i)
        .y(d => y(d))
        .context(context);

    context.clearRect(0, 0, width, height);
    context.beginPath();
    line(filteredData);
    context.strokeStyle = '#6ee7b7'; // emerald-300
    context.lineWidth = 2;
    context.stroke();

  }, [audioBuffer, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} className="w-full h-full" />;
}

export default function Generator() {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [midiOutput, setMidiOutput] = useState<string>('// MIDI-Daten werden hier angezeigt...');
    const [isPlayingOriginal, setIsPlayingOriginal] = useState(false);
    const [isPlayingMidi, setIsPlayingMidi] = useState(false);
    const originalSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const activeOscillatorsRef = useRef<OscillatorNode[]>([]);
    
    const [params, setParams] = useState({
        frequency: 10000,
        length: 500,
        intensity: 50,
        processingDepth: 5,
        inversionAlgorithm: 'harmonisch',
        noiseReduction: false,
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
  
    const processFile = useCallback(async (file: File) => {
      if (!file.type.startsWith('audio/')) {
        setError('Ungültiger Dateityp. Bitte eine Audio-Datei auswählen.');
        return;
      }
      setIsLoading(true);
      setError(null);
      setAudioFile(file);
      setMidiOutput('// MIDI-Daten werden hier angezeigt...');
  
      try {
        const arrayBuffer = await file.arrayBuffer();
        const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
        setAudioBuffer(decodedBuffer);
      } catch (e) {
        setError('Fehler beim Verarbeiten der Datei.');
        console.error(e);
        setAudioFile(null);
        setAudioBuffer(null);
      }
      setIsLoading(false);
    }, []);

    const handleParamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setParams(prev => ({ ...prev, [id]: e.target.type === 'range' ? Number(value) : value }));
    }

    const handleSwitchChange = (id: string, checked: boolean) => {
        setParams(prev => ({...prev, [id]: checked}))
    }

    const handleGenerateClick = async () => {
        if (!audioFile) {
            setError('Bitte zuerst eine Audio-Datei hochladen.');
            return;
        }
        setIsGenerating(true);
        setError(null);
        setMidiOutput('Generiere MIDI-Sequenz...');
        try {
            const result = await generateMidiFromAudio(audioFile, params);
            setMidiOutput(result);
        } catch (e: any) {
            setError(e.message);
            setMidiOutput('// Fehler bei der Generierung.');
        }
        setIsGenerating(false);
    }
  
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
      stopOriginalAudio();
      setAudioFile(null);
      setAudioBuffer(null);
      setError(null);
      setMidiOutput('// MIDI-Daten werden hier angezeigt...');
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }

    const toggleOriginalAudio = () => {
      if (isPlayingOriginal) {
        stopOriginalAudio();
      } else {
        playOriginalAudio();
      }
    };

    const playOriginalAudio = () => {
      if (!audioBuffer) return;
      if (audioContext.state === 'suspended') audioContext.resume();
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => setIsPlayingOriginal(false);
      source.start(0);
      originalSourceRef.current = source;
      setIsPlayingOriginal(true);
    };

    const stopOriginalAudio = () => {
      if (originalSourceRef.current) {
        originalSourceRef.current.stop();
        originalSourceRef.current.disconnect();
        originalSourceRef.current = null;
      }
      setIsPlayingOriginal(false);
    };

    const toggleMidiAudio = () => {
      if (isPlayingMidi) {
        stopMidiAudio();
      } else {
        playMidiAudio();
      }
    };

    const playMidiAudio = () => {
      try {
        const notes = JSON.parse(midiOutput);
        if (!Array.isArray(notes)) throw new Error("JSON ist kein Array");
        
        if (audioContext.state === 'suspended') audioContext.resume();
        const now = audioContext.currentTime;
        let maxEndTime = now;

        notes.forEach((note: any) => {
          if (!note.note || note.start === undefined || note.duration === undefined) return;
          
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          
          // MIDI note to frequency
          osc.frequency.value = 440 * Math.pow(2, (note.note - 69) / 12);
          
          // Handle time units (assume seconds, but if > 100 assume ms)
          const startSec = note.start > 100 ? note.start / 1000 : note.start;
          const durationSec = note.duration > 100 ? note.duration / 1000 : note.duration;
          
          const startTime = now + startSec;
          const endTime = startTime + durationSec;
          if (endTime > maxEndTime) maxEndTime = endTime;
          
          const velocity = note.velocity !== undefined ? note.velocity / 127 : 0.5;
          
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(velocity, startTime + 0.05);
          gain.gain.setValueAtTime(velocity, endTime - 0.05);
          gain.gain.linearRampToValueAtTime(0, endTime);
          
          osc.connect(gain);
          gain.connect(audioContext.destination);
          
          osc.start(startTime);
          osc.stop(endTime);
          
          activeOscillatorsRef.current.push(osc);
        });

        setIsPlayingMidi(true);
        
        // Auto-stop when sequence finishes
        setTimeout(() => {
          setIsPlayingMidi(false);
          activeOscillatorsRef.current = [];
        }, (maxEndTime - now) * 1000 + 100);

      } catch (e) {
        console.error("Failed to parse or play MIDI sequence", e);
        setError("Fehler beim Abspielen der Sequenz. Ist das JSON gültig?");
      }
    };

    const stopMidiAudio = () => {
      activeOscillatorsRef.current.forEach(osc => {
        try { osc.stop(); osc.disconnect(); } catch (e) {}
      });
      activeOscillatorsRef.current = [];
      setIsPlayingMidi(false);
    };

    const downloadMidi = () => {
      try {
        const notes = JSON.parse(midiOutput);
        if (!Array.isArray(notes)) throw new Error("JSON ist kein Array");
        
        const track = new MidiWriter.Track();
        
        notes.forEach((note: any) => {
          if (!note.note || note.start === undefined || note.duration === undefined) return;
          
          const startSec = note.start > 100 ? note.start / 1000 : note.start;
          const durationSec = note.duration > 100 ? note.duration / 1000 : note.duration;
          
          const startTick = Math.round(startSec * 256);
          const durationTick = Math.round(durationSec * 256);
          
          track.addEvent(new MidiWriter.NoteEvent({
            pitch: [note.note],
            duration: 'T' + durationTick,
            tick: startTick,
            velocity: note.velocity !== undefined ? note.velocity : 64
          }));
        });
        
        const write = new MidiWriter.Writer(track);
        const dataUri = write.dataUri();
        
        const a = document.createElement('a');
        a.href = dataUri;
        a.download = 'voicecode.mid';
        a.click();
      } catch (e) {
        console.error("Failed to generate MIDI file", e);
        setError("Fehler beim Erstellen der MIDI-Datei.");
      }
    };

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        stopOriginalAudio();
        stopMidiAudio();
      };
    }, []);

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
                        <p>Verarbeite...</p>
                    ) : audioFile ? (
                        <div className='flex flex-col items-center gap-2'>
                        <FileAudio className="w-10 h-10 text-emerald-400" />
                        <p className='font-mono text-sm truncate max-w-full'>{audioFile.name}</p>
                        <div className="flex gap-2 mt-2">
                          <button onClick={toggleOriginalAudio} className='text-xs bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1 rounded-md flex items-center gap-1'>
                              {isPlayingOriginal ? <Square className='w-3 h-3'/> : <Play className='w-3 h-3'/>} 
                              {isPlayingOriginal ? 'Stop' : 'Play'}
                          </button>
                          <button onClick={handleRemoveFile} className='text-xs bg-red-900/50 hover:bg-red-800/50 text-red-200 px-3 py-1 rounded-md flex items-center gap-1'>
                              <X className='w-3 h-3'/> Entfernen
                          </button>
                        </div>
                        </div>
                    ) : (
                        <>
                        <UploadCloud className="w-12 h-12 text-neutral-500 mb-4" />
                        <h2 className="text-lg font-semibold text-white">Audio-Datei hochladen</h2>
                        <p className="text-sm text-neutral-400">Drag & Drop oder Klicken zum Auswählen</p>
                        </>
                    )}
                    <input ref={fileInputRef} type="file" className="hidden" accept="audio/*" onChange={handleFileChange} />
                    {error && !isGenerating && <p className='text-xs text-red-400 mt-2'>{error}</p>}
                    </div>

                    <div id="controls-section" className="bg-neutral-850/30 border border-neutral-800 rounded-xl p-4">
                        <h3 className="font-bold text-white mb-4">Parameter</h3>
                        <div className="space-y-4">
                            <div>
                                <Tooltip text="Bestimmt die primäre Frequenzbandbreite für die Analyse und Synthese.">
                                    <label htmlFor="frequency" className="block text-sm font-mono text-neutral-400">Frequenz (Hz): {params.frequency}</label>
                                </Tooltip>
                                <input type="range" id="frequency" min="20" max="20000" value={params.frequency} onChange={handleParamChange} className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <div>
                                <Tooltip text="Steuert die Dauer der einzelnen analysierten Audiosegmente.">
                                    <label htmlFor="length" className="block text-sm font-mono text-neutral-400">Länge (ms): {params.length}</label>
                                </Tooltip>
                                <input type="range" id="length" min="10" max="1000" value={params.length} onChange={handleParamChange} className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <div>
                                <Tooltip text="Simuliert elektrische Eigenschaften, die die Klangfarbe und Dynamik beeinflussen.">
                                    <label htmlFor="intensity" className="block text-sm font-mono text-neutral-400">Intensität (Ohm/V): {params.intensity}</label>
                                </Tooltip>
                                <input type="range" id="intensity" min="0" max="100" value={params.intensity} onChange={handleParamChange} className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <div>
                                <Tooltip text="Je höher der Wert, desto detaillierter die Audioanalyse.">
                                    <label htmlFor="processingDepth" className="block text-sm font-mono text-neutral-400">Verarbeitungstiefe: {params.processingDepth}</label>
                                </Tooltip>
                                <input type="range" id="processingDepth" min="1" max="10" value={params.processingDepth} onChange={handleParamChange} className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <div>
                                <Tooltip text="Wählt die Methode zur Invertierung der musikalischen Eigenschaften.">
                                    <label htmlFor="inversionAlgorithm" className="block text-sm font-mono text-neutral-400">Invertierungs-Algorithmus</label>
                                </Tooltip>
                                <select id="inversionAlgorithm" value={params.inversionAlgorithm} onChange={handleParamChange} className="w-full bg-neutral-700 border border-neutral-600 rounded-md p-2 text-sm font-mono">
                                    <option value="harmonisch">Harmonisch</option>
                                    <option value="rhythmisch">Rhythmisch</option>
                                    <option value="spektral">Spektral</option>
                                </select>
                            </div>
                            <Switch label="Rauschunterdrückung" checked={params.noiseReduction} onChange={(checked) => handleSwitchChange('noiseReduction', checked)} />
                        </div>
                    </div>
                </div>

                <div id="visualization-output-section" className="col-span-1 flex flex-col gap-6">
                    <div className="bg-black/20 border border-neutral-800 rounded-xl p-1 flex-grow flex items-center justify-center min-h-[150px]">
                    {audioBuffer ? (
                        <Waveform audioBuffer={audioBuffer} width={500} height={100} />
                    ) : (
                        <p className="text-neutral-500 font-mono text-sm">Visualisierung...</p>
                    )}
                    </div>
                    <div className="bg-neutral-850/30 border border-neutral-800 rounded-xl p-4 flex flex-col h-full">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Music className="w-5 h-5" />
                            MIDI-Ausgabe
                        </h3>
                        {midiOutput.startsWith('[') && (
                          <div className="flex gap-2">
                            <button 
                              onClick={toggleMidiAudio}
                              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-md flex items-center gap-1 transition-colors">
                              {isPlayingMidi ? <Square className='w-3 h-3'/> : <Play className='w-3 h-3'/>}
                              {isPlayingMidi ? 'Stop' : 'Play'}
                            </button>
                            <button 
                              onClick={downloadMidi}
                              className="text-xs bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1 rounded-md flex items-center gap-1 transition-colors">
                              <Download className='w-3 h-3'/>
                              .mid
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="bg-black rounded-md p-3 font-mono text-sm text-green-400 flex-grow overflow-y-auto whitespace-pre-wrap min-h-[150px]">
                          {isGenerating ? 'Generiere...' : midiOutput}
                      </div>
                    </div>
                </div>
            </div>
            <footer className="p-4 border-t border-neutral-800 text-center mt-6">
                <button 
                    onClick={handleGenerateClick}
                    disabled={isGenerating || !audioFile}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-6 rounded-lg transition-colors w-full sm:w-auto disabled:bg-neutral-600 disabled:cursor-not-allowed">
                    {isGenerating ? 'Generiere...' : 'Generieren & Invertieren'}
                </button>
                {error && isGenerating && <p className='text-xs text-red-400 mt-2'>{error}</p>}
            </footer>
        </div>
    );
}
