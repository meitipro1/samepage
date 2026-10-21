import { unstable_cache } from 'next/cache';

import { CONTRACT, readClient, retried } from './genlayer-core.mjs';
import type { NotFound, PageFull, PageItem, PageList } from './types';

/**
 * Reads happen on the server, cached for a short while under tags.
 *
 * Studio Next rate-limits each IP, and every visitor's page view would
 * otherwise spend the server's budget. Shared reads are cached for 20 seconds;
 * after a decided write the page POSTs /api/refresh, which expires the tags it
 * touched, so the person who wrote sees their own result at once.
 */

const client = readClient();
const REVALIDATE = 20;

async function view<T>(method: string, args: (number | string)[]): Promise<T> {
  const raw = await retried(() => client.readContract({ address: CONTRACT, functionName: method, args }), 3);
  return JSON.parse(String(raw)) as T;
}

export const tags = {
  pages: 'pages',
  page: (id: number) => `page:${id}`,
  account: (address: string) => `account:${address.toLowerCase()}`,
};

export function getPage(id: number): Promise<PageFull | NotFound> {
  return unstable_cache(() => view<PageFull | NotFound>('get_page', [id]), ['get_page', String(id)], {
    revalidate: REVALIDATE,
    tags: [tags.pages, tags.page(id)],
  })();
}

/** Pages an address opened or was named in ('' for every page), newest first, with its balance. */
export function listPages(address = '', offset = 0, limit = 50): Promise<PageList> {
  const key = address.toLowerCase();
  return unstable_cache(() => view<PageList>('list_pages', [key, offset, limit]), ['list_pages', key, String(offset), String(limit)], {
    revalidate: REVALIDATE,
    tags: key ? [tags.pages, tags.account(key)] : [tags.pages],
  })();
}

/** Every page (or every page of one address), newest first, in pages of fifty. */
export async function allPages(address = ''): Promise<PageItem[]> {
  const first = await listPages(address, 0, 50);
  const items = [...first.items];
  for (let offset = 50; offset < first.total; offset += 50) items.push(...(await listPages(address, offset, 50)).items);
  return items;
}

/** A read failed: say so in one sentence rather than failing the page. */
export function readError(error: unknown): string {
  const text = String((error as Error)?.message ?? error);
  if (/-32029|rate limit/i.test(text)) return 'Studio Next is rate limiting reads right now. Wait a minute and reload.';
  return 'Studio Next did not answer this read. Reload in a moment.';
}
