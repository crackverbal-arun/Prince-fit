import { LoginForm } from "./form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-10">
        <div className="mb-6 grid size-14 place-items-center rounded-2xl bg-ink">
          <svg viewBox="0 0 64 64" className="size-9"><path d="M14 27h6v10h-6zM44 27h6v10h-6zM20 23h5v18h-5zM39 23h5v18h-5zM25 30h14v4H25z" fill="#d7ff3a" /></svg>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Train with Prince</h1>
        <p className="mt-2 text-muted">Your workouts, meals and progress in one place.</p>
      </div>
      <LoginForm />
      <p className="mt-8 text-center text-xs text-muted">Don&apos;t have a login? Ask Prince to add you.</p>
    </main>
  );
}
