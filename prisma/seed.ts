import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../lib/generated/prisma/client';

/**
 * Database seed — reference data only (idempotent via upsert).
 * User/course seeding lands in Phase 2 once Better Auth owns password hashing.
 *
 * Standalone client: `lib/db.ts` is `server-only` and can't be imported by a
 * plain `tsx` script, so the seed builds its own adapter-backed client.
 */
const connectionString = process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('DATABASE_URL (or DIRECT_URL) is not set — cannot seed.');
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/**
 * Reference categories. Top-level entries may declare `children` (subcategories,
 * e.g. AWS -> AWS Cloud Practitioner). Admins manage the rest from the UI.
 */
const CATEGORIES: {
  name: string;
  slug: string;
  children?: { name: string; slug: string }[];
}[] = [
  { name: 'Web Development', slug: 'web-development' },
  { name: 'Data Science', slug: 'data-science' },
  { name: 'Design', slug: 'design' },
  { name: 'Business', slug: 'business' },
  { name: 'Marketing', slug: 'marketing' },
  {
    name: 'AWS',
    slug: 'aws',
    children: [
      { name: 'AWS Cloud Practitioner', slug: 'aws-cloud-practitioner' },
      { name: 'AWS Solutions Architect', slug: 'aws-solutions-architect' },
    ],
  },
];

const SETTINGS: { key: string; value: unknown }[] = [
  // Admin can force full re-approval instead of a lightweight re-review flag (Phase 4).
  { key: 'course.reReviewPolicy', value: { forceFullReapproval: false } },
  // Assignment pass mark is fixed at 80% (Phase 7); surfaced here for admin visibility.
  { key: 'grading.assignmentPassThreshold', value: 80 },
];

/**
 * Demo instructors. Created as plain User rows (no Better Auth credential, so they
 * can't sign in) purely to author showcase courses and populate the public site.
 */
const INSTRUCTORS: {
  email: string;
  name: string;
  headline: string;
  ratingAvg: number;
  totalStudents: number;
}[] = [
  { email: 'aisha.rahman@demo.digo.academy', name: 'Aisha Rahman', headline: 'Senior Frontend Engineer', ratingAvg: 4.9, totalStudents: 3200 },
  { email: 'daniel.osei@demo.digo.academy', name: 'Daniel Osei', headline: 'Data Scientist & ML Engineer', ratingAvg: 4.8, totalStudents: 2600 },
  { email: 'maria.souza@demo.digo.academy', name: 'Maria Souza', headline: 'Product Designer', ratingAvg: 4.7, totalStudents: 1900 },
  { email: 'james.park@demo.digo.academy', name: 'James Park', headline: 'Cloud Architect (AWS)', ratingAvg: 4.8, totalStudents: 2100 },
  { email: 'liam.chen@demo.digo.academy', name: 'Liam Chen', headline: 'Growth Marketer', ratingAvg: 4.5, totalStudents: 1400 },
];

type SeedDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

/**
 * Showcase courses, all PUBLISHED so they surface on the public homepage/catalog.
 * `id` is fixed so re-seeding is idempotent; ratings are pre-set (cached aggregate)
 * so "top rated" ordering has something to sort on without seeding reviews.
 */
