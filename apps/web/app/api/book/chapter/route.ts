import { db } from '@/db';
import { book, chapter, page } from '@/db/schema';
import { eq, asc, desc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/src/utils/authSession';
import { ChapterInfo } from '@/src/types/manga';

export const POST = async (request: NextRequest) => {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bookId, title, chapterNumber } = await request.json();

  if (!bookId || isNaN(Number(bookId))) {
    return NextResponse.json({ error: 'Invalid bookId' }, { status: 400 });
  }

  // Verify ownership
  const bookData = (
    await db
      .select()
      .from(book)
      .where(eq(book.idx, Number(bookId)))
      .limit(1)
  )[0];

  if (!bookData || bookData.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let nextChapterNumber = Number(chapterNumber);

  if (!chapterNumber || isNaN(Number(chapterNumber))) {
    const lastChapter = (
      await db
        .select()
        .from(chapter)
        .where(eq(chapter.bookId, Number(bookId)))
        .orderBy(desc(chapter.chapterNumber))
        .limit(1)
    )[0];
    nextChapterNumber = (lastChapter?.chapterNumber || 0) + 1;
  }

  try {
    const newChapter = await db
      .insert(chapter)
      .values({
        bookId: Number(bookId),
        title: title || `Chapter ${nextChapterNumber}`,
        chapterNumber: nextChapterNumber,
      })
      .returning();

    return NextResponse.json({
      message: 'Chapter created',
      chapter: newChapter[0],
    });
  } catch (error) {
    console.error('Error creating chapter:', error);
    return NextResponse.json(
      { error: 'Error creating chapter' },
      { status: 500 },
    );
  }
};

export const GET = async (request: NextRequest) => {
  const searchParams = new URL(request.url).searchParams;
  const [bookId, chapterId] = ['bookId', 'chapterId'].map((arg) =>
    Number(searchParams.get(arg)),
  );
  if (!bookId || isNaN(bookId)) {
    return NextResponse.json({ error: 'Missing bookId' }, { status: 400 });
  }
  // if chapterId is missing, return all chapters under the book
  if (!chapterId) {
    const chapters = (await db
      .select({
        title: chapter.title,
        tags: chapter.tags,
        id: chapter.idx,
        chapterNumber: chapter.chapterNumber,
      })
      .from(chapter)
      .where(eq(chapter.bookId, Number(bookId)))
      .orderBy(asc(chapter.chapterNumber))) as ChapterInfo[];
    if (chapters.length === 0) {
      return NextResponse.json(
        { error: 'No chapters found for this book' },
        { status: 404 },
      );
    }
    return NextResponse.json({ chapters }, { status: 200 });
  }
  if (!chapterId || isNaN(chapterId)) {
    return NextResponse.json({ error: 'Missing chapterId' }, { status: 400 });
  }
  const chapterData = await db
    .select()
    .from(chapter)
    .where(eq(chapter.idx, Number(chapterId)))
    .leftJoin(page, eq(chapter.idx, page.chapterId));
  if (!chapterData || chapterData.length === 0) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
  }
  return NextResponse.json(
    {
      chapter: chapterData[0].chapter,
      pages: chapterData.map((data) => ({
        id: data.page?.idx,
        pageNumber: data.page?.pageNumber,
        imageId: data.page?.imageId,
      })),
    },
    { status: 200 },
  );
};

export const PUT = async (request: NextRequest) => {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { chapterId, title } = await request.json();
  if (!chapterId || isNaN(Number(chapterId))) {
    return NextResponse.json({ error: 'Invalid chapterId' }, { status: 400 });
  }
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
  }

  const chapterData = (
    await db
      .select()
      .from(chapter)
      .where(eq(chapter.idx, Number(chapterId)))
      .leftJoin(book, eq(chapter.bookId, book.idx))
      .limit(1)
  )[0];

  if (!chapterData || !chapterData.chapter || !chapterData.book) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
  }
  if (chapterData.book!.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updatedChapter = (
    await db
      .update(chapter)
      .set({ title })
      .where(eq(chapter.idx, Number(chapterId)))
      .returning({
        id: chapter.idx,
      })
  )[0];
  if (!updatedChapter) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
  }
  return NextResponse.json(
    { message: 'Chapter updated', chapter: updatedChapter },
    { status: 200 },
  );
};

export const DELETE = async (request: NextRequest) => {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { chapterId } = await request.json();
  if (!chapterId || isNaN(Number(chapterId))) {
    return NextResponse.json({ error: 'Invalid chapterId' }, { status: 400 });
  }

  const chapterData = (
    await db
      .select()
      .from(chapter)
      .where(eq(chapter.idx, Number(chapterId)))
      .leftJoin(book, eq(chapter.bookId, book.idx))
      .limit(1)
  )[0];

  if (!chapterData || !chapterData.chapter || !chapterData.book) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
  }
  if (chapterData.book!.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const deletedChapter = (
    await db
      .delete(chapter)
      .where(eq(chapter.idx, Number(chapterId)))
      .returning({
        id: chapter.idx,
      })
  )[0];
  if (!deletedChapter) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
  }
  return NextResponse.json(
    { message: 'Chapter deleted', chapter: deletedChapter },
    { status: 200 },
  );
};
