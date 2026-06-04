import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { TaskEditForm } from "@/components/tasks/task-edit-form";
import { getTaskForUser, listTaskStreaksForUser } from "@/lib/tasks/queries";

type EditTaskPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const [task, taskStreaks] = await Promise.all([
    getTaskForUser(id, session.user.id),
    listTaskStreaksForUser(session.user.id),
  ]);

  if (!task) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 justify-center p-6">
      <TaskEditForm task={task} taskStreaks={taskStreaks} />
    </main>
  );
}
