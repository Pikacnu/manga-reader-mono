import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/src/utils/authSession';
import { db } from '@/db';
import { book } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { bookId, tag } = await request.json();

  if (!bookId || isNaN(Number(bookId)) || !tag || typeof tag !== 'string') {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  try {
    // Check if book exists
    const existingBook = await db
      .select()
      .from(book)
      .where(eq(book.idx, Number(bookId)))
      .limit(1);

    if (existingBook.length === 0) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const currentTags = (existingBook[0].tags as string[]) || [];
    if (currentTags.includes(tag)) {
      return NextResponse.json({ message: 'Tag already exists' });
    }

    const newTags = [...currentTags, tag];

    await db
      .update(book)
      .set({ tags: newTags })
      .where(eq(book.idx, Number(bookId)));

    return NextResponse.json({
      message: 'Tag added successfully',
      tags: newTags,
    });
  } catch (error) {
    console.error('Error adding tag:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
