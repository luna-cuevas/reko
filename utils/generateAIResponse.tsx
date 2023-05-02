// useOpenAI.ts

import { useState, useEffect } from "react";
import { OpenAIAPIResponse } from "../components/types";

type UseOpenAIHook = {
  generateAnswer: (input: string, prompt: string) => Promise<void>;
  generatedAnswer: string;
  loading: boolean;
  sanitizedTracks: string;
  // Other functions and state variables related to OpenAI
};

export const generateAIResponse = (): UseOpenAIHook => {
  const [generatedAnswer, setGeneratedAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  // Other state variables and logic related to OpenAI
  const [sanitizedTracks, setSanitizedTracks] = useState("");

  const generateAnswer = async (input: string, prompt: string) => {
    if (input !== "") {
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

        const answer: OpenAIAPIResponse = await response.json();
        setGeneratedAnswer(answer.data.choices[0].text);
        // if (callback) {
        //   callback(answer.data.choices[0].text);
        // }
      } catch (error) {
        console.error("Error during OpenAI API call:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setSanitizedTracks(generatedAnswer);
  }, [generatedAnswer]);

  // Other functions and logic related to OpenAI

  return {
    generateAnswer,
    generatedAnswer,
    loading,
    sanitizedTracks,
    // Other functions and state variables related to OpenAI
  };
};
