"use client";
import { useEffect, useState } from "react";
import Track from "../components/Track";
import { supabase } from "../lib/supabaseClient";
import { Session } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import Link from "next/link";

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

type OpenAIAPIResponse = {
  data: {
    choices: Array<{
      text: string;
    }>;
  };
};

type SpotifyAPIResponse = {
  tracks: {
    items: TrackData[];
  };
};

type LikedSong = {
  user_id: string;
  artists: string[];
  songName: string;
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [generatedAnswer, setGeneratedAnswer] = useState("");
  const [sanitizedTracks, setSanitizedTracks] = useState("");
  const [input, setInput] = useState("");
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [suggestedSong, setSuggestedSong] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [likedSongs, setLikedSongs] = useState<LikedSong[]>([]);

  const prompt = `Based on this mood, feeling, or specific query: ${input}, provide a maximum of three songs with each song's name and artist, separated by a dash. Each song should be on a separate line. No excess line breaks in the beginning or end of the response. Example: Song Name - Artist Name\n ${
    suggestedSong
      ? `On subsequent queries, consider some of these suggested songs and blend the genres into your suggestions: ${suggestedSong}`
      : ""
  }`;

  const toggleLikedSong = async (artists: string[], songName: string) => {
    if (!session?.user?.id) {
      return;
    }

    try {
      const response = await fetch("/api/likedSongs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id, artists, songName }),
      });

      const data = await response.json();
      setLikedSongs(data.likedSongs);
    } catch (error) {
      console.error("Error adding liked song:", error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.refreshSession().then(({ data: { session }, error }) => {
      setSession(session);
      setLoading(false); // Set loading to false after refreshing the session
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    }
  };

  const generateAnswer = async (e: React.FormEvent) => {
    if (input !== "") {
      e.preventDefault();
      setGeneratedAnswer("");
      setLoading(true);

      try {
        const response = await fetch("/api/openAI", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: prompt,
          }),
        });

        const answer: OpenAIAPIResponse = await response.json();
        // console.log(answer);
        setGeneratedAnswer(answer.data.choices[0].text);
      } catch (error) {
        console.error("Error during OpenAI API call:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setSanitizedTracks(generatedAnswer);
  }, [generatedAnswer]);

  useEffect(() => {
    if (sanitizedTracks !== "") {
      const tracksArray = sanitizedTracks.split("\n");
      tracksArray.forEach((item, index) => {
        if (item == "" || item == "" || item == " ") {
          tracksArray.splice(index, 1);
        }
      });
      tracksArray.forEach((item, index) => {
        if (item !== "" || item !== "") {
          searchForSong(item);
        }
      });
    }
  }, [sanitizedTracks]);

  useEffect(() => {
    const response = fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID +
              ":" +
              process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET
          ).toString("base64"),
      },
      body: "grant_type=client_credentials",
    })
      .then((response) => response.json())
      .then((data) => {
        // console.log(data)
        setToken(data.access_token);
      })
      .catch((error) => {
        console.error(error);
      });

    // console.log(token)
  }, []);

  useEffect(() => {
    if (token) {
      const interval = setInterval(() => {
        refreshAccessToken();
        console.log("Refreshing access token");
      }, 3600000);
      return () => clearInterval(interval);
    }
  }, [token]);

  async function refreshAccessToken() {
    const authHeader =
      "Basic " +
      Buffer.from(
        process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID +
          ":" +
          process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET
      ).toString("base64");

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authHeader,
      },
      body: `grant_type=refresh_token&refresh_token=${process.env.NEXT_PUBLIC_SPOTIFY_REFRESH_TOKEN}`,
    });

    if (response.ok) {
      const data = await response.json();
      const accessToken = data.access_token;
      // Use the access token or store it for later use
      console.log("Access Token:", accessToken);
      setToken(accessToken);
    } else {
      console.error("Failed to refresh access token");
    }
  }

  async function searchForSong(sanitizedTracks: string) {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${sanitizedTracks}&type=track&limit=1`,
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );
    // console.log(sanitizedTracks);

    const data: SpotifyAPIResponse = await response.json();
    // console.log(data);
    // this is an array of track objects, add to setTracks array state
    setTracks((prevTracks) => [...prevTracks, ...data.tracks.items]);
    // console.log(tracks);
  }

  const handleLike = (artists: string[], songName: string) => {
    // send the song and the entire artist array to the database
    toggleLikedSong(artists, songName);
    // Concatenate all artist names to update the suggested songs
    const allArtists = artists.join(" & ");
    setSuggestedSong(
      (prevSuggestedSong) => prevSuggestedSong + allArtists + "\n"
    );
  };

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

  // Define the isTrackLiked function
  const isTrackLiked = (artists: string[], songName: string): boolean => {
    return likedSongs.some(
      (song) =>
        JSON.stringify(song.artists) === JSON.stringify(artists) &&
        song.songName === songName
    );
  };

  return (
    <main className="bg-white  flex justify-center flex-col w-[80%] m-auto">
      <div>
        <h1 className="text-4xl font-bold">Reko</h1>
        <div>
          <Link href="/profile">
            <button className="text-black">Profile</button>
          </Link>
        </div>
      </div>

      {session ? (
        <>
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            className="rounded-xl w-full px-4 py-2 mt-8 border-2 border-black"
            type="text"
          />
          <div className="w-[50%] mx-auto">
            {!loading && (
              <>
                <button
                  className="rounded-xl sm:mt-10 hover:bg-black/80 w-full px-4 py-2 mt-8 font-medium text-white bg-black"
                  onClick={(e) => generateAnswer(e)}>
                  Hit me &rarr;
                </button>
                <button
                  className="rounded-xl sm:mt-10 hover:bg-black/80 w-full px-4 py-2 mt-8 font-medium text-white bg-black"
                  onClick={signOut}>
                  Sign Out
                </button>
              </>
            )}
            {loading && (
              <button
                className="bg-[#6f6f6f] rounded-xl text-white font-medium px-4 py-2 sm:mt-10 mt-8 hover:bg-black/80 w-full"
                disabled></button>
            )}
          </div>

          <div>
            {tracks.map((track, id) => {
              // console.log(track.artists[0].name)
              return (
                <Track
                  key={id}
                  track={track}
                  onLike={(artists, songName) => handleLike(artists, songName)}
                  isLiked={isTrackLiked(
                    track.artists.map((artist) => artist.name),
                    track.name
                  )}
                />
              );
            })}
          </div>
        </>
      ) : (
        <>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />
          )}
        </>
      )}
    </main>
  );
}
