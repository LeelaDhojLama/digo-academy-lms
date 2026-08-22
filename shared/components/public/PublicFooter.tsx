import { AtSign, Globe, Mail, MessageCircle, Rss } from 'lucide-react';
import Link from 'next/link';

import { BrandLogo } from '@/shared/components/dashboard/BrandLogo';

const LINK_COLUMNS = [
  {
    heading: 'Explore',
    links: [
      { label: 'All courses', href: '/courses' },
      { label: 'Free courses', href: '/courses?price=free' },
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'FAQ', href: '/#faq' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'Sign in', href: '/login' },
      { label: 'Create account', href: '/register' },
      { label: 'Reset password', href: '/forgot-password' },
    ],
  },
];

const SOCIALS = [
  { label: 'Follow us', href: '#', icon: AtSign },
  { label: 'Community', href: '#', icon: MessageCircle },
  { label: 'Blog', href: '#', icon: Rss },
  { label: 'Website', href: '#', icon: Globe },
];

export function PublicFooter() {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:px-8">
        <div className="max-w-xs">
          <BrandLogo className="h-8 brightness-0 invert" />
          <p className="mt-4 text-sm text-slate-400">
            Live and self-paced courses, taught by practitioners. Learn the skills that move your
            career forward.
          </p>
          <a
            href="mailto:hello@digoacademy.com"
            className="mt-4 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <Mail className="size-4" />
            hello@digoacademy.com
          </a>
          <div className="mt-5 flex items-center gap-2">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex size-9 items-center justify-center rounded-full bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <social.icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
        {LINK_COLUMNS.map((column) => (
          <div key={column.heading}>
            <h3 className="text-sm font-semibold text-white">{column.heading}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} Digo Academy. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <Link href="/#faq" className="transition-colors hover:text-white">
              Privacy
            </Link>
            <Link href="/#faq" className="transition-colors hover:text-white">
              Terms
            </Link>
            <span>Built for modern learning.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
