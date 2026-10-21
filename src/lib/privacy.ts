export const PRIVACY_CONSENT_ERROR = 'Debes aceptar el aviso de privacidad para crear tu cuenta.';

export function getPrivacyConsentError(accepted: unknown): string | undefined {
  return accepted === true ? undefined : PRIVACY_CONSENT_ERROR;
}