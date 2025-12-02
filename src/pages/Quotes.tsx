import { useMemo, useState } from "react";
import MainLayout from "../components/MainLayout";
import Modal from "../components/Modal";
import { FileText, FolderKanban, ArrowRight, CheckCircle, Clock3 } from "lucide-react";

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
};

const etapasOrden: Etapa[] = ["Cotizacion confirmada", "Despacho", "Transito", "Entregado"];

const cotizacionesData: Cotizacion[] = [
  {
    id: 101,
    codigo: "COT-101",
    cliente: "Clinica Smile",
    fecha: "2025-12-01",
    total: "$2.450.000",
    etapa: "Cotizacion confirmada",
    resumen: "Implantes premium y guia quirurgica personalizada.",
    direccion: "AV Ramon Picarte 427, Oficina 409, Valdivia",
    comentarios: "Enviar a la misma direccion de despacho. Contacto: Daniel Carvajal.",
    imagenUrl: "https://via.placeholder.com/800x1100?text=Cotizacion+Clinica+Smile",
    archivos: ["Cotizacion_101.pdf", "GuiaSmile.stl"],
    historico: [
      { fecha: "2025-12-01 09:00", nota: "Cotizacion enviada" },
      { fecha: "2025-12-02 14:00", nota: "Cliente revisa y pide descuento" },
    ],
    entregaProgramada: "2025-12-05T15:00",
  },
  {
    id: 205,
    codigo: "COT-205",
    cliente: "Dr. Perez",
    fecha: "2025-12-02",
    total: "$1.180.000",
    etapa: "Despacho",
    resumen: "Kit de implantes y componentes de laboratorio.",
    direccion: "Av. America 2280, Conchali, Santiago",
    comentarios: "Despachar a Matta 22, confirmar recepción.",
    archivos: ["Cotizacion_205.pdf", "OrdenCompra.png"],
    historico: [
      { fecha: "2025-12-02 10:00", nota: "Cotizacion aprobada" },
      { fecha: "2025-12-03 11:30", nota: "Despacho generado" },
    ],
    entregaProgramada: "2025-12-06T11:00",
  },
  {
    id: 309,
    codigo: "COT-309",
    cliente: "SmileLab",
    fecha: "2025-12-03",
    total: "$3.050.000",
    etapa: "Transito",
    resumen: "Pedido consolidado de implantes y aditamentos.",
    direccion: "Av. Providencia 1001, Oficina 1203, Santiago",
    comentarios: "Registrar entrega con foto del albarán.",
    archivos: ["Cotizacion_309.pdf"],
    historico: [
      { fecha: "2025-12-03 08:00", nota: "Cotizacion confirmada" },
      { fecha: "2025-12-04 16:00", nota: "Despacho enviado" },
    ],
  },
];

const periodos: Array<"Semana" | "Dia" | "Mes"> = ["Semana", "Dia", "Mes"];

