type CardAttemptStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type CardAttemptContext = {
  serviceId: string;
  sessionScope: string;
};

type CardAttemptDependencies = CardAttemptContext & {
  storage: CardAttemptStorage;
  randomUUID: () => string;
};

type PollCardAttemptDependencies<T extends { status: string }> = {
  readStatus: () => Promise<T | null>;
  wait: (milliseconds: number) => Promise<void>;
  maxAttempts?: number;
  intervalMs?: number;
};

const TRANSIENT_CARD_STATUSES = new Set(["pending", "in_review"]);

const TERMINAL_CARD_STATUSES = new Set([
  "approved",
  "rejected",
  "cancelled",
  "refunded",
]);

export function isTransientCardAttemptStatus(status: string): boolean {
  return TRANSIENT_CARD_STATUSES.has(status);
}

export async function pollCardAttemptStatus<T extends { status: string }>({
  readStatus,
  wait,
  maxAttempts = 8,
  intervalMs = 1_500,
}: PollCardAttemptDependencies<T>) {
  let latestStatus: T | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    latestStatus = (await readStatus()) ?? latestStatus;
    if (latestStatus && TERMINAL_CARD_STATUSES.has(latestStatus.status)) {
      return latestStatus;
    }
    if (attempt < maxAttempts - 1) {
      await wait(intervalMs);
    }
  }

  return latestStatus;
}

export function getOrCreateCardAttemptSessionId({
  storage,
  randomUUID,
  ...context
}: CardAttemptDependencies) {
  const sessionKey = cardAttemptSessionKey(context);
  const rejectedKey = cardAttemptRejectedKey(context);
  const storedId = storage.getItem(sessionKey);

  if (storedId && storage.getItem(rejectedKey) !== storedId) {
    return storedId;
  }

  return createCardAttempt(storage, randomUUID, sessionKey, rejectedKey);
}

export function beginNewCardAttempt({
  storage,
  randomUUID,
  ...context
}: CardAttemptDependencies) {
  return createCardAttempt(
    storage,
    randomUUID,
    cardAttemptSessionKey(context),
    cardAttemptRejectedKey(context),
  );
}

export function markCardAttemptRejected(
  storage: CardAttemptStorage,
  context: CardAttemptContext,
  checkoutSessionId: string,
) {
  storage.setItem(cardAttemptRejectedKey(context), checkoutSessionId);
}

function createCardAttempt(
  storage: CardAttemptStorage,
  randomUUID: () => string,
  sessionKey: string,
  rejectedKey: string,
) {
  const checkoutSessionId = randomUUID();
  storage.setItem(sessionKey, checkoutSessionId);
  storage.removeItem(rejectedKey);
  return checkoutSessionId;
}

function cardAttemptSessionKey({ serviceId, sessionScope }: CardAttemptContext) {
  return `susanoo_mp_brick_${serviceId}_${sessionScope}`;
}

function cardAttemptRejectedKey(context: CardAttemptContext) {
  return `${cardAttemptSessionKey(context)}_rejected`;
}
