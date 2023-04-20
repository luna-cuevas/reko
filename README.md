# Reko 🎵

Reko is a music recommendation app that uses OpenAI's GPT-3 to generate song suggestions based on the user's input. Whether you're in a specific mood, feeling a certain way, or have a specific music query, Reko has got you covered! The app provides a list of songs that match your criteria, allowing you to listen to previews, access the songs on Spotify, and like songs to improve future recommendations.

## Features 🌟

- 🎼 Song Recommendations: Get song recommendations based on your mood, feeling, or specific query.
- 🔊 Preview Playback: Listen to previews of each recommended track.
- 🔗 Spotify Integration: Access full songs on Spotify with a single click.
- ❤️ Like Songs: Like songs to receive better music suggestions.

## Tech Stack 💻

- React.js: Front-end library for building user interfaces.
- Next.js: Framework for server-rendered React applications.
- TypeScript: Static type checking for JavaScript.
- OpenAI's GPT-3 API: Language model for generating song suggestions.
- Spotify API: Music streaming platform API for song details and previews.

## Getting Started 🚀

### Prerequisites

- Node.js installed on your system.
- An OpenAI API key for GPT-3.
- A Spotify Client ID and Client Secret.

### Running the App Locally

1. Clone the repository to your local machine: git clone https://github.com/your-username/reko.git
2. Navigate to the project directory: cd reko
3. Install dependencies: npm install
4. Create a `.env` file in the project root and add the following environment variables with your own values: NEXT_PUBLIC_SPOTIFY_CLIENT_ID=<Your Spotify Client ID> NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET=<Your Spotify Client Secret> NEXT_PUBLIC_SPOTIFY_REFRESH_TOKEN=<Your Spotify Refresh Token> OPENAI_API_KEY=<Your OpenAI API Key>
5. Start the development server: npm run dev
6. Open your browser and go to `http://localhost:3000` to access the app.

## Usage 🎧

1. Enter your mood, feeling, or specific query into the input field.
2. Click the "Hit me" button to get song recommendations.
3. Enjoy the recommendations, listen to previews, access Spotify, and like songs!

## License 📄

This project is licensed under the MIT License.

## Acknowledgments 🙏

- Special thanks to OpenAI for their incredible GPT-3 language model.
- Thanks to Spotify for their amazing music streaming platform and API.
