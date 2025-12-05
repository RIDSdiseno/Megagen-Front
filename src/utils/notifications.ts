export type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
};

const STORAGE_KEY = "megagen_notifications";

function read(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as NotificationItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function getNotifications(): NotificationItem[] {
  return read();
}

export function pushNotification(item: Omit<NotificationItem, "id">) {
  const list = read();
  const now = Date.now();
  const newItem: NotificationItem = { id: `ntf-${now}`, ...item };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newItem, ...list].slice(0, 20)));
  window.dispatchEvent(new Event("storage")); // fuerza refresco en listeners locales
}

export function clearNotifications() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("storage"));
}

export function removeNotification(id: string) {
  const list = read().filter((n) => n.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("storage"));
}
