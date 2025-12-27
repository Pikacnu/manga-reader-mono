CREATE TYPE "public"."page_direction" AS ENUM('left', 'right');--> statement-breakpoint
CREATE TYPE "public"."pages_per_view" AS ENUM('1', '2');--> statement-breakpoint
ALTER TABLE "book" ADD COLUMN "reader_pages_per_view" "pages_per_view" DEFAULT '1' NOT NULL;--> statement-breakpoint
ALTER TABLE "book" ADD COLUMN "reader_page_direction" "page_direction" DEFAULT 'right' NOT NULL;