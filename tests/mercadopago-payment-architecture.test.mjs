import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(path.join(root, file), "utf8");

test("clientes server-side usam credenciais separadas de Orders e Bricks", () => {
  const source = read("src/lib/mercadopago/server.ts");
  assert.match(source, /MERCADO_PAGO_ORDERS_ACCESS_TOKEN/);
  assert.match(source, /MERCADO_PAGO_BRICKS_ACCESS_TOKEN/);
  assert.doesNotMatch(source, /process\.env\.MERCADO_PAGO_ACCESS_TOKEN/);
});

test("checkout usa Card Payment Brick e a Public Key exclusiva do Bricks", () => {
  const component = read("src/components/checkout/MercadoPagoCardBrick.tsx");
  const checkout = read("src/app/checkout/checkout-experience.tsx");
  assert.match(component, /CardPayment/);
  assert.match(component, /NEXT_PUBLIC_MERCADO_PAGO_BRICKS_PUBLIC_KEY/);
  assert.doesNotMatch(component, /NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY/);
  assert.match(checkout, /paymentMethod === "card"/);
  assert.match(checkout, /<MercadoPagoCardBrick/);
});

test("endpoint temporário PIX diagnostics foi removido", () => {
  assert.throws(() => read("src/app/api/mercadopago/diagnostics/pix-minimal/route.ts"));
});
