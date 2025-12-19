import { useEffect, useMemo, useState } from "react";
import MainLayout from "../components/MainLayout";
import { useAuth } from "../context/AuthContext";
import { CalendarRange, Filter, RefreshCw, Route, Upload, PlusCircle, Search, Users, Calendar as CalendarIcon, Download } from "lucide-react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  type Event as BigEvent,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

type VisitaEstado = "PROGRAMADA" | "EN_CURSO" | "COMPLETADA" | "CANCELADA";

type VisitaTerreno = {
  id: number;
  fecha: string;
  estado: VisitaEstado;
  cliente: string;
  direccion: string;
  motivo: string;
  resultado: string;
  comentarios: string;
  bodegueroEmail: string;
  bodegueroNombre: string;
  cotizacionId: number | null;
  cotizacionCodigo: string;
};

type VisitaEvent = BigEvent & { resource: VisitaTerreno };

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

const estadoLabel: Record<VisitaEstado, string> = {
  PROGRAMADA: "Programada",
  EN_CURSO: "En curso",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
};

const estadoColor: Record<VisitaEstado, string> = {
  PROGRAMADA: "bg-sky-100 text-sky-700 border-sky-200",
  EN_CURSO: "bg-amber-100 text-amber-700 border-amber-200",
  COMPLETADA: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELADA: "bg-rose-100 text-rose-700 border-rose-200",
};

