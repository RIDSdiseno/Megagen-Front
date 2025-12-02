import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Ene", nuevos: 18, revisados: 12 },
  { name: "Feb", nuevos: 25, revisados: 19 },
  { name: "Mar", nuevos: 22, revisados: 17 },
  { name: "Abr", nuevos: 31, revisados: 26 },
  { name: "May", nuevos: 28, revisados: 21 },
  { name: "Jun", nuevos: 30, revisados: 24 },
  { name: "Jul", nuevos: 34, revisados: 29 },
];

export default function SimpleGraph() {
  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="name" stroke="#88A9C6" tick={{ fontSize: 12 }} />
          <YAxis stroke="#88A9C6" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
            }}
          />

          {/* Línea de Leads Nuevos (AZUL fuerte) */}
          <Line
            type="monotone"
            dataKey="nuevos"
            stroke="#2B6CB0"
            strokeWidth={3}
            dot={false}
          />

          {/* Línea de Leads Revisados (AZUL suave) */}
          <Line
            type="monotone"
            dataKey="revisados"
            stroke="#7FB3E3"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
