import { db } from "@/lib/db";
import PanelQR from "@/components/admin/PanelQR";
import { SITIO_URL } from "@/lib/sitio";
import { armarLinkWhatsApp } from "@/lib/whatsapp";

export default async function PaginaQR() {
  const ajustes = await db.ajustes.upsert({
    where: { id: "sitio" },
    update: {},
    create: { id: "sitio" },
  });

  return (
    <div>
      <h1 className="font-titulo text-verde-700" style={{ fontSize: 28 }}>
        Código QR
      </h1>
      <p className="mt-1 text-tinta-suave">
        Para el mesón, un volante o el vidrio del local: la gente lo escanea y llega derecho.
      </p>
      <div className="mt-6">
        <PanelQR
          sitioUrl={SITIO_URL}
          linkWhatsApp={armarLinkWhatsApp(ajustes.whatsapp)}
          nombreNegocio={ajustes.nombreNegocio}
        />
      </div>
    </div>
  );
}
