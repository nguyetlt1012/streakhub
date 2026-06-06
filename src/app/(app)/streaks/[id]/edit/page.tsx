import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { StreakWizard } from "@/components/streaks/streak-wizard";
import { getStreakForUser } from "@/lib/streaks/queries";
import { formatReminderTimeForInput } from "@/lib/streaks/timezone";
import { isAvatarUploadConfigured } from "@/lib/storage/r2";
import { getStreakProofModes } from "@/lib/streaks/proof-modes";
import type { ProofMode } from "@/lib/streaks/constants";

type EditStreakPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditStreakPage({ params }: EditStreakPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    notFound();
  }

  const { id } = await params;
  const streak = await getStreakForUser(id, session.user.id);

  if (!streak) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col px-5 pb-32 pt-10">
      <StreakWizard
        mode="edit"
        streakId={streak.id}
        avatarUploadEnabled={isAvatarUploadConfigured()}
        initialValues={{
          name: streak.name,
          timezone: streak.timezone,
          reminderTime: formatReminderTimeForInput(String(streak.reminderTime)),
          iconType: streak.iconType,
          iconPreset: streak.iconPreset ?? "book-open",
          proofModes: getStreakProofModes(streak) as ProofMode[],
          freezePerMonth: streak.freezePerMonth,
          targetStreak: streak.targetStreak,
          avatarUrl: streak.avatarUrl,
        }}
      />
    </main>
  );
}
