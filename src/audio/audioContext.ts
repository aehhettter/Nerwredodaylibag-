export const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

let isBackgroundAudioEnabled = false;

export const enableBackgroundAudio = () => {
  if (isBackgroundAudioEnabled) return;
  
  // Resume the audio context if it's suspended
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  // Create a silent audio element to keep the tab alive in the background
  const silentAudio = document.createElement('audio');
  // 1-second silent WAV base64
  silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
  silentAudio.loop = true;
  silentAudio.playsInline = true;
  
  silentAudio.play().then(() => {
    isBackgroundAudioEnabled = true;
    console.log('Background audio enabled');
  }).catch(e => {
    console.warn('Background audio failed to start:', e);
  });

  // Set up Media Session API for OS-level media controls
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Voicecode Generator',
      artist: 'Audio Processing',
      album: 'Mixer & Generator',
      artwork: [
        { src: 'https://picsum.photos/seed/audio/96/96', sizes: '96x96', type: 'image/jpeg' },
        { src: 'https://picsum.photos/seed/audio/128/128', sizes: '128x128', type: 'image/jpeg' },
        { src: 'https://picsum.photos/seed/audio/192/192', sizes: '192x192', type: 'image/jpeg' },
        { src: 'https://picsum.photos/seed/audio/256/256', sizes: '256x256', type: 'image/jpeg' },
        { src: 'https://picsum.photos/seed/audio/384/384', sizes: '384x384', type: 'image/jpeg' },
        { src: 'https://picsum.photos/seed/audio/512/512', sizes: '512x512', type: 'image/jpeg' },
      ]
    });

    navigator.mediaSession.setActionHandler('play', () => {
      audioContext.resume();
      silentAudio.play();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      // Keep silent audio playing to maintain background state, 
      // but we could suspend the context if we wanted to save battery.
      // For now, we want background processing to continue.
    });
  }
};