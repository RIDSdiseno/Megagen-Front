import MainLayout from "../components/MainLayout";
import Modal from "../components/Modal";
import { useMemo, useState } from "react";
import { Search, PhoneCall, Mail, UserCircle2, MessageSquare, CalendarClock } from "lucide-react";
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

export default function ClientsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<Cliente["estado"] | "Todos">("Todos");
  const [vendedorFiltro, setVendedorFiltro] = useState<number | "Todos">("Todos");
  const [vistaVendedor, setVistaVendedor] = useState<number | null>(null);
  const [agendaCliente, setAgendaCliente] = useState<Cliente | null>(null);
  const [agendaFecha, setAgendaFecha] = useState("");
  const [agendaNota, setAgendaNota] = useState("");
  const [agendaBusqueda, setAgendaBusqueda] = useState("");
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [buscadorVendedor, setBuscadorVendedor] = useState("");

  const isAdminLike = user?.roles?.some((r) => r === "admin" || r === "superadmin" || r === "supervisor") ?? false;
  const isVendedorSolo = (user?.roles?.includes("vendedor") ?? false) && !isAdminLike;

  const clientesBase = useMemo(
    () => {
      if (!isVendedorSolo) return clientesData;
      const vendor = findVendorByEmail(user?.email);
      return vendor ? clientesData.filter((c) => c.vendorId === vendor.id) : [];
    },
    [isVendedorSolo, user?.email]
  );

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

  const resumen = useMemo(() => {
    return {
      total: clientesBase.length,
      activos: clientesBase.filter((c) => c.estado === "Activo").length,
      onboarding: clientesBase.filter((c) => c.estado === "Onboarding").length,
      riesgo: clientesBase.filter((c) => c.estado === "En riesgo").length,
    };
  }, [clientesBase]);

  const filtrados = useMemo(() => {
    const term = search.toLowerCase();
    const vendedorObjetivo =
      vistaVendedor ?? (vendedorFiltro === "Todos" ? null : Number(vendedorFiltro));
    return clientesBase.filter((c) => {
      const matchTexto =
        c.nombre.toLowerCase().includes(term) ||
        c.correo.toLowerCase().includes(term) ||
        c.telefono.includes(term) ||
        vendorById[c.vendorId]?.nombre.toLowerCase().includes(term);
      const matchEstado = estadoFiltro === "Todos" ? true : c.estado === estadoFiltro;
      const matchVend = vendedorObjetivo ? c.vendorId === vendedorObjetivo : true;
      return matchTexto && matchEstado && matchVend;
    });
  }, [search, estadoFiltro, vendedorFiltro, clientesBase, vistaVendedor]);

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
      title: `Reunion con ${agendaCliente.nombre}`,
      detail: `Cliente de ${vendorById[agendaCliente.vendorId]?.nombre || "Sin asignar"}. ${agendaNota ? agendaNota + " - " : ""}${fechaLegible}`,
      time: fechaLegible,
    });
    setAgendaCliente(null);
    setAgendaFecha("");
    setAgendaNota("");
    setAgendaBusqueda("");
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <p className="text-sm uppercase tracking-wide text-[#4B6B8A] font-semibold">Clientes</p>
          <h2 className="text-3xl font-extrabold text-[#1A334B]">Cartera de clientes</h2>
          <p className="text-gray-600 text-sm">Clientes convertidos, asignacion de vendedor y seguimiento operacional.</p>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 inline-block mt-2">
            Roles activos: {(user?.roles || []).join(", ") || "Invitado"} - Cada vendedor gestiona su propia cartera y agenda.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const primero = filtrados[0];
              if (primero) {
                setAgendaCliente(primero);
                setAgendaFecha(new Date().toISOString().slice(0, 16));
                setAgendaBusqueda("");
              }
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            <CalendarClock size={16} />
            Agendar reunion
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Metric label="Total" value={resumen.total} color="from-[#1A6CD3] to-[#0E4B8F]" />
        <Metric label="Activos" value={resumen.activos} color="from-emerald-500 to-emerald-700" />
        <Metric label="Onboarding" value={resumen.onboarding} color="from-amber-500 to-amber-700" />
        <Metric label="En riesgo" value={resumen.riesgo} color="from-rose-500 to-rose-700" />
      </div>

      <div className="bg-white p-4 border border-gray-200 rounded-xl flex flex-col lg:flex-row gap-3 items-start lg:items-center mb-6 shadow-sm">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F4F8FD] border border-[#D9E7F5] text-gray-600 flex-1">
          <Search size={16} className="text-[#1A6CD3]" />
          <input
            type="text"
            placeholder="Buscar cliente, vendedor o correo..."
            className="flex-1 outline-none bg-transparent text-sm text-gray-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Filter
            value={estadoFiltro}
            onChange={setEstadoFiltro}
            label="Estado"
            opciones={["Todos", ...estados]}
          />
          <button
            onClick={() => setShowVendorModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] bg-white hover:bg-[#F4F8FD] shadow-sm"
          >
            Vendedor
            <span className="px-2 py-1 rounded-full text-[11px] bg-[#E6F0FB] text-[#1A6CD3]">
              {vendedorFiltro === "Todos" ? "Todos" : vendorById[vendedorFiltro]?.nombre || vendedorFiltro}
            </span>
          </button>
        </div>
      </div>

      {isAdminLike && (
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-wrap gap-2 items-center mb-4">
          <span className="text-sm font-semibold text-[#1A334B]">{t("selectVendor")}:</span>
          <button
            onClick={() => setShowVendorModal(true)}
            className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-[#1A334B] bg-white hover:bg-[#F4F8FD] shadow-sm"
          >
            {vendedorFiltro === "Todos" ? t("all") : vendorById[Number(vendedorFiltro)]?.nombre || vendedorFiltro}
          </button>
          {vistaVendedor && (
            <button
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD]"
              onClick={() => setVistaVendedor(null)}
            >
              Volver a vista general
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
                  <p className="text-xs text-gray-600">{v.total} clientes</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showVendorModal && (
        <Modal onClose={() => setShowVendorModal(false)}>
          <div className="p-5 space-y-3">
            <h3 className="text-xl font-bold text-[#1A334B]">Seleccionar vendedor</h3>
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
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
                Todos
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
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-[#F5FAFF] text-[#1A334B] text-left">
            <tr>
              <th className="py-3 px-4 text-sm">Vendedor</th>
              <th className="py-3 px-4 text-sm">Cliente</th>
              <th className="py-3 px-4 text-sm">Estado</th>
              <th className="py-3 px-4 text-sm">Origen</th>
              <th className="py-3 px-4 text-sm text-center">Contacto</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c) => (
              <tr key={c.id} className="border-t border-gray-200 hover:bg-gray-50 transition">
                <td className="py-3 px-4 text-sm text-gray-700 flex items-center gap-2">
                  <UserCircle2 size={16} className="text-[#1A6CD3]" /> {vendorById[c.vendorId]?.nombre || "Sin asignar"}
                  <p className="text-[11px] text-gray-500">{vendorById[c.vendorId]?.email}</p>
                </td>
                <td className="py-3 px-4">
                  <p className="font-semibold text-gray-800">{c.nombre}</p>
                  <p className="text-xs text-gray-500">{c.correo}</p>
                  <p className="text-xs text-gray-500">{c.telefono}</p>
                  <p className="text-[11px] text-gray-500 mt-1">{c.resumen}</p>
                </td>
                <td className="py-3 px-4">
                  <Estado estado={c.estado} />
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">{c.origen}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-2 justify-center">
                    <ActionBtn icon={<PhoneCall size={14} />} label="Llamar" onClick={() => window.open(`tel:${c.telefono}`)} />
                    <ActionBtn icon={<Mail size={14} />} label="Correo" onClick={() => window.open(`mailto:${c.correo}`)} />
                    <ActionBtn icon={<MessageSquare size={14} />} label="Mensaje" onClick={() => window.open(`https://wa.me/${c.telefono.replace(/[^\d]/g, "")}`)} />
                    <ActionBtn
                      icon={<CalendarClock size={14} />}
                      label="Agendar"
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

      {agendaCliente && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#1A334B]">Agendar reunion</h3>
              <button onClick={() => setAgendaCliente(null)} className="text-gray-500 hover:text-gray-700 text-sm">Cerrar</button>
            </div>

            <label className="flex flex-col gap-1 text-xs text-[#1A334B] mb-3">
              <span className="font-semibold">Buscar cliente</span>
              <input
                type="text"
                value={agendaBusqueda}
                onChange={(e) => setAgendaBusqueda(e.target.value)}
                placeholder="Nombre, correo o telefono..."
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
                <p className="px-3 py-2 text-xs text-gray-500">Sin coincidencias</p>
              )}
            </div>

            <p className="text-sm text-gray-700 mb-2">
              {agendaCliente.nombre} - {agendaCliente.correo} - {agendaCliente.telefono}
            </p>
            <div className="space-y-3">
              <label className="flex flex-col gap-1 text-xs text-[#1A334B]">
                <span className="font-semibold">Fecha y hora</span>
                <input
                  type="datetime-local"
                  value={agendaFecha}
                  onChange={(e) => setAgendaFecha(e.target.value)}
                  className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A6CD3] bg-white"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-[#1A334B]">
                <span className="font-semibold">Nota / objetivo</span>
                <textarea
                  value={agendaNota}
                  onChange={(e) => setAgendaNota(e.target.value)}
                  className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A6CD3] bg-white"
                />
              </label>
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                Se enviara alerta en el panel y se registrara en calendario.
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setAgendaCliente(null)}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD]"
              >
                Cancelar
              </button>
              <button
                onClick={guardarAgenda}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] text-white"
              >
                Guardar y avisar
              </button>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
}

function Metric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`p-4 rounded-xl text-white shadow-md bg-gradient-to-r ${color}`}>
      <p className="text-xs uppercase tracking-wide text-white/80 font-semibold">{label}</p>
      <p className="text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function Estado({ estado }: { estado: Cliente["estado"] }) {
  const styles: Record<Cliente["estado"], string> = {
    Activo: "bg-emerald-50 text-emerald-700",
    Onboarding: "bg-amber-50 text-amber-700",
    "En riesgo": "bg-rose-50 text-rose-700",
  };
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[estado]}`}>{estado}</span>;
}

function Filter({
  value,
  onChange,
  opciones,
  label,
}: {
  value: string | number;
  onChange: (v: any) => void;
  opciones: Array<string | number>;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-[#1A334B]">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-[#D9E7F5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1A6CD3]"
      >
        {opciones.map((op) => (
          <option key={op} value={op.toString()}>{op}</option>
        ))}
      </select>
    </label>
  );
}

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
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
