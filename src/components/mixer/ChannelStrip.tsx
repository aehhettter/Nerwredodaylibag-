import React, { useState, useRef, useEffect, useCallback } from 'react';
import Fader from './Fader';
import Knob from './Knob';
import LevelMeter from './LevelMeter';
import { Upload, Play, Square } from 'lucide-react';
import { audioContext } from '../../audio/audioContext';

interface ChannelStripProps {
  channelId: number;
  initialLabel: string;
  destination: AudioNode;
  soloChannelId: number | null;
  onSolo: (channelId: number) => void;
}

export default function ChannelStrip({ channelId, initialLabel, destination, soloChannelId, onSolo }: ChannelStripProps) {
  const [label, setLabel] = useState(initialLabel);
  const [volume, setVolume] = useState(100);
  const [pan, setPan] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const sourceNode = useRef<AudioBufferSourceNode | null>(null);
  const gainNode = useRef(audioContext.createGain());
  const panNode = useRef(audioContext.createStereoPanner());
  const analyserNode = useRef(audioContext.createAnalyser());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSoloed = soloChannelId === channelId;

  useEffect(() => {
    analyserNode.current.fftSize = 256;
    gainNode.current.connect(panNode.current);
    panNode.current.connect(analyserNode.current);
    analyserNode.current.connect(destination);

    return () => {
        // Disconnect all nodes on cleanup
        if (sourceNode.current) sourceNode.current.disconnect();
        gainNode.current.disconnect();
        panNode.current.disconnect();
        analyserNode.current.disconnect();
    }
  }, [destination]);

  useEffect(() => {
    const isEffectivelyMuted = isMuted || (soloChannelId !== null && !isSoloed);
    gainNode.current.gain.value = isEffectivelyMuted ? 0 : volume / 127;
  }, [volume, isMuted, soloChannelId, isSoloed]);

  useEffect(() => {
    panNode.current.pan.value = pan / 100;
  }, [pan]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLabel(file.name);
    if (isPlaying) {
        togglePlayback(); // Stop current playback before loading new file
    }

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const newSource = audioContext.createBufferSource();
    newSource.buffer = audioBuffer;
    newSource.connect(gainNode.current);
    newSource.loop = true;
    newSource.onended = () => setIsPlaying(false);
    sourceNode.current = newSource;
  };

  const togglePlayback = () => {
    if (!sourceNode.current?.buffer) return;
    if (isPlaying) {
      sourceNode.current.stop();
      setIsPlaying(false);
    } else {
        const newSource = audioContext.createBufferSource();
        newSource.buffer = sourceNode.current.buffer;
        newSource.connect(gainNode.current);
        newSource.loop = true;
        newSource.onended = () => setIsPlaying(false);
        newSource.start(0);
        sourceNode.current = newSource;
        setIsPlaying(true);
    }
  }

  let containerClasses = "rounded-lg p-3 flex flex-col items-center gap-3 w-36 transition-all duration-300 border ";
  if (isSoloed) {
      containerClasses += "bg-yellow-900/20 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]";
  } else if (isMuted) {
      containerClasses += "bg-red-900/20 border-red-500/50 opacity-75";
  } else if (soloChannelId !== null && !isSoloed) {
      containerClasses += "bg-neutral-800/50 border-neutral-700 opacity-40 grayscale-[50%]";
  } else {
      containerClasses += "bg-neutral-800/50 border-neutral-700";
  }

  return (
    <div className={containerClasses}>
        <div className="flex-grow flex items-center gap-2 w-full">
            <div className="w-full flex flex-col items-center gap-3">
                <div className="w-full flex justify-between items-center">
                    <button 
                        onClick={() => onSolo(channelId)}
                        className={`text-black text-xs font-bold w-6 h-6 rounded-full transition-colors ${isSoloed ? 'bg-yellow-400' : 'bg-yellow-700'}`}>
                        S
                    </button>
                    <button 
                        onClick={() => setIsMuted(!isMuted)}
                        className={`text-white text-xs font-bold w-6 h-6 rounded-full transition-colors ${isMuted ? 'bg-red-500' : 'bg-red-800'}`}>
                        M
                    </button>
                </div>
                <Knob label="PAN" value={pan} onChange={setPan} />
                <Fader label="VOL" value={volume} onChange={setVolume} />
            </div>
            <LevelMeter analyserNode={analyserNode.current} />
        </div>
      <div className="bg-black/50 w-full text-center p-1 rounded-md flex items-center justify-between gap-2">
        <span className="font-mono text-xs truncate text-white flex-1 text-left pl-1">{label}</span>
        <button onClick={togglePlayback} className="text-white">
            {isPlaying ? <Square size={14} /> : <Play size={14} />}
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="text-white">
            <Upload size={14} />
        </button>
        <input type="file" accept="audio/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      </div>
    </div>
  );
}
