import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LogoLogin from "../assets/LogoLogin.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const ok = login(email, password);

    if (ok) {
      navigate("/dashboard");
    } else {
      setError("❗ Credenciales incorrectas");
    }
  };

  return (
    <div
      className="
      min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-megagen-light via-megagen-primary to-megagen-dark 
      bg-[length:300%_300%] animate-[gradientFlow_8s_ease_infinite]
      text-gray-800 relative overflow-hidden
    "
    >

      {/* EFECTOS DE LUZ */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-10 w-60 h-60 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-200/20 rounded-full blur-2xl" />
        <div className="absolute top-1/3 left-1/2 w-32 h-32 bg-purple-200/10 rounded-full blur-xl" />
      </div>

      {/* CARD LOGIN */}
      <div
        className="
          relative z-20 bg-white/90 backdrop-blur-xl shadow-2xl 
          border border-white/60 rounded-2xl p-14 w-full max-w-xl 
          transition-transform transform hover:scale-[1.02]
        "
      >

        {/* LOGO LOGIN */}
        <div className="flex justify-center mb-8">
          <img
            src={LogoLogin}
            alt="Logo 3Dental"
            className="w-48 h-auto drop-shadow-xl animate-fadeIn"
          />
        </div>

        {/* TÍTULO DEL SISTEMA */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-megagen-dark tracking-tight drop-shadow-lg">
            3Dental CRM
          </h1>
          <p className="text-sm font-semibold text-megagen-primary uppercase tracking-[0.25em] mt-3">
            MegaGen · Gestión Dental
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
                w-full px-4 py-3 border border-megagen-light rounded-lg
                focus:outline-none focus:ring-4 focus:ring-megagen-primary/50
                focus:border-megagen-primary text-lg
                shadow-sm
              "
              placeholder="usuario@megagen.cl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              className="
                w-full px-4 py-3 border border-megagen-light rounded-lg
                focus:outline-none focus:ring-4 focus:ring-megagen-primary/50
                focus:border-megagen-primary text-lg
                shadow-sm
              "
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* MENSAJE DE ERROR */}
          {error && (
            <div className="text-red-500 text-sm font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="
              w-full py-3 bg-megagen-primary hover:bg-megagen-dark 
              text-white font-bold text-lg rounded-xl shadow-lg 
              transition-all hover:shadow-megagen-primary/40 hover:shadow-2xl
            "
          >
            Ingresar al CRM
          </button>

        </form>

        {/* FOOTER */}
        <div className="text-center mt-10 text-[12px] text-gray-500">
          © 2025 3Dental · MegaGen — Plataforma Clínica
        </div>

      </div>
    </div>
  );
}
