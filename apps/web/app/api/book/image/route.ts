import { mkdir } from 'fs/promises';
import JSZip from 'jszip';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/src/utils/authSession';
import { v7 } from 'uuid';
import { db } from '@/db';
import { book, chapter, image, page } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { writeFile } from 'fs/promises';
import { isWarpedImageServer } from '@/src/utils/config';
import { readFile } from 'fs/promises';

const uploadDir = './uploads';

export const POST = async (req: Request) => {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!req.body) {
    return new Response('No file uploaded', { status: 400 });
  }
  const searchParams = new URL(req.url).searchParams;
  const bookId = searchParams.get('bookId');
  const chapterId = searchParams.get('chapterId');
  if (!bookId) {
    return new Response('Missing bookId', { status: 400 });
  }

  if (!isWarpedImageServer) {
    return locaFileHandler({ req, bookId, chapterId: chapterId || '' });
  } else {
    return warpFileHandler({ req, bookId, chapterId });
  }
};

async function locaFileHandler({
  req,
  bookId,
  chapterId,
}: {
  req: Request;
  bookId: string;
  chapterId: string;
}) {
  const ContentType =
    req.headers.get('Content-Type') || 'application/octet-stream';
  const fileBuffer = await req.arrayBuffer();
  const filePath = `${uploadDir}/${v7()}.bin`;
  let isZipped = false;
  const files: string[] = [];

  await mkdir(uploadDir, { recursive: true });
  try {
    if (
      ContentType.includes('zip') ||
      ContentType === 'application/x-zip-compressed'
    ) {
      isZipped = true;
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(Buffer.from(fileBuffer));

      // Get entries and sort
      const entries = Object.keys(loadedZip.files).map(
        (name) => loadedZip.files[name],
      );
      entries.sort((a, b) => a.name.localeCompare(b.name));

      for (const fileEntry of entries) {
        if (fileEntry.dir) continue;

        const entryName = fileEntry.name;
        const lowerName = entryName.toLowerCase();

        // Filter for image files and ignore hidden files (like __MACOSX)
        if (
          !entryName.startsWith('__MACOSX') &&
          !entryName.split('/').pop()?.startsWith('.') &&
          (lowerName.endsWith('.jpg') ||
            lowerName.endsWith('.jpeg') ||
            lowerName.endsWith('.png') ||
            lowerName.endsWith('.webp') ||
            lowerName.endsWith('.gif') ||
            lowerName.endsWith('.avif'))
        ) {
          const entryPath = `${uploadDir}/${v7()}-${entryName
            .split('/')
            .pop()}`;
          const content = await fileEntry.async('nodebuffer');
          await writeFile(entryPath, content);
          files.push(entryPath);
        }
      }
    } else if (ContentType.startsWith('image/')) {
      isZipped = false;
      // Try to get extension from content type
      const ext = ContentType.split('/')[1] || 'bin';
      const imagePath = `${uploadDir}/${v7()}.${ext}`;
      await writeFile(imagePath, Buffer.from(fileBuffer));
      files.push(imagePath);
    } else {
      // Fallback for other file types or if content type is missing
      isZipped = false;
      await writeFile(filePath, Buffer.from(fileBuffer));
      files.push(filePath);
    }
  } catch (error) {
    console.error('Error processing file upload:', error);
    return new Response('Error processing file upload', { status: 500 });
  }

  // unwarp files into image format and store paths in database

  if (isZipped) {
    console.log(`Uploaded and unzipped file saved to ${filePath}`);
  } else {
    console.log(`Uploaded file saved to ${filePath}`);
  }

  const savedPagesIds = await db.transaction(async (tx) => {
    let newChapterId = Number(chapterId);
    const bookChapters = (
      await tx
        .select()
        .from(book)
        .where(eq(book.idx, Number(bookId)))
        .limit(1)
        .leftJoin(chapter, eq(book.idx, chapter.bookId))
        .orderBy(desc(chapter.chapterNumber))
    )[0];

    if (!bookChapters) {
      tx.rollback();
      return [];
    }

    const chapters = bookChapters.chapter ? [bookChapters.chapter] : [];
    const lastChapterIndex =
      chapters.length > 0
        ? chapters.toSorted((a, b) => b.chapterNumber - a.chapterNumber)[0]
            .chapterNumber
        : 0;

    if (isNaN(Number(chapterId))) {
      newChapterId = (
        await tx
          .insert(chapter)
          .values({
            bookId: Number(bookId),
            title: 'Untitled Chapter',
            chapterNumber: lastChapterIndex + 1,
          })
          .returning({
            id: chapter.idx,
          })
      )[0].id;
      if (!newChapterId) {
        tx.rollback();
        return [];
      }
    }

    const savedImageIds = await tx
      .insert(image)
      .values(
        files.map((filePath) => ({
          imagePath: filePath,
          id: v7(),
        })),
      )
      .returning({ id: image.id, imagePath: image.imagePath });

    const savedPagesIds = await tx
      .insert(page)
      .values(
        files.map((filePath, index) => ({
          pageNumber: index + 1,
          bookId: Number(bookId),
          chapterId: newChapterId,
          imageId: savedImageIds[index].id,
        })),
      )
      .returning({
        idx: page.idx,
      });
    if (
      !savedPagesIds ||
      savedPagesIds.length === 0 ||
      savedPagesIds.length !== files.length
    ) {
      tx.rollback();
      return [];
    }
    return savedPagesIds.map((p) => p.idx);
  });
  if (savedPagesIds.length === 0) {
    return NextResponse.json(
      { error: 'Error saving pages to database or Book Not Found' },
      { status: 500 },
    );
  }
  return NextResponse.json(
    {
      message: 'Files uploaded successfully',
      pages: savedPagesIds,
    },
    { status: 200 },
  );
}

