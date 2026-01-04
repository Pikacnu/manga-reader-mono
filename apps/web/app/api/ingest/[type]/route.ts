import { db } from '@/db';
import { book, image, user } from '@/db/schema';
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
import { NextRequest, NextResponse } from 'next/server';
import { locaFileHandler, warpFileHandler } from '../../book/image/route';
import { mkdir, writeFile } from 'fs/promises';
import { v7 } from 'uuid';

const BOT_USER_ID = 'bot_user_id_001';

const ensureBotUser = async () => {
  try {
    await db
      .insert(user)
      .values({
        id: BOT_USER_ID,
        name: 'crawler_bot',
        email: 'bot@pikacnu.com',
        emailVerified: true,
      })
      .onConflictDoUpdate({
        target: user.id,
        set: {
          name: 'crawler_bot',
          id: BOT_USER_ID,
        },
      });
  } catch (error) {
    console.error('Critical error ensuring bot user:', error);
    throw error;
  }
};

export const POST = async (
  request: NextRequest,
  ctx: RouteContext<'/api/ingest/[type]'>,
) => {
  await ensureBotUser();
  const type = (await ctx.params).type;
  // Verify signature
  const signatureHeader = request.headers.get('X-Signature');
  const timestampHeader = request.headers.get('X-Timestamp');
  if (!signatureHeader || !timestampHeader) {
    return new Response('Missing signature headers', { status: 401 });
  }
  const payload = Buffer.from(await request.arrayBuffer());
  const expectedSignature = createHmac('sha256', BOT_SECRET)
    .update(payload)
    .update(timestampHeader)
    .digest('hex');
  if (signatureHeader !== expectedSignature) {
    return new Response('Invalid signature', { status: 401 });
  }

  switch (type) {
    case 'create_book':
      return await createBook(payload);
    case 'update_book':
      return await updateBook(payload);
    case 'upload_chapter_image':
      return await uploadChapterImage(
        payload,
        request.url,
        request.headers.get('Content-Type') || 'application/octet-stream',
      );
    case 'upload_book_cover':
      return await uploadCover(
        payload,
        request.url,
        request.headers.get('Content-Type') || 'application/octet-stream',
      );
    default:
      return new Response('Unsupported ingest type', { status: 400 });
  }
};

const createBook = async (payload: Buffer) => {
  const bookData = JSON.parse(payload.toString()) as BookInfo;
  console.log('Creating book with data:', bookData);
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
        tags: bookData.tags || [],
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

const updateBook = async (payload: Buffer) => {
  const { bookId, ...updateData } = JSON.parse(
    payload.toString(),
  ) as Partial<BookInfo> & {
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

const uploadChapterImage = async (
  payload: Buffer,
  url: string,
  contentType: string,
) => {
  if (!payload) {
    return new Response('No file uploaded', { status: 400 });
  }
  const searchParams = new URL(url).searchParams;
  const bookId = searchParams.get('bookId');
  const chapterId = searchParams.get('chapterId');
  if (!bookId) {
    return new Response('Missing bookId', { status: 400 });
  }

  const req = new Request(url, {
    method: 'POST',
    body: new Uint8Array(payload),
    headers: {
      'Content-Type': contentType,
    },
  });

  if (!isWarpedImageServer) {
    try {
      return locaFileHandler({
        req,
        bookId,
        chapterId: chapterId || '',
      });
    } catch (e) {
      console.error('Error uploading chapter image:', e);
      return new Response('Error uploading chapter image', { status: 500 });
    }
  } else {
    try {
      return warpFileHandler({
        req,
        bookId,
        chapterId,
      });
    } catch (e) {
      console.error('Error uploading chapter image to warped server:', e);
      return new Response('Error uploading chapter image', { status: 500 });
    }
  }
};

const uploadCover = async (
  payload: Buffer,
  url: string,
  ContentType: string,
) => {
  const searchParams = new URL(url).searchParams;
  const bookId = searchParams.get('bookId');

  if (!payload) {
    return new Response('No file uploaded', { status: 400 });
  }

  const fileBuffer = Buffer.from(payload);

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
