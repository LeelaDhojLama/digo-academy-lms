import {
  ArrowRight,
  Award,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Camera,
  ClipboardList,
  Code2,
  Globe2,
  GraduationCap,
  LineChart,
  Megaphone,
  MonitorPlay,
  Music2,
  PenTool,
  Plus,
  Quote,
  Radio,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import Link from 'next/link';

import { CourseCard } from '@/features/marketplace/components/CourseCard';
import {
  getBrowseCategories,
  getFeaturedInstructors,
  getPlatformStats,
  getPublishedCourses,
} from '@/features/marketplace/server/data';
import type { CourseFilters } from '@/features/marketplace/schemas';
import { Reveal } from '@/shared/components/public/Reveal';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

const DEFAULT_FILTERS: CourseFilters = {
  q: '',
  categoryId: null,
  difficulty: null,
  language: null,
  price: 'all',
  sort: 'rating',
};

const CATEGORY_STYLES = [
  { icon: Code2, className: 'bg-brand-blue/10 text-brand-blue', glow: 'group-hover:bg-brand-blue' },
  { icon: PenTool, className: 'bg-brand-coral/10 text-brand-coral', glow: 'group-hover:bg-brand-coral' },
  {
    icon: LineChart,
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    glow: 'group-hover:bg-emerald-500',
  },
  {
    icon: Megaphone,
    className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    glow: 'group-hover:bg-violet-500',
  },
  {
    icon: Camera,
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-500',
    glow: 'group-hover:bg-amber-500',
  },
  {
    icon: Globe2,
    className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    glow: 'group-hover:bg-sky-500',
  },
  {
    icon: Music2,
    className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    glow: 'group-hover:bg-rose-500',
  },
  {
    icon: BookOpen,
    className: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    glow: 'group-hover:bg-indigo-500',
  },
] as const;

const STEPS = [
  {
    icon: Search,
    title: 'Browse courses',
    body: 'Explore live cohorts and self-paced tracks across every category — filter by level, price, and language.',
  },
  {
    icon: ClipboardList,
    title: 'Request enrollment',
    body: 'Found the right fit? Submit an inquiry in seconds. No upfront payment and no commitment required.',
  },
  {
    icon: Rocket,
    title: 'Start learning',
    body: 'Our team confirms your spot and gets you into a live classroom or a self-paced track.',
  },
];

const FEATURES = [
  {
    icon: Radio,
    title: 'Live cohorts',
    body: 'Real-time classes over Google Meet — learn alongside a group with a mentor guiding every session.',
    className: 'bg-brand-blue/10 text-brand-blue',
  },
  {
    icon: MonitorPlay,
    title: 'Self-paced tracks',
    body: 'Recorded lessons, notes, and resources you can revisit anytime, on any device.',
    className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  {
    icon: BadgeCheck,
    title: 'Expert instructors',
    body: 'Learn from vetted practitioners who apply these skills in the field every day.',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: ShieldCheck,
    title: 'Certificates',
    body: 'Earn a shareable certificate of completion to showcase your new skills.',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-500',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'The live cohort kept me accountable. Having a mentor answer questions in real time made all the difference.',
    name: 'Aarav Sharma',
    role: 'Frontend Developer',
    rating: 5,
  },
  {
    quote:
      'I switched careers thanks to the self-paced data track. The curriculum was practical and easy to follow.',
    name: 'Maria Gomez',
    role: 'Data Analyst',
    rating: 5,
  },
  {
    quote:
      'Enrollment was effortless — I submitted an inquiry and the team had me set up in a cohort the next day.',
    name: 'David Chen',
    role: 'Cloud Engineer',
    rating: 5,
  },
];

const FAQS = [
  {
    q: 'How do I enroll in a course?',
    a: 'Browse the catalog, open a course, and submit an enrollment request. Our team reviews it and reaches out to confirm your spot in a live cohort or self-paced track.',
  },
  {
    q: 'Do I need to pay online?',
    a: 'No. There is no online payment gateway — you request enrollment for free, and our team arranges payment and access manually.',
  },
  {
    q: 'What is the difference between live cohorts and self-paced courses?',
    a: 'Live cohorts run on a schedule with real-time sessions over Google Meet and a group of peers. Self-paced courses are recorded lessons and notes you complete on your own time.',
  },
  {
    q: 'Will I get a certificate?',
    a: 'Yes. Eligible courses award a shareable certificate of completion once you finish the required lessons.',
  },
];

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value
  );
}

