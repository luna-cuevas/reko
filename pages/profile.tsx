import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Session } from "@supabase/supabase-js";
import Link from "next/link";

type LikedSong = {
  user_id: string;
  artists: string[];
  songName: string;
};

const profile = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [likedSongs, setLikedSongs] = useState<LikedSong[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchLikedSongs = async () => {
      if (session?.user?.id) {
        const { data: likedSongs, error } = await supabase
          .from("liked_songs")
          .select("*")
          .eq("user_id", session.user.id);

        if (error) {
          console.error("Error fetching liked songs:", error.message);
          return;
        }

        // Update the likedSongs state variable
        if (likedSongs) {
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
