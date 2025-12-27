import { getSession } from '@/src/utils/authSession';
import { NextResponse } from 'next/server';
import { examplePageChange, PageChangeType } from '@/src/types/manga';
import { db } from '@/db';
import { book, page } from '@/db/schema';
import { and, eq, gte, sql, lt, lte, gt } from 'drizzle-orm';

// 1. Add Page (POST)
export const POST = async (request: Request) => {
  const session = await getSession(request);
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { bookId, chapterId } = await request.json();

  if (!bookId || !chapterId) {
    return NextResponse.json(
      { error: 'Missing bookId or chapterId' },
      { status: 400 },
    );
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

  // Find max page number
  const maxPage = await db
    .select({ value: sql<number>`max(${page.pageNumber})` })
    .from(page)
    .where(eq(page.chapterId, Number(chapterId)));

  const nextPageNum = (maxPage[0]?.value || 0) + 1;

  // Insert blank page
  try {
    const [newPage] = await db
      .insert(page)
      .values({
        bookId: Number(bookId),
        chapterId: Number(chapterId),
        pageNumber: nextPageNum,
        imageId: 'blank', // Placeholder image ID for blank page
      })
      .returning();

    return NextResponse.json({ message: 'Blank page added', page: newPage });
  } catch (error) {
    console.error('Error adding blank page:', error);
    return NextResponse.json(
      { error: 'Failed to add blank page' },
      { status: 500 },
    );
  }
};

// 2. Move Page (PUT)
export const PUT = async (request: Request) => {
  const session = await getSession(request);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pageChange = (await request.json()) as PageChangeType;

  if (!Object.keys(examplePageChange).every((key) => key in pageChange)) {
    return NextResponse.json(
      { error: 'Invalid page change format' },
      { status: 400 },
    );
  }

  const { pageId, pageNumber: newIndex } = pageChange;
  if (newIndex < 0) {
    return NextResponse.json({ error: 'Invalid new index' }, { status: 400 });
  }

  // Get page info and verify ownership
  const pageData = (
    await db
      .select()
      .from(page)
      .where(eq(page.idx, pageId))
      .limit(1)
      .leftJoin(book, eq(page.bookId, book.idx))
  )[0];

  if (!pageData) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  if (!pageData.book || pageData.book.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const chapterId = pageData.page.chapterId;
  const oldIndex = pageData.page.pageNumber;

  if (oldIndex === newIndex) {
    return NextResponse.json({ message: 'Page moved successfully' });
  }

  try {
    await db.transaction(async (tx) => {
      // 1. Move target to temporary safe location
      const TEMP_ID = -1000000;
      await tx
        .update(page)
        .set({ pageNumber: TEMP_ID })
        .where(eq(page.idx, pageId));

      if (oldIndex < newIndex) {
        // Moving DOWN: Shift items in (old, new] by -1
        // e.g. 2 -> 4. Shift 3, 4 to 2, 3.

        // Flip to negative to avoid collision
        await tx
          .update(page)
          .set({ pageNumber: sql`-(${page.pageNumber})` })
          .where(
            and(
              eq(page.chapterId, chapterId),
              gt(page.pageNumber, oldIndex),
              lte(page.pageNumber, newIndex),
            ),
          );

        // Shift and flip back
        // We want x -> x-1.
        // We have -x.
        // -(-x) - 1 = x - 1.
        // So set pageNumber = -pageNumber - 1
        await tx
          .update(page)
          .set({ pageNumber: sql`-(${page.pageNumber}) - 1` })
          .where(
            and(
              eq(page.chapterId, chapterId),
              lt(page.pageNumber, -oldIndex),
              gte(page.pageNumber, -newIndex),
            ),
          );
      } else {
        // Moving UP: Shift items in [new, old) by +1
        // e.g. 4 -> 2. Shift 2, 3 to 3, 4.

        // Flip to negative
        await tx
          .update(page)
          .set({ pageNumber: sql`-(${page.pageNumber})` })
          .where(
            and(
              eq(page.chapterId, chapterId),
              gte(page.pageNumber, newIndex),
              lt(page.pageNumber, oldIndex),
            ),
          );

        // Shift and flip back
        // We want x -> x+1.
        // We have -x.
        // -(-x) + 1 = x + 1.
        // So set pageNumber = -pageNumber + 1
        await tx
          .update(page)
          .set({ pageNumber: sql`-(${page.pageNumber}) + 1` })
          .where(
            and(
              eq(page.chapterId, chapterId),
              lte(page.pageNumber, -newIndex),
              gt(page.pageNumber, -oldIndex),
            ),
          );
      }

      // 2. Move target to new position
      await tx
        .update(page)
        .set({ pageNumber: newIndex })
        .where(eq(page.idx, pageId));
    });

    return NextResponse.json({ message: 'Page moved successfully' });
  } catch (error) {
    console.error('Error updating page index:', error);
    return NextResponse.json(
      { error: 'Failed to update page index' },
      { status: 500 },
    );
  }
};

export async function DELETE(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { pageId } = await request.json();
  const pageData = (
    await db
      .select()
      .from(page)
      .where(eq(page.idx, pageId))
      .limit(1)
      .leftJoin(book, eq(page.bookId, book.idx))
  )[0];
  if (!pageData) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }
  if (
    !pageData ||
    !pageData.book ||
    pageData.book.ownerId !== session.user.id
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const deletedPages = await db
      .delete(page)
      .where(eq(page.idx, pageId))
      .returning();
    if (deletedPages.length === 0) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json({ error: 'Error deleting page' }, { status: 500 });
  }
}
