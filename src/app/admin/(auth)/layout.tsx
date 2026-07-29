import Image from "next/image";

export default function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-svh items-center justify-center px-6 py-12"
      style={{ background: "linear-gradient(160deg, #E6FAF5, #FFFFFF)" }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image src="/logo.png" width={64} height={64} alt="La bodega de la economía" />
          <p className="font-titulo text-verde-700" style={{ fontSize: 20 }}>
            La bodega de la economía
          </p>
        </div>
        <div className="rounded-3xl bg-white p-7 shadow-[var(--shadow-media)]">{children}</div>
      </div>
    </div>
  );
}
