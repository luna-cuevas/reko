import React from "react";

type SpotifyLoginPopUpProps = {
  authorizeWithSpotify: () => void;
};

const spotifyLoginPopUp: React.FC<SpotifyLoginPopUpProps> = ({
  authorizeWithSpotify,
}) => {
  return (
    // a pop that hovers over the page up asking the user if they want to login to spotify
    <div className="fixed top-0 left-0 z-50 flex items-center justify-center w-full h-full bg-black bg-opacity-50">
      <div className="h-1/2 flex flex-col items-center justify-center w-1/2 bg-white">
        <h1 className="text-2xl font-bold">Login to Spotify</h1>
        <p className="text-lg">To use this app, you need to login to Spotify</p>
        <button
          onClick={authorizeWithSpotify}
          className="px-4 py-2 mt-4 text-white bg-blue-500 rounded-lg">
          Login
        </button>
      </div>
    </div>
  );
};

export default spotifyLoginPopUp;
