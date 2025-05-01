import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/**
 * A tool to fetch the order book for a trading pair from Indodax
 * @param server The MCP server instance
 */
export function indodaxOrderBookTool(server: McpServer): void {
  server.tool(
    'indodax-order-book',
    {
      pair: z.string().min(1).describe('Trading pair symbol (e.g., "BTCIDR", "ETHIDR")'),
      depth: z
        .number()
        .int()
        .min(1)
        .max(200)
        .default(10)
        .describe('Number of orders to retrieve (max 200)'),
    },
    async ({ pair, depth }) => {
      try {
        // Normalize the pair to lowercase as required by the Indodax API
        const normalizedPair = pair.toLowerCase();

        // Construct the API URL
        const url = `https://indodax.com/api/orderbook/${normalizedPair}`;

        // Fetch data from Indodax API
        const response = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'MCP-Server/1.0',
          },
        });

        // Check if the request was successful
        if (!response.ok) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: Failed to fetch order book for ${pair}. Status: ${response.status}`,
              },
            ],
            isError: true,
          };
        }

        // Parse the response
        const responseData = await response.json();

        // Check if the API request was successful
        if (!responseData.success) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: API returned unsuccessful response for ${pair}. Code: ${responseData.code}`,
              },
            ],
            isError: true,
          };
        }

        const data = responseData.data;

        // Limit the number of orders to the requested depth
        const asks = (data.ask || []).slice(0, depth);
        const bids = (data.bid || []).slice(0, depth);

        // Format asks and bids tables for readability
        let asksText = 'Sell Orders (Asks):\n';
        asksText += 'Price (IDR) | Volume | Total (IDR)\n';
        asksText += '------------ | ---------- | ------------\n';

        if (asks.length > 0) {
          asksText += asks
            .map((ask: any) => {
              const price = Number(ask.price).toLocaleString();
              const volume = Number(ask.btc_volume).toFixed(8);
              const total = Number(ask.idr_volume).toLocaleString();
              return `${price} | ${volume} | ${total}`;
            })
            .join('\n');
        } else {
          asksText += 'No ask orders available.';
        }

        let bidsText = '\nBuy Orders (Bids):\n';
        bidsText += 'Price (IDR) | Volume | Total (IDR)\n';
        bidsText += '------------ | ---------- | ------------\n';

        if (bids.length > 0) {
          bidsText += bids
            .map((bid: any) => {
              const price = Number(bid.price).toLocaleString();
              const volume = Number(bid.btc_volume).toFixed(8);
              const total = Number(bid.idr_volume).toLocaleString();
              return `${price} | ${volume} | ${total}`;
            })
            .join('\n');
        } else {
          bidsText += 'No bid orders available.';
        }

        // Calculate spread if possible
        let spreadText = '';
        if (asks.length > 0 && bids.length > 0) {
          const lowestAsk = Number(asks[0].price);
          const highestBid = Number(bids[0].price);
          const spread = lowestAsk - highestBid;
          const spreadPercentage = (spread / lowestAsk) * 100;

          spreadText = `\nMarket Spread: ${spread.toLocaleString()} IDR (${spreadPercentage.toFixed(4)}%)`;
        }

        // Format the final order book text
        const orderBookText = `
# Order Book for ${pair.toUpperCase()}

${asksText}

${bidsText}
${spreadText}

Data retrieved from Indodax at ${new Date().toLocaleString()}
`;

        return {
          content: [
            {
              type: 'text',
              text: orderBookText,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching order book: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
