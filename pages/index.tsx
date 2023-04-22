"use client";
import { useEffect, useState } from "react";
import Track from "../components/Track";
import { supabase } from "../lib/supabaseClient";
import { Session } from "@supabase/supabase-js";
import Link from "next/link";
import MediaPlayer from "../components/mediaPlayer";
import { useStateContext } from "../context/StateContext";
import SpotifyLoginPopUp from "../components/spotifyLoginPopUp";
import { useRouter } from "next/router";
import { TrackData } from "../components/types";
import { useSpotify } from "../utils/useSpotify";
import { generateAIResponse } from "../utils/generateAIResponse";

export default function Home() {
  const { state, setState } = useStateContext();
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const router = useRouter();
  const session = state.session;

  const {
    spotifyAccessToken,
    searchForSong,
    showSpotifyLogin,
    playTrack,
    authorizeWithSpotify,
  } = useSpotify();

  const { sanitizedTracks, generateAnswer } = generateAIResponse();

  const allArtists = state.likedSongs
    .map((song) => song.artists)
    .flat()
    .filter((artist, index, self) => self.indexOf(artist) === index)
    .join(", ");

  const prompt = `Based on this mood, feeling, or specific query: ${input}, provide a maximum of three songs with each song's name and artist, separated by a dash. Each song should be on a separate line. No excess line breaks in the beginning or end of the response. Example: Song Name - Artist Name\n ${
    state.likedSongs
      ? `On subsequent queries, consider some of these suggested songs and blend the genres into your suggestions: ${allArtists}`
      : ""
  }`;

  const loadAllSongsFromLocalStorage = (): TrackData[] => {
    const storedAllSongs = localStorage.getItem("allSongs");
    return storedAllSongs ? JSON.parse(storedAllSongs) : [];
  };

  const handleSession = (session: any) => {
    console.log("Handling session", session);
    setState({
      ...state,
      session: session,
    });
    localStorage.setItem("supabaseSession", JSON.stringify(session));

    setLoading(false);
  };

  useEffect(() => {
    const storedSessionStr = localStorage.getItem("supabaseSession");

    if (storedSessionStr && storedSessionStr !== "{}") {
      const storedSession = JSON.parse(storedSessionStr);
      console.log("Stored session", storedSession);
      handleSession(storedSession);
    } else {
      supabase.auth.getSession().then((currentSession) => {
        console.log("Current session", currentSession);
        handleSession(currentSession.data.session);
      });
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          handleSession(session as Session);
        }
      }
    );

    const localAllSongs = loadAllSongsFromLocalStorage();
    if (localAllSongs && localAllSongs.length > 0) {
      setState((prevState) => ({ ...prevState, tracks: localAllSongs }));
    }

    return () => authListener.subscription.unsubscribe();
  }, []);

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

        if (likedSongs && likedSongs.length > 0) {
          setState({
            ...state,
            likedSongs: likedSongs,
          });
        } else {
          setState({
            ...state,
            likedSongs: [],
          });
        }
      }
    };
    fetchLikedSongs();
  }, [session?.user?.id]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    localStorage.clear();
    router.push("/login");

    if (error) {
      console.error("Error signing out:", error.message);
    }
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

      {state.session ? (
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
                  onClick={(e) => generateAnswer(input, prompt)}>
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

          {spotifyAccessToken ? (
            <div>
              <MediaPlayer
                isPlaying={state.isPlaying}
                audioURL={state.audioURL}
                playTrack={playTrack}
              />
            </div>
          ) : (
            showSpotifyLogin && (
              <SpotifyLoginPopUp authorizeWithSpotify={authorizeWithSpotify} />
            )
          )}
          <div>
            {state.tracks.map((track, id) => {
              return <Track key={id} track={track} playTrack={playTrack} />;
            })}
          </div>
        </>
      ) : (
        loading && <div>Loading...</div>
      )}
    </main>
  );
}
