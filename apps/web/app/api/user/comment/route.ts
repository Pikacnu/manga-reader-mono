// This one is in deving
// and here is some note for you to read
// implement three api and change schema by the change of the requirement

import { db } from '@/db';
import { comment, user } from '@/db/schema';
import { getSession } from '@/src/utils/authSession';
import { and, eq, desc } from 'drizzle-orm';

export const POST = async (req: Request) => {
  const session = await getSession(req);
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { comment: contentValue, bookIdx } = await req.json();
  if (
    !contentValue ||
    contentValue.trim() === '' ||
    !bookIdx ||
    Number.isNaN(Number(bookIdx))
  ) {
    return Response.json({ message: 'Invalid input' }, { status: 400 });
  }
  // Insert comment into database
  try {
    const insertedCommentId = (
      await db
        .insert(comment)
        .values({
          bookId: Number(bookIdx),
          userId: session.user.id,
          content: contentValue.trimStart().trimEnd(),
        })
        .returning({ id: comment.idx })
    )[0];

    if (insertedCommentId && insertedCommentId.id) {
      return Response.json({ message: 'Comment added' }, { status: 201 });
    } else {
      return Response.json(
        { message: 'Failed to add comment' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Error adding comment:', error);
    return Response.json({ message: 'Internal Server Error' }, { status: 500 });
  }
};

export const DELETE = async (req: Request) => {
  const session = await getSession(req);
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { commentIdx } = await req.json();
  if (!commentIdx || Number.isNaN(Number(commentIdx))) {
    return Response.json({ message: 'Invalid input' }, { status: 400 });
  }
  // Delete comment from database
  try {
    const deleteCount = await db
      .delete(comment)
      .where(
        and(
          eq(comment.idx, Number(commentIdx)),
          eq(comment.userId, session.user.id),
        ),
      )
      .returning();

    if (deleteCount.length > 0) {
      return Response.json({ message: 'Comment deleted' }, { status: 200 });
    }

    return Response.json(
      { message: 'Comment not found or unauthorized' },
      { status: 404 },
    );
  } catch (error) {
    console.error('Error deleting comment:', error);
    return Response.json({ message: 'Internal Server Error' }, { status: 500 });
  }
};

export const PUT = async (req: Request) => {
  const session = await getSession(req);
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { commentIdx, newContent } = await req.json();
  if (
    !commentIdx ||
    Number.isNaN(Number(commentIdx)) ||
    !newContent ||
    newContent.trim() === ''
  ) {
    return Response.json({ message: 'Invalid input' }, { status: 400 });
  }
  // Update comment in database
  try {
    const updateCount = await db
      .update(comment)
      .set({ content: newContent.trimStart().trimEnd() })
      .where(
        and(
          eq(comment.idx, Number(commentIdx)),
          eq(comment.userId, session.user.id),
        ),
      )
      .returning();

    if (updateCount.length > 0) {
      return Response.json({ message: 'Comment updated' }, { status: 200 });
    }

    return Response.json(
      { message: 'Comment not found or unauthorized' },
      { status: 404 },
    );
  } catch (error) {
    console.error('Error updating comment:', error);
    return Response.json({ message: 'Internal Server Error' }, { status: 500 });
  }
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const bookIdxParam = url.searchParams.get('bookIdx');
  const bookIdx = bookIdxParam ? parseInt(bookIdxParam, 10) : null;
  if (!bookIdx || isNaN(bookIdx)) {
    return Response.json(
      { error: 'Invalid or missing bookIdx parameter' },
      { status: 400 },
    );
  }
  try {
    const comments = await db
      .select({
        idx: comment.idx,
        bookId: comment.bookId,
        userId: comment.userId,
        content: comment.content,
        createdAt: comment.createdAt,
        userName: user.name,
        userImage: user.image,
      })
      .from(comment)
      .leftJoin(user, eq(comment.userId, user.id))
      .where(eq(comment.bookId, bookIdx))
      .orderBy(desc(comment.createdAt));
    return Response.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
