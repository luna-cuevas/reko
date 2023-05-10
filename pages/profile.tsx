import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useStateContext } from "../context/StateContext";
import Track from "../components/Track";
import { useSpotify } from "../utils/useSpotify";

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
  name: string;
  artists: Artist[];
  album: Album;
  uri: string;
  preview_url: string;
};

const profile = () => {
  const [likedSongs, setLikedSongs] = useState<LikedSong[]>([]);
  const [session, setSession] = useState<any>(null);
  const [showSpotifyLogin, setShowSpotifyLogin] = useState(false);
  const [imageIsLoading, setImageIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState("");

  const { playTrack } = useSpotify();

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
        console.log("session.user.id", session.user.id);
        const { data: likedSongs, error } = await supabase
          .from("liked_songs")
          .select("*")
          .eq("user_id", session.user.id);

        console.log("likedSongs", likedSongs);

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
  }, [session]);

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

      <div className="h-fit p-4 mx-auto">
        <div>
          <h1 className="mb-4 text-4xl font-bold">Your Liked Songs</h1>
          <Link href="/">
            <button>Home</button>
          </Link>
        </div>
        <div className="flex flex-col">
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
    </main>
  );
};

export default profile;
