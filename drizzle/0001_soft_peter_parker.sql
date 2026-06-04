CREATE TABLE "streak_freeze_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"streak_id" uuid NOT NULL,
	"frozen_on" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "streak_freeze_days_streak_date_unique" UNIQUE("streak_id","frozen_on")
);
--> statement-breakpoint
ALTER TABLE "streak_freeze_days" ADD CONSTRAINT "streak_freeze_days_streak_id_streaks_id_fk" FOREIGN KEY ("streak_id") REFERENCES "public"."streaks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "streak_freeze_days_streak_id_idx" ON "streak_freeze_days" USING btree ("streak_id");