import { useEffect, useState, type ReactNode } from "react";
import MainLayout from "../components/MainLayout";
import { Settings, Shield, Bell, Globe2, Lock } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";

type Perfil = { nombre: string; correo: string; telefono: string; empresa: string };
type Seguridad = { actual: string; nueva: string; confirmar: string };
type Notif = { email: boolean; push: boolean; recordatorios: boolean; minutosAntes: number; autoCerrar: boolean };
type Preferencias = { idioma: string; zonaHoraria: string };

const STORAGE_KEY = "megagen_settings";

const defaultSettings = (email: string | undefined) => ({
  perfil: { nombre: "", correo: email || "", telefono: "", empresa: "" } as Perfil,
  notificaciones: { email: true, push: true, recordatorios: true, minutosAntes: 20, autoCerrar: true } as Notif,
  preferencias: { idioma: "es", zonaHoraria: "America/Santiago" } as Preferencias,
});

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const { lang, setLanguage, t } = useI18n();
  const location = useLocation();
  const [perfil, setPerfil] = useState<Perfil>(() => defaultSettings(user?.email).perfil);
  const [seguridad, setSeguridad] = useState<Seguridad>({ actual: "", nueva: "", confirmar: "" });
  const [notificaciones, setNotificaciones] = useState<Notif>(() => defaultSettings(user?.email).notificaciones);
  const [preferencias, setPreferencias] = useState<Preferencias>(() => defaultSettings(user?.email).preferencias);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!location.hash) return;
    const targetId = location.hash.replace("#", "");
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { perfil: Perfil; notificaciones: Notif; preferencias: Preferencias };
      setPerfil(parsed.perfil);
      setNotificaciones(parsed.notificaciones);
      setPreferencias(parsed.preferencias);
    } catch {
      /* ignore */
    }
  }, []);

  const persist = (data: { perfil: Perfil; notificaciones: Notif; preferencias: Preferencias }) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const handleSavePerfil = () => {
    if (!perfil.nombre || !perfil.correo) {
      setError("Nombre y correo son obligatorios");
      return;
    }
    const next = { perfil, notificaciones, preferencias };
    persist(next);
    setMessage("Perfil actualizado");
    setError("");
  };

  const handleSaveSeguridad = () => {
    if (!seguridad.nueva || seguridad.nueva !== seguridad.confirmar) {
      setError("La nueva contrasena no coincide");
      return;
    }
    setSeguridad({ actual: "", nueva: "", confirmar: "" });
    setMessage("Contrasena actualizada (simulada)");
    setError("");
  };

  const handleSaveNotificaciones = () => {
    const next = { perfil, notificaciones, preferencias };
    persist(next);
    setMessage("Notificaciones guardadas");
    setError("");
  };

  const handleSavePreferencias = () => {
    const next = { perfil, notificaciones, preferencias };
    persist(next);
    setMessage("Preferencias guardadas");
    setError("");
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <p className="text-sm uppercase tracking-wide text-[#4B6B8A] font-semibold">{t("settings")}</p>
          <h2 className="text-3xl font-extrabold text-[#1A334B]">Preferencias de usuario</h2>
          <p className="text-gray-600 text-sm">
            Gestiona perfil, seguridad y notificaciones desde un solo lugar.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <InfoCard icon={<Settings className="w-5 h-5" />} title="Perfil" desc="Datos de cuenta y contacto" />
        <InfoCard icon={<Shield className="w-5 h-5" />} title="Seguridad" desc="Contrasena y accesos" />
        <InfoCard icon={<Bell className="w-5 h-5" />} title="Alertas" desc="Correos y recordatorios" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Perfil */}
        <section id="perfil" className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <header className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-[#1A334B]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1A334B]">Perfil</h3>
              <p className="text-gray-600 text-sm">Actualiza tu informacion personal y de empresa.</p>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre completo"
              value={perfil.nombre}
              onChange={(v) => setPerfil((p) => ({ ...p, nombre: v }))}
            />
            <Input
              label="Correo"
              value={perfil.correo}
              onChange={(v) => setPerfil((p) => ({ ...p, correo: v }))}
            />
            <Input
              label="Telefono"
              value={perfil.telefono}
              onChange={(v) => setPerfil((p) => ({ ...p, telefono: v }))}
            />
            <Input
              label="Empresa"
              value={perfil.empresa}
              onChange={(v) => setPerfil((p) => ({ ...p, empresa: v }))}
            />
          </div>

          <div className="mt-4">
            <button
              onClick={handleSavePerfil}
              className="px-4 py-2 bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] text-white font-semibold rounded-lg shadow hover:shadow-lg transition"
            >
              Guardar perfil
            </button>
          </div>
        </section>

        {/* Seguridad */}
        <section id="seguridad" className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <header className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-[#1A334B]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1A334B]">Seguridad</h3>
              <p className="text-gray-600 text-sm">Cambia tu contrasena regularmente.</p>
            </div>
          </header>

          <div className="space-y-3">
            <Input
              label="Contrasena actual"
              type="password"
              value={seguridad.actual}
              onChange={(v) => setSeguridad((s) => ({ ...s, actual: v }))}
            />
            <Input
              label="Nueva contrasena"
              type="password"
              value={seguridad.nueva}
              onChange={(v) => setSeguridad((s) => ({ ...s, nueva: v }))}
            />
            <Input
              label="Confirmar contrasena"
              type="password"
              value={seguridad.confirmar}
              onChange={(v) => setSeguridad((s) => ({ ...s, confirmar: v }))}
            />
          </div>

          <div className="mt-4">
            <button
              onClick={handleSaveSeguridad}
              className="px-4 py-2 bg-[#1A334B] text-white font-semibold rounded-lg shadow hover:bg-[#0f2237] transition"
            >
              Guardar contrasena
            </button>
          </div>
        </section>

        {/* Notificaciones */}
        <section id="notificaciones" className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <header className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-[#1A334B]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1A334B]">Notificaciones</h3>
              <p className="text-gray-600 text-sm">Controla los avisos que recibes.</p>
            </div>
          </header>

          <div className="space-y-3">
            <Toggle
              label="Emails de actividad (cotizaciones, leads, entregas)"
              value={notificaciones.email}
              onChange={(v) => setNotificaciones((n) => ({ ...n, email: v }))}
            />
            <Toggle
              label="Notificaciones push en escritorio"
              value={notificaciones.push}
              onChange={(v) => setNotificaciones((n) => ({ ...n, push: v }))}
            />
            <Toggle
              label="Recordatorios antes de reuniones"
              value={notificaciones.recordatorios}
              onChange={(v) => setNotificaciones((n) => ({ ...n, recordatorios: v }))}
            />
            <Select
              label="Minutos antes del evento"
              value={String(notificaciones.minutosAntes)}
              opciones={[
                { value: "20", label: "20 minutos" },
                { value: "30", label: "30 minutos" },
                { value: "60", label: "60 minutos" },
              ]}
              onChange={(v) => setNotificaciones((n) => ({ ...n, minutosAntes: Number(v) }))}
            />
            <Toggle
              label="Cerrar recordatorios al marcar reunion como entregada"
              value={notificaciones.autoCerrar}
              onChange={(v) => setNotificaciones((n) => ({ ...n, autoCerrar: v }))}
            />
          </div>

          <div className="mt-4">
            <button
              onClick={handleSaveNotificaciones}
              className="px-4 py-2 bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] text-white font-semibold rounded-lg shadow hover:shadow-lg transition"
            >
              Guardar notificaciones
            </button>
          </div>
        </section>

        {/* Preferencias */}
        <section id="preferencias" className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <header className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-[#1A334B]">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1A334B]">Preferencias</h3>
              <p className="text-gray-600 text-sm">Idioma y zona horaria.</p>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Idioma"
              value={lang}
              opciones={[
                { value: "es", label: "Espanol" },
                { value: "en", label: "Ingles" },
                { value: "ko", label: "Koreano" },
              ]}
              onChange={(v) => {
                setLanguage(v as any);
                setPreferencias((p) => ({ ...p, idioma: v }));
                persist({ perfil, notificaciones, preferencias: { ...preferencias, idioma: v } });
              }}
            />
            <Select
              label="Zona horaria"
              value={preferencias.zonaHoraria}
              opciones={[
                { value: "America/Santiago", label: "America/Santiago" },
                { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires" },
                { value: "UTC", label: "UTC" },
                { value: "Asia/Seoul", label: "Asia/Seoul" },
                { value: "Europe/Madrid", label: "Europe/Madrid" },
              ]}
              onChange={(v) => setPreferencias((p) => ({ ...p, zonaHoraria: v }))}
            />
          </div>

          <div className="mt-4">
            <button
              onClick={handleSavePreferencias}
              className="px-4 py-2 bg-[#1A334B] text-white font-semibold rounded-lg shadow hover:bg-[#0f2237] transition"
            >
              Guardar preferencias
            </button>
          </div>
        </section>

        {(message || error) && (
          <div className={`lg:col-span-2 p-3 rounded-lg border ${error ? "border-amber-300 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
            {error || message}
          </div>
        )}

      </div>
    </MainLayout>
  );
}

function InfoCard({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="p-4 rounded-xl bg-white border border-[#D9E7F5] shadow-sm flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#F4F8FD] flex items-center justify-center text-[#1A6CD3]">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-[#1A334B]">{title}</p>
        <p className="text-xs text-gray-600">{desc}</p>
      </div>
    </div>
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
    <label className="flex flex-col gap-1 text-sm text-[#1A334B]">
      <span className="font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1A6CD3] bg-white"
      />
    </label>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 p-3 border border-[#E6EDF7] rounded-lg hover:bg-[#F7FAFF] transition">
      <span className="text-sm text-gray-700">{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 text-[#1A6CD3] rounded focus:ring-[#1A6CD3]"
      />
    </label>
  );
}

function Select({
  label,
  value,
  opciones,
  onChange,
}: {
  label: string;
  value: string;
  opciones: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-[#1A334B]">
      <span className="font-semibold">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-[#D9E7F5] rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1A6CD3]"
      >
        {opciones.map((op) => (
          <option key={op.value} value={op.value}>{op.label}</option>
        ))}
      </select>
    </label>
  );
}
