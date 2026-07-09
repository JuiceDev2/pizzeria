"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ProductoTop {
  producto: string;
  cantidad: number;
}

const COLORES = ["#7a3b1e", "#c0392b", "#f2b544", "#3f6b3f", "#8c8c8c"];

export function TopProductosChart({ data }: { data: ProductoTop[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-neutral-400 py-12 text-center">
        Aún no hay ventas registradas.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 12, fill: "#737373" }} />
        <YAxis
          type="category"
          dataKey="producto"
          width={110}
          tick={{ fontSize: 12, fill: "#404040" }}
        />
        <Tooltip
          formatter={(value: number) => [`${value} vendidas`, ""]}
          contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e5e5e5" }}
        />
        <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORES[i % COLORES.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
