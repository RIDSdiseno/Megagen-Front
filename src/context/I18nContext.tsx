import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "es" | "en" | "ko";

type DictionaryKey =
  | "dashboard"
  | "leads"
  | "clients"
  | "calendar"
  | "quotes"
  | "users"
  | "settings"
  | "logout"
  | "changePassword"
  | "config"
  | "crmTitle"
  | "platformSubtitle"
  | "language"
  | "selectVendor"
  | "all";

type Dictionary = Record<Language, Record<DictionaryKey, string>>;

const translations: Dictionary = {
  es: {
    dashboard: "Dashboard",
    leads: "Leads",
    clients: "Clientes",
    calendar: "Calendario",
    quotes: "Cotizaciones",
    users: "Usuarios",
    settings: "Configuracion",
    logout: "Cerrar sesion",
    changePassword: "Cambiar contrasena",
    config: "Configuracion",
    crmTitle: "MegaGen CRM",
    platformSubtitle: "Plataforma Comercial",
    language: "Idioma",
    selectVendor: "Seleccionar vendedor",
    all: "Todos",
  },
  en: {
    dashboard: "Dashboard",
    leads: "Leads",
    clients: "Clients",
    calendar: "Calendar",
    quotes: "Quotes",
    users: "Users",
    settings: "Settings",
    logout: "Sign out",
    changePassword: "Change password",
    config: "Settings",
    crmTitle: "MegaGen CRM",
    platformSubtitle: "Commercial Platform",
    language: "Language",
    selectVendor: "Select seller",
    all: "All",
  },
  ko: {
    dashboard: "대시보드",
    leads: "리드",
    clients: "고객",
    calendar: "캘린더",
    quotes: "견적",
    users: "사용자",
    settings: "설정",
    logout: "로그아웃",
    changePassword: "비밀번호 변경",
    config: "설정",
    crmTitle: "메가젠 CRM",
    platformSubtitle: "영업 플랫폼",
    language: "언어",
    selectVendor: "담당자 선택",
    all: "전체",
  },
};

type Ctx = {
  lang: Language;
  t: (key: DictionaryKey) => string;
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
      t: (key) => translations[lang][key] || translations.es[key] || key,
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