const COURSES: {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  categorySlug: string;
  instructorEmail: string;
  difficulty: SeedDifficulty;
  priceCents: number;
  language: string;
  ratingAvg: number;
  sections: { title: string; lessons: { title: string; type: 'VIDEO' | 'NOTE'; durationSec?: number }[] }[];
}[] = [
  {
    id: 'seed-course-react',
    title: 'Modern React from Scratch',
    subtitle: 'Build fast, component-driven UIs with React 19 and hooks.',
    description: '<p>Learn React the modern way — components, hooks, state, and data fetching — by building real projects step by step.</p>',
    categorySlug: 'web-development',
    instructorEmail: 'aisha.rahman@demo.digo.academy',
    difficulty: 'BEGINNER',
    priceCents: 4900,
    language: 'en',
    ratingAvg: 4.9,
    sections: [
      { title: 'Getting started', lessons: [ { title: 'Why React', type: 'VIDEO', durationSec: 480 }, { title: 'Components & JSX', type: 'VIDEO', durationSec: 720 }, { title: 'Course notes', type: 'NOTE' } ] },
      { title: 'State & effects', lessons: [ { title: 'useState in depth', type: 'VIDEO', durationSec: 900 }, { title: 'useEffect patterns', type: 'VIDEO', durationSec: 840 } ] },
    ],
  },
  {
    id: 'seed-course-nextjs',
    title: 'Full-Stack Next.js',
    subtitle: 'Ship production apps with the App Router, Server Actions, and Prisma.',
    description: '<p>Go full-stack with Next.js — routing, server components, mutations, auth, and deployment.</p>',
    categorySlug: 'web-development',
    instructorEmail: 'aisha.rahman@demo.digo.academy',
    difficulty: 'INTERMEDIATE',
    priceCents: 7900,
    language: 'en',
    ratingAvg: 4.8,
    sections: [
      { title: 'App Router foundations', lessons: [ { title: 'Routing & layouts', type: 'VIDEO', durationSec: 780 }, { title: 'Server vs client components', type: 'VIDEO', durationSec: 960 } ] },
      { title: 'Data & mutations', lessons: [ { title: 'Server Actions', type: 'VIDEO', durationSec: 1020 }, { title: 'Prisma basics', type: 'NOTE' } ] },
    ],
  },
  {
    id: 'seed-course-python',
    title: 'Python for Data Analysis',
    subtitle: 'Wrangle, analyze, and visualize data with pandas and NumPy.',
    description: '<p>Turn raw data into insight using Python, pandas, and clear visualizations.</p>',
    categorySlug: 'data-science',
    instructorEmail: 'daniel.osei@demo.digo.academy',
    difficulty: 'BEGINNER',
    priceCents: 5900,
    language: 'en',
    ratingAvg: 4.7,
    sections: [
      { title: 'Python essentials', lessons: [ { title: 'Data types & control flow', type: 'VIDEO', durationSec: 660 }, { title: 'Working with files', type: 'VIDEO', durationSec: 540 } ] },
      { title: 'pandas', lessons: [ { title: 'Series & DataFrames', type: 'VIDEO', durationSec: 900 }, { title: 'Cleaning data', type: 'VIDEO', durationSec: 780 } ] },
    ],
  },
  {
    id: 'seed-course-ml',
    title: 'Machine Learning Foundations',
    subtitle: 'Understand the core algorithms behind modern ML.',
    description: '<p>Build intuition and hands-on skills for regression, classification, and model evaluation.</p>',
    categorySlug: 'data-science',
    instructorEmail: 'daniel.osei@demo.digo.academy',
    difficulty: 'ADVANCED',
    priceCents: 9900,
    language: 'en',
    ratingAvg: 4.8,
    sections: [
      { title: 'Supervised learning', lessons: [ { title: 'Linear & logistic regression', type: 'VIDEO', durationSec: 1080 }, { title: 'Evaluation metrics', type: 'NOTE' } ] },
      { title: 'Model tuning', lessons: [ { title: 'Overfitting & regularization', type: 'VIDEO', durationSec: 960 } ] },
    ],
  },
  {
    id: 'seed-course-uiux',
    title: 'UI/UX Design Essentials',
    subtitle: 'Design usable, beautiful interfaces from first principles.',
    description: '<p>Learn the fundamentals of user-centered design, layout, color, and typography.</p>',
    categorySlug: 'design',
    instructorEmail: 'maria.souza@demo.digo.academy',
    difficulty: 'BEGINNER',
    priceCents: 0,
    language: 'en',
    ratingAvg: 4.6,
    sections: [
      { title: 'Design foundations', lessons: [ { title: 'Layout & hierarchy', type: 'VIDEO', durationSec: 600 }, { title: 'Color & type', type: 'VIDEO', durationSec: 540 } ] },
    ],
  },
  {
    id: 'seed-course-figma',
    title: 'Figma for Product Teams',
    subtitle: 'Collaborate and prototype at speed in Figma.',
    description: '<p>Master components, auto-layout, and prototyping to design real products.</p>',
    categorySlug: 'design',
    instructorEmail: 'maria.souza@demo.digo.academy',
    difficulty: 'INTERMEDIATE',
    priceCents: 3900,
    language: 'en',
    ratingAvg: 4.7,
    sections: [
      { title: 'Figma core', lessons: [ { title: 'Components & variants', type: 'VIDEO', durationSec: 720 }, { title: 'Auto-layout', type: 'VIDEO', durationSec: 660 } ] },
    ],
  },
  {
    id: 'seed-course-aws',
    title: 'AWS Cloud Practitioner Bootcamp',
    subtitle: 'Pass the CLF-C02 exam and understand the AWS core.',
    description: '<p>Everything you need to confidently pass the AWS Cloud Practitioner exam.</p>',
    categorySlug: 'aws-cloud-practitioner',
    instructorEmail: 'james.park@demo.digo.academy',
    difficulty: 'BEGINNER',
    priceCents: 6900,
    language: 'en',
    ratingAvg: 4.9,
    sections: [
      { title: 'Cloud concepts', lessons: [ { title: 'What is the cloud', type: 'VIDEO', durationSec: 480 }, { title: 'AWS global infrastructure', type: 'VIDEO', durationSec: 600 } ] },
      { title: 'Core services', lessons: [ { title: 'EC2 & S3', type: 'VIDEO', durationSec: 900 }, { title: 'Exam tips', type: 'NOTE' } ] },
    ],
  },
  {
    id: 'seed-course-marketing',
    title: 'Digital Marketing Masterclass',
    subtitle: 'Grow an audience with SEO, content, and paid channels.',
    description: '<p>A practical playbook for acquiring and retaining customers across channels.</p>',
    categorySlug: 'marketing',
    instructorEmail: 'liam.chen@demo.digo.academy',
    difficulty: 'INTERMEDIATE',
    priceCents: 4500,
    language: 'en',
    ratingAvg: 4.5,
    sections: [
      { title: 'Foundations', lessons: [ { title: 'The marketing funnel', type: 'VIDEO', durationSec: 540 }, { title: 'Positioning', type: 'NOTE' } ] },
      { title: 'Channels', lessons: [ { title: 'SEO basics', type: 'VIDEO', durationSec: 780 }, { title: 'Paid ads intro', type: 'VIDEO', durationSec: 720 } ] },
    ],
  },
];

