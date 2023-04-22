import React, { useEffect, useRef, useState } from "react";
import { useStateContext } from "../context/StateContext";

type MediaPlayerProps = {
  audioURL: string;
  isPlaying: boolean;
  playTrack: (track: {}) => void;
};

const MediaPlayer: React.FC<MediaPlayerProps> = ({ playTrack }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const { state } = useStateContext();

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener("timeupdate", updateProgress);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("timeupdate", updateProgress);
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (state.isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [state.isPlaying]);

  const updateProgress = () => {
    if (audioRef.current) {
      const { currentTime, duration } = audioRef.current;
      if (duration) {
        setProgress((currentTime / duration) * 100);
      }
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full p-4 bg-white shadow-lg">
      <div className="flex items-center justify-center">
        <button
          className="focus:outline-none mx-4 text-blue-500"
          onClick={() => playTrack(state.track)}>
          {state.isPlaying ? "Pause" : "Play"}
        </button>
        <div className="w-full h-2 mx-4 bg-gray-200 rounded-full">
          <div
            className="h-2 bg-blue-500 rounded-full"
            style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export default MediaPlayer;
