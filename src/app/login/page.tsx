"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    let result;

    try {
      const supabase = createClient();
      result =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });
    } catch (error) {
      setLoading(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel conectar ao Supabase. Confira as variaveis do Vercel.",
      );
      return;
    }

    setLoading(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setMessage("Cadastro criado. Confira seu email se a confirmacao estiver ativa.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">PokéÁlbum Financeiro</h1>
        <p className="mt-2 text-sm text-slate-600">Entre ou crie sua conta para controlar cartas, gastos e valor da colecao.</p>
        <form onSubmit={submit} className="mt-6 grid gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@exemplo.com"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Senha"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
          <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            {loading ? "Enviando..." : mode === "login" ? "Entrar" : "Cadastrar"}
          </button>
        </form>
        {message ? <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">{message}</p> : null}
        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-4 text-sm font-semibold text-emerald-700"
        >
          {mode === "login" ? "Criar nova conta" : "Ja tenho conta"}
        </button>
      </section>
    </main>
  );
}
