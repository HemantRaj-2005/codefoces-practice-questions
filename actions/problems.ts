"use server";

import { db } from "@/lib/db";
import { problemSchema, csvRowSchema } from "@/validators";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import Papa from "papaparse";

// Helper to check authentication
async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized: Admin session required.");
  }
}

// PROBLEMS CRUD

export async function createProblem(data: {
  subTopicId: string;
  problem: string;
  rating: number;
  mainTopic: string;
  hiddenPattern?: string | null;
  link: string;
  notes?: string | null;
}) {
  await requireAuth();

  const validated = problemSchema.parse(data);

  // Check unique link
  const existing = await db.problem.findUnique({
    where: { link: validated.link },
  });

  if (existing) {
    throw new Error("A problem with this link already exists.");
  }

  const problem = await db.problem.create({
    data: {
      subTopicId: validated.subTopicId,
      problem: validated.problem,
      rating: validated.rating,
      mainTopic: validated.mainTopic,
      hiddenPattern: validated.hiddenPattern || null,
      link: validated.link,
      notes: validated.notes || null,
      completed: false,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/problems");
  return problem;
}

export async function updateProblem(
  id: string,
  data: {
    subTopicId: string;
    problem: string;
    rating: number;
    mainTopic: string;
    hiddenPattern?: string | null;
    link: string;
    notes?: string | null;
  }
) {
  await requireAuth();

  const validated = problemSchema.parse(data);

  // Check unique link (exclude current problem)
  const existing = await db.problem.findFirst({
    where: {
      link: validated.link,
      NOT: { id },
    },
  });

  if (existing) {
    throw new Error("Another problem with this link already exists.");
  }

  const problem = await db.problem.update({
    where: { id },
    data: {
      subTopicId: validated.subTopicId,
      problem: validated.problem,
      rating: validated.rating,
      mainTopic: validated.mainTopic,
      hiddenPattern: validated.hiddenPattern || null,
      link: validated.link,
      notes: validated.notes || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/problems");
  return problem;
}

export async function deleteProblem(id: string) {
  await requireAuth();

  await db.problem.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/admin/problems");
  return { success: true };
}

export async function bulkDeleteProblems(ids: string[]) {
  await requireAuth();

  if (!ids || ids.length === 0) {
    return { success: false, count: 0 };
  }

  const result = await db.problem.deleteMany({
    where: {
      id: { in: ids },
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/problems");
  return { success: true, count: result.count };
}

// USER INTERACTIONS (Public Homepage Operations)

export async function toggleProblemCompletion(id: string, completed: boolean) {
  // Since the user is tracking their own progress, we do not require authentication here.
  const problem = await db.problem.update({
    where: { id },
    data: {
      completed,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/problems");
  return problem;
}

export async function updateProblemNotes(id: string, notes: string | null) {
  // Inline autosave on homepage
  const problem = await db.problem.update({
    where: { id },
    data: {
      notes: notes || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/problems");
  return problem;
}

// CSV UPLOAD

export async function uploadCSV(subTopicId: string, csvDataString: string) {
  await requireAuth();

  if (!subTopicId) {
    return { error: "Subtopic ID is required." };
  }

  // Parse CSV
  const parsed = Papa.parse(csvDataString, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors && parsed.errors.length > 0) {
    return { error: "Failed to parse CSV: " + parsed.errors[0].message };
  }

  const rows = parsed.data as any[];
  if (rows.length === 0) {
    return { error: "CSV file is empty." };
  }

  // Validate columns
  const headers = parsed.meta.fields || [];
  const requiredHeaders = ["Problem", "Rating", "Main Topic", "Hidden Pattern", "Link"];
  const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
  if (missingHeaders.length > 0) {
    return { error: `Missing required columns: ${missingHeaders.join(", ")}` };
  }

  const totalRows = rows.length;
  let added = 0;
  let skipped = 0;
  let invalidRows = 0;
  const errors: string[] = [];

  const validProblemsToInsert: any[] = [];

  // Get existing problem links from database
  const existingLinks = new Set(
    (await db.problem.findMany({ select: { link: true } })).map((p: any) => p.link)
  );

  // Track duplicates within the CSV itself to avoid primary key collisions in the transaction
  const csvLinksSeen = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Trim whitespace and clean input
    const cleanedRow = {
      Problem: typeof row.Problem === "string" ? row.Problem.trim() : row.Problem,
      Rating: typeof row.Rating === "string" ? row.Rating.trim() : row.Rating,
      "Main Topic": typeof row["Main Topic"] === "string" ? row["Main Topic"].trim() : row["Main Topic"],
      "Hidden Pattern": typeof row["Hidden Pattern"] === "string" ? row["Hidden Pattern"].trim() : row["Hidden Pattern"],
      Link: typeof row.Link === "string" ? row.Link.trim() : row.Link,
    };

    const validated = csvRowSchema.safeParse(cleanedRow);
    if (!validated.success) {
      invalidRows++;
      errors.push(
        `Row ${i + 1}: ${validated.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ")}`
      );
      continue;
    }

    const problemData = validated.data;
    const link = problemData.Link;

    if (existingLinks.has(link) || csvLinksSeen.has(link)) {
      skipped++;
      continue;
    }

    csvLinksSeen.add(link);
    validProblemsToInsert.push({
      subTopicId,
      problem: problemData.Problem,
      rating: problemData.Rating,
      mainTopic: problemData["Main Topic"],
      hiddenPattern: problemData["Hidden Pattern"] || null,
      link,
      completed: false,
      completedAt: null,
      notes: null,
    });
  }

  if (validProblemsToInsert.length > 0) {
    const result = await db.problem.createMany({
      data: validProblemsToInsert,
    });
    added = result.count;
  }

  revalidatePath("/");
  revalidatePath("/admin/problems");

  return {
    success: true,
    totalRows,
    added,
    skipped,
    invalidRows,
    errors,
  };
}
