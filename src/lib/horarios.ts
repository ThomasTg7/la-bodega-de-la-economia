/**
 * Los horarios reales del local, en tres lineas con estructura (dia,
 * apertura, cierre). Vive separado de `Ajustes.horario` porque ese campo es
 * una sola frase suelta para el pie y la ficha; esto es lo que pinta la
 * franja de "Cuando venir" y lo que arma el `openingHoursSpecification` del
 * JSON-LD, asi que los dos leen la misma fuente.
 */
export type Horario = { dias: string; horas: string; cerrado?: boolean };

export const HORARIOS: Horario[] = [
  { dias: "Lunes a viernes", horas: "9:00 a 20:00" },
  { dias: "Sábado", horas: "9:00 a 15:00" },
  { dias: "Domingo", horas: "Cerrado", cerrado: true },
];
