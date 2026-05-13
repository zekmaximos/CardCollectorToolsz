import { Navbar } from "./Navbar";

export function AppLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:py-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-normal sm:text-3xl">{title}</h1>
          {subtitle ? <p className="max-w-3xl text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        {children}
      </main>
    </div>
  );
}
