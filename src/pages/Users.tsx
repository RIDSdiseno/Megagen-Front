import { useMemo, useState, type ReactNode } from "react";
import MainLayout from "../components/MainLayout";
import {
  Users,
  Search,
  UserPlus,
  ShieldCheck,
  Ban,
  Mail,
  CheckCircle,
} from "lucide-react";

type Estado = "Activo" | "Pendiente" | "Suspendido";
type Rol = "Administrador" | "Coordinador" | "Ventas" | "Clinica";

type Usuario = {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  estado: Estado;
  ultimoAcceso: string;
};

const usuariosData: Usuario[] = [
  { id: 1, nombre: "Carolina Soto", correo: "carolina@megagen.cl", rol: "Administrador", estado: "Activo", ultimoAcceso: "2025-12-02 09:30" },
  { id: 2, nombre: "Luis Herrera", correo: "luis.herrera@megagen.cl", rol: "Ventas", estado: "Pendiente", ultimoAcceso: "Pendiente" },
  { id: 3, nombre: "Paula Rios", correo: "paula.rios@megagen.cl", rol: "Coordinador", estado: "Activo", ultimoAcceso: "2025-12-01 18:10" },
  { id: 4, nombre: "Clinica Andes", correo: "contacto@andes.cl", rol: "Clinica", estado: "Suspendido", ultimoAcceso: "2025-11-30 12:00" },
];

const roles: Rol[] = ["Administrador", "Coordinador", "Ventas", "Clinica"];
const estados: Estado[] = ["Activo", "Pendiente", "Suspendido"];

export default function UsuariosPage() {
  const [search, setSearch] = useState("");
  const [filtroRol, setFiltroRol] = useState<Rol | "Todos">("Todos");
  const [filtroEstado, setFiltroEstado] = useState<Estado | "Todos">("Todos");
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosData);

  const resumen = useMemo(
    () => ({
      total: usuarios.length,
      activos: usuarios.filter((u) => u.estado === "Activo").length,
      pendientes: usuarios.filter((u) => u.estado === "Pendiente").length,
      suspendidos: usuarios.filter((u) => u.estado === "Suspendido").length,
    }),
    [usuarios]
  );

  const filtrados = useMemo(() => {
    const term = search.toLowerCase();
    return usuarios.filter((u) => {
      const matchTexto = u.nombre.toLowerCase().includes(term) || u.correo.toLowerCase().includes(term);
      const matchRol = filtroRol === "Todos" ? true : u.rol === filtroRol;
      const matchEstado = filtroEstado === "Todos" ? true : u.estado === filtroEstado;
      return matchTexto && matchRol && matchEstado;
    });
  }, [usuarios, search, filtroRol, filtroEstado]);

  const cambiarEstado = (id: number, nuevo: Estado) => {
    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, estado: nuevo } : u)));
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <p className="text-sm uppercase tracking-wide text-[#4B6B8A] font-semibold">Administracion</p>
          <h2 className="text-3xl font-extrabold text-[#1A334B]">Usuarios y permisos</h2>
          <p className="text-gray-600 text-sm">Gestiona cuentas, roles y accesos rapidamente.</p>
        </div>
        <button className="flex items-center gap-2 bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
          <UserPlus size={18} />
          Invitar usuario
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <ResumenCard label="Total" valor={resumen.total} color="from-[#1A6CD3] to-[#0E4B8F]" />
        <ResumenCard label="Activos" valor={resumen.activos} color="from-emerald-500 to-emerald-700" />
        <ResumenCard label="Pendientes" valor={resumen.pendientes} color="from-amber-500 to-amber-700" />
        <ResumenCard label="Suspendidos" valor={resumen.suspendidos} color="from-rose-500 to-rose-700" />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 mb-5 flex flex-col lg:flex-row gap-3 items-start lg:items-center">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F4F8FD] border border-[#D9E7F5] text-gray-600 flex-1">
          <Search size={16} className="text-[#1A6CD3]" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            className="flex-1 outline-none bg-transparent text-sm text-gray-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Selector value={filtroRol} onChange={(v) => setFiltroRol(v as Rol | "Todos")} label="Rol" opciones={["Todos", ...roles]} />
          <Selector value={filtroEstado} onChange={(v) => setFiltroEstado(v as Estado | "Todos")} label="Estado" opciones={["Todos", ...estados]} />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F5FAFF] text-[#1A334B] text-left">
            <tr>
              <th className="py-3 px-4 text-sm">Usuario</th>
              <th className="py-3 px-4 text-sm">Rol</th>
              <th className="py-3 px-4 text-sm">Estado</th>
              <th className="py-3 px-4 text-sm">Último acceso</th>
              <th className="py-3 px-4 text-sm text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((u) => (
              <tr key={u.id} className="border-t border-gray-200 hover:bg-gray-50 transition">
                <td className="py-3 px-4">
                  <p className="font-semibold text-gray-800">{u.nombre}</p>
                  <p className="text-xs text-gray-500">{u.correo}</p>
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">{u.rol}</td>
                <td className="py-3 px-4">
                  <EstadoPill estado={u.estado} />
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">{u.ultimoAcceso}</td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {u.estado === "Pendiente" && (
                      <BotonAccion
                        label="Reenviar"
                        color="text-[#1A6CD3] bg-[#E6F0FB] hover:bg-[#d9e8ff]"
                        icon={<Mail size={14} />}
                        onClick={() => {}}
                      />
                    )}
                    {u.estado !== "Activo" && (
                      <BotonAccion
                        label="Activar"
                        color="text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        icon={<CheckCircle size={14} />}
                        onClick={() => cambiarEstado(u.id, "Activo")}
                      />
                    )}
                    {u.estado === "Activo" && (
                      <BotonAccion
                        label="Suspender"
                        color="text-rose-700 bg-rose-50 hover:bg-rose-100"
                        icon={<Ban size={14} />}
                        onClick={() => cambiarEstado(u.id, "Suspendido")}
                      />
                    )}
                    <BotonAccion
                      label="Permisos"
                      color="text-[#1A334B] bg-[#F4F8FD] hover:bg-[#e7f0fa]"
                      icon={<ShieldCheck size={14} />}
                      onClick={() => {}}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}

function ResumenCard({ label, valor, color }: { label: string; valor: number; color: string }) {
  return (
    <div className={`p-4 rounded-xl text-white shadow-md bg-gradient-to-r ${color}`}>
      <p className="text-xs uppercase tracking-wide text-white/80 font-semibold">{label}</p>
      <p className="text-2xl font-extrabold">{valor}</p>
    </div>
  );
}

function Selector({
  value,
  onChange,
  opciones,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  opciones: string[];
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
          <option key={op} value={op}>{op}</option>
        ))}
      </select>
    </label>
  );
}

function EstadoPill({ estado }: { estado: Estado }) {
  const styles: Record<Estado, string> = {
    Activo: "bg-emerald-50 text-emerald-700",
    Pendiente: "bg-amber-50 text-amber-700",
    Suspendido: "bg-rose-50 text-rose-700",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[estado]}`}>
      {estado}
    </span>
  );
}

function BotonAccion({
  label,
  icon,
  color,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${color}`}
    >
      {icon}
      {label}
    </button>
  );
}
