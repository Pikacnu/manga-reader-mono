'use client';

import { BookInfo, Page } from '@/src/types/manga';
import { use, useEffect, useState } from 'react';
import { MangaReader } from '@/src/components/manga_reader';
import Link from 'next/link';
import { ArrowLeftSquareIcon } from 'lucide-react';
import imageLoader from '@/src/image/loader';

export default function BookPage({
  params,
}: {
  params: Promise<{ bookId: string; chapterId: string }>;
}) {
  const { bookId, chapterId } = use(params);
  const [bookInfo, setBookInfo] = useState<BookInfo | null>(null);
  const [pageContent, setPageContent] = useState<Page[] | null>(null);

  useEffect(() => {
    async function fetchBookInfo() {
      try {
        const response = await fetch(`/api/book/info?bookId=${bookId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch book info');
        }
        const data = await response.json();
        if (!data) {
          return null;
        }
        console.log('Fetched book info:', data);
        return data.bookInfo as BookInfo;
      } catch (error) {
        console.error('Error fetching book info:', error);
        return null;
      }
    }
    fetchBookInfo().then((data) => {
      if (data) {
        setBookInfo(data);
      }
    });
    async function fetchChapterPages() {
      try {
        const response = await fetch(
          `/api/book/chapter?bookId=${bookId}&chapterId=${chapterId}`,
        );
        if (!response.ok) {
          throw new Error('Failed to fetch chapter pages');
        }
        const data = await response.json();
        if (!data) {
          return null;
        }
        return data.pages as Page[];
      } catch (error) {
        console.error('Error fetching chapter pages:', error);
        return null;
      }
    }
    fetchChapterPages().then((data) => {
      if (data) {
        setPageContent(data);
      }
    });
  }, [bookId, chapterId]);
  return (
    <div className='w-full h-full flex justify-center items-center bg-gray-900'>
      <Link
        href={`/book/${bookId}`}
        className='text-white absolute top-4 left-4 hover:underline flex items-center gap-2 shadow-2xl shadow-amber-50/10 bg-gray-400/50 p-2 rounded-lg opacity-10 hover:opacity-100 transition-all duration-300 m-0 z-90'
      >
        <ArrowLeftSquareIcon />
      </Link>
      {bookInfo && pageContent ? (
        <MangaReader
          bookId={bookId}
          startDirection={bookInfo?.pageDirection}
          pageCountPerView={bookInfo?.pagesPerView}
          pages={pageContent.map((page) => ({
            ...page,
            getImageUrl: (width) =>
              imageLoader({ src: page.imageId, width, quality: 100 }),
            imageUrl: imageLoader({
              src: page.imageId,
              width: 768,
              quality: 100,
            }),
          }))}
        ></MangaReader>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
