ALTER TABLE "streaks" ADD COLUMN "proof_modes" "proof_mode"[] DEFAULT '{none}' NOT NULL;--> statement-breakpoint
UPDATE "streaks" SET "proof_modes" = ARRAY["proof_mode"];--> statement-breakpoint
ALTER TABLE "streaks" DROP COLUMN "proof_mode";
