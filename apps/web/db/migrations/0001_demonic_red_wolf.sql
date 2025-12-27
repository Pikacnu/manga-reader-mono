CREATE TABLE "favorite" (
	"idx" serial PRIMARY KEY NOT NULL,
	"book_idx" serial NOT NULL,
	"user_id" text NOT NULL,
	"favorited_at" date DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "history" (
	"idx" serial PRIMARY KEY NOT NULL,
	"book_idx" serial NOT NULL,
	"page_number" integer NOT NULL,
	"user_id" text NOT NULL,
	"viewed_at" date DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "rating" (
	"idx" serial PRIMARY KEY NOT NULL,
	"book_idx" serial NOT NULL,
	"user_id" text NOT NULL,
	"score" integer NOT NULL,
	"rated_at" date DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
DROP TABLE "views" CASCADE;--> statement-breakpoint
ALTER TABLE "book" ADD COLUMN "author" text NOT NULL;--> statement-breakpoint
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_book_idx_book_idx_fk" FOREIGN KEY ("book_idx") REFERENCES "public"."book"("idx") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "history" ADD CONSTRAINT "history_book_idx_book_idx_fk" FOREIGN KEY ("book_idx") REFERENCES "public"."book"("idx") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "history" ADD CONSTRAINT "history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rating" ADD CONSTRAINT "rating_book_idx_book_idx_fk" FOREIGN KEY ("book_idx") REFERENCES "public"."book"("idx") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rating" ADD CONSTRAINT "rating_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;