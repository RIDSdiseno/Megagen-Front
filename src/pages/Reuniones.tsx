import MainLayout from "../components/MainLayout";
import { CalendarClock } from "lucide-react";
import { useI18n } from "../context/I18nContext";

export default function ReunionesPage() {
  const { t } = useI18n();
  return (
    <MainLayout>
      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-[#1A334B]">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1A334B]">{t("Reuniones de Leads")}</h2>
            <p className="text-gray-600 text-sm">
              {t("Agenda y seguimiento de reuniones con leads y clientes.")}
            </p>
          </div>
        </div>
        <div className="border border-dashed border-gray-300 rounded-xl p-4 text-gray-700 bg-gray-50">
          {t("En construccion. Aqui puedes listar reuniones, estados y proximos pasos cuando definas el flujo.")}
        </div>
      </section>
    </MainLayout>
  );
}
