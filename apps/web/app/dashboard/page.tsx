import { db } from '@/db';
import { book, history, favorite } from '@/db/schema';
import { auth } from '@/src/utils/auth';
import { headers } from 'next/headers';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Plus, BookOpen, Edit, Clock, Heart } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect('/login');
  }

  const userBooks = await db
    .select()
    .from(book)
    .where(eq(book.ownerId, session.user.id))
    .orderBy(desc(book.updatedAt));

  const userHistory = await db
    .select({
      bookId: book.idx,
      title: book.title,
      viewedAt: history.viewedAt,
    })
    .from(history)
    .innerJoin(book, eq(history.bookIdx, book.idx))
    .where(eq(history.userId, session.user.id))
    .orderBy(desc(history.viewedAt))
    .limit(10);

  const userFavorites = await db
    .select({
      bookId: book.idx,
      title: book.title,
      favoritedAt: favorite.favoritedAt,
    })
    .from(favorite)
    .innerJoin(book, eq(favorite.bookIdx, book.idx))
    .where(eq(favorite.userId, session.user.id))
    .orderBy(desc(favorite.favoritedAt))
    .limit(10);

  return (
    <div className='text-white w-full h-full relative flex flex-col md:flex-row overflow-hidden grow bg-gray-950'>
      {/* Main Content: My Books */}
      <div className='flex grow flex-col overflow-y-auto p-6 gap-6 md:order-1'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold flex items-center gap-2'>
            <BookOpen className='text-blue-500' /> My Books
          </h2>
          <Link
            href='/dashboard/create-book'
            className='bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-blue-900/20'
          >
            <Plus size={18} />
            <span className='hidden sm:inline'>Create New</span>
          </Link>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
          {userBooks.map((userBook) => (
            <Link
              key={userBook.idx}
              href={`/dashboard/book/${userBook.idx}/edit`}
              className='group bg-gray-900 border border-gray-800 hover:border-gray-600 hover:bg-gray-800 transition-all duration-300 rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-xl hover:-translate-y-1'
            >
              <div className='flex items-start justify-between gap-2'>
                <h3 className='text-lg font-bold line-clamp-1 group-hover:text-blue-400 transition-colors'>
                  {userBook.title}
                </h3>
                <Edit
                  size={16}
                  className='text-gray-500 group-hover:text-white transition-colors shrink-0 mt-1'
                />
              </div>
              <p className='text-sm text-gray-400 line-clamp-2 grow'>
                {userBook.description || 'No description provided.'}
              </p>
              <div className='pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500'>
                <span>
                  Updated{' '}
                  {userBook.updatedAt
                    ? new Date(userBook.updatedAt).toLocaleDateString()
                    : 'Never'}
                </span>
              </div>
            </Link>
          ))}

          {/* Create New Card (Empty State or Add) */}
          {userBooks.length === 0 && (
            <Link
              href='/dashboard/create-book'
              className='border-2 border-dashed border-gray-800 hover:border-gray-600 hover:bg-gray-900/50 rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-gray-300 transition-all min-h-37.5'
            >
              <div className='p-3 bg-gray-900 rounded-full'>
                <Plus size={24} />
              </div>
              <span className='font-medium'>Create your first book</span>
            </Link>
          )}
        </div>
      </div>

      {/* Sidebar: History & Favorites */}
      <div className='w-full md:w-80 lg:w-96 flex-none bg-gray-900/50 border-l border-gray-800 overflow-y-auto p-6 gap-8 flex flex-col md:order-2'>
        {/* Recently Viewed */}
        <div>
          <h2 className='text-lg font-bold mb-4 flex items-center gap-2 text-gray-200'>
            <Clock
              className='text-blue-400'
              size={20}
            />{' '}
            Recently Viewed
          </h2>
          <div className='flex flex-col gap-2'>
            {userHistory.length > 0 ? (
              userHistory.map((h, i) => (
                <Link
                  key={i}
                  href={`/book/${h.bookId}`}
                  className='group bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 p-3 rounded-lg flex justify-between items-center transition-all'
                >
                  <span className='font-medium text-sm text-gray-300 group-hover:text-white line-clamp-1'>
                    {h.title}
                  </span>
                  <span className='text-[10px] text-gray-500 whitespace-nowrap ml-2'>
                    {h.viewedAt
                      ? new Date(h.viewedAt).toLocaleDateString()
                      : ''}
                  </span>
                </Link>
              ))
            ) : (
              <div className='text-gray-500 text-sm italic p-2'>
                No history yet.
              </div>
            )}
          </div>
        </div>

        {/* Favorites */}
        <div>
          <h2 className='text-lg font-bold mb-4 flex items-center gap-2 text-gray-200'>
            <Heart
              className='text-red-400'
              size={20}
            />{' '}
            Favorites
          </h2>
          <div className='flex flex-col gap-2'>
            {userFavorites.length > 0 ? (
              userFavorites.map((f, i) => (
                <Link
                  key={i}
                  href={`/book/${f.bookId}`}
                  className='group bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 p-3 rounded-lg flex justify-between items-center transition-all'
                >
                  <span className='font-medium text-sm text-gray-300 group-hover:text-white line-clamp-1'>
                    {f.title}
                  </span>
                  <span className='text-[10px] text-gray-500 whitespace-nowrap ml-2'>
                    {f.favoritedAt
                      ? new Date(f.favoritedAt).toLocaleDateString()
                      : ''}
                  </span>
                </Link>
              ))
            ) : (
              <div className='text-gray-500 text-sm italic p-2'>
                No favorites yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
