import * as crypto from "node:crypto";

import { MercadoPagoError } from "mercadopago";
import { NextResponse } from "next/server";

import {
  MercadoPagoConfigurationError,
  getMercadoPagoPaymentClient,
} from "@/lib/mercadopago/server";

export const runtime = "nodejs";

const ROUTE = "/api/mercadopago/diagnostics/pix-minimal";
const MAX_REQUEST_BYTES = 512;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (process.env.VERCEL_ENV !== "preview") {
    return errorResponse("Não encontrado.", 404);
  }

  if (!isJsonRequest(request)) {
    return errorResponse("Content-Type deve ser application/json.", 415);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return errorResponse("Requisição muito grande.", 413);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
    return errorResponse("Requisição muito grande.", 413);
  }

  const email = parseEmailRequest(rawBody);
  if (!email) {
    return errorResponse("E-mail inválido.", 400);
  }

  try {
    const payment = await getMercadoPagoPaymentClient().create({
      body: {
        transaction_amount: 50,
        description: "Susanoo PIX diagnostic",
        payment_method_id: "pix",
        payer: { email },
      },
      requestOptions: {
        idempotencyKey: crypto.randomUUID(),
      },
    });

    console.info(
      JSON.stringify({
        route: ROUTE,
        stage: "mercadopago_success",
        provider_payment_id:
          typeof payment.id === "number" || typeof payment.id === "string"
            ? String(payment.id)
            : null,
        status: typeof payment.status === "string" ? payment.status : null,
      }),
    );

    return NextResponse.json(
      {
        providerId:
          typeof payment.id === "number" || typeof payment.id === "string"
            ? String(payment.id)
            : null,
        status: typeof payment.status === "string" ? payment.status : null,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error: unknown) {
    logMercadoPagoError(error);

    if (error instanceof MercadoPagoConfigurationError) {
      return errorResponse("Serviço de pagamento indisponível.", 503);
    }
    return errorResponse("Falha no diagnóstico PIX.", 502);
  }
}

function parseEmailRequest(rawBody: string): string | null {
  let value: unknown;
  try {
    value = JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }

  if (!isRecord(value) || Object.keys(value).some((key) => key !== "email")) {
    return null;
  }
  if (typeof value.email !== "string") return null;

  const email = value.email.trim().toLowerCase();
  return email.length >= 3 && email.length <= 254 && EMAIL_PATTERN.test(email)
    ? email
    : null;
}

function logMercadoPagoError(error: unknown) {
  const isMercadoPagoError = error instanceof MercadoPagoError;

  console.error(
    JSON.stringify({
      route: ROUTE,
      stage: "mercadopago_error",
      http_status: isMercadoPagoError ? error.status : null,
      message: isMercadoPagoError ? error.message : null,
      error: isMercadoPagoError ? error.error : null,
      causes: isMercadoPagoError
        ? error.causes.map(toSafeCause).filter((cause) => cause !== null)
        : [],
      mercadopago_request_id: null,
    }),
  );
}

function toSafeCause(cause: unknown) {
  if (!isRecord(cause)) return null;
  return {
    code:
      typeof cause.code === "string" || typeof cause.code === "number"
        ? cause.code
        : null,
    description:
      typeof cause.description === "string" ? cause.description : null,
  };
}

function isJsonRequest(request: Request) {
  return (
    request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json") ?? false
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
