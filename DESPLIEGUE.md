# Despliegue en Vercel

El sitio corre en Vercel con dos servicios detrás: **Neon** (Postgres) para los
datos y **Vercel Blob** para las fotos que sube el panel. Ninguno de los dos es
opcional: en Vercel el disco es de solo lectura y efímero, así que ni la base
SQLite ni la carpeta `public/uploads` que se usaban en local sobreviven ahí.

## Variables de entorno

| Variable | De dónde sale |
|---|---|
| `DATABASE_URL` | la inyecta Neon al conectarla al proyecto |
| `BLOB_READ_WRITE_TOKEN` | la inyecta la store de Blob al conectarla |
| `SESION_SECRETO` | se genera a mano (ver abajo) |
| `ADMIN_EMAIL_INICIAL` | solo la usa el seed |
| `ADMIN_PASS_INICIAL` | solo la usa el seed |
| `NEXT_PUBLIC_SITIO_URL` | opcional — el dominio real para canonical/OG/sitemap. Sin ella cae a `https://labodegadelaeconomia.cl` |

Generar el secreto de sesión:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Nunca reutilices el `SESION_SECRETO` del `.env` local en producción: con ese
valor se firman las cookies del panel, y quien lo tenga puede fabricarse una
sesión de admin.

## Primer despliegue

1. **Storage → Create Database → Neon.** Conéctala al proyecto; aparece
   `DATABASE_URL` sola.
2. **Storage → Create → Blob.** Conéctala; aparece `BLOB_READ_WRITE_TOKEN`.
3. **Importar el repo** en vercel.com/new. Detecta Next.js solo.
4. **Agregar las tres variables restantes** en Settings → Environment Variables.
5. **Deploy.** El build corre `prisma db push && next build` (está fijado en
   `vercel.json`), o sea que crea las tablas vacías.
6. **Llenar la base**, una sola vez. Dos caminos según lo que quieras:

   ```bash
   npx vercel env pull .env.production.local
   ```

   - Traer lo que ya tenías en local (productos, ajustes y **las cuentas del
     panel con su clave actual**):

     ```bash
     npm run migrar -- --aplicar
     ```

   - O empezar de cero con los productos y textos de fábrica:

     ```bash
     npx tsx --env-file=.env.production.local prisma/seed.ts
     ```

7. Si usaste el seed: entra al panel, cambia la clave y **borra
   `ADMIN_PASS_INICIAL`** de las variables de Vercel. Si usaste `migrar`, entras
   con tu clave de siempre y esas dos variables no hacen nada.

## Elegir el motor de base de datos

El proyecto corre sobre **PostgreSQL** (lo que usa hoy en Vercel, con Neon) o
sobre **MariaDB / MySQL** (lo cómodo en un hosting compartido). Se elige con una
variable de entorno:

```bash
DB_PROVIDER=postgresql   # por defecto, si no la pones
DB_PROVIDER=mariadb      # o "mysql", es lo mismo
```

Con MariaDB el `DATABASE_URL` va con prefijo `mysql://` aunque el motor sea
MariaDB — hablan el mismo protocolo y Prisma usa el mismo conector:

```bash
DATABASE_URL="mysql://usuario:clave@127.0.0.1:3306/bodega"
```

**`DB_PROVIDER` tiene que estar puesta antes del `npm install`.** El cliente de
Prisma queda atado al motor con el que se generó, y quien lo genera es el
`postinstall`. Si el hosting ya instaló con el valor equivocado, basta con
volver a correr `npm install` (o `node scripts/generar-cliente.mjs`) con la
variable corregida.

### Levantar la base en MariaDB

```bash
npm run db:push:mariadb    # crea las tablas
npm run db:seed:mariadb    # las llena con los datos de partida
npm run db:studio:mariadb  # el visor de Prisma, si lo necesitas
```

Los comandos sin sufijo (`npm run db:push`, `db:seed`, `db:studio`) siguen
apuntando a Postgres.

### Por qué hay dos archivos de schema

Prisma no acepta `provider = env("...")` en el bloque `datasource`: tiene que
ser un literal. Soportar dos motores obliga entonces a dos archivos.

Para que no se desincronicen, **solo se edita `prisma/schema.prisma`**. El de
MariaDB se genera desde ese con `npm run schema:mariadb` (y se genera solo antes
de cada comando `:mariadb`), cambiando una única línea: el provider. Está en el
`.gitignore` justamente porque es un archivo derivado.

Que la diferencia sea de una sola línea depende de los `@db.VarChar(n)` del
schema base, que están puestos para servir a los dos motores a la vez:

- En MySQL/MariaDB un `String` sin largo explícito es `varchar(191)`, donde no
  entra el eslogan ni ninguno de los campos que guardan JSON.
- Dejar esos campos como `TEXT` tampoco sirve: MySQL no permite `DEFAULT` en
  columnas `TEXT`, y casi todas las nuestras tienen uno.
- En Postgres, `varchar(n)` y `text` se comportan igual, así que anotar el largo
  no cuesta nada de ese lado.

Si agregas un campo de texto que pueda pasar de 191 caracteres, ponle su
`@db.VarChar(n)`. Es la única regla que hay que recordar para que el schema siga
sirviendo a los dos.

### Lo que no viaja entre motores

`prisma db push` crea el esquema, no copia los datos. Para pasar el contenido de
una base a otra hay que exportarlo e importarlo aparte. Lo que sí es portable es
el seed: `db:seed:mariadb` deja la base nueva con los productos y los ajustes de
partida.

## Desarrollo local

El schema es Postgres, así que `prisma/dev.db` ya no se usa. La forma más
simple de tener una base local sin instalar nada es una **branch de Neon**:

1. En la consola de Neon: Branches → New Branch, a partir de `main`, nómbrala
   `dev`.
2. Copia su connection string a `DATABASE_URL` en tu `.env`.
3. `npm run db:push` para crear las tablas, y `npm run db:seed` para llenarlas.

Es gratis, es aislada de producción, y se puede resetear desde `main` cuando
quieras datos frescos. La alternativa es instalar Postgres en la máquina; el
schema no cambia en ningún caso.

Para las fotos en local necesitas también el `BLOB_READ_WRITE_TOKEN`. Sale con
`npx vercel env pull .env.local`. Ojo: **no hay Blob de desarrollo separado**,
así que lo que subas probando en local queda en la misma store que producción.
Para limpiarlo, `npm run limpiar` (ver abajo).

## Deploys de preview

Cada rama que pushees genera un deploy de preview. Por defecto **todos comparten
la base y el Blob de producción**, y el build de cada uno corre `prisma db push`
contra esa misma base.

- **Base:** actívale a Neon la integración de branching con Vercel (en la
  integración de Neon, "Create a branch for each preview deployment"). Cada
  preview recibe su propia copia de la base y deja de tocar producción.
- **Blob:** no tiene equivalente, la store es una sola. El riesgo es acotado
  porque `/api/upload` exige sesión de admin y la cookie no viaja entre
  dominios: para subir algo desde un preview hay que iniciar sesión ahí a
  propósito.

Si trabajas siempre directo sobre `main` y no abres ramas, esto no te afecta.

## Mantenimiento

`npm run limpiar` borra los mensajes del formulario más viejos que 90 días y las
fotos del Blob que ya no usa ningún producto ni la galería. **No borra nada sin
`--aplicar`**: sin esa bandera solo imprime el informe.

```bash
npx vercel env pull .env.production.local
```

```bash
npx tsx --env-file=.env.production.local scripts/limpiar-datos.ts
```

Revisa el informe y recién ahí repite el comando agregando `-- --aplicar`.
