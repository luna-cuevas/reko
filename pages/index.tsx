"use client";
import { useEffect, useRef, useState } from "react";
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
import usePreview from "../utils/usePreview";
import Navigation from "../components/Navigation";

type Artist = {
  name: string;
};

type LikedSong = {
  artists: Artist[];
};

export default function Home() {
  const { state, setState } = useStateContext();
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const router = useRouter();
  const session = state.session;
  const [imageUrl, setImageUrl] = useState("");
  const [imageIsLoading, setImageIsLoading] = useState(true);
  const [fullImage, setFullImage] = useState(true);
  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [allArtists, setAllArtists] = useState<string>("");
  const [sensitivity, setSensitivity] = useState("0.5");

  const {
    searchForSong,
    showSpotifyLogin,
    setShowSpotifyLogin,
    playTrack,
    authorizeWithSpotify,
    genreString,
  } = useSpotify();

  const { sanitizedTracks, generateAnswer } = generateAIResponse();

  const prompt: string =
    sensitivity <= "0.9"
      ? `Based on this mood, feeling, or specific query: ${input}, provide a maximum of three songs with each song's name and artist, separated by a dash. Each song should be on a separate line. No excess line breaks in the beginning or end of the response. Example: Song Name - Artist Name\n ${
          state?.likedSongs
            ? `On subsequent queries, consider some of these suggested songs and blend the genres into your suggestions: ${allArtists}`
            : ""
        }`
      : `Give me the exact song that matches this query: ${input}, provide a maximum of three songs with each song's name and artist, separated by a dash.  Each song should be on a separate line. No excess line breaks in the beginning or end of the response. Example: Song Name - Artist Name\n`;

  const loadAllSongsFromLocalStorage = (): TrackData[] => {
    const storedAllSongs = localStorage.getItem("allSongs");
    return storedAllSongs ? JSON.parse(storedAllSongs) : [];
  };

  const clearTracks = () => {
    localStorage.removeItem("tracks");
    setState({
      ...state,
      tracks: [],
      isPlaying: false,
    });
  };

  const handleSession = (session: any) => {
    console.log("Handling state session...");
    setState({
      ...state,
      session: JSON.stringify(session),
      expiresAt: session?.expires_at,
      devCredentials: localStorage.getItem("devCredentials") || "",
    });
    console.log("Handling localStorage session");
    localStorage.setItem("session", JSON.stringify(session));
    localStorage.setItem("expiresAt", session?.expires_at);

    setLoading(false);
    router.push("/");
  };

  const counter = useRef(0);

  const generateImage = async (genreString: any) => {
    counter.current++; // Increment the counter each time the function is called
    console.log("counter", counter.current);
    if (counter.current % 5 === 0) {
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
    } else {
      // Use the previously saved imageUrl from localStorage
      const savedImageUrl = localStorage.getItem("imageUrl");
      if (savedImageUrl) {
        setImageUrl(savedImageUrl);
      } else {
        console.error("No saved imageUrl found in localStorage");
      }
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

    if (storedSessionStr) {
      console.log("Session exists in localStorage");
      handleSession(JSON.parse(storedSessionStr));
    } else {
      console.log("No session in localStorage");
      supabase.auth.getSession().then((currentSession) => {
        handleSession(currentSession.data.session);
      });
    }

    // Retrieve likedSongs from local storage or fallback to state.likedSongs

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
          // Access the Spotify access token

          const storedSessionStr = localStorage.getItem("session");
          if (!storedSessionStr) {
            console.log("Session does not exist in localStorage");

            setState((prevState: any) => ({
              ...prevState,
              session: JSON.stringify(session),
              expiresAt: session?.expires_at,
              devCredentials: localStorage.getItem("devCredentials") || "",
            }));

            localStorage.setItem("session", JSON.stringify(session));
          }
          console.log("setting signed in session");
        } else {
          router.push("/login");
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
    const likedSongsFromLocalStorage = localStorage.getItem("likedSongs");
    const likedSongs: LikedSong[] | null = likedSongsFromLocalStorage
      ? JSON.parse(likedSongsFromLocalStorage)
      : state.likedSongs;

    // Extract and filter artists if likedSongs is available, otherwise use the value from local storage
    const allArtistsString: string = likedSongs
      ? likedSongs
          .map((song) => song.artists) // `song.artists` is already an array of artist names
          .flat() // Flatten the arrays to get a single array of artist names
          .filter((artist, index, self) => self.indexOf(artist) === index)
          .join(", ")
      : "";

    setAllArtists(allArtistsString);
  }, [state?.likedSongs]);

  useEffect(() => {
    // Update the state with tracks from local storage when the component mounts
    const localTracksStr = localStorage.getItem("tracks");
    if (localTracksStr) {
      const localTracks = JSON.parse(localTracksStr);
      setState((prevState) => ({ ...prevState, tracks: localTracks }));
    } else {
      console.log("No tracks in localStorage");
    }
  }, []); // Empty dependency array to run only on the initial render

  useEffect(() => {
    // Save the tracks to local storage whenever state.tracks changes
    if (state.tracks.length > 0) {
      localStorage.setItem("tracks", JSON.stringify(state.tracks));
    }
  }, [state.tracks]);

  useEffect(() => {
    if (sanitizedTracks !== "") {
      const tracksArray = sanitizedTracks.split("\n");
      tracksArray.forEach((item, index) => {
        if (item == "" || item == "" || item == " ") {
          tracksArray.splice(index, 1);
        }
      });
      searchForSong(tracksArray, 5);
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

  // Wrap the generateAnswer function with additional logic to handle loading state
  const handleGenerateAnswer = async () => {
    // Set the loading state to true to disable the button

    setIsRequestLoading(true);
    console.log("isRequestLoading", isRequestLoading);

    if (sensitivity <= "0.9") {
      await generateAnswer(input, prompt, sensitivity).then(() => {
        setIsRequestLoading(false);
        console.log("senstivity", sensitivity);
        console.log("isRequestLoading", isRequestLoading);
      });
    } else {
      // convert input string into array but dont split
      const inputArrayWithArtist = input.split("\n");

      await searchForSong(inputArrayWithArtist, 3).then(() => {
        // wait a second to allow the tracks to be set in state
        setTimeout(() => {
          setIsRequestLoading(false);
          console.log("inputArrayWithArtist", inputArrayWithArtist);
          console.log("senstivity", sensitivity);
          console.log("isRequestLoading", isRequestLoading);
        }, 1000);
      });
    }

    // Set the loading state back to false to re-enable the button
  };

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

      {state.session ? (
        <div className=" flex h-full min-h-screen">
          <div
            className={` ${
              !fullImage && "bg-transparent !border-x-0"
            } lg:w-3/4 pb-20  px-[5%] bg-[#07173ef2] w-full sm:w-11/12  mx-auto  border-x-2 border-[#4f4f4f3c]`}>
            <Navigation fullImage={fullImage} setFullImage={setFullImage} />
            {fullImage && (
              <>
                <div className="sm:pt-20 transition-all opacity-100 pt-10 border-y-2 border-[#4f4f4f3c]">
                  <div className="xl:w-1/2 w-5/6 mx-auto">
                    <div className="rounded-md bg-[#ffffff42] relative mt-2 flex  px-2 py-2  w-full  border-[1px] border-white">
                      <input
                        onChange={(e) => setInput(e.target.value)}
                        value={input}
                        name="query"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleGenerateAnswer();
                          }
                        }}
                        placeholder={
                          sensitivity == "1"
                            ? "Look for a specific song or artist..."
                            : "Provide a mood, feeling, song, or artist..."
                        }
                        className="focus:outline-none focus:bg-transparent focus:bg-opacity-0 w-full py-1 text-white placeholder-[#cacaca] bg-transparent bg-white bg-opacity-0 rounded-md appearance-none"
                        type="text"
                      />
                      {!isRequestLoading ? (
                        <>
                          <button
                            className="rounded-xl md:text-2xl hover:text-[#d8d8d8] right-4 absolute top-0 bottom-0 text-lg font-medium text-white"
                            onClick={handleGenerateAnswer}>
                            &rarr;
                          </button>
                        </>
                      ) : (
                        <button
                          className="rounded-xl text-md md:text-xl right-4 absolute top-0 bottom-0 font-medium text-black"
                          disabled>
                          <div
                            role="status"
                            className="w-fit flex justify-center m-auto text-center">
                            <svg
                              aria-hidden="true"
                              className="animate-spin fill-purple-600 sm:w-6 sm:h-6 inline w-4 h-4 mr-2 text-white"
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

                  <div className="xl:w-[90%] items-end my-4 h-fit  flex justify-between w-5/6 m-auto">
                    <div>
                      <input
                        onChange={(e) => setSensitivity(e.target.value)}
                        value={sensitivity}
                        name="sensitivity"
                        className="rounded-md bg-[#ffffff42] mt-2 z-20  w-full py-2  border-[1px] border-white"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                      />
                      <div className="flex justify-between text-xs text-white">
                        <label className="" htmlFor="Unique">
                          Random
                        </label>
                        <label htmlFor="Strict">Exact</label>
                      </div>
                    </div>

                    <button
                      className=" justify-center h-full"
                      onClick={() => clearTracks()}>
                      Clear Results
                    </button>
                  </div>
                </div>

                <div className="flex flex-col">
                  {state.tracks.length > 0 ? (
                    state.tracks.map((track, id) => {
                      return (
                        <Track
                          key={id}
                          track={track}
                          index={id}
                          playTrack={playTrack}
                          setShowSpotifyLogin={setShowSpotifyLogin}
                          showSpotifyLogin={showSpotifyLogin}
                        />
                      );
                    })
                  ) : (
                    <div className="text-center my-10 text-xl text-[#9d9d9d]">
                      Search for something to get started...
                    </div>
                  )}
                </div>
              </>
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
          </div>
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </main>
  );
}
