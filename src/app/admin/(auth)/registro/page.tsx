"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PaginaRegistro() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [usuario, setUsuario] = useState("");
  const [nombre, setNombre] = useState("");
  const [palabraClave, setPalabraClave] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      const resp = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, usuario, nombre, clave, palabraClave }),
      });
      if (!resp.ok) {
        const datos = await resp.json().catch(() => ({}));
        setError(datos.error ?? "No se pudo crear la cuenta.");
        setCargando(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("No se pudo conectar. Revisa tu internet.");
      setCargando(false);
    }
  }

  return (
    <>
      <h1 className="text-center font-titulo text-verde-700" style={{ fontSize: 22 }}>
        Crear tu cuenta
      </h1>
      <p className="mt-2 text-center text-sm text-tinta-suave">
        Necesitas la palabra clave del sitio. Pídesela a quien lo administra.
      </p>
      <form onSubmit={manejarEnvio} className="mt-6 space-y-4">
        <div>
          <label htmlFor="reg-email" className="block text-sm font-semibold text-tinta">
            Correo
          </label>
          <input
            id="reg-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-tinta/15 px-3 py-2.5 outline-none focus:border-cyan-400"
          />
        </div>
        <div>
          <label htmlFor="reg-usuario" className="block text-sm font-semibold text-tinta">
            Usuario
          </label>
          <input
            id="reg-usuario"
            type="text"
            required
            minLength={3}
            maxLength={30}
            autoComplete="username"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-tinta/15 px-3 py-2.5 outline-none focus:border-cyan-400"
          />
          <p className="mt-1 text-xs text-tinta-suave">
            Con esto entras después, sin escribir el correo. Sin espacios.
          </p>
        </div>
        <div>
          <label htmlFor="reg-nombre" className="block text-sm font-semibold text-tinta">
            Tu nombre
          </label>
          <input
            id="reg-nombre"
            type="text"
            required
            autoComplete="name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-tinta/15 px-3 py-2.5 outline-none focus:border-cyan-400"
          />
        </div>
        <div>
          <label htmlFor="reg-clave" className="block text-sm font-semibold text-tinta">
            Clave
          </label>
          <input
            id="reg-clave"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-tinta/15 px-3 py-2.5 outline-none focus:border-cyan-400"
          />
          <p className="mt-1 text-xs text-tinta-suave">Mínimo 8 caracteres.</p>
        </div>
        <div>
          <label htmlFor="reg-palabra" className="block text-sm font-semibold text-tinta">
            Palabra clave del sitio
          </label>
          <input
            id="reg-palabra"
            type="password"
            autoComplete="off"
            value={palabraClave}
            onChange={(e) => setPalabraClave(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-tinta/15 px-3 py-2.5 outline-none focus:border-cyan-400"
          />
          <p className="mt-1 text-xs text-tinta-suave">
            No es tu clave: es la palabra que habilita crear cuentas.
          </p>
        </div>

        {error && (
          <p className="text-sm" style={{ color: "var(--color-naranja-texto)" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-full bg-verde-600 py-3 font-semibold text-white disabled:opacity-70"
        >
          {cargando ? "Creando…" : "Crear cuenta"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-tinta-suave">
        ¿Ya tienes cuenta?{" "}
        <Link href="/admin/login" className="font-semibold text-cyan-700">
          Entra aquí
        </Link>
      </p>
    </>
  );
}
