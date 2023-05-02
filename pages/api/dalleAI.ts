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
    // Use the appropriate model for DALL·E 2.0 image generation (replace "image-model" with the correct model name)
    const response = await openai.createImage({
      prompt,
      n: 1,
      size: "512x512",
      // Additional parameters for image generation, such as image size, can be added here
    });

    const imageUrl = response.data.data[0].url; // Extract the image URL from the API response
    return res.status(200).json({ imageUrl });
  } catch (error) {
    return res.status(500).json({ message: "An error occurred", error });
  }
}
