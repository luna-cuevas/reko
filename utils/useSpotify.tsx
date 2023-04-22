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
  token: string | null;
  searchForSong: (sanitizedTracks: string) => Promise<void>;
  playTrack: (track: any) => void;
  refreshAccessToken: () => Promise<void>;
  spotifyAccessToken: string;
  authorizeWithSpotify: () => void;
  showSpotifyLogin: boolean;
  // Other functions and state variables related to Spotify
};

export const useSpotify = (): UseSpotifyHook => {
  // State variable to store the Spotify access token.
  const [token, setToken] = useState<string | null>(null);
  // Other state variables and logic related to Spotify.
  const isSDKReady = useSpotifySDK();
  const [spotifyAccessToken, setSpotifyAccessToken] = useState("");
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState(null);
  const [showSpotifyLogin, setShowSpotifyLogin] = useState(false);
  const [currentTrackUri, setCurrentTrackUri] = useState<string | null>(null);

  const { state, setState } = useStateContext();

  const saveAllSongsToLocalStorage = (tracks: TrackData[]) => {
    localStorage.setItem("allSongs", JSON.stringify(tracks));
  };

  const handleSpotifyAccessToken = (accessToken: string) => {
    setState({
      ...state,
      spotifyAccessToken: accessToken,
    });
    setSpotifyAccessToken(accessToken);

    localStorage.setItem("spotifyAccessToken", accessToken);
  };

  // useEffect hook to handle the initial fetching of the Spotify access token.
  useEffect(() => {
    const accessToken = localStorage.getItem("spotifyAccessToken");

    if (accessToken) {
      handleSpotifyAccessToken(accessToken);
    }
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
    if (!isSDKReady || !spotifyAccessToken) return;

    console.log("access token", spotifyAccessToken);

    const playerInstance = new window.Spotify.Player({
      name: "Reko Player",
      getOAuthToken: (cb: any) => cb(spotifyAccessToken),
    });

    playerInstance.connect();

    playerInstance.on("ready", ({ device_id }: any) => {
      console.log("Device ID:", device_id);
      setPlayer(playerInstance);
      setDeviceId(device_id);
    });

    return () => {
      if (playerInstance) {
        playerInstance.disconnect();
      }
    };
  }, [isSDKReady]);

  useEffect(() => {
    if (token) {
      const interval = setInterval(() => {
        refreshAccessToken();
        console.log("Refreshing access token");
      }, 3600000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Function to search for a song on Spotify based on sanitized track information.
  const searchForSong = async (sanitizedTracks: string) => {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${sanitizedTracks}&type=track&limit=3`,
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );

    const data: SpotifyAPIResponse = await response.json();

    const newTracks = [...state.tracks, ...data.tracks.items];
    setState({ ...state, tracks: newTracks });
    saveAllSongsToLocalStorage(newTracks); // Save to local storage
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
      console.log("Access Token:", accessToken);
      setToken(accessToken);
    } else {
      console.error("Failed to refresh access token");
    }
  };

  // Return the relevant functions and state variables from the hook.
  return {
    token,
    searchForSong,
    playTrack,
    refreshAccessToken,
    spotifyAccessToken,
    authorizeWithSpotify,
    showSpotifyLogin,
    // Other functions and state variables related to Spotify.
  };
};
