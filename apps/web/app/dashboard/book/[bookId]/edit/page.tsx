'use client';

import { BookInfo, ChapterInfo } from '@/src/types/manga';
import { ArrowLeftSquareIcon, Edit, X, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { redirect, useRouter } from 'next/navigation';
import {
  startTransition,
  use,
  useEffect,
  useOptimistic,
  useState,
  useTransition,
  useRef,
} from 'react';
import Image from 'next/image';
import imageLoader from '@/src/image/loader';

export default function EditPageLayout({
  params,
}: Readonly<{
  params: Promise<{ bookId: string }>;
}>) {
  const { bookId } = use(params);
  const router = useRouter();
  const [cacheBookData, setCacheBookData] = useState<null | BookInfo>(null);
  const [optimisticBookData, setOptimisticBookData] = useOptimistic(
    cacheBookData,
    (state: BookInfo | null, update: Partial<BookInfo>) => {
      if (!state) return null;
      return Object.assign({}, state, update);
    },
  );

  const [chapterData, setChapterData] = useState<ChapterInfo[] | null>(null);
  const [optimisticChapterData, setOptimisticChapterData] = useOptimistic(
    chapterData,
    (state: ChapterInfo[] | null, update: ChapterInfo[]) => {
      if (!state) return null;
      return [
        ...state.filter((chap) => !update.find((u) => u.id === chap.id)),
        ...update,
      ];
    },
  );

  const [isDragStartFromInside, setIsDragStartFromInside] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [updateCoverPending, startUpdateCoverTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchBookData() {
      try {
        const response = await fetch(`/api/book/info?bookId=${bookId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch book data');
        }
        const data = await response.json();
        if (!data) {
          return null;
        }
        console.log('Fetched book data:', data);
        return data.bookInfo as BookInfo;
      } catch (error) {
        console.error('Error fetching book data:', error);
        return null;
      }
    }
    fetchBookData().then((data) => {
      if (data) {
        setCacheBookData(data);
      } else {
        redirect('/dashboard');
      }
    });

    async function fetchChapterData() {
      const response = await fetch(`/api/book/chapter?bookId=${bookId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chapter data');
      }
      const data = await response.json();
      if (!data) {
        return null;
      }
      console.log('Fetched chapter data:', data);
      return data.chapters;
    }
    fetchChapterData().then((data) => {
      if (data) {
        setChapterData(data);
      }
    });
  }, [bookId]);

  return (
    <div className='flex flex-col grow relative overflow-hidden h-full w-full bg-gray-950'>
      {/* Header */}
      <div className='flex items-center gap-4 p-4 border-b border-gray-800 bg-gray-900'>
        <Link
          href='/dashboard'
          className='text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-all'
        >
          <ArrowLeftSquareIcon size={24} />
        </Link>
        <h1 className='text-xl font-bold text-white truncate'>
          Edit Book:{' '}
          <span className='text-blue-400'>
            {optimisticBookData?.title || 'Loading...'}
          </span>
        </h1>
        <div className='ml-auto flex items-center gap-2'>
          <button
            onClick={async () => {
              if (
                !confirm(
                  'Are you sure you want to delete this book? This action cannot be undone.',
                )
              )
                return;
              try {
                const res = await fetch('/api/book/info', {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: bookId }),
                });
                if (res.ok) {
                  router.push('/dashboard');
                } else {
                  alert('Failed to delete book');
                }
              } catch (e) {
                console.error(e);
                alert('Error deleting book');
              }
            }}
            className='flex items-center gap-2 text-sm bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-4 py-2 rounded-lg transition-all border border-red-600/50 hover:border-red-600'
          >
            <Trash2 size={18} />
            <span className='hidden sm:inline'>Delete Book</span>
          </button>
          <Link
            href={`/book/${bookId}`}
            className='text-sm bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors border border-gray-700'
          >
            View Book
          </Link>
        </div>
      </div>

      <div className='flex flex-col lg:flex-row grow overflow-y-auto lg:overflow-hidden'>
        {/* Left Column: Book Info Form */}
        <div className='w-full lg:w-1/3 xl:w-1/4 shrink-0 lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-800 bg-gray-900/30 p-6'>
          <form
            className='flex flex-col gap-6'
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const updateData = Object.fromEntries(formData.entries());
              startTransition(async () => {
                setOptimisticBookData(updateData as Partial<BookInfo>);
                try {
                  const res = await fetch(`/api/book/info?bookId=${bookId}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ...updateData, bookId }),
                  });

                  if (res.ok) {
                    // alert('Book info updated successfully'); // Optional feedback
                    startTransition(() => {
                      setCacheBookData((prev) =>
                        prev ? { ...prev, ...updateData } : null,
                      );
                    });
                  } else {
                    throw new Error('Failed to update');
                  }
                } catch (error) {
                  console.error(error);
                  startTransition(() => {
                    setCacheBookData((prev) => ({ ...prev } as BookInfo));
                  });
                }
              });
            }}
          >
            <h2 className='text-lg font-semibold text-white mb-2 flex items-center gap-2'>
              <Edit
                size={18}
                className='text-blue-500'
              />{' '}
              Basic Info
            </h2>

            {optimisticBookData &&
              Object.entries(optimisticBookData)
                .filter(
                  ([key]) =>
                    ![
                      'id',
                      'views',
                      'tags',
                      'pageDirection',
                      'pagesPerView',
                    ].includes(key),
                )
                .map(([key, value]) => (
                  <div
                    key={key}
                    className='flex flex-col gap-2'
                  >
                    <label
                      className='text-sm font-medium text-gray-400 capitalize'
                      htmlFor={key}
                    >
                      {key}
                    </label>
                    <input
                      key={String(value)}
                      type='text'
                      id={key}
                      name={key}
                      defaultValue={value || ''}
                      className='p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all'
                    />
                  </div>
                ))}

            {optimisticBookData && (
              <>
                <div className='flex flex-col gap-2'>
                  <label
                    className='text-sm font-medium text-gray-400 capitalize'
                    htmlFor='pageDirection'
                  >
                    Reading Direction
                  </label>
                  <select
                    key={String(optimisticBookData?.pageDirection)}
                    id='pageDirection'
                    name='pageDirection'
                    defaultValue={optimisticBookData?.pageDirection}
                    className='p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-blue-500 outline-none'
                  >
                    <option value='left'>Left to Right</option>
                    <option value='right'>Right to Left</option>
                  </select>
                </div>
                <div className='flex flex-col gap-2'>
                  <label
                    className='text-sm font-medium text-gray-400 capitalize'
                    htmlFor='pagesPerView'
                  >
                    Pages Per View
                  </label>
                  <select
                    key={String(optimisticBookData?.pagesPerView)}
                    id='pagesPerView'
                    name='pagesPerView'
                    defaultValue={optimisticBookData?.pagesPerView}
                    className='p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-blue-500 outline-none'
                  >
                    <option value='one'>Single Page</option>
                    <option value='two'>Double Page</option>
                  </select>
                </div>
              </>
            )}

            <button className='mt-4 bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg font-medium transition-all active:scale-95 shadow-lg shadow-blue-900/20'>
              Save Changes
            </button>
          </form>
        </div>

        {/* Middle Column: Cover Image */}
        <div className='w-full lg:w-1/3 xl:w-1/4 shrink-0 p-6 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-gray-800 bg-gray-900/10 lg:overflow-y-auto'>
          <h2 className='text-lg font-semibold text-white mb-2'>Book Cover</h2>
          <input
            type='file'
            ref={fileInputRef}
            className='hidden'
            accept='image/*'
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              startUpdateCoverTransition(async () => {
                await fetch(`/api/book/image/${bookId}/cover`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': file.type,
                  },
                  body: file,
                });
                startTransition(() => {});
              });
            }}
          />
          <div
            className={`w-full aspect-2/3 relative rounded-xl overflow-hidden border-2 border-dashed transition-all cursor-pointer ${
              isDragOver
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragStartCapture={() => {
              setIsDragStartFromInside(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDragEnd={() => setIsDragOver(false)}
            onDrop={async (e) => {
              if (isDragStartFromInside) {
                setIsDragOver(false);
                setIsDragStartFromInside(false);
                return;
              }
              setIsDragOver(false);
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (!file) return;
              startUpdateCoverTransition(async () => {
                await fetch(`/api/book/image/${bookId}/cover`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': file.type,
                  },
                  body: file,
                });
                startTransition(() => {});
              });
            }}
          >
            {!isDragStartFromInside && isDragOver && (
              <div
                className='absolute inset-0 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center z-20 pointer-events-none'
                onDragLeave={() => setIsDragOver(false)}
              >
                <p className='text-white font-bold text-lg'>Drop to Upload</p>
              </div>
            )}
            {updateCoverPending && (
              <div className='absolute inset-0 bg-black/60 flex items-center justify-center z-20'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
              </div>
            )}
            <Image
              loader={imageLoader}
              src={optimisticBookData?.coverId || ''}
              alt='Book Cover'
              className='object-contain'
              fill={true}
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw'
            />
            <div className='absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity flex justify-center'>
              <span className='text-xs text-gray-300'>
                Click or Drag & Drop to change
              </span>
            </div>
          </div>
          <p className='text-sm text-gray-500 text-center'>
            Click or drag and drop an image file to update the cover.
          </p>
        </div>

        {/* Right Column: Chapters */}
        <div className='w-full lg:w-1/3 xl:w-2/4 flex flex-col h-auto lg:h-full lg:overflow-hidden bg-gray-950'>
          <div className='p-6 h-full flex flex-col'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-semibold text-white'>Chapters</h2>
              <button
                onClick={async () => {
                  startTransition(async () => {
                    try {
                      const res = await fetch('/api/book/chapter', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ bookId }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        const newChapter = {
                          ...data.chapter,
                          id: data.chapter.idx,
                        };
                        startTransition(() => {
                          setChapterData((prev) =>
                            prev ? [...prev, newChapter] : [newChapter],
                          );
                        });
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  });
                }}
                className='flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20 active:scale-95'
              >
                <Plus size={16} />
                Add Chapter
              </button>
            </div>

            <div className='grow lg:overflow-y-auto space-y-3 pr-2 custom-scrollbar'>
              {optimisticChapterData && optimisticChapterData.length > 0 ? (
                optimisticChapterData
                  .toSorted((a, b) => a.chapterNumber - b.chapterNumber)
                  .map((chapter) => (
                    <Link
                      key={chapter.id}
                      href={`/dashboard/book/${bookId}/chapter/${chapter.id}/edit`}
                      className='block group'
                    >
                      <div className='bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-lg p-4 transition-all hover:bg-gray-800'>
                        <form
                          className='flex flex-col gap-3'
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const { title } = Object.fromEntries(
                              formData.entries(),
                            );
                            startTransition(async () => {
                              setOptimisticChapterData([
                                {
                                  ...chapter,
                                  title: String(title),
                                },
                                ...optimisticChapterData.filter(
                                  (chap) => chap.id !== chapter.id,
                                ),
                              ]);
                              try {
                                const res = await fetch(`/api/book/chapter`, {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    title,
                                    chapterId: chapter.id,
                                  }),
                                });
                                if (res.ok) {
                                  startTransition(() => {
                                    setChapterData((prev) =>
                                      prev
                                        ? prev.map((chap) =>
                                            chap.id === chapter.id
                                              ? {
                                                  ...chap,
                                                  title: String(title),
                                                }
                                              : chap,
                                          )
                                        : null,
                                    );
                                  });
                                } else {
                                  throw new Error('Failed to update');
                                }
                              } catch (error) {
                                console.error(error);
                                startTransition(() => {
                                  setChapterData(
                                    (prev) => [...prev!] as ChapterInfo[],
                                  );
                                });
                              }
                            });
                          }}
                        >
                          <div className='flex items-center gap-3'>
                            <span className='text-gray-500 font-mono text-sm'>
                              #{chapter.chapterNumber}
                            </span>
                            <input
                              className='bg-transparent text-white font-medium grow focus:outline-none focus:border-b border-blue-500 px-1'
                              name='title'
                              id={`chapter-title-${chapter.id}`}
                              defaultValue={String(chapter.title)}
                              onClick={(e) => e.preventDefault()} // Prevent Link navigation when clicking input
                            />
                            <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 max-sm:opacity-100 transition-opacity'>
                              <button
                                type='button'
                                className='p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors'
                                onClick={(e) => {
                                  e.preventDefault();
                                  document
                                    .getElementById(
                                      `chapter-title-${chapter.id}`,
                                    )
                                    ?.focus();
                                }}
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                type='button'
                                className='p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors'
                                onClick={async (e) => {
                                  e.preventDefault();
                                  if (
                                    !confirm(
                                      'Are you sure to delete this chapter?',
                                    )
                                  )
                                    return;
                                  startTransition(async () => {
                                    setOptimisticChapterData(
                                      optimisticChapterData.filter(
                                        (chap) => chap.id !== chapter.id,
                                      ),
                                    );
                                    try {
                                      const res = await fetch(
                                        `/api/book/chapter?bookId=${bookId}&chapterId=${chapter.id}`,
                                        { method: 'DELETE' },
                                      );
                                      if (res.ok) {
                                        startTransition(() => {
                                          setChapterData((prev) =>
                                            prev
                                              ? prev.filter(
                                                  (chap) =>
                                                    chap.id !== chapter.id,
                                                )
                                              : null,
                                          );
                                        });
                                      } else {
                                        throw new Error('Failed to delete');
                                      }
                                    } catch (error) {
                                      console.error(error);
                                      startTransition(() => {
                                        setChapterData(
                                          (prev) => [...prev!] as ChapterInfo[],
                                        );
                                      });
                                    }
                                  });
                                }}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>

                          {chapter.tags && chapter.tags.length > 0 && (
                            <div className='flex flex-wrap gap-2'>
                              {chapter.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className='bg-gray-800 text-xs text-gray-400 px-2 py-1 rounded-md border border-gray-700'
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </form>
                      </div>
                    </Link>
                  ))
              ) : (
                <div className='text-center py-10 text-gray-500 border-2 border-dashed border-gray-800 rounded-xl'>
                  <p>No chapters yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
