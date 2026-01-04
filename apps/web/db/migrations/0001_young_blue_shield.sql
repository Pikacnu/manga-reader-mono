ALTER TABLE "book" ALTER COLUMN "tags" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "book" ALTER COLUMN "tags" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "book" ALTER COLUMN "uploaded_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "book" ALTER COLUMN "uploaded_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "book" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "book" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;