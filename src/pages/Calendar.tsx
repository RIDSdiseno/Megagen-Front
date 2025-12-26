import { useEffect, useMemo, useRef, useState } from "react";
import MainLayout from "../components/MainLayout";
import Modal from "../components/Modal";
import { getStoredEvents, updateEvent, type StoredEvent } from "../utils/events";
import { useAuth } from "../context/AuthContext";
import { findVendorByEmail } from "../utils/vendors";
import { useI18n } from "../context/I18nContext";

import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
} from "react-big-calendar";

import { format, parse, startOfWeek, getDay } from "date-fns";
import { es, enUS, ko as koLocale } from "date-fns/locale";

import "react-big-calendar/lib/css/react-big-calendar.css";

type LeadEventEstadoLabel = "Nuevo" | "Cotizando" | "En Proceso" | "Confirmado" | "Entregado";
type LeadEventEstadoApi = "NUEVO" | "COTIZANDO" | "EN_PROCESO" | "CONFIRMADO" | "ENTREGADO";
type LeadEventEstado = LeadEventEstadoLabel | LeadEventEstadoApi;

type LeadEvent = {
  id: number | string;
  title: string;
  start: Date;
  end: Date;
  paciente: string;
  telefono: string;
  estado: LeadEventEstadoLabel;
  correo?: string;
  resumen?: string;
  ownerEmail?: string;
};

type RegistroCambio = {
  id: LeadEvent["id"];
  title: string;
  accion: string;
  detalle: string;
  fecha: Date;
  usuario?: string;
};

const locales = { es, en: enUS, ko: koLocale };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
const CHANGELOG_KEY = "megagen_meeting_changes";

const estadoToApi: Record<LeadEventEstadoLabel, LeadEventEstadoApi> = {
  Nuevo: "NUEVO",
  Cotizando: "COTIZANDO",
  "En Proceso": "EN_PROCESO",
  Confirmado: "CONFIRMADO",
  Entregado: "ENTREGADO",
};

const normalizeLeadEstado = (estado?: LeadEventEstado | string | null): LeadEventEstadoLabel => {
  const raw = String(estado || "").trim().toUpperCase().replace(/\s+/g, "_");
  if (raw === "NUEVO") return "Nuevo";
  if (raw === "COTIZANDO") return "Cotizando";
  if (raw === "EN_PROCESO") return "En Proceso";
  if (raw === "CONFIRMADO") return "Confirmado";
  if (raw === "ENTREGADO") return "Entregado";
  return "Nuevo";
};

const formatVendorLabel = (email?: string) => {
  if (!email) return "Sin vendedor";
  const vendor = findVendorByEmail(email);
  return vendor?.nombre || email;
};

