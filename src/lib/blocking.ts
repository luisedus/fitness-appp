// User blocking system
const BLOCKED_KEY = 'gymbros_blocked_users';

export interface BlockRecord {
  userId: string;
  blockedBy: string;
  blockedAt: string;
  reason: string;
}

export function getBlockedUsers(): BlockRecord[] {
  try { return JSON.parse(localStorage.getItem(BLOCKED_KEY) || '[]'); } catch { return []; }
}

function saveBlocked(records: BlockRecord[]) {
  localStorage.setItem(BLOCKED_KEY, JSON.stringify(records));
}

export function blockUser(userId: string, blockedBy: string, reason: string): BlockRecord {
  const records = getBlockedUsers();
  const existing = records.find(r => r.userId === userId);
  if (existing) return existing;
  const record: BlockRecord = {
    userId,
    blockedBy,
    blockedAt: new Date().toLocaleString('es-ES'),
    reason,
  };
  saveBlocked([...records, record]);
  return record;
}

export function unblockUser(userId: string): boolean {
  const records = getBlockedUsers();
  const filtered = records.filter(r => r.userId !== userId);
  saveBlocked(filtered);
  return filtered.length < records.length;
}

export function isUserBlocked(userId: string): boolean {
  return getBlockedUsers().some(r => r.userId === userId);
}

export function getBlockRecord(userId: string): BlockRecord | undefined {
  return getBlockedUsers().find(r => r.userId === userId);
}
