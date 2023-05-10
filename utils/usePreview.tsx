import React, { useEffect, useRef, useState } from "react";
import { useStateContext } from "../context/StateContext";

const usePreview = () => {
  const { state, setState } = useStateContext();

  const audioRef = useRef<HTMLAudioElement>(new Audio(state.previewURL));

  useEffect(() => {
    const audioElement = audioRef.current;
    if (state.isPlaying) {
      audioElement.play();
    } else {
      audioElement.pause();
    }
  }, [state.isPlaying]);

  useEffect(() => {
    return () => {
      // Clean up the audio element when the component is unmounted
      audioRef.current.pause();
      audioRef.current = new Audio();
    };
  }, []);

  return <div></div>;
};

export default usePreview;
