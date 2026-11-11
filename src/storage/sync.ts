import { createBackup, parseBackup, type Backup } from './backup';
import type { CardState, ReviewLogEntry } from './types';

/**
 * Device sync through a private GitHub Gist.
 * Each device merges its own backup with the one in the gist, then uploads the result:
 * - review logs: union (deduplicated), so no review is ever lost;
 * - card state: the copy with the most recent review wins;
 * - settings: this device keeps its own (they are per-device preferences),
 *   except the list of street phrases, which is unioned.
 */

const logId = (log: ReviewLogEntry) => `${log.key}|${new Date(log.revlog.reviewTime).getTime()}|${log.revlog.rating}`;

const lastReview = (state: CardState) => {
  const at = state.fsrs.lastReviewAt;
  return at ? new Date(at).getTime() : -1;
};

export function mergeBackups(local: Backup, remote: Backup, now: Date): Backup {
  const cards = new Map<string, CardState>();
  for (const card of [...remote.cards, ...local.cards]) {
    const current = cards.get(card.key);
    // Ties keep the local copy (it comes later), so a local suspend survives.
    if (!current || lastReview(card) >= lastReview(current)) cards.set(card.key, card);
  }
  const logs = new Map<string, ReviewLogEntry>();
  for (const log of [...remote.logs, ...local.logs]) {
    // Ids are per-device auto-increment keys; IndexedDB assigns new ones on import.
    const { id: _id, ...rest } = log;
    logs.set(logId(log), rest);
  }
  const sortedLogs = [...logs.values()].sort(
    (a, b) => new Date(a.revlog.reviewTime).getTime() - new Date(b.revlog.reviewTime).getTime(),
  );
  const settings = {
    ...local.settings,
    streetPhrases: [...new Set([...local.settings.streetPhrases, ...remote.settings.streetPhrases])],
  };
  // Practice results: per skill, the device that practised most recently wins.
  const skills = { ...remote.skills };
  for (const [skill, stat] of Object.entries(local.skills)) {
    const other = skills[skill];
    if (!other || stat.last >= other.last) skills[skill] = stat;
  }
  return createBackup([...cards.values()], sortedLogs, settings, now, skills);
}

/** True when merging brought in anything this device did not have. */
export function hasRemoteChanges(local: Backup, merged: Backup): boolean {
  if (merged.logs.length !== local.logs.length) return true;
  if (merged.settings.streetPhrases.length !== local.settings.streetPhrases.length) return true;
  if (Object.entries(merged.skills).some(([skill, stat]) => local.skills[skill]?.last !== stat.last)) return true;
  const localByKey = new Map(local.cards.map((card) => [card.key, card]));
  return merged.cards.some((card) => {
    const mine = localByKey.get(card.key);
    return !mine || lastReview(mine) !== lastReview(card);
  });
}

// ---------- GitHub Gist transport ----------

const API = 'https://api.github.com';
const FILE = 'wortschatz-backup.json';
const DESCRIPTION = 'wortschatz-sync (Almanca öğrenme uygulaması yedeği)';

export interface GistConfig {
  token: string;
  gistId: string | null;
}

async function github(token: string, path: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (response.status === 401) throw new Error('GitHub anahtarı geçersiz ya da süresi dolmuş.');
  if (response.status === 403 || response.status === 404) {
    throw new Error('GitHub erişimi reddedildi. Anahtarın "Gists" iznine sahip olduğundan emin ol.');
  }
  if (!response.ok) throw new Error(`GitHub hatası: ${response.status}`);
  return response;
}

interface GistFile {
  content?: string;
  truncated?: boolean;
  raw_url?: string;
}
interface Gist {
  id: string;
  description: string | null;
  files: Record<string, GistFile | undefined>;
}

/** Finds the sync gist: the remembered id, or one with our description (second device). */
async function findGist(config: GistConfig): Promise<Gist | null> {
  if (config.gistId) {
    try {
      return (await (await github(config.token, `/gists/${config.gistId}`)).json()) as Gist;
    } catch {
      // Deleted or not accessible: fall back to searching.
    }
  }
  const list = (await (await github(config.token, '/gists?per_page=100')).json()) as Gist[];
  const match = list.find((gist) => gist.description === DESCRIPTION && gist.files[FILE]);
  return match ? ((await (await github(config.token, `/gists/${match.id}`)).json()) as Gist) : null;
}

async function readFile(token: string, file: GistFile): Promise<string> {
  if (!file.truncated && file.content !== undefined) return file.content;
  if (!file.raw_url) throw new Error('Gist dosyası okunamadı.');
  const response = await fetch(file.raw_url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Gist dosyası okunamadı: ${response.status}`);
  return response.text();
}

export interface SyncResult {
  gistId: string;
  /** Merged backup JSON to import, or null when nothing new came from other devices. */
  imported: string | null;
}

/**
 * One sync round. `localJson` is this device's export; returns the gist id and,
 * if other devices added reviews, the merged backup to import locally.
 */
export async function syncWithGist(config: GistConfig, localJson: string, now = new Date()): Promise<SyncResult> {
  const local = parseBackup(localJson);
  const gist = await findGist(config);
  const remoteFile = gist?.files[FILE];
  const merged = remoteFile ? mergeBackups(local, parseBackup(await readFile(config.token, remoteFile)), now) : local;
  const body = JSON.stringify({
    description: DESCRIPTION,
    files: { [FILE]: { content: JSON.stringify(merged) } },
    ...(gist ? {} : { public: false }),
  });
  const saved = (await (
    await github(config.token, gist ? `/gists/${gist.id}` : '/gists', { method: gist ? 'PATCH' : 'POST', body })
  ).json()) as Gist;
  return { gistId: saved.id, imported: hasRemoteChanges(local, merged) ? JSON.stringify(merged) : null };
}
