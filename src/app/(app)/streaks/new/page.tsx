import { StreakWizard } from "@/components/streaks/streak-wizard";
import { isAvatarUploadConfigured } from "@/lib/storage/r2";

export default function NewStreakPage() {
  return (
    <main className="flex min-h-screen flex-col px-5 pb-32 pt-10">
      <StreakWizard mode="create" avatarUploadEnabled={isAvatarUploadConfigured()} />
    </main>
  );
}
