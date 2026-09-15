'use server';

import { revalidatePath } from 'next/cache';

import { authorize } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { ROLES } from '@/shared/constants/roles';

export interface QuizQuestionData {
  id: string;
  prompt: string;
  kind: 'SINGLE' | 'MULTIPLE';
  choices: { id: string; text: string }[];
}

export interface QuizAttemptStart {
  attemptId: string;
  title: string;
  description: string | null;
  passingScore: number;
  timeLimitSec: number | null;
  questions: QuizQuestionData[];
}

export interface QuizSubmitResultData {
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctCount: number;
  results: {
    questionId: string;
    correct: boolean;
    correctChoiceIds: string[];
    explanation: string | null;
  }[];
}

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function shuffled<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

/**
 * Start a new attempt for the quiz attached to `lessonId`. Re-checks enrollment
 * independently (reachable via direct POST). When the quiz has `randomCount` set,
 * draws a random subset of questions for this attempt.
 */
export async function startQuizAttempt(lessonId: string): Promise<ActionResult<QuizAttemptStart>> {
  const session = await authorize(ROLES.STUDENT);
  if (!session) return { ok: false, error: 'Not authorized.' };

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      section: { select: { courseId: true } },
      quiz: {
        include: { questions: { include: { choices: true }, orderBy: { order: 'asc' } } },
      },
    },
  });
  if (!lesson?.quiz) return { ok: false, error: 'This lesson has no quiz.' };

  const enrollment = await db.enrollment.findUnique({
    where: {
      studentId_courseId: { studentId: session.user.id, courseId: lesson.section.courseId },
    },
    select: { id: true },
  });
  if (!enrollment) return { ok: false, error: 'You are not enrolled in this course.' };

  const { quiz } = lesson;
  if (quiz.questions.length === 0) return { ok: false, error: 'This quiz has no questions yet.' };

  let pool = quiz.questions;
  if (quiz.randomCount && quiz.randomCount < pool.length) {
    pool = shuffled(pool).slice(0, quiz.randomCount);
  }

  const attempt = await db.quizAttempt.create({
    data: { quizId: quiz.id, studentId: session.user.id },
    select: { id: true },
  });

  return {
    ok: true,
    data: {
      attemptId: attempt.id,
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      timeLimitSec: quiz.timeLimitSec,
      questions: pool.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        kind: q.kind,
        choices: shuffled(q.choices).map((c) => ({ id: c.id, text: c.text })),
      })),
    },
  };
}

/**
 * Grade and submit a quiz attempt. Re-checks that the attempt belongs to the
 * signed-in student and hasn't already been submitted (reachable via direct POST).
 * Marks the lesson complete when the attempt passes.
 */
export async function submitQuizAttempt(
  attemptId: string,
  answers: { questionId: string; choiceIds: string[] }[]
): Promise<ActionResult<QuizSubmitResultData>> {
  const session = await authorize(ROLES.STUDENT);
  if (!session) return { ok: false, error: 'Not authorized.' };
  if (answers.length === 0) return { ok: false, error: 'Answer at least one question.' };

  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      studentId: true,
      submittedAt: true,
      quiz: {
        select: {
          id: true,
          passingScore: true,
          lesson: { select: { id: true, section: { select: { courseId: true } } } },
        },
      },
    },
  });
  if (!attempt || attempt.studentId !== session.user.id) {
    return { ok: false, error: 'Attempt not found.' };
  }
  if (attempt.submittedAt) return { ok: false, error: 'This attempt was already submitted.' };

  const questionIds = answers.map((a) => a.questionId);
  const questions = await db.question.findMany({
    where: { id: { in: questionIds }, quizId: attempt.quiz.id },
    select: { id: true, explanation: true, choices: { select: { id: true, isCorrect: true } } },
  });
  const byId = new Map(questions.map((q) => [q.id, q]));

  let correctCount = 0;
  const results: QuizSubmitResultData['results'] = [];
  // Schema stores one selected choice per (attempt, question); record the first
  // pick for multi-select questions, purely for the audit trail — grading below
  // uses the full submitted selection, not this row.
  const answerRows: { attemptId: string; questionId: string; choiceId: string }[] = [];

  for (const answer of answers) {
    const question = byId.get(answer.questionId);
    if (!question) continue;
    const correctChoiceIds = question.choices.filter((c) => c.isCorrect).map((c) => c.id);
    const selected = new Set(answer.choiceIds);
    const isCorrect =
      selected.size === correctChoiceIds.length && correctChoiceIds.every((id) => selected.has(id));
    if (isCorrect) correctCount += 1;
    results.push({
      questionId: question.id,
      correct: isCorrect,
      correctChoiceIds,
      explanation: question.explanation,
    });
    const primary = answer.choiceIds[0];
    if (primary) answerRows.push({ attemptId, questionId: answer.questionId, choiceId: primary });
  }

  const totalQuestions = results.length;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passed = score >= attempt.quiz.passingScore;

  if (answerRows.length > 0) {
    await db.attemptAnswer.createMany({ data: answerRows, skipDuplicates: true });
  }
  await db.quizAttempt.update({
    where: { id: attemptId },
    data: { score, passed, submittedAt: new Date() },
  });

  const courseId = attempt.quiz.lesson.section.courseId;
  if (passed) {
    const lessonId = attempt.quiz.lesson.id;
    const enrollment = await db.enrollment.findUnique({
      where: { studentId_courseId: { studentId: session.user.id, courseId } },
      select: { id: true },
    });
    if (enrollment) {
      await db.lessonProgress.upsert({
        where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
        create: {
          enrollmentId: enrollment.id,
          lessonId,
          studentId: session.user.id,
          completed: true,
          completedAt: new Date(),
        },
        update: { completed: true, completedAt: new Date() },
      });
    }
  }
  revalidatePath(`/student/courses/${courseId}/learn`);

  return { ok: true, data: { score, passed, totalQuestions, correctCount, results } };
}
