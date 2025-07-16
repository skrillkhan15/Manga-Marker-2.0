import { extractMetadata } from '@/ai/flows/extract-metadata-flow';

export async function POST(req: Request) {
  let url: string;
  try {
    const body = await req.json();
    url = body.url;
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!url || typeof url !== 'string') {
    return new Response(JSON.stringify({ error: 'Invalid or missing URL in request body.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const metadata = await extractMetadata({ url });
    return Response.json(metadata);
  } catch (error: any) {
    console.error('Error extracting metadata:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to extract metadata.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
