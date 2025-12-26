import { useEffect, useMemo, useState } from "react";
import MainLayout from "../components/MainLayout";
import { useAuth } from "../context/AuthContext";
import { Search, RefreshCw, Download, Upload, Users, User, FileText } from "lucide-react";
import { findVendorByEmail } from "../utils/vendors";
import { useI18n } from "../context/I18nContext";

type EstadoCliente = "ACTIVO" | "ONBOARDING" | "EN_RIESGO";

type ClienteApi = {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  estado: EstadoCliente;
  origen: string;
  vendedorEmail: string;
  vendedorNombre: string;
  vendedorRol?: string;
  carpeta: string;
  createdAt?: string;
  updatedAt?: string;
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

const estadoLabel: Record<EstadoCliente, string> = {
  ACTIVO: "Activo",
  ONBOARDING: "Onboarding",
  EN_RIESGO: "En riesgo",
};

const estadoColor: Record<EstadoCliente, string> = {
  ACTIVO: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ONBOARDING: "bg-amber-100 text-amber-700 border-amber-200",
  EN_RIESGO: "bg-rose-100 text-rose-700 border-rose-200",
};

const vendedorRolLabel: Record<string, string> = {
  ADMINISTRADOR: "Admin",
  ADMIN: "Admin",
  TRABAJADOR: "Bodeguero",
  BODEGUERO: "Bodeguero",
  SUPERVISOR: "Supervisor",
  VENDEDOR: "Vendedor",
};

const formatVendedorRol = (rol?: string) => {
  if (!rol) return "";
  return vendedorRolLabel[rol.toUpperCase()] ?? rol;
};

const READY_STATUS: EstadoCliente = "ACTIVO";
const CLIENT_STATUS_KEY = "megagen_client_status";
const READY_COUNT_KEY = "megagen_ready_clients_count";

type EstadoLocal = "Activo" | "Onboarding" | "En riesgo";

const localToApiEstado: Record<EstadoLocal, EstadoCliente> = {
  Activo: "ACTIVO",
  Onboarding: "ONBOARDING",
  "En riesgo": "EN_RIESGO",
};

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

const applyStatusOverrides = (data: ClienteApi[]) => {
  const overrides = readStatusOverrides();
  return data.map((cliente) => {
    const override = overrides[cliente.correo];
    if (!override) return cliente;
    const mapped = localToApiEstado[override];
    return mapped ? { ...cliente, estado: mapped } : cliente;
  });
};

export default function ClientsReportPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [clientes, setClientes] = useState<ClienteApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vendedorFiltro, setVendedorFiltro] = useState<string>("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [lastSync, setLastSync] = useState("");

  const headers = useMemo(() => {
    const h: Record<string, string> = {};
    if (user?.token) h.Authorization = `Bearer ${user.token}`;
    return h;
  }, [user?.token]);

  const fetchClientes = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      const resp = await fetch(`${API_URL}/clients?${params.toString()}`, { headers });
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error(e.message || t("No se pudieron cargar los clientes"));
      }
      const data = (await resp.json()) as ClienteApi[];
      setClientes(applyStatusOverrides(data));
      setLastSync(new Date().toLocaleString());
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Error desconocido cargando clientes"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clientesActivos = useMemo(
    () => clientes.filter((c) => c.estado === READY_STATUS),
    [clientes]
  );

  const vendorMetaByEmail = useMemo(() => {
    const map = new Map<string, { nombre: string; rolLabel: string }>();
    clientes.forEach((c) => {
      if (!c.vendedorEmail) return;
      if (map.has(c.vendedorEmail)) return;
      const mapped = findVendorByEmail(c.vendedorEmail);
      const nombre = mapped?.nombre || c.vendedorNombre || c.vendedorEmail;
      const rol = mapped?.rol || c.vendedorRol || "";
      map.set(c.vendedorEmail, { nombre, rolLabel: formatVendedorRol(rol) });
    });
    return map;
  }, [clientes]);

  const vendedores = useMemo(() => {
    return Array.from(vendorMetaByEmail.entries())
      .map(([email, meta]) => ({ email, ...meta }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [vendorMetaByEmail]);

  const filtradas = useMemo(() => {
    const term = busqueda.toLowerCase();
    return clientesActivos.filter((c) => {
      const matchVend = vendedorFiltro === "Todos" ? true : c.vendedorEmail === vendedorFiltro;
      const vendorMeta = vendorMetaByEmail.get(c.vendedorEmail);
      const vendorNombre = vendorMeta?.nombre || c.vendedorNombre || "";
      const rolLabel = vendorMeta?.rolLabel || formatVendedorRol(c.vendedorRol);
      const vendorEmail = c.vendedorEmail || "";
      const matchText =
        !term ||
        c.nombre.toLowerCase().includes(term) ||
        c.correo.toLowerCase().includes(term) ||
        c.telefono.toLowerCase().includes(term) ||
        c.origen.toLowerCase().includes(term) ||
        vendorNombre.toLowerCase().includes(term) ||
        vendorEmail.toLowerCase().includes(term) ||
        rolLabel.toLowerCase().includes(term);
      return matchVend && matchText;
    });
  }, [clientesActivos, busqueda, vendedorFiltro, vendorMetaByEmail]);

  const totalActivos = clientesActivos.length;
  const totalVisibles = filtradas.length;
  useEffect(() => {
    localStorage.setItem(READY_COUNT_KEY, String(totalActivos));
    window.dispatchEvent(new Event("storage"));
  }, [totalActivos]);

  const exportCsv = () => {
    const rows = [
      [
        "id",
        t("Nombre"),
        t("Correo"),
        t("Telefono"),
        t("Estado"),
        t("Origen"),
        t("Vendedor"),
        t("Vendedor nombre"),
        t("Carpeta"),
        t("Creado"),
      ],
      ...filtradas.map((c) => {
        const vendorMeta = vendorMetaByEmail.get(c.vendedorEmail);
        const vendorNombre = vendorMeta?.nombre || c.vendedorNombre || c.vendedorEmail;
        return [
          c.id,
          c.nombre,
          c.correo,
          c.telefono,
          t(estadoLabel[c.estado]),
          c.origen,
          c.vendedorEmail,
          vendorNombre,
          c.carpeta,
          c.createdAt || "",
        ];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clientes_listos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    const rows = filtradas
      .map((c) => {
        const vendorMeta = vendorMetaByEmail.get(c.vendedorEmail);
        const vendorNombre = vendorMeta?.nombre || c.vendedorNombre || "";
        return `
          <tr>
            <td style="padding:6px 8px;border:1px solid #e5e7eb;">${c.nombre}</td>
            <td style="padding:6px 8px;border:1px solid #e5e7eb;">${t(estadoLabel[c.estado])}</td>
            <td style="padding:6px 8px;border:1px solid #e5e7eb;">${vendorNombre}</td>
            <td style="padding:6px 8px;border:1px solid #e5e7eb;">${c.origen || ""}</td>
            <td style="padding:6px 8px;border:1px solid #e5e7eb;">${c.telefono}</td>
            <td style="padding:6px 8px;border:1px solid #e5e7eb;">${c.correo}</td>
          </tr>`;
      })
      .join("");

    win.document.write(`
      <html>
        <head>
          <title>${t("Informe de clientes")}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1f2937; }
            h1 { margin-bottom: 4px; }
            h3 { margin-top: 0; color: #2563eb; }
            table { border-collapse: collapse; width: 100%; margin-top: 12px; font-size: 12px; }
            th { background: #f1f5f9; text-align: left; padding: 6px 8px; border: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <h1>${t("Clientes listos")}</h1>
          <h3>${t("Generado")} ${new Date().toLocaleString()}</h3>
          <p>${t("Total registros")}: ${filtradas.length}</p>
          <table>
            <thead>
              <tr>
                <th>${t("Cliente")}</th>
                <th>${t("Estado")}</th>
                <th>${t("Vendedor")}</th>
                <th>${t("Origen")}</th>
                <th>${t("Tel")}</th>
                <th>${t("Correo")}</th>
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

  return (
    <MainLayout>
      <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-[#4B6B8A] font-semibold flex items-center gap-2">
            <FileText size={16} /> {t("Informe")}
          </p>
          <h2 className="text-3xl font-extrabold text-[#1A334B]">{t("Clientes listos")}</h2>
          <p className="text-gray-600 text-sm">
            {t("Registro automatico de clientes Activo desde el modulo Clientes, listo para exportar. Usa busqueda o vendedor para filtrar el informe.")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchClientes}
            className="flex items-center gap-2 border border-[#D9E7F5] text-[#1A334B] font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all bg-white"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> {t("Actualizar")}
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 border border-[#D9E7F5] text-[#1A334B] font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all bg-white"
          >
            <Upload size={16} /> {t("Exportar CSV")}
          </button>
          <button
            onClick={exportPdf}
            className="flex items-center gap-2 bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <Download size={16} /> {t("Exportar PDF")}
          </button>
        </div>
      </div>

      {error && <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        <div className="bg-white border border-[#D9E7F5] rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-[#4B6B8A] font-semibold">{t("Paso 1")}</p>
          <p className="text-sm font-semibold text-[#1A334B] mt-1">{t("Clientes activos detectados")}</p>
          <p className="text-3xl font-extrabold text-[#1A334B] mt-2">{totalActivos}</p>
          <p className="text-xs text-gray-500 mt-1">{t("Fuente: modulo Clientes")}</p>
        </div>
        <div className="bg-white border border-[#D9E7F5] rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-[#4B6B8A] font-semibold">{t("Paso 2")}</p>
          <p className="text-sm font-semibold text-[#1A334B] mt-1">{t("Informe listo")}</p>
          <p className="text-3xl font-extrabold text-[#1A334B] mt-2">{totalVisibles}</p>
          <p className="text-xs text-gray-500 mt-1">{t("Solo estado Activo")}</p>
        </div>
        <div className="bg-white border border-[#D9E7F5] rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-[#4B6B8A] font-semibold">{t("Paso 3")}</p>
          <p className="text-sm font-semibold text-[#1A334B] mt-1">{t("Exportar informe")}</p>
          <p className="text-xs text-gray-500 mt-2">{t("CSV o PDF disponibles arriba")}</p>
          <p className="text-xs text-gray-500 mt-1">
            {t("Ultima sincronizacion")}: {lastSync || t("Sin datos")}
          </p>
        </div>
        <div className="bg-white border border-[#D9E7F5] rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-[#4B6B8A] font-semibold">{t("Paso 4")}</p>
          <p className="text-sm font-semibold text-[#1A334B] mt-1">{t("Clientes listos en menu")}</p>
          <p className="text-3xl font-extrabold text-[#1A334B] mt-2">{totalActivos}</p>
          <p className="text-xs text-gray-500 mt-1">{t("Se muestra en el navbar")}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 mb-5 flex flex-col gap-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F4F8FD] border border-[#D9E7F5] text-gray-700">
            <Search size={16} className="text-[#1A6CD3]" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={t("Buscar cliente, correo, vendedor...")}
              className="bg-transparent text-sm outline-none"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
            <Users size={16} className="text-emerald-600" />
            {t("Estado fijo")}: {t("Activo")}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F4F8FD] border border-[#D9E7F5] text-gray-700">
            <User size={16} className="text-[#1A6CD3]" />
            <select
              value={vendedorFiltro}
              onChange={(e) => setVendedorFiltro(e.target.value)}
              className="bg-transparent text-sm outline-none"
            >
              <option value="Todos">{t("Todos los vendedores")}</option>
              {vendedores.map((v) => {
                const rolTrad = v.rolLabel ? t(v.rolLabel) : "";
                const label = rolTrad ? `${v.nombre} (${rolTrad})` : v.nombre;
                return (
                  <option key={v.email} value={v.email}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
          {(vendedorFiltro !== "Todos" || busqueda) && (
            <button
              onClick={() => {
                setVendedorFiltro("Todos");
                setBusqueda("");
                fetchClientes();
              }}
              className="text-xs font-semibold text-[#1A334B] border border-[#D9E7F5] rounded-lg px-3 py-2 bg-white hover:bg-[#F4F8FD]"
            >
              {t("Limpiar filtros")}
            </button>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {t("Mostrando {visibles} de {total} clientes activos.", { visibles: totalVisibles, total: totalActivos })}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[#1A334B] text-sm">
          <RefreshCw size={16} className="animate-spin" /> {t("Cargando clientes...")}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F5FAFF] text-[#1A334B] text-left text-sm">
              <tr>
                <th className="py-3 px-4">{t("Cliente")}</th>
                <th className="py-3 px-4">{t("Estado")}</th>
                <th className="py-3 px-4">{t("Origen")}</th>
                <th className="py-3 px-4">{t("Vendedor")}</th>
                <th className="py-3 px-4">{t("Contacto")}</th>
                <th className="py-3 px-4">{t("Carpeta")}</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((c) => {
                const vendorMeta = vendorMetaByEmail.get(c.vendedorEmail);
                const vendorNombre = vendorMeta?.nombre || c.vendedorNombre || t("Sin asignar");
                const rolLabel = vendorMeta?.rolLabel || formatVendedorRol(c.vendedorRol);
                const vendorEmail = c.vendedorEmail || "";
                return (
                  <tr key={c.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-800">
                      <p className="font-semibold">{c.nombre}</p>
                      <p className="text-xs text-gray-500">{c.correo}</p>
                      <p className="text-xs text-gray-500">{c.telefono}</p>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${estadoColor[c.estado]}`}>
                        {t(estadoLabel[c.estado])}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{c.origen || t("N/A")}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      <p className="font-semibold">{vendorNombre}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">{vendorEmail}</p>
                        {rolLabel && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F4F8FD] border border-[#D9E7F5] text-[#1A334B]">
                            {t(rolLabel)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      <p className="text-xs text-gray-600">{c.telefono}</p>
                      <p className="text-xs text-gray-600">{c.correo}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{c.carpeta || t("N/A")}</td>
                  </tr>
                );
              })}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-gray-500">
                    {t("No hay clientes para los filtros aplicados.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </MainLayout>
  );
}
