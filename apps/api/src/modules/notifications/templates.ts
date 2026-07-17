const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

export function passwordResetEmail(rawToken: string): { subject: string; html: string } {
  const link = `${FRONTEND_URL}/reset-password?token=${rawToken}`;
  return {
    subject: 'Recupera tu contraseña de LinkForge',
    html: `
      <p>Alguien (esperamos que tú) pidió restablecer la contraseña de tu cuenta de LinkForge.</p>
      <p><a href="${link}">Elegir una nueva contraseña</a></p>
      <p>Este enlace caduca en 1 hora. Si no fuiste tú, puedes ignorar este email — tu contraseña no cambiará.</p>
    `,
  };
}

export function welcomeEmail(name?: string): { subject: string; html: string } {
  return {
    subject: 'Bienvenido a LinkForge',
    html: `
      <p>Hola${name ? ` ${name}` : ''},</p>
      <p>Tu cuenta de LinkForge ya está lista. Entra en <a href="${FRONTEND_URL}">${FRONTEND_URL}</a> para crear tu página.</p>
    `,
  };
}
