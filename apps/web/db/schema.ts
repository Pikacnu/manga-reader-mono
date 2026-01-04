import { sql } from 'drizzle-orm';
import {
  serial,
  text,
  timestamp,
  boolean,
  date,
  json,
  jsonb,
  pgTable,
  unique,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core';

import { PagesPerView, PageDirection } from '@/src/types/manga';

export const pageDirectionEnum = pgEnum('page_direction', [
  PageDirection.LEFT,
  PageDirection.RIGHT,
]);

export const pagesPerViewEnum = pgEnum('pages_per_view', [
  PagesPerView.ONE,
  PagesPerView.TWO,
]);

// Auth Tables

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// Application Data

export const book = pgTable('book', {
  idx: serial('idx').primaryKey(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  coverId: text('cover_id').default(''), // image ID for cover
  description: text('description'),
  tags: jsonb('tags').default([]),
  uploadedAt: timestamp('uploaded_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
  ownerId: text('owner_id')
    .notNull()
    .references(() => user.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  readerPagesPerView: pagesPerViewEnum('reader_pages_per_view')
    .default(PagesPerView.TWO)
    .notNull(),
  readerPageDirection: pageDirectionEnum('reader_page_direction')
    .default(PageDirection.RIGHT)
    .notNull(),
  views: integer('views').default(0).notNull(),
});

export const chapter = pgTable(
  'chapter',
  {
    idx: serial('idx').primaryKey(),
    bookId: integer('book_id')
      .notNull()
      .references(() => book.idx, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    title: text('title').notNull(),
    tags: json('tags').default([]),
    chapterNumber: integer('chapter_number').notNull(),
  },
  (table) => {
    return [
      unique('book_chapter_unique_idx').on(table.bookId, table.chapterNumber),
    ];
  },
);

export const image = pgTable('image', {
  id: text('id').primaryKey(),
  imagePath: text('image_path').notNull(),
  uploadedAt: timestamp('uploaded_at').default(sql`CURRENT_TIMESTAMP`),
});

export const page = pgTable(
  'page',
  {
    idx: serial('idx').primaryKey(),
    bookId: integer('book_id')
      .notNull()
      .references(() => book.idx, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    chapterId: integer('chapter_id')
      .notNull()
      .references(() => chapter.idx, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    pageNumber: integer('page_number').notNull(),
    imageId: text('image_id').notNull(),
  },
  (table) => {
    return [
      unique('chapter_page_unique_idx').on(table.chapterId, table.pageNumber),
    ];
  },
);

// User Actions

export const comment = pgTable('comment', {
  idx: serial('idx').primaryKey(),
  bookId: integer('book_id')
    .notNull()
    .references(() => book.idx, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const history = pgTable('history', {
  idx: serial('idx').primaryKey(),
  bookIdx: integer('book_idx')
    .notNull()
    .references(() => book.idx, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  pageNumber: integer('page_number').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  viewedAt: timestamp('viewed_at').defaultNow(),
});

export const rating = pgTable('rating', {
  idx: serial('idx').primaryKey(),
  bookIdx: integer('book_idx')
    .notNull()
    .references(() => book.idx, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  score: integer('score').notNull(), // 1 to 5
  ratedAt: timestamp('rated_at').defaultNow(),
});

export const favorite = pgTable('favorite', {
  idx: serial('idx').primaryKey(),
  bookIdx: integer('book_idx')
    .notNull()
    .references(() => book.idx, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  favoritedAt: timestamp('favorited_at').defaultNow(),
});
