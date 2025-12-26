import { useEffect, useMemo, useState } from "react";
import MainLayout from "../components/MainLayout";
import { useAuth } from "../context/AuthContext";
import { Download, FileText, Filter, RefreshCw, Search, User, Users, ClipboardList } from "lucide-react";
import { useI18n } from "../context/I18nContext";

type Etapa = "Cotizacion confirmada" | "Despacho" | "Transito" | "Entregado";

type Cotizacion = {
  id: number;
  codigo: string;
  cliente: string;
  fecha: string;
  total: string;
  etapa: Etapa;
  resumen: string;
  direccion: string;
  comentarios: string;
  imagenUrl?: string;
  archivos: string[];
  historico: { fecha: string; nota: string }[];
  entregaProgramada?: string;
  vendedorEmail?: string | null;
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

const etapaColor: Record<Etapa, string> = {
  "Cotizacion confirmada": "bg-sky-100 text-sky-700 border-sky-200",
  Despacho: "bg-amber-100 text-amber-700 border-amber-200",
  Transito: "bg-purple-100 text-purple-700 border-purple-200",
  Entregado: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function TerrainHistoryPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const isAdminLike = useMemo(
    () => (user?.roles || []).some((r) => ["admin", "superadmin", "supervisor"].includes(r)),
    [user?.roles]
  );

  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clienteFiltro, setClienteFiltro] = useState<string>("Todos");
  const [responsableFiltro, setResponsableFiltro] = useState<string>("Todos");
  const [etapaFiltro, setEtapaFiltro] = useState<Etapa | "Todos">("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [seleccion, setSeleccion] = useState<Cotizacion | null>(null);

  const jsonHeaders = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (user?.token) h.Authorization = `Bearer ${user.token}`;
    return h;
  }, [user?.token]);

  const fetchCotizaciones = async () => {
    if (!isAdminLike) return;
    setLoading(true);
    setError("");
    try {
      const resp = await fetch(`${API_URL}/quotes`, { headers: jsonHeaders });
      if (!resp.ok) throw new Error(t("No se pudieron cargar las cotizaciones"));
      const data = (await resp.json()) as Cotizacion[];
      setCotizaciones(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCotizaciones();
  }, []);

  const clientes = useMemo(() => {
    const set = new Set<string>();
    cotizaciones.forEach((c) => {
      if (c.cliente) set.add(c.cliente);
    });
    return Array.from(set).sort();
  }, [cotizaciones]);

  const responsables = useMemo(() => {
    const set = new Set<string>();
    cotizaciones.forEach((c) => {
      if (c.vendedorEmail) set.add(c.vendedorEmail);
    });
    return Array.from(set).sort();
  }, [cotizaciones]);

  const resumenEtapa = useMemo(() => {
    const base: Record<Etapa, number> = {
      "Cotizacion confirmada": 0,
      Despacho: 0,
      Transito: 0,
      Entregado: 0,
    };
    cotizaciones.forEach((c) => {
      base[c.etapa] = (base[c.etapa] || 0) + 1;
    });
    return base;
  }, [cotizaciones]);

  const filtradas = useMemo(() => {
    const term = busqueda.toLowerCase();
    return cotizaciones.filter((c) => {
      const matchCliente = clienteFiltro === "Todos" ? true : c.cliente === clienteFiltro;
      const matchResp = responsableFiltro === "Todos" ? true : c.vendedorEmail === responsableFiltro;
      const matchEtapa = etapaFiltro === "Todos" ? true : c.etapa === etapaFiltro;
      const matchText =
        !term ||
        c.cliente.toLowerCase().includes(term) ||
        c.codigo.toLowerCase().includes(term) ||
        c.resumen.toLowerCase().includes(term) ||
        c.comentarios.toLowerCase().includes(term);
      return matchCliente && matchResp && matchEtapa && matchText;
    });
  }, [cotizaciones, clienteFiltro, responsableFiltro, etapaFiltro, busqueda]);

  const exportCsv = () => {
    const rows = [
      [
        "id",
        t("Codigo"),
        t("Cliente"),
        t("Total"),
        t("Etapa"),
        t("Responsable"),
        t("Fecha"),
        t("Entrega programada"),
        t("Resumen"),
      ],
      ...filtradas.map((c) => [
        c.id,
        c.codigo,
        c.cliente,
        c.total,
        t(c.etapa),
        c.vendedorEmail || "",
        c.fecha,
        c.entregaProgramada || "",
        c.resumen || "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "informe_cotizaciones.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    const rows = filtradas
      .map(
        (c) => `
          <tr>
            <td style="padding:6px 8px;border:1px solid #e5e7eb;">${c.codigo}</td>
            <td style="padding:6px 8px;border:1px solid #e5e7eb;">${c.cliente}</td>
            <td style="padding:6px 8px;border:1px solid #e5e7eb;">${c.total}</td>
            <td style="padding:6px 8px;border:1px solid #e5e7eb;">${t(c.etapa)}</td>
            <td style="padding:6px 8px;border:1px solid #e5e7eb;">${c.vendedorEmail || ""}</td>
            <td style="padding:6px 8px;border:1px solid #e5e7eb;">${c.entregaProgramada || t("Sin programar")}</td>
          </tr>`
      )
      .join("");

    win.document.write(`
      <html>
        <head>
          <title>${t("Informe de Cotizaciones")}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1f2937; }
            h1 { margin-bottom: 4px; }
            h3 { margin-top: 0; color: #2563eb; }
            table { border-collapse: collapse; width: 100%; margin-top: 12px; font-size: 12px; }
            th { background: #f1f5f9; text-align: left; padding: 6px 8px; border: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <h1>${t("Informe de Cotizaciones")}</h1>
          <h3>${t("Generado")} ${new Date().toLocaleString()}</h3>
          <p>${t("Total registros")}: ${filtradas.length}</p>
          <table>
            <thead>
              <tr>
                <th>${t("Codigo")}</th><th>${t("Cliente")}</th><th>${t("Total")}</th><th>${t("Etapa")}</th><th>${t("Responsable")}</th><th>${t("Entrega")}</th>
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

  if (!isAdminLike) {
    return (
      <MainLayout>
        <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm">
          <p className="text-lg font-bold text-[#1A334B] mb-1">{t("Acceso restringido")}</p>
          <p className="text-sm text-gray-600">{t("Solo administradores o supervisores pueden revisar y exportar informes de cotizaciones.")}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-[#4B6B8A] font-semibold flex items-center gap-2">
            <FileText size={16} /> {t("Informes")}
          </p>
          <h2 className="text-3xl font-extrabold text-[#1A334B]">{t("Historial de cotizaciones")}</h2>
          <p className="text-gray-600 text-sm">
            {t("Revisa y exporta las cotizaciones generadas por vendedores y bodegueros, filtrando por cliente, responsable y etapa.")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchCotizaciones}
            className="flex items-center gap-2 border border-[#D9E7F5] text-[#1A334B] font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all bg-white"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> {t("Actualizar")}
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 border border-[#D9E7F5] text-[#1A334B] font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all bg-white"
          >
            <ClipboardList size={16} /> {t("Exportar CSV")}
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {(Object.keys(resumenEtapa) as Etapa[]).map((etapa) => (
          <button
            key={etapa}
            onClick={() => setEtapaFiltro((prev) => (prev === etapa ? "Todos" : etapa))}
            className={`text-left bg-white border rounded-xl p-3 shadow-sm transition-all ${
              etapaFiltro === etapa ? "ring-2 ring-[#1A6CD3]/40 border-[#1A6CD3]" : "hover:shadow-md"
            } ${etapaColor[etapa]}`}
          >
            <p className="text-xs font-semibold text-gray-600 flex items-center justify-between">
              {t(etapa)}
              {etapaFiltro === etapa && <span className="text-[10px] px-2 py-0.5 bg-white/60 rounded-full">{t("Filtro")}</span>}
            </p>
            <p className="text-2xl font-bold text-[#1A334B]">{resumenEtapa[etapa]}</p>
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
              placeholder={t("Buscar por cliente, codigo o resumen")}
              className="bg-transparent text-sm outline-none"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F4F8FD] border border-[#D9E7F5] text-gray-700">
            <Users size={16} className="text-[#1A6CD3]" />
            <select value={clienteFiltro} onChange={(e) => setClienteFiltro(e.target.value)} className="bg-transparent text-sm outline-none">
              <option value="Todos">{t("Todos los clientes")}</option>
              {clientes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F4F8FD] border border-[#D9E7F5] text-gray-700">
            <User size={16} className="text-[#1A6CD3]" />
            <select
              value={responsableFiltro}
              onChange={(e) => setResponsableFiltro(e.target.value)}
              className="bg-transparent text-sm outline-none"
            >
              <option value="Todos">{t("Todos los responsables")}</option>
              {responsables.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F4F8FD] border border-[#D9E7F5] text-gray-700">
            <Filter size={16} className="text-[#1A6CD3]" />
            <select value={etapaFiltro} onChange={(e) => setEtapaFiltro(e.target.value as any)} className="bg-transparent text-sm outline-none">
              <option value="Todos">{t("Todas las etapas")}</option>
              {(Object.keys(etapaColor) as Etapa[]).map((e) => (
                <option key={e} value={e}>{t(e)}</option>
              ))}
            </select>
          </div>
          {(clienteFiltro !== "Todos" || responsableFiltro !== "Todos" || etapaFiltro !== "Todos" || busqueda) && (
            <button
              onClick={() => {
                setClienteFiltro("Todos");
                setResponsableFiltro("Todos");
                setEtapaFiltro("Todos");
                setBusqueda("");
              }}
              className="text-xs font-semibold text-[#1A334B] border border-[#D9E7F5] rounded-lg px-3 py-2 bg-white hover:bg-[#F4F8FD]"
            >
              {t("Limpiar filtros")}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[#1A334B] text-sm">
          <RefreshCw size={16} className="animate-spin" /> {t("Cargando cotizaciones...")}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F5FAFF] text-[#1A334B] text-left text-sm">
              <tr>
                <th className="py-3 px-4">{t("Codigo")}</th>
                <th className="py-3 px-4">{t("Cliente")}</th>
                <th className="py-3 px-4">{t("Total")}</th>
                <th className="py-3 px-4">{t("Etapa")}</th>
                <th className="py-3 px-4">{t("Responsable")}</th>
                <th className="py-3 px-4">{t("Entrega")}</th>
                <th className="py-3 px-4">{t("Notas")}</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSeleccion(c)}
                >
                  <td className="py-3 px-4 text-sm font-semibold text-[#1A334B]">{c.codigo}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{c.cliente}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{c.total}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${etapaColor[c.etapa]}`}>
                      {t(c.etapa)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">{c.vendedorEmail || t("Sin responsable")}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {c.entregaProgramada ? new Date(c.entregaProgramada).toLocaleString() : t("Sin programar")}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700 truncate max-w-[240px]" title={c.resumen || c.comentarios}>
                    {c.resumen || c.comentarios || t("N/A")}
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-sm text-gray-500">
                    {t("No hay cotizaciones para los filtros aplicados.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {seleccion && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#4B6B8A] font-semibold">{t("Detalle de cotizacion")}</p>
                <h3 className="text-xl font-bold text-[#1A334B]">#{seleccion.codigo} - {seleccion.cliente}</h3>
              </div>
              <button onClick={() => setSeleccion(null)} className="text-gray-500 hover:text-gray-700 text-sm">{t("Cerrar")}</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
              <p><strong>{t("Total")}:</strong> {seleccion.total}</p>
              <p><strong>{t("Etapa")}:</strong> {t(seleccion.etapa)}</p>
              <p><strong>{t("Responsable")}:</strong> {seleccion.vendedorEmail || t("Sin responsable")}</p>
              <p><strong>{t("Entrega")}:</strong> {seleccion.entregaProgramada ? new Date(seleccion.entregaProgramada).toLocaleString() : t("Sin programar")}</p>
              <p className="col-span-2"><strong>{t("Resumen")}:</strong> {seleccion.resumen || t("N/A")}</p>
              <p className="col-span-2"><strong>{t("Comentarios")}:</strong> {seleccion.comentarios || t("N/A")}</p>
              <div className="col-span-2">
                <p className="font-semibold text-[#1A334B] mb-1 flex items-center gap-2"><FileText size={14}/> {t("Historial")}</p>
                <div className="space-y-1">
                  {seleccion.historico.length === 0 && <p className="text-xs text-gray-500">{t("Sin eventos registrados.")}</p>}
                  {seleccion.historico.map((h, idx) => (
                    <div key={idx} className="text-xs text-gray-700 flex items-center gap-2">
                      <span className="text-[11px] text-gray-500">{h.fecha}</span>
                      <span>{h.nota}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 text-right">
              <button
                onClick={() => setSeleccion(null)}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD]"
              >
                {t("Cerrar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}










