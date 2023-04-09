"use client";
import { useEffect, useState } from 'react'
import Track from '../components/Track';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [generatedAnswer, setGeneratedAnswer] = useState("");
  const [sanitizedTracks, setSanitizedTracks] = useState("");
  const [input, setInput] = useState("");
  const [tracks, setTracks] = useState([]);

  const prompt = `Give me a song based on this mood, feeling, or specific query: ${input}`

  const generateAnswer = async (e: any) => {
    if (input !== "") {
      e.preventDefault();
      setGeneratedAnswer("");
      setLoading(true);
  
      try {
        const response = await fetch("/api/openAI", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: prompt,
          }),
        });
  
        const answer = await response.json();
        console.log(answer);
        setGeneratedAnswer(answer.data.choices[0].text);
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Error during OpenAI API call: ${error.message}`);
        } else {
          console.error('Unknown error occurred during OpenAI API call:', error);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setSanitizedTracks(
      generatedAnswer
    );
  }, [generatedAnswer]);

  useEffect(() => {
    if (sanitizedTracks !== "") {
      searchForSong(sanitizedTracks);
    }
  }, [sanitizedTracks]);


  useEffect(() => {
    const response = fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID + ':' + process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET).toString('base64')
      },
      body: 'grant_type=client_credentials'
    }).then(response => response.json()).then(data => {
      // console.log(data)
      setToken(data.access_token)
    }).catch(error => {
      console.error(error)
    });

    console.log(token)
  }, []);

  useEffect(() => {
    if (token) {
      const interval = setInterval(() => {
        refreshAccessToken();
        console.log('Refreshing access token');
      }, 3600000);
      return () => clearInterval(interval);
    }
  }, [token]);


  async function refreshAccessToken() {
    const authHeader = 'Basic ' + Buffer.from(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID + ':' + process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET).toString('base64');
  
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader
      },
      body: `grant_type=refresh_token&refresh_token=${process.env.NEXT_PUBLIC_SPOTIFY_REFRESH_TOKEN}`
    });
  
    if (response.ok) {
      const data = await response.json();
      const accessToken = data.access_token;
      // Use the access token or store it for later use
      console.log('Access Token:', accessToken);
      setToken(accessToken);
    } else {
      console.error('Failed to refresh access token');
    }
  }

  async function searchForSong(sanitizedTracks: string) {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${sanitizedTracks}&type=track&limit=1`, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    console.log(sanitizedTracks)

    const data = await response.json();
    console.log(data);
    setTracks(data?.tracks?.items);
  }

  return (
    <main className='bg-white w-[80%] m-auto'>
      <h1 className='text-4xl font-bold'>Reko</h1>
      <input 
        onChange={(e) => setInput(e.target.value)}
        value={input}
        className='border-2 border-black rounded-xl px-4 py-2 mt-8 w-full' 
        type="text" 
      />
      <p className='text-xl font-medium'>{generatedAnswer}</p>
      <div className='w-[50%] m-auto'>
        {!loading && (
          <button
            className="bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-10 mt-8 hover:bg-black/80 w-full"
            onClick={(e) => generateAnswer(e)}
          >
            Hit me &rarr;
          </button>
        )}
        {loading && (
          <button
            className="bg-[#6f6f6f] rounded-xl text-white font-medium px-4 py-2 sm:mt-10 mt-8 hover:bg-black/80 w-full"
            disabled
          >
          </button>
        )}
      </div>

      <div>
        {tracks?.map((track: any, id) => (
          <Track key={id} track={track} />
        ))}
      </div>
    </main>
  )
}