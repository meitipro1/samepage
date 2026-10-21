import { NextResponse } from 'next/server';

import { listPages, readError } from '@/lib/read';

/**
 * The pages one address opened or was named in, with its unwithdrawn balance,
 * for the browser pages that know the connected wallet. The same cached read
 * the server pages use.
 */
export async function GET(_request: Request, { params }: RouteContext<'/api/account/[address]'>) {
  const { address } = await params;
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return NextResponse.json({ error: 'Not an address.' }, { status: 400 });
  try {
    return NextResponse.json(await listPages(address, 0, 50));
  } catch (error) {
    return NextResponse.json({ error: readError(error) }, { status: 502 });
  }
}
