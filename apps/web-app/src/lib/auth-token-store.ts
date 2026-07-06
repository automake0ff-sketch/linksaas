/**
 * El access token vive SOLO en memoria (variable de módulo + estado de
 * React donde se necesite), nunca en localStorage/sessionStorage — un XSS
 * que lea localStorage se lleva el token; uno que lea memoria de proceso
 * necesita mucho más. El refresh token, más sensible aún, ni siquiera pasa
 * por JS: vive en cookie httpOnly puesta por la API (ver auth.controller.ts).
 */
let currentAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  currentAccessToken = token;
}

export function getAccessToken(): string | null {
  return currentAccessToken;
}
