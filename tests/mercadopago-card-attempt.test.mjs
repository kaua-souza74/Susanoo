import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const projectRoot = path.resolve(import.meta.dirname, "..");

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(
        pathToFileURL(path.join(projectRoot, "src", `${specifier.slice(2)}.ts`)).href,
        context,
      );
    }
    return nextResolve(specifier, context);
  },
});

const {
  beginNewCardAttempt,
  getOrCreateCardAttemptSessionId,
  markCardAttemptRejected,
  pollCardAttemptStatus,
} = await import("../src/lib/mercadopago/card-attempt.ts");

const context = {
  serviceId: "site-institucional",
  sessionScope: "user-1",
};

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test("retry técnico conserva a mesma tentativa e idempotência lógica", () => {
  const storage = memoryStorage();
  let generated = 0;
  const dependencies = {
    ...context,
    storage,
    randomUUID: () => `attempt-${++generated}`,
  };

  assert.equal(getOrCreateCardAttemptSessionId(dependencies), "attempt-1");
  assert.equal(getOrCreateCardAttemptSessionId(dependencies), "attempt-1");
  assert.equal(generated, 1);
});

test("rejeição seguida de nova ação explícita cria outra tentativa", () => {
  const storage = memoryStorage();
  let generated = 0;
  const dependencies = {
    ...context,
    storage,
    randomUUID: () => `attempt-${++generated}`,
  };
  const rejectedAttempt = getOrCreateCardAttemptSessionId(dependencies);
  markCardAttemptRejected(storage, context, rejectedAttempt);

  const nextAttempt = beginNewCardAttempt(dependencies);

  assert.equal(rejectedAttempt, "attempt-1");
  assert.equal(nextAttempt, "attempt-2");
  assert.notEqual(nextAttempt, rejectedAttempt);
});

test("refresh não cria cobrança e o próximo submit após rejeição usa nova tentativa", () => {
  const storage = memoryStorage();
  let generated = 0;
  const dependencies = {
    ...context,
    storage,
    randomUUID: () => `attempt-${++generated}`,
  };
  const rejectedAttempt = getOrCreateCardAttemptSessionId(dependencies);
  markCardAttemptRejected(storage, context, rejectedAttempt);

  assert.equal(generated, 1, "refresh sozinho não executa helper nem cria tentativa");
  assert.equal(getOrCreateCardAttemptSessionId(dependencies), "attempt-2");
});

test("tentativa aprovada não é rotacionada implicitamente", () => {
  const storage = memoryStorage();
  let generated = 0;
  const dependencies = {
    ...context,
    storage,
    randomUUID: () => `attempt-${++generated}`,
  };

  const approvedAttempt = getOrCreateCardAttemptSessionId(dependencies);
  assert.equal(getOrCreateCardAttemptSessionId(dependencies), approvedAttempt);
  assert.equal(generated, 1);
});

test("polling termina em rejected sem criar nova operação", async () => {
  const statuses = [{ status: "pending" }, { status: "rejected" }];
  let reads = 0;
  let waits = 0;
  const result = await pollCardAttemptStatus({
    readStatus: async () => statuses[reads++] ?? null,
    wait: async () => {
      waits += 1;
    },
    maxAttempts: 8,
  });

  assert.equal(result?.status, "rejected");
  assert.equal(reads, 2);
  assert.equal(waits, 1);
});

test("polling termina em approved mesmo após resposta inicial incerta", async () => {
  const statuses = [{ status: "pending" }, { status: "approved" }];
  let reads = 0;
  const result = await pollCardAttemptStatus({
    readStatus: async () => statuses[reads++] ?? null,
    wait: async () => {},
  });

  assert.equal(result?.status, "approved");
  assert.equal(reads, 2);
});

test("polling pending é limitado e não executa criação de pagamento", async () => {
  let reads = 0;
  let waits = 0;
  const result = await pollCardAttemptStatus({
    readStatus: async () => {
      reads += 1;
      return { status: "pending" };
    },
    wait: async () => {
      waits += 1;
    },
    maxAttempts: 3,
  });

  assert.equal(result?.status, "pending");
  assert.equal(reads, 3);
  assert.equal(waits, 2);
});
