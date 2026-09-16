const ADMIN_USER_IDS = new Set([
  "f981bed8-1965-478b-84d1-c7de041731dc",
  "9f285817-8dfd-48da-a797-c6caeda9906b",
]);
export function isAdminUserId(id: string): boolean {
  return ADMIN_USER_IDS.has(id);
}
