"use server";

import { db } from "@/lib/db";
import { topicSchema, subTopicSchema } from "@/validators";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";

// Helper to check authentication in actions
async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized: Admin session required.");
  }
}

// TOPICS CRUD

export async function createTopic(name: string, order: number) {
  await requireAuth();

  const validated = topicSchema.parse({ name, order });

  const topic = await db.topic.create({
    data: {
      name: validated.name,
      order: validated.order,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/topics");
  return topic;
}

export async function updateTopic(id: string, name: string, order: number) {
  await requireAuth();

  const validated = topicSchema.parse({ name, order });

  const topic = await db.topic.update({
    where: { id },
    data: {
      name: validated.name,
      order: validated.order,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/topics");
  return topic;
}

export async function deleteTopic(id: string) {
  await requireAuth();

  await db.topic.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/admin/topics");
  return { success: true };
}

export async function reorderTopics(topicsList: { id: string; order: number }[]) {
  await requireAuth();

  // Perform updates in a transaction
  await db.$transaction(
    topicsList.map((t) =>
      db.topic.update({
        where: { id: t.id },
        data: { order: t.order },
      })
    )
  );

  revalidatePath("/");
  revalidatePath("/admin/topics");
  return { success: true };
}

// SUBTOPICS CRUD

export async function createSubTopic(topicId: string, name: string, order: number) {
  await requireAuth();

  const validated = subTopicSchema.parse({ topicId, name, order });

  const subTopic = await db.subTopic.create({
    data: {
      topicId: validated.topicId,
      name: validated.name,
      order: validated.order,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/topics");
  return subTopic;
}

export async function updateSubTopic(id: string, name: string, order: number) {
  await requireAuth();

  // Validate only what we need to update
  const validated = topicSchema.parse({ name, order });

  const subTopic = await db.subTopic.update({
    where: { id },
    data: {
      name: validated.name,
      order: validated.order,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/topics");
  return subTopic;
}

export async function deleteSubTopic(id: string) {
  await requireAuth();

  await db.subTopic.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/admin/topics");
  return { success: true };
}

export async function reorderSubTopics(subTopicsList: { id: string; order: number }[]) {
  await requireAuth();

  await db.$transaction(
    subTopicsList.map((st) =>
      db.subTopic.update({
        where: { id: st.id },
        data: { order: st.order },
      })
    )
  );

  revalidatePath("/");
  revalidatePath("/admin/topics");
  return { success: true };
}
