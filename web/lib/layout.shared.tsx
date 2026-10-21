import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

import { Mark } from '@/components/Nav';

import { gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2 font-semibold">
          <Mark size={22} />
          <span className="c-word">samepage</span>
          <span className="c-pill ml-1" style={{ height: 22, fontSize: 10.5 }}>
            <span className="dot" />
            Studio Next
          </span>
        </span>
      ),
      url: '/',
    },
    links: [
      { text: 'Pages', url: '/pages' },
      { text: 'Open a page', url: '/new' },
      { text: 'My pages', url: '/me' },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
