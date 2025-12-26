import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "es" | "en" | "ko";

type Dictionary = Record<Language, Record<string, string>>;

const translations: Dictionary = {
  es: {},
  en: {
    Dashboard: "Dashboard",
    Leads: "Leads",
    Clientes: "Clients",
    "Clientes listos": "Ready clients",
    Calendario: "Calendar",
    Reuniones: "Meetings",
    Cotizaciones: "Quotes",
    "Historial de cotizaciones": "Quote history",
    "Visitas a terreno": "Field visits",
    Usuarios: "Users",
    Configuracion: "Settings",
    "MegaGen CRM": "MegaGen CRM",
    "Plataforma Comercial": "Commercial Platform",
    "Cerrar sesion": "Sign out",
    "Cambiar contrasena": "Change password",
    Idioma: "Language",
    "Seleccionar vendedor": "Select vendor",
    Todos: "All",
    Notificaciones: "Notifications",
    Limpiar: "Clear",
    "Sin notificaciones": "No notifications",
    "Marcar como leida": "Mark as read",
    "Conectado como": "Signed in as",
    "Impersonando (origen: {email})": "Impersonating (source: {email})",
    "Salir de impersonacion": "Exit impersonation",
    "Logo MegaGen": "MegaGen logo",
    "Correo electronico": "Email",
    Contrasena: "Password",
    "Mostrar contrasena": "Show password",
    "Olvidaste tu contrasena?": "Forgot your password?",
    "Validando...": "Validating...",
    "Ingresar al CRM": "Sign in to CRM",
    "(c) 2025 MegaGen - Plataforma Comercial": "(c) 2025 MegaGen - Commercial Platform",
    "Credenciales incorrectas": "Invalid credentials",
    "Volver al login": "Back to login",
    "Recuperar acceso": "Recover access",
    "Ingresa tu correo y te enviaremos un enlace para restablecer tu contrasena.":
      "Enter your email and we'll send a link to reset your password.",
    "Correo de recuperacion enviado (simulado). Revisa tu bandeja.":
      "Recovery email sent (simulated). Check your inbox.",
    "Enviar enlace": "Send link",
    "Preferencias de usuario": "User preferences",
    "Gestiona perfil, seguridad y notificaciones desde un solo lugar.":
      "Manage profile, security, and notifications from one place.",
    Perfil: "Profile",
    "Datos de cuenta y contacto": "Account and contact data",
    Seguridad: "Security",
    "Contrasena y accesos": "Password and access",
    Alertas: "Alerts",
    "Correos y recordatorios": "Emails and reminders",
    "Actualiza tu informacion personal y de empresa.": "Update your personal and company information.",
    "Nombre completo": "Full name",
    Correo: "Email",
    Telefono: "Phone",
    Empresa: "Company",
    "Guardar perfil": "Save profile",
    "Cambia tu contrasena regularmente.": "Change your password regularly.",
    "Contrasena actual": "Current password",
    "Nueva contrasena": "New password",
    "Confirmar contrasena": "Confirm password",
    "Guardar contrasena": "Save password",
    "Controla los avisos que recibes.": "Control the alerts you receive.",
    "Emails de actividad (cotizaciones, leads, entregas)": "Activity emails (quotes, leads, deliveries)",
    "Notificaciones push en escritorio": "Desktop push notifications",
    "Recordatorios antes de reuniones": "Reminders before meetings",
    "Minutos antes del evento": "Minutes before the event",
    "20 minutos": "20 minutes",
    "30 minutos": "30 minutes",
    "60 minutos": "60 minutes",
    "Cerrar recordatorios al marcar reunion como entregada":
      "Close reminders when marking a meeting as delivered",
    "Guardar notificaciones": "Save notifications",
    Preferencias: "Preferences",
    "Idioma y zona horaria.": "Language and time zone.",
    Espanol: "Spanish",
    Ingles: "English",
    Koreano: "Korean",
    "Zona horaria": "Time zone",
    "Guardar preferencias": "Save preferences",
    "Nombre y correo son obligatorios": "Name and email are required",
    "Perfil actualizado": "Profile updated",
    "La nueva contrasena no coincide": "The new password does not match",
    "Contrasena actualizada (simulada)": "Password updated (simulated)",
    "Notificaciones guardadas": "Notifications saved",
    "Preferencias guardadas": "Preferences saved",
  },
  ko: {
    Dashboard: "대시보드",
    Leads: "리드",
    Clientes: "고객",
    "Clientes listos": "완료 고객",
    Calendario: "캘린더",
    Reuniones: "미팅",
    Cotizaciones: "견적",
    "Historial de cotizaciones": "견적 이력",
    "Visitas a terreno": "현장 방문",
    Usuarios: "사용자",
    Configuracion: "설정",
    "MegaGen CRM": "MegaGen CRM",
    "Plataforma Comercial": "상업 플랫폼",
    "Cerrar sesion": "로그아웃",
    "Cambiar contrasena": "비밀번호 변경",
    Idioma: "언어",
    "Seleccionar vendedor": "담당자 선택",
    Todos: "전체",
    Notificaciones: "알림",
    Limpiar: "지우기",
    "Sin notificaciones": "알림 없음",
    "Marcar como leida": "읽음으로 표시",
    "Conectado como": "다음 계정으로 로그인",
    "Impersonando (origen: {email})": "대리 접속 (원본: {email})",
    "Salir de impersonacion": "대리 모드 종료",
    "Logo MegaGen": "MegaGen 로고",
    "Correo electronico": "이메일",
    Contrasena: "비밀번호",
    "Mostrar contrasena": "비밀번호 표시",
    "Olvidaste tu contrasena?": "비밀번호를 잊으셨나요?",
    "Validando...": "확인 중...",
    "Ingresar al CRM": "CRM 로그인",
    "(c) 2025 MegaGen - Plataforma Comercial": "(c) 2025 MegaGen - 상업 플랫폼",
    "Credenciales incorrectas": "자격 증명이 올바르지 않습니다",
    "Volver al login": "로그인으로 돌아가기",
    "Recuperar acceso": "접속 복구",
    "Ingresa tu correo y te enviaremos un enlace para restablecer tu contrasena.":
      "이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.",
    "Correo de recuperacion enviado (simulado). Revisa tu bandeja.":
      "복구 이메일 전송됨(시뮬레이션). 받은편지함을 확인하세요.",
    "Enviar enlace": "링크 보내기",
    "Preferencias de usuario": "사용자 환경설정",
    "Gestiona perfil, seguridad y notificaciones desde un solo lugar.":
      "프로필, 보안, 알림을 한곳에서 관리하세요.",
    Perfil: "프로필",
    "Datos de cuenta y contacto": "계정 및 연락처 정보",
    Seguridad: "보안",
    "Contrasena y accesos": "비밀번호 및 접근",
    Alertas: "알림",
    "Correos y recordatorios": "이메일 및 리마인더",
    "Actualiza tu informacion personal y de empresa.": "개인 및 회사 정보를 업데이트하세요.",
    "Nombre completo": "전체 이름",
    Correo: "이메일",
    Telefono: "전화번호",
    Empresa: "회사",
    "Guardar perfil": "프로필 저장",
    "Cambia tu contrasena regularmente.": "비밀번호를 정기적으로 변경하세요.",
    "Contrasena actual": "현재 비밀번호",
    "Nueva contrasena": "새 비밀번호",
    "Confirmar contrasena": "비밀번호 확인",
    "Guardar contrasena": "비밀번호 저장",
    "Controla los avisos que recibes.": "수신 알림을 관리하세요.",
    "Emails de actividad (cotizaciones, leads, entregas)": "활동 이메일 (견적, 리드, 배송)",
    "Notificaciones push en escritorio": "데스크톱 푸시 알림",
    "Recordatorios antes de reuniones": "회의 전 리마인더",
    "Minutos antes del evento": "이벤트 전 알림 시간",
    "20 minutos": "20분",
    "30 minutos": "30분",
    "60 minutos": "60분",
    "Cerrar recordatorios al marcar reunion como entregada": "회의를 완료로 표시하면 리마인더 닫기",
    "Guardar notificaciones": "알림 저장",
    Preferencias: "환경설정",
    "Idioma y zona horaria.": "언어 및 시간대.",
    Espanol: "스페인어",
    Ingles: "영어",
    Koreano: "한국어",
    "Zona horaria": "시간대",
    "Guardar preferencias": "환경설정 저장",
    "Nombre y correo son obligatorios": "이름과 이메일은 필수입니다",
    "Perfil actualizado": "프로필이 업데이트되었습니다",
    "La nueva contrasena no coincide": "새 비밀번호가 일치하지 않습니다",
    "Contrasena actualizada (simulada)": "비밀번호가 업데이트되었습니다(시뮬레이션)",
    "Notificaciones guardadas": "알림이 저장되었습니다",
    "Preferencias guardadas": "환경설정이 저장되었습니다",
  },
};

type Ctx = {
  lang: Language;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLanguage: (lang: Language) => void;
};

const I18nContext = createContext<Ctx | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "en" || saved === "ko" || saved === "es") return saved;
    return "es";
  });

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      t: (key, params) => {
        const template = translations[lang][key] || translations.es[key] || key;
        if (!params) return template;
        return template.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
      },
      setLanguage: setLang,
    }),
    [lang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

