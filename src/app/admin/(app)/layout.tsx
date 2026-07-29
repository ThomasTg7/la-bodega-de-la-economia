import { requerirSesion } from "@/lib/sesion";
import { db } from "@/lib/db";
import { ProveedorToast } from "@/components/admin/Toast";
import BarraLateral from "@/components/admin/BarraLateral";
import CabeceraAdmin from "@/components/admin/CabeceraAdmin";
import TransicionPagina from "@/components/admin/TransicionPagina";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const sesion = await requerirSesion();
  const mensajesSinLeer = await db.mensaje.count({ where: { leido: false } });

  return (
    <ProveedorToast>
      <div className="min-h-svh" style={{ background: "#F6FAF9" }}>
        <BarraLateral mensajesSinLeer={mensajesSinLeer} />

        <div className="pb-24 md:pb-0 md:pl-60">
          <CabeceraAdmin email={sesion.email} mensajesSinLeer={mensajesSinLeer} />
          <main className="mx-auto max-w-6xl p-5 md:p-8">
            <TransicionPagina>{children}</TransicionPagina>
          </main>
        </div>
      </div>
    </ProveedorToast>
  );
}
