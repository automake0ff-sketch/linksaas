export const metadata = { title: 'Términos de servicio — LinkForge' };

/**
 * PLANTILLA — no es asesoramiento legal, misma advertencia que privacy/page.tsx.
 * Revisar con un abogado antes de operar con clientes de pago reales,
 * especialmente las secciones de responsabilidad y cancelación.
 */
export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-text-primary">
      <h1 className="font-display text-3xl font-semibold">Términos de servicio</h1>
      <p className="mt-2 text-sm text-text-secondary">Última actualización: [fecha].</p>

      <Section title="1. Qué es LinkForge">
        <p>
          LinkForge es una plataforma para crear una página pública de enlaces, con editor
          visual, temas y analítica. Al crear una cuenta, aceptas estos términos.
        </p>
      </Section>

      <Section title="2. Tu cuenta">
        <ul className="list-disc space-y-1 pl-5">
          <li>Eres responsable de mantener segura tu contraseña.</li>
          <li>Debes tener al menos [16/18] años para crear una cuenta.</li>
          <li>Una cuenta es para una persona o entidad — no la compartas ni la revendas.</li>
        </ul>
      </Section>

      <Section title="3. Contenido que publicas">
        <p>
          Eres el único responsable del contenido de tu página pública. No está permitido publicar
          contenido ilegal, que infrinja derechos de terceros, que suplante a otra persona, o que
          incite al odio o la violencia. Nos reservamos el derecho de suspender páginas que
          incumplan esto.
        </p>
      </Section>

      <Section title="4. Planes y pagos">
        <p>
          [Descripción de los planes disponibles y su precio]. Los pagos [se gestionan
          manualmente / vía Stripe] durante esta fase inicial del servicio. [Política de
          reembolso].
        </p>
      </Section>

      <Section title="5. Disponibilidad del servicio">
        <p>
          Hacemos lo razonable por mantener el servicio disponible, pero no garantizamos un
          porcentaje de uptime durante esta fase inicial. Te avisaremos con antelación razonable
          de mantenimientos planificados que puedan afectar a tu página.
        </p>
      </Section>

      <Section title="6. Cancelación">
        <p>
          Puedes eliminar tu cuenta en cualquier momento desde el panel [o escribiendo a
          soporte]. Al eliminarla, tu página pública deja de estar disponible de inmediato.
        </p>
      </Section>

      <Section title="7. Limitación de responsabilidad">
        <p>
          El servicio se ofrece &quot;tal cual&quot;. En la medida permitida por la ley, no somos
          responsables de daños indirectos derivados del uso del servicio. [Esta sección
          requiere revisión legal específica de tu jurisdicción antes de publicarse.]
        </p>
      </Section>

      <Section title="8. Cambios en estos términos">
        <p>
          Podemos actualizar estos términos. Si el cambio es significativo, te avisaremos por
          email antes de que entre en vigor.
        </p>
      </Section>

      <Section title="9. Contacto">
        <p>[Email de contacto].</p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-text-secondary">{children}</div>
    </section>
  );
}
