'use server';

import { Suspense } from 'react';
import BookDisplay from '@/src/components/book_display';
import NavBar from '@/src/components/navbar';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <div className='min-h-screen bg-gray-950 flex flex-col'>
      <NavBar className='sticky top-0 z-50 shadow-md' />
      <Suspense
        fallback={
          <div className='flex items-center justify-center grow'>
            <div className='animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid'></div>
          </div>
        }
      >
        <BookDisplay searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