export default async function HomePage() {
  const [courses, categories, instructors, stats] = await Promise.all([
    getPublishedCourses(DEFAULT_FILTERS),
    getBrowseCategories(8),
    getFeaturedInstructors(8),
    getPlatformStats(),
  ]);
  const featured = courses.slice(0, 8);

  const statBand = [
    { label: 'Courses', value: `${compactNumber(stats.courses)}+`, icon: BookOpen },
    { label: 'Students', value: `${compactNumber(stats.students)}+`, icon: Users },
    { label: 'Instructors', value: `${compactNumber(stats.instructors)}+`, icon: GraduationCap },
    { label: 'Categories', value: `${stats.categories}+`, icon: BarChart3 },
  ];

  return (
    <div className="flex flex-col">
      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden bg-linear-to-b from-brand-blue/5 via-background to-background">
        <div className="pointer-events-none absolute -left-32 -top-32 size-80 rounded-full bg-brand-blue/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-10 size-72 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-16 text-center sm:px-6 lg:pt-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-blue/20 bg-brand-blue/10 px-3 py-1 text-xs font-medium text-brand-blue">
            <Sparkles className="size-3.5" />
            Live mentorship meets self-paced freedom
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl font-heading text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Master skills with{' '}
            <span className="text-brand-blue">live mentorship</span> &amp; self-paced freedom
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Join {compactNumber(stats.students)}+ learners accelerating their careers with real-time
            feedback and high-quality on-demand curriculum.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="rounded-full px-7 shadow-sm transition-transform hover:scale-105"
              nativeButton={false}
              render={
                <Link href="/courses">
                  Browse courses
                  <ArrowRight className="size-4" />
                </Link>
              }
            />
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-7"
              nativeButton={false}
              render={<Link href="/register">Create free account</Link>}
            />
          </div>

          {/* Framed product preview */}
          <div className="relative mx-auto mt-14 max-w-4xl pb-16" aria-hidden>
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card text-left shadow-2xl">
              <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/40 px-4 py-3">
                <span className="size-2.5 rounded-full bg-brand-coral/70" />
                <span className="size-2.5 rounded-full bg-amber-400/80" />
                <span className="size-2.5 rounded-full bg-emerald-400/80" />
                <span className="ml-3 h-5 w-full max-w-xs rounded-full bg-background" />
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-[10rem_1fr] sm:p-6">
                <div className="hidden flex-col gap-2 sm:flex">
                  <div className="flex items-center gap-2 rounded-lg bg-brand-blue px-3 py-2 text-xs font-semibold text-white">
                    <BookOpen className="size-3.5" /> Dashboard
                  </div>
                  {['Courses', 'Live Classes', 'Community', 'Certificates'].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground"
                    >
                      <span className="size-3.5 rounded bg-muted" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: BookOpen, accent: 'bg-brand-blue/10 text-brand-blue' },
                      { icon: Users, accent: 'bg-violet-500/10 text-violet-600' },
                      { icon: GraduationCap, accent: 'bg-emerald-500/10 text-emerald-600' },
                    ].map((c, i) => (
                      <div key={i} className="rounded-xl border border-border/60 p-3">
                        <span
                          className={cn(
                            'flex size-8 items-center justify-center rounded-lg [&_svg]:size-4',
                            c.accent
                          )}
                        >
                          <c.icon />
                        </span>
                        <div className="mt-2 h-4 w-2/3 rounded bg-foreground/10" />
                        <div className="mt-1.5 h-2 w-1/2 rounded bg-muted" />
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-border/60 p-4">
                    <div className="h-3 w-24 rounded bg-muted" />
                    <div className="mt-4 flex items-end gap-2">
                      {[40, 65, 50, 80, 60, 90, 72].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t bg-linear-to-t from-brand-blue/40 to-brand-blue"
                          style={{ height: `${h}px` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Power of dual-learning                                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-blue-light">
              Dual-learning
            </span>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              The power of dual-learning
            </h2>
            <p className="mt-3 max-w-md text-white/70">
              Why choose between a rigid schedule and learning alone? Digo Academy combines the best
              of both worlds.
            </p>
            <div className="mt-8 space-y-4">
              <div className="flex gap-4 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-blue/20 text-brand-blue-light [&_svg]:size-5">
                  <Radio />
                </span>
                <div>
                  <h3 className="font-heading font-semibold">Live cohorts</h3>
                  <p className="mt-1 text-sm text-white/70">
                    Real-time interaction with industry experts, weekly milestones, and peer
                    accountability.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300 [&_svg]:size-5">
                  <MonitorPlay />
                </span>
                <div>
                  <h3 className="font-heading font-semibold">Self-paced mastery</h3>
                  <p className="mt-1 text-sm text-white/70">
                    Binge-worthy video content, interactive labs, and lifetime access to
                    on-demand notifications.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-blue via-indigo-600 to-violet-600 p-8 shadow-2xl">
              <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-3xl" />
              <p className="font-heading text-3xl font-semibold tracking-tight">
                Anywhere. Anytime.
              </p>
              <p className="mt-2 text-white/80">Live classes &amp; self-paced learning</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[Radio, MonitorPlay, Users, Award].map((Icon, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-sm ring-1 ring-white/15 backdrop-blur"
                  >
                    <Icon className="size-4" />
                    <span className="h-2 w-full rounded-full bg-white/25" />
                  </div>
                ))}
              </div>
            </div>
            {/* floating chip */}
            <div className="absolute -bottom-5 left-6 flex items-center gap-2.5 rounded-2xl bg-card p-3 pr-4 text-foreground shadow-xl ring-1 ring-border/60">
              <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                <Radio className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-none">Next cohort starting</p>
                <p className="mt-1 text-xs text-muted-foreground">Enrolling now</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Categories                                                         */}
      {/* ------------------------------------------------------------------ */}
      {categories.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal className="mb-8 text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-blue">
              Categories
            </span>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Explore top categories
            </h2>
            <p className="mt-2 text-muted-foreground">Find the right path for your goals.</p>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category, index) => {
              const style = CATEGORY_STYLES[index % CATEGORY_STYLES.length];
              const Icon = style.icon;
              return (
                <Reveal key={category.id} delay={index * 60}>
                  <Link
                    href={`/courses?category=${category.id}`}
                    className="group relative flex h-full items-center gap-3 overflow-hidden rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-brand-blue/30"
                  >
                    <span
                      className={cn(
                        'flex size-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 group-hover:text-white [&_svg]:size-6',
                        style.className,
                        style.glow
                      )}
                    >
                      <Icon />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{category.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {category._count.courses}{' '}
                        {category._count.courses === 1 ? 'course' : 'courses'}
                      </span>
                    </span>
                    <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* How it works                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section id="how-it-works" className="scroll-mt-24 bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal className="mb-12 text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-blue">
              Simple by design
            </span>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="mt-2 text-muted-foreground">
              From browsing to your first lesson in three easy steps.
            </p>
          </Reveal>
          <div className="relative grid gap-6 md:grid-cols-3">
            {/* connector line */}
            <div className="pointer-events-none absolute left-0 right-0 top-11 hidden border-t-2 border-dashed border-brand-blue/20 md:block" />
            {STEPS.map((step, index) => (
              <Reveal key={step.title} delay={index * 120}>
                <div className="relative h-full rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <span className="absolute right-5 top-5 font-heading text-5xl font-bold text-brand-blue/10">
                    {index + 1}
                  </span>
                  <span className="relative flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-brand-blue to-violet-500 text-white shadow-md [&_svg]:size-6">
                    <step.icon />
                  </span>
                  <h3 className="mt-5 font-heading text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Top courses                                                        */}
      {/* ------------------------------------------------------------------ */}
      {featured.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-sm font-semibold uppercase tracking-wide text-brand-blue">
                Popular
              </span>
              <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                Trending courses
              </h2>
              <p className="mt-2 text-muted-foreground">
                Industry-relevant skills taught by mentors from top companies.
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-border/70 bg-card p-1 shadow-sm">
              <span className="rounded-full bg-brand-blue px-3.5 py-1.5 text-sm font-medium text-white">
                All
              </span>
              <Link
                href="/courses"
                className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Live cohort
              </Link>
              <Link
                href="/courses?price=free"
                className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Self-paced
              </Link>
            </div>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((course, index) => (
              <Reveal key={course.id} delay={(index % 4) * 80}>
                <CourseCard course={course} hrefBase="/courses" showWishlist={false} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Why choose us                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal className="mb-10 max-w-2xl">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-blue">
              Why Digo
            </span>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything you need to learn with confidence
            </h2>
            <p className="mt-2 text-muted-foreground">
              A learning experience built for outcomes — flexible formats, real mentorship, and
              recognized results.
            </p>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 80}>
                <div className="group h-full rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <span
                    className={cn(
                      'flex size-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 [&_svg]:size-6',
                      feature.className
                    )}
                  >
                    <feature.icon />
                  </span>
                  <h3 className="mt-4 font-heading text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Best instructors                                                   */}
      {/* ------------------------------------------------------------------ */}
      {instructors.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal className="mb-8 text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-blue">
              Mentors
            </span>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Our best instructors
            </h2>
            <p className="mt-2 text-muted-foreground">Learn from experienced practitioners.</p>
          </Reveal>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {instructors.map((instructor, index) => (
              <Reveal key={instructor.id} delay={(index % 4) * 80}>
                <div className="group relative flex flex-col items-center overflow-hidden rounded-2xl bg-card p-6 text-center shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-brand-blue/10 to-transparent" />
                  <span className="relative flex size-16 items-center justify-center rounded-full bg-linear-to-br from-brand-blue to-violet-500 text-lg font-semibold text-white shadow-md ring-4 ring-card">
                    {initials(instructor.name)}
                  </span>
                  <p className="mt-4 font-medium">{instructor.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {instructor.instructorProfile?.headline ?? 'Instructor'}
                  </p>
                  {instructor.instructorProfile && instructor.instructorProfile.ratingAvg > 0 ? (
                    <span className="mt-2 flex items-center gap-1 rounded-full bg-amber-400/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      {instructor.instructorProfile.ratingAvg.toFixed(1)}
                    </span>
                  ) : null}
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Testimonials                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal className="mb-10 text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-blue">
              Community
            </span>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Community in action
            </h2>
            <p className="mt-2 text-muted-foreground">
              Get your questions answered and stay motivated by mentors and fellow students.
            </p>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial, index) => (
              <Reveal key={testimonial.name} delay={index * 100}>
                <figure className="flex h-full flex-col rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <Quote className="size-8 text-brand-blue/25" />
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground">
                    “{testimonial.quote}”
                  </blockquote>
                  <div className="mt-5 flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-linear-to-br from-brand-blue to-violet-500 text-sm font-semibold text-white">
                      {initials(testimonial.name)}
                    </span>
                    <figcaption>
                      <p className="text-sm font-semibold">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </figcaption>
                    <span className="ml-auto flex items-center gap-0.5">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </span>
                  </div>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Stats band                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-brand-blue/5">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {statBand.map((stat, index) => (
              <Reveal key={stat.label} delay={index * 80} className="text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-brand-blue to-violet-500 text-white shadow-md [&_svg]:size-6">
                  <stat.icon />
                </span>
                <p className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FAQ                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section id="faq" className="scroll-mt-24">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal className="mb-10 text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-blue">
              FAQ
            </span>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-2 text-muted-foreground">
              Everything you need to know before you get started.
            </p>
          </Reveal>
          <div className="space-y-3">
            {FAQS.map((faq, index) => (
              <Reveal key={faq.q} delay={index * 60}>
                <details className="group rounded-2xl border border-border/60 bg-card px-5 shadow-sm transition-colors open:ring-1 open:ring-brand-blue/20">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium [&::-webkit-details-marker]:hidden">
                    {faq.q}
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue transition-transform group-open:rotate-45">
                      <Plus className="size-4" />
                    </span>
                  </summary>
                  <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Final CTA                                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-brand-blue to-indigo-800 px-6 py-14 text-center text-white">
            <div className="pointer-events-none absolute -left-16 -top-16 size-64 animate-blob rounded-full bg-violet-500/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 right-0 size-64 animate-blob anim-delay-1 rounded-full bg-brand-coral/20 blur-3xl" />
            <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/20">
              <Sparkles className="size-3.5" />
              Start today — it&apos;s free to enquire
            </span>
            <h2 className="relative font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready to start learning?
            </h2>
            <p className="relative max-w-xl text-white/80">
              Find a course that fits your goals and request enrollment today — no payment required
              upfront.
            </p>
            <div className="relative mt-2 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                className="rounded-full bg-white px-7 text-brand-blue shadow-lg transition-transform hover:scale-105 hover:bg-white/90"
                nativeButton={false}
                render={<Link href="/courses">Browse courses</Link>}
              />
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-white/40 bg-white/5 text-white hover:bg-white/15 hover:text-white"
                nativeButton={false}
                render={<Link href="/register">Create an account</Link>}
              />
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
