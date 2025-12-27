import { db } from '@/db';
import { getSession } from '@/src/utils/authSession';
import { favorite } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export const POST = async (req: Request) => {
  const session = await getSession(req);
  if (!session) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
    });
  }
  const { bookIdx } = await req.json();
  if (!bookIdx || Number.isNaN(Number(bookIdx))) {
    return new Response(JSON.stringify({ message: 'Invalid input' }), {
      status: 400,
    });
  }

  try {
    const existingFavorite = await db
      .select()
      .from(favorite)
      .where(
        and(
          eq(favorite.userId, session.user.id),
          eq(favorite.bookIdx, Number(bookIdx)),
        ),
      )
      .limit(1);

    if (existingFavorite.length > 0) {
      // Remove favorite
      await db
        .delete(favorite)
        .where(
          and(
            eq(favorite.userId, session.user.id),
            eq(favorite.bookIdx, Number(bookIdx)),
          ),
        );
      return new Response(
        JSON.stringify({
          message: 'Removed from favorites',
          isFavorited: false,
        }),
        { status: 200 },
      );
    } else {
      // Add favorite
      await db.insert(favorite).values({
        userId: session.user.id,
        bookIdx: Number(bookIdx),
      });
      return new Response(
        JSON.stringify({ message: 'Added to favorites', isFavorited: true }),
        { status: 201 },
      );
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
    });
  }
};

export const GET = async (req: Request) => {
  const session = await getSession(req);
  if (!session) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
    });
  }
  const url = new URL(req.url);
  const bookIdx = url.searchParams.get('bookIdx');

  if (!bookIdx || Number.isNaN(Number(bookIdx))) {
    return new Response(JSON.stringify({ message: 'Invalid input' }), {
      status: 400,
    });
  }

  try {
    const existingFavorite = await db
      .select()
      .from(favorite)
      .where(
        and(
          eq(favorite.userId, session.user.id),
          eq(favorite.bookIdx, Number(bookIdx)),
        ),
      )
      .limit(1);

    return new Response(
      JSON.stringify({ isFavorited: existingFavorite.length > 0 }),
      { status: 200 },
    );
  } catch (error) {
    console.error('Error checking favorite:', error);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
    });
  }
};
