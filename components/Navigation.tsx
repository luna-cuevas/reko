import React, { useState } from "react";
import { useStateContext } from "../context/StateContext";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";

type NavigationProps = {
  fullImage: boolean;
  setFullImage: (fullImage: boolean) => void;
};

const Navigation = ({ fullImage, setFullImage }: NavigationProps) => {
  const { state, setState } = useStateContext();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    localStorage.clear();
    router.push("/login");
    setState({
      ...state,
      isPlaying: false,
      audioURL: "",
      tracks: [],
      devCredentials: "",
      session: {},
      likedSongs: [],
      track: {
        duration_ms: 0,
        preview_url: "",
        album: {
          images: [
            {
              url: "",
            },
          ],
        },
        name: "",
        artists: [
          {
            name: "",
          },
        ],
      },
      expiresAt: 0,
      newTracks: [],
      userAuthorizationCode: "",
    });

    if (error) {
      console.error("Error signing out:", error.message);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className=" flex justify-between my-4">
      <h1
        className={`${
          !fullImage && "invisible"
        } sm:text-4xl ml-6 text-2xl font-bold`}>
        Reko
      </h1>
      <div className="flex justify-end gap-6 mr-6 text-white">
        <button className={`sm:hidden`} onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? (
            <svg className={`w-6 h-6 `} viewBox="0 0 24 24" fill="none">
              <path
                d="M6 18L18 6M6 6l12 12"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              className={`w-6 h-6 `}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
        <div
          className={`flex flex-col sm:flex-row sm:flex items-center gap-6 ${
            isMobileMenuOpen
              ? "fixed top-16 m-auto z-[1000] left-0 w-10/12 right-0 h-fit bg-[#07173e] p-8"
              : "hidden"
          }`}>
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
      </div>
    </nav>
  );
};

export default Navigation;
