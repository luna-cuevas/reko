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
    <button onClick={() => playTrack(track)}>
      <div className="flex  border-b-2 border-[#4f4f4f3c] w-full mx-auto  justify-between py-4  my-0 sm:max-h-[100px] ">
        <div className="lg:w-1/2 flex justify-start w-10/12">
          <p className="pr-2 my-auto">{index + 1}</p>
          {images.length > 0 && (
            <img
              className="object-contain w-[15%] sm:w-auto h-full my-auto"
              src={images[0].url}
              alt="Album cover"
            />
          )}
          <div className="pl-4 my-auto text-left">
            <p>{name}</p>
            <p>
              {artists
                .map((artist) => artist.name)
                .join(", ")
                .slice(0, 100)}
            </p>
          </div>
        </div>
        <div className="sm:justify-evenly ml-[4%] sm:ml-0 sm:my-auto w-fit sm:gap-0 flex gap-8 mt-6">
          <div onClick={handleLikeClick}>
            <img
              className="max-h-[30px] my-auto h-full"
              src={
                isLiked
                  ? "/images/heart-icon-red.png"
                  : "/images/heart-icon.png"
              }
              alt=""
            />
          </div>
        </div>
      </div>
    </button>
  );
};

export default Track;
