'use server';
import { db } from '@/db';
import { book } from '@/db/schema';
import NavBar from '@/src/components/navbar';
import type { Metadata, ResolvingMetadata } from 'next';
import { eq } from 'drizzle-orm';

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    bookId: string;
  }>;
  parent: ResolvingMetadata;
}): Promise<Metadata> {
  try {
    const { bookId } = await params;
    const bookIdNumber = parseInt(bookId, 10);

    if (isNaN(bookIdNumber)) {
      throw new Error('Invalid book ID');
    }

    const bookData = (
      await db
        .select({
          title: book.title,
          description: book.description,
          author: book.author,
          views: book.views,
          tags: book.tags,
        })
        .from(book)
        .where(eq(book.idx, bookIdNumber))
        .limit(1)
    )[0];

    const bookTitle = `${bookData.title}`;
    const bookDescription = `${
      bookData.description || 'No description available.'
    } Author: ${bookData.author || 'Unknown'} | Views: ${
      bookData.views || 0
    } | Tags: ${(bookData.tags as Array<string>).join(', ') || 'None'}`;

    return {
      title: bookTitle,
      description: bookDescription,
    };
  } catch (error) {
    console.error('Error generating metadata for book:', error);
    return {
      title: 'Book Not Found',
      description: 'The requested book does not exist.',
    };
  }
}

export default async function BookLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <NavBar />
      {children}
    </>
  );
}
