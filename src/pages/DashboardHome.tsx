import MainLayout from "../components/MainLayout";
import CountUp from "react-countup";
import {
  TrendingUp,
  Target,
  Clock3,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Users,
  Gauge,
  DollarSign,
} from "lucide-react";

type KPIConfig = {
  title: string;
  value: number | string;
  change?: number;
  icon: any;
  hint?: string;
};

const kpis: KPIConfig[] = [
  { title: "Ventas del mes", value: "$58.4M", change: 12, icon: DollarSign, hint: "Vs mes anterior" },
  { title: "Ticket medio", value: "$480K", change: 6, icon: BarChart3, hint: "Promedio por venta" },
  { title: "Ratio de conversión", value: 27, change: 3, icon: Target, hint: "Lead a venta" },
  { title: "Tiempo promedio de venta", value: "12.5 días", change: -2, icon: Clock3, hint: "De lead a cierre" },
  { title: "Leads por semana", value: 142, change: 8, icon: Users, hint: "Última semana" },
  { title: "Pipeline activo", value: "$214M", change: 4, icon: Gauge, hint: "Monto total" },
];

const ventasMes = [
  { mes: "Jul", actual: 42, previo: 38 },
  { mes: "Ago", actual: 45, previo: 41 },
  { mes: "Sep", actual: 48, previo: 44 },
  { mes: "Oct", actual: 52, previo: 47 },
  { mes: "Nov", actual: 58, previo: 52 },
];

const leadsSemana = [62, 74, 88, 91, 102, 110, 142];

const pipeline = [
  { etapa: "Prospectos", valor: 420, tasa: 100 },
  { etapa: "Calificados", valor: 260, tasa: 62 },
  { etapa: "Propuesta", valor: 150, tasa: 36 },
  { etapa: "Negociación", valor: 95, tasa: 23 },
  { etapa: "Cerrado", valor: 58, tasa: 14 },
];

const razonesPerdida = [
  { motivo: "Precio", porcentaje: 32 },
  { motivo: "Competencia", porcentaje: 24 },
  { motivo: "Tiempo / No urgencia", porcentaje: 18 },
  { motivo: "Sin respuesta", porcentaje: 15 },
  { motivo: "Otros", porcentaje: 11 },
];

const oportunidades = [
  { cliente: "Clinica Smile", etapa: "Propuesta", monto: "$18.5M", dias: 5 },
  { cliente: "Dr. Ruiz", etapa: "Negociación", monto: "$12.2M", dias: 9 },
  { cliente: "Centro Andes", etapa: "Calificados", monto: "$9.4M", dias: 3 },
  { cliente: "SmileLab", etapa: "Cerrado", monto: "$22.1M", dias: 1 },
];

