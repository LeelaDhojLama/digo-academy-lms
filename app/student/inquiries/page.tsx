import { Inbox } from 'lucide-react';
import Link from 'next/link';

import { getStudentInquiries } from '@/features/enrollment/server/data';
import { INQUIRY_STATUS_LABELS, type InquiryStatus } from '@/features/enrollment/pipeline';
import { ENROLLMENT_MODE_LABELS, type EnrollmentMode } from '@/features/enrollment/schemas';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { StatusPill, type StatusTone } from '@/shared/components/dashboard/StatusPill';
import { Button } from '@/shared/components/ui/button';
import { ROLES } from '@/shared/constants/roles';

const STATUS_TONES: Record<InquiryStatus, StatusTone> = {
  NEW: 'info',
  CONTACTED: 'warning',
  CONFIRMED: 'brand',
  ENROLLED: 'success',
  DECLINED: 'danger',
};

export default async function StudentInquiriesPage() {
  const session = await requireRole(ROLES.STUDENT);
  const inquiries = await getStudentInquiries(session.user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Inbox />}
        title="My inquiries"
        description="Enrollment requests you've submitted and where they stand."
        action={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/student/courses">Browse courses</Link>}
          />
        }
      />

      {inquiries.length === 0 ? (
        <div className="rounded-2xl bg-card p-10 text-center shadow-sm ring-1 ring-border/60">
          <p className="font-medium">No inquiries yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Request enrollment on a course and we&apos;ll follow up with you here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Mode</th>
                <th className="px-4 py-3 font-medium">Requested</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id} className="relative transition-colors hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <Link
                      href={`/student/courses/${inquiry.course.id}`}
                      className="font-medium underline-offset-4 after:absolute after:inset-0 hover:underline"
                    >
                      {inquiry.course.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ENROLLMENT_MODE_LABELS[inquiry.mode as EnrollmentMode]}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {inquiry.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={STATUS_TONES[inquiry.status as InquiryStatus]}>
                      {INQUIRY_STATUS_LABELS[inquiry.status as InquiryStatus]}
                    </StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
