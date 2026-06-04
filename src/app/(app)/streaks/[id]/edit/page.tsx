import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { StreakWizard } from "@/components/streaks/streak-wizard";
import { getStreakForUser } from "@/lib/streaks/queries";
import { formatReminderTimeForInput } from "@/lib/streaks/timezone";
import { isAvatarUploadConfigured } from "@/lib/storage/r2";
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
    <main className="mx-auto flex w-full max-w-3xl flex-1 justify-center p-6">
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
          proofMode: streak.proofMode as ProofMode,
          freezePerMonth: streak.freezePerMonth,
          avatarUrl: streak.avatarUrl,
        }}
      />
    </main>
  );
}
