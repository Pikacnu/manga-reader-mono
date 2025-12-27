CREATE TYPE "public"."page_direction" AS ENUM('left', 'right');--> statement-breakpoint
CREATE TYPE "public"."pages_per_view" AS ENUM('one', 'two');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book" (
	"idx" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"cover_id" text DEFAULT '',
	"description" text,
	"tags" json DEFAULT '[]'::json,
	"uploaded_at" date DEFAULT CURRENT_TIMESTAMP,
	"updated_at" date DEFAULT CURRENT_TIMESTAMP,
	"owner_id" text NOT NULL,
	"reader_pages_per_view" "pages_per_view" DEFAULT 'two' NOT NULL,
	"reader_page_direction" "page_direction" DEFAULT 'right' NOT NULL,
	"views" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapter" (
	"idx" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"title" text NOT NULL,
	"tags" json DEFAULT '[]'::json,
	"chapter_number" integer NOT NULL,
	CONSTRAINT "book_chapter_unique_idx" UNIQUE("book_id","chapter_number")
);
--> statement-breakpoint
CREATE TABLE "comment" (
	"idx" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "favorite" (
	"idx" serial PRIMARY KEY NOT NULL,
	"book_idx" integer NOT NULL,
	"user_id" text NOT NULL,
	"favorited_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "history" (
	"idx" serial PRIMARY KEY NOT NULL,
	"book_idx" integer NOT NULL,
	"page_number" integer NOT NULL,
	"user_id" text NOT NULL,
	"viewed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "image" (
	"id" text PRIMARY KEY NOT NULL,
	"image_path" text NOT NULL,
	"uploaded_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "page" (
	"idx" serial PRIMARY KEY NOT NULL,
	"book_id" integer NOT NULL,
	"chapter_id" integer NOT NULL,
	"page_number" integer NOT NULL,
	"image_id" text NOT NULL,
	CONSTRAINT "chapter_page_unique_idx" UNIQUE("chapter_id","page_number")
);
--> statement-breakpoint
CREATE TABLE "rating" (
	"idx" serial PRIMARY KEY NOT NULL,
	"book_idx" integer NOT NULL,
	"user_id" text NOT NULL,
	"score" integer NOT NULL,
	"rated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book" ADD CONSTRAINT "book_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chapter" ADD CONSTRAINT "chapter_book_id_book_idx_fk" FOREIGN KEY ("book_id") REFERENCES "public"."book"("idx") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_book_id_book_idx_fk" FOREIGN KEY ("book_id") REFERENCES "public"."book"("idx") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_book_idx_book_idx_fk" FOREIGN KEY ("book_idx") REFERENCES "public"."book"("idx") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "history" ADD CONSTRAINT "history_book_idx_book_idx_fk" FOREIGN KEY ("book_idx") REFERENCES "public"."book"("idx") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "history" ADD CONSTRAINT "history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "page" ADD CONSTRAINT "page_book_id_book_idx_fk" FOREIGN KEY ("book_id") REFERENCES "public"."book"("idx") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "page" ADD CONSTRAINT "page_chapter_id_chapter_idx_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapter"("idx") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rating" ADD CONSTRAINT "rating_book_idx_book_idx_fk" FOREIGN KEY ("book_idx") REFERENCES "public"."book"("idx") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "rating" ADD CONSTRAINT "rating_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;