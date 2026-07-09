"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface VentaDia {
  dia: string;
  total: number;
  ordenes: number;
}

export function VentasChart({ data }: { data: VentaDia[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.dia + "T00:00:00").toLocaleDateString("es-MX", {
      weekday: "short",
      day: "numeric",
    }),
  }));

  if (formatted.length === 0) {
    return (
      <p className="text-sm text-neutral-400 py-12 text-center">
        Aún no hay ventas registradas.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={formatted} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#737373" }} />
        <YAxis tick={{ fontSize: 12, fill: "#737373" }} />
        <Tooltip
          formatter={(value: number) => [`$${value}`, "Ventas"]}
          labelStyle={{ color: "#171717" }}
          contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e5e5e5" }}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#7a3b1e"
          strokeWidth={2}
          dot={{ r: 3, fill: "#7a3b1e" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
