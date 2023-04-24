export type Artist = {
  name: string;
  id: string;
};

export type Album = {
  name: string;
  uri: string;
  images: { url: string }[];
};

export type TrackData = {
  name: string;
  artists: Artist[];
  album: Album;
  uri: string;
  preview_url: string;
};

export type OpenAIAPIResponse = {
  data: {
    choices: Array<{
      text: string;
    }>;
  };
};

export type SpotifyAPIResponse = {
  tracks: {
    items: TrackData[];
  };
};
