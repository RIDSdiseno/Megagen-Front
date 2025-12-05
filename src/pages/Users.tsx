import { useMemo, useState, type ReactNode } from "react";
import MainLayout from "../components/MainLayout";
import {
  Search,
  UserPlus,
  ShieldCheck,
  Ban,
  CheckCircle,
} from "lucide-react";
import { type Role, useAuth } from "../context/AuthContext";

type Estado = "Activo" | "Pendiente" | "Suspendido";

type Usuario = {
  id: number;
  nombre: string;
  correo: string;
  roles: Role[];
  estado: Estado;
  ultimoAcceso: string;
};

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  superadmin: "Super admin",
  supervisor: "Supervisor",
  vendedor: "Vendedor",
  bodeguero: "Bodeguero",
};

const rolesCatalog: Role[] = ["admin", "supervisor", "vendedor", "bodeguero"];
const estados: Estado[] = ["Activo", "Pendiente", "Suspendido"];

const usuariosData: Usuario[] = [
  { id: 1, nombre: "Carolina Soto", correo: "carolina@megagen.cl", roles: ["superadmin", "admin"], estado: "Activo", ultimoAcceso: "2025-12-02 09:30" },
  { id: 2, nombre: "Luis Herrera", correo: "luis.herrera@megagen.cl", roles: ["vendedor"], estado: "Pendiente", ultimoAcceso: "Pendiente" },
  { id: 3, nombre: "Paula Rios", correo: "paula.rios@megagen.cl", roles: ["supervisor"], estado: "Activo", ultimoAcceso: "2025-12-01 18:10" },
  { id: 4, nombre: "Bodega Central", correo: "bodega@megagen.cl", roles: ["bodeguero"], estado: "Activo", ultimoAcceso: "2025-11-30 12:00" },
  { id: 5, nombre: "Equipo Hibrido", correo: "hibrido@megagen.cl", roles: ["vendedor", "bodeguero"], estado: "Activo", ultimoAcceso: "2025-12-03 08:00" },
];

