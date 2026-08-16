# La bodega de la economía — sitio web

Guía para el día a día del panel. No necesitas saber programar para usar esto.

## Cómo prender el sitio en tu computador

Abre una terminal en esta carpeta y escribe:

```bash
npm run dev
```

Espera unos segundos y abre en el navegador: **http://localhost:3000**

Para entrar al panel de administración, ve a **http://localhost:3000/admin**

---

## Cómo entrar al panel y cambiar un precio

1. Entra a `/admin` y pon tu correo y clave.
2. En el menú de la izquierda (o abajo si estás en el celular), toca **Productos**.
3. Toca el nombre del producto que quieres cambiar (Palta Hass, Limón o Naranja).
4. Busca la tarjeta **Precios** y cambia el número que quieras. Si dejas un precio vacío, ese formato simplemente no se muestra en la página (por ejemplo, si no vendes por caja, deja "Precio por caja" vacío).
   - **Descuento por volumen**: necesita las dos casillas llenas, el "Precio con descuento" y el "El descuento se aplica desde". Si dejas cualquiera de las dos vacía, ese producto queda sin descuento y no se muestra ninguno. Si llenas solo una, el formulario te avisa en naranja.
   - **Caja y bin**: cada uno tiene una casilla **Mostrar en el detalle**. Marcada, el formato sale en la ficha del producto; desmarcada, no sale pero el precio queda guardado, así que puedes volver a mostrarlo sin escribirlo de nuevo.
5. Al lado derecho vas a ver una **vista previa** que se actualiza mientras escribes, así ves cómo va a quedar antes de guardar.
6. Cuando termines, abajo va a aparecer una barra que dice **"Tienes cambios sin guardar"**. Toca **Guardar**.

Los cambios se ven en la página inmediatamente (recarga la página si no los ves altiro).

### Mostrar u ocultar un producto

En la lista de **Productos**, cada uno tiene un interruptor a la derecha. Si lo apagas, el producto deja de aparecer en la página (útil si se te acabó algo por un tiempo), pero no lo borra ni le toca nada: fotos, textos y precios quedan tal cual, y lo puedes prender de nuevo cuando quieras.

### Qué ve el cliente en el catálogo

Cada tarjeta muestra el nombre, la foto, la descripción corta y un solo precio, el por mayor. Abajo tiene dos botones:

- **Más detalles** abre la ficha completa: la foto grande, la descripción entera, el precio por mayor, el descuento por volumen si lo tiene y los formatos de caja y bin que hayas marcado.
- **Cotizar** abre WhatsApp con el mensaje ya escrito.

---

## Cómo invitar a alguien para que también pueda entrar al panel

1. Ve a **Invitar** en el menú.
2. Si quieres, escribe para quién es (como "Mi hermano" o "Contador"). Es solo para que tú te acuerdes.
3. Toca **Crear link**.
4. Aparece el link en un recuadro. Toca **Copiar link** y mándaselo por WhatsApp **al tiro**.
5. Esa persona abre el link, pone su correo, elige un usuario, su nombre y una clave, y listo — ya tiene su cuenta.

Tres cosas que conviene tener claras:

- El link **dura 30 minutos** y sirve **una sola vez**. Créalo cuando la persona ya esté con el teléfono en la mano; si se vence, creas otro y no pasa nada.
- El link completo **se muestra una sola vez**, cuando lo creas. Si cierras esa pantalla sin copiarlo, no hay forma de recuperarlo: se crea otro.
- Sin link no hay registro. Nadie puede crearse una cuenta entrando a `/admin/registro` por su cuenta.

En la lista de abajo ves los links que has creado, con su estado (activa, cuenta creada o vencida) y cuánto le queda a cada uno. **Anular** deja un link sin efecto en el acto, aunque le queden minutos.

---

## Cómo cambiar tu clave o crearle la cuenta a alguien tú mismo

En **Usuarios** hay dos cosas:

