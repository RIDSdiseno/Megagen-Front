import { useEffect, useMemo, useState } from "react";
import MainLayout from "../components/MainLayout";
import CountUp from "react-countup";
import {
  Target,
  Clock3,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Users,
  Gauge,
  DollarSign,
  Building2,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

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
  { title: "Ratio de conversion", value: 27, change: 3, icon: Target, hint: "Lead a venta" },
  { title: "Tiempo promedio de venta", value: "12.5 dias", change: -2, icon: Clock3, hint: "De lead a cierre" },
  { title: "Leads por semana", value: 142, change: 8, icon: Users, hint: "Ultima semana" },
  { title: "Pipeline activo", value: "$214M", change: 4, icon: Gauge, hint: "Monto total" },
  { title: "Clinicas activas", value: 48, change: 5, icon: Building2, hint: "Clientes B2B" },
  { title: "Clientes en riesgo", value: 12, change: -1, icon: AlertTriangle, hint: "Seguir esta semana" },
  { title: "Leads nuevos 24h", value: 22, change: 10, icon: Users, hint: "Entrantes recientes" },
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
  { etapa: "Negociacion", valor: 95, tasa: 23 },
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
  { cliente: "Dr. Ruiz", etapa: "Negociacion", monto: "$12.2M", dias: 9 },
  { cliente: "Centro Andes", etapa: "Calificados", monto: "$9.4M", dias: 3 },
  { cliente: "SmileLab", etapa: "Cerrado", monto: "$22.1M", dias: 1 },
];

const resumenGeneral = [
  { titulo: "Clientes activos", valor: 84, detalle: "Incluye 48 clinicas", color: "from-emerald-500 to-emerald-700" },
  { titulo: "Clientes en onboarding", valor: 12, detalle: "Plan de adopcion en curso", color: "from-amber-500 to-amber-700" },
  { titulo: "Leads calientes", valor: 34, detalle: "Propuesta o negociacion", color: "from-sky-500 to-sky-700" },
  { titulo: "Reuniones programadas", valor: 19, detalle: "Proximas 72 horas", color: "from-indigo-500 to-indigo-700" },
];

const vendedoresKpi = [
  { nombre: "Luis Herrera", leads: 32, clientes: 14, conversion: 28, ventas: "$38.2M" },
  { nombre: "Paula Rios", leads: 28, clientes: 12, conversion: 31, ventas: "$34.7M" },
  { nombre: "Supervisor Norte", leads: 24, clientes: 10, conversion: 25, ventas: "$29.0M" },
  { nombre: "Equipo Hibrido", leads: 18, clientes: 9, conversion: 30, ventas: "$26.4M" },
];

const bodeguerosKpi = [
  { nombre: "Bodega Central", cotizacionesDia: 6, semana: 24, enTransito: 9, entregado: 12 },
  { nombre: "Soporte", cotizacionesDia: 4, semana: 18, enTransito: 6, entregado: 9 },
];

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

type AdminVendor = {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  leads: { total: number; porEstado: Array<{ estado: string; total: number }> };
  clientes: { total: number; porEstado: Array<{ estado: string; total: number }> };
  cotizaciones: { total: number; porEtapa: Array<{ etapa: string; total: number }> };
  recientes: {
    leads: Array<{ id: number; nombre: string; estado: string; resumen?: string; telefono?: string; correo?: string; proximoPaso?: string }>;
    cotizaciones: Array<{ id: number; codigo: string; etapa: string; cliente: string; entregaProgramada?: string; resumen?: string; total?: string }>;
  };
};

type AdminDashboardResponse = {
  resumen: { leads: number; clientes: number; cotizaciones: number };
  leadsPorEstado: Array<{ estado: string; total: number }>;
  clientesPorEstado: Array<{ estado: string; total: number }>;
  cotizacionesPorEtapa: Array<{ etapa: string; total: number }>;
  vendors: AdminVendor[];
  ultimaActualizacion: string;
};

type BodegaDashboardResponse = {
  cotizacionesPorEtapa: Array<{ etapa: string; total: number }>;
  entregas: Array<{ id: number; codigo: string; cliente: string; etapa: string; entregaProgramada: string | null; comentarios: string | null; imagenUrl: string | null }>;
  recientes: Array<{ id: number; codigo: string; cliente: string; etapa: string; resumen?: string; imagenUrl?: string | null; comentarios?: string | null; entregaProgramada?: string | null }>;
  ultimaActualizacion: string;
};