const toInputDate = (date: Date) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

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
  const { t, lang } = useI18n();
  const [eventos, setEventos] = useState<LeadEvent[]>(eventosIniciales);
  const [selected, setSelected] = useState<LeadEvent | null>(null);
  const [alerta, setAlerta] = useState<LeadEvent | null>(null);
  const lastAlertId = useRef<string | number | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<LeadEventEstadoLabel | "Todos">("Todos");
  const [registro, setRegistro] = useState<RegistroCambio[]>(() => {
    try {
      const raw = localStorage.getItem(CHANGELOG_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Array<Omit<RegistroCambio, "fecha"> & { fecha: string }>;
      if (!Array.isArray(parsed)) return [];
      return parsed.map((r) => ({
        id: r.id,
        title: r.title || "Reunion",
        accion: r.accion || "Actualizacion",
        detalle: (r as any).detalle || "",
        usuario: r.usuario,
        fecha: new Date(r.fecha),
      }));
    } catch {
      return [];
    }
  });
  const [vendedorFiltro, setVendedorFiltro] = useState<string>("Todos");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string>("");
  const [editForm, setEditForm] = useState<{
    title: string;
    start: string;
    end: string;
    estado: LeadEventEstadoLabel;
    paciente: string;
    correo: string;
    telefono: string;
  }>({
    title: "",
    start: "",
    end: "",
    estado: "Nuevo",
    paciente: "",
    correo: "",
    telefono: "",
  });

  const isAdminLike = user?.roles?.some((r) => r === "admin" || r === "superadmin" || r === "supervisor") ?? false;
  const isVendedorSolo = (user?.roles?.includes("vendedor") ?? false) && !isAdminLike;

  const eventosPermitidos = useMemo(
    () => eventos.filter((e) => {
      const byRole = !isVendedorSolo || !e.ownerEmail || e.ownerEmail === user?.email;
      const byVendor = vendedorFiltro === "Todos" ? true : e.ownerEmail === vendedorFiltro;
      return byRole && byVendor;
    }),
    [eventos, isVendedorSolo, user?.email, vendedorFiltro]
  );

  const eventosFiltrados = useMemo(() => {
    const term = busqueda.toLowerCase();
    return eventosPermitidos.filter((e) => {
      const matchTexto =
        e.title.toLowerCase().includes(term) ||
        (e.paciente || "").toLowerCase().includes(term) ||
        (e.telefono || "").toLowerCase().includes(term) ||
        (e.correo || "").toLowerCase().includes(term) ||
        (e.ownerEmail || "").toLowerCase().includes(term);
      const matchEstado = estadoFiltro === "Todos" ? true : normalizeLeadEstado(e.estado) === estadoFiltro;
      return matchTexto && matchEstado;
    });
  }, [eventosPermitidos, busqueda, estadoFiltro]);

  const resumen = useMemo(() => {
    const base: Record<LeadEventEstadoLabel, number> = {
      Nuevo: 0,
      Cotizando: 0,
      "En Proceso": 0,
      Confirmado: 0,
      Entregado: 0,
    };
    eventosFiltrados.forEach((e) => {
      const label = normalizeLeadEstado(e.estado);
      base[label] = (base[label] || 0) + 1;
    });
    return Object.entries(base);
  }, [eventosFiltrados]);

  const vendedoresDisponibles = useMemo(() => {
    const map = new Map<string, string>();
    eventos.forEach((e) => {
      if (e.ownerEmail) map.set(e.ownerEmail, formatVendorLabel(e.ownerEmail));
    });
    return Array.from(map.entries())
      .map(([email, label]) => ({ email, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [eventos]);

  const proximos = useMemo(
    () => [...eventosFiltrados].sort((a, b) => a.start.getTime() - b.start.getTime()),
    [eventosFiltrados]
  );

  const eventosEditables = useMemo(
    () => [...eventosPermitidos].sort((a, b) => a.start.getTime() - b.start.getTime()),
    [eventosPermitidos]
  );

  const actividadesLeads = useMemo(() => {
    const estadosClave = new Set<LeadEventEstadoLabel>(["Nuevo", "Confirmado"]);
    return proximos.filter((ev) => estadosClave.has(normalizeLeadEstado(ev.estado)));
  }, [proximos]);

  const addRegistro = (entry: Omit<RegistroCambio, "fecha"> & { fecha?: Date }) => {
    const fecha = entry.fecha ?? new Date();
    setRegistro((prev) => {
      const next = [{ ...entry, fecha }, ...prev].slice(0, 50);
      try {
        const serializado = next.map((r) => ({ ...r, fecha: r.fecha.toISOString() }));
        localStorage.setItem(CHANGELOG_KEY, JSON.stringify(serializado));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const actualizarEstado = async (id: LeadEvent["id"], estado: LeadEventEstadoLabel) => {
    const previo = eventos.find((ev) => ev.id === id);
    const previoEstado = previo ? normalizeLeadEstado(previo.estado) : "Nuevo";
    const nuevoEstado = normalizeLeadEstado(estado);

    setEventos((prev) => prev.map((ev) => (ev.id === id ? { ...ev, estado: nuevoEstado } : ev)));
    setSelected((prev) => (prev && prev.id === id ? { ...prev, estado: nuevoEstado } : prev));

    addRegistro({
      id,
      title: previo?.title || t("Reunion"),
      accion: "Estado actualizado",
      detalle: `${t("Cliente")}: ${previo?.paciente || t("Sin cliente")} | ${t("Vendedor")}: ${t(
        formatVendorLabel(previo?.ownerEmail)
      )} | ${t("Estado")}: ${t(previoEstado)} -> ${t(nuevoEstado)}`,
      usuario: user?.email || undefined,
    });

    if (typeof id === "string") {
      updateEvent(id, { estado: nuevoEstado });
      return;
    }

    if (!user?.token) return;
    try {
      await fetch(`${API_URL}/meetings/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ estado: estadoToApi[nuevoEstado] }),
      });
    } catch {
      /* ignore */
    }
  };

  const selectEditTarget = (target: LeadEvent | null) => {
    if (!target) return;
    setEditTargetId(String(target.id));
    setEditForm({
      title: target.title,
      start: toInputDate(target.start),
      end: toInputDate(target.end),
      estado: normalizeLeadEstado(target.estado),
      paciente: target.paciente || "",
      correo: target.correo || "",
      telefono: target.telefono || "",
    });
  };

  const openEditModal = (target?: LeadEvent | null) => {
    const initial = target || eventosEditables[0];
    if (initial) selectEditTarget(initial);
    setShowEditModal(true);
  };

  const handleGuardarEdicion = async () => {
    const target = eventosPermitidos.find((ev) => String(ev.id) === editTargetId);
    const title = editForm.title.trim();
    if (!target || !title || !editForm.start) return;

    const startDate = new Date(editForm.start);
    let endDate = editForm.end ? new Date(editForm.end) : new Date(startDate.getTime() + 60 * 60 * 1000);
    if (Number.isNaN(startDate.getTime())) return;
    if (Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    }

    const nuevoEstado = normalizeLeadEstado(editForm.estado);
    const updated: LeadEvent = {
      ...target,
      title,
      start: startDate,
      end: endDate,
      estado: nuevoEstado,
      paciente: editForm.paciente.trim(),
      correo: editForm.correo.trim(),
      telefono: editForm.telefono.trim(),
    };

    setEventos((prev) => prev.map((ev) => (ev.id === target.id ? updated : ev)));
    setSelected((prev) => (prev && prev.id === target.id ? updated : prev));

    const cambios: string[] = [];
    if (target.title !== updated.title) cambios.push(`${t("Titulo")}: "${target.title}" -> "${updated.title}"`);
    if ((target.paciente || "") !== (updated.paciente || ""))
      cambios.push(`${t("Cliente")}: "${target.paciente || ""}" -> "${updated.paciente || ""}"`);
    if ((target.correo || "") !== (updated.correo || ""))
      cambios.push(`${t("Correo")}: "${target.correo || ""}" -> "${updated.correo || ""}"`);
    if ((target.telefono || "") !== (updated.telefono || ""))
      cambios.push(`${t("Telefono")}: "${target.telefono || ""}" -> "${updated.telefono || ""}"`);
    if (normalizeLeadEstado(target.estado) !== nuevoEstado)
      cambios.push(`${t("Estado")}: ${t(normalizeLeadEstado(target.estado))} -> ${t(nuevoEstado)}`);
    if (target.start.getTime() !== updated.start.getTime())
      cambios.push(`${t("Inicio")}: ${target.start.toLocaleString("es-CL")} -> ${updated.start.toLocaleString("es-CL")}`);
    if (target.end.getTime() !== updated.end.getTime())
      cambios.push(`${t("Termino")}: ${target.end.toLocaleString("es-CL")} -> ${updated.end.toLocaleString("es-CL")}`);

    addRegistro({
      id: target.id,
      title: updated.title,
      accion: "Reunion modificada",
      detalle: cambios.length ? cambios.join(" | ") : t("Sin cambios"),
      usuario: user?.email || undefined,
    });

    if (typeof target.id === "string") {
      updateEvent(target.id, {
        title: updated.title,
        start: updated.start.toISOString(),
        end: updated.end.toISOString(),
        paciente: updated.paciente,
        correo: updated.correo,
        telefono: updated.telefono,
        estado: updated.estado,
      });
      setShowEditModal(false);
      return;
    }

    if (user?.token) {
      try {
        await fetch(`${API_URL}/meetings/${target.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            title: updated.title,
            start: updated.start.toISOString(),
            end: updated.end.toISOString(),
            estado: estadoToApi[nuevoEstado],
            clienteNombre: updated.paciente,
            clienteCorreo: updated.correo || null,
            clienteTelefono: updated.telefono || null,
          }),
        });
      } catch {
        /* ignore */
      }
    }
    setShowEditModal(false);
  };

  const proximo = proximos[0];
  const editTarget = useMemo(
    () => eventosEditables.find((ev) => String(ev.id) === editTargetId) || null,
    [eventosEditables, editTargetId]
  );

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
          estado: normalizeLeadEstado(e.estado),
          correo: e.correo || "",
          resumen: e.resumen,
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
        const params = new URLSearchParams();
        if (isAdminLike && vendedorFiltro !== "Todos") params.append("vendedorEmail", vendedorFiltro);
        const resp = await fetch(`${API_URL}/meetings?${params.toString()}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (!resp.ok) return;
        const data = (await resp.json()) as Array<{
          id: number;
          title: string;
          start: string;
          end: string;
          estado?: LeadEventEstado;
          paciente?: string;
          telefono?: string;
        }>;
        const mapped = data.map((e) => ({
          id: e.id,
          title: e.title,
          start: new Date(e.start),
          end: new Date(e.end),
          estado: normalizeLeadEstado(e.estado),
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
  }, [user?.token, isAdminLike, vendedorFiltro]);

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
          <p className="text-sm uppercase tracking-wide text-[#4B6B8A] font-semibold">{t("Calendario y reuniones")}</p>
          <h2 className="text-3xl font-extrabold text-[#1A334B]">
            {t("Agenda de leads y clientes")}
          </h2>
          <p className="text-gray-600">
            {t("Visualiza citas, reuniones y entregas en un solo lugar para coordinar oportunidades.")}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F4F8FD] border border-[#D9E7F5] text-gray-600">
            <input
              type="text"
              placeholder={t("Buscar por cliente, titulo o telefono...")}
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
              <option key={op} value={op}>{t(op)}</option>
            ))}
          </select>
          {isAdminLike && (
            <select
              value={vendedorFiltro}
              onChange={(e) => setVendedorFiltro(e.target.value)}
              className="text-sm border border-[#D9E7F5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1A6CD3]"
            >
              <option value="Todos">{t("Todos los vendedores")}</option>
              {vendedoresDisponibles.map((v) => (
                <option key={v.email} value={v.email}>{t(v.label)}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {proximo && (
        <div className="mb-4 bg-amber-50 border border-amber-100 text-amber-800 px-4 py-3 rounded-lg text-sm flex items-center gap-3">
          <span className="font-semibold">{t("Proxima reunion")}:</span>
          <span>{proximo.title} - {proximo.start.toLocaleString("es-CL")}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {resumen.map(([estado, total]) => (
          <div
            key={estado}
            className="bg-white border border-[#D9E7F5] rounded-xl p-3 shadow-sm hover:shadow-md transition-all"
          >
            <p className="text-xs font-semibold text-gray-500">{t(estado)}</p>
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
          culture={lang}
          events={eventosFiltrados}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          popup
          views={["month", "week", "day"]}
          defaultView="month"
          messages={{
            month: t("Mes"),
            week: t("Semana"),
            day: t("Dia"),
            today: t("Hoy"),
            previous: t("Anterior"),
            next: t("Siguiente"),
            agenda: t("Agenda"),
            showMore: (total) => t("+{total} mas", { total }),
          }}
          eventPropGetter={(event) => {
            const ev = event as LeadEvent;
            const colors: Record<LeadEventEstadoLabel, string> = {
              Nuevo: "#e5e7eb",
              Cotizando: "#bfdbfe",
              "En Proceso": "#fde68a",
              Confirmado: "#bbf7d0",
              Entregado: "#c7d2fe",
            };
            const estadoLabel = normalizeLeadEstado(ev.estado);
            return {
              style: {
                backgroundColor: colors[estadoLabel],
                color: "#0f172a",
                borderRadius: 12,
                border: "1px solid #d9e7f5",
                textDecoration: estadoLabel === "Entregado" ? "line-through" : "none",
              },
            };
          }}
          onSelectEvent={(event) => setSelected(event as LeadEvent)}
        />
      </div>

      <section className="bg-white border border-gray-200 rounded-2xl shadow p-4">
        <h3 className="text-lg font-bold text-[#1A334B] mb-3">
          {t("Reuniones y actividades de leads")}
        </h3>
        {actividadesLeads.length === 0 ? (
          <p className="text-sm text-gray-600">{t("Sin reuniones nuevas o confirmadas para este filtro.")}</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {actividadesLeads.map((ev) => {
              const estadoLabel = normalizeLeadEstado(ev.estado);
              const vendedorLabel = formatVendorLabel(ev.ownerEmail);
              return (
                <div
                  key={ev.id}
                  className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded-lg cursor-pointer"
                  onClick={() => setSelected(ev)}
                >
                  <div>
                    <p className="font-semibold text-gray-800">{ev.title}</p>
                    <p className="text-xs text-gray-500">
                      {t("Cliente")}: {ev.paciente || t("Sin cliente")} - {t("Vendedor")}: {t(vendedorLabel)}
                      {ev.ownerEmail ? ` (${ev.ownerEmail})` : ""}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t("Recordatorio")}: {ev.start.toLocaleString("es-CL")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-semibold">
                      {t(estadoLabel)}
                    </span>
                    {estadoLabel === "Nuevo" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); actualizarEstado(ev.id, "Confirmado"); }}
                        className="text-[11px] px-2 py-1 rounded-full border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        {t("Confirmar")}
                      </button>
                    )}
                    {estadoLabel === "Confirmado" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); actualizarEstado(ev.id, "Entregado"); }}
                        className="text-[11px] px-2 py-1 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        {t("Completar")}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(ev);
                      }}
                      className="text-[11px] px-2 py-1 rounded-full border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD]"
                    >
                      {t("Modificar")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl shadow p-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-[#1A334B]">{t("Registro de cambios")}</h3>
          <button
            onClick={() => openEditModal()}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD]"
          >
            {t("Modificar reunion")}
          </button>
        </div>
        {registro.length === 0 ? (
          <p className="text-sm text-gray-600">{t("Sin acciones recientes sobre reuniones.")}</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {registro.map((r, idx) => (
              <div key={`${r.id}-${idx}`} className="py-2 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{r.title}</p>
                  <p className="text-xs text-gray-500">{t("Accion")}: {t(r.accion)}</p>
                  <p className="text-xs text-gray-500">{r.detalle}</p>
                  {r.usuario && <p className="text-xs text-gray-500">{t("Usuario")}: {r.usuario}</p>}
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
              <p><strong>{t("Paciente")}:</strong> {selected.paciente}</p>
              <p><strong>{t("Telefono")}:</strong> {selected.telefono}</p>
              {selected.correo && <p><strong>{t("Correo")}:</strong> {selected.correo}</p>}
              <p><strong>{t("Estado")}:</strong> {t(normalizeLeadEstado(selected.estado))}</p>
              <p><strong>{t("Vendedor")}:</strong> {t(formatVendorLabel(selected.ownerEmail))} {selected.ownerEmail ? `(${selected.ownerEmail})` : ""}</p>
              <p><strong>{t("Inicio")}:</strong> {selected.start.toLocaleString("es-CL")}</p>
              <p><strong>{t("Termino")}:</strong> {selected.end.toLocaleString("es-CL")}</p>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  actualizarEstado(selected?.id ?? "", "Confirmado");
                }}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition"
              >
                {t("Marcar confirmada")}
              </button>
              <button
                onClick={() => {
                  actualizarEstado(selected?.id ?? "", "Entregado");
                }}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
              >
                {t("Finalizar")}
              </button>
              <button
                onClick={() => selected.telefono && window.open(`https://wa.me/${selected.telefono.replace(/[^\\d]/g, "")}`)}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD] transition"
              >
                {t("WhatsApp")}
              </button>
              <button
                onClick={() => selected.correo && window.open(`mailto:${selected.correo}`)}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD] transition"
              >
                {t("Enviar correo")}
              </button>
              <button
                onClick={() => openEditModal(selected)}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD] transition"
              >
                {t("Modificar reunion")}
              </button>
            </div>

            <button
              onClick={() => setSelected(null)}
              className="mt-5 w-full bg-megagen-primary hover:bg-megagen-dark text-white py-2 rounded-lg font-semibold transition"
            >
              {t("Cerrar")}
            </button>
          </div>
        </Modal>
      )}

      {showEditModal && (
        <Modal onClose={() => setShowEditModal(false)}>
          <div className="p-5 space-y-4">
            <h3 className="text-xl font-bold text-[#1A334B]">{t("Modificar reunion")}</h3>
            {eventosEditables.length === 0 ? (
              <p className="text-sm text-gray-600">{t("No hay reuniones disponibles para editar.")}</p>
            ) : (
              <>
                <label className="flex flex-col gap-1 text-xs text-[#1A334B]">
                  <span className="font-semibold">{t("Seleccionar reunion")}</span>
                  <select
                    value={editTargetId}
                    onChange={(e) => {
                      const target = eventosEditables.find((ev) => String(ev.id) === e.target.value) || null;
                      selectEditTarget(target);
                    }}
                    className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
                  >
                    {eventosEditables.map((ev) => (
                      <option key={ev.id} value={String(ev.id)}>
                        {ev.title} - {ev.start.toLocaleString("es-CL")}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1 text-xs text-[#1A334B]">
                    <span className="font-semibold">{t("Titulo")}</span>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                      className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-[#1A334B]">
                    <span className="font-semibold">{t("Cliente")}</span>
                    <input
                      type="text"
                      value={editForm.paciente}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, paciente: e.target.value }))}
                      className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-[#1A334B]">
                    <span className="font-semibold">{t("Correo")}</span>
                    <input
                      type="email"
                      value={editForm.correo}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, correo: e.target.value }))}
                      className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-[#1A334B]">
                    <span className="font-semibold">{t("Telefono")}</span>
                    <input
                      type="text"
                      value={editForm.telefono}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, telefono: e.target.value }))}
                      className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-[#1A334B]">
                    <span className="font-semibold">{t("Inicio")}</span>
                    <input
                      type="datetime-local"
                      value={editForm.start}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, start: e.target.value }))}
                      className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-[#1A334B]">
                    <span className="font-semibold">{t("Termino")}</span>
                    <input
                      type="datetime-local"
                      value={editForm.end}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, end: e.target.value }))}
                      className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-[#1A334B]">
                    <span className="font-semibold">{t("Estado")}</span>
                    <select
                      value={editForm.estado}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, estado: e.target.value as LeadEventEstadoLabel }))}
                      className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
                    >
                      {["Nuevo", "Cotizando", "En Proceso", "Confirmado", "Entregado"].map((estado) => (
                        <option key={estado} value={estado}>{t(estado)}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {editTarget && (
                  <div className="text-xs text-gray-500">
                    {t("Vendedor")}: {t(formatVendorLabel(editTarget.ownerEmail))} {editTarget.ownerEmail ? `(${editTarget.ownerEmail})` : ""}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD]"
                  >
                    {t("Cancelar")}
                  </button>
                  <button
                    onClick={handleGuardarEdicion}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] text-white"
                  >
                    {t("Guardar cambios")}
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {alerta && (
        <Modal onClose={() => setAlerta(null)}>
          <div className="p-5 space-y-3">
            <h3 className="text-xl font-bold text-[#1A334B]">{t("Reunion en breve")}</h3>
            <p className="text-sm text-gray-700">{alerta.title}</p>
            <p className="text-sm text-gray-700"><strong>{t("Hora")}:</strong> {alerta.start.toLocaleString("es-CL")}</p>
            {alerta.paciente && <p className="text-sm text-gray-700"><strong>{t("Paciente")}:</strong> {alerta.paciente}</p>}
            {alerta.telefono && <p className="text-sm text-gray-700"><strong>{t("Telefono")}:</strong> {alerta.telefono}</p>}
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              {t("La reunion empieza en menos de 20 minutos.")}
            </p>
            <button
              onClick={() => setAlerta(null)}
              className="w-full bg-megagen-primary hover:bg-megagen-dark text-white py-2 rounded-lg font-semibold transition"
            >
              {t("Entendido")}
            </button>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}

