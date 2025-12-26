import MainLayout from "../components/MainLayout";
import Modal from "../components/Modal";
import { useEffect, useMemo, useState, type DragEvent, type ReactNode } from "react";
import { Search, PhoneCall, Mail, UserCircle2, MessageSquare, CalendarClock, Eye, GripVertical } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { pushNotification } from "../utils/notifications";
import { addEvent } from "../utils/events";
import { useI18n } from "../context/I18nContext";
import { vendorById, findVendorByEmail } from "../utils/vendors";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

type Cliente = {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  vendorId: number;
  estado: "Activo" | "Onboarding" | "En riesgo";
  origen: "Leads" | "Referido" | "Marketplace";
  resumen: string;
};

const clientesData: Cliente[] = [
  {
    id: 101,
    nombre: "Clinica Smile",
    correo: "contacto@smile.cl",
    telefono: "+56987654321",
    vendorId: 1,
    estado: "Activo",
    origen: "Leads",
    resumen: "Compra mensual de implantes premium y kits quirurgicos.",
  },
  {
    id: 102,
    nombre: "OdontoPlus SPA",
    correo: "contacto@odontoplus.cl",
    telefono: "+56961188899",
    vendorId: 2,
    estado: "Onboarding",
    origen: "Referido",
    resumen: "En rollout de protocolos y catalogos digitales.",
  },
  {
    id: 103,
    nombre: "Centro Andes",
    correo: "info@andes.cl",
    telefono: "+56223440011",
    vendorId: 3,
    estado: "En riesgo",
    origen: "Leads",
    resumen: "Esperando renovacion de contrato anual y stock critico.",
  },
  {
    id: 104,
    nombre: "SmileLab",
    correo: "hola@smilelab.cl",
    telefono: "+56990001122",
    vendorId: 2,
    estado: "Activo",
    origen: "Marketplace",
    resumen: "Laboratorio que compra por lote trimestral.",
  },
  {
    id: 105,
    nombre: "Clinica BioSalud",
    correo: "contacto@biosalud.cl",
    telefono: "+56975553344",
    vendorId: 4,
    estado: "Activo",
    origen: "Referido",
    resumen: "Cliente B2B con foco en reposicion rapida de insumos.",
  },
  {
    id: 106,
    nombre: "Dental Vision",
    correo: "hola@dentalvision.cl",
    telefono: "+56965554433",
    vendorId: 3,
    estado: "Onboarding",
    origen: "Leads",
    resumen: "Requiere capacitacion inicial y agenda de demos.",
  },
];

const estados: Cliente["estado"][] = ["Activo", "Onboarding", "En riesgo"];
const estadosOrdenados: Cliente["estado"][] = ["Onboarding", "Activo", "En riesgo"];
const estadoLabel: Record<Cliente["estado"], string> = {
  Activo: "Activo",
  Onboarding: "En proceso",
  "En riesgo": "En riesgo",
};
const estadoLabelResumen: Record<Cliente["estado"], string> = {
  Activo: "Activos",
  Onboarding: "En proceso",
  "En riesgo": "En riesgo",
};
const estadoBadge: Record<Cliente["estado"], string> = {
  Activo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Onboarding: "bg-sky-50 text-sky-700 border-sky-200",
  "En riesgo": "bg-rose-50 text-rose-700 border-rose-200",
};

const CLIENT_STATUS_KEY = "megagen_client_status";
const READY_COUNT_KEY = "megagen_ready_clients_count";

type EstadoLocal = Cliente["estado"];

