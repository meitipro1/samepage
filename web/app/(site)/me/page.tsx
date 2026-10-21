import type { Metadata } from 'next';

import { Mine } from '@/components/Mine';

export const metadata: Metadata = { title: 'My pages', description: 'Your pages by step, windows closing soon, your balance and the withdraw.' };

export default function Me() {
  return (
    <div className="c-wrap py-12">
      <p className="c-eyebrow">My pages</p>
      <h1 className="c-h2 mt-3">Pages by step, and your balance</h1>
      <div className="mt-8">
        <Mine />
      </div>
    </div>
  );
}
