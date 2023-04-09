import React from 'react'

const Track = ({ track }: any) => {
  return (
    <div className='border-2 border-black p-4 my-2'>
      <p>{track.name}</p>
    </div>
  )
}

export default Track