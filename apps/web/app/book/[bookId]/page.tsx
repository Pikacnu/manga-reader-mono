'use client';

import Image from 'next/image';
import imageLoader from '@/src/image/loader';
import { BookInfo, ChapterInfo } from '@/src/types/manga';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { HeartIcon, EyeIcon, SendIcon, TrashIcon } from 'lucide-react';
import { useSession } from '@/src/context/session';

interface Comment {
  idx: number;
  bookId: number;
  userId: string;
  content: string;
  createdAt: string;
  userName: string | null;
  userImage: string | null;
}

export default function BookPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const bookId = use(params).bookId;
  const session = useSession();
  const [bookInfo, setBookInfo] = useState<BookInfo | null>(null);

  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newTag, setNewTag] = useState('');

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

    async function fetchChapters() {
      try {
        const response = await fetch(`/api/book/chapter?bookId=${bookId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch chapters');
        }
        const data = await response.json();
        if (!data) {
          return [];
        }
        console.log('Fetched chapters:', data);
        return data.chapters as ChapterInfo[];
      } catch (error) {
        console.error('Error fetching chapters:', error);
        return [];
      }
    }
    fetchChapters().then((data) => {
      if (data) {
        setChapters(data);
      }
    });

    // Fetch favorite status
    fetch(`/api/user/favorite?bookIdx=${bookId}`)
      .then((res) => res.json())
      .then((data) => setIsFavorited(data.isFavorited))
      .catch(console.error);

    // Fetch comments
    fetch(`/api/user/comment?bookIdx=${bookId}`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments || []))
      .catch(console.error);
  }, [bookId]);

  const toggleFavorite = async () => {
    try {
      const res = await fetch('/api/user/favorite', {
        method: 'POST',
        body: JSON.stringify({ bookIdx: bookId }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsFavorited(data.isFavorited);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const postComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch('/api/user/comment', {
        method: 'POST',
        body: JSON.stringify({ bookIdx: bookId, comment: newComment }),
      });
      if (res.ok) {
        setNewComment('');
        // Refresh comments
        fetch(`/api/user/comment?bookIdx=${bookId}`)
          .then((res) => res.json())
          .then((data) => setComments(data.comments || []));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addTag = async () => {
    if (!newTag.trim()) return;
    try {
      const res = await fetch('/api/book/tag', {
        method: 'POST',
        body: JSON.stringify({ bookId, tag: newTag.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tags && bookInfo) {
          setBookInfo({ ...bookInfo, tags: data.tags });
          setNewTag('');
        }
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to add tag');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteComment = async (commentIdx: number) => {
    if (!confirm('Delete this comment?')) return;
    try {
      const res = await fetch('/api/user/comment', {
        method: 'DELETE',
        body: JSON.stringify({ commentIdx }),
      });
      if (res.ok) {
        setComments(comments.filter((c) => c.idx !== commentIdx));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className='flex flex-col lg:flex-row grow h-full w-full overflow-y-auto lg:overflow-hidden bg-gray-950'>
      {/* Left Column: Book Info */}
      <div className='flex flex-col w-full lg:w-1/3 xl:w-1/4 border-b lg:border-b-0 lg:border-r border-gray-800 bg-gray-900/30 shrink-0 lg:overflow-y-auto'>
        {/* Cover Image Container */}
        <div className='relative w-full aspect-2/3 lg:aspect-auto lg:h-[40vh] xl:h-[50vh] bg-gray-900'>
          <Image
            loader={imageLoader}
            src={bookInfo?.coverId || 'blank'}
            alt='Book Cover'
            fill={true}
            sizes='(max-width: 1024px) 100vw, 33vw'
            className='object-cover opacity-50 blur-xl absolute inset-0'
          />
          <div className='absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/50 to-transparent'></div>
          <div className='absolute inset-0 flex items-center justify-center p-8'>
            <div className='relative w-full h-full'>
              <Image
                loader={imageLoader}
                src={bookInfo?.coverId || 'blank'}
                alt='Book Cover'
                fill={true}
                className='object-contain drop-shadow-2xl'
                sizes='(max-width: 1024px) 100vw, 33vw'
              />
            </div>
          </div>
        </div>

        {/* Info Content */}
        <div className='p-6 flex flex-col gap-6'>
          <div>
            <h1 className='text-2xl md:text-3xl font-bold text-white mb-2 leading-tight'>
              {bookInfo?.title || 'Loading...'}
            </h1>
            <p className='text-blue-400 font-medium'>
              {bookInfo?.author || 'Unknown Author'}
            </p>
          </div>

          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2 text-gray-400 bg-gray-800/50 px-3 py-1.5 rounded-full text-sm'>
              <EyeIcon size={16} />
              <span>{bookInfo?.views || 0} Reads</span>
            </div>
            <button
              onClick={toggleFavorite}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                isFavorited
                  ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                  : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <HeartIcon
                size={16}
                fill={isFavorited ? 'currentColor' : 'none'}
              />
              <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
            </button>
          </div>

          <div className='space-y-2'>
            <h3 className='text-sm font-bold text-gray-500 uppercase tracking-wider'>
              Description
            </h3>
            <p className='text-gray-300 text-sm leading-relaxed'>
              {bookInfo?.description || 'No description available.'}
            </p>
          </div>

          <div className='space-y-2'>
            <h3 className='text-sm font-bold text-gray-500 uppercase tracking-wider'>
              Tags
            </h3>
            <div className='flex flex-wrap gap-2'>
              {bookInfo?.tags &&
                bookInfo.tags.map((tag) => (
                  <span
                    key={tag}
                    className='px-2.5 py-1 bg-gray-800 text-gray-300 rounded-md text-xs font-medium border border-gray-700'
                  >
                    {tag}
                  </span>
                ))}
              <div className='flex items-center'>
                <input
                  type='text'
                  placeholder='Add tag...'
                  className='bg-transparent border-b border-gray-700 px-2 py-1 text-xs w-20 focus:w-32 focus:border-blue-500 transition-all text-white outline-none'
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                />
                <button
                  onClick={addTag}
                  className='ml-2 text-gray-500 hover:text-blue-400 transition-colors'
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Chapters & Comments */}
      <div className='flex flex-col w-full lg:w-2/3 xl:w-3/4 h-auto lg:h-full lg:overflow-hidden'>
        <div className='flex-1 lg:overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar'>
          {/* Chapters Section */}
          <section>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-2xl font-bold text-white'>Chapters</h2>
              <span className='text-sm text-gray-500'>
                {chapters.length} chapters
              </span>
            </div>

            <div className='grid gap-3'>
              {chapters.length === 0 ? (
                <div className='text-center py-12 border-2 border-dashed border-gray-800 rounded-xl'>
                  <p className='text-gray-500'>No chapters available yet.</p>
                </div>
              ) : (
                chapters.map((chapter) => (
                  <Link
                    key={chapter.id}
                    href={`/reader/${bookId}/${chapter.id}`}
                    className='group block'
                  >
                    <div className='flex items-center gap-4 p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 hover:bg-gray-800 transition-all duration-200'>
                      <div className='shrink-0 w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-colors'>
                        <span className='font-bold text-lg'>
                          {chapter.chapterNumber}
                        </span>
                      </div>
                      <div className='grow min-w-0'>
                        <h3 className='text-lg font-medium text-white truncate group-hover:text-blue-400 transition-colors'>
                          {chapter.title}
                        </h3>
                        {chapter.tags && chapter.tags.length > 0 && (
                          <div className='flex gap-2 mt-1'>
                            {chapter.tags.map((tag) => (
                              <span
                                key={tag}
                                className='text-xs text-gray-500 bg-black/20 px-1.5 py-0.5 rounded'
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className='shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400'>
                        Read →
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          <hr className='border-gray-800' />

          {/* Comments Section */}
          <section className='pb-8'>
            <h2 className='text-2xl font-bold text-white mb-6'>Comments</h2>

            {/* Comment Input */}
            <div className='flex gap-3 mb-8'>
              <div className='grow relative'>
                <input
                  className='w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all'
                  placeholder='Share your thoughts...'
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && postComment()}
                />
              </div>
              <button
                onClick={postComment}
                disabled={!newComment.trim()}
                className='bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 rounded-xl transition-colors flex items-center justify-center'
              >
                <SendIcon size={20} />
              </button>
            </div>

            {/* Comments List */}
            <div className='space-y-4'>
              {comments.length === 0 ? (
                <p className='text-gray-500 text-center py-4'>
                  No comments yet. Be the first to share!
                </p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.idx}
                    className='bg-gray-900/50 p-4 rounded-xl border border-gray-800/50 flex gap-4'
                  >
                    <div className='shrink-0'>
                      {c.userImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.userImage}
                          alt={c.userName || 'User'}
                          className='w-10 h-10 rounded-full object-cover border border-gray-700'
                        />
                      ) : (
                        <div className='w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 font-bold'>
                          {(c.userName || 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className='grow min-w-0'>
                      <div className='flex justify-between items-start mb-1'>
                        <div>
                          <span className='font-semibold text-white text-sm mr-2'>
                            {c.userName || 'Unknown User'}
                          </span>
                          <span className='text-xs text-gray-500'>
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {session?.user?.id === c.userId && (
                          <button
                            onClick={() => deleteComment(c.idx)}
                            className='text-gray-600 hover:text-red-500 transition-colors p-1'
                            title='Delete comment'
                          >
                            <TrashIcon size={14} />
                          </button>
                        )}
                      </div>
                      <p className='text-gray-300 text-sm leading-relaxed wrap-break-word'>
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
