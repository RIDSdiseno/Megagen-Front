import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import LogoLogin from "../assets/logoLogin.png";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSent(true);
    setTimeout(() => navigate("/login"), 1200);
  };

  return (
    <div className="
      min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-[#0a1124] via-[#0b2c5c] to-[#0e7cc0]
      bg-[length:300%_300%] animate-[gradientFlow_14s_ease_infinite]
      text-gray-800 relative overflow-hidden px-4
    ">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-16 w-72 h-72 bg-cyan-300/25 rounded-full blur-3xl animate-[pulse_6s_ease_infinite]" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-sky-400/25 rounded-full blur-3xl animate-[pulse_9s_ease_infinite]" />
        <div className="absolute top-1/3 left-1/2 w-36 h-36 bg-blue-200/20 rounded-full blur-2xl animate-[pulse_7s_ease_infinite]" />
        <div className="absolute -bottom-16 left-1/4 w-64 h-64 bg-indigo-300/20 rounded-full blur-3xl animate-[pulse_11s_ease_infinite]" />
        <div className="absolute top-10 right-1/3 w-56 h-56 bg-cyan-100/25 rounded-full blur-[90px] animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
      </div>

      <div className="
        relative z-20 bg-white/95 backdrop-blur-xl shadow-[0_20px_70px_rgba(0,0,0,0.35)] 
        border border-white/70 rounded-[28px] p-8 w-full max-w-lg 
        transition-all transform hover:scale-[1.01] hover:shadow-[0_25px_90px_rgba(0,0,0,0.4)]
      ">
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-1 text-sm font-semibold text-[#1A334B] hover:text-[#0E4B8F] mb-4"
        >
          <ArrowLeft size={16} /> Volver al login
        </button>

        <div className="flex justify-center mb-6">
          <img src={LogoLogin} alt="Logo MegaGen" className="w-36 h-auto drop-shadow-xl" />
        </div>

        <h1 className="text-3xl font-extrabold text-[#1A334B] text-center mb-2">Recuperar acceso</h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-gray-700">
            Correo electrónico
            <div className="flex items-center gap-2 px-3 py-2 border border-[#D9E7F5] rounded-lg bg-white shadow-sm mt-1">
              <Mail size={16} className="text-[#1A6CD3]" />
              <input
                type="email"
                className="flex-1 outline-none text-sm text-gray-700"
                placeholder="usuario@megagen.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </label>

          {sent && (
            <div className="text-sm text-emerald-600 font-semibold">
              Correo de recuperación enviado (simulado). Revisa tu bandeja.
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-[#1A6CD3] to-[#0E4B8F] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition"
          >
            Enviar enlace
          </button>
        </form>
      </div>
    </div>
  );
}
