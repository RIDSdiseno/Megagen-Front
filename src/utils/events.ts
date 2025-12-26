export type StoredEvent = {
  id: string;
  title: string;
  start: string; // ISO
  end: string;   // ISO
  paciente?: string;
  telefono?: string;
  correo?: string;
  estado?: string;
  resumen?: string;
  ownerEmail?: string;
};

const KEY = "megagen_events";

function read(): StoredEvent[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

export function getStoredEvents(): StoredEvent[] {
  return read();
}

export function addEvent(ev: Omit<StoredEvent, "id">) {
  const list = read();
  const newEv: StoredEvent = { id: `ev-${Date.now()}`, ...ev };
  localStorage.setItem(KEY, JSON.stringify([newEv, ...list]));
  window.dispatchEvent(new Event("storage"));
  return newEv;
}

export function updateEvent(id: string, patch: Partial<StoredEvent>) {
  const list = read();
  const next = list.map((ev) => (ev.id === id ? { ...ev, ...patch } : ev));
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("storage"));
  return next.find((ev) => ev.id === id);
}

export function clearEvents() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("storage"));
}
