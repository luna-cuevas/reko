import React, { useState } from "react";
import { useStateContext } from "../context/StateContext";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";

// make a type for fullImage prop and set it to boolean
type NavigationProps = {
  fullImage: boolean;
  setFullImage: (fullImage: boolean) => void;
};

const Navigation = ({ fullImage, setFullImage }: NavigationProps) => {
  const { state, setState } = useStateContext();
  const router = useRouter();

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    localStorage.clear();
    router.push("/login");
    // clear session from state
    setState({
      ...state,
      isPlaying: false,
      audioURL: "",
      tracks: [],
      devCredentials: "",
      session: {},
      likedSongs: [],
      track: {
        preview_url: "",
      },
      expiresAt: 0,
      newTracks: [],
      userAuthorizationCode: "",
    });

    if (error) {
      console.error("Error signing out:", error.message);
    }
  };
  return (
    <nav className="flex justify-between my-4">
      <h1
        className={`${
          !fullImage && "invisible"
        } sm:text-4xl ml-6 text-2xl font-bold`}>
        Reko
      </h1>
      <div className=" flex justify-end gap-6 mr-6 text-white">
        <button>
          <Link href="/">Home</Link>
        </button>
        <button>
          <Link href="/profile">Liked</Link>
        </button>
        <button className="" onClick={signOut}>
          Sign Out
        </button>
        <button
          onClick={() => {
            setFullImage(!fullImage);
          }}>
          <img className="w-[20px]" src="images/image-icon.png" alt="" />
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
