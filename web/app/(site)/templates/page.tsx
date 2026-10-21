import type { Metadata } from 'next';
import Link from 'next/link';

import { TERMS, TERM_LABEL } from '@/lib/page';
import { TEMPLATES } from '@/lib/templates';

export const metadata: Metadata = { title: 'Templates', description: 'Term hints for common deals: promotions, design gigs, OTC trades, ambassador roles and builds.' };

export default function Templates() {
  return (
    <div className="c-wrap py-12">
      <p className="c-eyebrow">Templates</p>
      <h1 className="c-h2 mt-3">Term hints for common deals</h1>
      <p className="c-muted mt-3 max-w-[46em]">
        A template is a list of questions, one per term, for each side to answer in its own words. It never prefills an account:
        if both sides filled in the same form, whoever wrote the form would have framed the deal.
      </p>
      <div className="mt-10 flex flex-col gap-6">
        {TEMPLATES.map((t) => (
          <section key={t.slug} id={t.slug} className="c-card">
            <div className="flex flex-wrap items-center gap-3 border-b border-[var(--line)] px-5 py-4">
              <div>
                <p className="c-h3">{t.name}</p>
                <p className="c-muted text-[14px]">{t.who}</p>
              </div>
              <Link className="c-btn small ml-auto" href={`/new?template=${t.slug}`}>
                Open a page with these hints
              </Link>
            </div>
            <div className="grid gap-x-8 gap-y-4 px-5 py-5 md:grid-cols-2">
              {TERMS.map((term, i) => (
                <div key={term}>
                  <p className="text-[14px] font-medium">
                    {TERM_LABEL[term]} <span className="c-faint text-[12px]">{i < 3 ? 'required' : 'when mentioned'}</span>
                  </p>
                  <p className="c-muted text-[14px]">{t.hints[term]}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
