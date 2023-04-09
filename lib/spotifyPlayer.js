import React, { useState, useEffect } from "react";
import useSpotifySDK from "./useSpotifySDK";

const SpotifyPlayer = ({ accessToken }) => {
  const isSDKReady = useSpotifySDK();
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    if (!isSDKReady || !accessToken) return;

    const playerInstance = new window.Spotify.Player({
      name: "Your App Name",
      getOAuthToken: (cb) => cb(accessToken),
    });

    playerInstance.connect();

    playerInstance.on("ready", ({ device_id }) => {
      console.log("Device ID:", device_id);
      setPlayer(playerInstance);
    });

    return () => {
      if (player) player.disconnect();
    };
  }, [isSDKReady, accessToken]);

  // Your component logic...

  return <div>test</div>;
};

export default SpotifyPlayer;
