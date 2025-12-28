import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/src/utils/authSession';
import {
  BookInfo,
  exampleBook,
  PageDirection,
  PagesPerView,
} from '@/src/types/manga';
import { db } from '@/db';
import { book } from '@/db/schema';
import { and, eq, like, desc, or, sql, arrayContains } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
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
        ownerId: session.user.id,
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
}

export const PUT = async (request: NextRequest) => {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
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
      .where(and(eq(book.idx, bookId), eq(book.ownerId, session.user.id)));
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
      .where(and(eq(book.idx, bookId), eq(book.ownerId, session.user.id)));
    return NextResponse.json({ message: 'Book info updated successfully' });
  } catch (error) {
    console.error('Error updating book info:', error);
    return NextResponse.json(
      { error: 'Error updating book info' },
      { status: 500 },
    );
  }
};

export const acceptedSearchParamsName = [
  Object.keys(exampleBook).filter(
    (key) => !['chapters', 'coverUrl'].includes(key),
  ),
  'page',
  'count',
  'bookId',
];

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const paramsObj = Object.fromEntries(searchParams.entries());

  const { title, author, description, tags, page, count, bookId, q, sort } =
    paramsObj;
  const pageIndex = Number(page) || 0;
  const bookCountPerPage = Number(count) || 10;

  // if bookId is provided, return that specific book info
  if (bookId) {
    // Increment views
    await db
      .update(book)
      .set({ views: sql`${book.views} + 1` })
      .where(eq(book.idx, Number(bookId)));

    const bookInfo: BookInfo = (
      await db
        .select({
          id: book.idx,
          title: book.title,
          author: book.author,
          description: book.description,
          tags: book.tags,
          pageDirection: book.readerPageDirection,
          pagesPerView: book.readerPagesPerView,
          views: book.views,
          coverId: book.coverId,
        })
        .from(book)
        .where(eq(book.idx, Number(bookId)))
    )[0] as BookInfo;
    if (!bookInfo) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }
    return NextResponse.json({
      message: 'Get Book Successfully',
      bookInfo: bookInfo,
    });
  }

  let orderByClause = desc(book.uploadedAt);
  if (sort === 'popular') {
    orderByClause = desc(book.views);
  } else if (sort === 'latest') {
    orderByClause = desc(book.uploadedAt);
  }

  // if all blank, return recent result
  if (
    Object.keys(paramsObj).length === 0 ||
    (Object.keys(paramsObj).length === 1 && paramsObj.sort)
  ) {
    // return NextResponse.json(
    //   { error: 'No query parameters provided' },
    //   { status: 400 },
    // );
    const bookInfos = await db
      .select({
        id: book.idx,
        title: book.title,
        author: book.author,
        description: book.description,
        tags: book.tags,
        views: book.views,
        coverId: book.coverId,
      })
      .from(book)
      .offset(pageIndex * bookCountPerPage)
      .limit(bookCountPerPage)
      .orderBy(orderByClause);
    return NextResponse.json(
      {
        message: 'Get Book Successfully',
        bookInfo: bookInfos,
      },
      {
        status: 200,
      },
    );
  }

  const tagsArray = tags
    ? (decodeURIComponent(tags).split(',') as string[])
    : undefined;

  const filters = [];
  if (q) {
    filters.push(
      or(
        like(book.title, `%${q}%`),
        like(book.author, `%${q}%`),
        like(book.description, `%${q}%`),
      ),
    );
  }
  if (title) {
    filters.push(like(book.title, `%${title}%`));
  }
  if (author) {
    filters.push(like(book.author, `%${author}%`));
  }
  if (description) {
    filters.push(like(book.description, `%${description}%`));
  }
  if (tagsArray && tagsArray.length > 0) {
    filters.push(
      arrayContains(
        sql`(${book.tags}::jsonb)`, // Explicitly cast book.tags to JSONB
        sql`(${JSON.stringify(tagsArray)}::jsonb)`, // Convert tagsArray to JSONB
      ),
    );
  }
  try {
    const results = await db
      .select({
        id: book.idx,
        title: book.title,
        author: book.author,
        description: book.description,
        tags: book.tags,
        views: book.views,
        coverId: book.coverId,
      })
      .from(book)
      .where(and(...filters))
      .offset(pageIndex * bookCountPerPage)
      .limit(bookCountPerPage)
      .orderBy(orderByClause);
    return NextResponse.json({
      message: 'Get Book Successfully',
      bookInfo: results,
    });
  } catch (error) {
    console.error('Error fetching manga info:', error);
    return NextResponse.json(
      { error: `Error fetching manga info` },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await request.json();
  const bookId = parseInt(id, 10);
  if (isNaN(bookId)) {
    return NextResponse.json({ error: 'Invalid book ID' }, { status: 400 });
  }
  try {
    const result = await db
      .delete(book)
      .where(and(eq(book.idx, bookId), eq(book.ownerId, session.user.id)))
      .returning({ id: book.idx });
    if (result.length === 0) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json({ error: 'Error deleting book' }, { status: 500 });
  }
}
