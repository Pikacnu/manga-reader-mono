ALTER TABLE "chapter" ALTER COLUMN "book_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "comment" ALTER COLUMN "book_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "comment" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "comment" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "favorite" ALTER COLUMN "book_idx" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "favorite" ALTER COLUMN "favorited_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "favorite" ALTER COLUMN "favorited_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "history" ALTER COLUMN "book_idx" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "history" ALTER COLUMN "viewed_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "history" ALTER COLUMN "viewed_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "page" ALTER COLUMN "book_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "page" ALTER COLUMN "chapter_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "rating" ALTER COLUMN "book_idx" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "rating" ALTER COLUMN "rated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "rating" ALTER COLUMN "rated_at" SET DEFAULT now();