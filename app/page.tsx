import { Button } from '@/shared/components/ui/button';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Digo Academy</h1>
      <p className="text-muted-foreground max-w-md text-lg">
        Learning Management System — foundations are in place.
      </p>
      <Button>Get started</Button>
    </main>
  );
}
