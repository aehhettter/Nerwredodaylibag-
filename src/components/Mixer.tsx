import React, { useRef, useState } from 'react';
import ChannelStrip from './mixer/ChannelStrip';
import MasterChannelStrip from './mixer/MasterChannelStrip';
import { audioContext } from '../audio/audioContext';
import { Plus, Minus } from 'lucide-react';

interface Channel {
    id: number;
    label: string;
}

export default function Mixer() {
  const [soloChannelId, setSoloChannelId] = useState<number | null>(null);
  const [channels, setChannels] = useState<Channel[]>([
    { id: 1, label: 'Drums' },
    { id: 2, label: 'Bass' },
    { id: 3, label: 'Synth' },
    { id: 4, label: 'Vocals' },
  ]);

  const masterGainNodeRef = useRef<GainNode | null>(null);
  if (!masterGainNodeRef.current) {
      masterGainNodeRef.current = audioContext.createGain();
      masterGainNodeRef.current.connect(audioContext.destination);
  }
  const masterGainNode = masterGainNodeRef.current;

  const handleSolo = (channelId: number) => {
    setSoloChannelId(prevSoloId => (prevSoloId === channelId ? null : channelId));
  };

  const addChannel = () => {
    const newId = (channels.length > 0 ? Math.max(...channels.map(c => c.id)) : 0) + 1;
    setChannels([...channels, { id: newId, label: `Audio ${newId}` }]);
  };

  const removeChannel = () => {
    if (channels.length > 0) {
      setChannels(channels.slice(0, -1));
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-neutral-900/70">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Audio Mixer</h2>
            <div className="flex gap-2">
                <button onClick={addChannel} className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full transition-colors">
                    <Plus size={16} />
                </button>
                <button onClick={removeChannel} className="bg-neutral-700 hover:bg-neutral-600 text-white p-2 rounded-full transition-colors disabled:opacity-50" disabled={channels.length === 0}>
                    <Minus size={16} />
                </button>
            </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
            {channels.map(channel => (
                <ChannelStrip 
                    key={channel.id}
                    channelId={channel.id} 
                    initialLabel={channel.label} 
                    destination={masterGainNode} 
                    soloChannelId={soloChannelId}
                    onSolo={handleSolo}
                />
            ))}
            <div className="border-l-2 border-neutral-700 mx-2"></div>
            <MasterChannelStrip gainNode={masterGainNode} />
        </div>
    </div>
  );
}
