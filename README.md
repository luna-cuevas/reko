# Reko: Your Personalized Music Recommendation App 🎵

Welcome to Reko, a music recommendation application that is driven by the power of OpenAI's GPT-3.5 language model. Reko is designed to cater to your musical needs by generating song suggestions based on your unique input. Whether you're in a particular mood, experiencing a specific feeling, or have a specific musical inquiry, Reko is designed to serve you. It not only provides a curated list of songs that match your criteria but also allows you to listen to previews, access the songs on Spotify, and like songs to improve future recommendations.

## Key Features 🌟

- **Personalized Song Recommendations 🎼** - Reko leverages the power of GPT-3 to generate song recommendations tailored to your mood, feeling, or specific query.

- **Preview Playback 🔊** - Curious about a recommended track? Listen to the preview right within the app before deciding to explore further.

- **Spotify Integration 🔗** - Loved a preview? Access the full song on Spotify with just a single click.

- **Song Liking Functionality ❤️** - As you like songs, Reko gets to know your taste better, providing you with even more targeted music suggestions in the future.

## Technology Stack 💻

Reko is built with a modern tech stack that includes:

- **React.js** - A powerful front-end library for building interactive user interfaces.

- **Next.js** - A robust framework for server-rendered or statically exported React applications.

- **TypeScript** - Offering static type checking for JavaScript, TypeScript enhances code quality and understandability.

- **OpenAI's GPT-3 API** - The language model we use for generating personalized song suggestions. Please note, using this requires an API key.

- **Spotify API** - Our source for song details and previews. You will need a Spotify Client ID and Client Secret to use this.

## Getting Started 🚀

### Prerequisites

To run this app locally, you'll need the following:

- Node.js installed on your system.
- An OpenAI API key for GPT-3.
- A Spotify Client ID and Client Secret.

### Running the App Locally

1. Clone the repository to your local machine: `git clone https://github.com/your-username/reko.git`
2. Navigate to the project directory: `cd reko`
3. Install dependencies: `npm install`
4. Create a `.env` file in the project root and add the following environment variables with your own values:

```plaintext
    NEXT_PUBLIC_SPOTIFY_CLIENT_ID=YOUR_SPOTIFY_CLIENT_ID
    NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET=YOUR_SPOTIFY_CLIENT_SECRET
    NEXT_PUBLIC_SPOTIFY_REFRESH_TOKEN=YOUR_SPOTIFY_REFRESH_TOKEN
    OPENAI_API_KEY=YOUR_OPENAI_API_KEY
```

5. Start the development server: npm run dev
6. Open your browser and go to `http://localhost:3000` to access the app.

## How to Use 🎧

1. Enter your mood, feeling, or specific query into the input field.
2. Click the "Hit me" button to get song recommendations.
3. Enjoy the recommendations, listen to previews, access Spotify, and like songs to improve the app's understanding of your preferences!

## License 📄

This project is licensed under the MIT License.

## Acknowledgments 🙏

- Special thanks to OpenAI for their incredible GPT-3.5 language model.
- Thanks to Spotify for their amazing music streaming platform and API.
