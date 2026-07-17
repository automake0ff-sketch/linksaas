export const metadata = { title: 'Política de privacidad — LinkForge' };

/**
 * PLANTILLA — no es asesoramiento legal. Antes de publicar de verdad:
 * 1. Sustituye los datos entre [corchetes] por los reales (razón social,
 *    NIF, dirección, email de contacto del responsable del tratamiento).
 * 2. Que la revise un abogado si vas a operar con usuarios en la UE (RGPD)
 *    o California (CCPA) — esta plantilla cubre la estructura habitual,
 *    no sustituye asesoría específica de tu caso.
 * 3. Actualiza la lista de subencargados (Render, Vercel, Resend, Sentry,
 *    Stripe cuando se conecte) si añades o quitas algún proveedor.
 */
export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-text-primary">
      <h1 className="font-display text-3xl font-semibold">Política de privacidad</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Última actualización: [fecha]. Responsable del tratamiento: [razón social], [NIF], [dirección].
        Contacto: [email de privacidad].
      </p>

      <Section title="1. Qué datos recogemos">
        <ul className="list-disc space-y-1 pl-5">
          <li>Datos de cuenta: nombre, email, contraseña (almacenada solo como hash, nunca en texto plano).</li>
          <li>Contenido que publicas: bloques de tu página, temas, imágenes que subas.</li>
          <li>Datos de uso de tu página pública: visitas, clics, país, dispositivo, referer (analítica agregada de tus visitantes).</li>
          <li>Datos técnicos de la cuenta: dirección IP en el momento del registro/login, para prevención de abuso.</li>
        </ul>
      </Section>

      <Section title="2. Para qué usamos tus datos">
        <ul className="list-disc space-y-1 pl-5">
          <li>Prestar el servicio (crear y publicar tu página).</li>
          <li>Comunicarnos contigo (verificación de cuenta, recuperación de contraseña, avisos de servicio).</li>
          <li>Analítica agregada de tu propia página, que te mostramos en tu panel.</li>
          <li>Prevención de abuso y fraude (rate limiting, detección de patrones anómalos).</li>
        </ul>
      </Section>

      <Section title="3. Con quién compartimos datos">
        <p>
          No vendemos tus datos. Los compartimos únicamente con los proveedores que hacen
          funcionar el servicio, bajo sus propios acuerdos de tratamiento de datos:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Alojamiento de base de datos y servidor de la aplicación: Render.</li>
          <li>Alojamiento del panel y la página pública: Vercel.</li>
          <li>Envío de emails transaccionales: Resend.</li>
          <li>Monitorización de errores: Sentry (si está activo).</li>
          <li>Procesamiento de pagos: [Stripe/proveedor], cuando se active el cobro.</li>
        </ul>
      </Section>

      <Section title="4. Cuánto tiempo conservamos tus datos">
        <p>
          Mientras tu cuenta esté activa. Si eliminas tu cuenta, borramos tus datos personales
          en un plazo de [30 días], salvo lo que debamos conservar por obligación legal (ej.
          facturación).
        </p>
      </Section>

      <Section title="5. Tus derechos">
        <p>
          Puedes solicitar acceso, corrección, eliminación o exportación de tus datos escribiendo a
          [email de privacidad]. Si estás en la UE, también tienes derecho a reclamar ante tu
          autoridad de protección de datos.
        </p>
      </Section>

      <Section title="6. Cookies">
        <p>
          Usamos cookies estrictamente necesarias para mantener tu sesión iniciada. Ver el banner
          de cookies y la sección correspondiente para más detalle.
        </p>
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
