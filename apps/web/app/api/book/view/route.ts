import { db } from '@/db';
import { book } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export const POST = async (req: Request) => {
  const { bookIdx } = await req.json();

  if (!bookIdx || Number.isNaN(Number(bookIdx))) {
    return new Response(JSON.stringify({ message: 'Invalid input' }), {
      status: 400,
    });
  }

  try {
    await db
      .update(book)
      .set({
        views: sql`${book.views} + 1`,
      })
      .where(eq(book.idx, Number(bookIdx)));

    return new Response(JSON.stringify({ message: 'View counted' }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error counting view:', error);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
    });
  }
};
