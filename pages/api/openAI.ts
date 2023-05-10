import { NextApiRequest, NextApiResponse } from "next";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    // Only handle POST requests
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing env var from OpenAI");
  }

  const { prompt } = req.body;

  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      max_tokens: 250,
      temperature: 0.8,
    });

    const data = response.data;
    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ message: "An error occurred", error });
  }
}
