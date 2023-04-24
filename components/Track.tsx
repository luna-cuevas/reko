import React from "react";
import Link from "next/link";
import { useStateContext } from "../context/StateContext";

type Artist = {
  name: string;
};

type Album = {
  name: string;
  uri: string;
  images: { url: string }[];
};

type TrackProps = {
  track: {
    name: string;
    artists: Artist[];
    album: Album;
    uri: string;
    preview_url: string;
  };
  index: number;

  playTrack: (track: {}) => void; // New prop for playTrack function
};

const Track: React.FC<TrackProps> = ({ track, playTrack, index }) => {
  const { name, artists, album, preview_url, uri } = track;
  const { images } = album;
  const { state, setState } = useStateContext();
  const { session } = state;

  const handleLikeClick = () => {
    console.log("Like button clicked");
    const songName = name;
    const artistsArray = artists.map((artist) => artist.name);
    toggleLikedSong(artistsArray, songName);
  };

  const isLiked = state.likedSongs?.some(
    (song) =>
      JSON.stringify(song.artists) ===
        JSON.stringify(track.artists.map((artist: any) => artist.name)) &&
      song.songName === track.name
  );

  const toggleLikedSong = async (artists: string[], songName: string) => {
    if (!session) {
      return;
    }

    try {
      const response = await fetch("/api/likedSongs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session.user.id, artists, songName }),
      });

      const data = await response.json();
      setState({
        ...state,
        likedSongs: data.likedSongs,
      });
      console.log("liked songs", data.likedSongs);
    } catch (error) {
      console.error("Error adding liked song:", error);
    }
  };

  return (
    <div className="flex flex-col border-b-2 border-[#4f4f4f3c] w-full mx-auto sm:flex-row justify-evenly py-4  my-0 sm:max-h-[100px] ">
      <div className="sm:w-1/2 flex justify-start">
        <p className="pr-2 my-auto text-center">{index + 1}</p>
        {images.length > 0 && (
          <img className=" h-full" src={images[0].url} alt="Album cover" />
        )}
        <div className="pl-4 my-auto">
          <p>{name}</p>
          <p>
            {artists
              .map((artist) => artist.name)
              .join(", ")
              .slice(0, 100)}
          </p>
        </div>
      </div>
      <div className="sm:justify-evenly sm:w-1/3 flex justify-center">
        <button className="" onClick={() => playTrack(track)}>
          <img
            className="max-h-[30px] my-auto h-full"
            src={
              state.isPlaying && state.audioURL == uri
                ? "/images/pause.png"
                : "/images/play.png"
            }
            alt=""
          />
        </button>
        <Link className="flex" href={uri}>
          <img
            className="max-h-[30px] my-auto h-full"
            src="/images/spotify-icon.png"
            alt=""
          />
        </Link>
        <button onClick={handleLikeClick}>
          <img
            className="max-h-[30px] my-auto h-full"
            src={
              isLiked ? "/images/heart-icon-red.png" : "/images/heart-icon.png"
            }
            alt=""
          />
        </button>
      </div>
    </div>
  );
};

export default Track;
