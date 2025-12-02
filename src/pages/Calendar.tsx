import { useMemo, useState } from "react";
import MainLayout from "../components/MainLayout";
import Modal from "../components/Modal";

import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
} from "react-big-calendar";

import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";

import "react-big-calendar/lib/css/react-big-calendar.css";

type LeadEvent = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  paciente: string;
  telefono: string;
  estado: "Nuevo" | "Cotizando" | "En Proceso" | "Confirmado" | "Entregado";
};

const locales = { es };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const eventosIniciales: LeadEvent[] = [
  {
    id: 1,
    title: "Revision inicial - Juan Perez",
    start: new Date(2025, 10, 5, 10, 0),
    end: new Date(2025, 10, 5, 11, 0),
    paciente: "Juan Perez",
    telefono: "+56988881234",
    estado: "Cotizando",
  },
  {
    id: 2,
    title: "Entrega implante - Ana Martinez",
    start: new Date(2025, 10, 6, 15, 0),
    end: new Date(2025, 10, 6, 16, 0),
    paciente: "Ana Martinez",
    telefono: "+56992340022",
    estado: "Confirmado",
  },
  {
    id: 3,
    title: "Reunion seguimiento - Pedro Silva",
    start: new Date(2025, 10, 8, 9, 30),
    end: new Date(2025, 10, 8, 10, 15),
    paciente: "Pedro Silva",
    telefono: "+56990001122",
    estado: "En Proceso",
  },
];

export default function CalendarPage() {
  const [eventos] = useState<LeadEvent[]>(eventosIniciales);
  const [selected, setSelected] = useState<LeadEvent | null>(null);

  const resumen = useMemo(() => {
    const base: Record<string, number> = {
      "Nuevo": 0,
      "Cotizando": 0,
      "En Proceso": 0,
      "Confirmado": 0,
      "Entregado": 0,
    };
    eventos.forEach((e) => {
      base[e.estado] = (base[e.estado] || 0) + 1;
    });
    return Object.entries(base);
  }, [eventos]);

  const proximos = useMemo(
    () => [...eventos].sort((a, b) => a.start.getTime() - b.start.getTime()),
    [eventos]
  );

  return (
    <MainLayout>
      
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-[#4B6B8A] font-semibold">Calendario y reuniones</p>
          <h2 className="text-3xl font-extrabold text-[#1A334B]">
            Agenda de leads y clientes
          </h2>
          <p className="text-gray-600">
            Visualiza citas, reuniones y entregas en un solo lugar para coordinar oportunidades.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {resumen.map(([estado, total]) => (
          <div
            key={estado}
            className="bg-white border border-[#D9E7F5] rounded-xl p-3 shadow-sm hover:shadow-md transition-all"
          >
            <p className="text-xs font-semibold text-gray-500">{estado}</p>
            <p className="text-2xl font-bold text-[#1A334B]">{total}</p>
            <div className="h-1.5 rounded-full bg-[#E6F0FB] mt-2 overflow-hidden">
              <span className="block h-full bg-[#1A6CD3]" style={{ width: `${Math.min(total * 25, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow p-4 h-[650px] mb-6">
        <BigCalendar
          localizer={localizer}
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          popup
          views={["month", "week", "day"]}
          defaultView="month"
          messages={{
            month: "Mes",
            week: "Semana",
            day: "Dia",
            today: "Hoy",
            previous: "◀",
            next: "▶",
            agenda: "Agenda",
            showMore: (total) => `+${total} mas`,
          }}
          onSelectEvent={(event) => setSelected(event as LeadEvent)}
        />
      </div>

      <section className="bg-white border border-gray-200 rounded-2xl shadow p-4">
        <h3 className="text-lg font-bold text-[#1A334B] mb-3">
          Reuniones y actividades de leads
        </h3>
        <div className="divide-y divide-gray-100">
          {proximos.map((ev) => (
            <div
              key={ev.id}
              className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded-lg cursor-pointer"
              onClick={() => setSelected(ev)}
            >
              <div>
                <p className="font-semibold text-gray-800">{ev.title}</p>
                <p className="text-xs text-gray-500">
                  {ev.paciente} · {ev.telefono}
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-semibold">
                {ev.estado}
              </span>
            </div>
          ))}
        </div>
      </section>

      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <div className="p-5">
            <h3 className="text-xl font-bold text-[#1A334B] mb-2">
              {selected.title}
            </h3>

            <div className="space-y-1 text-sm text-gray-700">
              <p><strong>Paciente:</strong> {selected.paciente}</p>
              <p><strong>Telefono:</strong> {selected.telefono}</p>
              <p><strong>Estado:</strong> {selected.estado}</p>
              <p><strong>Inicio:</strong> {selected.start.toLocaleString("es-CL")}</p>
              <p><strong>Termino:</strong> {selected.end.toLocaleString("es-CL")}</p>
            </div>

            <button
              onClick={() => setSelected(null)}
              className="mt-5 w-full bg-megagen-primary hover:bg-megagen-dark text-white py-2 rounded-lg font-semibold transition"
            >
              Cerrar
            </button>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}
