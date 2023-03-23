"use client";
import { useState } from 'react'

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [generatedAnswer, setGeneratedAnswer] = useState("");
  const [input, setInput] = useState("");

  const prompt = `Give me a unique list of 5 songs based on this mood, feeling, or specific query: ${input}`
  
  const generateAnswer = async (e: any) => {
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

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    let answer = await response.json();
    setGeneratedAnswer(answer.data.choices[0].text);
    setLoading(false);
  };

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
