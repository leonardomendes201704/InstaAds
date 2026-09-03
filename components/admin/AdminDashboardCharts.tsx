"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { DashboardStats } from "@/lib/db/types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const PURPLE = "#7b1fa2";
const PURPLE_LIGHT = "rgba(123, 31, 162, 0.55)";
const TEAL = "#0d9488";
const TEAL_LIGHT = "rgba(13, 148, 136, 0.55)";

function formatDateLabel(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: "#6b7280",
        font: { size: 11 },
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0,
        color: "#6b7280",
        font: { size: 11 },
      },
      grid: { color: "rgba(0,0,0,0.06)" },
    },
  },
} as const;

interface AdminDashboardChartsProps {
  stats: DashboardStats;
}

export function AdminDashboardCharts({ stats }: AdminDashboardChartsProps) {
  const labels = stats.generationsByDay.map((day) => formatDateLabel(day.date));

  const generationsChartData = {
    labels,
    datasets: [
      {
        label: "Gerações",
        data: stats.generationsByDay.map((day) => day.count),
        backgroundColor: PURPLE_LIGHT,
        borderColor: PURPLE,
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const compareChartData = {
    labels,
    datasets: [
      {
        label: "Novos usuários",
        data: stats.usersByDay.map((day) => day.count),
        backgroundColor: TEAL_LIGHT,
        borderColor: TEAL,
        borderWidth: 1,
        borderRadius: 6,
      },
      {
        label: "Gerações",
        data: stats.generationsByDay.map((day) => day.count),
        backgroundColor: PURPLE_LIGHT,
        borderColor: PURPLE,
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const compareOptions = {
    ...baseChartOptions,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        align: "end" as const,
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          color: "#374151",
          font: { size: 12 },
        },
      },
    },
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-foreground">Gerações nos últimos 7 dias</p>
        <div className="mt-4 h-56">
          <Bar data={generationsChartData} options={baseChartOptions} />
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-foreground">Usuários vs gerações</p>
        <p className="mt-0.5 text-xs text-muted">Novos cadastros e gerações por dia</p>
        <div className="mt-4 h-56">
          <Bar data={compareChartData} options={compareOptions} />
        </div>
      </div>
    </div>
  );
}
