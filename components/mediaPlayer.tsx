import React, { useEffect, useRef, useState } from "react";
import { useStateContext } from "../context/StateContext";

type MediaPlayerProps = {
  audioURL: string;
  isPlaying: boolean;
  playTrack: (track: {}) => void;
};

const MediaPlayer: React.FC<MediaPlayerProps> = ({ playTrack }) => {
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const [progress, setProgress] = useState(0);
  const { state, setState } = useStateContext();

  const updateProgress = () => {
    if (audioRef.current) {
      const { currentTime, duration } = audioRef.current;
      if (duration) {
        setProgress((currentTime / duration) * 100);
      }
    }
  };

  useEffect(() => {
    audioRef.current.src = state.previewURL;

    audioRef.current.play();

    audioRef.current.addEventListener("timeupdate", updateProgress);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("timeupdate", updateProgress);
      }
    };
  }, [state.previewURL]);

  useEffect(() => {
    if (state.isPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, [state.isPlaying]);

  // useEffect(() => {
  //   if (state.isPlaying) {
  //     audioRef.current.play();
  //   } else {
  //     audioRef.current.pause();
  //   }
  // }, [audioRef.current.src]);

  // Update the playPausePreview function to handle switching between songs
  const playPausePreview = (previewURL: string) => {
    // If a different preview URL is selected, update the audioRef source and play the new preview
    if (state.previewURL !== previewURL) {
      audioRef.current.src = previewURL;
      setState({ ...state, previewURL: previewURL, isPlaying: true });
    } else {
      // If the same preview URL is selected, toggle play/pause state
      audioRef.current.pause();
      setState({ ...state, isPlaying: !state.isPlaying, previewURL: "" });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full p-4 bg-[#07173ede] shadow-lg">
      <div className="flex items-center justify-center">
        <button
          className="focus:outline-none mx-4 text-blue-500"
          onClick={() => {
            if (state.previewURL) {
              playPausePreview(state.track.preview_url);
            }

            if (state.previewURL == "") {
              playTrack(state.track);
            }
          }}>
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
