import Link from 'next/link';
import React, { useRef } from 'react';

type Artist = {
  name: string;
};

type Album = {
  name: string;
  uri: string;
  images: { url: string }[]; // Add the images property to the Album type
};

type TrackProps = {
  track: {
    name: string;
    artists: Artist[];
    album: Album;
    uri: string;
    preview_url: string;
  };
  onLike: (artist: string) => void;
};

const Track: React.FC<TrackProps> = ({ track, onLike }) => {
  const { name, artists, album, preview_url, uri } = track;
  const { images } = album; // Extract the images array from the album object

  // Create a ref to access the audio element
  const audioRef = useRef<HTMLAudioElement>(null);

  // Function to handle play button click
  const handlePlayClick = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const handleLikeClick = () => {
    artists.map(artist => {
      onLike(artist.name);
    });
  };

  return (
    <div className='flex flex-col sm:flex-row p-4 my-2  sm:max-h-[100px] border-2 border-black'>
      <div className='sm:w-1/2  flex justify-start'>
        {/* Display the first album image if available */}
        {images.length > 0 && <img className='h-full max-h-[40px]' src={images[0].url} alt="Album cover" />}
        <div className='pl-4'>
          <p>{name}</p>
          <p>{artists.map((artist) => artist.name).join(', ')}</p>
        </div>
      </div>
      <div className='sm:justify-evenly sm:w-1/2 flex justify-center'>
        <audio ref={audioRef} src={preview_url} preload="none" />
        <button className='border-2 border-blue-400' onClick={handlePlayClick}>Preview</button>
        <Link className='flex' href={uri}>
          <img className='max-h-[30px] my-auto h-full' src="/images/spotify-icon.png" alt="" />
        </Link>
        <button onClick={handleLikeClick}>
          <img className='max-h-[30px] my-auto h-full' src="/images/heart-icon.png" alt="" />
        </button>
      </div>      
    </div>
  );
};

export default Track;