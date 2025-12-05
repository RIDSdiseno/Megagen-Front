import { useEffect, useMemo, useRef, useState } from "react";
import MainLayout from "../components/MainLayout";
import Modal from "../components/Modal";
import { getStoredEvents, type StoredEvent } from "../utils/events";
import { useAuth } from "../context/AuthContext";

import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
} from "react-big-calendar";

import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";

import "react-big-calendar/lib/css/react-big-calendar.css";

type LeadEvent = {
  id: number | string;
  title: string;
  start: Date;
  end: Date;
  paciente: string;
  telefono: string;
  estado: "Nuevo" | "Cotizando" | "En Proceso" | "Confirmado" | "Entregado";
  correo?: string;
  resumen?: string;
  ownerEmail?: string;
};

const locales = { es };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const eventosIniciales: LeadEvent[] = [
  {
    id: 1,
    title: "Revision inicial - Juan Perez",
    start: new Date(2025, 10, 5, 10, 0),
    end: new Date(2025, 10, 5, 11, 0),
    paciente: "Juan Perez",
    telefono: "+56988881234",
    estado: "Cotizando",
     ownerEmail: "luis.herrera@megagen.cl",
  },
  {
    id: 2,
    title: "Entrega implante - Ana Martinez",
    start: new Date(2025, 10, 6, 15, 0),
    end: new Date(2025, 10, 6, 16, 0),
    paciente: "Ana Martinez",
    telefono: "+56992340022",
    estado: "Confirmado",
     ownerEmail: "paula.rios@megagen.cl",
  },
  {
    id: 3,
    title: "Reunion seguimiento - Pedro Silva",
    start: new Date(2025, 10, 8, 9, 30),
    end: new Date(2025, 10, 8, 10, 15),
    paciente: "Pedro Silva",
    telefono: "+56990001122",
    estado: "En Proceso",
     ownerEmail: "paula.rios@megagen.cl",
  },
];

