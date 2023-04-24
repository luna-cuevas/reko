import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useStateContext } from "../context/StateContext";

const SpotifyCallback = () => {
  const { setState } = useStateContext();
  const router = useRouter();

  useEffect(() => {
    // Extract access token from URL fragment
    const hashFragment = window.location.hash.substring(1);
    const params = new URLSearchParams(hashFragment);
    const accessToken = params.get("access_token");

    // Store access token in state/context
    setState((prevState) => ({
      ...prevState,
      userAuthorizationCode: accessToken,
    }));

    localStorage.setItem("userAuthorizationCode", accessToken);

    if (accessToken) {
      router.push("/");
    }
  }, []);

  return <div>Processing Spotify callback...</div>;
};

export default SpotifyCallback;
