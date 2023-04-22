import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useStateContext } from "../context/StateContext";

type LikedSong = {
  user_id: string;
  artists: string[];
  songName: string;
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

  useEffect(() => {
    const sessionStr = localStorage.getItem("supabaseSession");
    const sessionObj = sessionStr && JSON.parse(sessionStr);
    setSession(sessionObj);
  }, []);

  useEffect(() => {
    const fetchLikedSongs = async () => {
      if (session?.user?.id) {
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
  }, [session]);

  return (
    <div className="container p-4 mx-auto">
      <div>
        <h1 className="mb-4 text-4xl font-bold">Your Liked Songs</h1>
        <Link href="/">
          <button>Home</button>
        </Link>
      </div>
      <ul>
        {likedSongs.map((song, index) => (
          <li key={index}>
            {song.songName} - {song.artists.join(", ")}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default profile;
