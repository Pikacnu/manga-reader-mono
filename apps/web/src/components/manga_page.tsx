'use client';
import Image from 'next/image';
import { useState } from 'react';

export function MangaPage({
  imageUrl,
  isBlurred = false,
  isBlank = false,
  objectPosition = 'center',
}: {
  imageUrl: string;
  isBlurred?: boolean;
  isBlank?: boolean;
  objectPosition?: string;
}) {
  const [isBlur, setIsBlur] = useState(isBlurred);

  if (isBlank) {
    return <div className='w-full h-full bg-gray-500 grow'></div>;
  }

  return (
    <div className='relative w-full h-full'>
      <Image
        onClick={() => {
          if (!isBlur) return;
          setIsBlur(false);
        }}
        fill={true}
        src={imageUrl}
        priority={true}
        alt='Manga Page'
        className={`object-contain ${isBlur ? 'blur-lg cursor-pointer' : ''} `}
        style={{ objectPosition }}
      />
    </div>
  );
}
