import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-[#F2F6FA] min-h-screen">

      {/* SIDEBAR */}
      <div className="w-[250px] bg-white border-r border-gray-200 shadow-sm fixed left-0 top-0 bottom-0">
        <Sidebar />
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 ml-[250px] flex flex-col">

        {/* TOPBAR */}
        <Topbar />

        {/* BODY */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
