import { db } from "@/lib/db";
import { requerirSesion } from "@/lib/sesion";
import PanelUsuarios from "@/components/admin/PanelUsuarios";

export default async function PaginaUsuarios() {
  const sesion = await requerirSesion();
  const usuarios = await db.usuario.findMany({
    select: {
      id: true,
      email: true,
      usuario: true,
      nombre: true,
      rol: true,
      creadoEn: true,
      ultimoAcceso: true,
    },
    orderBy: { creadoEn: "asc" },
  });

  return (
    <div>
      <h1 className="font-titulo text-verde-700" style={{ fontSize: 28 }}>
        Usuarios
      </h1>
      <p className="mt-1 text-tinta-suave">Cambia tu clave y crea cuentas para el equipo.</p>
      <div className="mt-6">
        <PanelUsuarios sesionId={sesion.usuarioId} inicial={usuarios} />
      </div>
    </div>
  );
}
