import MainLayout from "../components/MainLayout";
import { useMemo, useState } from "react";
import { Search, UserPlus, PhoneCall, FileText, MessageSquare, Mail } from "lucide-react";

type Lead = {
  id: number;
  nombre: string;
  telefono: string;
  correo: string;
  estado: "Nuevo" | "Cotizando" | "En Proceso" | "Confirmado";
  fechaIngreso: string;
  proximoPaso: string;
};

const estadoOrden: Lead["estado"][] = ["Nuevo", "Cotizando", "En Proceso", "Confirmado"];

const leadsData: Lead[] = [
  { 
    id: 1, 
    nombre: "Juan Perez", 
    telefono: "+56988881234", 
    correo: "juan.perez@email.com",
    estado: "Nuevo", 
    fechaIngreso: "2025-12-01",
    proximoPaso: "Enviar mensaje de bienvenida y coordinar llamada inicial."
  },
  { 
    id: 2, 
    nombre: "Maria Lopez", 
    telefono: "+56998765432", 
    correo: "maria.lopez@email.com",
    estado: "Cotizando", 
    fechaIngreso: "2025-12-02",
    proximoPaso: "Compartir cotizacion actualizada con descuentos."
  },
  { 
    id: 3, 
    nombre: "Andres Gonzalez", 
    telefono: "+56977665544", 
    correo: "andres.gonzalez@email.com",
    estado: "En Proceso", 
    fechaIngreso: "2025-12-03",
    proximoPaso: "Confirmar fecha de reunion con especialista."
  },
  { 
    id: 4, 
    nombre: "Ana Martinez", 
    telefono: "+56965443322", 
    correo: "ana.martinez@email.com",
    estado: "Confirmado", 
    fechaIngreso: "2025-12-03",
    proximoPaso: "Enviar resumen y documentacion previa a la cita."
  },
];

export default function Leads() {
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<Lead["estado"] | "Todos">("Todos");

  const resumen = useMemo(
    () => estadoOrden.map(estado => ({
      estado,
      total: leadsData.filter(l => l.estado === estado).length
    })),
    []
  );

  const filtered = useMemo(() => {
    return leadsData.filter(l => {
      const term = search.toLowerCase();
      const matchTexto =
        l.nombre.toLowerCase().includes(term) ||
        l.telefono.includes(term) ||
        l.correo.toLowerCase().includes(term);
      const matchEstado = estadoFiltro === "Todos" ? true : l.estado === estadoFiltro;
      return matchTexto && matchEstado;
    });
  }, [search, estadoFiltro]);

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

  return (
    <MainLayout>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-wide text-[#4B6B8A] font-semibold">Clientes</p>
            <h2 className="text-3xl font-extrabold text-[#1A334B]">Leads / Clientes</h2>
            <p className="text-gray-600 text-sm">Comunicate por mensaje, correo o llamada y da seguimiento rapido.</p>
          </div>
          <button className="flex items-center gap-2 bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
            <UserPlus size={18} />
            Nuevo cliente
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {resumen.map(item => (
            <div
              key={item.estado}
              className="bg-white border border-[#D9E7F5] rounded-xl p-3 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <p className="text-xs font-semibold text-gray-500">{item.estado}</p>
              <p className="text-2xl font-bold text-[#1A334B]">{item.total}</p>
              <div className="h-1.5 rounded-full bg-[#E6F0FB] mt-2 overflow-hidden">
                <span className="block h-full bg-[#1A6CD3] transition-all" style={{ width: `${Math.min(item.total * 25, 100)}%` }} />
              </div>
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
        </div>
      </div>

      {/* LISTADO */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(lead => (
          <div
            key={lead.id}
            className="bg-white border border-[#E3ECF7] rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500">Cliente #{lead.id}</p>
                <h3 className="text-xl font-bold text-[#1A334B]">{lead.nombre}</h3>
                <p className="text-sm text-gray-600">{lead.correo}</p>
                <p className="text-sm text-gray-600">{lead.telefono}</p>
              </div>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#E6F0FB] text-[#1A6CD3]">
                {lead.estado}
              </span>
            </div>

            <div className="mt-3 text-sm text-gray-700 bg-[#F7FAFF] border border-[#D9E7F5] rounded-xl p-3">
              <p className="font-semibold text-[#1A334B]">Proximo paso</p>
              <p className="text-gray-600">{lead.proximoPaso}</p>
              <p className="text-xs text-gray-500 mt-2">Ingreso: {lead.fechaIngreso}</p>
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
                onClick={() => {}}
                color="bg-[#F6F3FF] text-purple-700 hover:bg-[#ede6ff]"
                icon={<FileText size={16} />}
                label="Ficha"
              />
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
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
}: {
  estado: Lead["estado"] | "Todos";
  activo: boolean;
  onClick: () => void;
}) {
  const base = "px-3 py-2 rounded-full text-xs font-semibold border transition-all";
  const activeStyles = "bg-[#1A6CD3] text-white border-[#1A6CD3] shadow-sm";
  const idleStyles = "bg-white text-[#1A334B] border-[#D9E7F5] hover:bg-[#F4F8FD]";

  return (
    <button onClick={onClick} className={`${base} ${activo ? activeStyles : idleStyles}`}>
      {estado}
    </button>
  );
}
