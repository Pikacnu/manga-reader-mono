import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const ImageIdLink = pgTable('image_id_link', {
  id: text('id').primaryKey(),
  filePath: text('file_path').notNull(),
  isSaved: integer('is_saved').default(0),
  isProcessing: integer('is_processing').default(0),
  uploadData: timestamp('upload_date').defaultNow(),
  lastUsedDate: timestamp('last_used_date').defaultNow(),
});