export default function CotizacionesPage() {
  const [periodo, setPeriodo] = useState<"Semana" | "Dia" | "Mes">("Semana");
  const [vista, setVista] = useState<"tarjetas" | "tabla">("tarjetas");
  const [busqueda, setBusqueda] = useState("");
  const [showRescate, setShowRescate] = useState(false);
  const [showNuevo, setShowNuevo] = useState(false);
  const [preview, setPreview] = useState<Cotizacion | null>(null);
  const [entregas, setEntregas] = useState<Record<number, string>>({});
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>(cotizacionesData);
  const [confirmCambio, setConfirmCambio] = useState<{
    id: number;
    actual: Etapa;
    nueva: Etapa;
  } | null>(null);
  const [nueva, setNueva] = useState<Cotizacion>({
    id: Math.max(...cotizacionesData.map((c) => c.id)) + 1,
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

  const handleCrearCotizacion = () => {
    if (!nueva.cliente || !nueva.total) return;
    const nextId = cotizaciones.length ? Math.max(...cotizaciones.map((c) => c.id)) + 1 : 1;
    const nuevaCot = { ...nueva, id: nextId, codigo: `COT-${nextId}` };
    setCotizaciones([nuevaCot, ...cotizaciones]);
    setShowNuevo(false);
    setNueva({
      id: nextId + 1,
      codigo: `COT-${nextId + 1}`,
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
  };

  const resumenPorEtapa = useMemo(() => {
    return etapasOrden.map((etapa) => ({
      etapa,
      total: cotizaciones.filter((c) => c.etapa === etapa).length,
    }));
  }, [cotizaciones]);

  const filtradas = useMemo(() => {
    const term = busqueda.toLowerCase();
    return cotizaciones.filter(
      (c) =>
        c.cliente.toLowerCase().includes(term) ||
        c.resumen.toLowerCase().includes(term) ||
        c.id.toString().includes(term)
    );
  }, [busqueda, cotizaciones]);

  const handleRegistrarEntrega = (id: number, fecha: string) => {
    setEntregas((prev) => ({ ...prev, [id]: fecha }));
  };

  const aplicarCambioEtapa = (id: number, nuevaEtapa: Etapa) => {
    setCotizaciones((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const ahora = new Date().toLocaleString("es-CL");
        const nuevoHistorico = [
          ...c.historico,
          { fecha: ahora, nota: `Etapa cambiada a ${nuevaEtapa}` },
        ];
        return { ...c, etapa: nuevaEtapa, historico: nuevoHistorico };
      })
    );
  };

  const solicitarCambio = (id: number, direction: 1 | -1) => {
    const cot = cotizaciones.find((c) => c.id === id);
    if (!cot) return;

    const actualIndex = etapasOrden.indexOf(cot.etapa);
    const nextIndex = Math.min(Math.max(actualIndex + direction, 0), etapasOrden.length - 1);
    if (nextIndex === actualIndex) return;
    // Bloquear retroceso desde Entregado
    if (cot.etapa === "Entregado" && direction === -1) {
      window.alert("Esta cotizacion ya está entregada; no se puede retroceder.");
      return;
    }

    const nuevaEtapa = etapasOrden[nextIndex];
    const etapasCriticas = new Set<Etapa>(["Despacho", "Transito", "Entregado"]);

    if (etapasCriticas.has(cot.etapa) || etapasCriticas.has(nuevaEtapa)) {
      setConfirmCambio({ id, actual: cot.etapa, nueva: nuevaEtapa });
      return;
    }

    aplicarCambioEtapa(id, nuevaEtapa);
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <p className="text-sm uppercase tracking-wide text-[#4B6B8A] font-semibold">Cotizaciones y archivos</p>
          <h2 className="text-3xl font-extrabold text-[#1A334B]">Seguimiento de cotizaciones</h2>
          <p className="text-gray-600 text-sm">
            Rescata cotizaciones, revisa avances por etapa y registra entregas con respaldo de archivos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowRescate(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            <FolderKanban size={18} />
            Rescatar cotizaciones
          </button>
          <button
            onClick={() => setShowNuevo(true)}
            className="flex items-center gap-2 border border-[#1A6CD3] text-[#1A6CD3] font-semibold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 bg-white"
          >
            <FileText size={18} />
            Agregar cotizacion
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {resumenPorEtapa.map((item) => (
          <div
            key={item.etapa}
            className="bg-white border border-[#D9E7F5] rounded-xl p-3 shadow-sm hover:shadow-md transition-all"
          >
            <p className="text-xs font-semibold text-gray-500">{item.etapa}</p>
            <p className="text-2xl font-bold text-[#1A334B]">{item.total}</p>
            <div className="h-1.5 rounded-full bg-[#E6F0FB] mt-2 overflow-hidden">
              <span className="block h-full bg-[#1A6CD3]" style={{ width: `${Math.min(item.total * 25, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

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

        <div className="flex items-center gap-2 ml-auto">
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

      {vista === "tarjetas" ? (
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
                  <p className="text-xs text-gray-500">Cotizacion #{cot.id}</p>
                  <h3 className="text-xl font-bold text-[#1A334B]">{cot.cliente}</h3>
                  <p className="text-sm text-gray-600">{cot.resumen}</p>
                <p className="text-xs text-gray-500 mt-1">Fecha: {cot.fecha} · Total: {cot.total}</p>
                <p className="text-xs text-gray-500">Dirección: {cot.direccion}</p>
              </div>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#E6F0FB] text-[#1A6CD3]">
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
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {cot.archivos.map((file) => (
                    <li key={file} className="flex items-center gap-2">
                      <FileText size={14} className="text-[#1A6CD3]" />
                      {file}
                    </li>
                  ))}
                </ul>
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

              <div className="mt-4 flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-600">Registrar fecha y hora de entrega</label>
                <div className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    className="flex-1 border border-[#D9E7F5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6CD3] bg-white"
                    value={entregaGuardada || ""}
                    onChange={(e) => handleRegistrarEntrega(cot.id, e.target.value)}
                  />
                  <button
                    onClick={() => handleRegistrarEntrega(cot.id, entregaGuardada || "")}
                    className="px-3 py-2 text-xs font-semibold bg-[#1A6CD3] text-white rounded-lg shadow hover:bg-[#0E4B8F] transition"
                  >
                    Guardar
                  </button>
                </div>
                {entregaGuardada && (
                  <p className="text-xs text-gray-500">Entrega registrada: {entregaGuardada}</p>
                )}
              </div>

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
                    <td className="py-3 px-4 text-sm">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[#E6F0FB] text-[#1A6CD3]">
                        {cot.etapa}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{cot.fecha}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{cot.total}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <p>{cot.resumen}</p>
                      <p className="text-xs text-gray-500 mt-1">Dirección: {cot.direccion}</p>
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

      {showRescate && (
        <Modal onClose={() => setShowRescate(false)}>
          <div className="p-5">
            <h3 className="text-xl font-bold text-[#1A334B] mb-2">Rescatar cotizaciones</h3>
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
                      <p className="text-sm font-semibold text-[#1A334B]">#{cot.id} · {cot.cliente}</p>
                      <p className="text-xs text-gray-600">Fecha: {cot.fecha} · {cot.total}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-[#E6F0FB] text-[#1A6CD3]">{cot.etapa}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{cot.resumen}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowRescate(false)}
              className="w-full bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] text-white py-2 rounded-lg font-semibold hover:shadow-lg transition"
            >
              Cargar cotizaciones seleccionadas
            </button>
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
            <p className="text-sm text-gray-700"><strong>Dirección:</strong> {preview.direccion}</p>
            <p className="text-sm text-gray-700"><strong>Comentarios:</strong> {preview.comentarios}</p>
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
                {preview.archivos.map((file) => <li key={file}>{file}</li>)}
              </ul>
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
            <h3 className="text-xl font-bold text-[#1A334B]">Agregar cotizacion</h3>
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
            <p className="text-xs text-gray-500">* En producción, estas cotizaciones deberían llegar desde la API de rescate.</p>
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
