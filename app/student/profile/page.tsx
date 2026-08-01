import { StudentProfileForm } from '@/features/profile/components/StudentProfileForm';
import { getStudentProfile } from '@/features/profile/server/data';
import { requireRole } from '@/lib/auth/session';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { ROLES } from '@/shared/constants/roles';

export default async function StudentProfilePage() {
  const session = await requireRole(ROLES.STUDENT);
  const profile = await getStudentProfile(session.user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">{profile.email}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Edit profile</CardTitle>
          <CardDescription>Update your name, bio, and skills.</CardDescription>
        </CardHeader>
        <CardContent>
          <StudentProfileForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
