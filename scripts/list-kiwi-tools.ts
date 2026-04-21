import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

async function main() {
  const client = new Client({ name: 'tipsintrip-inspector', version: '0.1.0' }, { capabilities: {} });
  const transport = new SSEClientTransport(new URL('https://mcp.kiwi.com/'));

  try {
    await client.connect(transport);
    const result = await client.listTools();
    for (const t of result.tools) {
      console.log(`\n=== ${t.name} ===`);
      if (t.description) console.log(t.description);
      console.log('Input schema:');
      console.log(JSON.stringify(t.inputSchema, null, 2));
    }
  } finally {
    await client.close().catch(() => {});
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
