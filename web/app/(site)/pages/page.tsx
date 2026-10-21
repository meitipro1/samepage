import type { Metadata } from 'next';
import Link from 'next/link';

import { PageRow, ReadError } from '@/components/ui';
import { lapsed, nowSeconds } from '@/lib/page';
import { allPages, readError } from '@/lib/read';
import type { PageItem } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Pages', description: 'Every page on the contract: open, agreed, not agreed and no-shows.' };

export default async function Pages() {
  const now = nowSeconds();
  let pages: PageItem[] = [];
  let error = '';
  try {
    pages = await allPages();
  } catch (e) {
    error = readError(e);
  }
  const open = pages.filter((p) => p.status === 'OPEN' && !lapsed(p, now));
  const lapsedOnes = pages.filter((p) => p.status === 'OPEN' && lapsed(p, now));
  const closed = pages.filter((p) => p.status !== 'OPEN');
  const groups: [string, string, PageItem[]][] = [
    ['open', 'Open', open],
    ['lapsed', 'A window closed, anyone may close it', lapsedOnes],
    ['closed', 'Closed', closed],
  ];
  return (
    <div className="c-wrap py-12">
      <p className="c-eyebrow">Pages</p>
      <div className="mt-3 flex flex-wrap items-end gap-4">
        <h1 className="c-h2">Every deal checked on Samepage</h1>
        <Link href="/new" className="c-btn solid ml-auto">
          Open a page
        </Link>
      </div>
      <p className="c-muted mt-3 max-w-[44em]">
        Public, readable without a wallet. Accounts appear once both sides have opened them; until then only their seals are on chain.
      </p>
      {error && (
        <div className="mt-6">
          <ReadError message={error} />
        </div>
      )}
      {groups.map(([id, title, list]) =>
        list.length === 0 ? null : (
          <section key={id} id={id} className="mt-10">
            <p className="c-eyebrow">
              {title} · {list.length}
            </p>
            <div className="c-card mt-3 divide-y divide-[var(--line)]">
              {list.map((p) => (
                <PageRow key={p.id} p={p} now={now} />
              ))}
            </div>
          </section>
        ),
      )}
      {!error && pages.length === 0 && <p className="c-note mt-8">No pages yet.</p>}
    </div>
  );
}
