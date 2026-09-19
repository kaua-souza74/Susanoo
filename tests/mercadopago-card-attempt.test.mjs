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
