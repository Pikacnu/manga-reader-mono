ALTER TABLE "book" ALTER COLUMN "reader_pages_per_view" SET DEFAULT 'two';--> statement-breakpoint
ALTER TABLE "book" ADD COLUMN "views" integer DEFAULT 0 NOT NULL;