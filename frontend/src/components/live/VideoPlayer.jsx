import { useEffect, useRef, forwardRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

const VideoPlayer = forwardRef(({ 
  stream, 
  isLocal = false, 
  muted = false, 
  autoPlay = true,
  className = '',
  showControls = true,
  isLive = false,
  viewerCount = 0,
  fullscreen = false,
  onFullscreenToggle,
}, ref) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Use forwarded ref or create local ref
  useEffect(() => {
    if (ref) {
      ref.current = videoRef.current;
    }
  }, [ref]);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
    onFullscreenToggle?.();
  };

  const handleVolumeChange = (e) => {
    if (videoRef.current) {
      videoRef.current.volume = e.target.value;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
      style={{ aspectRatio: isLive ? '16/9' : 'auto' }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay={autoPlay}
        muted={muted || isLocal}
        playsInline
        className={`w-full h-full object-cover ${isLocal ? 'transform scale-x-[-1]' : ''}`}
        style={{ 
          transform: isLocal ? 'scaleX(-1)' : 'none',
        }}
      />

      {/* Live Indicator */}
      {isLive && (
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded flex items-center gap-1">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE
          </span>
          {viewerCount > 0 && (
            <span className="px-2 py-1 bg-black/60 text-white text-xs rounded">
              {viewerCount} watching
            </span>
          )}
        </div>
      )}

      {/* No Stream Placeholder */}
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <Play className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400">
              {isLive ? 'Waiting for stream to start...' : 'No video available'}
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      {showControls && stream && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Progress Bar (for VOD) */}
          {!isLive && (
            <div className="mb-3">
              <div className="w-full h-1 bg-white/30 rounded-full cursor-pointer">
                <div className="w-0 h-full bg-accent rounded-full" />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <Play className="w-5 h-5 text-white" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <Volume2 className="w-5 h-5 text-white" />
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  defaultValue="1"
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                {fullscreen ? (
                  <Minimize className="w-5 h-5 text-white" />
                ) : (
                  <Maximize className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Self Video Label */}
      {isLocal && (
        <div className="absolute top-4 right-4 px-2 py-1 bg-black/60 text-white text-xs rounded">
          You
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;

