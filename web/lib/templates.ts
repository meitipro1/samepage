import type { Term } from './types';

/**
 * Term hints for common deals. A hint is a question to answer in your own
 * words, never a prefilled account: if both sides filled in the same form,
 * whoever wrote the form would have framed the deal.
 */
export type Template = {
  slug: string;
  name: string;
  who: string;
  title: string;
  hints: Record<Term, string>;
};

export const TEMPLATES: Template[] = [
  {
    slug: 'promotion',
    name: 'Paid promotion',
    who: 'A project and a creator: posts, threads, videos, Spaces.',
    title: 'Launch posts',
    hints: {
      amount: 'How much, in which token, for how many posts or videos?',
      deliverable: 'Which platform, how many posts, threads or videos, and does a thread count as one post?',
      deadline: 'The exact date each piece goes live, or the last one. "Friday" is not a date.',
      payment: 'Before, after, or split? On which event: the first post, the last post, a report?',
      rights: 'May the project repost, quote, pin or run ads with the posts? For how long?',
      cancellation: 'What if the project cancels after the first post, or the creator stops halfway?',
    },
  },
  {
    slug: 'design',
    name: 'Design gig',
    who: 'A client and a designer: a logo, a landing page, a set of banners.',
    title: 'Logo design',
    hints: {
      amount: 'The price and the token, and how many concepts or rounds of changes it includes.',
      deliverable: 'Which files: PNG, SVG, the source file? Which sizes and variants?',
      deadline: 'The date the final files are due, and the date of the first draft if there is one.',
      payment: 'Half up front? All on delivery? When exactly does each part move?',
      rights: 'Who owns the design and the source files? May the designer show it in a portfolio?',
      cancellation: 'A kill fee if the client stops after the first draft? What happens to the drafts?',
    },
  },
  {
    slug: 'otc',
    name: 'OTC trade',
    who: 'Two traders settling a block off the order book.',
    title: 'OTC 40k ARB',
    hints: {
      amount: 'Which token, how many, at which price, in which quote token. Fixed price or a reference price at a time?',
      deliverable: 'Who sends what to which address, on which chain?',
      deadline: 'The exact time both legs settle, with a time zone.',
      payment: 'Who sends first? In one transfer or in tranches?',
      rights: 'Usually none. Say so if there is a lock-up or a vesting schedule on what is sold.',
      cancellation: 'What if the price moves past a level before settlement? Who may walk away, and when?',
    },
  },
  {
    slug: 'ambassador',
    name: 'Ambassador role',
    who: 'A project and a community member, month by month.',
    title: 'Ambassador, November',
    hints: {
      amount: 'The monthly fee and the token, plus any bonus and what triggers it.',
      deliverable: 'How many posts, Spaces, events or reports each month, and where?',
      deadline: 'The month or period it covers, and when each report is due.',
      payment: 'On which day of the month, after which report?',
      rights: 'May the project reuse the content? May the ambassador use the project\'s name and logo?',
      cancellation: 'How much notice either side gives, and what is paid for a part month.',
    },
  },
  {
    slug: 'dev',
    name: 'Freelance build',
    who: 'A client and a developer: a contract, a bot, a site.',
    title: 'Telegram bot build',
    hints: {
      amount: 'The price and token, fixed or by the hour, with a cap.',
      deliverable: 'What it does, where it runs, and what "done" means: a demo, a repo, a deploy?',
      deadline: 'The delivery date, and any milestone dates.',
      payment: 'Milestones? On delivery? How many days after delivery?',
      rights: 'Who owns the code, and under which license? Is it open source?',
      cancellation: 'What is paid if the client cancels midway, and what is handed over?',
    },
  },
];

export function template(slug: string): Template | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}
