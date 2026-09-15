import "server-only";

const SANDBOX_AMOUNT_IN_CENTS = 5_000;
const SANDBOX_PAYER_EMAIL = "test_user_br@testuser.com";
const SANDBOX_PAYER_FIRST_NAME = "APRO";

export type MercadoPagoCheckoutMode = {
  isSandbox: boolean;
  amountInCents: number;
  sessionScope: string;
};

export function isMercadoPagoSandboxEnabled(): boolean {
  return (
    process.env.VERCEL_ENV === "preview" &&
    process.env.MERCADO_PAGO_SANDBOX === "true"
  );
}

export function getMercadoPagoCheckoutMode(
  catalogAmountInCents: number,
): MercadoPagoCheckoutMode {
  const isSandbox = isMercadoPagoSandboxEnabled();
  const amountInCents = isSandbox
    ? SANDBOX_AMOUNT_IN_CENTS
    : catalogAmountInCents;

  return {
    isSandbox,
    amountInCents,
    sessionScope: isSandbox
      ? `sandbox-${SANDBOX_AMOUNT_IN_CENTS}`
      : `catalog-${catalogAmountInCents}`,
  };
}

export function getMercadoPagoPayer(
  mode: MercadoPagoCheckoutMode,
  authenticatedEmail: string,
) {
  if (mode.isSandbox) {
    return {
      email: SANDBOX_PAYER_EMAIL,
      firstName: SANDBOX_PAYER_FIRST_NAME,
    };
  }

  return {
    email: authenticatedEmail,
    firstName: null,
  };
}
