import React, { useState } from "react";
import { useStateContext } from "../context/StateContext";

type SpotifyLoginPopUpProps = {
  authorizeWithSpotify: () => void;
  setShowSpotifyLogin: (showSpotifyLogin: boolean) => void;
  showSpotifyLogin: boolean;
  // playPreview: () => void;
};

const spotifyLoginPopUp: React.FC<SpotifyLoginPopUpProps> = ({
  authorizeWithSpotify,
  setShowSpotifyLogin,
  showSpotifyLogin,
  // playPreview,
}) => {
  const { state, setState } = useStateContext();

  return (
    <div className="fixed top-0 left-0 z-50 flex items-center justify-center w-full h-full text-[#040b1c] bg-black bg-opacity-50">
      <div
        onClick={() => {
          setShowSpotifyLogin(!showSpotifyLogin);
          setState({
            ...state,
            isPlaying: false,
            previewURL: "",
          });
        }}
        className=" absolute z-10 w-full h-full"
      />
      <div className="h-fit w-fit z-20 flex flex-col items-center justify-center p-10 bg-white">
        <h1 className="text-2xl font-bold">Login to Spotify Required</h1>
        <p className="mb-2 text-lg">To listen to the full track</p>
        <button
          onClick={authorizeWithSpotify}
          className="px-4 py-2 text-white bg-[#07173e] rounded-lg">
          Login
        </button>
        <h1 className="my-4 text-xl font-bold">- Or - </h1>

        <h1 className="mb-2 text-xl font-bold">Preview the song </h1>
        <button
          onClick={() => {
            // playPreview();
            setShowSpotifyLogin(!showSpotifyLogin);
            setState({
              ...state,
              isPlaying: true,
            });
            console.log("isPlaying", state.isPlaying);
            console.log("previewURL", state.previewURL);
          }}
          className="px-4 py-2 text-white bg-[#07173e] rounded-lg">
          Preview
        </button>
      </div>
    </div>
  );
};

export default spotifyLoginPopUp;
