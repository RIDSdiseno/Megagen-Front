import MainLayout from "../components/MainLayout";
import { FolderKanban } from "lucide-react";

export default function ArchivosPage() {
  return (
    <MainLayout>
      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-[#1A334B]">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1A334B]">Archivos</h2>
            <p className="text-gray-600 text-sm">
              Seccion base para centralizar documentos, imagenes y adjuntos.
            </p>
          </div>
        </div>
        <div className="border border-dashed border-gray-300 rounded-xl p-4 text-gray-700 bg-gray-50">
          En construccion. Define carpetas, filtros y acciones de subida cuando se habilite el modulo.
        </div>
      </section>
    </MainLayout>
  );
}