- **Cambiar mi clave**: escribe la que tienes ahora y la nueva dos veces. Solo cambia la tuya, no la de otra persona.
- **Crear un usuario**: nombre, usuario, correo y una clave inicial. La cuenta queda lista al toque y esa persona entra con el usuario (o el correo) y la clave que le pusiste; después ella misma la puede cambiar en esta pantalla.

La diferencia con **Accesos** es quién hace el trabajo: en Accesos invitas un correo y la persona se crea la cuenta sola; en Usuarios se la creas tú y le pasas la clave. Cualquiera que esté dentro del panel puede crear cuentas, así que la clave del panel es la llave de todo: no la compartas con quien no corresponda.

Abajo de todo sale la lista de cuentas que existen, con la última vez que entró cada una.

---

## Cómo cambiar la dirección, los teléfonos o el texto de la portada

1. Ve a **Ajustes** en el menú.
2. Ahí puedes cambiar:
   - El nombre del negocio y el eslogan que sale en la portada.
   - La dirección, la ciudad y el horario.
   - Los dos teléfonos y el número de WhatsApp de la burbuja.
   - La descripción del negocio que sale en la sección "Ven a vernos".
   - Las fotos del local (las que salen en el carrusel — puedes subir varias y arrastrarlas para ordenarlas).
3. Toca **Guardar cambios** al final.

---

## Cómo agregar un producto nuevo

1. Ve a **Productos** y toca **+ Agregar producto**.
2. Completa el nombre, una descripción corta y los precios que correspondan. Acuérdate de marcar **Mostrar en el detalle** en caja o bin si los vendes así: un producto nuevo nace con las dos casillas apagadas.
3. Sube dos fotos:
   - **Foto de fondo**: se ve mejor si es una foto de hartas frutas juntas (como las que ya tienes de fondo en Palta, Limón y Naranja).
   - **Foto recortada**: tiene que ser una foto de la fruta sola, **con el fondo transparente** (formato PNG). Si no tienes una así todavía, puedes tocar "Usar la de la bodega" para usar una imagen de referencia mientras consigues la tuya.
4. Elige un color de acento (o usa uno de los que ya vienen).
5. Si quieres que este producto salga destacado en la portada (con el precio grande al lado de la palta), activa **Destacado en la portada**.
6. Guarda. El producto va a aparecer al final del catálogo — puedes arrastrarlo para cambiar su orden desde la lista de Productos.

---

## Mensajes de clientes

En **Mensajes** ves lo que te escriben desde el formulario de contacto de la página.

Lo que entra por la burbuja de WhatsApp **no** se guarda acá: esa conversación ya te llega a WhatsApp, que es tu bandeja de entrada de verdad. Guardar una copia solo duplicaba todo (y anotaba también a la gente que abrió WhatsApp pero nunca apretó enviar).

Según lo que haya dejado la persona, tienes botones para **Llamar**, **Responder por WhatsApp** o **Responder por correo** (se abre Gmail con el mensaje ya escrito; abajo hay un enlace por si prefieres tu propia app de correo).

Cuando termines de contestarle, marca el mensaje como **Respondido**. El filtro **Sin responder** te muestra en todo momento lo que queda pendiente.

---

## Limpieza automática

Los mensajes viejos y las fotos que ya no usa nadie se van acumulando. Para eso hay un comando:

```bash
npm run limpiar
```

Así **no borra nada**: solo te muestra un informe de qué sobra. Para que borre de verdad:

```bash
npm run limpiar -- --aplicar
```

Borra dos cosas:

- Los mensajes con más de 90 días. Para cambiar ese plazo: `npm run limpiar -- --dias=180 --aplicar`.
- Las imágenes de `public/uploads/` que ya no están asignadas a ningún producto ni a la galería del local (las subidas hace menos de 24 horas nunca se tocan, por si estás en medio de una edición).

### Dejarlo programado

En Windows, abre el **Programador de tareas** y crea una tarea básica mensual que ejecute:

```
cmd /c cd /d "C:\ruta\a\la-bodega-de-la-economia" && npm run limpiar -- --aplicar
```

