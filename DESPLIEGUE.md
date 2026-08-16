# Despliegue en cPanel

El sitio corre en un hosting cPanel con **MariaDB** para los datos y el disco
del propio servidor para las fotos que sube el panel. No depende de ningún
servicio externo: si el hosting está arriba, el sitio está arriba.

Esto **no es un sitio estático ni WordPress**. Es Next.js con render en
servidor, así que necesita un proceso Node corriendo permanentemente. En cPanel
eso lo da **Setup Node.js App** (Phusion Passenger). Sin esa herramienta en el
plan, el sitio no levanta.

## Datos de la cuenta

| Dato | Valor |
|---|---|
| Usuario cPanel | `cla118604` |
| Directorio principal | `/home4/cla118604` (con el `4`) |
| IP | `190.107.177.245` |
| Dominio | `labodegadelaeconomia.cl` |

## Variables de entorno

| Variable | De dónde sale |
|---|---|
| `DATABASE_URL` | la base que creas en cPanel → MySQL Databases |
| `SESION_SECRETO` | se genera a mano (ver abajo) |
| `CLAVE_REGISTRO` | la eliges tú; habilita crear cuentas en /admin/registro |
| `NEXT_PUBLIC_SITIO_URL` | opcional; sin ella cae a `https://labodegadelaeconomia.cl` |
| `ADMIN_EMAIL_INICIAL` | solo la lee el seed |
| `ADMIN_PASS_INICIAL` | solo la lee el seed |

El `DATABASE_URL` va con prefijo `mysql://` aunque el motor sea MariaDB: hablan
el mismo protocolo y el conector de Prisma es el mismo. El host es `127.0.0.1`
porque la app corre en la misma máquina que la base.

```
DATABASE_URL="mysql://cla118604_bodega:CLAVE@127.0.0.1:3306/cla118604_bodega"
```

Generar el secreto de sesión:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Nunca reutilices el `SESION_SECRETO` de local en producción: con ese valor se
firman las cookies del panel, y quien lo tenga puede fabricarse una sesión de
admin.

## Primer despliegue

**1. Crear la base.** cPanel → *MySQL Databases*: crea la base, crea el usuario
y asígnalo con **ALL PRIVILEGES**. cPanel les antepone el prefijo de la cuenta,
así que quedan con nombres tipo `cla118604_bodega`.

**2. Traer el código.** cPanel → *Terminal*:

```bash
cd /home4/cla118604
git clone https://github.com/ThomasTg7/la-bodega-de-la-economia.git bodega
```

**3. Crear la aplicación.** cPanel → *Setup Node.js App* → *Create Application*:

| Campo | Valor |
|---|---|
| Node.js version | 24 (el que quedó instalado; sirve cualquiera >= 20.9) |
| Application mode | Production |
| Application root | `bodega` |
| Application URL | `labodegadelaeconomia.cl` |
| Application startup file | `server.js` |

Y abajo, en *Environment variables*, las de la tabla de arriba.

El orden importa: primero el `git clone`, después crear la aplicación. Así
cPanel arma el entorno de Node sobre una carpeta que ya tiene el código.

**4. Instalar y levantar.** De vuelta en la Terminal. El `source` de la primera
línea lo muestra cPanel en la misma pantalla de *Setup Node.js App*; cámbialo si
la versión de Node no es 22:

```bash
source /home4/cla118604/nodevenv/bodega/24/bin/activate && cd /home4/cla118604/bodega
npm install --include=dev   # ver abajo por qué el --include=dev
npm run generate            # genera el cliente de Prisma
npx prisma db push          # crea las tablas
npm run build:hosting       # el :hosting no es opcional, ver abajo
mkdir -p tmp && touch tmp/restart.txt   # Passenger recarga el proceso
```

El `--include=dev` no es opcional. La instalación de npm que deja el Node.js
Selector viene con `omit=dev`, así que sin la bandera no bajan las
devDependencies y el build muere buscando `typescript` y `tailwindcss`, o
`npm run importar` corta con `tsx: command not found`.

`tmp/` no está versionado, así que la primera vez hay que crearlo: un `touch`
a secas falla con `No such file or directory` y el proceso nunca recarga.

