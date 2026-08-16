import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // ---------- Productos ----------
  const productos = [
    {
      nombre: "Palta Hass",
      slug: "palta-hass",
      descripcion:
        "Palta Hass de primera, cremosa y en su punto. La misma que llega a las ferias, directo a tu mesa.",
      unidad: "kg",
      precioBase: 4990,
      precioDescuento: 3490,
      precioCaja: 33900,
      kilosPorCaja: 10,
      precioBin: 1180000,
      kilosPorBin: 400,
      kilosDescuento: 10,
      mostrarCaja: true,
      mostrarBin: true,
      imagenTextura: "/texturas/paltas.webp",
      imagenRecorte: "/recortes/palta.png",
      colorAcento: "#224621",
      destacado: true,
      orden: 0,
    },
    {
      nombre: "Limón",
      slug: "limon",
      descripcion:
        "Limón de pulpa jugosa y cáscara firme. Ideal para local, cocina o reventa.",
      unidad: "kg",
      precioBase: 1790,
      precioDescuento: 1190,
      precioCaja: 19900,
      kilosPorCaja: 18,
      precioBin: 420000,
      kilosPorBin: 400,
      kilosDescuento: 15,
      mostrarCaja: true,
      mostrarBin: true,
      imagenTextura: "/texturas/limones.webp",
      imagenRecorte: "/recortes/limon.png",
      colorAcento: "#F5CD07",
      destacado: false,
      orden: 1,
    },
    {
      nombre: "Naranja",
      slug: "naranja",
      descripcion:
        "Naranja dulce de jugo, cosechada a la semana. Rinde y no decepciona.",
      unidad: "kg",
      precioBase: 1490,
      precioDescuento: 990,
      precioCaja: 16900,
      kilosPorCaja: 18,
      precioBin: 360000,
      kilosPorBin: 400,
      kilosDescuento: 15,
      mostrarCaja: true,
      mostrarBin: true,
      imagenTextura: "/texturas/naranjas.webp",
      imagenRecorte: "/recortes/naranja.png",
      colorAcento: "#FD7005",
      destacado: false,
      orden: 2,
    },
  ];

  for (const producto of productos) {
    await db.producto.upsert({
      where: { slug: producto.slug },
      update: producto,
      create: producto,
    });
  }
  console.log(`Productos: ${productos.length} listos.`);

  // ---------- Ajustes (fila única) ----------
  await db.ajustes.upsert({
    where: { id: "sitio" },
    update: {},
    create: { id: "sitio" },
  });
  console.log("Ajustes: fila 'sitio' lista.");

  // ---------- Usuario admin inicial ----------
  const email = process.env.ADMIN_EMAIL_INICIAL;
  const clave = process.env.ADMIN_PASS_INICIAL;

  if (!email || !clave) {
    console.warn(
      "ADMIN_EMAIL_INICIAL o ADMIN_PASS_INICIAL no están definidos en .env — se omite la creación del admin inicial."
    );
  } else {
    const hashClave = await bcrypt.hash(clave, 10);
    await db.usuario.upsert({
      where: { email },
      update: {},
      create: { email, hashClave, nombre: "Administrador", rol: "admin" },
    });
    console.log(`Usuario admin listo: ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