const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export default function TerrainVisitsPage() {
  const { user } = useAuth();
  const [visitas, setVisitas] = useState<VisitaTerreno[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bodegueroFiltro, setBodegueroFiltro] = useState<string>("Todos");
  const [estadoFiltro, setEstadoFiltro] = useState<VisitaEstado | "Todos">("Todos");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [clienteFiltro, setClienteFiltro] = useState<string>("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [detalle, setDetalle] = useState<VisitaTerreno | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [nueva, setNueva] = useState({
    fecha: new Date().toISOString().slice(0, 16),
    estado: "PROGRAMADA" as VisitaEstado,
    cliente: "",
    direccion: "",
    motivo: "",
    resultado: "",
    comentarios: "",
    bodegueroEmail: user?.email || "",
    cotizacionId: "",
  });

  const headers = useMemo(() => {
    const h: Record<string, string> = {};
    if (user?.token) h.Authorization = `Bearer ${user.token}`;
    return h;
  }, [user?.token]);

  const fetchVisitas = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (bodegueroFiltro !== "Todos") params.append("bodegueroEmail", bodegueroFiltro);
      if (estadoFiltro !== "Todos") params.append("estado", estadoFiltro);
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      if (clienteFiltro !== "Todos") params.append("cliente", clienteFiltro);
      const resp = await fetch(`${API_URL}/terrain/visits?${params.toString()}`, { headers });
      if (!resp.ok) {
        const status = resp.status;
        const e = await resp.json().catch(() => ({}));
        const msg =
          status === 404
            ? "Ruta /terrain/visits no encontrada en el backend. Revisa el deploy o la variable VITE_API_URL."
            : e.message || "No se pudo cargar visitas a terreno";
        throw new Error(msg);
      }
      const data = (await resp.json()) as VisitaTerreno[];
      setVisitas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido cargando visitas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitas();
  }, []);

  useEffect(() => {
    fetchVisitas();
  }, [bodegueroFiltro, estadoFiltro, from, to, clienteFiltro]);

  useEffect(() => {
    setNueva((prev) => ({ ...prev, bodegueroEmail: user?.email || prev.bodegueroEmail }));
  }, [user?.email]);

  const bodegueros = useMemo(() => {
    const set = new Set<string>();
    visitas.forEach((v) => {
      if (v.bodegueroEmail) set.add(v.bodegueroEmail);
    });
    return Array.from(set);
  }, [visitas]);

  const clientes = useMemo(() => {
    const set = new Set<string>();
    visitas.forEach((v) => {
      if (v.cliente) set.add(v.cliente);
    });
    return Array.from(set);
  }, [visitas]);

  const filtradas = useMemo(() => {
    const term = busqueda.toLowerCase();
    return visitas.filter((v) => {
      const matchCliente = clienteFiltro === "Todos" ? true : v.cliente === clienteFiltro;
      const matchText =
        !term ||
        v.cliente.toLowerCase().includes(term) ||
        v.direccion.toLowerCase().includes(term) ||
        v.motivo.toLowerCase().includes(term) ||
        v.resultado.toLowerCase().includes(term);
      return matchCliente && matchText;
    });
  }, [visitas, clienteFiltro, busqueda]);

  const resumenEstado = useMemo(() => {
    const base: Record<VisitaEstado, number> = { PROGRAMADA: 0, EN_CURSO: 0, COMPLETADA: 0, CANCELADA: 0 };
    filtradas.forEach((v) => {
      base[v.estado] = (base[v.estado] || 0) + 1;
    });
    return base;
  }, [filtradas]);

  const puedeCrear = useMemo(
    () => (user?.roles || []).some((r) => ["admin", "superadmin", "supervisor", "bodeguero"].includes(r)),
    [user?.roles]
  );

  const filtrosActivos = useMemo(
    () => bodegueroFiltro !== "Todos" || estadoFiltro !== "Todos" || from !== "" || to !== "" || clienteFiltro !== "Todos" || busqueda !== "",
    [bodegueroFiltro, estadoFiltro, from, to, clienteFiltro, busqueda]
  );

  const exportCsv = () => {
    const rows = [
      ["id", "fecha", "estado", "cliente", "direccion", "motivo", "resultado", "bodeguero", "cotizacion"],
      ...filtradas.map((v) => [
        v.id,
        new Date(v.fecha).toISOString(),
        v.estado,
        v.cliente,
        v.direccion,
        v.motivo,
        v.resultado,
        v.bodegueroEmail,
        v.cotizacionCodigo || v.cotizacionId || "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "visitas_terreno.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    const rows = filtradas
      .map(
        (v) => `
          <tr>
            <td style="padding:6px 8px;border:1px solid #e5e7eb;">${new Date(v.fecha).toLocaleString()}</td>
            <td style="padding:6px 8px;border:1px solid #e5e7eb;">${estadoLabel[v.estado]}</td>
            <td style="padding:6px 8px;border:1px solid #e5e7eb;">${v.cliente}</td>
            <td style="padding:6px 8px;border:1px solid #e5e7eb;">${v.bodegueroEmail || ""}</td>
            <td style="padding:6px 8px;border:1px solid #e5e7eb;">${v.direccion || ""}</td>
            <td style="padding:6px 8px;border:1px solid #e5e7eb;">${v.motivo || ""}</td>
          </tr>`
      )
      .join("");

    win.document.write(`
      <html>
        <head>
          <title>Informe de Visitas a Terreno</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1f2937; }
            h1 { margin-bottom: 4px; }
            h3 { margin-top: 0; color: #2563eb; }
            table { border-collapse: collapse; width: 100%; margin-top: 12px; font-size: 12px; }
            th { background: #f1f5f9; text-align: left; padding: 6px 8px; border: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <h1>Visitas a Terreno</h1>
          <h3>Generado ${new Date().toLocaleString()}</h3>
          <p>Total registros: ${filtradas.length}</p>
          <table>
            <thead>
              <tr>
                <th>Fecha</th><th>Estado</th><th>Cliente</th><th>Bodeguero</th><th>Dirección</th><th>Motivo</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  const calendarEvents: VisitaEvent[] = useMemo(
    () =>
      filtradas.map((v) => {
        const start = new Date(v.fecha);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        return {
          id: v.id,
          title: `${estadoLabel[v.estado]} - ${v.cliente}`,
          start,
          end,
          resource: v,
        };
      }),
    [filtradas]
  );

  const eventStyleGetter = (event: VisitaEvent) => {
    const bg =
      event.resource.estado === "PROGRAMADA"
        ? "#e0f2fe"
        : event.resource.estado === "EN_CURSO"
        ? "#fef3c7"
        : event.resource.estado === "COMPLETADA"
        ? "#dcfce7"
        : "#ffe4e6";
    const color =
      event.resource.estado === "PROGRAMADA"
        ? "#0369a1"
        : event.resource.estado === "EN_CURSO"
        ? "#b45309"
        : event.resource.estado === "COMPLETADA"
        ? "#15803d"
        : "#be123c";
    return { style: { backgroundColor: bg, border: "1px solid #e5e7eb", color, borderRadius: "8px" } };
  };

  const handleCrear = async () => {
    if (!nueva.fecha || !nueva.cliente) return;
    setError("");
    try {
      const resp = await fetch(`${API_URL}/terrain/visits`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...nueva,
          cotizacionId: nueva.cotizacionId ? Number(nueva.cotizacionId) : undefined,
        }),
      });
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error(e.message || "No se pudo crear la visita");
      }
      await fetchVisitas();
      setShowForm(false);
      setNueva({
        fecha: new Date().toISOString().slice(0, 16),
        estado: "PROGRAMADA",
        cliente: "",
        direccion: "",
        motivo: "",
        resultado: "",
        comentarios: "",
        bodegueroEmail: "",
        cotizacionId: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando visita");
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-[#4B6B8A] font-semibold">Operaciones</p>
          <h2 className="text-3xl font-extrabold text-[#1A334B]">Visitas a terreno</h2>
          <p className="text-gray-600 text-sm">
            Controla las salidas a terreno del equipo de bodega: fechas, responsable y estado de cada visita.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchVisitas}
            className="flex items-center gap-2 border border-[#D9E7F5] text-[#1A334B] font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all bg-white"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Actualizar
          </button>
          <button
            onClick={() => setShowCalendar(true)}
            className="flex items-center gap-2 border border-[#D9E7F5] text-[#1A334B] font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all bg-white"
          >
            <CalendarIcon size={16} /> Calendario
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 border border-[#D9E7F5] text-[#1A334B] font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all bg-white"
          >
            <Upload size={16} /> Exportar CSV
          </button>
          <button
            onClick={exportPdf}
            className="flex items-center gap-2 border border-[#D9E7F5] text-[#1A334B] font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all bg-white"
          >
            <Download size={16} /> Exportar PDF
          </button>
          {puedeCrear && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <PlusCircle size={16} /> Nueva visita
            </button>
          )}
        </div>
      </div>

      {error && <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {(Object.keys(resumenEstado) as VisitaEstado[]).map((estado) => (
          <button
            key={estado}
            onClick={() => setEstadoFiltro((prev) => (prev === estado ? "Todos" : estado))}
            className={`text-left bg-white border rounded-xl p-3 shadow-sm transition-all ${
              estadoFiltro === estado ? "ring-2 ring-[#1A6CD3]/40 border-[#1A6CD3]" : "hover:shadow-md"
            } ${estadoColor[estado]}`}
          >
            <p className="text-xs font-semibold text-gray-600 flex items-center justify-between">
              {estadoLabel[estado]}
              {estadoFiltro === estado && <span className="text-[10px] px-2 py-0.5 bg-white/60 rounded-full">Filtro</span>}
            </p>
            <p className="text-2xl font-bold text-[#1A334B]">{resumenEstado[estado]}</p>
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 mb-5 flex flex-col gap-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F4F8FD] border border-[#D9E7F5] text-gray-700">
            <Search size={16} className="text-[#1A6CD3]" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por cliente, motivo o direccion"
              className="bg-transparent text-sm outline-none"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F4F8FD] border border-[#D9E7F5] text-gray-700">
            <Users size={16} className="text-[#1A6CD3]" />
            <select
              value={clienteFiltro}
              onChange={(e) => setClienteFiltro(e.target.value)}
              className="bg-transparent text-sm outline-none"
            >
              <option value="Todos">Todos los clientes</option>
              {clientes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F4F8FD] border border-[#D9E7F5] text-gray-700">
            <Filter size={16} className="text-[#1A6CD3]" />
            <select
              value={bodegueroFiltro}
              onChange={(e) => setBodegueroFiltro(e.target.value)}
              className="bg-transparent text-sm outline-none"
            >
              <option value="Todos">Todos los bodegueros</option>
              {bodegueros.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F4F8FD] border border-[#D9E7F5] text-gray-700">
            <CalendarRange size={16} className="text-[#1A6CD3]" />
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-transparent text-sm outline-none" />
            <span className="text-xs text-gray-500">a</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-transparent text-sm outline-none" />
          </div>
          {filtrosActivos && (
            <button
            onClick={() => {
              setBodegueroFiltro("Todos");
              setEstadoFiltro("Todos");
              setFrom("");
              setTo("");
              setClienteFiltro("Todos");
              setBusqueda("");
            }}
            className="text-xs font-semibold text-[#1A334B] border border-[#D9E7F5] rounded-lg px-3 py-2 bg-white hover:bg-[#F4F8FD]"
          >
            Limpiar filtros
          </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[#1A334B] text-sm">
          <Route size={16} className="animate-pulse" /> Cargando visitas...
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F5FAFF] text-[#1A334B] text-left text-sm">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Bodeguero</th>
                <th className="py-3 px-4">Direccion</th>
                <th className="py-3 px-4">Motivo / Resultado</th>
                <th className="py-3 px-4">Cotizacion</th>
              </tr>
          </thead>
          <tbody>
              {filtradas.map((v) => (
                <tr
                  key={v.id}
                  className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setDetalle(v)}
                >
                  <td className="py-3 px-4 text-sm text-gray-700">{new Date(v.fecha).toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${estadoColor[v.estado]}`}>
                      {estadoLabel[v.estado]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800">
                    <p className="font-semibold">{v.cliente}</p>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    <p className="font-semibold">{v.bodegueroNombre || "Sin nombre"}</p>
                    <p className="text-xs text-gray-500">{v.bodegueroEmail}</p>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">{v.direccion || "No informada"}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    <p className="font-semibold">{v.motivo || "Sin motivo"}</p>
                    <p className="text-xs text-gray-500">{v.resultado || v.comentarios || ""}</p>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {v.cotizacionId ? (
                      <span className="font-semibold text-[#1A6CD3]">#{v.cotizacionId} {v.cotizacionCodigo}</span>
                    ) : (
                      <span className="text-gray-500 text-xs">Sin referencia</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-sm text-gray-500">
                    No hay visitas para los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {detalle && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#1A334B]">Detalle de visita</h3>
              <button onClick={() => setDetalle(null)} className="text-gray-500 hover:text-gray-700 text-sm">Cerrar</button>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Fecha:</strong> {new Date(detalle.fecha).toLocaleString()}</p>
              <p><strong>Estado:</strong> {estadoLabel[detalle.estado]}</p>
              <p><strong>Cliente:</strong> {detalle.cliente}</p>
              <p><strong>Direccion:</strong> {detalle.direccion || "N/A"}</p>
              <p><strong>Motivo:</strong> {detalle.motivo || "N/A"}</p>
              <p><strong>Resultado:</strong> {detalle.resultado || "N/A"}</p>
              <p><strong>Comentarios:</strong> {detalle.comentarios || "N/A"}</p>
              <p><strong>Bodeguero:</strong> {detalle.bodegueroNombre || "N/A"} ({detalle.bodegueroEmail || "N/A"})</p>
              <p><strong>Cotizacion:</strong> {detalle.cotizacionId ? `#${detalle.cotizacionId} ${detalle.cotizacionCodigo}` : "N/A"}</p>
            </div>
            <div className="mt-4 text-right">
              <button
                onClick={() => setDetalle(null)}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showCalendar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#4B6B8A] font-semibold">Calendario de visitas</p>
                <h3 className="text-xl font-bold text-[#1A334B]">Entregas y salidas a terreno</h3>
              </div>
              <button onClick={() => setShowCalendar(false)} className="text-gray-500 hover:text-gray-700 text-sm">Cerrar</button>
            </div>
            <div className="flex-1">
              <BigCalendar
                localizer={localizer}
                events={calendarEvents}
                defaultView="month"
                views={["month", "week", "day"]}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={(evt) => {
                  if (evt.resource) setDetalle(evt.resource as VisitaTerreno);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#1A334B]">Nueva visita a terreno</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 text-sm">Cerrar</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-[#1A334B] flex flex-col gap-1">
                Fecha y hora
                <input
                  type="datetime-local"
                  value={nueva.fecha}
                  onChange={(e) => setNueva({ ...nueva, fecha: e.target.value })}
                  className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-semibold text-[#1A334B] flex flex-col gap-1">
                Estado
                <select
                  value={nueva.estado}
                  onChange={(e) => setNueva({ ...nueva, estado: e.target.value as VisitaEstado })}
                  className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm"
                >
                  {Object.keys(estadoLabel).map((e) => (
                    <option key={e} value={e}>{estadoLabel[e as VisitaEstado]}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-[#1A334B] flex flex-col gap-1 md:col-span-2">
                Cliente
                <input
                  type="text"
                  value={nueva.cliente}
                  onChange={(e) => setNueva({ ...nueva, cliente: e.target.value })}
                  className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm"
                  placeholder="Nombre del cliente"
                />
              </label>
              <label className="text-xs font-semibold text-[#1A334B] flex flex-col gap-1 md:col-span-2">
                Direccion
                <input
                  type="text"
                  value={nueva.direccion}
                  onChange={(e) => setNueva({ ...nueva, direccion: e.target.value })}
                  className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm"
                  placeholder="Direccion exacta"
                />
              </label>
              <label className="text-xs font-semibold text-[#1A334B] flex flex-col gap-1 md:col-span-2">
                Motivo
                <input
                  type="text"
                  value={nueva.motivo}
                  onChange={(e) => setNueva({ ...nueva, motivo: e.target.value })}
                  className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm"
                  placeholder="Entrega, revision, etc"
                />
              </label>
              <label className="text-xs font-semibold text-[#1A334B] flex flex-col gap-1 md:col-span-2">
                Resultado / Comentarios
                <textarea
                  value={nueva.resultado}
                  onChange={(e) => setNueva({ ...nueva, resultado: e.target.value })}
                  className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm"
                  rows={2}
                />
              </label>
              <label className="text-xs font-semibold text-[#1A334B] flex flex-col gap-1">
                Bodeguero email
                <input
                  type="email"
                  value={nueva.bodegueroEmail}
                  onChange={(e) => setNueva({ ...nueva, bodegueroEmail: e.target.value })}
                  className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm"
                  placeholder="bodega@megagen.cl"
                />
              </label>
              <label className="text-xs font-semibold text-[#1A334B] flex flex-col gap-1">
                Cotizacion ID (opcional)
                <input
                  type="number"
                  value={nueva.cotizacionId}
                  onChange={(e) => setNueva({ ...nueva, cotizacionId: e.target.value })}
                  className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm"
                  placeholder="Ej: 205"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD]"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrear}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] text-white"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