export default function CalendarPage() {
  const { user } = useAuth();
  const [eventos, setEventos] = useState<LeadEvent[]>(eventosIniciales);
  const [selected, setSelected] = useState<LeadEvent | null>(null);
  const [alerta, setAlerta] = useState<LeadEvent | null>(null);
  const lastAlertId = useRef<string | number | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<LeadEvent["estado"] | "Todos">("Todos");
  const [registro, setRegistro] = useState<Array<{ id: LeadEvent["id"]; title: string; accion: LeadEvent["estado"]; fecha: Date }>>([]);

  const isAdminLike = user?.roles?.some((r) => r === "admin" || r === "superadmin" || r === "supervisor") ?? false;
  const isVendedorSolo = (user?.roles?.includes("vendedor") ?? false) && !isAdminLike;

  const eventosPermitidos = useMemo(
    () => eventos.filter((e) => !isVendedorSolo || !e.ownerEmail || e.ownerEmail === user?.email),
    [eventos, isVendedorSolo, user?.email]
  );

  const eventosFiltrados = useMemo(() => {
    const term = busqueda.toLowerCase();
    return eventosPermitidos.filter((e) => {
      const matchTexto =
        e.title.toLowerCase().includes(term) ||
        (e.paciente || "").toLowerCase().includes(term) ||
        (e.telefono || "").toLowerCase().includes(term);
      const matchEstado = estadoFiltro === "Todos" ? true : e.estado === estadoFiltro;
      return matchTexto && matchEstado;
    });
  }, [eventosPermitidos, busqueda, estadoFiltro]);

  const resumen = useMemo(() => {
    const base: Record<string, number> = {
      "Nuevo": 0,
      "Cotizando": 0,
      "En Proceso": 0,
      "Confirmado": 0,
      "Entregado": 0,
    };
    eventosFiltrados.forEach((e) => {
      base[e.estado] = (base[e.estado] || 0) + 1;
    });
    return Object.entries(base);
  }, [eventosFiltrados]);

  const proximos = useMemo(
    () => [...eventosFiltrados].sort((a, b) => a.start.getTime() - b.start.getTime()),
    [eventosFiltrados]
  );

  const actualizarEstado = (id: LeadEvent["id"], estado: LeadEvent["estado"]) => {
    setEventos((prev) => prev.map((ev) => (ev.id === id ? { ...ev, estado } : ev)));
    setSelected((prev) => (prev && prev.id === id ? { ...prev, estado } : prev));
    const origen = eventos.find((ev) => ev.id === id);
    setRegistro((prev) => [{ id, title: origen?.title || "Reunion", accion: estado, fecha: new Date() }, ...prev].slice(0, 50));
  };

  const proximo = proximos[0];

  useEffect(() => {
    const loadStored = () => {
      const stored = getStoredEvents().map(
        (e: StoredEvent): LeadEvent => ({
          id: e.id,
          title: e.title,
          start: new Date(e.start),
          end: new Date(e.end),
          paciente: e.paciente || "",
          telefono: e.telefono || "",
          estado: (e.estado as LeadEvent["estado"]) || "Nuevo",
          ownerEmail: e.ownerEmail || "",
        })
      );
      setEventos((prev) => [...prev.filter((p) => typeof p.id === "number"), ...stored]);
    };
    loadStored();
    const listener = () => loadStored();
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, []);

  useEffect(() => {
    const fetchRemote = async () => {
      if (!user?.token) return;
      try {
        const resp = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"}/meetings`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (!resp.ok) return;
        const data = (await resp.json()) as Array<{
          id: number;
          title: string;
          start: string;
          end: string;
          estado?: LeadEvent["estado"];
          paciente?: string;
          telefono?: string;
        }>;
        const mapped = data.map((e) => ({
          id: e.id,
          title: e.title,
          start: new Date(e.start),
          end: new Date(e.end),
          estado: e.estado || "Nuevo",
          paciente: e.paciente || "",
          telefono: e.telefono || "",
          correo: (e as any).correo || "",
          ownerEmail: (e as any).ownerEmail || "",
        })) as LeadEvent[];
        setEventos((prev) => {
          const locals = prev.filter((p) => typeof p.id !== "number");
          return [...locals, ...mapped];
        });
      } catch {
        /* ignore */
      }
    };
    fetchRemote();
  }, [user?.token]);

  useEffect(() => {
    const check = () => {
      const now = Date.now();
      const soon = eventosPermitidos.find((e) => {
        const diff = new Date(e.start).getTime() - now;
        return diff > 0 && diff <= 20 * 60 * 1000;
      });
      if (soon && soon.id !== lastAlertId.current) {
        setAlerta(soon);
        lastAlertId.current = soon.id;
      }
    };
    check();
    const timer = setInterval(check, 30000);
    return () => clearInterval(timer);
  }, [eventosPermitidos]);

  return (
    <MainLayout>
      
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-[#4B6B8A] font-semibold">Calendario y reuniones</p>
          <h2 className="text-3xl font-extrabold text-[#1A334B]">
            Agenda de leads y clientes
          </h2>
          <p className="text-gray-600">
            Visualiza citas, reuniones y entregas en un solo lugar para coordinar oportunidades.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F4F8FD] border border-[#D9E7F5] text-gray-600">
            <input
              type="text"
              placeholder="Buscar por cliente, titulo o telefono..."
              className="outline-none bg-transparent text-sm text-gray-700"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value as any)}
            className="text-sm border border-[#D9E7F5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1A6CD3]"
          >
            {["Todos", "Nuevo", "Cotizando", "En Proceso", "Confirmado", "Entregado"].map((op) => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
        </div>
      </div>

      {proximo && (
        <div className="mb-4 bg-amber-50 border border-amber-100 text-amber-800 px-4 py-3 rounded-lg text-sm flex items-center gap-3">
          <span className="font-semibold">Proxima reunion:</span>
          <span>{proximo.title} - {proximo.start.toLocaleString("es-CL")}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {resumen.map(([estado, total]) => (
          <div
            key={estado}
            className="bg-white border border-[#D9E7F5] rounded-xl p-3 shadow-sm hover:shadow-md transition-all"
          >
            <p className="text-xs font-semibold text-gray-500">{estado}</p>
            <p className="text-2xl font-bold text-[#1A334B]">{total}</p>
            <div className="h-1.5 rounded-full bg-[#E6F0FB] mt-2 overflow-hidden">
              <span className="block h-full bg-[#1A6CD3]" style={{ width: `${Math.min(total * 25, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow p-4 h-[650px] mb-6">
        <BigCalendar
          localizer={localizer}
          events={eventosFiltrados}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          popup
          views={["month", "week", "day"]}
          defaultView="month"
          messages={{
            month: "Mes",
            week: "Semana",
            day: "Dia",
            today: "Hoy",
            previous: "Anterior",
            next: "Siguiente",
            agenda: "Agenda",
            showMore: (total) => `+${total} mas`,
          }}
          eventPropGetter={(event) => {
            const ev = event as LeadEvent;
            const colors: Record<LeadEvent["estado"], string> = {
              Nuevo: "#e5e7eb",
              Cotizando: "#bfdbfe",
              "En Proceso": "#fde68a",
              Confirmado: "#bbf7d0",
              Entregado: "#c7d2fe",
            };
            return {
              style: {
                backgroundColor: colors[ev.estado],
                color: "#0f172a",
                borderRadius: 12,
                border: "1px solid #d9e7f5",
                textDecoration: ev.estado === "Entregado" ? "line-through" : "none",
              },
            };
          }}
          onSelectEvent={(event) => setSelected(event as LeadEvent)}
        />
      </div>

      <section className="bg-white border border-gray-200 rounded-2xl shadow p-4">
        <h3 className="text-lg font-bold text-[#1A334B] mb-3">
          Reuniones y actividades de leads
        </h3>
        <div className="divide-y divide-gray-100">
          {proximos.map((ev) => (
            <div
              key={ev.id}
              className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded-lg cursor-pointer"
              onClick={() => setSelected(ev)}
            >
              <div>
                <p className="font-semibold text-gray-800">{ev.title}</p>
                <p className="text-xs text-gray-500">
                  {ev.paciente} - {ev.telefono}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-semibold">
                  {ev.estado}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); actualizarEstado(ev.id, "Confirmado"); }}
                  className="text-[11px] px-2 py-1 rounded-full border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  Confirmar
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); actualizarEstado(ev.id, "Entregado"); }}
                  className="text-[11px] px-2 py-1 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Completar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl shadow p-4 mt-4">
        <h3 className="text-lg font-bold text-[#1A334B] mb-3">Registro de cambios</h3>
        {registro.length === 0 ? (
          <p className="text-sm text-gray-600">Sin acciones recientes sobre reuniones.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {registro.map((r, idx) => (
              <div key={`${r.id}-${idx}`} className="py-2 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{r.title}</p>
                  <p className="text-xs text-gray-500">Accion: {r.accion}</p>
                </div>
                <span className="text-xs text-gray-500">{r.fecha.toLocaleString("es-CL")}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <div className="p-5">
            <h3 className="text-xl font-bold text-[#1A334B] mb-2">
              {selected.title}
            </h3>

            <div className="space-y-1 text-sm text-gray-700">
              <p><strong>Paciente:</strong> {selected.paciente}</p>
              <p><strong>Telefono:</strong> {selected.telefono}</p>
              {selected.correo && <p><strong>Correo:</strong> {selected.correo}</p>}
              <p><strong>Estado:</strong> {selected.estado}</p>
              <p><strong>Inicio:</strong> {selected.start.toLocaleString("es-CL")}</p>
              <p><strong>Termino:</strong> {selected.end.toLocaleString("es-CL")}</p>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  actualizarEstado(selected?.id ?? "", "Confirmado");
                }}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition"
              >
                Marcar confirmada
              </button>
              <button
                onClick={() => {
                  actualizarEstado(selected?.id ?? "", "Entregado");
                }}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
              >
                Finalizar
              </button>
              <button
                onClick={() => selected.telefono && window.open(`https://wa.me/${selected.telefono.replace(/[^\\d]/g, "")}`)}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD] transition"
              >
                WhatsApp
              </button>
              <button
                onClick={() => selected.correo && window.open(`mailto:${selected.correo}`)}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD] transition"
              >
                Enviar correo
              </button>
            </div>

            <button
              onClick={() => setSelected(null)}
              className="mt-5 w-full bg-megagen-primary hover:bg-megagen-dark text-white py-2 rounded-lg font-semibold transition"
            >
              Cerrar
            </button>
          </div>
        </Modal>
      )}

      {alerta && (
        <Modal onClose={() => setAlerta(null)}>
          <div className="p-5 space-y-3">
            <h3 className="text-xl font-bold text-[#1A334B]">Reunion en breve</h3>
            <p className="text-sm text-gray-700">{alerta.title}</p>
            <p className="text-sm text-gray-700"><strong>Hora:</strong> {alerta.start.toLocaleString("es-CL")}</p>
            {alerta.paciente && <p className="text-sm text-gray-700"><strong>Paciente:</strong> {alerta.paciente}</p>}
            {alerta.telefono && <p className="text-sm text-gray-700"><strong>Telefono:</strong> {alerta.telefono}</p>}
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              La reunion empieza en menos de 20 minutos.
            </p>
            <button
              onClick={() => setAlerta(null)}
              className="w-full bg-megagen-primary hover:bg-megagen-dark text-white py-2 rounded-lg font-semibold transition"
            >
              Entendido
            </button>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}