async function main() {
  for (const category of CATEGORIES) {
    const parent = await db.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: { name: category.name, slug: category.slug },
    });

    for (const child of category.children ?? []) {
      await db.category.upsert({
        where: { slug: child.slug },
        update: { name: child.name, parentId: parent.id },
        create: { name: child.name, slug: child.slug, parentId: parent.id },
      });
    }
  }

  for (const setting of SETTINGS) {
    await db.platformSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value as object },
      create: { key: setting.key, value: setting.value as object },
    });
  }

  // Demo instructors (plain User rows + profiles; no login credential).
  const instructorIdByEmail = new Map<string, string>();
  for (const instructor of INSTRUCTORS) {
    const user = await db.user.upsert({
      where: { email: instructor.email },
      update: { name: instructor.name, role: 'INSTRUCTOR' },
      create: {
        email: instructor.email,
        name: instructor.name,
        role: 'INSTRUCTOR',
        emailVerified: true,
      },
    });
    instructorIdByEmail.set(instructor.email, user.id);

    await db.instructorProfile.upsert({
      where: { userId: user.id },
      update: {
        headline: instructor.headline,
        ratingAvg: instructor.ratingAvg,
        totalStudents: instructor.totalStudents,
      },
      create: {
        userId: user.id,
        headline: instructor.headline,
        ratingAvg: instructor.ratingAvg,
        totalStudents: instructor.totalStudents,
      },
    });
  }

  // Category id lookup by slug (leaf slugs included).
  const categories = await db.category.findMany({ select: { id: true, slug: true } });
  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  // Showcase courses with curriculum. Sections are rebuilt each run for idempotency.
  for (const course of COURSES) {
    const instructorId = instructorIdByEmail.get(course.instructorEmail);
    const categoryId = categoryIdBySlug.get(course.categorySlug) ?? null;
    if (!instructorId) continue;

    await db.course.upsert({
      where: { id: course.id },
      update: {
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        categoryId,
        instructorId,
        difficulty: course.difficulty,
        priceCents: course.priceCents,
        language: course.language,
        ratingAvg: course.ratingAvg,
        status: 'PUBLISHED',
      },
      create: {
        id: course.id,
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        categoryId,
        instructorId,
        difficulty: course.difficulty,
        priceCents: course.priceCents,
        currency: 'USD',
        language: course.language,
        ratingAvg: course.ratingAvg,
        status: 'PUBLISHED',
      },
    });

    // Rebuild curriculum (cascade deletes lessons) so re-seeding stays clean.
    await db.section.deleteMany({ where: { courseId: course.id } });
    for (const [sectionIndex, section] of course.sections.entries()) {
      await db.section.create({
        data: {
          courseId: course.id,
          title: section.title,
          order: sectionIndex,
          lessons: {
            create: section.lessons.map((lesson, lessonIndex) => ({
              title: lesson.title,
              type: lesson.type,
              order: lessonIndex,
              videoDurationSec: lesson.durationSec ?? null,
            })),
          },
        },
      });
    }
  }

  console.log(
    `Seed complete: ${CATEGORIES.length} categories, ${SETTINGS.length} platform settings, ${INSTRUCTORS.length} instructors, ${COURSES.length} courses.`
  );
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
