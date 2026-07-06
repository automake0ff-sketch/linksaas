export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-text-primary">Tu página</h1>
      <p className="mt-1 text-text-secondary">
        Aquí vivirá el editor de bloques (drag&drop, temas, publicar/borrador) — Fase A.
      </p>

      <div className="mt-8 rounded-lg border border-dashed border-border p-10 text-center">
        <p className="text-sm text-text-secondary">
          Todavía no has añadido ningún bloque. El editor visual se implementa
          en el siguiente incremento (Fase A del roadmap).
        </p>
      </div>
    </div>
  );
}
