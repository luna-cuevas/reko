import React, { useEffect, useState } from 'react';
import { useStateContext } from '../context/StateContext';
import { supabase } from '../lib/supabaseClient';

type TrackProps = {
  track: {
    duration_ms: number;
    preview_url: string;
    album: {
      images: [{ url: string }];
    };
    name: string;
    artists: [{ name?: string | undefined }];
  };
  index: number;
  setShowSpotifyLogin: (show: boolean) => void;
  showSpotifyLogin: boolean;

  playTrack: (track: {}) => void; // New prop for playTrack function
};

const Track: React.FC<TrackProps> = ({
  track,
  playTrack,
  index,
  setShowSpotifyLogin,
}) => {
  const { name, artists, album, preview_url } = track;
  const { images } = album;
  const { state, setState } = useStateContext();
  const session = JSON.parse(
    localStorage.getItem('session') || state.session || '{}'
  );
  const [likedSongs, setLikedSongs] = useState([]);

  useEffect(() => {
    const fetchLikedSongs = async () => {
      const { data: databaseLikedSongs, error } = await supabase
        .from('liked_songs')
        .select('*')
        .eq('user_id', session.user.id);
      setLikedSongs(databaseLikedSongs as any);
      setState({
        ...state,
        likedSongs: databaseLikedSongs as any,
      });
    };
    fetchLikedSongs();
  }, []);

  const handleLikeClick = () => {
    const songName = name;
    const artistsArray = artists.map((artist) => artist.name) as string[];
    toggleLikedSong(artistsArray, songName);
  };

  const isLiked = likedSongs.some(
    (song: any) =>
      JSON.stringify(song.artists) ===
        JSON.stringify(track.artists.map((artist: any) => artist.name)) &&
      song.songName === track.name
  );

  const toggleLikedSong = async (artists: string[], songName: string) => {
    if (!session || !session.user || !session.user.id) {
      console.error('Session or user is undefined');
      return;
    }

    try {
      const response = await fetch('/api/likedSongs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session.user.id,
          track,
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
      localStorage.setItem('likedSongs', JSON.stringify(data.likedSongs));
      setLikedSongs(data.likedSongs);
    } catch (error) {
      console.error('Error adding liked song:', error);
    }
  };

  return (
    <div className="flex  border-b-2 border-[#4f4f4f3c] w-full mx-auto  justify-between py-4  my-0 sm:max-h-[100px] ">
      <div className="lg:w-full flex justify-start w-10/12">
        <button
          onClick={() => {
            if (state.userAuthorizationCode) {
              playTrack(track);
            } else if (state.previewURL) {
              setState({
                ...state,
                previewURL: preview_url,
                track: track,
              });
            } else {
              setState({
                ...state,
                previewURL: preview_url,
                track: track,
              });
              console.log('no auth code');
              setShowSpotifyLogin(true);
            }
          }}
          className="flex w-full">
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
                .join(', ')
                .slice(0, 100)}
            </p>
          </div>
        </button>
      </div>
      <div className="sm:justify-evenly ml-[4%] sm:ml-0 sm:my-auto w-fit sm:gap-0 flex gap-8 mt-6">
        <div onClick={handleLikeClick}>
          <img
            className="max-h-[30px] my-auto h-full"
            src={
              isLiked ? '/images/heart-icon-red.png' : '/images/heart-icon.png'
            }
            alt=""
          />
        </div>
      </div>
    </div>
  );
};

export default Track;
