import Link from "next/link";
import { BarChart3, Calculator, CreditCard, FolderOpen, LogOut, Search } from "lucide-react";
import { signOut } from "@/app/actions";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/albums", label: "Albuns", icon: FolderOpen },
  { href: "/cards/search", label: "Buscar", icon: Search },
  { href: "/expenses", label: "Gastos", icon: CreditCard },
  { href: "/pull-rate", label: "Calculadora", icon: Calculator },
  { href: "/reports", label: "Relatorios", icon: BarChart3 },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/dashboard" className="min-w-fit text-base font-bold text-slate-950">
          PokéÁlbum Financeiro
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              >
                <Icon className="size-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <form action={signOut}>
            <button
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700"
              title="Sair"
            >
              <LogOut className="size-4" />
              <span>Sair</span>
            </button>
          </form>
        </div>
      </nav>
    </header>
  );
}
