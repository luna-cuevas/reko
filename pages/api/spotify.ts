// import { NextResponse } from 'next/server';

// export async function GET(request: Request) {
//   if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
//     throw new Error("Missing env vars from Spotify");
//   }

//   const url = new URL(request.url);
//   const sanitizedTracks = url.searchParams.get('tracks') || '';
//   const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

//   async function refreshAccessToken(refreshToken: string) {
//     const response = await fetch('https://accounts.spotify.com/api/token', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//         'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
//       },
//       body: `grant_type=refresh_token&refresh_token=${refreshToken}`
//     });

//     if (response.ok) {
//       const data = await response.json();
//       const accessToken = data.access_token;
//       // Use the access token or store it for later use
//       console.log('Access Token:', accessToken);
//       return accessToken;
//     } else {
//       console.error('Failed to refresh access token');
//     }
//   }

//   async function getToken() {
//     const response = await fetch('https://accounts.spotify.com/api/token', {
//       method: 'POST',
//       headers: {
//           'Content-Type': 'application/x-www-form-urlencoded',
//           'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
//       },
      
//       body: 'grant_type=client_credentials'
//     });

//     const data = await response.json();
//     return data.access_token;
//   }

//   async function searchForSong(sanitizedTracks: string) {
//     const token = await refreshAccessToken(refreshToken || '');
//     console.log(token);

//     const response = await fetch(`https://api.spotify.com/v1/search?q=${sanitizedTracks}&type=track&limit=3`, {
//         headers: {
//             'Authorization': 'Bearer ' + token
//         }
//     });

//     const data = await response.json();
//     console.log(data);

//     return data.tracks.items;
//   }

//   return NextResponse.json({ data: await searchForSong(sanitizedTracks) });
// }