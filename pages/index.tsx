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
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const router = useRouter();
  const session = state.session;
  const [backgroundColor, setBackgroundColor] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageIsLoading, setImageIsLoading] = useState(true);
  const [fullImage, setFullImage] = useState(true);

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
    localStorage.setItem("session", JSON.stringify(session));

    setLoading(false);
    router.push("/");
  };

  const generateImage = async (genreString: any) => {
    // Construct the prompt using the genres to describe the image
    const prompt = `An abstract art image that represents the genres: ${genreString}`;
    setImageIsLoading(true);
    setLoading(true);

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
      setLoading(false);
      console.log("DALL·E API call finished");
    }
  };

  useEffect(() => {
    const storedSessionStr = localStorage.getItem("session");

    // If imageUrl already exists in localStorage, don't call the API again
    const storedImageUrl = localStorage.getItem("imageUrl");
    if (storedImageUrl) {
      setImageUrl(storedImageUrl);
      setImageIsLoading(false);
      console.log("Image URL already exists in localStorage");
    }

    if (storedSessionStr !== null && storedSessionStr !== "{}") {
      console.log("Session exists in localStorage");
      handleSession(storedSessionStr);
    } else {
      console.log("No session in localStorage");
      supabase.auth.getSession().then((currentSession) => {
        handleSession(currentSession.data.session);
      });
      router.push("/login");
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          handleSession(session as Session);
          // clear the state and localStorage
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
    if (state.session !== null) {
      router.push("/");
    }
  }, [state.session]);

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
      className="h-fit flex flex-col mx-[5%] sm:mx-auto justify-center min-h-screen text-white bg-transparent">
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
          <div
            className={`lg:w-3/4 ${
              !fullImage && "bg-transparent border-x-0"
            }  px-[5%] bg-[#07173ef2] w-full sm:w-11/12 h-full mx-auto  border-x-2 border-[#4f4f4f3c]`}>
            <nav className="flex justify-between my-4">
              <h1
                className={`${
                  !fullImage && "invisible"
                } sm:text-4xl ml-6 text-2xl font-bold`}>
                Reko
              </h1>
              <div className="md:w-1/3 sm:gap-10 flex justify-end gap-4 mr-6 text-white">
                <button>
                  <Link href="/profile">Profile</Link>
                </button>
                <button className="" onClick={signOut}>
                  Sign Out
                </button>
                <button
                  onClick={() => {
                    setFullImage(!fullImage);
                  }}>
                  <img
                    className="w-[20px]"
                    src="images/image-icon.png"
                    alt=""
                  />
                </button>
              </div>
            </nav>
            {fullImage && (
              <>
                <div className="sm:p-20 transition-all opacity-100 py-10 border-y-2 border-[#4f4f4f3c]">
                  <div className="xl:w-1/2 w-5/6 mx-auto">
                    <label
                      className="text-md md:text-xl m-auto"
                      htmlFor="query">
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
                  <div className="md:w-1/3 xl:w-1/4 w-1/2 m-auto">
                    {!loading ? (
                      <>
                        <button
                          className="rounded-xl sm:mt-10 sm:mb-0 hover:bg-white/80 text-md md:text-xl w-full px-4 py-2 my-8 font-medium text-black bg-white"
                          onClick={(e) => generateAnswer(input, prompt, e)}>
                          Search &rarr;
                        </button>
                      </>
                    ) : (
                      <button
                        className="rounded-xl sm:mt-10 sm:mb-0 w-full px-4 py-2 my-8 font-medium text-black bg-white"
                        disabled>
                        <div
                          role="status"
                          className="w-fit justify-center m-auto text-center">
                          <svg
                            aria-hidden="true"
                            className="animate-spin dark:text-gray-600 fill-purple-600 sm:w-10 sm:h-10 inline w-8 h-8 mr-2 text-gray-200"
                            viewBox="0 0 100 101"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                              fill="currentColor"
                            />
                            <path
                              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                              fill="currentFill"
                            />
                          </svg>
                          <span className="sr-only">Loading...</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

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
              </>
            )}
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
          </div>
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </main>
  );
}
