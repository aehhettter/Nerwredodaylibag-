import React, { useState, useEffect } from 'react';
import Fader from './Fader';

interface MasterChannelStripProps {
  gainNode: GainNode;
}

export default function MasterChannelStrip({ gainNode }: MasterChannelStripProps) {
  const [volume, setVolume] = useState(100);

  useEffect(() => {
    if (gainNode) {
      gainNode.gain.value = volume / 127;
    }
  }, [volume, gainNode]);

  return (
    <div className="bg-neutral-800/50 border-2 border-emerald-500 rounded-lg p-3 flex flex-col items-center gap-3 w-36">
      <div className="w-full h-6"></div> {/* Spacer to align with other channels */}
      <Fader label="MASTER" value={volume} onChange={setVolume} />
      <div className="bg-emerald-900/80 w-full text-center p-1 rounded-md">
        <span className="font-mono text-xs truncate text-white font-bold">MASTER</span>
      </div>
    </div>
  );
}
