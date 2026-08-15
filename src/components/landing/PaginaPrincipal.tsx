"use client";

import { useMemo } from "react";
import type { Producto, Ajustes } from "@prisma/client";
import SmoothScroll from "@/components/motion/SmoothScroll";
import { ProveedorBurbujaWhatsApp } from "@/lib/burbuja-whatsapp-contexto";
import { parsearNumerosWhatsapp } from "@/lib/whatsapp";
import { linkMapa } from "@/lib/mapa";
import { CATALOGO_DEFECTO, parsearSellos } from "@/lib/portada";
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
import BotonesFlotantes from "./BotonesFlotantes";

type Props = {
  productos: Producto[];
  ajustes: Ajustes;
};

export default function PaginaPrincipal({ productos, ajustes }: Props) {
  // Memo porque la lista viaja al contexto de WhatsApp: un array nuevo en
  // cada render invalidaría el `abrir` que usan todos los botones.
  const numerosWhatsapp = useMemo(
    () => parsearNumerosWhatsapp(ajustes.numerosWhatsapp, ajustes.whatsapp),
    [ajustes.numerosWhatsapp, ajustes.whatsapp]
  );

  return (
    <SmoothScroll>
      <ProveedorBurbujaWhatsApp numeros={numerosWhatsapp}>
        <NavFlotante />
        <main>
          <Hero
            eslogan={ajustes.eslogan}
            direccion={ajustes.direccion}
            ciudad={ajustes.ciudad}
            sellos={parsearSellos(ajustes.portadaSellos)}
            mapaUrl={linkMapa(ajustes)}
          />
          {/* Horarios va pegado a la portada y la frase queda para más
              abajo: intercambiadas respecto de como estaban. */}
          <Cifras />
          <Catalogo
            productos={productos}
            titulo={ajustes.catalogoTitulo.trim() || CATALOGO_DEFECTO.titulo}
            bajada={ajustes.catalogoBajada.trim() || CATALOGO_DEFECTO.bajada}
            pedidoMinimo={ajustes.pedidoMinimoKg}
          />
          <Calculadora productos={productos} pedidoMinimo={ajustes.pedidoMinimoKg} />
          <QuienesSomos ajustes={ajustes} />
          <FranjaAhorro />
          <Pasos />
          <FormularioContacto />
        </main>
        <Footer ajustes={ajustes} />
        <BotonesFlotantes />
      </ProveedorBurbujaWhatsApp>
    </SmoothScroll>
  );
}
