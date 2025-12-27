-- Drop existing tables if they exist
DROP TABLE IF EXISTS "account" CASCADE;
DROP TABLE IF EXISTS "book" CASCADE;
DROP TABLE IF EXISTS "chapter" CASCADE;
DROP TABLE IF EXISTS "comment" CASCADE;
DROP TABLE IF EXISTS "page" CASCADE;
DROP TABLE IF EXISTS "session" CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
DROP TABLE IF EXISTS "verification" CASCADE;
DROP TABLE IF EXISTS "views" CASCADE;
--> statement-breakpoint

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
	"cover_url" text,
	"description" text,
	"tags" json DEFAULT '[]'::json,
	"uploaded_at" date DEFAULT CURRENT_TIMESTAMP,
	"updated_at" date DEFAULT CURRENT_TIMESTAMP,
	"owner_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapter" (
	"idx" serial PRIMARY KEY NOT NULL,
	"book_id" serial NOT NULL,
	"title" text NOT NULL,
	"tags" json DEFAULT '[]'::json,
	"chapter_number" integer NOT NULL,
	CONSTRAINT "book_chapter_unique_idx" UNIQUE("book_id","chapter_number")
);
--> statement-breakpoint
CREATE TABLE "comment" (
	"idx" serial PRIMARY KEY NOT NULL,
	"book_id" serial NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" date DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "page" (
	"idx" serial PRIMARY KEY NOT NULL,
	"book_id" serial NOT NULL,
	"chapter_id" serial NOT NULL,
	"page_number" integer NOT NULL,
	"image_path" text NOT NULL,
	CONSTRAINT "chapter_page_unique_idx" UNIQUE("chapter_id","page_number")
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
CREATE TABLE "views" (
	"idx" serial PRIMARY KEY NOT NULL,
	"book_idx" serial NOT NULL,
	"user_id" text NOT NULL,
	"viewed_at" date DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book" ADD CONSTRAINT "book_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chapter" ADD CONSTRAINT "chapter_book_id_book_idx_fk" FOREIGN KEY ("book_id") REFERENCES "public"."book"("idx") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_book_id_book_idx_fk" FOREIGN KEY ("book_id") REFERENCES "public"."book"("idx") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "page" ADD CONSTRAINT "page_book_id_book_idx_fk" FOREIGN KEY ("book_id") REFERENCES "public"."book"("idx") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "page" ADD CONSTRAINT "page_chapter_id_chapter_idx_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapter"("idx") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "views" ADD CONSTRAINT "views_book_idx_book_idx_fk" FOREIGN KEY ("book_idx") REFERENCES "public"."book"("idx") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "views" ADD CONSTRAINT "views_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;