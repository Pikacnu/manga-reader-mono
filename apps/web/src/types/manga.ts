export type Book = {
  id: number;
  title: string;
  author: string;
  description: string;
  tags: string[];
  chapters: Chapter[];
};

export enum PagesPerView {
  ONE = 'one',
  TWO = 'two',
}

export enum PageDirection {
  LEFT = 'left',
  RIGHT = 'right',
}

export type BookReaderConfig = {
  pagesPerView: PagesPerView;
  pageDirection: PageDirection;
};

export type BookInfo = Omit<Book, 'id' | 'chapters' | 'tags'> &
  Partial<Pick<Book, 'tags'>> &
  Partial<BookReaderConfig> & {
    id?: number;
    views?: number;
    coverId?: string;
  };

export const exampleBook: BookInfo = {
  title: 'Example Manga',
  author: 'John Doe',
  description: 'An example manga description.',
  tags: ['action', 'adventure'],
};

export type ChapterInfo = Omit<Chapter, 'pages'> & {
  tags?: string[];
};

export type Chapter = {
  id: number;
  title: string;
  chapterNumber: number;
  pages: Page[];
};

export type Page = {
  id: number;
  isBlurred?: boolean;
  isBlank?: boolean;
  imageUrl: string;
  getImageUrl?: (width: number) => string;
  imageId: string;
  pageNumber: number;
};

export type PageChangeType = {
  pageId: number;
  pageNumber: number;
  chapterId: number;
};

export const examplePageChange: PageChangeType = {
  pageId: 1,
  pageNumber: 5,
  chapterId: 1,
};
