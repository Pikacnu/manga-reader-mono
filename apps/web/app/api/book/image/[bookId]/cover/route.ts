import { db } from '@/db';
import { book, image } from '@/db/schema';
//import { readFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { getSession } from '@/src/utils/authSession';
import { v7 } from 'uuid';
import {
  imageServerURL,
  isWarpedImageServer,
  IMAGE_SERVER_API_KEY,
  imageServerURLInner,
} from '@/src/utils/config';

export const GET = async (
  req: Request,
  ctx: RouteContext<'/api/book/image/[bookId]/cover'>,
) => {
  const { bookId } = await ctx.params;
  const bookCoverPath = (
    await db
      .select({
        coverId: book.coverId,
        //coverPath: image.imagePath,
      })
      .from(book)
      .where(eq(book.idx, Number(bookId)))
      //.leftJoin(image, eq(book.coverId, image.id))
      .limit(1)
  )[0];

  if (!bookCoverPath || !bookCoverPath.coverId) {
    return NextResponse.json({ error: 'Cover not found' }, { status: 404 });
  }

  const baseUrl = imageServerURLInner || 'http://localhost:3001';
  return NextResponse.redirect(`${baseUrl}/image/${bookCoverPath.coverId}`);
};

export const POST = async (
  req: Request,
  ctx: RouteContext<'/api/book/image/[bookId]/cover'>,
) => {
  const session = await getSession(req);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bookId } = await ctx.params;

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
