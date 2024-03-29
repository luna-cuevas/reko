import { useEffect, useState } from 'react';
import useSpotifySDK from '../lib/useSpotifySDK';
import { useStateContext } from '../context/StateContext';
import { TrackData, SpotifyAPIResponse } from '../components/types';
import { supabase } from '../lib/supabaseClient';

// Define the TypeScript type for the useSpotify hook's return value.
type UseSpotifyHook = {
  searchForSong: (tracksArray: string[], limit: number) => Promise<void>;
  playTrack: (track: any) => void;
  refreshDevToken: () => Promise<void>;
  userAuthorizationCode: string;
  authorizeWithSpotify: () => void;
  showSpotifyLogin: boolean;
  setShowSpotifyLogin: (showSpotifyLogin: boolean) => void;
  genreString: string | '';
  exportLikedSongsAsPlaylist: (
    playlistName: string,
    playlistDescription: string,
    isPublic: boolean
  ) => Promise<void>;
};

export const useSpotify = (): UseSpotifyHook => {
  // State variable to store the Spotify access token.
  const [devCredentials, setDevCredentials] = useState<string | null>(null);
  // Other state variables and logic related to Spotify.
  const isSDKReady = useSpotifySDK();
  const [userAuthorizationCode, setUserAuthorizationCode] = useState('');
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState('');
  const [showSpotifyLogin, setShowSpotifyLogin] = useState(false);
  const [currentTrackUri, setCurrentTrackUri] = useState<string | null>(null);
  const [genreString, setGenreString] = useState('');
  const { state, setState } = useStateContext();
  const [session, setSession] = useState<any>({});

  useEffect(() => {
    // get session from local storage or session state
    setSession(
      state.session || JSON.parse(localStorage.getItem('session') || '{}')
    );
  }, []);

  const handleUserAuthorizationCode = (userAuthorizationCode: string) => {
    setState({
      ...state,
      userAuthorizationCode: userAuthorizationCode,
    });
    setUserAuthorizationCode(userAuthorizationCode);

    localStorage.setItem('userAuthorizationCode', userAuthorizationCode);
  };

  const exportLikedSongsAsPlaylist = async (
    playlistName: string,
    playlistDescription: string,
    isPublic: boolean
  ) => {
    // Check if the user is authenticated
    if (!userAuthorizationCode) {
      console.error('User is not authenticated.');
      return;
    }

    const { data: likedSongs, error } = (await supabase
      .from('liked_songs')
      .select('*')
      .eq('user_id', session.user.id)) as any;

    console.log('likedSongs', likedSongs);

    // Check if there are liked songs to export
    if (likedSongs.length === 0) {
      console.error('No liked songs to export.');
      return;
    }

    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${userAuthorizationCode}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const user_id = data.id;

        const createPlaylistResponse = await fetch(
          `https://api.spotify.com/v1/users/${user_id}/playlists`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${userAuthorizationCode}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: playlistName,
              description: playlistDescription,
              public: isPublic,
            }),
          }
        );

        if (!createPlaylistResponse.ok) {
          console.error('Failed to create the playlist.');
          return;
        }

        const { id: playlistId } = await createPlaylistResponse.json();

        // Get the track URIs of the liked songs
        const trackUris = likedSongs.map((track: any) => track.track.uri);

        // Add the tracks to the playlist
        const addTracksResponse = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${userAuthorizationCode}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              uris: trackUris,
            }),
          }
        );

        if (!addTracksResponse.ok) {
          console.error('Failed to add tracks to the playlist.');
          return;
        }

        console.log('Exported liked songs as a playlist.');
      } else {
        console.error('Failed to fetch user info.');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
    // };

    try {
      // Create the playlist
    } catch (error) {
      console.error('Error exporting liked songs as a playlist:', error);
    }
  };

  // useEffect hook to handle the initial fetching of the Spotify access token.
  useEffect(() => {
    const userAuthorizationCode =
      localStorage.getItem('userAuthorizationCode') ||
      state.userAuthorizationCode;

    if (userAuthorizationCode != '') {
      handleUserAuthorizationCode(userAuthorizationCode);
    }
  }, []);

  const authorizeWithSpotify = () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const redirectUri =
      process.env.NODE_ENV !== 'production'
        ? 'http://localhost:3001/spotifyCallback/'
        : 'https://reko.vercel.app/spotifyCallback/';
    const scopes = [
      'streaming',
      'user-read-email',
      'user-read-private',
      'playlist-modify-public',
      'playlist-modify-private',
    ];

    // Join the scopes with a space separator and encode the parameter
    const scopeParam = encodeURIComponent(scopes.join(' '));

    // Construct the authorization URL
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scopeParam}&response_type=token`;

    // Redirect the user to the authorization URL
    window.location.href = authUrl;
    setShowSpotifyLogin(false);
  };

  useEffect(() => {
    if (!isSDKReady) return console.log('not ready');

    const playerInstance = new window.Spotify.Player({
      name: 'Reko Player',
      getOAuthToken: (cb: any) => cb(userAuthorizationCode),
    });

    playerInstance.connect();

    playerInstance.on('ready', ({ device_id }: any) => {
      setPlayer(playerInstance);
      setDeviceId(device_id);

      localStorage.setItem('player', JSON.stringify(playerInstance));
    });

    playerInstance.on('player_state_changed', (state: any) => {
      if (state) {
        const trackUri = state.track_window.current_track.uri;
        setCurrentTrackUri(trackUri);
      }
    });

    return () => {
      if (playerInstance) {
        playerInstance.disconnect();
      }
    };
  }, [isSDKReady]);

  // Function to refresh the Spotify access token.
  const refreshDevToken = async () => {
    // Get the refresh token, client ID, and client secret from environment variables
    const refresh_token = process.env.NEXT_PUBLIC_SPOTIFY_REFRESH_TOKEN;
    const client_id = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const client_secret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET; // Use the client secret here

    // Construct the authorization header with the client ID and client secret
    const authHeader = Buffer.from(client_id + ':' + client_secret).toString(
      'base64'
    );

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + authHeader, // Use the Basic authorization header
        },
        body: `grant_type=refresh_token&refresh_token=${refresh_token}`, // Include the necessary scopes
      });

      if (response.ok) {
        const data = await response.json();
        const accessToken = data.access_token;
        setState({ ...state, devCredentials: accessToken });
        setDevCredentials(accessToken);
        localStorage.setItem('devCredentials', accessToken);
        console.log('dev token refreshed');
      } else {
        console.error('Failed to refresh access token');
      }
    } catch (error: any) {
      console.error('Error refreshing access token:', error.message);
    }
  };

  // check if devCredentials is available if not refresh it
  useEffect(() => {
    const devCredentials =
      localStorage.getItem('devCredentials') || state.devCredentials;

    if (!devCredentials) {
      console.error('Access token not available. Refreshing access token.');
      refreshDevToken();
    }
  }, []);

  useEffect(() => {
    if (devCredentials) {
      const interval = setInterval(() => {
        refreshDevToken();
        console.log('Refreshing access token');
      }, 3600000);
      return () => clearInterval(interval);
    }
  }, [devCredentials]);

  // Function to search for a song on Spotify based on sanitized track information.
  const searchForSong = async (tracksArray: any, limit: number) => {
    const devCredentials =
      localStorage.getItem('devCredentials') ||
      process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;

    if (!devCredentials) {
      console.error('Access token not available. Refreshing access token.');
      await refreshDevToken().then(() => {
        searchForSong(tracksArray, limit);
      });
    } else {
      console.log('searching for song');
      tracksArray.forEach(async (item: any, index: number) => {
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=${item}&type=track&limit=${limit}`,
          {
            headers: {
              Authorization: 'Bearer ' + devCredentials || state.devCredentials,
            },
          }
        );

        const data: SpotifyAPIResponse = await response.json();

        if (data.error) {
          console.error('Error searching for song:', data.error.message);
          refreshDevToken();
        }

        const newTracks = data.tracks?.items || [];
        // console.log("new tracks", newTracks);
        const allTracks = [...state.tracks, ...newTracks];
        setState({ ...state, newTracks: newTracks, tracks: allTracks });

        const saveAllSongsToLocalStorage = (tracks: TrackData[]) => {
          localStorage.setItem('tracks', JSON.stringify(tracks));
        };

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
            ','
          )}`,
          {
            headers: {
              Authorization: 'Bearer ' + devCredentials,
            },
          }
        );
        const artistData = await artistResponse.json();

        // Accumulate all genres from the retrieved artists.
        let allGenres: string[] = [];
        artistData?.artists?.forEach((artist: any) => {
          allGenres.push(...artist.genres);
        });

        // Obtain unique genres and join them into a single string.
        const uniqueGenres = Array.from(new Set(allGenres));
        const genresString = uniqueGenres.join(', ');

        // Use genresString to send to DALL·E API or perform other actions.
        setGenreString(genresString);
      });
    }
  };

  // Function to play or pause a track on Spotify.
  const playTrack = (track: any) => {
    console.log('initializing play');
    const trackUri = track.uri;

    if (player && deviceId) {
      player._options.getOAuthToken((accessToken: string) => {
        if (!state.isPlaying || currentTrackUri != trackUri) {
          // If no track is playing or a different track is selected, start the new track
          fetch(
            `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
            {
              method: 'PUT',
              body: JSON.stringify({ uris: [trackUri] }),
              headers: {
                'Content-Type': 'application/json',
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
                  deviceID: deviceId,
                  userAuthorizationCode: accessToken,
                });
                setUserAuthorizationCode(accessToken);
                console.log('new track playing');
                // read the response body and parse as JSON
                return response;
              } else {
                console.error(
                  `Error playing track. Status: ${response.status}`
                );
              }
            })
            .catch((error) => {
              console.error(`Error playing track: ${error.message}`);
            });
        } else if (state.isPlaying) {
          // If the selected track is already playing, pause playback
          fetch(
            `https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
            }
          )
            .then((response) => {
              if (response.ok) {
                setState({
                  ...state,
                  isPlaying: false,
                  track: track,
                });
                console.log('track paused: ');
                setShowSpotifyLogin(false);
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
      console.log('finishing play');
    } else {
      setShowSpotifyLogin(true);
    }
  };

  return {
    searchForSong,
    setShowSpotifyLogin,
    exportLikedSongsAsPlaylist,
    playTrack,
    refreshDevToken,
    userAuthorizationCode,
    authorizeWithSpotify,
    showSpotifyLogin,
    genreString,
  };
};
