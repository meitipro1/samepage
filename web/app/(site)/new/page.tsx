import type { Metadata } from 'next';
import { Suspense } from 'react';

import { OpenForm } from '@/components/OpenForm';

export const metadata: Metadata = {
  title: 'Open a page',
  description: 'Name the deal and the other side, set a good-faith deposit and a window for each step, and send one link.',
};

export default function NewPage() {
  return (
    <div className="c-wrap py-12">
      <p className="c-eyebrow">Open a page</p>
      <h1 className="c-h2 mt-3">One deal, two accounts, written separately</h1>
      <p className="c-muted mt-3 max-w-[44em]">
        The title, the two addresses and the deposit are public now. Neither account is written yet: once the other side joins,
        each of you writes the deal in your own words and seals it, and nobody sees either until both are in.
      </p>
      <div className="mt-10">
        <Suspense>
          <OpenForm />
        </Suspense>
      </div>
    </div>
  );
}