export default function DashboardHome() {
  const [rango, setRango] = useState<"semana" | "30" | "historico">("30");
  const { user } = useAuth();
  const isAdmin = useMemo(() => (user?.roles || []).some((r) => r === "admin" || r === "superadmin"), [user?.roles]);
  const isSupervisor = useMemo(() => (user?.roles || []).includes("supervisor"), [user?.roles]);
  const isBodeguero = useMemo(() => (user?.roles || []).includes("bodeguero"), [user?.roles]);
  const [adminData, setAdminData] = useState<AdminDashboardResponse | null>(null);
  const [bodegaData, setBodegaData] = useState<BodegaDashboardResponse | null>(null);
  const [loadingDash, setLoadingDash] = useState(false);
  const [dashError, setDashError] = useState("");

  useEffect(() => {
    const fetchDashboards = async () => {
      if (!user?.token) return;
      setLoadingDash(true);
      setDashError("");
      try {
        const headers = { Authorization: `Bearer ${user.token}` };

        if (isAdmin || isSupervisor) {
          const url = isAdmin ? `${API_URL}/dashboard/admin` : `${API_URL}/dashboard/supervisor`;
          const resp = await fetch(url, { headers });
          if (!resp.ok) throw new Error("No se pudo cargar dashboard comercial");
          const data = (await resp.json()) as AdminDashboardResponse;
          setAdminData(data);
        }

        if (isBodeguero || isAdmin) {
          const respB = await fetch(`${API_URL}/dashboard/bodega`, { headers });
          if (!respB.ok) throw new Error("No se pudo cargar dashboard bodega");
          const dataB = (await respB.json()) as BodegaDashboardResponse;
          setBodegaData(dataB);
        }
      } catch (err) {
        setDashError(err instanceof Error ? err.message : "Error cargando dashboards");
      } finally {
        setLoadingDash(false);
      }
    };
    fetchDashboards();
  }, [user?.token, isAdmin, isSupervisor, isBodeguero]);
  return (
    <MainLayout>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <p className="text-sm uppercase tracking-wide text-[#4B6B8A] font-semibold">Dashboard de crecimiento sostenible</p>
          <h2 className="text-3xl font-extrabold text-[#1A334B]">Vision general comercial</h2>
          <p className="text-gray-600">
            Ventas, leads, conversion y pipeline en un solo panel para analisis semanal y optimizacion.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2">
          <div className="flex gap-2 flex-wrap">
            <button
              className={
                rango === "semana"
                  ? "px-4 py-2 text-sm font-semibold rounded-lg border bg-[#1A6CD3] text-white border-[#1A6CD3]"
                  : "px-4 py-2 text-sm font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD]"
              }
              onClick={() => setRango("semana")}
            >
              Esta semana
            </button>
            <button
              className={
                rango === "30"
                  ? "px-4 py-2 text-sm font-semibold rounded-lg border bg-[#1A6CD3] text-white border-[#1A6CD3]"
                  : "px-4 py-2 text-sm font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD]"
              }
              onClick={() => setRango("30")}
            >
              Ultimos 30 dias
            </button>
            <button
              className={
                rango === "historico"
                  ? "px-4 py-2 text-sm font-semibold rounded-lg border bg-[#0E4B8F] text-white border-[#0E4B8F]"
                  : "px-4 py-2 text-sm font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD]"
              }
              onClick={() => setRango("historico")}
            >
              Historico
            </button>
          </div>
          <div className="text-xs text-gray-500">
            Filtro activo: {rango === "semana" ? "Semana actual" : rango === "30" ? "Ultimos 30 dias" : "Historico"}
          </div>
        </div>
      </div>

      {dashError && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
          {dashError}
        </div>
      )}

      {loadingDash && (
        <div className="mb-4 bg-[#F4F8FD] border border-[#D9E7F5] text-[#1A334B] px-4 py-3 rounded-lg text-sm">
          Cargando paneles con datos reales...
        </div>
      )}

      {(isAdmin || isSupervisor) && adminData && (
        <section className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white border border-[#D9E7F5] rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500">Leads</p>
              <p className="text-2xl font-bold text-[#1A334B]">{adminData.resumen.leads}</p>
              <p className="text-xs text-gray-500 mt-1">Distribucion por estado</p>
              <div className="flex gap-2 flex-wrap mt-2">
                {adminData.leadsPorEstado.map((l) => (
                  <span key={l.estado} className="px-3 py-1 rounded-full text-[11px] bg-[#E6F0FB] text-[#1A6CD3]">
                    {l.estado}: {l.total}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white border border-[#D9E7F5] rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500">Clientes</p>
              <p className="text-2xl font-bold text-[#1A334B]">{adminData.resumen.clientes}</p>
              <div className="flex gap-2 flex-wrap mt-2">
                {adminData.clientesPorEstado.map((c) => (
                  <span key={c.estado} className="px-3 py-1 rounded-full text-[11px] bg-emerald-50 text-emerald-700">
                    {c.estado}: {c.total}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white border border-[#D9E7F5] rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500">Cotizaciones</p>
              <p className="text-2xl font-bold text-[#1A334B]">{adminData.resumen.cotizaciones}</p>
              <div className="flex gap-2 flex-wrap mt-2">
                {adminData.cotizacionesPorEtapa.map((c) => (
                  <span key={c.etapa} className="px-3 py-1 rounded-full text-[11px] bg-amber-50 text-amber-700">
                    {c.etapa}: {c.total}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Vista admin / supervisor</p>
                <p className="text-lg font-bold text-[#1A334B]">Vendedores, leads y clientes</p>
                <p className="text-xs text-gray-500">Actualizado: {new Date(adminData.ultimaActualizacion).toLocaleString()}</p>
              </div>
            </div>
            <div className="overflow-auto">
              <table className="w-full min-w-[900px]">
                <thead className="text-left bg-[#F5FAFF] text-[#1A334B] text-sm">
                  <tr>
                    <th className="py-3 px-4">Vendedor / Rol</th>
                    <th className="py-3 px-4">Leads</th>
                    <th className="py-3 px-4">Clientes</th>
                    <th className="py-3 px-4">Cotizaciones</th>
                    <th className="py-3 px-4 w-[260px]">Recientes</th>
                  </tr>
                </thead>
                <tbody>
                  {adminData.vendors.map((v) => (
                    <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-800">{v.nombre}</p>
                        <p className="text-xs text-gray-500">{v.email}</p>
                        <span className="text-[11px] px-2 py-1 rounded-full bg-[#E6F0FB] text-[#1A6CD3]">{v.rol}</span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <p className="font-semibold">{v.leads.total} totales</p>
                        <div className="flex gap-1 flex-wrap mt-1">
                          {v.leads.porEstado.map((e) => (
                            <span key={e.estado} className="px-2 py-1 rounded-full text-[11px] bg-white border border-[#D9E7F5] text-[#1A334B]">
                              {e.estado}: {e.total}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <p className="font-semibold">{v.clientes.total} clientes</p>
                        <div className="flex gap-1 flex-wrap mt-1">
                          {v.clientes.porEstado.map((c) => (
                            <span key={c.estado} className="px-2 py-1 rounded-full text-[11px] bg-white border border-emerald-100 text-emerald-700">
                              {c.estado}: {c.total}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <p className="font-semibold">{v.cotizaciones.total} cotizaciones</p>
                        <div className="flex gap-1 flex-wrap mt-1">
                          {v.cotizaciones.porEtapa.map((c) => (
                            <span key={c.etapa} className="px-2 py-1 rounded-full text-[11px] bg-white border border-amber-100 text-amber-700">
                              {c.etapa}: {c.total}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-700">
                        <div className="space-y-1">
                          {v.recientes.leads.map((l) => (
                            <div key={l.id} className="flex justify-between gap-2 border border-[#E6F0FB] rounded-lg px-2 py-1">
                              <div>
                                <p className="font-semibold text-gray-800">{l.nombre}</p>
                                <p className="text-[11px] text-gray-500">{l.estado}</p>
                              </div>
                              <span className="text-[11px] text-[#1A6CD3]">Lead</span>
                            </div>
                          ))}
                          {v.recientes.cotizaciones.map((c) => (
                            <div key={c.id} className="flex justify-between gap-2 border border-amber-100 rounded-lg px-2 py-1">
                              <div>
                                <p className="font-semibold text-gray-800">#{c.codigo}</p>
                                <p className="text-[11px] text-gray-500">{c.cliente}</p>
                                <p className="text-[11px] text-amber-700">{c.etapa}</p>
                              </div>
                              <span className="text-[11px] text-amber-700">Cot</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {(isBodeguero || isAdmin) && bodegaData && (
        <section className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Panel bodeguero</p>
              <p className="text-lg font-bold text-[#1A334B]">Seguimiento de cotizaciones y entregas</p>
              <p className="text-xs text-gray-500">Actualizado: {new Date(bodegaData.ultimaActualizacion).toLocaleString()}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {bodegaData.cotizacionesPorEtapa.map((c) => (
              <div key={c.etapa} className="bg-white border border-[#D9E7F5] rounded-xl p-3 shadow-sm">
                <p className="text-xs text-gray-500">{c.etapa}</p>
                <p className="text-2xl font-bold text-[#1A334B]">{c.total}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
              <p className="text-sm font-bold text-[#1A334B] mb-2">Entregas programadas</p>
              <div className="space-y-2 max-h-[320px] overflow-auto">
                {bodegaData.entregas.length === 0 && <p className="text-xs text-gray-500">Sin entregas agendadas</p>}
                {bodegaData.entregas.map((e) => (
                  <div key={e.id} className="border border-amber-100 rounded-lg px-3 py-2 text-sm">
                    <p className="font-semibold text-[#1A334B]">#{e.codigo} - {e.cliente}</p>
                    <p className="text-xs text-amber-700">{e.etapa}</p>
                    {e.entregaProgramada && (
                      <p className="text-[11px] text-gray-600">Entrega: {new Date(e.entregaProgramada).toLocaleString()}</p>
                    )}
                    {e.comentarios && <p className="text-[11px] text-gray-600">{e.comentarios}</p>}
                    {e.imagenUrl && <p className="text-[11px] text-[#1A6CD3]">Adjunto disponible</p>}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
              <p className="text-sm font-bold text-[#1A334B] mb-2">Ultimas cotizaciones (bodega)</p>
              <div className="space-y-2 max-h-[320px] overflow-auto">
                {bodegaData.recientes.length === 0 && <p className="text-xs text-gray-500">Sin registros</p>}
                {bodegaData.recientes.map((c) => (
                  <div key={c.id} className="border border-[#E6F0FB] rounded-lg px-3 py-2 text-sm">
                    <p className="font-semibold text-[#1A334B]">#{c.codigo} - {c.cliente}</p>
                    <p className="text-[11px] text-gray-600">{c.etapa}</p>
                    {c.entregaProgramada && <p className="text-[11px] text-gray-500">Entrega: {new Date(c.entregaProgramada).toLocaleString()}</p>}
                    {c.resumen && <p className="text-[11px] text-gray-600">{c.resumen}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

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
            <h3 className="text-xl font-bold text-[#1A334B]">Razones de perdida</h3>
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {resumenGeneral.map((item) => (
          <div
            key={item.titulo}
            className={`p-4 rounded-2xl text-white shadow-md bg-gradient-to-r ${item.color}`}
          >
            <p className="text-xs uppercase tracking-wide text-white/80 font-semibold">{item.titulo}</p>
            <p className="text-3xl font-extrabold">{item.valor}</p>
            <p className="text-sm text-white/90 mt-1">{item.detalle}</p>
          </div>
        ))}
      </div>

      {/* Comparativa por vendedor y operaciones de bodega */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <section className="bg-white border border-[#D9E7F5] rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold text-[#1A334B]">Comparativa de vendedores</h3>
              <p className="text-sm text-gray-500">Leads, clientes y conversion por responsable</p>
            </div>
            <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-1 rounded-full">
              Admin / Super admin / Supervisor
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {vendedoresKpi.map((v) => (
              <div key={v.nombre} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#1A334B]">{v.nombre}</p>
                  <p className="text-xs text-gray-500">Leads: {v.leads} · Clientes: {v.clientes}</p>
                </div>
                <div className="flex-1 max-w-[220px]">
                  <div className="h-2 rounded-full bg-[#E6F0FB] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F]"
                      style={{ width: `${Math.min(v.conversion, 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">Conversion {v.conversion}% · Ventas {v.ventas}</p>
                </div>
                <button className="text-xs px-3 py-2 rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD]">
                  Ver cartera
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-[#D9E7F5] rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold text-[#1A334B]">Operaciones Bodega</h3>
              <p className="text-sm text-gray-500">Cotizaciones, transito y entregas por bodeguero</p>
            </div>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded-full">
              Flujo despacho
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bodeguerosKpi.map((b) => (
              <div key={b.nombre} className="border border-[#E6F0FB] rounded-xl p-3 shadow-inner bg-gradient-to-br from-white to-[#F7FAFF]">
                <p className="text-sm font-bold text-[#1A334B]">{b.nombre}</p>
                <p className="text-xs text-gray-500 mb-2">Dia: {b.cotizacionesDia} · Semana: {b.semana}</p>
                <div className="flex items-center justify-between text-xs text-gray-700">
                  <span>En transito</span>
                  <span className="font-semibold text-[#1A334B]">{b.enTransito}</span>
                </div>
                <div className="h-2 rounded-full bg-[#E6F0FB] overflow-hidden mb-2">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600" style={{ width: `${Math.min(b.enTransito * 8, 100)}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-700">
                  <span>Entregado</span>
                  <span className="font-semibold text-[#1A334B]">{b.entregado}</span>
                </div>
                <div className="h-2 rounded-full bg-[#E6F0FB] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${Math.min(b.entregado * 8, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
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
                <th className="py-3 px-4 text-sm">Dias en etapa</th>
              </tr>
            </thead>
            <tbody>
              {oportunidades.map((op) => (
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
