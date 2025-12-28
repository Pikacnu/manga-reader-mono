'use client';

import { BookInfo } from '@/src/types/manga';
import Link from 'next/link';
import Image from 'next/image';
import imageLoader from '@/src/image/loader';
import { use, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Flame, Clock } from 'lucide-react';

interface BookWithId extends BookInfo {
  id: number;
}

export default function BookDisplay({
  searchParams,
}: {
  searchParams: Promise<{
    tags?: string;
    title?: string;
    author?: string;
    description?: string;
    q?: string;
  }>;
}) {
  const [books, setBooks] = useState<BookWithId[]>([]);
  const { tags, title, author, description, q } = use(searchParams);

  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [page, setPage] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams();
    if (tags) params.append('tags', tags);
    if (title) params.append('title', title);
    if (author) params.append('author', author);
    if (description) params.append('description', description);
    if (q) params.append('q', q);
    params.append('sort', sortBy);
    params.append('page', page.toString());

    fetch(`/api/book/info?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.bookInfo) {
          setBooks(data.bookInfo);
        } else {
          setBooks([]);
        }
      })
      .catch(console.error);
  }, [q, sortBy, page, tags, title, author, description]);

  // Reset page when search or sort changes
  // useEffect(() => {
  //   setPage(0);
  // }, [q, sortBy]);

  return (
    <>
      <main className='grow w-full max-w-7xl mx-auto p-4 md:p-8'>
        {/* Controls Header */}
        <div className='flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4'>
          <h2 className='text-2xl font-bold text-white flex items-center gap-2'>
            {q ? (
              <>
                Search Results:{' '}
                <span className='text-blue-400'>&quot;{q}&quot;</span>
              </>
            ) : (
              <>
                {sortBy === 'latest' ? (
                  <Clock className='text-blue-400' />
                ) : (
                  <Flame className='text-orange-400' />
                )}
                {sortBy === 'latest' ? 'Recently Added' : 'Popular Recently'}
              </>
            )}
          </h2>

          <div className='flex items-center gap-2 md:gap-4 bg-gray-900 p-1 rounded-lg border border-gray-800 w-full md:w-auto'>
            <button
              onClick={() => {
                setSortBy('latest');
                setPage(0);
              }}
              className={`flex-1 md:flex-none justify-center px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                sortBy === 'latest'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Clock size={16} /> Latest
            </button>
            <button
              onClick={() => {
                setSortBy('popular');
                setPage(0);
              }}
              className={`flex-1 md:flex-none justify-center px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                sortBy === 'popular'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Flame size={16} /> Popular
            </button>
          </div>
        </div>

        {/* Book Grid */}
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 min-h-100'>
          {books.map((book) => (
            <Link
              key={book.id}
              href={`/book/${book.id}`}
              className='group relative flex flex-col bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1'
            >
              <div className='relative aspect-2/3 w-full overflow-hidden bg-gray-800'>
                <Image
                  loader={imageLoader}
                  src={book.coverId || ''}
                  alt={book.title}
                  fill
                  className='object-cover group-hover:scale-110 transition-transform duration-500'
                  sizes='(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw'
                />
                <div className='absolute inset-0 bg-linear-to-t from-gray-900 via-transparent to-transparent opacity-60'></div>

                {/* Floating Tags */}
                <div className='absolute top-2 right-2 flex flex-col gap-1 items-end'>
                  {book.tags &&
                    book.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className='text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-md border border-white/10'
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              </div>

              <div className='p-4 flex flex-col grow relative'>
                <h3
                  className='text-lg font-bold text-white mb-1 line-clamp-1 group-hover:text-blue-400 transition-colors'
                  title={book.title}
                >
                  {book.title}
                </h3>
                <p className='text-gray-400 text-xs font-medium mb-3 uppercase tracking-wide line-clamp-1'>
                  {book.author}
                </p>

                <div className='mt-auto flex items-center justify-between pt-3 border-t border-gray-800'>
                  <div className='flex items-center gap-1.5 text-xs text-gray-500'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='14'
                      height='14'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <path d='M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z' />
                      <circle
                        cx='12'
                        cy='12'
                        r='3'
                      />
                    </svg>
                    <span>{book.views || 0}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {books.length === 0 && (
          <div className='flex flex-col items-center justify-center py-20 text-gray-500'>
            <p className='text-lg font-medium'>No manga found</p>
          </div>
        )}

        {/* Pagination */}
        <div className='flex justify-center items-center gap-4 mt-12'>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className='p-2 rounded-full bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors'
          >
            <ChevronLeft size={24} />
          </button>
          <span className='text-gray-400 font-medium'>Page {page + 1}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={books.length < 10} // Assuming default count is 10
            className='p-2 rounded-full bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors'
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </main>
    </>
  );
}
