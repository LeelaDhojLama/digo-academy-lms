'use client';

import { CheckCircle2, HelpCircle, Loader2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import type { EnrolledLesson } from '@/features/learning/server/data';
import {
  startQuizAttempt,
  submitQuizAttempt,
  type QuizAttemptStart,
  type QuizSubmitResultData,
} from '@/features/learning/server/quiz-actions';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

type Phase = 'idle' | 'loading' | 'active' | 'submitting' | 'result';

export function QuizPlayer({
  lesson,
  onPassed,
}: {
  lesson: EnrolledLesson;
  onPassed: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [attempt, setAttempt] = useState<QuizAttemptStart | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<QuizSubmitResultData | null>(null);

  const quiz = lesson.quiz;
  if (!quiz) return null;

  async function handleStart() {
    setPhase('loading');
    const res = await startQuizAttempt(lesson.id);
    if (!res.ok) {
      toast.error(res.error);
      setPhase('idle');
      return;
    }
    setAttempt(res.data);
    setAnswers({});
    setResult(null);
    setPhase('active');
  }

  function selectSingle(questionId: string, choiceId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: [choiceId] }));
  }

  function toggleMultiple(questionId: string, choiceId: string) {
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      const next = current.includes(choiceId)
        ? current.filter((id) => id !== choiceId)
        : [...current, choiceId];
      return { ...prev, [questionId]: next };
    });
  }

  async function handleSubmit() {
    if (!attempt) return;
    setPhase('submitting');
    const payload = attempt.questions.map((q) => ({
      questionId: q.id,
      choiceIds: answers[q.id] ?? [],
    }));
    const res = await submitQuizAttempt(attempt.attemptId, payload);
    if (!res.ok) {
      toast.error(res.error);
      setPhase('active');
      return;
    }
    setResult(res.data);
    setPhase('result');
    if (res.data.passed) onPassed();
  }

  const answeredCount = attempt
    ? attempt.questions.filter((q) => (answers[q.id] ?? []).length > 0).length
    : 0;
  const allAnswered = attempt ? answeredCount === attempt.questions.length : false;

  if (phase === 'active' || phase === 'submitting') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/60">
          <div className="flex items-center gap-2 text-primary">
            <HelpCircle className="size-5" />
            <h3 className="font-heading text-lg font-semibold text-foreground">
              {attempt?.title}
            </h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {answeredCount}/{attempt?.questions.length} answered · Pass mark {quiz.passingScore}%
          </p>
        </div>

        {attempt?.questions.map((question, qi) => {
          const selected = answers[question.id] ?? [];
          return (
            <div
              key={question.id}
              className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/60"
            >
              <p className="font-medium text-foreground">
                {qi + 1}. {question.prompt}
              </p>
              <div className="mt-3 space-y-2">
                {question.choices.map((choice) => {
                  const isChecked = selected.includes(choice.id);
                  return (
                    <label
                      key={choice.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-colors',
                        isChecked
                          ? 'border-primary bg-primary/5 font-medium text-foreground'
                          : 'border-border/60 hover:bg-muted'
                      )}
                    >
                      <input
                        type={question.kind === 'MULTIPLE' ? 'checkbox' : 'radio'}
                        name={question.id}
                        checked={isChecked}
                        onChange={() =>
                          question.kind === 'MULTIPLE'
                            ? toggleMultiple(question.id, choice.id)
                            : selectSingle(question.id, choice.id)
                        }
                        className="size-4 shrink-0 accent-primary"
                      />
                      {choice.text}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        <Button
          className="w-full"
          disabled={!allAnswered || phase === 'submitting'}
          onClick={handleSubmit}
        >
          {phase === 'submitting' ? <Loader2 className="size-4 animate-spin" /> : null}
          {phase === 'submitting' ? 'Submitting…' : 'Submit quiz'}
        </Button>
      </div>
    );
  }

  if (phase === 'result' && result) {
    return (
      <div className="space-y-4">
        <div
          className={cn(
            'rounded-2xl p-6 shadow-sm ring-1',
            result.passed
              ? 'bg-emerald-500/5 ring-emerald-500/30'
              : 'bg-destructive/5 ring-destructive/30'
          )}
        >
          <div className="flex items-center gap-2">
            {result.passed ? (
              <CheckCircle2 className="size-5 text-emerald-600" />
            ) : (
              <XCircle className="size-5 text-destructive" />
            )}
            <h3 className="font-heading text-lg font-semibold text-foreground">
              {result.passed ? 'Passed' : 'Not quite — try again'}
            </h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.correctCount}/{result.totalQuestions} correct · Score {result.score}% (pass
            mark {quiz.passingScore}%)
          </p>
        </div>

        {attempt?.questions.map((question, qi) => {
          const r = result.results.find((x) => x.questionId === question.id);
          if (!r) return null;
          return (
            <div
              key={question.id}
              className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/60"
            >
              <div className="flex items-start gap-2">
                {r.correct ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                )}
                <p className="font-medium text-foreground">
                  {qi + 1}. {question.prompt}
                </p>
              </div>
              <div className="mt-3 space-y-1.5">
                {question.choices.map((choice) => {
                  const wasSelected = (answers[question.id] ?? []).includes(choice.id);
                  const isCorrectChoice = r.correctChoiceIds.includes(choice.id);
                  return (
                    <div
                      key={choice.id}
                      className={cn(
                        'rounded-xl border px-4 py-2 text-sm',
                        isCorrectChoice
                          ? 'border-emerald-500/40 bg-emerald-500/5 font-medium'
                          : wasSelected
                            ? 'border-destructive/40 bg-destructive/5'
                            : 'border-border/60'
                      )}
                    >
                      {choice.text}
                    </div>
                  );
                })}
              </div>
              {r.explanation ? (
                <p className="mt-3 text-sm text-muted-foreground">{r.explanation}</p>
              ) : null}
            </div>
          );
        })}

        <Button className="w-full" variant="outline" onClick={handleStart}>
          Retake quiz
        </Button>
      </div>
    );
  }

  const lastAttempt = quiz.lastAttempt;

  return (
    <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/60">
      <div className="flex items-center gap-2 text-primary">
        <HelpCircle className="size-5" />
        <h3 className="font-heading text-lg font-semibold text-foreground">
          {quiz.title}
        </h3>
      </div>
      {quiz.description ? (
        <p className="mt-2 text-sm text-muted-foreground">{quiz.description}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-muted px-3 py-1 font-medium">
          {quiz.questionCount} questions
        </span>
        <span className="rounded-full bg-muted px-3 py-1 font-medium">
          Pass mark {quiz.passingScore}%
        </span>
        {lastAttempt ? (
          <span
            className={cn(
              'rounded-full px-3 py-1 font-medium',
              lastAttempt.passed
                ? 'bg-emerald-500/10 text-emerald-700'
                : 'bg-destructive/10 text-destructive'
            )}
          >
            Last attempt: {lastAttempt.score}% {lastAttempt.passed ? '· Passed' : '· Not passed'}
          </span>
        ) : null}
      </div>
      <Button className="mt-5" disabled={phase === 'loading'} onClick={handleStart}>
        {phase === 'loading' ? <Loader2 className="size-4 animate-spin" /> : null}
        {phase === 'loading' ? 'Loading…' : lastAttempt ? 'Retake quiz' : 'Start quiz'}
      </Button>
    </div>
  );
}
