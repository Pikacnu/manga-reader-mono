import { db } from '@/db';
import { rating } from '@/db/schema';
import { getSession } from '@/src/utils/authSession';
import { eq, and, sql } from 'drizzle-orm';

export const POST = async (req: Request) => {
  const session = await getSession(req);
  if (!session) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
    });
  }
  const { bookIdx, score } = await req.json();
  if (
    !bookIdx ||
    Number.isNaN(Number(bookIdx)) ||
    !score ||
    Number.isNaN(Number(score))
  ) {
    return new Response(JSON.stringify({ message: 'Invalid input' }), {
      status: 400,
    });
  }
  if (Number(score) < 1 || Number(score) > 5 || Number(score) % 0.5 !== 0) {
    return new Response(
      JSON.stringify({
        message: 'Score must be between 1 and 5 and increments of 0.5',
      }),
      {
        status: 400,
      },
    );
  }
  // Insert or update rating into database
  try {
    const existingRatings = await db
      .select()
      .from(rating)
      .where(
        and(
          eq(rating.bookIdx, Number(bookIdx)),
          eq(rating.userId, session.user.id),
        ),
      );

    if (existingRatings.length > 0) {
      await db
        .update(rating)
        .set({ score: Number(score) })
        .where(eq(rating.idx, existingRatings[0].idx));
      return new Response(JSON.stringify({ message: 'Rating updated' }), {
        status: 200,
      });
    } else {
      await db.insert(rating).values({
        bookIdx: Number(bookIdx),
        score: Number(score),
        userId: session.user.id,
      });
      return new Response(JSON.stringify({ message: 'Rating added' }), {
        status: 201,
      });
    }
  } catch (error) {
    console.error('Error adding rating:', error);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
    });
  }
};

export const GET = async (req: Request) => {
  const url = new URL(req.url);
  const bookIdxParam = url.searchParams.get('bookIdx');
  if (!bookIdxParam || Number.isNaN(Number(bookIdxParam))) {
    return new Response(
      JSON.stringify({ message: 'Invalid bookIdx parameter' }),
      {
        status: 400,
      },
    );
  }
  const bookIdx = Number(bookIdxParam);
  try {
    const result = await db
      .select({
        averageScore: sql<number>`avg(${rating.score})`,
        ratingCount: sql<number>`count(${rating.score})`,
      })
      .from(rating)
      .where(eq(rating.bookIdx, bookIdx));

    const { averageScore, ratingCount } = result[0];

    return new Response(
      JSON.stringify({
        averageScore: Number(Number(averageScore || 0).toFixed(2)),
        ratingCount: Number(ratingCount || 0),
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
    });
  }
};
