import React, { useEffect, useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabaseClient';
import { useStateContext } from '../context/StateContext';
import { useRouter } from 'next/router';

const login = () => {
  const { state, setState } = useStateContext();
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState('');
  const [imageIsLoading, setImageIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loginPopUp, setLoginPopUp] = useState(false);

  const prompt =
    'Generate an image based around music, art, abstract visuals, psychedelics, fairies, festivals';

  const handleAuthChange = async (event: any, session: any) => {
    console.log('handleAuthChange', event, session);
    if (event === 'SIGNED_IN' && session !== null) {
      // Redirect to the homepage when the user logs in
      localStorage.setItem('session', JSON.stringify(session));
      setState({
        ...state,
        session: session,
      });
      router.push('/');
    }
  };

  useEffect(() => {
    setLoading(true);
    const { data: authListener } =
      supabase.auth.onAuthStateChange(handleAuthChange);
    setLoading(false);

    // call dalleAI api to generate image
    const generateImage = async () => {
      try {
        // Make a request to the DALL·E API to generate the image
        console.log('Calling DALL·E API...');
        const response = await fetch('/api/dalleAI', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
        });

        const data = await response.json();

        // Set the URL of the generated image
        setImageUrl(data.imageUrl);

        // Save the imageUrl in localStorage
        localStorage.setItem('imageUrl', data.imageUrl);
      } catch (error) {
        console.error('Error during DALL·E API call:', error);
      } finally {
        setImageIsLoading(false);
        setLoading(false);
        console.log('DALL·E API call finished');
      }
    };
    generateImage();

    return () => authListener.subscription.unsubscribe();
  }, []);

  return (
    <main
      style={{
        backgroundColor: imageIsLoading ? '#07173e' : 'transparent',
        transition: 'background-color 2s ease-in-out',
      }}
      className="h-fit flex flex-col relative mx-[5%] sm:mx-auto justify-center min-h-screen text-white ">
      {imageIsLoading && imageUrl != '' ? (
        <div className="bg-[#07173e] transition-opacity opacity-100 -z-10 fixed top-0 left-0 w-full h-full" />
      ) : (
        <div className="-z-10 fixed top-0 left-0 w-full h-full transition-opacity opacity-100">
          <img
            src={imageUrl || ''}
            alt="Generated image"
            className="object-cover w-full h-full"
            onLoad={() => setImageIsLoading(false)}
          />
        </div>
      )}
      <div className=" flex flex-col h-full min-h-screen">
        <div
          className={`xl:w-2/3 py-2 md:w-3/4  px-[5%] bg-[#07173ef2] w-full sm:w-11/12 h-full mx-auto  border-x-2 border-[#4f4f4f3c]`}>
          <nav className="flex justify-between my-4">
            <h1 className={`sm:text-4xl ml-6 text-2xl font-bold`}>Reko</h1>
            <button onClick={() => setLoginPopUp(!loginPopUp)}>Login</button>
            {loginPopUp && (
              <div className="fixed top-0 bottom-0 left-0 right-0 w-full h-full m-auto">
                <div
                  onClick={() => setLoginPopUp(false)}
                  className="bg-[#0000009b] absolute w-full h-full z-10"
                />
                <div className="w-10/12 md:w-1/3 h-fit absolute m-auto top-0 bottom-0 left-0 rounded-lg right-0 z-10 p-10 bg-[#07173e]">
                  <Auth
                    supabaseClient={supabase}
                    providers={['google']}
                    appearance={{
                      style: {
                        anchor: {
                          color: '#ffffff',
                        },
                        label: {
                          color: '#ffffff',
                        },
                        button: {
                          backgroundColor: '#495571',
                          border: 'none',
                          color: '#ffffff',
                        },
                        input: {
                          backgroundColor: '#495571',
                          color: '#ffffff',
                        },
                      },
                      theme: ThemeSupa,
                    }}
                  />
                </div>
              </div>
            )}
          </nav>
        </div>
        <div className=" bg-[#07173ef2] w-full px-[5%]  sm:w-11/12 xl:w-2/3 md:w-3/4 min-h-screen mx-auto transition-opacity opacity-100 py-10 border-2 border-[#4f4f4f3c]">
          <h1 className="md:text-xl text-lg text-center break-words">
            Your Personalized Music Recommendation Station
          </h1>
          <div className="max-h-[400px] my-6 md:my-4 flex w-full">
            <img
              className=" w-1/2 m-auto"
              src="/images/laptop-mockup.png"
              alt=""
            />
            <img
              className=" w-1/6 m-auto"
              src="/images/iphone-mockup.png"
              alt=""
            />
          </div>

          <div className="flex flex-col mt-10 text-center">
            <p className="md:my-6 md:text-xl text-md my-4">
              Elevate your music experience as Reko tailors song suggestions{' '}
              specifically to your unique tastes and preferences.
            </p>
            <div className="justify-evenly flex w-full m-auto overflow-hidden">
              <div className=" flex w-1/5">
                <img
                  className="object-contain m-auto h-[80px] w-1/2"
                  src="/images/typing.png"
                  alt=""
                />
                <img
                  className="object-contain w-1/4 mx-auto"
                  src="/images/arrow.png"
                  alt=""
                />
              </div>
              <div className=" h-[80px] m-auto flex w-1/5">
                <img
                  className="object-contain w-1/2"
                  src="/images/chatgpt-icon.png"
                  alt=""
                />
                <img
                  className="object-contain w-1/4 mx-auto"
                  src="/images/arrow.png"
                  alt=""
                />
              </div>
              <div className="h-[80px] m-auto flex w-1/5">
                <img
                  className="object-contain w-1/2"
                  src="/images/gpt-results.png"
                  alt=""
                />
                <img
                  className="object-contain w-1/4 mx-auto"
                  src="/images/arrow.png"
                  alt=""
                />
              </div>
              <div className="flex h-[60px] m-auto w-1/5">
                <img
                  className="object-contain w-1/2"
                  src="/images/heart-icon-red.png"
                  alt=""
                />
                <img
                  className="object-contain w-1/4 mx-auto"
                  src="/images/arrow.png"
                  alt=""
                />
              </div>
              <div className="flex w-1/5">
                <img
                  className="object-contain w-1/2"
                  src="/images/improvement.png"
                  alt=""
                />
              </div>
            </div>
            <p className="md:my-6 md:text-xl text-md my-4">
              Whether you're searching for a track that matches your mood,
              captures a particular feeling, or fulfills a specific musical
              inquiry, Reko is here to serve you.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default login;
