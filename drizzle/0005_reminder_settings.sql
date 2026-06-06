CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"morning_brief_time" time DEFAULT '07:00:00' NOT NULL,
	"reminder_interval_minutes" integer DEFAULT 15 NOT NULL,
	"last_morning_brief_sent_on" date,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streaks" ADD COLUMN "last_reminder_sent_at" timestamp;
