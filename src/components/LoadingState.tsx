export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-8 w-3/4 animate-pulse rounded bg-slate-200" />
          <span className="sr-only">{label}</span>
        </div>
      ))}
    </div>
  );
}
