import { auth } from "@/auth";
import { TaskCreateForm, TaskList } from "@/components/tasks/task-list";
import { listStreaksForUser } from "@/lib/streaks/queries";
import {
  listTaskStreaksForUser,
  listTasksForUser,
} from "@/lib/tasks/queries";
import { redirect } from "next/navigation";

type TasksPageProps = {
  searchParams: Promise<{ streakId?: string }>;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { streakId: defaultStreakId } = await searchParams;
  const [taskList, taskStreaks, allStreaks] = await Promise.all([
    listTasksForUser(session.user.id),
    listTaskStreaksForUser(session.user.id),
    listStreaksForUser(session.user.id),
  ]);

  const streakNames = Object.fromEntries(
    allStreaks.map((s) => [s.id, s.name]),
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="text-sm text-muted-foreground">
          Complete linked tasks to check in on task-proof streaks.
        </p>
      </div>

      <TaskCreateForm
        taskStreaks={taskStreaks}
        defaultStreakId={defaultStreakId}
      />

      <TaskList tasks={taskList} streakNames={streakNames} />
    </main>
  );
}
