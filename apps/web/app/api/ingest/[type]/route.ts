import { db } from '@/db';
import { book, image } from '@/db/schema';
import {
  BookInfo,
  exampleBook,
  PageDirection,
  PagesPerView,
} from '@/src/types/manga';
import {
  BOT_SECRET,
  IMAGE_SERVER_API_KEY,
  imageServerURL,
  isWarpedImageServer,
} from '@/src/utils/config';
import { createHmac } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { locaFileHandler, warpFileHandler } from '../../book/image/route';
import { mkdir, writeFile } from 'fs/promises';
import { v7 } from 'uuid';

const BOT_USER_ID = '-1000';

export const POST = async (
  request: Request,
  ctx: RouteContext<'/api/ingest/[type]'>,
) => {
  if (!request.body) {
    return new Response('No payload provided', { status: 400 });
  }
  const type = (await ctx.params).type;
  // Verify signature
  const signatureHeader = request.headers.get('X-Signature');
  const timestampHeader = request.headers.get('X-Timestamp');
  if (!signatureHeader || !timestampHeader) {
    return new Response('Missing signature headers', { status: 401 });
  }
  const payload = Buffer.from(await request.arrayBuffer());
  const expectedSignature = createHmac('sha256', BOT_SECRET)
    .update(payload + timestampHeader)
    .digest('hex');
  if (signatureHeader !== expectedSignature) {
    return new Response('Invalid signature', { status: 401 });
  }

  switch (type) {
    case 'create_book':
      return await createBook(request);
    case 'update_book':
      return await updateBook(request);
    case 'upload_chapter_image':
      return await uploadChapterImage(request);
    case 'upload_book_cover':
      return await uploadCover(request);
    default:
      return new Response('Unsupported ingest type', { status: 400 });
  }
};

const createBook = async (request: Request) => {
  const bookData = (await request.json()) as BookInfo;
  if (!Object.keys(exampleBook).every((key) => key in bookData)) {
    return NextResponse.json(
      { error: 'Invalid manga info format' },
      { status: 400 },
    );
  }
  try {
    const result = await db
      .insert(book)
      .values({
        title: bookData.title,
        ownerId: BOT_USER_ID,
        author: bookData.author,
        description: bookData.description,
        //tags: bookData.tags || [],
      })
      .returning({ id: book.idx });

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Error saving manga info' },
        { status: 500 },
      );
    }
    return NextResponse.json({
      message: 'Manga info saved successfully',
      bookId: result[0].id,
    });
  } catch (error) {
    console.error('Error saving manga info:', error);
    return NextResponse.json(
      { error: 'Error saving manga info' },
      { status: 500 },
    );
  }
};

const updateBook = async (request: Request) => {
  const { bookId, ...updateData } =
    (await request.json()) as Partial<BookInfo> & {
      bookId: number;
      tags: string;
    };
  if (!bookId || isNaN(bookId)) {
    return NextResponse.json({ error: 'Invalid book ID' }, { status: 400 });
  }
  try {
    const existingBooks = await db
      .select()
      .from(book)
      .where(and(eq(book.idx, bookId), eq(book.ownerId, BOT_USER_ID)));
    if (existingBooks.length === 0) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }
    await db
      .update(book)
      .set({
        title: updateData.title,
        author: updateData.author,
        description: updateData.description,
        ...(updateData.tags &&
        updateData.tags !== undefined &&
        updateData.tags.length > 0 &&
        updateData.tags.split(',').length > 0
          ? { tags: updateData.tags.split(',') }
          : {}),
        readerPageDirection: updateData.pageDirection || PageDirection.RIGHT,
        readerPagesPerView: updateData.pagesPerView || PagesPerView.TWO,
      })
      .where(and(eq(book.idx, bookId), eq(book.ownerId, BOT_USER_ID)));
    return NextResponse.json({ message: 'Book info updated successfully' });
  } catch (error) {
    console.error('Error updating book info:', error);
    return NextResponse.json(
      { error: 'Error updating book info' },
      { status: 500 },
    );
  }
};

const uploadChapterImage = async (request: Request) => {
  if (!request.body) {
    return new Response('No file uploaded', { status: 400 });
  }
  const searchParams = new URL(request.url).searchParams;
  const bookId = searchParams.get('bookId');
  const chapterId = searchParams.get('chapterId');
  if (!bookId) {
    return new Response('Missing bookId', { status: 400 });
  }

  if (!isWarpedImageServer) {
    return locaFileHandler({
      req: request,
      bookId,
      chapterId: chapterId || '',
    });
  } else {
    return warpFileHandler({ req: request, bookId, chapterId });
  }
};

const uploadCover = async (request: Request) => {
  const req = request;
  const searchParams = new URL(request.url).searchParams;
  const bookId = searchParams.get('bookId');

  if (!req.body) {
    return new Response('No file uploaded', { status: 400 });
  }

  const ContentType =
    req.headers.get('Content-Type') || 'application/octet-stream';
  const fileBuffer = await req.arrayBuffer();

  if (!bookId || isNaN(Number(bookId))) {
    return new Response('Invalid bookId', { status: 400 });
  }

  if (!ContentType.startsWith('image/')) {
    return new Response('Invalid file type', { status: 400 });
  }

  if (isWarpedImageServer) {
    const response = await fetch(`${imageServerURL}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': ContentType,
        Authorization: `Bearer ${IMAGE_SERVER_API_KEY}`,
      },
      body: Buffer.from(fileBuffer),
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error uploading to Image Server' },
        { status: 500 },
      );
    }
    const data = (await response.json()) as {
      message: string;
      requestId: string;
      imageIds: string[];
    };
    await db
      .update(book)
      .set({ coverId: data.imageIds[0] })
      .where(eq(book.idx, Number(bookId)));
    return NextResponse.json({
      message: 'Cover uploaded successfully',
      imageId: data.imageIds[0],
    });
  }

  await mkdir('./uploads/book/covers', { recursive: true });
  const fileName = `${bookId}_${Date.now()}.jpg`;

  const imageId = (
    await db
      .insert(image)
      .values({
        id: v7(),
        imagePath: fileName,
      })
      .returning({ id: image.id })
  )[0].id;

  const insertResult = (
    await db
      .update(book)
      .set({ coverId: imageId })
      .where(eq(book.idx, Number(bookId)))
      .returning({
        coverId: book.coverId,
      })
  )[0];
  if (!insertResult) {
    return new Response('Book not found', { status: 404 });
  }
  await writeFile(`./uploads/book/covers/${fileName}`, Buffer.from(fileBuffer));
  return NextResponse.json({ message: 'Cover uploaded successfully' });
};
