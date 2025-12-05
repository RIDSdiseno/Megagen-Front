import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
const logoLogin = "/LogoLogin.jpg";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Llamado directo a la API usando la variable de entorno VITE_API_URL
      const resp = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.message || "Credenciales incorrectas");
      }
      const data = (await resp.json()) as { token: string; user: { email: string; role?: string; roles?: string[] } };
      const roles = Array.isArray(data.user.roles)
        ? data.user.roles
        : data.user.role
        ? [data.user.role]
        : [];
      setSession({ email: data.user.email, roles: roles as any, token: data.token });

      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored) as { roles?: string[] };
        if (parsed.roles?.includes("bodeguero")) {
          navigate("/cotizaciones");
          return;
        }
      }
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Credenciales incorrectas";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="
      min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-[#0a1124] via-[#0b2c5c] to-[#0e7cc0]
      bg-[length:300%_300%] animate-[gradientFlow_14s_ease_infinite]
      text-gray-800 relative overflow-hidden px-4
    ">

      {/* EFECTOS DE LUZ */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-16 w-72 h-72 bg-cyan-300/25 rounded-full blur-3xl animate-[pulse_6s_ease_infinite]" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-sky-400/25 rounded-full blur-3xl animate-[pulse_9s_ease_infinite]" />
        <div className="absolute top-1/3 left-1/2 w-36 h-36 bg-blue-200/20 rounded-full blur-2xl animate-[pulse_7s_ease_infinite]" />
        <div className="absolute -bottom-16 left-1/4 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl animate-[pulse_11s_ease_infinite]" />
        <div className="absolute top-10 right-1/3 w-56 h-56 bg-cyan-100/25 rounded-full blur-[90px] animate-pulse" />
        {/* Líneas animadas */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-[-20%] w-[140%] h-12 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-xl animate-[slide_12s_linear_infinite]" />
          <div className="absolute top-1/2 left-[-30%] w-[150%] h-10 bg-gradient-to-r from-transparent via-cyan-300/15 to-transparent blur-xl animate-[slide_14s_linear_infinite_reverse]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
      </div>

      {/* CARD LOGIN */}
      <div className="
        relative z-20 bg-white/95 backdrop-blur-xl shadow-[0_20px_70px_rgba(0,0,0,0.35)] 
        border border-white/70 rounded-[28px] p-10 w-full max-w-xl 
        transition-all transform hover:scale-[1.01] hover:shadow-[0_25px_90px_rgba(0,0,0,0.4)]
      ">
        {/* Líneas decorativas */}
        <div className="absolute -top-2 left-8 w-28 h-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 blur-sm opacity-80 animate-pulse" />
        <div className="absolute -bottom-3 right-8 w-32 h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-300 blur-sm opacity-80 animate-pulse" />

        {/* LOGO LOGIN */}
        <div className="flex justify-center mb-8">
          <img
            src={logoLogin}
            alt="Logo MegaGen"
            className="w-48 h-auto drop-shadow-xl animate-fadeIn"
          />
        </div>

        {/* TÍTULO DEL SISTEMA */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-megagen-dark tracking-tight drop-shadow-lg">
            MegaGen CRM
          </h1>
          <p className="text-sm font-semibold text-megagen-primary uppercase tracking-[0.25em] mt-3">
            Plataforma Comercial
          </p>
        </div>

        {/* FORMULARIO */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              className="
                w-full px-4 py-3 border border-[#D9E7F5] rounded-lg
                focus:outline-none focus:ring-4 focus:ring-megagen-primary/50
                focus:border-megagen-primary text-lg bg-white
                shadow-sm text-gray-800
              "
              placeholder="usuario@megagen.cl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="
                  w-full px-4 py-3 border border-[#D9E7F5] rounded-lg
                  focus:outline-none focus:ring-4 focus:ring-megagen-primary/50
                  focus:border-megagen-primary text-lg bg-white
                  shadow-sm text-gray-800
                "
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* MENSAJE DE ERROR */}
          {error && (
            <div className="text-red-500 text-sm font-semibold">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate("/forgot")}
              className="text-sm font-semibold text-megagen-primary hover:text-megagen-dark"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="
              w-full py-3 bg-megagen-primary hover:bg-megagen-dark 
              text-white font-bold text-lg rounded-xl shadow-lg 
              transition-all hover:shadow-megagen-primary/40 hover:shadow-2xl
              disabled:opacity-70 disabled:cursor-not-allowed
            "
          >
            {loading ? "Validando..." : "Ingresar al CRM"}
          </button>

        </form>

        {/* FOOTER */}
        <div className="text-center mt-10 text-[12px] text-gray-600">
          © 2025 MegaGen — Plataforma Comercial
        </div>

      </div>
    </div>
  );
}
