import { RegisterForm } from '@/features/auth/components/RegisterForm';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';

export default function InstructorRegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Register as an instructor</CardTitle>
        <CardDescription>
          Create an instructor account. An admin reviews instructor accounts before they can publish
          courses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm asInstructor />
      </CardContent>
    </Card>
  );
}
