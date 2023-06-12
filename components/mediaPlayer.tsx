import React, { useEffect, useRef, useState } from "react";
import { useStateContext } from "../context/StateContext";
import { supabase } from "../lib/supabaseClient";
import useMatchMedia from "../utils/useMatchMedia";
// client side only

type MediaPlayerProps = {
  audioURL: string;
  isPlaying: boolean;
  playTrack: (track: {}) => void;
};

const MediaPlayer: React.FC<MediaPlayerProps> = ({ playTrack }) => {
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const [progress, setProgress] = useState(0);
  const { state, setState } = useStateContext();
  const duration = state.track.duration_ms / 1000;
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0); // Track the currentTime manually
  const [likedSongs, setLikedSongs] = useState([]);
  const { name, artists } = state.track;
  const { isMobile } = useMatchMedia();

  const session = JSON.parse(
    localStorage.getItem("session") || state.session || "{}"
  );

  useEffect(() => {
    const fetchLikedSongs = async () => {
      const { data: databaseLikedSongs, error } = await supabase
        .from("liked_songs")
        .select("*")
        .eq("user_id", session.user.id);
      setLikedSongs(databaseLikedSongs as any);
    };
    fetchLikedSongs();
  }, []);

  const toggleLikedSong = async (artists: string[], songName: string) => {
    if (!session || !session.user || !session.user.id) {
      console.error("Session or user is undefined");
      return;
    }

    try {
      const response = await fetch("/api/likedSongs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session.user.id,
          track: state.track,
          artists,
          songName,
        }),
      });

      const data = await response.json();
      console.log(data.message);
      setState({
        ...state,
        likedSongs: data.likedSongs,
      });
      localStorage.setItem("likedSongs", JSON.stringify(data.likedSongs));
      setLikedSongs(data.likedSongs);
    } catch (error) {
      console.error("Error adding liked song:", error);
    }
  };
  const isLiked = likedSongs.some(
    (song: any) =>
      JSON.stringify(song.artists) ===
        JSON.stringify(state.track.artists.map((artist: any) => artist.name)) &&
      song.songName === state.track.name
  );

  const handleLikeClick = () => {
    const songName = name;
    const artistsArray = artists.map((artist) => artist.name) as string[];
    toggleLikedSong(artistsArray, songName);
  };

  const updateProgress = () => {
    if (audioRef.current && state.previewURL) {
      const { currentTime, duration } = audioRef.current;
      if (duration) {
        setProgress((currentTime / duration) * 100);
      }
    } else {
      setCurrentTime((prevTime) => prevTime + 1);
      // update the progress bar every second
      setProgress((currentTime / duration) * 100);
    }
  };

  useEffect(() => {
    if (state.previewURL) {
      audioRef.current.src = state.previewURL;
      audioRef.current.play();
    }
    setProgress(0);
    setCurrentTime(0);

    audioRef.current.addEventListener("timeupdate", updateProgress);
    updateProgress();

    const interval = setInterval(() => {
      setCurrentTime((prevTime) => prevTime + 1);
      updateProgress();
    }, 1000);
    setIntervalId(interval as unknown as number);

    return () => {
      audioRef.current.removeEventListener("timeupdate", updateProgress);
      clearInterval(interval);
    };
  }, [state.previewURL, state.track]);

  useEffect(() => {
    if (state.isPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, [state.isPlaying]);

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
    <div className="fixed bottom-0 left-0 w-full p-2 bg-[#07173ede] shadow-lg">
      <div className="flex items-center justify-center gap-4">
        <div className="md:w-1/3 md:justify-end flex w-2/3">
          <img
            className="w-[60px]"
            src={state.track.album.images[0].url}
            alt=""
          />
          <div className="w-fit flex flex-col my-auto ml-2">
            <p>{state.track.name}</p>
            <p className="text-xs text-gray-400">
              {state.track.artists[0].name}
            </p>
          </div>
        </div>

        {!isMobile && (
          <div className="flex flex-col w-1/3">
            <button
              className="focus:outline-none mx-4 mb-4 text-blue-500"
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
            <div className=" h-2 mx-4 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-blue-500 rounded-full"
                style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}
        <div className="md:w-1/3 md:justify-start flex justify-end align-bottom">
          {isMobile && (
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
          )}
          <img
            onClick={handleLikeClick}
            className="max-h-[30px] my-auto h-full"
            src={
              isLiked ? "/images/heart-icon-red.png" : "/images/heart-icon.png"
            }
            alt=""
          />
        </div>
      </div>
    </div>
  );
};

export default MediaPlayer;