El `npm run generate` va en su propio paso y no en un `postinstall` a propósito.
El Node.js Selector de cPanel guarda `node_modules` fuera de la carpeta de la
app —en `nodevenv/bodega/24/lib/`— y deja un enlace simbólico en su lugar. Con
eso, npm corre los scripts de ciclo de vida parado en la carpeta equivocada y
un `postinstall` falla con `Cannot find module`. Ejecutarlo aparte, ya dentro
del directorio correcto, lo evita.

Ese mismo enlace simbólico es el que obliga a `next.config.ts` a mover la raíz
de Turbopack un nivel más arriba. Turbopack no resuelve nada fuera de su raíz, y
con la raíz en la carpeta de la app el build muere con `Symlink
[project]/node_modules is invalid, it points out of the filesystem root`. El
config lo detecta solo; está explicado ahí mismo.

El `&&` de la primera línea junta la activación con el `cd`: si se corren
sueltas y la sesión se corta, se termina trabajando desde el home sin notarlo.

**5. Llenar la base**, una sola vez. Dos caminos:

- **Traer los datos que ya tenías** (productos, ajustes y las cuentas del panel
  con su clave actual). Sube `datos-exportados.json` a la carpeta de la app por
  el *File Manager* y:

  ```bash
  npm run importar                  # informe, no escribe nada
  npm run importar -- --aplicar     # carga de verdad
  ```

  No lo hagas importando un dump `.sql` con `mysql <archivo`. Un dump hecho
  en Windows trae los nombres de tabla en minúscula, porque ahí MariaDB corre
  con `lower_case_table_names=1`. El hosting es Linux y distingue mayúsculas:
  Prisma busca `Producto` y `Usuario`, no encuentra las `producto` y
  `usuario` importadas, y el siguiente `db push` las da por desconocidas y
  **las borra**. El script `importar` escribe por Prisma Client y no tiene ese
  problema.

- **O empezar de cero** con los productos y textos de fábrica:

  ```bash
  npx prisma db seed
  ```

Si usaste el seed: entra al panel, cambia la clave y **borra
`ADMIN_PASS_INICIAL`** de las variables de entorno. Si usaste `importar`, entras
con tu clave de siempre y esas dos variables no hacen nada.

## Cuentas del panel

Se entra en `/admin/login` con **nombre de usuario o correo**, indistintamente.
El campo es uno solo y acepta las dos cosas; las mayúsculas dan igual, porque el
cotejo de la base es `utf8mb4_unicode_ci`.

Para crear una cuenta hay dos caminos, y basta con uno:

- **La palabra clave compartida.** Quien la sepa entra a `/admin/registro`, la
  escribe y se crea la cuenta solo. Es el valor de `CLAVE_REGISTRO` en las
  variables de entorno. Se la pasas por WhatsApp a quien corresponda y listo.
- **La lista de Accesos del panel.** Si agregas un correo ahí, esa persona puede
  registrarse sin saber la palabra clave.

Si `CLAVE_REGISTRO` no está definida, el primer camino queda **cerrado**, no
abierto: olvidar la variable no puede dejar el registro a merced de cualquiera
que llegue a la URL. Para cambiar quién puede entrar, cambia la palabra: las
cuentas ya creadas siguen funcionando.

### Cuando nadie puede entrar

No hay recuperación de clave por correo —el sitio no manda mails—, así que la
salida es la terminal. Crea o repón la cuenta:

```bash
source /home4/cla118604/nodevenv/bodega/24/bin/activate && cd /home4/cla118604/bodega
npm run usuario -- --usuario DonCarlos --email don@ejemplo.cl --nombre "Don Carlos"
```

Eso es un informe y no escribe nada. Para aplicarlo hay que pasarle la clave por
la entrada estándar, nunca como argumento: un `--clave` quedaría en
`~/.bash_history` y a la vista de cualquier `ps` mientras corre.

```bash
read -rsp "Clave: " CLAVE && echo
printf '%s' "$CLAVE" | npm run usuario -- --usuario DonCarlos --email don@ejemplo.cl --nombre "Don Carlos" --aplicar
```

