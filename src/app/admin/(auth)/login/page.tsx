"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function FormularioLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const [identificador, setIdentificador] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identificador, clave }),
      });
      if (!resp.ok) {
        const datos = await resp.json().catch(() => ({}));
        setError(datos.error ?? "No se pudo entrar. Intenta de nuevo.");
        setCargando(false);
        return;
      }
      router.push(params.get("siguiente") || "/admin");
      router.refresh();
    } catch {
      setError("No se pudo conectar. Revisa tu internet.");
      setCargando(false);
    }
  }

  return (
    <>
      <h1 className="text-center font-titulo text-verde-700" style={{ fontSize: 22 }}>
        Entrar al panel
      </h1>
      <form onSubmit={manejarEnvio} className="mt-6 space-y-4">
        <div>
          <label htmlFor="login-usuario" className="block text-sm font-semibold text-tinta">
            Usuario o correo
          </label>
          <input
            id="login-usuario"
            type="text"
            required
            autoComplete="username"
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-tinta/15 px-3 py-2.5 outline-none focus:border-cyan-400"
          />
        </div>
        <div>
          <label htmlFor="login-clave" className="block text-sm font-semibold text-tinta">
            Clave
          </label>
          <input
            id="login-clave"
            type="password"
            required
            autoComplete="current-password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-tinta/15 px-3 py-2.5 outline-none focus:border-cyan-400"
          />
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
          {cargando ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-tinta-suave">
        ¿No tienes cuenta?{" "}
        <Link href="/admin/registro" className="font-semibold text-cyan-700">
          Crea tu cuenta
        </Link>
      </p>
    </>
  );
}

export default function PaginaLogin() {
  return (
    <Suspense fallback={null}>
      <FormularioLogin />
    </Suspense>
  );
}