async function warpFileHandler({
  req,
  bookId,
  chapterId,
}: {
  req: Request;
  bookId: string;
  chapterId: string | null;
}) {
  const response = await fetch(
    `${process.env.WARPED_IMAGE_SERVER_URL}/upload`,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          req.headers.get('Content-Type') || 'application/octet-stream',
      },
      body: req.body,
    },
  );
  if (!response.ok) {
    return NextResponse.json(
      { error: 'Error uploading to Warped Image Server' },
      { status: 500 },
    );
  }
  const data = (await response.json()) as {
    message: string;
    requestId: string;
    imageIds: string[];
  };
  const imageIds: string[] = data.imageIds;
  if (!imageIds || imageIds.length === 0) {
    return NextResponse.json(
      { error: 'No images returned from Warped Image Server' },
      { status: 500 },
    );
  }
  const savedPagesIds = await db.transaction(async (tx) => {
    let newChapterId = Number(chapterId);
    const bookChapters = (
      await tx
        .select()
        .from(book)
        .where(eq(book.idx, Number(bookId)))
        .limit(1)
        .leftJoin(chapter, eq(book.idx, chapter.bookId))
        .orderBy(desc(chapter.chapterNumber))
    )[0];
    if (!bookChapters) {
      tx.rollback();
      return [];
    }
    const chapters = bookChapters.chapter ? [bookChapters.chapter] : [];
    const lastChapterIndex =
      chapters.length > 0
        ? chapters.toSorted((a, b) => b.chapterNumber - a.chapterNumber)[0]
            .chapterNumber
        : 0;
    if (isNaN(Number(chapterId))) {
      newChapterId = (
        await tx
          .insert(chapter)
          .values({
            bookId: Number(bookId),
            title: 'Untitled Chapter',
            chapterNumber: lastChapterIndex + 1,
          })
          .returning({
            id: chapter.idx,
          })
      )[0].id;
      if (!newChapterId) {
        tx.rollback();
        return [];
      }
    }
    const savedPagesIds = await tx
      .insert(page)
      .values(
        imageIds.map((imageId, index) => ({
          pageNumber: index + 1,
          bookId: Number(bookId),
          chapterId: newChapterId,
          imageId: imageId,
        })),
      )
      .returning({
        idx: page.idx,
      });
    if (
      !savedPagesIds ||
      savedPagesIds.length === 0 ||
      savedPagesIds.length !== imageIds.length
    ) {
      tx.rollback();
      return [];
    }
    return savedPagesIds.map((p) => p.idx);
  });
  if (savedPagesIds.length === 0) {
    return NextResponse.json(
      { error: 'Error saving pages to database or Book Not Found' },
      { status: 500 },
    );
  }
  return NextResponse.json(
    {
      message: 'Files uploaded successfully',
      pages: savedPagesIds,
    },
    { status: 200 },
  );
}

export const GET = async (req: NextRequest) => {
  const searchParams = new URL(req.url).searchParams;
  const imageId = searchParams.get('imageId');
  if (!imageId) {
    return NextResponse.json({ error: 'Missing imageId' }, { status: 400 });
  }

  try {
    const result = (
      await db
        .select({
          imagePath: image.imagePath,
        })
        .from(image)
        .where(eq(image.id, imageId))
        .limit(1)
    )[0];
    if (!result || !result.imagePath) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    const file = await readFile(result.imagePath);
    return new NextResponse(file, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Type': 'image/*',
      },
    });
  } catch (error) {
    console.error('Error fetching image info:', error);
    return NextResponse.json(
      { error: 'Error fetching image info' },
      { status: 500 },
    );
  }
};