export default function UsuariosPage() {
  const { hasRole, impersonate } = useAuth();
  const [search, setSearch] = useState("");
  const [filtroRol, setFiltroRol] = useState<Role | "Todos">("Todos");
  const [filtroEstado, setFiltroEstado] = useState<Estado | "Todos">("Todos");
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosData);
  const [showForm, setShowForm] = useState(false);
  const [nuevo, setNuevo] = useState<Omit<Usuario, "id">>({
    nombre: "",
    correo: "",
    roles: ["vendedor"],
    estado: "Pendiente",
    ultimoAcceso: "Pendiente",
  });

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
      const matchRol = filtroRol === "Todos" ? true : u.roles.includes(filtroRol);
      const matchEstado = filtroEstado === "Todos" ? true : u.estado === filtroEstado;
      return matchTexto && matchRol && matchEstado;
    });
  }, [usuarios, search, filtroRol, filtroEstado]);

  const cambiarEstado = (id: number, nuevo: Estado) => {
    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, estado: nuevo } : u)));
  };

  const toggleRol = (id: number, role: Role) => {
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, roles: u.roles.includes(role) ? u.roles.filter((r) => r !== role) : [...u.roles, role] }
          : u
      )
    );
  };

  const eliminarUsuario = (id: number) => {
    setUsuarios((prev) => prev.filter((u) => u.id !== id));
  };

  const handleCrear = () => {
    if (!nuevo.nombre || !nuevo.correo) return;
    const id = usuarios.length ? Math.max(...usuarios.map((u) => u.id)) + 1 : 1;
    setUsuarios([{ id, ...nuevo }, ...usuarios]);
    setShowForm(false);
    setNuevo({
      nombre: "",
      correo: "",
      roles: ["vendedor"],
      estado: "Pendiente",
      ultimoAcceso: "Pendiente",
    });
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <p className="text-sm uppercase tracking-wide text-[#4B6B8A] font-semibold">Administracion</p>
          <h2 className="text-3xl font-extrabold text-[#1A334B]">Usuarios y permisos</h2>
          <p className="text-gray-600 text-sm">Gestiona cuentas, roles y accesos rapidamente.</p>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 inline-block mt-1">
            Admin / Super admin controlan todo. Supervisor audita. Vendedor solo Leads/Clientes/Calendario. Bodeguero solo Cotizaciones.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
        >
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
          <Selector value={filtroRol} onChange={(v) => setFiltroRol(v as Role | "Todos")} label="Rol" opciones={["Todos", ...rolesCatalog]} />
          <Selector value={filtroEstado} onChange={(v) => setFiltroEstado(v as Estado | "Todos")} label="Estado" opciones={["Todos", ...estados]} />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F5FAFF] text-[#1A334B] text-left">
            <tr>
              <th className="py-3 px-4 text-sm">Usuario</th>
              <th className="py-3 px-4 text-sm">Roles</th>
              <th className="py-3 px-4 text-sm">Estado</th>
              <th className="py-3 px-4 text-sm">Ultimo acceso</th>
              <th className="py-3 px-4 text-sm text-center">Acciones</th>
              <th className="py-3 px-4 text-sm text-center">Conectarse como</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((u) => (
              <tr key={u.id} className="border-t border-gray-200 hover:bg-gray-50 transition">
                <td className="py-3 px-4">
                  <p className="font-semibold text-gray-800">{u.nombre}</p>
                  <p className="text-xs text-gray-500">{u.correo}</p>
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {u.roles.map((rol) => (
                      <span key={rol} className="px-2 py-1 rounded-full bg-[#E6F0FB] text-[#1A334B] text-[11px] font-semibold">
                        {roleLabels[rol]}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {rolesCatalog.map((rol) => {
                      const active = u.roles.includes(rol);
                      return (
                        <button
                          key={rol}
                          onClick={() => toggleRol(u.id, rol)}
                          className={`px-2 py-1 rounded-lg text-[11px] border transition ${
                            active
                              ? "bg-[#1A6CD3] text-white border-[#1A6CD3]"
                              : "bg-white text-[#1A334B] border-[#D9E7F5] hover:bg-[#F4F8FD]"
                          }`}
                        >
                          {roleLabels[rol]}
                        </button>
                      );
                    })}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <EstadoPill estado={u.estado} />
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">{u.ultimoAcceso}</td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-2 justify-center">
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
                      label="Eliminar"
                      color="text-[#1A334B] bg-[#F4F8FD] hover:bg-[#e7f0fa]"
                      icon={<ShieldCheck size={14} />}
                      onClick={() => eliminarUsuario(u.id)}
                    />
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  {hasRole(["admin"]) && (
                    <button
                      onClick={() => impersonate({ email: u.correo, roles: u.roles })}
                      className="text-[11px] px-3 py-2 rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD]"
                    >
                      Conectarse
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#1A334B]">Invitar / Crear usuario</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 text-sm">Cerrar</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Nombre" value={nuevo.nombre} onChange={(v) => setNuevo({ ...nuevo, nombre: v })} />
              <Input label="Correo" value={nuevo.correo} onChange={(v) => setNuevo({ ...nuevo, correo: v })} />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#1A334B]">Roles</span>
                <div className="flex flex-wrap gap-2">
                  {rolesCatalog.map((rol) => {
                    const active = nuevo.roles.includes(rol);
                    return (
                      <button
                        key={rol}
                        onClick={() =>
                          setNuevo({
                            ...nuevo,
                            roles: active ? nuevo.roles.filter((r) => r !== rol) : [...nuevo.roles, rol],
                          })
                        }
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                          active
                            ? "bg-[#1A6CD3] text-white border-[#1A6CD3]"
                            : "bg-white text-[#1A334B] border-[#D9E7F5] hover:bg-[#F4F8FD]"
                        }`}
                      >
                        {roleLabels[rol]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#1A334B]">Estado</span>
                <select
                  className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700"
                  value={nuevo.estado}
                  onChange={(e) => setNuevo({ ...nuevo, estado: e.target.value as Estado })}
                >
                  {estados.map((estado) => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>
              <Input label="Ultimo acceso" value={nuevo.ultimoAcceso} onChange={(v) => setNuevo({ ...nuevo, ultimoAcceso: v })} />
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
                Guardar usuario
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-[#1A334B]">
      <span className="font-semibold">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A6CD3] bg-white"
      />
    </label>
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
