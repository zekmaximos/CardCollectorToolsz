"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PullRateStats } from "@/lib/pull-rate/data";

const colors = ["#0f172a", "#047857", "#b45309", "#7c3aed", "#be123c", "#0369a1"];

export function PullRateCharts({ stats }: { stats: PullRateStats }) {
  const collectionRows = stats.collectionPerformance.map((row) => ({
    name: row.setName,
    boosters: row.boosters,
    custo: Number(row.spent.toFixed(2)),
    hits: row.majorHits,
    secos: row.dry,
    positivos: row.positive,
    premium: row.premium,
    esperado: Number(row.expectedMajor.toFixed(2)),
    real: row.majorHits,
  }));

  const rarityRows = stats.hitsByRarity.map((row) => ({
    name: row.rarity,
    value: row.hits,
  }));

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <ChartShell title="Boosters abertos ao longo do tempo">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={stats.timeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="cumulativeBoosters" name="Boosters" stroke="#047857" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartShell>
      <ChartShell title="Gasto acumulado">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={stats.timeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="cumulativeSpent" name="Gasto" stroke="#0f172a" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartShell>
      <ChartShell title="Hits por colecao">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={collectionRows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="hits" name="Hits" fill="#047857" />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>
      <ChartShell title="Custo por colecao">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={collectionRows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="custo" name="Custo" fill="#b45309" />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>
      <ChartShell title="Distribuicao de hits por raridade">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={rarityRows} dataKey="value" nameKey="name" outerRadius={90} label>
              {rarityRows.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartShell>
      <ChartShell title="Secos vs positivos vs premium">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={collectionRows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="secos" stackId="a" fill="#94a3b8" />
            <Bar dataKey="positivos" stackId="a" fill="#047857" />
            <Bar dataKey="premium" stackId="a" fill="#7c3aed" />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>
      <ChartShell title="Chance acumulada para SIR/SAR">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={stats.sirSarChanceTimeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="boosters" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="chance" name="Chance %" stroke="#7c3aed" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartShell>
      <ChartShell title="Real vs esperado por colecao">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={collectionRows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="esperado" fill="#0369a1" />
            <Bar dataKey="real" fill="#047857" />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>
    </section>
  );
}

function ChartShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}
