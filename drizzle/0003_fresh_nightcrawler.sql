CREATE TABLE "streak_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"streak_id" uuid NOT NULL,
	"target_days" integer NOT NULL,
	"achieved_on" date NOT NULL,
	"achieved_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "streaks" ADD COLUMN "target_streak" integer;--> statement-breakpoint
ALTER TABLE "streak_milestones" ADD CONSTRAINT "streak_milestones_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streak_milestones" ADD CONSTRAINT "streak_milestones_streak_id_streaks_id_fk" FOREIGN KEY ("streak_id") REFERENCES "public"."streaks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "streak_milestones_user_id_idx" ON "streak_milestones" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "streak_milestones_streak_id_idx" ON "streak_milestones" USING btree ("streak_id");--> statement-breakpoint
CREATE UNIQUE INDEX "streak_milestones_streak_target_idx" ON "streak_milestones" USING btree ("streak_id","target_days");