import MainLayout from "../components/MainLayout";
import Modal from "../components/Modal";
import { useMemo, useState } from "react";
import { Search, UserPlus, PhoneCall, MessageSquare, Mail, Globe2, Eye, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { pushNotification } from "../utils/notifications";
import { addEvent } from "../utils/events";
import { useI18n } from "../context/I18nContext";
import { vendorById, findVendorByEmail } from "../utils/vendors";

type Lead = {
  id: number;
  nombre: string;
  telefono: string;
  correo: string;
  estado: "Nuevo" | "Cotizando" | "En Proceso" | "Confirmado";
  fechaIngreso: string;
  proximoPaso: string;
  origen: "WhatsApp" | "Llamada" | "Correo" | "Instagram" | "Web";
  nota?: string;
  resumen?: string;
  vendorId: number;
};

const estadoOrden: Lead["estado"][] = ["Nuevo", "Cotizando", "En Proceso", "Confirmado"];
const origenes: Lead["origen"][] = ["WhatsApp", "Llamada", "Correo", "Instagram", "Web"];

const leadsData: Lead[] = [
  {
    id: 1,
    nombre: "Juan Perez",
    telefono: "+56988881234",
    correo: "juan.perez@email.com",
    estado: "Nuevo",
    fechaIngreso: "2025-12-01",
    proximoPaso: "Enviar mensaje de bienvenida y coordinar llamada inicial.",
    origen: "WhatsApp",
    nota: "Pidio info de implantes premium",
    vendorId: 1,
  },
  {
    id: 2,
    nombre: "Maria Lopez",
    telefono: "+56998765432",
    correo: "maria.lopez@email.com",
    estado: "Cotizando",
    fechaIngreso: "2025-12-02",
    proximoPaso: "Compartir cotizacion actualizada con descuentos.",
    origen: "Correo",
    nota: "Solicita descuentos por volumen",
    vendorId: 1,
  },
  {
    id: 3,
    nombre: "Andres Gonzalez",
    telefono: "+56977665544",
    correo: "andres.gonzalez@email.com",
    estado: "En Proceso",
    fechaIngreso: "2025-12-03",
    proximoPaso: "Confirmar fecha de reunion con especialista.",
    origen: "Instagram",
    nota: "Vio campa-a de guias quirurgicas",
    vendorId: 2,
  },
  {
    id: 4,
    nombre: "Ana Martinez",
    telefono: "+56965443322",
    correo: "ana.martinez@email.com",
    estado: "Confirmado",
    fechaIngreso: "2025-12-03",
    proximoPaso: "Enviar resumen y documentacion previa a la cita.",
    origen: "Llamada",
    nota: "Quiere agendar instalacion in situ",
    vendorId: 2,
  },
];

export default function Leads() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<Lead["estado"] | "Todos">("Todos");
  const [origenFiltro, setOrigenFiltro] = useState<Lead["origen"] | "Todos">("Todos");
  const [vendedorFiltro, setVendedorFiltro] = useState<string | "Todos">("Todos");
  const [vistaVendedor, setVistaVendedor] = useState<string | null>(null);
  const [vista, setVista] = useState<"cards" | "tabla">("cards");
  const [leads, setLeads] = useState<Lead[]>(leadsData);
  const [showForm, setShowForm] = useState(false);
  const [detalle, setDetalle] = useState<Lead | null>(null);
  const [agendaLead, setAgendaLead] = useState<Lead | null>(null);
  const [agendaFecha, setAgendaFecha] = useState("");
  const [agendaCanal, setAgendaCanal] = useState<"WhatsApp" | "Correo" | "Llamada">("WhatsApp");
  const [agendaNota, setAgendaNota] = useState("");
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [buscadorVendedor, setBuscadorVendedor] = useState("");
  const [nuevo, setNuevo] = useState<Omit<Lead, "id">>({
    nombre: "",
    telefono: "",
    correo: "",
    estado: "Nuevo",
    fechaIngreso: new Date().toISOString().slice(0, 10),
    proximoPaso: "",
    origen: "WhatsApp",
    nota: "",
    vendorId: findVendorByEmail(user?.email)?.id ?? 1,
  });

  const isAdminLike = user?.roles?.some((r) => r === "admin" || r === "superadmin" || r === "supervisor") ?? false;
  const isVendedorSolo = (user?.roles?.includes("vendedor") ?? false) && !isAdminLike;

  const leadsVisibles = useMemo(() => {
    if (!isVendedorSolo) return leads;
    const vendor = findVendorByEmail(user?.email);
    return vendor ? leads.filter((l) => l.vendorId === vendor.id) : [];
  }, [isVendedorSolo, leads, user?.email]);

  const resumen = useMemo(
    () => estadoOrden.map(estado => ({
      estado,
      total: leadsVisibles.filter(l => l.estado === estado).length
    })),
    [leadsVisibles]
  );

  const vendedores = useMemo(
    () => Array.from(new Set(leadsVisibles.map((l) => l.vendorId))).filter(Boolean),
    [leadsVisibles]
  );

  const resumenPorVendedor = useMemo(
    () =>
      vendedores.map((vendorId) => ({
        vendorId,
        vendor: vendorById[vendorId],
        total: leadsVisibles.filter((l) => l.vendorId === vendorId).length,
      })),
    [vendedores, leadsVisibles]
  );

  const filtered = useMemo(() => {
    const vendedorObjetivo =
      vistaVendedor ?? (vendedorFiltro === "Todos" ? null : (vendedorFiltro as string));
    return leadsVisibles.filter(l => {
      const term = search.toLowerCase();
      const matchTexto =
        l.nombre.toLowerCase().includes(term) ||
        l.telefono.includes(term) ||
        l.correo.toLowerCase().includes(term);
      const matchEstado = estadoFiltro === "Todos" ? true : l.estado === estadoFiltro;
      const matchOrigen = origenFiltro === "Todos" ? true : l.origen === origenFiltro;
      const vendor = vendorById[l.vendorId];
      const matchVend = vendedorObjetivo
        ? vendor?.email === vendedorObjetivo || l.vendorId === Number(vendedorObjetivo)
        : true;
      return matchTexto && matchEstado && matchOrigen && matchVend;
    });
  }, [search, estadoFiltro, origenFiltro, leadsVisibles, vendedorFiltro, vistaVendedor]);

  const resumenOrigen = useMemo(() => {
    return origenes.map((origen) => ({
      origen,
      total: leadsVisibles.filter((l) => l.origen === origen).length,
    }));
  }, [leadsVisibles]);

  const vendedoresLista = useMemo(() => vendedores.map((id) => vendorById[id]).filter(Boolean), [vendedores]);

  const crearRecordatorio = () => {
    if (!agendaLead || !agendaFecha) return;
    const fechaLegible = new Date(agendaFecha).toLocaleString("es-CL");
    const start = new Date(agendaFecha);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    addEvent({
      title: `Reunion - ${agendaLead.nombre}`,
      start: start.toISOString(),
      end: end.toISOString(),
      paciente: agendaLead.nombre,
      telefono: agendaLead.telefono,
      estado: agendaLead.estado,
      resumen: agendaLead.proximoPaso || agendaLead.nota || "",
      ownerEmail: vendorById[agendaLead.vendorId]?.email || user?.email,
    });
    pushNotification({
      title: `Contacto con ${agendaLead.nombre}`,
      detail: `${agendaCanal} programado el ${fechaLegible}${agendaNota ? " - " + agendaNota : ""}`,
      time: fechaLegible,
    });
    setAgendaLead(null);
    setAgendaFecha("");
    setAgendaNota("");
  };

  const handleWhatsApp = (telefono: string) => {
    const clean = telefono.replace(/[^\d]/g, "");
    window.open(`https://wa.me/${clean}`, "_blank");
  };

  const handleCall = (telefono: string) => {
    window.open(`tel:${telefono}`);
  };

  const handleEmail = (correo: string) => {
    window.open(`mailto:${correo}`);
  };

  const handleCrear = () => {
    if (!nuevo.nombre || !nuevo.telefono) return;
    const id = leads.length ? Math.max(...leads.map(l => l.id)) + 1 : 1;
    setLeads([{ id, ...nuevo }, ...leads]);
    setShowForm(false);
    setNuevo({
      nombre: "",
      telefono: "",
      correo: "",
      estado: "Nuevo",
      fechaIngreso: new Date().toISOString().slice(0, 10),
      proximoPaso: "",
      origen: "WhatsApp",
      nota: "",
      vendorId: findVendorByEmail(user?.email)?.id ?? 1,
    });
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-[#4B6B8A] font-semibold">Clientes</p>
          <h2 className="text-3xl font-extrabold text-[#1A334B]">Leads / Clientes</h2>
          <p className="text-gray-600 text-sm">Comunicate por mensaje, correo o llamada y da seguimiento rapido.</p>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 inline-block mt-1">
            Roles activos: {(user?.roles || []).join(", ") || "Invitado"} - Solo admin/supervisor asigna, vendedor gestiona su propia cartera.
          </p>
        </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            <UserPlus size={18} />
            Nuevo cliente
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {resumen.map(item => {
            const active = estadoFiltro === item.estado;
            return (
              <button
                type="button"
                key={item.estado}
                onClick={() => setEstadoFiltro(active ? "Todos" : item.estado)}
                className={`text-left bg-white border border-[#D9E7F5] rounded-xl p-3 shadow-sm transition-all hover:-translate-y-0.5 ${
                  active ? "ring-2 ring-[#1A6CD3]/50 border-[#1A6CD3]" : ""
                }`}
              >
                <p className="text-xs font-semibold text-gray-500 flex items-center justify-between">
                  {item.estado}
                  {active && <span className="px-2 py-0.5 rounded-full bg-[#E6F0FB] text-[#1A6CD3] text-[10px]">Filtro</span>}
                </p>
                <p className="text-2xl font-bold text-[#1A334B]">{item.total}</p>
                <div className="h-1.5 rounded-full bg-[#E6F0FB] mt-2 overflow-hidden">
                  <span className="block h-full bg-[#1A6CD3] transition-all" style={{ width: `${Math.min(item.total * 25, 100)}%` }} />
                </div>
              </button>
            );
          })}
        </div>

        {estadoFiltro !== "Todos" && (
          <div className="flex items-center gap-2 text-sm mt-2">
            <span className="text-[#1A334B] font-semibold">Filtro por estado:</span>
            <span className="px-3 py-1 rounded-full bg-[#E6F0FB] text-[#1A6CD3] text-xs font-semibold">{estadoFiltro}</span>
            <button
              onClick={() => setEstadoFiltro("Todos")}
              className="text-xs font-semibold text-[#1A334B] border border-[#D9E7F5] rounded-lg px-3 py-1 hover:bg-[#F4F8FD]"
            >
              Limpiar
            </button>
          </div>
        )}

      {isAdminLike && (
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-sm font-semibold text-[#1A334B]">{t("selectVendor")}</div>
            <button
              className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-[#1A334B] bg-white hover:bg-[#F4F8FD] shadow-sm"
              onClick={() => setShowVendorModal(true)}
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
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {resumenPorVendedor.map((v) => {
              const active = vistaVendedor === v.vendor?.email;
              return (
                <button
                  key={v.vendorId}
                  onClick={() => setVistaVendedor(active ? null : v.vendor?.email || String(v.vendorId))}
                  className={`text-left px-3 py-2 rounded-lg border text-sm ${
                    active
                      ? "border-[#1A6CD3] bg-[#E6F0FB] text-[#0E4B8F]"
                      : "border-[#D9E7F5] bg-white text-[#1A334B] hover:bg-[#F4F8FD]"
                  }`}
                >
                  <p className="font-semibold">{v.vendor?.nombre || v.vendor?.email}</p>
                  <p className="text-xs text-gray-600">{v.total} leads</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {resumenOrigen.map((item) => (
            <div
              key={item.origen}
              className="bg-white border border-[#E6EDF7] rounded-xl p-3 shadow-sm flex flex-col gap-1"
            >
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Globe2 size={14} className="text-[#1A6CD3]" />
                <span>Origen</span>
              </div>
              <p className="text-sm font-bold text-[#1A334B]">{item.origen}</p>
              <p className="text-2xl font-extrabold text-[#1A6CD3]">{item.total}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 border border-gray-200 rounded-xl flex flex-col lg:flex-row gap-3 items-start lg:items-center mb-6 shadow-sm">
        <div className="flex items-center gap-3 w-full lg:w-1/2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F4F8FD] border border-[#D9E7F5] text-gray-600 flex-1">
            <Search size={16} className="text-[#1A6CD3]" />
            <input 
              type="text"
              placeholder="Buscar cliente por nombre, correo o telefono..."
              className="flex-1 outline-none bg-transparent text-sm text-gray-700"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-1/2">
          <EstadoChip estado="Todos" activo={estadoFiltro === "Todos"} onClick={() => setEstadoFiltro("Todos")} />
          {estadoOrden.map(estado => (
            <EstadoChip key={estado} estado={estado} activo={estadoFiltro === estado} onClick={() => setEstadoFiltro(estado)} />
          ))}
          <div className="w-full flex flex-wrap gap-2 mt-2">
            <EstadoChip estado="Todos" activo={origenFiltro === "Todos"} onClick={() => setOrigenFiltro("Todos")} labelPrefix="Origen" />
            {origenes.map((o) => (
              <EstadoChip key={o} estado={o as any} activo={origenFiltro === o} onClick={() => setOrigenFiltro(o)} labelPrefix="Origen" />
            ))}
          </div>
        </div>
      </div>

        <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setVista("cards")}
          className={`px-3 py-2 text-xs font-semibold rounded-full border transition-all ${
            vista === "cards" ? "bg-[#1A6CD3] text-white border-[#1A6CD3]" : "bg-white text-[#1A334B] border-[#D9E7F5] hover:bg-[#F4F8FD]"
          }`}
        >
          Vista tarjetas
        </button>
        <button
          onClick={() => setVista("tabla")}
          className={`px-3 py-2 text-xs font-semibold rounded-full border transition-all ${
            vista === "tabla" ? "bg-[#1A6CD3] text-white border-[#1A6CD3]" : "bg-white text-[#1A334B] border-[#D9E7F5] hover:bg-[#F4F8FD]"
          }`}
        >
          Vista horizontal
        </button>
      </div>

      {vista === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(lead => (
            <div
              key={lead.id}
              className={`rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border ${
                lead.estado === "Confirmado" ? "bg-[#E8F1FF] border-[#C9DEFF]" : "bg-white border-[#E3ECF7]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500">Cliente #{lead.id}</p>
                  <h3 className="text-xl font-bold text-[#1A334B]">{lead.nombre}</h3>
                  <p className="text-sm text-gray-600">{lead.correo}</p>
                  <p className="text-sm text-gray-600">{lead.telefono}</p>
                  <p className="text-xs text-[#1A6CD3] font-semibold mt-1">
                    Vendedor: {vendorById[lead.vendorId]?.nombre || vendorById[lead.vendorId]?.email} · Origen: {lead.origen}
                  </p>
                </div>
                <EstadoBadge estado={lead.estado} />
              </div>

              <div className="mt-3 text-sm text-gray-700 bg-[#F7FAFF] border border-[#D9E7F5] rounded-xl p-3">
                <p className="font-semibold text-[#1A334B]">Proximo paso</p>
                <p className="text-gray-600">{lead.proximoPaso}</p>
                <p className="text-xs text-gray-500 mt-2">Ingreso: {lead.fechaIngreso}</p>
                {lead.nota && <p className="text-xs text-gray-500">Nota: {lead.nota}</p>}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <AccionBoton
                  onClick={() => handleWhatsApp(lead.telefono)}
                  color="bg-[#E9FBF0] text-emerald-700 hover:bg-[#d7f5e3]"
                  icon={<MessageSquare size={16} />}
                  label="Mensaje"
                />
                <AccionBoton
                  onClick={() => handleEmail(lead.correo)}
                  color="bg-[#E8F1FF] text-[#1A6CD3] hover:bg-[#d9e8ff]"
                  icon={<Mail size={16} />}
                  label="Correo"
                />
                <AccionBoton
                  onClick={() => handleCall(lead.telefono)}
                  color="bg-[#E9F8FF] text-sky-700 hover:bg-[#d6f1ff]"
                  icon={<PhoneCall size={16} />}
                  label="Llamada"
                />
              <AccionBoton
                onClick={() => setDetalle(lead)}
                color="bg-[#F6F3FF] text-purple-700 hover:bg-[#ede6ff]"
                icon={<Eye size={16} />}
                label="Detalle"
              />
              <AccionBoton
                onClick={() => {
                  setAgendaLead(lead);
                  setAgendaFecha(new Date().toISOString().slice(0, 16));
                }}
                color="bg-[#FFF3E0] text-amber-700 hover:bg-[#ffe2b8]"
                icon={<Bell size={16} />}
                label="Agendar"
              />
              <AccionBoton
                onClick={() => {
                  pushNotification({
                    title: `Recordar: ${lead.nombre}`,
                    detail: lead.proximoPaso || lead.nota || "Revisar comentarios del cliente",
                    time: new Date().toLocaleString("es-CL"),
                  });
                }}
                color="bg-[#F0E8FF] text-purple-700 hover:bg-[#e6dbff]"
                icon={<Bell size={16} />}
                label="Recordar"
              />
            </div>
          </div>
        ))}
      </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-[#F5FAFF] text-[#1A334B] text-left">
              <tr>
                <th className="py-3 px-4 text-sm">Cliente</th>
                <th className="py-3 px-4 text-sm">Estado</th>
                <th className="py-3 px-4 text-sm">Origen</th>
                <th className="py-3 px-4 text-sm">Ingreso</th>
                <th className="py-3 px-4 text-sm">Proximo paso</th>
                <th className="py-3 px-4 text-sm text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} className="border-t border-gray-200 hover:bg-gray-50 transition">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-gray-800">{lead.nombre}</p>
                    <p className="text-xs text-gray-500">{lead.correo}</p>
                    <p className="text-xs text-gray-500">{lead.telefono}</p>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <EstadoBadge estado={lead.estado} />
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">{lead.origen}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{lead.fechaIngreso}</td>
                  <td className="py-3 px-4 text-sm text-gray-700 max-w-[280px]">
                    <p>{lead.proximoPaso}</p>
                    {lead.nota && <p className="text-xs text-gray-500 mt-1">Nota: {lead.nota}</p>}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-2 justify-end">
                      <AccionBoton
                        onClick={() => handleWhatsApp(lead.telefono)}
                        color="bg-[#E9FBF0] text-emerald-700 hover:bg-[#d7f5e3]"
                        icon={<MessageSquare size={16} />}
                        label="Mensaje"
                      />
                      <AccionBoton
                        onClick={() => handleEmail(lead.correo)}
                        color="bg-[#E8F1FF] text-[#1A6CD3] hover:bg-[#d9e8ff]"
                        icon={<Mail size={16} />}
                        label="Correo"
                      />
                      <AccionBoton
                        onClick={() => handleCall(lead.telefono)}
                        color="bg-[#E9F8FF] text-sky-700 hover:bg-[#d6f1ff]"
                        icon={<PhoneCall size={16} />}
                        label="Llamada"
                      />
                      <AccionBoton
                        onClick={() => setDetalle(lead)}
                        color="bg-[#F6F3FF] text-purple-700 hover:bg-[#ede6ff]"
                        icon={<Eye size={16} />}
                        label="Detalle"
                      />
                      <AccionBoton
                        onClick={() => {
                          setAgendaLead(lead);
                          setAgendaFecha(new Date().toISOString().slice(0, 16));
                        }}
                        color="bg-[#FFF3E0] text-amber-700 hover:bg-[#ffe2b8]"
                        icon={<Bell size={16} />}
                        label="Agendar"
                      />
                      <AccionBoton
                        onClick={() =>
                          pushNotification({
                            title: `Recordar: ${lead.nombre}`,
                            detail: lead.proximoPaso || lead.nota || "Revisar comentarios del cliente",
                            time: new Date().toLocaleString("es-CL"),
                          })
                        }
                        color="bg-[#F0E8FF] text-purple-700 hover:bg-[#e6dbff]"
                        icon={<Bell size={16} />}
                        label="Recordar"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              {vendedoresLista
                .filter((v) => {
                  const term = buscadorVendedor.toLowerCase();
                  return (v?.nombre || "").toLowerCase().includes(term) || (v?.email || "").toLowerCase().includes(term);
                })
                .map((v) => (
                  <button
                    key={v?.id}
                    className={`w-full text-left px-3 py-2 text-sm ${
                      vendedorFiltro === String(v?.id) ? "bg-[#E6F0FB] text-[#1A6CD3]" : "hover:bg-[#F4F8FD] text-gray-700"
                    }`}
                    onClick={() => {
                      if (!v) return;
                      setVendedorFiltro(String(v.id));
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

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#1A334B]">Nuevo cliente</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 text-sm">Cerrar</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Nombre" value={nuevo.nombre} onChange={(v) => setNuevo({ ...nuevo, nombre: v })} />
              <Input label="Correo" value={nuevo.correo} onChange={(v) => setNuevo({ ...nuevo, correo: v })} />
              <Input label="Telefono" value={nuevo.telefono} onChange={(v) => setNuevo({ ...nuevo, telefono: v })} />
              <Input label="Proximo paso" value={nuevo.proximoPaso} onChange={(v) => setNuevo({ ...nuevo, proximoPaso: v })} />
              <Input label="Nota" value={nuevo.nota ?? ""} onChange={(v) => setNuevo({ ...nuevo, nota: v })} />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#1A334B]">Estado</span>
                <select
                  className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700"
                  value={nuevo.estado}
                  onChange={(e) => setNuevo({ ...nuevo, estado: e.target.value as Lead["estado"] })}
                >
                  {estadoOrden.map((estado) => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#1A334B]">Origen</span>
                <select
                  className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700"
                  value={nuevo.origen}
                  onChange={(e) => setNuevo({ ...nuevo, origen: e.target.value as Lead["origen"] })}
                >
                  {origenes.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Fecha ingreso"
                type="date"
                value={nuevo.fechaIngreso}
                onChange={(v) => setNuevo({ ...nuevo, fechaIngreso: v })}
              />
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
                Guardar cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {agendaLead && (
        <Modal onClose={() => setAgendaLead(null)}>
          <div className="p-5 space-y-3">
            <h3 className="text-xl font-bold text-[#1A334B]">Agendar contacto</h3>
            <p className="text-sm text-gray-700">
              {agendaLead.nombre} - {agendaLead.correo} - {agendaLead.telefono}
            </p>
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
              <span className="font-semibold">Canal</span>
              <select
                value={agendaCanal}
                onChange={(e) => setAgendaCanal(e.target.value as any)}
                className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1A6CD3]"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Correo">Correo</option>
                <option value="Llamada">Llamada</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-[#1A334B]">
              <span className="font-semibold">Nota</span>
              <textarea
                value={agendaNota}
                onChange={(e) => setAgendaNota(e.target.value)}
                className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A6CD3] bg-white"
              />
            </label>
            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              Se notificara por panel y se sugiere enviar el mensaje por {agendaCanal}.
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setAgendaLead(null)}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD]"
              >
                Cancelar
              </button>
              <button
                onClick={crearRecordatorio}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] text-white"
              >
                Guardar y avisar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {detalle && (
        <Modal onClose={() => setDetalle(null)}>
          <div className="p-5 space-y-3">
            <h3 className="text-xl font-bold text-[#1A334B]">Detalle lead #{detalle.id}</h3>
            <p className="text-sm text-gray-700"><strong>Nombre:</strong> {detalle.nombre}</p>
            <p className="text-sm text-gray-700"><strong>Correo:</strong> {detalle.correo}</p>
            <p className="text-sm text-gray-700"><strong>Telefono:</strong> {detalle.telefono}</p>
            <p className="text-sm text-gray-700"><strong>Origen:</strong> {detalle.origen}</p>
            <p className="text-sm text-gray-700"><strong>Estado:</strong> {detalle.estado}</p>
            <p className="text-sm text-gray-700"><strong>Ingreso:</strong> {detalle.fechaIngreso}</p>
            <p className="text-sm text-gray-700"><strong>Proximo paso:</strong> {detalle.proximoPaso}</p>
            {detalle.nota && <p className="text-sm text-gray-700"><strong>Nota:</strong> {detalle.nota}</p>}

            <div className="grid grid-cols-3 gap-2 pt-2">
              <AccionBoton
                onClick={() => handleWhatsApp(detalle.telefono)}
                color="bg-[#E9FBF0] text-emerald-700 hover:bg-[#d7f5e3]"
                icon={<MessageSquare size={16} />}
                label="Mensaje"
              />
              <AccionBoton
                onClick={() => handleEmail(detalle.correo)}
                color="bg-[#E8F1FF] text-[#1A6CD3] hover:bg-[#d9e8ff]"
                icon={<Mail size={16} />}
                label="Correo"
              />
              <AccionBoton
                onClick={() => handleCall(detalle.telefono)}
                color="bg-[#E9F8FF] text-sky-700 hover:bg-[#d6f1ff]"
                icon={<PhoneCall size={16} />}
                label="Llamada"
              />
            </div>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-[#1A334B]">
      <span className="font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A6CD3] bg-white"
      />
    </label>
  );
}

function AccionBoton({
  onClick,
  icon,
  label,
  color,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`${color} px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all hover:-translate-y-0.5 shadow-sm`}
    >
      {icon}
      {label}
    </button>
  );
}

function EstadoChip({
  estado,
  activo,
  onClick,
  labelPrefix,
}: {
  estado: Lead["estado"] | "Todos";
  activo: boolean;
  onClick: () => void;
  labelPrefix?: string;
}) {
  const base = "px-3 py-2 rounded-full text-xs font-semibold border transition-all";
  const activeStyles = "bg-[#1A6CD3] text-white border-[#1A6CD3] shadow-sm";
  const idleStyles = "bg-white text-[#1A334B] border-[#D9E7F5] hover:bg-[#F4F8FD]";

  return (
    <button onClick={onClick} className={`${base} ${activo ? activeStyles : idleStyles}`}>
      {labelPrefix ? `${labelPrefix}: ${estado}` : estado}
    </button>
  );
}

function EstadoBadge({ estado }: { estado: Lead["estado"] }) {
  const isCliente = estado === "Confirmado";
  const bg = isCliente ? "bg-[#E6F0FB] text-[#1A6CD3] border-[#D9E7F5]" : "bg-[#F4E8FF] text-[#6B21A8] border-[#E9D5FF]";
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${bg}`}>
      {estado}
    </span>
  );
}
