import { useEffect, useState } from "react";
import useSpotifySDK from "../lib/useSpotifySDK";
import { useStateContext } from "../context/StateContext";
import {
  TrackData,
  OpenAIAPIResponse,
  SpotifyAPIResponse,
} from "../components/types";

// Define the TypeScript type for the useSpotify hook's return value.
type UseSpotifyHook = {
  searchForSong: (tracksArray: string[]) => Promise<void>;
  playTrack: (track: any) => void;
  refreshAccessToken: () => Promise<void>;
  userAuthorizationCode: string;
  authorizeWithSpotify: () => void;
  showSpotifyLogin: boolean;
  genreString: string | "";
  // Other functions and state variables related to Spotify
};

export const useSpotify = (): UseSpotifyHook => {
  // State variable to store the Spotify access token.
  const [devCredentials, setDevCredentials] = useState<string | null>(null);
  // Other state variables and logic related to Spotify.
  const isSDKReady = useSpotifySDK();
  const [userAuthorizationCode, setUserAuthorizationCode] = useState("");
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState(null);
  const [showSpotifyLogin, setShowSpotifyLogin] = useState(false);
  const [currentTrackUri, setCurrentTrackUri] = useState<string | null>(null);
  const [genreString, setGenreString] = useState("");

  const { state, setState } = useStateContext();

  const saveAllSongsToLocalStorage = (tracks: TrackData[]) => {
    localStorage.setItem("allSongs", JSON.stringify(tracks));
  };

  const handleUserAuthorizationCode = (userAuthorizationCode: string) => {
    setState({
      ...state,
      userAuthorizationCode: userAuthorizationCode,
    });
    setUserAuthorizationCode(userAuthorizationCode);

    localStorage.setItem("userAuthorizationCode", userAuthorizationCode);
  };

  // useEffect hook to handle the initial fetching of the Spotify access token.
  useEffect(() => {
    const userAuthorizationCode = localStorage.getItem("userAuthorizationCode");

    if (userAuthorizationCode !== null) {
      handleUserAuthorizationCode(userAuthorizationCode);
    }
  }, []);

  const authorizeWithSpotify = () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const redirectUri = "http://localhost:3000/spotifyCallback/";
    const scopes = ["streaming", "user-read-email", "user-read-private"];

    // Join the scopes with a space separator and encode the parameter
    const scopeParam = encodeURIComponent(scopes.join(" "));

    // Construct the authorization URL
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scopeParam}&response_type=token`;

    // Redirect the user to the authorization URL
    window.location.href = authUrl;
    setShowSpotifyLogin(false);
  };

  useEffect(() => {
    if (!isSDKReady || !userAuthorizationCode) return;

    const playerInstance = new window.Spotify.Player({
      name: "Reko Player",
      getOAuthToken: (cb: any) => cb(userAuthorizationCode),
    });

    playerInstance.connect();

    playerInstance.on("ready", ({ device_id }: any) => {
      setPlayer(playerInstance);
      setDeviceId(device_id);
    });

    return () => {
      if (playerInstance) {
        playerInstance.disconnect();
      }
    };
  }, [isSDKReady]);
  // Function to refresh the Spotify access token.
  const refreshAccessToken = async () => {
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
      setState({ ...state, devCredentials: accessToken });
      setDevCredentials(accessToken);
      localStorage.setItem("devCredentials", accessToken);
      console.log("Access token refreshed");
      // make search for song function request again with new access token
      // const savedSanitizedTrack = localStorage.getItem('savedSanitizedTrack')
      // if (savedSanitizedTrack) {
      //   searchForSong(savedSanitizedTrack)
      // }
    } else {
      console.error("Failed to refresh access token");
    }
  };

  useEffect(() => {
    if (devCredentials) {
      const interval = setInterval(() => {
        refreshAccessToken();
        console.log("Refreshing access token");
      }, 3600000);
      return () => clearInterval(interval);
    }
  }, [devCredentials]);

  // Function to search for a song on Spotify based on sanitized track information.
  const searchForSong = async (tracksArray: any) => {
    localStorage.setItem("savedSanitizedTrack", tracksArray);
    const devCredentials =
      localStorage.getItem("devCredentials") || state.devCredentials;

    if (!devCredentials) {
      console.error("Access token not available. Refreshing access token.");
      await refreshAccessToken();
      return;
    }

    tracksArray.forEach(async (item: any, index: number) => {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${item}&type=track&limit=5`,
        {
          headers: {
            Authorization: "Bearer " + devCredentials,
          },
        }
      );

      // Check for error response from Spotify API and refresh the access token.
      if (!response.ok) {
        console.error(
          "Error in searchForSong API call. Refreshing access token."
        );
        await refreshAccessToken();
        return;
      }

      const data: SpotifyAPIResponse = await response.json();

      const newTracks = data.tracks?.items || [];
      const allTracks = [...state.tracks, ...newTracks];
      setState({ ...state, newTracks: newTracks, tracks: allTracks });
      saveAllSongsToLocalStorage(allTracks); // Save to local storage

      // Get a list of artist IDs from the tracks.
      const artistIds = new Set();
      newTracks.forEach((track) => {
        track.artists.forEach((artist) => {
          artistIds.add(artist.id);
        });
      });

      // Retrieve artist information using the "Get Several Artists" endpoint.
      const artistResponse = await fetch(
        `https://api.spotify.com/v1/artists?ids=${Array.from(artistIds).join(
          ","
        )}`,
        {
          headers: {
            Authorization: "Bearer " + devCredentials,
          },
        }
      );
      const artistData = await artistResponse.json();

      // Accumulate all genres from the retrieved artists.
      let allGenres: string[] = [];
      artistData.artists.forEach((artist: any) => {
        allGenres.push(...artist.genres);
      });

      // Obtain unique genres and join them into a single string.
      const uniqueGenres = Array.from(new Set(allGenres));
      const genresString = uniqueGenres.join(", ");

      // Use genresString to send to DALL·E API or perform other actions.
      setGenreString(genresString);
    });
  };

  // Function to play or pause a track on Spotify.
  const playTrack = (track: any) => {
    const trackUri = track.uri;
    if (player && deviceId) {
      player._options.getOAuthToken((accessToken: string) => {
        if (!state.isPlaying || currentTrackUri != trackUri) {
          // If no track is playing or a different track is selected, start the new track
          fetch(
            `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
            {
              method: "PUT",
              body: JSON.stringify({ uris: [trackUri] }),
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
            }
          )
            .then((response) => {
              if (response.ok) {
                setCurrentTrackUri(trackUri); // Update the current track URI
                setState({
                  ...state,
                  audioURL: trackUri,
                  isPlaying: true,
                  track: track,
                });
              } else {
                console.error(
                  `Error playing track. Status: ${response.status}`
                );
              }
            })
            .catch((error) => {
              console.error(`Error playing track: ${error.message}`);
            });
        } else {
          // If the selected track is already playing, pause playback
          fetch(
            `https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
            }
          )
            .then((response) => {
              if (response.ok) {
                setState({ ...state, isPlaying: false, track: track });
                setShowSpotifyLogin(true);
              } else {
                console.error(
                  `Error pausing track. Status: ${response.status}`
                );
              }
            })
            .catch((error) => {
              console.error(`Error pausing track: ${error.message}`);
            });
        }
      });
    } else {
      setShowSpotifyLogin(true);
    }
  };

  return {
    searchForSong,
    playTrack,
    refreshAccessToken,
    userAuthorizationCode,
    authorizeWithSpotify,
    showSpotifyLogin,
    genreString,
  };
};
