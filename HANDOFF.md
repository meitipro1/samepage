# Handoff

What only the owner can do, or what has to wait for a date. Everything else is done and recorded in PROGRESS.md.

1. **Send the portal entry.** Every field is in `submission/portal.md`, counted by `python submission/count.py`; every
   link opened by `python submission/check-links.py`. The icon is `submission/samepage-icon-512.png`. The two secondary
   tags come from the portal's own lists, so pick the nearest to those suggested there.
2. **Optional: record the silent demo** with `submission/demo-script.md` and paste the link into the video field.
3. **Optional: post on X** with `submission/x-post.md`.

The contract is frozen at `0x7c32684fC11c312685188C105D6F08c2B689b720`; do not redeploy without deciding to.
The Vercel project `usesamepage` is CLI-linked from `web/` and not Git-connected: redeploy from `web/` with
`npx vercel@latest deploy --prod`. Pushes to GitHub go out as meitipro1.
