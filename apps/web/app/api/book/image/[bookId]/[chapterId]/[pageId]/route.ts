import { db } from '@/db';
import { page } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
//import { readFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (
  _request: NextRequest,
  ctx: RouteContext<'/api/book/image/[bookId]/[chapterId]/[pageId]'>,
) => {
  const [bookId, chapterId, pageNumber] = Object.values(await ctx.params).map(
    Number,
  );
  try {
    const result = (
      await db
        .select({
          imageId: page.imageId,
        })
        .from(page)
        .where(
          and(
            eq(page.bookId, bookId),
            eq(page.chapterId, chapterId),
            eq(page.pageNumber, pageNumber),
          ),
        )
        .limit(1)
    )[0];
    if (!result || !result.imageId) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_IMAGE_SERVER_URL || 'http://localhost:3002';
    return NextResponse.redirect(`${baseUrl}/image/${result.imageId}`);
  } catch (error) {
    console.error('Error fetching page info:', error);
    return NextResponse.json(
      { error: 'Error fetching page info' },
      { status: 500 },
    );
  }
};
