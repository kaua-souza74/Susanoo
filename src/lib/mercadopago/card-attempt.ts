type CardAttemptStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type CardAttemptContext = {
  serviceId: string;
  sessionScope: string;
};

type CardAttemptDependencies = CardAttemptContext & {
  storage: CardAttemptStorage;
  randomUUID: () => string;
};

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
