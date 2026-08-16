/**
 * Arranque de la app para Phusion Passenger, que es lo que corre detrás de
 * "Setup Node.js App" en cPanel.
 *
 * Next trae su propio `next start`, pero Passenger no ejecuta un comando:
 * carga un archivo JavaScript y espera que ese archivo levante un servidor
 * HTTP. Este es ese archivo, y su ruta es la que va en el campo "Application
 * startup file" del panel.
 *
 * Sobre el puerto: Passenger no usa el que uno le pida. Le pasa el suyo por
 * la variable PORT y además intercepta el listen(), así que el número de acá
 * abajo solo importa cuando se corre a mano para probar.
 */
const { createServer } = require("node:http");
const next = require("next");

const puerto = parseInt(process.env.PORT || "3000", 10);
// Passenger arranca sin NODE_ENV en algunas configuraciones, y Next en modo
// desarrollo intentaría compilar en caliente sobre el hosting. Se fuerza
// producción salvo que explícitamente se pida lo otro.
const dev = process.env.NODE_ENV === "development";

const app = next({ dev });
const manejar = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    manejar(req, res);
  }).listen(puerto, () => {
    console.log(`La bodega de la economía escuchando en el puerto ${puerto}`);
  });
});