export default function DashboardHome() {
  return (
    <MainLayout>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <p className="text-sm uppercase tracking-wide text-[#4B6B8A] font-semibold">Dashboard de crecimiento sostenible</p>
          <h2 className="text-3xl font-extrabold text-[#1A334B]">Visión general comercial</h2>
          <p className="text-gray-600">
            Ventas, leads, conversión y pipeline en un solo panel para análisis semanal y optimización.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="px-4 py-2 text-sm font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD] transition">
            Esta semana
          </button>
          <button className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] text-white shadow hover:shadow-lg transition">
            Últimos 30 días
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {kpis.map((kpi) => (
          <KPI key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Graficos principales */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-8">
        <div className="xl:col-span-2 bg-white border border-[#D9E7F5] rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold text-[#1A334B]">Ventas x mes</h3>
              <p className="text-sm text-gray-500">Comparativo actual vs mes previo</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
              +12% vs. pasado
            </span>
          </div>
          <div className="flex gap-3 items-end h-56">
            {ventasMes.map((item) => (
              <div key={item.mes} className="flex-1 flex flex-col gap-1 items-center">
                <div className="w-full flex flex-col justify-end gap-1 h-full">
                  <div
                    className="rounded-lg bg-gradient-to-t from-[#0E4B8F] to-[#1A6CD3] shadow-lg shadow-[#1A6CD3]/30 transition hover:-translate-y-1"
                    style={{ height: `${item.actual * 2.5}px` }}
                  />
                  <div
                    className="rounded-lg bg-[#E6F0FB] shadow-inner"
                    style={{ height: `${item.previo * 2.2}px` }}
                  />
                </div>
                <p className="text-xs font-semibold text-gray-700">{item.mes}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-gradient-to-t from-[#0E4B8F] to-[#1A6CD3]" />
              Actual
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-[#E6F0FB]" />
              Mes previo
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#D9E7F5] rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold text-[#1A334B]">Leads x semana</h3>
              <p className="text-sm text-gray-500">Tendencia semanal</p>
            </div>
            <span className="text-xs font-semibold text-[#1A6CD3] bg-[#E6F0FB] px-2 py-1 rounded-full">
              +8% respecto a la anterior
            </span>
          </div>
          <div className="h-48 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#E6F0FB] via-white to-[#F9FBFF] rounded-xl" />
            <div className="absolute inset-3 flex items-end gap-2">
              {leadsSemana.map((v, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full h-full flex items-end">
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-[#1A6CD3] to-[#4EA9FF] shadow-md shadow-[#1A6CD3]/30"
                      style={{ height: `${v * 0.9}px` }}
                    />
                  </div>
                  <span className="text-[11px] text-gray-500">S{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline y perdidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-[#D9E7F5] rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-[#1A334B]">Pipeline de ventas</h3>
            <span className="text-xs text-gray-500">Etapas con tasa acumulada</span>
          </div>
          <div className="space-y-3">
            {pipeline.map((step, idx) => (
              <div key={step.etapa} className="flex items-center gap-3">
                <div className="w-28">
                  <p className="text-sm font-semibold text-[#1A334B]">{step.etapa}</p>
                  <p className="text-xs text-gray-500">{step.tasa}%</p>
                </div>
                <div className="flex-1 h-10 rounded-xl bg-[#E6F0FB] overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-r-xl bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] shadow-lg shadow-[#1A6CD3]/25"
                    style={{ width: `${Math.max(12, step.tasa)}%`, transform: `translateZ(${(5 - idx) * 1.5}px)` }}
                  />
                </div>
                <div className="w-16 text-right text-sm font-semibold text-[#1A334B]">{step.valor}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#D9E7F5] rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-[#1A334B]">Razones de pérdida</h3>
            <span className="text-xs text-gray-500">Top motivos</span>
          </div>
          <div className="space-y-3">
            {razonesPerdida.map((r) => (
              <div key={r.motivo}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-[#1A334B]">{r.motivo}</p>
                  <span className="text-xs text-gray-500">{r.porcentaje}%</span>
                </div>
                <div className="h-3 rounded-full bg-[#F4F8FD] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF9F43] via-[#FF6B6B] to-[#D7263D] shadow-md shadow-[#FF6B6B]/30"
                    style={{ width: `${r.porcentaje}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Oportunidades */}
      <section className="bg-white border border-[#D9E7F5] rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-[#1A334B]">Oportunidades destacadas</h3>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
            En seguimiento
          </span>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[480px]">
            <thead className="bg-[#F5FAFF] text-[#1A334B] text-left">
              <tr>
                <th className="py-3 px-4 text-sm">Cliente</th>
                <th className="py-3 px-4 text-sm">Etapa</th>
                <th className="py-3 px-4 text-sm">Monto</th>
                <th className="py-3 px-4 text-sm">Días en etapa</th>
              </tr>
            </thead>
            <tbody>
              {oportunidades.map((op, idx) => (
                <tr key={op.cliente} className="border-t border-gray-200 hover:bg-gray-50 transition">
                  <td className="py-3 px-4 font-semibold text-gray-800">{op.cliente}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{op.etapa}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{op.monto}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    <div className="flex items-center gap-1">
                      <span>{op.dias}</span>
                      {op.dias <= 5 ? (
                        <ArrowUpRight size={14} className="text-emerald-600" />
                      ) : (
                        <ArrowDownRight size={14} className="text-amber-600" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </MainLayout>
  );
}

function KPI({ title, value, change, icon: Icon, hint }: KPIConfig) {
  const up = change !== undefined && change >= 0;
  return (
    <div className="bg-white border border-[#D9E7F5] rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
      <div className="flex items-center justify-between mb-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-[#E6F0FB] to-white text-[#1A6CD3] shadow-inner">
          <Icon className="w-5 h-5" />
        </div>
        {change !== undefined && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            {up ? "+" : "-"}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-sm font-semibold text-gray-500">{hint || title}</p>
      <p className="text-3xl font-extrabold text-[#1A334B]">
        {typeof value === "number" ? <CountUp end={value} duration={1.2} /> : value}
      </p>
      <p className="text-sm font-semibold text-[#1A334B] mt-1">{title}</p>
    </div>
  );
}
