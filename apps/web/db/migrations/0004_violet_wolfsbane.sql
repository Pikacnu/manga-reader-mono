ALTER TABLE "book" ALTER COLUMN "reader_pages_per_view" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "book" ALTER COLUMN "reader_pages_per_view" SET DEFAULT 'one'::text;--> statement-breakpoint
DROP TYPE "public"."pages_per_view";--> statement-breakpoint
CREATE TYPE "public"."pages_per_view" AS ENUM('one', 'two');--> statement-breakpoint
ALTER TABLE "book" ALTER COLUMN "reader_pages_per_view" SET DEFAULT 'one'::"public"."pages_per_view";--> statement-breakpoint
ALTER TABLE "book" ALTER COLUMN "reader_pages_per_view" SET DATA TYPE "public"."pages_per_view" USING (
    CASE "reader_pages_per_view"
        WHEN '1' THEN 'one'::"public"."pages_per_view"
        WHEN '2' THEN 'two'::"public"."pages_per_view"
        ELSE 'one'::"public"."pages_per_view"
    END
);