En un servidor Linux, la línea equivalente de `crontab -e` (el día 1 de cada mes a las 4 AM):

```
0 4 1 * * cd /ruta/al/proyecto && npm run limpiar -- --aplicar
```

---

## Parte técnica

Para quien necesite tocar el código o desplegar el sitio.

### Comandos

```bash
npm run dev          # levanta el sitio en desarrollo
npm run build         # compila para producción
npm run start          # corre la versión compilada
npm run db:push        # aplica el esquema de la base de datos
npm run db:seed         # carga los datos iniciales (productos, admin)
npm run db:studio        # abre una interfaz visual de la base de datos
npm run imagenes          # regenera los recortes y texturas desde assets-originales/
npm run limpiar            # informe de mensajes viejos e imágenes sueltas (no borra)
npm run limpiar -- --aplicar  # ejecuta esa limpieza de verdad
npm run usuario             # crea una cuenta del panel o repone una clave olvidada
npm run formatos             # informe de qué productos tienen precio de caja o bin sin mostrar
npm run formatos -- --aplicar # marca esos formatos para que salgan en la ficha
```

### Cómo se guardan las imágenes subidas

Todo lo que se sube por el panel pasa por `sharp` en `src/app/api/upload/route.ts` y se guarda siempre en **WebP**, nunca en el formato original:

- **Foto de catálogo**: máximo 1600px de ancho, calidad 78. Se usa a ancho completo en la portada, por eso el límite alto.
- **Foto de calculadora (recorte)**: máximo 900px de ancho, calidad 86, con canal alfa. WebP conserva la transparencia igual que PNG pero pesa entre un tercio y la mitad; en pantalla el recorte nunca se dibuja a más de ~260px de alto, así que 900px sobra incluso en pantallas retina.

El panel te muestra cuánto bajó cada foto al subirla. Los archivos que dejan de usarse no se borran en el momento (la misma foto puede estar asignada a dos productos) — de eso se encarga `npm run limpiar`.

### Variables de entorno (`.env`)

```
DATABASE_URL="mysql://root@127.0.0.1:3306/bodega"
SESION_SECRETO="una-clave-larga-y-secreta"
ADMIN_EMAIL_INICIAL="correo-del-dueño"
ADMIN_PASS_INICIAL="clave-temporal"
```

`ADMIN_EMAIL_INICIAL` y `ADMIN_PASS_INICIAL` solo se usan la primera vez que se corre `db:seed`, para crear la cuenta inicial.

### La base es MariaDB, en local y en producción

El mismo motor en los dos lados, para que nada se descubra recién al publicar.
En local sale de XAMPP, que ya trae MariaDB:

```bash
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE bodega CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
npx prisma db push
```

El `DATABASE_URL` va con prefijo `mysql://` aunque el motor sea MariaDB: hablan
el mismo protocolo y el conector de Prisma es el mismo.

Las fotos que sube el panel se guardan en `public/uploads/`, en el disco del
servidor, y en la base queda la ruta relativa. Esa carpeta está en `.gitignore`,
así que no viaja en el repo y sobrevive a cada `git pull`.

Cómo está montado el hosting y el primer despliegue, en
[DESPLIEGUE.md](DESPLIEGUE.md). El paso a paso de subir cambios del día a día,
en [SUBIR-A-PRODUCCION.md](SUBIR-A-PRODUCCION.md).

### Estructura del proyecto

- `src/app/` — páginas (landing pública en `page.tsx`, panel en `admin/`, API en `api/`).
- `src/components/landing/` — secciones de la página pública.
- `src/components/admin/` — piezas del panel de administración.
- `src/components/motion/` — animaciones reutilizables (parallax, textos revelados, etc.).
- `src/lib/` — lógica compartida (base de datos, sesión, precios, WhatsApp).
- `prisma/schema.prisma` — modelo de datos.
- `scripts/preparar-imagenes.py` — genera los recortes y texturas desde `assets-originales/`.
- `scripts/limpiar-datos.ts` — mantenimiento: mensajes viejos e imágenes sueltas.
