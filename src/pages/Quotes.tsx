import { useEffect, useMemo, useState } from "react";
import MainLayout from "../components/MainLayout";
import Modal from "../components/Modal";
import { FileText, FolderKanban, ArrowRight, CheckCircle, Clock3, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";

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

const etapasOrden: Etapa[] = ["Cotizacion confirmada", "Despacho", "Transito", "Entregado"];
const periodos: Array<"Semana" | "Dia" | "Mes"> = ["Semana", "Dia", "Mes"];
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

const etapaColors: Record<Etapa, string> = {
  "Cotizacion confirmada": "bg-sky-100 text-sky-700 border-sky-200",
  "Despacho": "bg-amber-100 text-amber-700 border-amber-200",
  "Transito": "bg-purple-100 text-purple-700 border-purple-200",
  "Entregado": "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const tipoDocumentoPorEtapa: Record<Etapa, string> = {
  "Cotizacion confirmada": "Cotizacion",
  "Despacho": "Guia de despacho",
  "Transito": "Orden en transito",
  "Entregado": "Entrega final",
};

export default function CotizacionesPage() {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState<"Semana" | "Dia" | "Mes">("Semana");
  const [vista, setVista] = useState<"tarjetas" | "tabla">("tarjetas");
  const [busqueda, setBusqueda] = useState("");
  const [showRescate, setShowRescate] = useState(false);
  const [showNuevo, setShowNuevo] = useState(false);
  const [preview, setPreview] = useState<Cotizacion | null>(null);
  const [entregas, setEntregas] = useState<Record<number, string>>({});
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [etapaFiltro, setEtapaFiltro] = useState<Etapa | "Todos">("Todos");
  const [responsableFiltro, setResponsableFiltro] = useState<string>("Todos");
  const [showResponsableModal, setShowResponsableModal] = useState(false);
  const [buscadorResponsable, setBuscadorResponsable] = useState("");
  const [summary, setSummary] = useState<{ etapa: Etapa; total: number }[]>([]);
  const [confirmCambio, setConfirmCambio] = useState<{ id: number; nueva: Etapa; actual: Etapa } | null>(null);
  const [nueva, setNueva] = useState<Cotizacion>({
    id: 0,
    codigo: "NUEVA-001",
    cliente: "",
    fecha: new Date().toISOString().slice(0, 10),
    total: "$0",
    etapa: "Cotizacion confirmada",
    resumen: "",
    direccion: "",
    comentarios: "",
    archivos: [],
    historico: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [archivoDraft, setArchivoDraft] = useState<Record<number, string>>({});
  const [nuevoArchivo, setNuevoArchivo] = useState<File | null>(null);

  const isBodeguero = useMemo(() => (user?.roles || []).includes("bodeguero"), [user?.roles]);
  const isAdminLike = useMemo(
    () => (user?.roles || []).some((r) => r === "admin" || r === "superadmin" || r === "supervisor"),
    [user?.roles]
  );

  const authHeaders = useMemo<Record<string, string>>(() => {
    const headers: Record<string, string> = {};
    if (user?.token) headers.Authorization = `Bearer ${user.token}`;
    return headers;
  }, [user?.token]);

  const jsonHeaders = useMemo<Record<string, string>>(() => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (user?.token) headers.Authorization = `Bearer ${user.token}`;
    return headers;
  }, [user?.token]);

  const fetchQuotes = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (isBodeguero && user?.email) params.append("vendedorEmail", user.email);
      if (!isBodeguero && responsableFiltro !== "Todos") params.append("vendedorEmail", responsableFiltro);
      const resp = await fetch(`${API_URL}/quotes?${params.toString()}`, { headers: jsonHeaders });
      if (!resp.ok) throw new Error("No se pudieron cargar las cotizaciones");
      const data = (await resp.json()) as Cotizacion[];
      setCotizaciones(data);
      const entregasMap: Record<number, string> = {};
      data.forEach((c) => {
        if (c.entregaProgramada) entregasMap[c.id] = c.entregaProgramada;
      });
      setEntregas(entregasMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const resp = await fetch(`${API_URL}/quotes/summary`, { headers: jsonHeaders });
      if (!resp.ok) throw new Error("No se pudo cargar el resumen");
      const data = (await resp.json()) as { etapa: Etapa; total: number }[];
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  useEffect(() => {
    fetchQuotes();
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchQuotes();
    // resumen no cambia por filtro de responsable
  }, [responsableFiltro, isBodeguero, user?.email]);

  const agregarArchivo = (cotId: number, nombre: string) => {
    if (!nombre) return;
    setCotizaciones((prev) =>
      prev.map((c) => (c.id === cotId ? { ...c, archivos: [...c.archivos, nombre] } : c))
    );
  };

  const subirArchivo = async (cotId: number, file: File) => {
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const resp = await fetch(`${API_URL}/quotes/${cotId}/files`, {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });
      if (!resp.ok) throw new Error("No se pudo subir el archivo");
      const updated = (await resp.json()) as Cotizacion;
      setCotizaciones((prev) => prev.map((c) => (c.id === cotId ? updated : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir archivo");
    } finally {
      setLoading(false);
    }
  };

  const handleCrearCotizacion = async () => {
    if (!nueva.cliente || !nueva.total) return;
    setError("");
    try {
      const resp = await fetch(`${API_URL}/quotes`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(nueva),
      });
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error(e.message || "No se pudo crear la cotizacion");
      }
      let creada = (await resp.json()) as Cotizacion;

      if (nuevoArchivo) {
        const formData = new FormData();
        formData.append("file", nuevoArchivo);
        try {
          const uploadResp = await fetch(`${API_URL}/quotes/${creada.id}/files`, {
            method: "POST",
            headers: authHeaders,
            body: formData,
          });
          if (uploadResp.ok) {
            creada = (await uploadResp.json()) as Cotizacion;
          }
        } catch {
          /* ignore errores de upload para no bloquear creacion */
        }
      }

      setCotizaciones((prev) => [creada, ...prev]);
      setSummary((prev) => {
        const map = new Map<Etapa, number>();
        prev.forEach((s) => map.set(s.etapa, s.total));
        map.set(creada.etapa, (map.get(creada.etapa) || 0) + 1);
        return etapasOrden.map((etapa) => ({ etapa, total: map.get(etapa) || 0 }));
      });
      setShowNuevo(false);
      setNueva({
        ...nueva,
        cliente: "",
        total: "$0",
        resumen: "",
        direccion: "",
        comentarios: "",
        imagenUrl: "",
      });
      setNuevoArchivo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear cotizacion");
    }
  };

  const resumenPorEtapa = useMemo(() => {
    if (summary.length) return summary;
    return etapasOrden.map((etapa) => ({
      etapa,
      total: cotizaciones.filter((c) => c.etapa === etapa).length,
    }));
  }, [cotizaciones, summary]);

  const responsables = useMemo(() => {
    const set = new Set<string>();
    cotizaciones.forEach((c) => {
      if (c.vendedorEmail) set.add(c.vendedorEmail);
    });
    return Array.from(set);
  }, [cotizaciones]);

  const filtradas = useMemo(() => {
    const term = busqueda.toLowerCase();
    const respFilter = responsableFiltro === "Todos" ? null : responsableFiltro;
    const etapaFilter = etapaFiltro === "Todos" ? null : etapaFiltro;
    return cotizaciones.filter((c) => {
      const matchText =
        c.cliente.toLowerCase().includes(term) ||
        c.resumen.toLowerCase().includes(term) ||
        c.id.toString().includes(term) ||
        c.codigo.toLowerCase().includes(term);
      const matchResp = respFilter ? c.vendedorEmail === respFilter : true;
      const matchEtapa = etapaFilter ? c.etapa === etapaFilter : true;
      return matchText && matchResp && matchEtapa;
    });
  }, [busqueda, cotizaciones, responsableFiltro, etapaFiltro]);

  const aplicarCambioEtapa = async (id: number, nuevaEtapa: Etapa) => {
    setError("");
    try {
      const resp = await fetch(`${API_URL}/quotes/${id}/stage`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ etapa: nuevaEtapa }),
      });
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        setError(e.message || "No se pudo cambiar la etapa");
        if (e.historico) {
          setCotizaciones((prev) =>
            prev.map((c) => (c.id === id ? { ...c, historico: e.historico } : c))
          );
        }
        return;
      }
      const updated = (await resp.json()) as Cotizacion;
      setCotizaciones((prev) => prev.map((c) => (c.id === id ? updated : c)));
      fetchSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar etapa");
    }
  };

  const solicitarCambio = (id: number, direction: 1 | -1) => {
    const cot = cotizaciones.find((c) => c.id === id);
    if (!cot) return;

    const actualIndex = etapasOrden.indexOf(cot.etapa);
    const nextIndex = Math.min(Math.max(actualIndex + direction, 0), etapasOrden.length - 1);
    if (nextIndex === actualIndex) return;

    const nuevaEtapa = etapasOrden[nextIndex];
    const etapasCriticas = new Set<Etapa>(["Despacho", "Transito", "Entregado"]);

    if (etapasCriticas.has(cot.etapa) || etapasCriticas.has(nuevaEtapa)) {
      setConfirmCambio({ id, actual: cot.etapa, nueva: nuevaEtapa });
      return;
    }

    aplicarCambioEtapa(id, nuevaEtapa);
  };

  const handleScanDemo = async () => {
    setError("");
    try {
      const resp = await fetch(`${API_URL}/quotes/scan`, { method: "POST", headers: jsonHeaders });
      if (!resp.ok) throw new Error("No se pudo escanear");
      const data = await resp.json();
      setNueva((prev) => ({
        ...prev,
        direccion: data.direccion || prev.direccion,
        comentarios: data.comentarios || prev.comentarios,
        resumen: data.resumen || prev.resumen,
        total: data.total || prev.total,
        cliente: data.cliente || prev.cliente,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error en escaneo");
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <p className="text-sm uppercase tracking-wide text-[#4B6B8A] font-semibold">Cotizaciones / despacho</p>
          <h2 className="text-3xl font-extrabold text-[#1A334B]">Seguimiento de entregas y cotizaciones</h2>
          <p className="text-gray-600 text-sm">
            Rescata, registra y valida entregas. Adjunta fotos o documentos y revisa avance por etapa.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowRescate(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            <FolderKanban size={18} />
            Rescatar entregas
          </button>
          <button
            onClick={() => {
              fetchQuotes();
              fetchSummary();
            }}
            className="flex items-center gap-2 border border-[#D9E7F5] text-[#1A334B] font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 bg-white"
          >
            <RefreshCw size={16} /> Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        {resumenPorEtapa.map((item) => {
          const active = etapaFiltro === item.etapa;
          return (
            <button
              type="button"
              key={item.etapa}
              onClick={() => setEtapaFiltro((prev) => (prev === item.etapa ? "Todos" : item.etapa))}
              aria-pressed={active}
              className={`text-left bg-white border rounded-xl p-3 shadow-sm transition-all ${etapaColors[item.etapa]} bg-opacity-40 ${
                active ? "border-[#1A6CD3] ring-2 ring-[#1A6CD3]/40 shadow-md" : "hover:shadow-md"
              }`}
              title="Filtrar por estado"
            >
              <p className="text-xs font-semibold text-gray-500">{item.etapa}</p>
              <p className="text-2xl font-bold text-[#1A334B]">{item.total}</p>
              <div className="h-1.5 rounded-full bg-[#E6F0FB] mt-2 overflow-hidden">
                <span className="block h-full bg-[#1A6CD3]" style={{ width: `${Math.min(item.total * 25, 100)}%` }} />
              </div>
              <p className="text-[11px] text-[#1A334B] mt-2 font-semibold">
                {active ? "Filtro activo" : "Click para filtrar"}
              </p>
            </button>
          );
        })}
      </div>

      {etapaFiltro !== "Todos" && (
        <div className="flex items-center gap-2 mb-5 text-sm">
          <span className="text-[#1A334B] font-semibold">Filtro por estado:</span>
          <span className="px-3 py-1 rounded-full bg-[#E6F0FB] text-[#1A6CD3] text-xs font-semibold">{etapaFiltro}</span>
          <button
            onClick={() => setEtapaFiltro("Todos")}
            className="text-xs font-semibold text-[#1A334B] border border-[#D9E7F5] rounded-lg px-3 py-1 hover:bg-[#F4F8FD]"
          >
            Limpiar
          </button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 mb-5 flex items-center gap-3 flex-wrap">
        <span className="text-sm font-semibold text-[#1A334B]">Vista:</span>
        {periodos.map((p) => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={`px-3 py-2 text-xs font-semibold rounded-full border transition-all ${
              periodo === p
                ? "bg-[#1A6CD3] text-white border-[#1A6CD3] shadow-sm"
                : "bg-white text-[#1A334B] border-[#D9E7F5] hover:bg-[#F4F8FD]"
            }`}
          >
            {p}
          </button>
        ))}
        <span className="text-xs text-gray-500">* Rescate simulado por periodo para planificar descargas.</span>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {(isAdminLike || (!isAdminLike && !isBodeguero && responsables.length > 0)) && (
            <button
              onClick={() => setShowResponsableModal(true)}
              className="flex items-center gap-2 bg-white border border-[#D9E7F5] rounded-lg px-3 py-2 text-xs font-semibold text-[#1A334B] hover:bg-[#F4F8FD] shadow-sm"
            >
              Elegir responsable
              <span className="px-2 py-1 rounded-full bg-[#E6F0FB] text-[#1A6CD3] text-[11px]">
                {responsableFiltro === "Todos" ? "Todos" : responsableFiltro}
              </span>
            </button>
          )}
          <button
            onClick={() => setVista("tarjetas")}
            className={`px-3 py-2 text-xs font-semibold rounded-full border transition-all ${
              vista === "tarjetas"
                ? "bg-[#1A6CD3] text-white border-[#1A6CD3] shadow-sm"
                : "bg-white text-[#1A334B] border-[#D9E7F5] hover:bg-[#F4F8FD]"
            }`}
          >
            Vista tarjetas
          </button>
          <button
            onClick={() => setVista("tabla")}
            className={`px-3 py-2 text-xs font-semibold rounded-full border transition-all ${
              vista === "tabla"
                ? "bg-[#1A6CD3] text-white border-[#1A6CD3] shadow-sm"
                : "bg-white text-[#1A334B] border-[#D9E7F5] hover:bg-[#F4F8FD]"
            }`}
          >
            Vista horizontal
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F4F8FD] border border-[#D9E7F5] text-gray-600 w-full md:w-auto md:ml-2">
          <input
            type="text"
            placeholder="Buscar por cliente, resumen o ID..."
            className="flex-1 outline-none bg-transparent text-sm text-gray-700"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[#1A334B] text-sm">
          <Loader2 className="animate-spin" size={18} /> Cargando cotizaciones...
        </div>
      ) : vista === "tarjetas" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtradas.map((cot) => {
          const etapaIndex = etapasOrden.indexOf(cot.etapa);
          const progreso = ((etapaIndex + 1) / etapasOrden.length) * 100;
          const entregaGuardada = entregas[cot.id] || cot.entregaProgramada;

          return (
            <div
              key={cot.id}
              className="bg-white border border-[#E3ECF7] rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500">Entrega / Cotizacion #{cot.id}</p>
                  <h3 className="text-xl font-bold text-[#1A334B]">{cot.cliente}</h3>
                  <p className="text-sm text-gray-600">{cot.resumen}</p>
                <p className="text-xs text-gray-500 mt-1">Fecha: {cot.fecha} | Total: {cot.total}</p>
                <p className="text-xs text-gray-500">Direccion: {cot.direccion}</p>
                {cot.vendedorEmail && (
                  <p className="text-xs text-[#1A6CD3] font-semibold mt-1">Responsable: {cot.vendedorEmail}</p>
                )}
              </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full border ${etapaColors[cot.etapa]}`}
                >
                  {cot.etapa}
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Avance</span>
                  <span>{Math.round(progreso)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#E6F0FB] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F]" style={{ width: `${progreso}%` }} />
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-gray-600 mt-2">
                  {etapasOrden.map((etapa, idx) => (
                    <div key={etapa} className="flex items-center gap-1">
                      {idx <= etapaIndex ? (
                        <CheckCircle size={12} className="text-emerald-600" />
                      ) : (
                        <Clock3 size={12} className="text-gray-400" />
                      )}
                      <span>{etapa}</span>
                      {idx < etapasOrden.length - 1 && <ArrowRight size={10} className="text-gray-300" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 bg-[#F7FAFF] border border-[#D9E7F5] rounded-xl p-3">
                <p className="font-semibold text-[#1A334B] text-sm flex items-center gap-2">
                  <FolderKanban size={16} /> Archivos asociados
                </p>
                {cot.imagenUrl && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Foto de entrega</p>
                    <img src={cot.imagenUrl} alt="Foto entrega" className="w-full max-h-56 object-cover rounded-lg border border-[#D9E7F5]" />
                  </div>
                )}
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {cot.archivos.map((file) => {
                    const isLink = file.startsWith("http") || file.startsWith("/uploads");
                    return (
                      <li key={file} className="flex items-center gap-2">
                        <FileText size={14} className="text-[#1A6CD3]" />
                        {isLink ? (
                          <a href={file} className="text-[#1A6CD3] hover:underline truncate" target="_blank" rel="noreferrer">
                            {file}
                          </a>
                        ) : (
                          <span className="truncate">{file}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {(cot.etapa === "Cotizacion confirmada" || cot.etapa === "Despacho") ? (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      placeholder="Nombre de archivo"
                      className="flex-1 border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6CD3] bg-white"
                      value={archivoDraft[cot.id] ?? ""}
                      onChange={(e) => setArchivoDraft((prev) => ({ ...prev, [cot.id]: e.target.value }))}
                    />
                    <button
                      onClick={() => {
                        const nombre = (archivoDraft[cot.id] ?? "").trim();
                        if (!nombre) return;
                        agregarArchivo(cot.id, nombre);
                        setArchivoDraft((prev) => ({ ...prev, [cot.id]: "" }));
                      }}
                      className="px-3 py-2 text-xs font-semibold rounded-lg bg-[#1A6CD3] text-white hover:bg-[#0E4B8F] transition"
                    >
                      + Agregar
                    </button>
                    <label className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD] cursor-pointer">
                      Subir archivo
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) subirArchivo(cot.id, file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-gray-500">No se pueden agregar archivos en tránsito o entregado.</p>
                )}
              </div>

              <div className="mt-3 text-sm text-gray-700 bg-white border border-dashed border-[#D9E7F5] rounded-xl p-3">
                <p className="font-semibold text-[#1A334B]">Historico</p>
                <ul className="mt-1 space-y-1 text-xs text-gray-600">
                  {cot.historico.map((h, idx) => (
                    <li key={idx}>• {h.fecha} - {h.nota}</li>
                  ))}
                </ul>
                <p className="text-xs text-gray-500 mt-2">Comentarios: {cot.comentarios}</p>
              </div>

              {entregaGuardada && (
                <div className="mt-4 text-xs text-gray-600">
                  <span className="font-semibold text-[#1A334B]">Entrega registrada:</span> {entregaGuardada}
                </div>
              )}

              <div className="mt-4 flex gap-2 flex-wrap">
                <button
                  onClick={() => setPreview(cot)}
                  className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#1A6CD3] text-[#1A6CD3] hover:bg-[#E6F0FB] transition"
                >
                  Ver vista previa
                </button>
                <button
                  onClick={() => solicitarCambio(cot.id, -1)}
                  disabled={etapasOrden.indexOf(cot.etapa) === 0}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border ${
                    etapasOrden.indexOf(cot.etapa) === 0
                      ? "border-gray-200 text-gray-300 cursor-not-allowed"
                      : "border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD]"
                  } transition`}
                >
                  Retroceder
                </button>
                <button
                  onClick={() => solicitarCambio(cot.id, 1)}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-[#1A6CD3] text-white hover:bg-[#0E4B8F] transition"
                >
                  Avanzar etapa
                </button>
              </div>
            </div>
          );
        })}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-[#F5FAFF] text-[#1A334B] text-left">
              <tr>
                <th className="py-3 px-4 text-sm">ID</th>
                <th className="py-3 px-4 text-sm">Cliente</th>
                <th className="py-3 px-4 text-sm">Responsable</th>
                <th className="py-3 px-4 text-sm">Etapa</th>
                <th className="py-3 px-4 text-sm">Fecha</th>
                <th className="py-3 px-4 text-sm">Total</th>
                <th className="py-3 px-4 text-sm">Resumen</th>
                <th className="py-3 px-4 text-sm">Avance</th>
                <th className="py-3 px-4 text-sm">Entrega programada</th>
                <th className="py-3 px-4 text-sm">Archivos</th>
                <th className="py-3 px-4 text-sm text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((cot) => {
                const etapaIndex = etapasOrden.indexOf(cot.etapa);
                const progreso = ((etapaIndex + 1) / etapasOrden.length) * 100;
                const entregaGuardada = entregas[cot.id] || cot.entregaProgramada;
                return (
                  <tr key={cot.id} className="border-t border-gray-200 hover:bg-gray-50 transition">
                  <td className="py-3 px-4 text-sm text-gray-700 font-semibold">#{cot.id}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{cot.cliente}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{cot.vendedorEmail || "No asignado"}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${etapaColors[cot.etapa]}`}>
                      {cot.etapa}
                    </span>
                  </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{cot.fecha}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{cot.total}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <p>{cot.resumen}</p>
                      <p className="text-xs text-gray-500 mt-1">Direccion: {cot.direccion}</p>
                      <p className="text-xs text-gray-500">Comentarios: {cot.comentarios}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      <div className="flex flex-col gap-1">
                        <div className="h-2 w-full rounded-full bg-[#E6F0FB] overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F]" style={{ width: `${progreso}%` }} />
                        </div>
              <span className="text-xs text-gray-500">{Math.round(progreso)}% ({cot.etapa})</span>
            </div>
          </td>
          <td className="py-3 px-4 text-sm text-gray-700">
            {entregaGuardada ? entregaGuardada : <span className="text-gray-400">No registrada</span>}
          </td>
          <td className="py-3 px-4 text-sm text-gray-700">
            <div className="flex items-center gap-1">
              <FileText size={14} className="text-[#1A6CD3]" />
              <span>{cot.archivos.length}</span>
            </div>
            <div className="text-[11px] text-gray-600 mt-1 space-y-0.5">
              {cot.archivos.slice(0, 3).map((f) => (
                <p key={f} className="truncate">{f}</p>
              ))}
            </div>
            {(cot.etapa === "Cotizacion confirmada" || cot.etapa === "Despacho") ? (
              <div className="mt-2 space-y-1">
                <input
                  type="text"
                  placeholder="Nombre archivo"
                  className="w-full border border-[#D9E7F5] rounded-lg px-3 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A6CD3] bg-white"
                  value={archivoDraft[cot.id] ?? ""}
                  onChange={(e) => setArchivoDraft((prev) => ({ ...prev, [cot.id]: e.target.value }))}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const nombre = (archivoDraft[cot.id] ?? "").trim();
                      if (!nombre) return;
                      agregarArchivo(cot.id, nombre);
                      setArchivoDraft((prev) => ({ ...prev, [cot.id]: "" }));
                    }}
                    className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-[#1A6CD3] text-white hover:bg-[#0E4B8F] transition"
                  >
                    + Agregar
                  </button>
                  <label className="px-2 py-1 text-[11px] font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD] cursor-pointer">
                    Subir
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) subirArchivo(cot.id, file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-[11px] text-gray-500">Sin nuevos archivos en tránsito/entregado</p>
            )}
          </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setPreview(cot)}
                          className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#1A6CD3] text-[#1A6CD3] hover:bg-[#E6F0FB] transition whitespace-nowrap"
                        >
                          Vista previa
                        </button>
                        <button
                          onClick={() => solicitarCambio(cot.id, -1)}
                          disabled={etapasOrden.indexOf(cot.etapa) === 0}
                          className={`px-3 py-2 text-xs font-semibold rounded-lg border whitespace-nowrap ${
                            etapasOrden.indexOf(cot.etapa) === 0
                              ? "border-gray-200 text-gray-300 cursor-not-allowed"
                              : "border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD]"
                          } transition`}
                        >
                          Retroceder
                        </button>
                        <button
                          onClick={() => solicitarCambio(cot.id, 1)}
                          className="px-3 py-2 text-xs font-semibold rounded-lg bg-[#1A6CD3] text-white hover:bg-[#0E4B8F] transition whitespace-nowrap"
                        >
                          Avanzar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showResponsableModal && (
        <Modal onClose={() => setShowResponsableModal(false)}>
          <div className="p-5 space-y-3">
            <h3 className="text-xl font-bold text-[#1A334B]">Elegir responsable</h3>
            <input
              type="text"
              placeholder="Buscar por email..."
              value={buscadorResponsable}
              onChange={(e) => setBuscadorResponsable(e.target.value)}
              className="w-full border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A6CD3]"
            />
            <div className="max-h-64 overflow-auto divide-y divide-gray-100">
              <button
                className={`w-full text-left px-3 py-2 text-sm ${
                  responsableFiltro === "Todos" ? "bg-[#E6F0FB] text-[#1A6CD3]" : "hover:bg-[#F4F8FD] text-gray-700"
                }`}
                onClick={() => {
                  setResponsableFiltro("Todos");
                  setShowResponsableModal(false);
                }}
              >
                Todos
              </button>
              {responsables
                .filter((r) => r.toLowerCase().includes(buscadorResponsable.toLowerCase()))
                .map((r) => (
                  <button
                    key={r}
                    className={`w-full text-left px-3 py-2 text-sm ${
                      responsableFiltro === r ? "bg-[#E6F0FB] text-[#1A6CD3]" : "hover:bg-[#F4F8FD] text-gray-700"
                    }`}
                    onClick={() => {
                      setResponsableFiltro(r);
                      setShowResponsableModal(false);
                    }}
                  >
                    {r}
                  </button>
                ))}
            </div>
            <div className="flex justify-end">
              <button
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD]"
                onClick={() => setShowResponsableModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showRescate && (
        <Modal onClose={() => setShowRescate(false)}>
          <div className="p-5">
            <h3 className="text-xl font-bold text-[#1A334B] mb-2">Rescatar cotizaciones / despacho</h3>
            <p className="text-sm text-gray-600 mb-3">
              Escoge el periodo y selecciona las cotizaciones a cargar para su seguimiento.
            </p>

            <div className="flex gap-2 mb-4 flex-wrap">
              {periodos.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  className={`px-3 py-2 text-xs font-semibold rounded-full border transition-all ${
                    periodo === p
                      ? "bg-[#1A6CD3] text-white border-[#1A6CD3]"
                      : "bg-white text-[#1A334B] border-[#D9E7F5] hover:bg-[#F4F8FD]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="max-h-64 overflow-y-auto space-y-3 mb-4">
              {cotizaciones.map((cot) => (
                <div
                  key={cot.id}
                  className="border border-[#D9E7F5] rounded-lg p-3 hover:border-[#1A6CD3] transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#1A334B]">#{cot.id} | {cot.cliente}</p>
                      <p className="text-xs text-gray-600">Fecha: {cot.fecha} | {cot.total}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-[#E6F0FB] text-[#1A6CD3]">{cot.etapa}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{cot.resumen}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  setShowRescate(false);
                  setShowNuevo(true);
                }}
                className="flex-1 bg-white border border-[#1A6CD3] text-[#1A6CD3] py-2 rounded-lg font-semibold hover:bg-[#E6F0FB] transition"
              >
                Agregar manual
              </button>
              <button
                onClick={() => setShowRescate(false)}
                className="flex-1 bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] text-white py-2 rounded-lg font-semibold hover:shadow-lg transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {preview && (
        <Modal onClose={() => setPreview(null)}>
          <div className="p-5 space-y-3">
            <h3 className="text-xl font-bold text-[#1A334B]">Vista previa #{preview.id}</h3>
            <p className="text-sm text-gray-700"><strong>Cliente:</strong> {preview.cliente}</p>
            <p className="text-sm text-gray-700"><strong>Total:</strong> {preview.total}</p>
            <p className="text-sm text-gray-700"><strong>Resumen:</strong> {preview.resumen}</p>
            <p className="text-sm text-gray-700"><strong>Direccion:</strong> {preview.direccion}</p>
            <p className="text-sm text-gray-700"><strong>Comentarios:</strong> {preview.comentarios}</p>
            <p className="text-sm text-gray-700">
              <strong>Tipo de documento:</strong> {tipoDocumentoPorEtapa[preview.etapa] || "Cotizacion"}
            </p>
            <div className="text-sm text-gray-700">
              <p className="font-semibold text-[#1A334B] mb-1">Etapas</p>
              <div className="flex flex-wrap gap-2">
                {etapasOrden.map((etapa) => (
                  <span
                    key={etapa}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      etapa === preview.etapa
                        ? "bg-[#1A6CD3] text-white border-[#1A6CD3]"
                        : "bg-white text-[#1A334B] border-[#D9E7F5]"
                    }`}
                  >
                    {etapa}
                  </span>
                ))}
              </div>
            </div>
            {preview.imagenUrl && (
              <div className="text-sm text-gray-700">
                <p className="font-semibold text-[#1A334B] mb-1">Documento (imagen)</p>
                <img src={preview.imagenUrl} alt="Cotizacion" className="w-full rounded-lg border border-[#D9E7F5]" />
              </div>
            )}
            <div className="text-sm text-gray-700">
              <p className="font-semibold text-[#1A334B] mb-1">Archivos</p>
              <ul className="list-disc pl-5 space-y-1">
                {preview.archivos.map((file) => {
                  const isLink = file.startsWith("http") || file.startsWith("/uploads");
                  return (
                    <li key={file} className="truncate">
                      {isLink ? (
                        <a href={file} target="_blank" rel="noreferrer" className="text-[#1A6CD3] hover:underline">
                          {file}
                        </a>
                      ) : (
                        file
                      )}
                    </li>
                  );
                })}
              </ul>
              {preview.archivos.length > 0 && (preview.archivos[0].startsWith("http") || preview.archivos[0].startsWith("/uploads")) && (
                <button
                  onClick={() => window.open(preview.archivos[0], "_blank")}
                  className="mt-2 px-3 py-2 text-xs font-semibold rounded-lg border border-[#1A6CD3] text-[#1A6CD3] hover:bg-[#E6F0FB] transition"
                >
                  Abrir primer archivo
                </button>
              )}
            </div>
            <div className="text-sm text-gray-700">
              <p className="font-semibold text-[#1A334B] mb-1">Historico</p>
              <ul className="list-disc pl-5 space-y-1">
                {preview.historico.map((h, idx) => (
                  <li key={idx}>{h.fecha} - {h.nota}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setPreview(null)}
              className="w-full bg-megagen-primary hover:bg-megagen-dark text-white py-2 rounded-lg font-semibold transition"
            >
              Cerrar
            </button>
          </div>
      </Modal>
    )}

      {showNuevo && (
        <Modal onClose={() => setShowNuevo(false)}>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#1A334B]">Agregar cotizacion</h3>
              <button
                onClick={handleScanDemo}
                className="text-xs font-semibold text-[#1A6CD3] border border-[#1A6CD3] rounded-lg px-3 py-1 hover:bg-[#E6F0FB]"
              >
                Autocompletar (demo OCR)
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Cliente" value={nueva.cliente} onChange={(v) => setNueva({ ...nueva, cliente: v })} />
              <Input label="Fecha" type="date" value={nueva.fecha} onChange={(v) => setNueva({ ...nueva, fecha: v })} />
              <Input label="Total (texto)" value={nueva.total} onChange={(v) => setNueva({ ...nueva, total: v })} />
              <Input label="Resumen" value={nueva.resumen} onChange={(v) => setNueva({ ...nueva, resumen: v })} />
              <Input label="Direccion" value={nueva.direccion} onChange={(v) => setNueva({ ...nueva, direccion: v })} />
              <Input label="Comentarios" value={nueva.comentarios} onChange={(v) => setNueva({ ...nueva, comentarios: v })} />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#1A334B]">Etapa</span>
                <select
                  className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700"
                  value={nueva.etapa}
                  onChange={(e) => setNueva({ ...nueva, etapa: e.target.value as Etapa })}
                >
                  {etapasOrden.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Fecha/hora entrega"
                type="datetime-local"
                value={nueva.entregaProgramada || ""}
                onChange={(v) => setNueva({ ...nueva, entregaProgramada: v })}
              />
              <Input
                label="URL imagen (opcional)"
                value={nueva.imagenUrl || ""}
                onChange={(v) => setNueva({ ...nueva, imagenUrl: v })}
              />
            </div>
            <label className="flex flex-col gap-1 text-xs text-[#1A334B]">
              <span className="font-semibold">Adjuntar archivo / imagen</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setNuevoArchivo(e.target.files?.[0] ?? null)}
                className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
              />
              {nuevoArchivo && (
                <span className="text-[11px] text-gray-500">Seleccionado: {nuevoArchivo.name}</span>
              )}
            </label>
            <p className="text-xs text-gray-500">* En produccion, estas cotizaciones deberian llegar desde la API de rescate.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNuevo(false)}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-[#D9E7F5] text-[#1A334B] hover:bg-[#F4F8FD]"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearCotizacion}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] text-white"
              >
                Guardar
              </button>
            </div>
          </div>
        </Modal>
      )}

    {confirmCambio && (
      <Modal onClose={() => setConfirmCambio(null)}>
        <div className="p-5 space-y-3">
            <h3 className="text-xl font-bold text-[#1A334B]">Confirmar cambio</h3>
            <p className="text-sm text-gray-700">
              La cotizacion esta en <strong>{confirmCambio.actual}</strong>. ¿Mover a <strong>{confirmCambio.nueva}</strong>?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  aplicarCambioEtapa(confirmCambio.id, confirmCambio.nueva);
                  setConfirmCambio(null);
                }}
                className="flex-1 bg-[#1A6CD3] text-white py-2 rounded-lg font-semibold hover:bg-[#0E4B8F] transition"
              >
                Confirmar
              </button>
              <button
                onClick={() => setConfirmCambio(null)}
                className="flex-1 border border-[#D9E7F5] text-[#1A334B] py-2 rounded-lg font-semibold hover:bg-[#F4F8FD] transition"
              >
                Cancelar
              </button>
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
