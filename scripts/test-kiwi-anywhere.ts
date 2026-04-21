import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

async function tryCall(label: string, args: Record<string, unknown>) {
  const client = new Client({ name: 'tipsintrip-tester', version: '0.1.0' }, { capabilities: {} });
  const transport = new SSEClientTransport(new URL('https://mcp.kiwi.com/'));
  console.log(`\n\n========== ${label} ==========`);
  console.log('args:', JSON.stringify(args));
  try {
    await client.connect(transport);
    const result = await client.callTool({ name: 'search-flight', arguments: args });
    const blocks = Array.isArray(result.content) ? result.content : [];
    for (const block of blocks) {
      if (block && typeof block === 'object' && 'type' in block && block.type === 'text') {
        const text = (block as { text: string }).text;
        console.log('--- result text (first 600 chars) ---');
        console.log(text.slice(0, 600));
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            console.log(`--- parsed as array, length=${parsed.length} ---`);
            if (parsed.length > 0) {
              const sample = parsed[0];
              console.log('first item keys:', Object.keys(sample));
              console.log('first item flyFrom:', sample.flyFrom, 'flyTo:', sample.flyTo, 'cityTo:', sample.cityTo);
            }
          }
        } catch {}
      }
    }
  } catch (err) {
    console.log('ERROR:', err instanceof Error ? err.message : String(err));
  } finally {
    await client.close().catch(() => {});
  }
}

async function main() {
  const commonArgs = {
    flyFrom: 'CTA',
    departureDate: '15/06/2026',
    curr: 'EUR',
    locale: 'en',
    sort: 'price' as const,
  };

  await tryCall('flyTo="anywhere"', { ...commonArgs, flyTo: 'anywhere' });
  await tryCall('flyTo="everywhere"', { ...commonArgs, flyTo: 'everywhere' });
  await tryCall('flyTo=""', { ...commonArgs, flyTo: '' });
  await tryCall('flyTo="ANY"', { ...commonArgs, flyTo: 'ANY' });
  await tryCall('flyTo="*"', { ...commonArgs, flyTo: '*' });
  await tryCall('flyTo="europe"', { ...commonArgs, flyTo: 'europe' });
  await tryCall('flyTo="italy"', { ...commonArgs, flyTo: 'italy' });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
