import { supabase } from "../../../lib/supabaseClient";
import { NextResponse, NextRequest } from "next/server";

type LikedSongData = {
  userId: string;
  artists: string[];
  songName: string;
};

export async function POST(req: NextRequest) {
  const { userId, artists, songName } = (await req.json()) as LikedSongData;

  try {
    // Check if the song is already liked by the user
    const { data: existingSong, error: existingSongError } = await supabase
      .from("liked_songs")
      .select("*")
      .eq("user_id", userId)
      .contains("artists", artists)
      .eq("songName", songName);

    if (existingSongError) {
      throw existingSongError;
    }

    if (existingSong && existingSong.length > 0) {
      // Delete the existing liked song
      const { error: deleteError } = await supabase
        .from("liked_songs")
        .delete()
        .eq("user_id", userId)
        .contains("artists", artists)
        .eq("songName", songName);

      if (deleteError) {
        throw deleteError;
      }
      const { data: updatedLikedSongs } = await supabase
        .from("liked_songs")
        .select("*")
        .eq("user_id", userId);
      return NextResponse.json(
        { message: "Liked song deleted", likedSongs: updatedLikedSongs },
        { status: 200 }
      );
    } else {
      // Insert the new liked song
      const { data, error } = await supabase
        .from("liked_songs")
        .insert([{ user_id: userId, artists, songName }])
        .single();

      if (error) {
        throw error;
      }
      const { data: updatedLikedSongs } = await supabase
        .from("liked_songs")
        .select("*")
        .eq("user_id", userId);
      return NextResponse.json(
        { message: "Liked song added", data, likedSongs: updatedLikedSongs },
        { status: 200 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
