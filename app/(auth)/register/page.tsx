import Link from 'next/link';

import { RegisterForm } from '@/features/auth/components/RegisterForm';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Start learning with Digo Academy.</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
      <CardFooter className="justify-center border-t text-sm text-muted-foreground">
        Want to teach?{' '}
        <Link
          href="/register/instructor"
          className="ml-1 font-medium text-primary underline-offset-4 hover:underline"
        >
          Register as an instructor
        </Link>
      </CardFooter>
    </Card>
  );
}
