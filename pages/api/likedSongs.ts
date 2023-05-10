import { supabase } from "../../lib/supabaseClient";
import { NextApiRequest, NextApiResponse } from "next";

type LikedSongData = {
  user_id: string;
  artists: string[];
  songName: string;
  track: object;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    // Only handle POST requests
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { user_id, track, artists, songName } = req.body as LikedSongData;

  try {
    // Check if the song is already liked by the user
    const { data: existingSong, error: existingSongError } = await supabase
      .from("liked_songs")
      .select("*")
      .eq("user_id", user_id)
      .contains("artists", artists)
      .eq("songName", songName);
    // .eq("track", track);

    if (existingSongError) {
      console.log("existingSongError", existingSongError);
      throw existingSongError;
    }

    if (existingSong && existingSong.length > 0) {
      // Delete the existing liked song
      const { error: deleteError } = await supabase
        .from("liked_songs")
        .delete()
        .eq("user_id", user_id)
        .contains("artists", artists)
        .eq("songName", songName);
      // .eq("track", track);

      if (deleteError) {
        throw deleteError;
      }

      // Get the updated liked songs
      const { data: updatedLikedSongs } = await supabase
        .from("liked_songs")
        .select("*")
        .eq("user_id", user_id);

      // Return the updated liked songs
      return res.status(200).json({
        message: "Liked song deleted",
        likedSongs: updatedLikedSongs,
      });
    } else {
      // Insert the new liked song
      const { data, error } = await supabase
        .from("liked_songs")
        .insert([{ user_id: user_id, artists, songName, track }])
        .single();

      if (error) {
        throw error;
      }

      // Get the updated liked songs
      const { data: updatedLikedSongs } = await supabase
        .from("liked_songs")
        .select("*")
        .eq("user_id", user_id);

      // Return the updated liked songs
      return res.status(200).json({
        message: "Liked song added",
        data,
        likedSongs: updatedLikedSongs,
      });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
