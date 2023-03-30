"use client";
import { useEffect, useState } from 'react'


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
      const response = await fetch("/api/openAI", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
        }),
      });
  
      if (response.ok) {
        // console.log('Response is ok:', response);
      } else {
        console.error('Error:', response.status, response.statusText);
      }
  
      let answer = await response.json();
  
      setGeneratedAnswer(answer.data.choices[0].text);
      setLoading(false);
    }
  };

  useEffect(() => {
    setSanitizedTracks(
      generatedAnswer
      .replace(/ /g, "%20")
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
      console.log(data)
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
    const response = await fetch(`https://api.spotify.com/v1/search?q=${sanitizedTracks}&type=track&limit=3`, {
      headers: {
          'Authorization': 'Bearer ' + token
      }
    });

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
      {tracks?.map((track: any, id) => (
        <p key={id}>{track.name}</p>
      ))}
      <div className='w-[50%] m-auto'>
        {!loading && (
          <button
            className="bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-10 mt-8 hover:bg-black/80 w-full"
            onClick={(e) => generateAnswer(e)}
          >
            Generate your bio &rarr;
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
    </main>
  )
}