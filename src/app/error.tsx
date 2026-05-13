"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-slate-950">
      <section className="w-full max-w-lg rounded-lg border border-red-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-red-700">Erro do aplicativo</p>
        <h1 className="mt-2 text-2xl font-bold">Esta pagina nao conseguiu carregar.</h1>
        <p className="mt-3 text-sm text-slate-600">
          {error.message || "Tente recarregar. Se continuar, confira as variaveis do Supabase no Vercel."}
        </p>
        {error.digest ? <p className="mt-3 text-xs text-slate-500">Digest: {error.digest}</p> : null}
        <button
          onClick={reset}
          className="mt-5 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Recarregar
        </button>
      </section>
    </main>
  );
}
