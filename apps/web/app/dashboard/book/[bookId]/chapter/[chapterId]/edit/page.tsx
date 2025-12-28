'use client';
import { ArrowLeftSquareIcon, TrashIcon, UploadIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  use,
  useEffect,
  useOptimistic,
  useState,
  memo,
  startTransition,
  useRef,
} from 'react';
import { ChapterInfo, Page } from '@/src/types/manga';
import Image from 'next/image';
import imageLoader from '@/src/image/loader';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  MeasuringStrategy,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableItem = memo(function SortableItem({
  id,
  index,
  imageId,
}: {
  id: string | number;
  index: number;
  bookId: string;
  chapterId: string;
  imageId: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag start
    if (!confirm('Delete this page?')) return;
    try {
      const res = await fetch('/api/book/page', {
        method: 'DELETE',
        body: JSON.stringify({ pageId: id }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className='bg-gray-800 text-white relative overflow-hidden w-full h-full touch-none cursor-move group'
    >
      <p className='absolute top-2 left-2 z-10 text-black bg-white/70 px-2 py-1 rounded-md text-sm select-none'>
        {index + 1}
      </p>
      <button
        onClick={handleDelete}
        className='absolute top-2 right-2 z-20 bg-red-600 text-white p-1.5 rounded-md  transition-opacity hover:bg-red-700'
        title='Delete Page'
        onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on button click
      >
        <TrashIcon size={14} />
      </button>
      <div className='relative w-full h-full aspect-3/4'>
        <Image
          loader={imageLoader}
          src={imageId}
          alt={`Page ${index + 1}`}
          fill={true}
          sizes='(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw'
          className='object-contain pointer-events-none'
          loading='lazy'
        />
      </div>
    </li>
  );
});

export default function EditChapterPage({
  params,
}: {
  params: Promise<{ bookId: string; chapterId: string }>;
}) {
  const { bookId, chapterId } = use(params);
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cachedPageInfo, setCachedPageInfo] = useState<Page[]>();
  const [optimisticPageInfo, setOptimisticPageInfo] = useOptimistic(
    cachedPageInfo || [],
    (state: Page[], newItems: Page[]) => newItems,
  );

  const [cachedChapterInfo, setCachedChapterInfo] = useState<ChapterInfo>();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex =
        cachedPageInfo?.findIndex((item) => item.id === active.id) ?? -1;
      const newIndex =
        cachedPageInfo?.findIndex((item) => item.id === over.id) ?? -1;

      if (oldIndex === -1 || newIndex === -1 || !cachedPageInfo) return;

      const newItems = arrayMove(cachedPageInfo, oldIndex, newIndex);

      startTransition(async () => {
        setOptimisticPageInfo(newItems);
        try {
          const response = await fetch('/api/book/page', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pageId: Number(active.id),
              pageNumber: newIndex + 1,
              chapterId: Number(chapterId),
            }),
          });
          if (!response.ok) {
            throw new Error('Failed to update page order');
          }
          setCachedPageInfo(newItems);
        } catch (error) {
          console.error('Error updating page order:', error);
        }
      });
    }
  }

  useEffect(() => {
    async function fetchPageInfo() {
      try {
        const response = await fetch(
          `/api/book/chapter?chapterId=${chapterId}&bookId=${bookId}`,
        );
        if (!response.ok) {
          throw new Error('Failed to fetch page info');
        }
        const data = await response.json();
        if (!data.chapter || !data.pages || data.pages.length === 0) {
          throw new Error('No chapter or pages found');
        }
        setCachedPageInfo(data.pages);
        setCachedChapterInfo(data.chapter);
      } catch (error) {
        console.error('Error fetching page info:', error);
        // redirect(`/dashboard/book/${bookId}/edit`);
      }
    }
    fetchPageInfo();
  }, [bookId, chapterId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await fetch(
        `/api/book/image?bookId=${bookId}&chapterId=${chapterId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
        },
      );
      if (res.ok) {
        alert('Uploaded successfully');
        window.location.reload();
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteChapter = async () => {
    if (!confirm('Are you sure you want to delete this chapter?')) return;
    try {
      const res = await fetch('/api/book/chapter', {
        method: 'DELETE',
        body: JSON.stringify({ id: chapterId }),
      });
      if (res.ok) {
        router.push(`/dashboard/book/${bookId}/edit`);
      } else {
        alert('Failed to delete chapter');
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting chapter');
    }
  };

  return (
    <div className='p-4 pt-8 w-full h-full relative flex flex-col overflow-hidden'>
      <Link
        href={`/dashboard/book/${bookId}/edit`}
        className='text-white absolute top-4 left-4 hover:underline flex items-center gap-2 shadow-2xl shadow-amber-50/10 bg-gray-400/50 p-2 rounded-lg opacity-10 hover:opacity-100 transition-all duration-300 m-0'
      >
        <ArrowLeftSquareIcon />
      </Link>
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-bold select-none'>
          Edit Chapter : {cachedChapterInfo?.title || ''}
        </h1>
        <div className='flex gap-2'>
          <label
            className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded cursor-pointer flex items-center gap-2 ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <UploadIcon size={20} />
            {uploading ? 'Uploading...' : 'Upload Pages'}
            <input
              type='file'
              className='hidden'
              onChange={handleUpload}
              accept='image/*,.zip'
              disabled={uploading}
              ref={fileInputRef}
            />
          </label>
          <button
            onClick={handleDeleteChapter}
            className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2'
          >
            <TrashIcon size={20} />
            Delete Chapter
          </button>
        </div>
      </div>
      <div className='grow overflow-y-auto'>
        {optimisticPageInfo && optimisticPageInfo.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            measuring={{
              droppable: {
                strategy: MeasuringStrategy.Always,
              },
            }}
          >
            <SortableContext
              items={optimisticPageInfo}
              strategy={rectSortingStrategy}
            >
              <ul className=' grow relative grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'>
                {optimisticPageInfo.map((page, index) => (
                  <SortableItem
                    key={page.id}
                    id={page.id}
                    index={index}
                    bookId={bookId}
                    chapterId={chapterId}
                    imageId={page.imageId}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        ) : (
          <p className='text-white'>No pages available.</p>
        )}
      </div>
    </div>
  );
}
