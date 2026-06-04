import { StreakWizard } from "@/components/streaks/streak-wizard";
import { isAvatarUploadConfigured } from "@/lib/storage/r2";

export default function NewStreakPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 justify-center p-6">
      <StreakWizard mode="create" avatarUploadEnabled={isAvatarUploadConfigured()} />
    </main>
  );
}
