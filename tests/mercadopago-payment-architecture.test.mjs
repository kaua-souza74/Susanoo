import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(path.join(root, file), "utf8");

test("processamento server-side usa somente a credencial de Orders", () => {
  const source = read("src/lib/mercadopago/server.ts");
  assert.match(source, /MERCADO_PAGO_ORDERS_ACCESS_TOKEN/);
  assert.doesNotMatch(source, /MERCADO_PAGO_BRICKS_ACCESS_TOKEN/);
  assert.doesNotMatch(source, /\bPayment\b/);
  assert.doesNotMatch(source, /process\.env\.MERCADO_PAGO_ACCESS_TOKEN/);
});

test("Card Brick usa a Public Key da mesma aplicação Orders", () => {
  const component = read("src/components/checkout/MercadoPagoCardBrick.tsx");
  const checkout = read("src/app/checkout/checkout-experience.tsx");
  assert.match(component, /CardPayment/);
  assert.match(component, /NEXT_PUBLIC_MERCADO_PAGO_ORDERS_PUBLIC_KEY/);
  assert.doesNotMatch(component, /NEXT_PUBLIC_MERCADO_PAGO_BRICKS_PUBLIC_KEY/);
  assert.doesNotMatch(component, /NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY/);
  assert.match(checkout, /paymentMethod === "card"/);
  assert.match(checkout, /<MercadoPagoCardBrick/);
  assert.match(checkout, /isSandbox=\{service\.isSandbox\}/);
  assert.match(component, /\{isSandbox \? \(/);
});

test("Card Brick preserva o tipo detectado pelo provider sem forçar crédito", () => {
  const component = read("src/components/checkout/MercadoPagoCardBrick.tsx");
  assert.match(component, /additionalData\?: CardSubmitAdditionalData/);
  assert.match(component, /recordValue\(additionalData, "paymentTypeId"\)/);
  assert.match(component, /payment_type_id: paymentTypeId/);
  assert.match(component, /excluded: \["prepaid_card" as const\]/);
  assert.doesNotMatch(component, /payment_type_id: "credit_card"/);
});

test("Card Brick cria nova tentativa explícita após rejeição e remonta para novo token", () => {
  const component = read("src/components/checkout/MercadoPagoCardBrick.tsx");
  assert.match(component, /result\?\.status === "rejected"/);
  assert.match(component, /Tentar novamente/);
  assert.match(component, /beginNewCardAttempt/);
  assert.match(component, /key=\{brickAttemptKey\}/);
  assert.match(component, /setBrickAttemptKey\(\(current\) => current \+ 1\)/);
  assert.match(component, /additionalData\?: CardSubmitAdditionalData/);
  assert.doesNotMatch(component, /payment_type_id: "debit_card"/);
});

test("sandbox é fail-closed e centralizado no ambiente Preview", () => {
  const checkoutMode = read("src/lib/mercadopago/checkout-mode.ts");
  const webhook = read("src/app/api/mercadopago/webhook/route.ts");
  assert.match(checkoutMode, /process\.env\.VERCEL_ENV === "preview"/);
  assert.match(checkoutMode, /process\.env\.MERCADO_PAGO_SANDBOX === "true"/);
  assert.match(webhook, /isMercadoPagoSandboxEnabled\(\)/);
  assert.doesNotMatch(webhook, /process\.env\.MERCADO_PAGO_SANDBOX/);
});

test("Card Brick diferencia erros críticos sem registrar dados sensíveis", () => {
  const component = read("src/components/checkout/MercadoPagoCardBrick.tsx");
  assert.match(component, /onError=\{\(error\) =>/);
  assert.match(component, /error\.type === "non_critical"/);
  assert.match(component, /Mercado Pago não conseguiu validar este cartão no momento/);
  assert.match(component, /type: error\.type \?\? null/);
  assert.match(component, /cause: error\.cause \?\? null/);
  assert.match(component, /message: error\.message \?\? null/);
  const diagnosticBlock = component.slice(
    component.indexOf("[Mercado Pago Card Brick] error"),
    component.indexOf("if (submissionErrorRef.current)"),
  );
  assert.doesNotMatch(diagnosticBlock, /token|payer|document|email|publicKey|formData|bin/i);
});

test("endpoint temporário PIX diagnostics foi removido", () => {
  assert.throws(() => read("src/app/api/mercadopago/diagnostics/pix-minimal/route.ts"));
});
