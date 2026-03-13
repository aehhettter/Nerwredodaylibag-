import React, { useRef, useEffect } from 'react';

interface LevelMeterProps {
  analyserNode: AnalyserNode;
}

const LevelMeter: React.FC<LevelMeterProps> = ({ analyserNode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!analyserNode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animationFrameId: number;

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);

      const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
      const height = (average / 255) * canvas.height;

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      canvasCtx.fillStyle = '#10B981'; // Emerald 500
      canvasCtx.fillRect(0, canvas.height - height, canvas.width, height);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyserNode]);

  return <canvas ref={canvasRef} width="10" height="128" className="bg-black/50 rounded-full"></canvas>;
};

export default LevelMeter;