const readStatusOverrides = (): Record<string, EstadoLocal> => {
  try {
    const raw = localStorage.getItem(CLIENT_STATUS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, EstadoLocal>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeStatusOverride = (email: string, estado: EstadoLocal) => {
  const current = readStatusOverrides();
  current[email] = estado;
  localStorage.setItem(CLIENT_STATUS_KEY, JSON.stringify(current));
};

const applyStatusOverrides = (data: Cliente[]) => {
  const overrides = readStatusOverrides();
  return data.map((cliente) => {
    const override = overrides[cliente.correo];
    return override ? { ...cliente, estado: override } : cliente;
  });
};

export default function ClientsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [clientes, setClientes] = useState<Cliente[]>(() => applyStatusOverrides(clientesData));
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<Cliente["estado"] | "Todos">("Todos");
  const [vendedorFiltro, setVendedorFiltro] = useState<number | "Todos">("Todos");
  const [vistaVendedor, setVistaVendedor] = useState<number | null>(null);
  const [detalleCliente, setDetalleCliente] = useState<Cliente | null>(null);
  const [confirmCambio, setConfirmCambio] = useState<{
    id: number;
    target: Cliente["estado"];
    nombre: string;
    correo: string;
  } | null>(null);
  const [agendaCliente, setAgendaCliente] = useState<Cliente | null>(null);
  const [agendaFecha, setAgendaFecha] = useState("");
  const [agendaNota, setAgendaNota] = useState("");
  const [agendaBusqueda, setAgendaBusqueda] = useState("");
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [buscadorVendedor, setBuscadorVendedor] = useState("");
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [draggingEstado, setDraggingEstado] = useState<Cliente["estado"] | null>(null);

  const isAdminLike = user?.roles?.some((r) => r === "admin" || r === "superadmin" || r === "supervisor") ?? false;
  const isVendedorSolo = (user?.roles?.includes("vendedor") ?? false) && !isAdminLike;

  const clientesBase = useMemo(
    () => {
      if (!isVendedorSolo) return clientes;
      const vendor = findVendorByEmail(user?.email);
      return vendor ? clientes.filter((c) => c.vendorId === vendor.id) : [];
    },
    [isVendedorSolo, user?.email, clientes]
  );

  useEffect(() => {
    const count = clientesBase.filter((c) => c.estado === "Activo").length;
    localStorage.setItem(READY_COUNT_KEY, String(count));
    window.dispatchEvent(new Event("storage"));
  }, [clientesBase]);

  const vendedores = useMemo(() => Array.from(new Set(clientesBase.map((c) => c.vendorId))), [clientesBase]);

  const resumenPorVendedor = useMemo(
    () =>
      vendedores.map((vId) => ({
        vendorId: vId,
        total: clientesBase.filter((c) => c.vendorId === vId).length,
        vendor: vendorById[vId],
      })),
    [vendedores, clientesBase]
  );

  const clientesFiltradosBase = useMemo(() => {
    const term = search.toLowerCase();
    const vendedorObjetivo =
      vistaVendedor ?? (vendedorFiltro === "Todos" ? null : Number(vendedorFiltro));
    return clientesBase.filter((c) => {
      const vendorNombre = vendorById[c.vendorId]?.nombre || "";
      const matchTexto =
        c.nombre.toLowerCase().includes(term) ||
        c.correo.toLowerCase().includes(term) ||
        c.telefono.includes(term) ||
        vendorNombre.toLowerCase().includes(term);
      const matchVend = vendedorObjetivo ? c.vendorId === vendedorObjetivo : true;
      return matchTexto && matchVend;
    });
  }, [search, vendedorFiltro, clientesBase, vistaVendedor]);

  const filtrados = useMemo(() => {
    return clientesFiltradosBase.filter((c) => {
      const matchEstado = estadoFiltro === "Todos" ? true : c.estado === estadoFiltro;
      return matchEstado;
    });
  }, [clientesFiltradosBase, estadoFiltro]);

  const resumen = useMemo(() => {
    return {
      total: filtrados.length,
      activos: filtrados.filter((c) => c.estado === "Activo").length,
      onboarding: filtrados.filter((c) => c.estado === "Onboarding").length,
      riesgo: filtrados.filter((c) => c.estado === "En riesgo").length,
    };
  }, [filtrados]);

  const filtradosOrdenados = useMemo(() => {
    const order = new Map(estadosOrdenados.map((estado, index) => [estado, index]));
    return [...filtrados].sort((a, b) => {
      const diff = (order.get(a.estado) ?? 99) - (order.get(b.estado) ?? 99);
      if (diff !== 0) return diff;
      return a.nombre.localeCompare(b.nombre);
    });
  }, [filtrados]);

  const tablero = useMemo(() => {
    const ordenar = (items: Cliente[]) => [...items].sort((a, b) => a.nombre.localeCompare(b.nombre));
    return {
      Onboarding: ordenar(filtrados.filter((c) => c.estado === "Onboarding")),
      Activo: ordenar(filtrados.filter((c) => c.estado === "Activo")),
      "En riesgo": ordenar(filtrados.filter((c) => c.estado === "En riesgo")),
    };
  }, [filtrados]);

  const candidatosAgenda = useMemo(() => {
    const term = agendaBusqueda.toLowerCase();
    if (!term) return clientesBase;
    return clientesBase.filter(
      (c) =>
        c.nombre.toLowerCase().includes(term) ||
        c.correo.toLowerCase().includes(term) ||
        c.telefono.includes(term)
    );
  }, [agendaBusqueda, clientesBase]);

  const guardarAgenda = () => {
    if (!agendaCliente || !agendaFecha) return;
    const start = new Date(agendaFecha);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const fechaLegible = start.toLocaleString("es-CL");

    addEvent({
      title: `Reunion - ${agendaCliente.nombre}`,
      start: start.toISOString(),
      end: end.toISOString(),
      paciente: agendaCliente.nombre,
      telefono: agendaCliente.telefono,
      correo: agendaCliente.correo,
      estado: "Confirmado",
      ownerEmail: vendorById[agendaCliente.vendorId]?.email || user?.email,
    });

    (async () => {
      try {
        await fetch(`${API_URL}/meetings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
          },
          body: JSON.stringify({
            title: `Reunion - ${agendaCliente.nombre}`,
            start: start.toISOString(),
            end: end.toISOString(),
            clienteNombre: agendaCliente.nombre,
            clienteCorreo: agendaCliente.correo,
            clienteTelefono: agendaCliente.telefono,
            estado: "Confirmado",
          }),
        });
      } catch {
        /* ignore */
      }
    })();

    pushNotification({
      title: t("Reunion con {cliente}", { cliente: agendaCliente.nombre }),
      detail: `${t("Cliente de {vendedor}.", {
        vendedor: vendorById[agendaCliente.vendorId]?.nombre || t("Sin asignar"),
      })} ${agendaNota ? `${agendaNota} - ` : ""}${fechaLegible}`,
      time: fechaLegible,
    });
    setAgendaCliente(null);
    setAgendaFecha("");
    setAgendaNota("");
    setAgendaBusqueda("");
  };

  const aplicarCambioEstado = (id: number, estado: Cliente["estado"], correo?: string) => {
    setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, estado } : c)));
    const email = correo ?? clientes.find((c) => c.id === id)?.correo;
    if (email) writeStatusOverride(email, estado);
  };

  const puedeMover = (from: Cliente["estado"], to: Cliente["estado"]) => {
    if (from === to) return false;
    const allowed = new Set<Cliente["estado"]>(["Onboarding", "Activo"]);
    return allowed.has(from) && allowed.has(to);
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>, cliente: Cliente) => {
    event.dataTransfer.setData("text/plain", String(cliente.id));
    event.dataTransfer.effectAllowed = "move";
    setDraggingId(cliente.id);
    setDraggingEstado(cliente.estado);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDraggingEstado(null);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>, target: Cliente["estado"]) => {
    if (draggingEstado && puedeMover(draggingEstado, target)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, target: Cliente["estado"]) => {
    event.preventDefault();
    const rawId = event.dataTransfer.getData("text/plain");
    const id = Number(rawId);
    if (Number.isNaN(id)) return;
    const actual = clientes.find((c) => c.id === id);
    if (!actual || !puedeMover(actual.estado, target)) return;
    if (actual.estado === "Onboarding" && target === "Activo") {
      setConfirmCambio({
        id: actual.id,
        target,
        nombre: actual.nombre,
        correo: actual.correo,
      });
      setDraggingId(null);
      setDraggingEstado(null);
      return;
    }
    aplicarCambioEstado(id, target, actual.correo);
    setDraggingId(null);
    setDraggingEstado(null);
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <p className="text-sm uppercase tracking-wide text-[#4B6B8A] font-semibold">{t("Clientes")}</p>
          <h2 className="text-3xl font-extrabold text-[#1A334B]">{t("Cartera de clientes")}</h2>
          <p className="text-gray-600 text-sm">{t("Clientes convertidos, asignacion de vendedor y seguimiento operacional.")}</p>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 inline-block mt-2">
            {t("Roles activos")}: {(user?.roles || []).join(", ") || t("Invitado")} - {t("Cada vendedor gestiona su propia cartera y agenda.")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEstadoFiltro("Activo");
              setVendedorFiltro("Todos");
              setVistaVendedor(null);
            }}
            className="flex items-center gap-2 border border-[#D9E7F5] text-[#1A334B] font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all bg-white"
          >
            {t("Listos (Activos)")}
          </button>
          <button
            onClick={() => {
              const primero = filtradosOrdenados[0];
              if (primero) {
                setAgendaCliente(primero);
                setAgendaFecha(new Date().toISOString().slice(0, 16));
                setAgendaBusqueda("");
              }
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            <CalendarClock size={16} />
            {t("Agendar reunion")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-4 mb-6">
        <aside className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
          <p className="text-xs uppercase tracking-wide text-[#4B6B8A] font-semibold">{t("Resumen de cartera")}</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-[#E6EDF7] px-3 py-2">
              <span className="text-xs text-gray-600">{t("Clientes en vista")}</span>
              <span className="text-sm font-bold text-[#1A334B]">{resumen.total}</span>
            </div>
            <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${estadoBadge.Onboarding}`}>
              <span className="text-xs font-semibold">{t(estadoLabelResumen.Onboarding)}</span>
              <span className="text-sm font-bold">{resumen.onboarding}</span>
            </div>
            <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${estadoBadge.Activo}`}>
              <span className="text-xs font-semibold">{t(estadoLabelResumen.Activo)}</span>
              <span className="text-sm font-bold">{resumen.activos}</span>
            </div>
            <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${estadoBadge["En riesgo"]}`}>
              <span className="text-xs font-semibold">{t(estadoLabelResumen["En riesgo"])}</span>
              <span className="text-sm font-bold">{resumen.riesgo}</span>
            </div>
          </div>
        </aside>

        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#1A334B]">{t("Proceso de clientes")}</h3>
              <p className="text-xs text-gray-500">{t("Arrastra entre En proceso y Activos para actualizar el estado.")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowVendorModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] bg-white hover:bg-[#F4F8FD] shadow-sm"
              >
                {t("Vendedor")}
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#E6F0FB] text-[#1A6CD3]">
                  {vendedorFiltro === "Todos" ? t("Todos") : vendorById[Number(vendedorFiltro)]?.nombre || vendedorFiltro}
                </span>
              </button>
              <span className="text-xs text-gray-500">
                {t("Total en vista")}: {filtrados.length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-4">
            {estadosOrdenados.map((estado) => {
              const items = tablero[estado];
              const puedeSoltar = draggingEstado ? puedeMover(draggingEstado, estado) : false;
              return (
                <div
                  key={estado}
                  onDragOver={(event) => handleDragOver(event, estado)}
                  onDrop={(event) => handleDrop(event, estado)}
                  className={`rounded-2xl border p-3 min-h-[260px] transition ${
                    puedeSoltar ? "border-[#1A6CD3] ring-2 ring-[#1A6CD3]/20 bg-[#F5FAFF]" : "border-[#E6EDF7] bg-[#F9FBFF]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-1 rounded-full text-[11px] font-semibold border ${estadoBadge[estado]}`}>
                      {t(estadoLabelResumen[estado])}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {t("{total} clientes", { total: items.length })}
                    </span>
                  </div>

                  {items.length === 0 ? (
                    <div className="text-center text-xs text-gray-400 py-10">
                      {t("Sin clientes en esta etapa.")}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {items.map((cliente) => {
                        const draggable = cliente.estado !== "En riesgo";
                        return (
                          <div
                            key={cliente.id}
                            draggable={draggable}
                            onDragStart={(event) => handleDragStart(event, cliente)}
                            onDragEnd={handleDragEnd}
                            className={`bg-white border border-[#E6EDF7] rounded-xl p-3 shadow-sm ${
                              draggable ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                            } ${draggingId === cliente.id ? "opacity-70" : ""}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-bold text-[#1A334B]">{cliente.nombre}</p>
                                <p className="text-[11px] text-gray-500">
                                  {t(cliente.origen)} - {vendorById[cliente.vendorId]?.nombre || t("Sin asignar")}
                                </p>
                              </div>
                              {draggable && <GripVertical size={16} className="text-gray-400" />}
                            </div>
                            <p className="text-[11px] text-gray-600 mt-2">{cliente.resumen}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                onClick={() => setDetalleCliente(cliente)}
                                className="px-2 py-1 text-[11px] font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD]"
                              >
                                {t("Revisar")}
                              </button>
                              <button
                                onClick={() => {
                                  setAgendaCliente(cliente);
                                  setAgendaFecha(new Date().toISOString().slice(0, 16));
                                  setAgendaBusqueda(cliente.nombre);
                                }}
                                className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-[#1A6CD3] text-white hover:bg-[#0E4B8F]"
                              >
                                {t("Agendar")}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mb-2">
        <h3 className="text-lg font-bold text-[#1A334B]">{t("Listado detallado")}</h3>
        <p className="text-xs text-gray-500">{t("Filtros aplican a resumen, tablero y tabla.")}</p>
      </div>

      <div className="bg-white p-4 border border-gray-200 rounded-xl flex flex-col lg:flex-row gap-3 items-start lg:items-center mb-6 shadow-sm">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F4F8FD] border border-[#D9E7F5] text-gray-600 flex-1">
          <Search size={16} className="text-[#1A6CD3]" />
          <input
            type="text"
            placeholder={t("Buscar cliente, vendedor o correo...")}
            className="flex-1 outline-none bg-transparent text-sm text-gray-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Filter
            value={estadoFiltro}
            onChange={setEstadoFiltro}
            label={t("Estado")}
            opciones={["Todos", ...estados]}
            labels={estadoLabel}
            t={t}
          />
          <button
            onClick={() => setShowVendorModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] bg-white hover:bg-[#F4F8FD] shadow-sm"
          >
            {t("Vendedor")}
            <span className="px-2 py-1 rounded-full text-[11px] bg-[#E6F0FB] text-[#1A6CD3]">
              {vendedorFiltro === "Todos" ? t("Todos") : vendorById[vendedorFiltro]?.nombre || vendedorFiltro}
            </span>
          </button>
          {(estadoFiltro !== "Todos" || vendedorFiltro !== "Todos" || search) && (
            <button
              onClick={() => {
                setEstadoFiltro("Todos");
                setVendedorFiltro("Todos");
                setVistaVendedor(null);
                setSearch("");
              }}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD]"
            >
              {t("Limpiar filtros")}
            </button>
          )}
        </div>
      </div>

      {isAdminLike && (
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-wrap gap-2 items-center mb-4">
          <span className="text-sm font-semibold text-[#1A334B]">{t("Seleccionar vendedor")}:</span>
          <button
            onClick={() => setShowVendorModal(true)}
            className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-[#1A334B] bg-white hover:bg-[#F4F8FD] shadow-sm"
          >
            {vendedorFiltro === "Todos" ? t("Todos") : vendorById[Number(vendedorFiltro)]?.nombre || vendedorFiltro}
          </button>
          {vistaVendedor && (
            <button
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD]"
              onClick={() => setVistaVendedor(null)}
            >
              {t("Volver a vista general")}
            </button>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
            {resumenPorVendedor.map((v) => {
              const active = vistaVendedor === v.vendorId;
              return (
                <button
                  key={v.vendorId}
                  onClick={() => setVistaVendedor(active ? null : v.vendorId)}
                  className={`text-left px-3 py-2 rounded-lg border text-sm shadow-sm ${
                    active
                      ? "border-[#1A6CD3] bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] text-white"
                      : "border-[#D9E7F5] bg-white text-[#1A334B] hover:bg-[#F4F8FD]"
                  }`}
                >
                  <p className="font-semibold">{v.vendor?.nombre || v.vendor?.email}</p>
                  <p className="text-xs text-gray-600">{t("{total} clientes", { total: v.total })}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showVendorModal && (
        <Modal onClose={() => setShowVendorModal(false)}>
          <div className="p-5 space-y-3">
            <h3 className="text-xl font-bold text-[#1A334B]">{t("Seleccionar vendedor")}</h3>
            <input
              type="text"
              placeholder={t("Buscar por nombre o email...")}
              value={buscadorVendedor}
              onChange={(e) => setBuscadorVendedor(e.target.value)}
              className="w-full border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A6CD3]"
            />
            <div className="max-h-64 overflow-auto divide-y divide-gray-100">
              <button
                className={`w-full text-left px-3 py-2 text-sm ${
                  vendedorFiltro === "Todos" ? "bg-[#E6F0FB] text-[#1A6CD3]" : "hover:bg-[#F4F8FD] text-gray-700"
                }`}
                onClick={() => {
                  setVendedorFiltro("Todos");
                  setShowVendorModal(false);
                }}
              >
                {t("Todos")}
              </button>
              {vendedores
                .map((v) => vendorById[v])
                .filter(Boolean)
                .filter((v) => {
                  const term = buscadorVendedor.toLowerCase();
                  return (v?.nombre || "").toLowerCase().includes(term) || (v?.email || "").toLowerCase().includes(term);
                })
                .map((v) => (
                  <button
                    key={v?.id}
                    className={`w-full text-left px-3 py-2 text-sm ${
                      vendedorFiltro === v?.id ? "bg-[#E6F0FB] text-[#1A6CD3]" : "hover:bg-[#F4F8FD] text-gray-700"
                    }`}
                    onClick={() => {
                      if (!v) return;
                      setVendedorFiltro(v.id);
                      setShowVendorModal(false);
                    }}
                  >
                    <p className="font-semibold">{v?.nombre}</p>
                    <p className="text-xs text-gray-500">{v?.email}</p>
                  </button>
                ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowVendorModal(false)}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD]"
              >
                {t("Cerrar")}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-[#F5FAFF] text-[#1A334B] text-left">
            <tr>
              <th className="py-3 px-4 text-sm">{t("Vendedor")}</th>
              <th className="py-3 px-4 text-sm">{t("Cliente")}</th>
              <th className="py-3 px-4 text-sm">{t("Estado")}</th>
              <th className="py-3 px-4 text-sm">{t("Origen")}</th>
              <th className="py-3 px-4 text-sm text-center">{t("Contacto")}</th>
            </tr>
          </thead>
          <tbody>
            {filtradosOrdenados.map((c) => (
              <tr key={c.id} className="border-t border-gray-200 hover:bg-gray-50 transition">
                <td className="py-3 px-4 text-sm text-gray-700 flex items-center gap-2">
                  <UserCircle2 size={16} className="text-[#1A6CD3]" /> {vendorById[c.vendorId]?.nombre || t("Sin asignar")}
                  <p className="text-[11px] text-gray-500">{vendorById[c.vendorId]?.email}</p>
                </td>
                <td className="py-3 px-4">
                  <p className="font-semibold text-gray-800">{c.nombre}</p>
                  <p className="text-xs text-gray-500">{c.correo}</p>
                  <p className="text-xs text-gray-500">{c.telefono}</p>
                  <p className="text-[11px] text-gray-500 mt-1">{c.resumen}</p>
                </td>
                <td className="py-3 px-4">
                  <Estado estado={c.estado} t={t} />
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">{t(c.origen)}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-2 justify-center">
                    <ActionBtn icon={<Eye size={14} />} label={t("Revisar")} onClick={() => setDetalleCliente(c)} />
                    <ActionBtn icon={<PhoneCall size={14} />} label={t("Llamar")} onClick={() => window.open(`tel:${c.telefono}`)} />
                    <ActionBtn icon={<Mail size={14} />} label={t("Correo")} onClick={() => window.open(`mailto:${c.correo}`)} />
                    <ActionBtn icon={<MessageSquare size={14} />} label={t("Mensaje")} onClick={() => window.open(`https://wa.me/${c.telefono.replace(/[^\d]/g, "")}`)} />
                    <ActionBtn
                      icon={<CalendarClock size={14} />}
                      label={t("Agendar")}
                      onClick={() => {
                        setAgendaCliente(c);
                        setAgendaFecha(new Date().toISOString().slice(0, 16));
                        setAgendaBusqueda(c.nombre);
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detalleCliente && (
        <Modal onClose={() => setDetalleCliente(null)}>
          <div className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#4B6B8A] font-semibold">{t("Cliente")}</p>
                <h3 className="text-xl font-bold text-[#1A334B]">{detalleCliente.nombre}</h3>
                <p className="text-xs text-gray-500">{detalleCliente.correo}</p>
                <p className="text-xs text-gray-500">{detalleCliente.telefono}</p>
              </div>
              <Estado estado={detalleCliente.estado} t={t} />
            </div>

            <div className="text-sm text-gray-700 bg-[#F7FAFF] border border-[#D9E7F5] rounded-xl p-3">
              <p className="font-semibold text-[#1A334B]">{t("Resumen")}</p>
              <p className="text-gray-600">{detalleCliente.resumen}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
              <div className="border border-[#E6EDF7] rounded-lg px-3 py-2">
                <p className="text-[11px] text-gray-500">{t("Origen")}</p>
                <p className="font-semibold text-[#1A334B]">{t(detalleCliente.origen)}</p>
              </div>
              <div className="border border-[#E6EDF7] rounded-lg px-3 py-2">
                <p className="text-[11px] text-gray-500">{t("Vendedor")}</p>
                <p className="font-semibold text-[#1A334B]">
                  {vendorById[detalleCliente.vendorId]?.nombre || t("Sin asignar")}
                </p>
                <p className="text-[11px] text-gray-500">
                  {vendorById[detalleCliente.vendorId]?.email || ""}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <ActionBtn icon={<PhoneCall size={14} />} label={t("Llamar")} onClick={() => window.open(`tel:${detalleCliente.telefono}`)} />
              <ActionBtn icon={<Mail size={14} />} label={t("Correo")} onClick={() => window.open(`mailto:${detalleCliente.correo}`)} />
              <ActionBtn icon={<MessageSquare size={14} />} label={t("Mensaje")} onClick={() => window.open(`https://wa.me/${detalleCliente.telefono.replace(/[^\d]/g, "")}`)} />
              <ActionBtn
                icon={<CalendarClock size={14} />}
                label={t("Agendar")}
                onClick={() => {
                  setAgendaCliente(detalleCliente);
                  setAgendaFecha(new Date().toISOString().slice(0, 16));
                  setAgendaBusqueda(detalleCliente.nombre);
                  setDetalleCliente(null);
                }}
              />
            </div>

            <button
              onClick={() => setDetalleCliente(null)}
              className="w-full bg-[#1A334B] text-white py-2 rounded-lg font-semibold hover:bg-[#0f2237] transition"
            >
              {t("Cerrar")}
            </button>
          </div>
        </Modal>
      )}

      {confirmCambio && (
        <Modal onClose={() => setConfirmCambio(null)}>
          <div className="p-5 space-y-3">
            <h3 className="text-xl font-bold text-[#1A334B]">{t("Confirmar cambio")}</h3>
            <p className="text-sm text-gray-700">
              {t("Vas a mover a")} <strong>{confirmCambio.nombre}</strong> {t("a estado Activo. Esto lo deja en Clientes listos.")}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  aplicarCambioEstado(confirmCambio.id, confirmCambio.target, confirmCambio.correo);
                  setConfirmCambio(null);
                }}
                className="flex-1 bg-[#1A6CD3] text-white py-2 rounded-lg font-semibold hover:bg-[#0E4B8F] transition"
              >
                {t("Confirmar")}
              </button>
              <button
                onClick={() => setConfirmCambio(null)}
                className="flex-1 border border-[#D9E7F5] text-[#1A334B] py-2 rounded-lg font-semibold hover:bg-[#F4F8FD] transition"
              >
                {t("Cancelar")}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {agendaCliente && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#1A334B]">{t("Agendar reunion")}</h3>
              <button onClick={() => setAgendaCliente(null)} className="text-gray-500 hover:text-gray-700 text-sm">{t("Cerrar")}</button>
            </div>

            <label className="flex flex-col gap-1 text-xs text-[#1A334B] mb-3">
              <span className="font-semibold">{t("Buscar cliente")}</span>
              <input
                type="text"
                value={agendaBusqueda}
                onChange={(e) => setAgendaBusqueda(e.target.value)}
                placeholder={t("Nombre, correo o telefono...")}
                className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A6CD3] bg-white"
              />
            </label>

            <div className="max-h-40 overflow-auto border border-[#E6EDF7] rounded-lg mb-3">
              {candidatosAgenda.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setAgendaCliente(c)}
                  className={`w-full text-left px-3 py-2 text-sm border-b last:border-b-0 ${
                    agendaCliente && agendaCliente.id === c.id ? "bg-[#E6F0FB] text-[#1A334B] font-semibold" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between">
                    <span>{c.nombre}</span>
                    <span className="text-xs text-gray-500">{c.telefono}</span>
                  </div>
                  <p className="text-xs text-gray-500">{c.correo}</p>
                </button>
              ))}
              {candidatosAgenda.length === 0 && (
                <p className="px-3 py-2 text-xs text-gray-500">{t("Sin coincidencias")}</p>
              )}
            </div>

            <p className="text-sm text-gray-700 mb-2">
              {agendaCliente.nombre} - {agendaCliente.correo} - {agendaCliente.telefono}
            </p>
            <div className="space-y-3">
              <label className="flex flex-col gap-1 text-xs text-[#1A334B]">
                <span className="font-semibold">{t("Fecha y hora")}</span>
                <input
                  type="datetime-local"
                  value={agendaFecha}
                  onChange={(e) => setAgendaFecha(e.target.value)}
                  className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A6CD3] bg-white"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-[#1A334B]">
                <span className="font-semibold">{t("Nota / objetivo")}</span>
                <textarea
                  value={agendaNota}
                  onChange={(e) => setAgendaNota(e.target.value)}
                  className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A6CD3] bg-white"
                />
              </label>
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                {t("Se enviara alerta en el panel y se registrara en calendario.")}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setAgendaCliente(null)}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD]"
              >
                {t("Cancelar")}
              </button>
              <button
                onClick={guardarAgenda}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] text-white"
              >
                {t("Guardar y avisar")}
              </button>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
}

function Estado({ estado, t }: { estado: Cliente["estado"]; t: (key: string) => string }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${estadoBadge[estado]}`}>
      {t(estadoLabel[estado])}
    </span>
  );
}

function Filter({
  value,
  onChange,
  opciones,
  label,
  labels,
  t,
}: {
  value: string | number;
  onChange: (v: any) => void;
  opciones: Array<string | number>;
  label: string;
  labels?: Record<string, string>;
  t: (key: string) => string;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-[#1A334B]">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-[#D9E7F5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1A6CD3]"
      >
        {opciones.map((op) => {
          const key = op.toString();
          return (
            <option key={key} value={key}>
              {t(labels?.[key] ?? String(op))}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function ActionBtn({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all hover:-translate-y-0.5 shadow-sm bg-[#E6F0FB] text-[#1A334B]"
    >
      {icon}
      {label}
    </button>
  );
}
