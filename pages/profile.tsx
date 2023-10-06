import { use, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useStateContext } from "../context/StateContext";
import Track from "../components/Track";
import { useSpotify } from "../utils/useSpotify";
import { useRouter } from "next/router";
import Navigation from "../components/Navigation";
import ToggleButton from "../components/ToggleButton";
import SpotifyLoginPopUp from "../components/spotifyLoginPopUp";
import MediaPlayer from "../components/mediaPlayer";

type LikedSong = {
  user_id: string;
  track: TrackData;
  songName: string;
  artists: string[];
};

type Artist = {
  name: string;
};

type Album = {
  name: string;
  uri: string;
  images: { url: string }[]; // Add the images property to the Album type
};

type TrackData = {
  preview_url: string;
  duration_ms: number;
  album: {
    images: [{ url: string }];
  };
  name: string;
  artists: [{ name?: string | undefined }];
};

const profile = () => {
  const [likedSongs, setLikedSongs] = useState<LikedSong[]>([]);
  const [session, setSession] = useState<any>(null);
  const [showSpotifyLogin, setShowSpotifyLogin] = useState(false);
  const [showExportLogin, setShowExportLogin] = useState(false);
  const [imageIsLoading, setImageIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [fullImage, setFullImage] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [playlistName, setPlaylistName] = useState("");

  const [newPlaylistPopup, setNewPlaylistPopup] = useState(false);
  const { state, setState } = useStateContext();

  const { playTrack, exportLikedSongsAsPlaylist, authorizeWithSpotify } =
    useSpotify();

  const handleExport = async () => {
    const userAuthorizationCode =
      localStorage.getItem("userAuthorizationCode") ||
      state.userAuthorizationCode;
    console.log("userAuthorizationCode", userAuthorizationCode);

    if (userAuthorizationCode != "") {
      await exportLikedSongsAsPlaylist(
        playlistName,
        playlistDescription,
        isPublic
      ).then((res) => {
        console.log("res", res);
        setNewPlaylistPopup(false);
      });
    } else {
      setShowExportLogin(true);
    }
  };

  useEffect(() => {
    const sessionStr = localStorage.getItem("session");
    const sessionObj = sessionStr && JSON.parse(sessionStr);

    if (sessionObj) {
      setSession(sessionObj);
      console.log("sessionObj", sessionObj);
    } else {
      console.log("No active session found");
    }

    const storedImageUrl = localStorage.getItem("imageUrl");
    if (storedImageUrl) {
      setImageUrl(storedImageUrl);
      setImageIsLoading(false);
      console.log("Image URL already exists in localStorage");
    }
  }, []);

  useEffect(() => {
    const fetchLikedSongs = async () => {
      if (session?.user.id) {
        // console.log("session.user.id", session.user.id);
        const { data: likedSongs, error } = await supabase
          .from("liked_songs")
          .select("*")
          .eq("user_id", session.user.id);

        // console.log("likedSongs", likedSongs);

        if (error) {
          console.error("Error fetching liked songs:", error.message);
          return;
        }

        // Update the likedSongs state variable
        if (likedSongs && likedSongs.length > 0) {
          setLikedSongs(likedSongs as LikedSong[]);
        } else {
          setLikedSongs([]);
        }
      }
    };

    fetchLikedSongs();
  }, [session, likedSongs]);

  return (
    <main
      style={{
        backgroundColor: imageIsLoading ? "#07173e" : "transparent",
        transition: "background-color 2s ease-in-out",
      }}
      className="h-fit flex flex-col mx-[5%] sm:mx-auto justify-center min-h-screen text-white bg-transparent">
      {imageIsLoading && imageUrl != "" ? (
        <div className="bg-[#07173e] transition-opacity opacity-100 -z-10 fixed top-0 left-0 w-full h-full" />
      ) : (
        <div className="-z-10 fixed top-0 left-0 w-full h-full transition-all opacity-100">
          <img
            src={imageUrl || ""}
            alt="Generated image"
            className="object-cover w-full h-full"
            onLoad={() => setImageIsLoading(false)}
          />
        </div>
      )}

      <div className="flex h-full min-h-screen">
        <div
          className={` ${
            !fullImage && "bg-transparent !border-x-0"
          } lg:w-3/4 pb-20   px-[5%] bg-[#07173ef2] w-full sm:w-11/12  mx-auto  border-x-2 border-[#4f4f4f3c]`}>
          <Navigation fullImage={fullImage} setFullImage={setFullImage} />

          {fullImage && (
            <div className="h-full">
              <div className=" mx-6">
                <div className="sm:flex-row sm:my-20 flex flex-col justify-between gap-4 pb-6 mt-8 mb-2 text-2xl font-bold text-center border-b-2 border-gray-800">
                  <h1 className="w-fit sm:m-0 m-auto">Liked Songs</h1>
                  <div className="w-fit sm:m-0 justify-end m-auto">
                    <button
                      onClick={() => setNewPlaylistPopup(true)}
                      className="hover:bg-[#2a47b3] px-4 py-2 text-sm font-medium text-white bg-[#3962f6] rounded-md">
                      Export as playlist
                    </button>
                  </div>
                </div>
                <div>
                  {newPlaylistPopup && (
                    <form className="fixed flex-col top-0 left-0 flex items-center justify-center w-full h-full text-[#040b1c] text-lg bg-black bg-opacity-50">
                      <div
                        className="fixed z-0 w-screen h-screen"
                        onClick={() => setNewPlaylistPopup(false)}
                      />
                      <div className="z-20 flex flex-col gap-6 p-8 bg-white rounded-md">
                        <div className=" flex flex-col">
                          <label htmlFor="playlistName">Playlist Name</label>
                          <input
                            className="rounded-md bg-[#ffffff42] relative mt-2 flex  px-2 py-2  w-full  border-[1px] border-[#040b1c]"
                            type="text"
                            name="playlistName"
                            id="playlistName"
                            value={playlistName}
                            onChange={(e) =>
                              setPlaylistName(e.target.value)
                            }></input>
                        </div>
                        <div className="flex flex-col">
                          <label htmlFor="playlistDescription">
                            Playlist Description
                          </label>
                          <textarea
                            className="rounded-md bg-[#ffffff42] min-h-[60px] relative mt-2 flex  px-2 py-2  w-full  border-[1px] border-[#040b1c]"
                            name="playlistDescription"
                            id="playlistDescription"
                            value={playlistDescription}
                            onChange={(e) =>
                              setPlaylistDescription(e.target.value)
                            }></textarea>
                        </div>
                        <div className="flex justify-between">
                          <label htmlFor="isPublic">Public</label>
                          <ToggleButton
                            checked={isPublic}
                            setIsPublic={setIsPublic}
                          />
                        </div>
                        <div className="flex flex-col">
                          <button
                            type="submit"
                            onClick={(e) => {
                              e.preventDefault();
                              handleExport();
                            }}
                            className="hover:bg-green-600 px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-md">
                            Export
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {showExportLogin && (
                <div className="fixed top-0 left-0 z-50 flex items-center justify-center w-full h-full text-[#040b1c] bg-black bg-opacity-50">
                  <div
                    onClick={() => {
                      setShowSpotifyLogin(!showSpotifyLogin);
                      setState({
                        ...state,
                        isPlaying: false,
                        previewURL: "",
                      });
                    }}
                    className=" absolute z-10 w-full h-full"
                  />
                  <div className="h-fit w-fit z-20 flex flex-col items-center justify-center p-10 bg-white">
                    <h1 className="mb-6 text-xl font-bold">
                      Login to Spotify Required to Export
                    </h1>
                    <button
                      onClick={authorizeWithSpotify}
                      className="px-4 py-2 text-white bg-[#07173e] rounded-lg">
                      Login
                    </button>
                  </div>
                </div>
              )}

              {state.isPlaying && !showSpotifyLogin ? (
                <div>
                  <MediaPlayer
                    isPlaying={state.isPlaying}
                    audioURL={state.audioURL}
                    playTrack={playTrack}
                  />
                </div>
              ) : (
                showSpotifyLogin && (
                  <SpotifyLoginPopUp
                    authorizeWithSpotify={authorizeWithSpotify}
                    setShowSpotifyLogin={setShowSpotifyLogin}
                    showSpotifyLogin={showSpotifyLogin}
                  />
                )
              )}
              <div className=" flex flex-col mx-6">
                {likedSongs.map((song, index) => (
                  <Track
                    key={index}
                    playTrack={playTrack}
                    showSpotifyLogin={showSpotifyLogin}
                    setShowSpotifyLogin={setShowSpotifyLogin}
                    index={index}
                    track={song.track}
                  />
                  // <>{song.songName}</>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default profile;
