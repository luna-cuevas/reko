import { useEffect, useState } from "react";

const useSpotifySDK = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    window.onSpotifyWebPlaybackSDKReady = () => {
      setIsReady(true);
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return isReady;
};

export default useSpotifySDK;
