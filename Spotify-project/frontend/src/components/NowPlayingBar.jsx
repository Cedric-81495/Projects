// src/components/NowPlayingBar.jsx
import { useSpotify } from '../context/SpotifyContext';
import { useState, useEffect } from 'react';

const NowPlayingBar = () => {
  const { isAuthenticated } = useSpotify();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(30); // Example progress percentage
  const [volume, setVolume] = useState(70);
  
  // Simulated track data - in a real app, this would come from the Spotify API
  const trackData = {
    name: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    image: "https://i.scdn.co/image/ab67616d00001e02ef12a4e9d43bfdd4d9c9bd91",
    duration: "3:20",
    currentTime: "1:05"
  };
  
  // Simulate progress bar movement when playing
  useEffect(() => {
    let interval;
    if (isPlaying && progress < 100) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 0.5;
          return newProgress > 100 ? 0 : newProgress;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, progress]);
  
  if (!isAuthenticated) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-spotify-darkgray border-t border-gray-800 px-4 py-3 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Track info */}
        <div className="flex items-center w-1/4">
          <img 
            src={trackData.image} 
            alt={trackData.name} 
            className="w-14 h-14 object-cover shadow-lg"
          />
          <div className="ml-3">
            <h4 className="text-white text-sm font-medium truncate">{trackData.name}</h4>
            <p className="text-gray-400 text-xs truncate">{trackData.artist}</p>
          </div>
          <button className="ml-4 text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>
        
        {/* Player controls */}
        <div className="flex flex-col items-center w-2/4">
          <div className="flex items-center space-x-4 mb-1">
            <button className="text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
              </svg>
            </button>
            <button 
              className="bg-white rounded-full p-2 text-black hover:scale-105 transition-transform"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                </svg>
              )}
            </button>
            <button className="text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798L4.555 5.168z" />
              </svg>
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="flex items-center w-full space-x-2">
            <span className="text-xs text-gray-400 w-10 text-right">{trackData.currentTime}</span>
            <div className="flex-grow relative h-1 bg-gray-600 rounded-full overflow-hidden group cursor-pointer">
              <div 
                className="h-full bg-gray-300 group-hover:bg-spotify-green transition-colors"
                style={{ width: `${progress}%` }}
              ></div>
              <div 
                className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${progress}%`, transform: `translate(-50%, -50%)` }}
              ></div>
            </div>
            <span className="text-xs text-gray-400 w-10">{trackData.duration}</span>
          </div>
        </div>
        
        {/* Volume controls */}
        <div className="flex items-center justify-end w-1/4 space-x-3">
          <button className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd"></path>
            </svg>
          </button>
          <div className="w-24 h-1 bg-gray-600 rounded-full overflow-hidden group cursor-pointer">
            <div 
              className="h-full bg-gray-300 group-hover:bg-spotify-green transition-colors"
              style={{ width: `${volume}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NowPlayingBar;