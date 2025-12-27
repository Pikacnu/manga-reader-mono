import { db } from '@/db';
import { getSession } from '@/src/utils/authSession';
import { history } from '@/db/schema';
import { desc, eq, and, sql } from 'drizzle-orm';

export const POST = async (req: Request) => {
  const session = await getSession(req);
  if (!session) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
    });
  }
  const { bookIdx, page } = await req.json();
  if (
    !bookIdx ||
    Number.isNaN(Number(bookIdx)) ||
    !page ||
    Number.isNaN(Number(page))
  ) {
    return new Response(JSON.stringify({ message: 'Invalid input' }), {
      status: 400,
    });
  }
  // Insert or update history in database
  try {
    const existingHistory = await db
      .select()
      .from(history)
      .where(
        and(
          eq(history.userId, session.user.id),
          eq(history.bookIdx, Number(bookIdx)),
        ),
      )
      .limit(1);

    if (existingHistory.length > 0) {
      await db
        .update(history)
        .set({
          pageNumber: Number(page),
          viewedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(history.idx, existingHistory[0].idx));
    } else {
      await db.insert(history).values({
        bookIdx: Number(bookIdx),
        pageNumber: Number(page),
        userId: session.user.id,
      });
    }

    return new Response(JSON.stringify({ message: 'History updated' }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error adding history:', error);
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
  const countParam = url.searchParams.get('count');
  const count = countParam ? Number(countParam) : 10;

  if (bookIdx) {
    try {
      const historyEntry = await db
        .select()
        .from(history)
        .where(
          and(
            eq(history.userId, session.user.id),
            eq(history.bookIdx, Number(bookIdx)),
          ),
        )
        .limit(1);
      return new Response(JSON.stringify({ history: historyEntry[0] }), {
        status: 200,
      });
    } catch (error) {
      console.error('Error fetching history:', error);
      return new Response(
        JSON.stringify({ message: 'Internal Server Error' }),
        {
          status: 500,
        },
      );
    }
  }

  if (Number.isNaN(count) || count <= 0) {
    return new Response(
      JSON.stringify({ message: 'Invalid count parameter' }),
      {
        status: 400,
      },
    );
  }
  try {
    const histories = await db
      .select()
      .from(history)
      .where(eq(history.userId, session.user.id))
      .orderBy(desc(history.viewedAt))
      .limit(count);
    return new Response(JSON.stringify({ histories }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
    });
  }
};
