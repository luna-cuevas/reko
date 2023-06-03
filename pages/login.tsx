import React, { useEffect, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "../lib/supabaseClient";
import { useStateContext } from "../context/StateContext";
import { useRouter } from "next/router";

const login = () => {
  const { state, setState } = useStateContext();
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState("");
  const [imageIsLoading, setImageIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const prompt =
    "Generate an image based around music, art, abstract visuals, psychedelics, fairies, festivals";

  useEffect(() => {
    setLoading(true);
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          // Redirect to the homepage when the user logs in
          router.push("/");
          localStorage.setItem("session", JSON.stringify(session));
          setState({
            ...state,
            session,
          });
        }
      }
    );
    setLoading(false);

    // call dalleAI api to generate image
    const generateImage = async () => {
      try {
        // Make a request to the DALL·E 2.0 API to generate the image
        console.log("Calling DALL·E API...");
        const response = await fetch("/api/dalleAI", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        });

        const data = await response.json();

        // Set the URL of the generated image
        setImageUrl(data.imageUrl);

        // Save the imageUrl in localStorage
        localStorage.setItem("imageUrl", data.imageUrl);
      } catch (error) {
        console.error("Error during DALL·E API call:", error);
      } finally {
        setImageIsLoading(false);
        setLoading(false);
        console.log("DALL·E API call finished");
      }
    };
    generateImage();

    return () => authListener.subscription.unsubscribe();
  }, []);

  return (
    <main
      style={{
        backgroundColor: imageIsLoading ? "#07173e" : "transparent",
        transition: "background-color 2s ease-in-out",
      }}
      className="h-fit flex flex-col mx-[5%] sm:mx-auto justify-center min-h-screen text-white ">
      {imageIsLoading && imageUrl != "" ? (
        <div className="bg-[#07173e] transition-opacity opacity-100 -z-10 fixed top-0 left-0 w-full h-full" />
      ) : (
        <div className="-z-10 fixed top-0 left-0 w-full h-full transition-opacity opacity-100">
          <img
            src={imageUrl || ""}
            alt="Generated image"
            className="object-cover w-full h-full"
            onLoad={() => setImageIsLoading(false)}
          />
        </div>
      )}
      <div className=" flex flex-col h-full min-h-screen">
        <div
          className={`xl:w-1/2 py-2 md:w-3/4  px-[5%] bg-[#07173ef2] w-full sm:w-11/12 h-full mx-auto  border-x-2 border-[#4f4f4f3c]`}>
          <nav className="flex justify-between my-4">
            <h1 className={`sm:text-4xl ml-6 text-2xl font-bold`}>Reko</h1>
          </nav>
        </div>
        <div className=" bg-[#07173ef2] w-full px-[5%]  sm:w-11/12 xl:w-1/2 md:w-3/4 min-h-screen mx-auto transition-opacity opacity-100 py-10 border-2 border-[#4f4f4f3c]">
          <div className="h-[500px]">
            <h1 className="text-lg">
              Welcome to Reko: <br /> Your Personalized Music Recommendation
              Station
            </h1>
            <img src="/images/iphone-mockup.png" alt="" />
          </div>
          <div>
            <p>
              Discover the perfect soundtrack for every moment with Reko, a
              revolutionary music recommendation application powered by OpenAI's
              GPT-3.5 language model. Elevate your music experience as Reko
              tailors song suggestions specifically to your unique tastes and
              preferences. Whether you're searching for a track that matches
              your mood, captures a particular feeling, or fulfills a specific
              musical inquiry, Reko is here to serve you.
            </p>
            <div className="flex">
              <div>
                <img src="" alt="" />
                <div>
                  <h3>🎼 Personalized Song Recommendations:</h3>
                  <p>
                    Harnessing the power of GPT-3, Reko generates tailored song
                    recommendations that align perfectly with your mood,
                    feeling, or specific query. Explore a world of music catered
                    just for you.
                  </p>
                </div>
              </div>
              <div>
                <img src="" alt="" />
                <div>
                  <h3>🔊 Preview Playback:</h3>
                  <p>
                    Curiosity piqued by a recommended track? Dive in deeper and
                    listen to a preview right within the app. Experience a
                    snippet of the song before deciding to explore further.
                  </p>
                </div>
              </div>
              <div>
                <img src="" alt="" />
                <div>
                  <h3>🔗 Spotify Integration:</h3>
                  <p>
                    Love what you hear? With just a single click, seamlessly
                    access the full song on Spotify. Let Reko be your gateway to
                    discovering and enjoying your favorite tracks on one of the
                    world's leading music platforms.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="  m-auto my-4 md:w-3/4   p-5 bg-[#ffffff2c]">
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-2xl font-bold">Login</h1>
            </div>
            {loading ? (
              <p>Loading ...</p>
            ) : (
              <>
                <Auth
                  supabaseClient={supabase}
                  providers={["google", "github", "spotify"]}
                  appearance={{
                    style: {
                      anchor: {
                        color: "#ffffff",
                      },
                      label: {
                        color: "#ffffff",
                      },
                      button: {
                        backgroundColor: "#07173e",
                        border: "none",
                        color: "#ffffff",
                      },
                    },
                    theme: ThemeSupa,
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default login;
