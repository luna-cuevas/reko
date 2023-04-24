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
  const [backgroundColor, setBackgroundColor] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageIsLoading, setImageIsLoading] = useState(true);

  const {
    searchForSong,
    showSpotifyLogin,
    playTrack,
    authorizeWithSpotify,
    genreString,
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
    const currentDate = new Date();

    // Format the date and time into "dd/mm/yyyy hour:minutes"
    const formattedDate = currentDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const formattedTime = currentDate.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const sessionTime = `${formattedDate} ${formattedTime}`;

    setState({
      ...state,
      session: session,
      sessionTime: sessionTime,
    });
    localStorage.setItem("supabaseSession", JSON.stringify(session));

    setLoading(false);
  };

  const generateImage = async (genreString: any) => {
    // Construct the prompt using the genres to describe the image
    const prompt = `An abstract art image that represents the genres: ${genreString}`;
    setImageIsLoading(true);

    try {
      // Make a request to the DALL·E 2.0 API to generate the image
      console.log("Calling DALL·E API...");
      const response = await fetch("/api/dalleAI", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      // Set the URL of the generated image
      setImageUrl(data.imageUrl);

      // Save the imageUrl in localStorage
      localStorage.setItem("imageUrl", data.imageUrl);
    } catch (error) {
      console.error("Error during DALL·E API call:", error);
    } finally {
      setImageIsLoading(false);
      console.log("DALL·E API call finished");
    }
  };

  useEffect(() => {
    const storedSessionStr = localStorage.getItem("supabaseSession");
    // If imageUrl already exists in localStorage, don't call the API again
    const storedImageUrl = localStorage.getItem("imageUrl");
    if (storedImageUrl) {
      setImageUrl(storedImageUrl);
      setImageIsLoading(false);
      console.log("Image URL already exists in localStorage");
    }

    if (storedSessionStr && storedSessionStr !== "{}") {
      const storedSession = JSON.parse(storedSessionStr);
      // console.log("Stored session", storedSession);
      handleSession(storedSession);
    } else {
      supabase.auth.getSession().then((currentSession) => {
        // console.log("Current session", currentSession);
        handleSession(currentSession.data.session);
      });
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          handleSession(session as Session);
          // clear the state and localStorage
          setState({
            ...state,
            session: null,
            sessionTime: "",
            likedSongs: [],
            tracks: [],
          });
          localStorage.clear();
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
    if (sanitizedTracks !== "" && state.devCredentials !== null) {
      const tracksArray = sanitizedTracks.split("\n");
      tracksArray.forEach((item, index) => {
        if (item == "" || item == "" || item == " ") {
          tracksArray.splice(index, 1);
        }
      });
      searchForSong(tracksArray);
      console.log("genres", genreString);
      generateImage(genreString);
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
    // clear session from state
    setState({
      ...state,
      session: null,
      sessionTime: "",
      likedSongs: [],
      tracks: [],
    });

    if (error) {
      console.error("Error signing out:", error.message);
    }
  };

  return (
    <main
      style={{
        backgroundColor: imageIsLoading ? "#07173e" : "transparent",
        transition: "background-color 2s ease-in-out",
      }}
      className="h-fit flex flex-col justify-center min-h-screen text-white bg-transparent">
      {imageIsLoading ? (
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

      {state.session ? (
        <div className=" flex h-full min-h-screen">
          <div className="lg:w-3/4 bg-[#07173ef2] md:w-11/12 h-full mx-auto overflow-y-scroll border-x-2 border-[#4f4f4f3c]">
            <nav className="flex justify-between my-4">
              <h1 className="ml-6 text-4xl font-bold">Reko</h1>
              <div className="flex justify-end w-1/3 gap-10 mr-6 text-white">
                <button>
                  <Link href="/profile">Profile</Link>
                </button>
                <button className="" onClick={signOut}>
                  Sign Out
                </button>
              </div>
            </nav>
            <div className="md:p-20 border-y-2 border-[#4f4f4f3c]">
              <div className="md:w-1/2 mx-auto">
                <label className="m-auto text-xl" htmlFor="query">
                  Provide a mood, feeling, song, or artist.
                </label>
                <input
                  onChange={(e) => setInput(e.target.value)}
                  value={input}
                  name="query"
                  className="rounded-md bg-[#ffffff42] mt-2  w-full px-4 py-2  border-[1px] border-white"
                  type="text"
                />
              </div>
              <div className="md:w-1/4 mx-auto">
                {!loading && (
                  <>
                    <button
                      className="rounded-xl sm:mt-10 hover:bg-white/80 w-full px-4 py-2 mt-8 font-medium text-black bg-white"
                      onClick={(e) => generateAnswer(input, prompt, e)}>
                      Search &rarr;
                    </button>
                  </>
                )}
                {loading && (
                  <button
                    className="bg-[#6f6f6f] rounded-xl text-white font-medium px-4 py-2 sm:mt-10 mt-8 hover:bg-black/80 w-full"
                    disabled></button>
                )}
              </div>
            </div>

            {state.userAuthorizationCode ? (
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
                />
              )
            )}
            <div className="flex flex-col">
              {state.tracks.map((track, id) => {
                return (
                  <Track
                    key={id}
                    track={track}
                    index={id}
                    playTrack={playTrack}
                  />
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        loading && <div>Loading...</div>
      )}
    </main>
  );
}