Si el correo o el usuario ya existen, actualiza esa cuenta en vez de crear otra
— que es justamente cómo se repone una clave olvidada.

## Actualizar el sitio

El paso a paso de publicar cambios está en **[SUBIR-A-PRODUCCION.md](SUBIR-A-PRODUCCION.md)**:
qué comandos, en qué orden, cuáles se pueden saltar según lo que hayas tocado, y
qué hacer cuando alguno falla. Se mantiene ahí y no acá para que haya una sola
lista de comandos y no dos que se desincronicen.

Lo que conviene tener presente antes de ir para allá:

- **Detén la aplicación desde cPanel antes de compilar.** La cuenta tiene un
  techo de tareas y el proceso que sirve el sitio compite con el build.
- **Compila con `npm run build:hosting`**, no con `npm run build`. Es el mismo
  `next build` con tres variables que bajan los hilos que abre:
  `TOKIO_WORKER_THREADS` para el motor de Turbopack, que es Rust y levanta un
  hilo por núcleo aunque `cpus: 1` ya limite los workers de JavaScript;
  `UV_THREADPOOL_SIZE` para los de Node; y `VIPS_CONCURRENCY` para `sharp`. En
  local no hace falta.
- **`npx prisma db push` sincroniza el esquema** con lo que diga
  `prisma/schema.prisma`. Si un cambio implicara perder datos, Prisma se detiene
  y pide confirmación en vez de borrarlos: eso es a propósito, no le agregues
  `--accept-data-loss` sin mirar qué iba a borrar.

## Las fotos que sube el panel

Van al disco, en `public/uploads/`, y en la base se guarda la ruta relativa.

Esa carpeta está en `.gitignore`, así que **`git pull` no la toca**: las fotos
sobreviven a cada actualización. La contracara es que no están en el repo — si
algún día hay que rearmar el hosting desde cero, hay que respaldarlas aparte
(*File Manager* → comprimir `public/uploads` → descargar).

Para borrar las que ya no usa ningún producto:

```bash
npm run limpiar                   # informe
npm run limpiar -- --aplicar      # borra de verdad
```

Tiene que correrse **en el servidor**, no en local: las imágenes viven en el
disco del hosting.

## Desarrollo en local

La base también es MariaDB en local. Con XAMPP ya viene incluida:

```bash
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE bodega CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Y en `.env`:

```
DATABASE_URL="mysql://root@127.0.0.1:3306/bodega"
```

Después `npx prisma db push` y `npm run dev`.

## Recursos del plan

Medido sobre la cuenta actual, para saber qué margen hay:

| Recurso | Límite | Lo que usa el proyecto |
|---|---|---|
| Memoria física | 2 GB | ~1–1,5 GB durante `npm run build` |
| Disco | 5 GB | ~1,2 GB (`node_modules` + `.next` + repo) |
| Procesos | 150 | 1 |
| Procesos entrantes | 8 | tope de visitas simultáneas |
| Bases de datos | 2 | 1 |

El número apretado es la memoria, y el límite es **para toda la cuenta**: el
`npm run build` compite con el proceso Node que ya esté sirviendo. Si alguna vez
lo mata por falta de memoria:

```bash
NODE_OPTIONS=--max-old-space-size=1536 npm run build
```

Y si aun así no alcanza, la salida es compilar fuera del servidor (GitHub
Actions) y subir solo el resultado.

## Deploy automático con `git push`

Lo de arriba es manual: tú corres los comandos. Para que un `git push` dispare
el deploy solo hace falta **SSH habilitado en la cuenta**, que en este plan
viene apagado y se pide por ticket al proveedor.

Con SSH activo, cPanel → *Git™ Version Control* crea un repo al que se le puede
hacer push, y si el proyecto trae un `.cpanel.yml` en la raíz, cPanel ejecuta el
deploy al recibirlo. Los comandos del `.cpanel.yml` son exactamente los mismos
de "Actualizar el sitio".

Ojo con un malentendido común: cPanel **no vigila GitHub**. Un push a GitHub no
dispara nada por sí solo. O le haces push directo a cPanel, o algo (GitHub
Actions) le avisa.
