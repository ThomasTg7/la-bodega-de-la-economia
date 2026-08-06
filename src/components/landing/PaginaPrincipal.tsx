"use client";

import type { Producto, Ajustes } from "@prisma/client";
import SmoothScroll from "@/components/motion/SmoothScroll";
import { ProveedorBurbujaWhatsApp } from "@/lib/burbuja-whatsapp-contexto";
import { parsearNumerosWhatsapp } from "@/lib/whatsapp";
import NavFlotante from "./NavFlotante";
import Hero from "./Hero";
import FranjaAhorro from "./FranjaAhorro";
import Catalogo from "./Catalogo";
import Calculadora from "./Calculadora";
import QuienesSomos from "./QuienesSomos";
import Cifras from "./Cifras";
import Pasos from "./Pasos";
import FormularioContacto from "./FormularioContacto";
import Footer from "./Footer";
import BurbujaWhatsApp from "./BurbujaWhatsApp";

type Props = {
  productos: Producto[];
  ajustes: Ajustes;
};

export default function PaginaPrincipal({ productos, ajustes }: Props) {
  const productoDestacado = productos.find((p) => p.destacado) ?? productos[0] ?? null;
  const numerosWhatsapp = parsearNumerosWhatsapp(ajustes.numerosWhatsapp, ajustes.whatsapp);

  return (
    <SmoothScroll>
      <ProveedorBurbujaWhatsApp>
        <NavFlotante />
        <main>
          <Hero productoDestacado={productoDestacado} eslogan={ajustes.eslogan} />
          <FranjaAhorro />
          <Catalogo productos={productos} />
          <Calculadora productos={productos} />
          <QuienesSomos ajustes={ajustes} />
          <Cifras productos={productos} />
          <Pasos />
          <FormularioContacto />
        </main>
        <Footer ajustes={ajustes} />
        <BurbujaWhatsApp numeros={numerosWhatsapp} />
      </ProveedorBurbujaWhatsApp>
    </SmoothScroll>
  );
}
