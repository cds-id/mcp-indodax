import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/**
 * A tool to fetch comprehensive market information for a trading pair from Indodax
 * with optional date range filtering for trades
 * @param server The MCP server instance
 */
export function indodaxMarketInfoTool(server: McpServer): void {
  server.tool(
    'indodax-market-info',
    {
      pair: z.string().min(1).describe('Trading pair symbol (e.g., "BTCIDR", "ETHIDR")'),
      startDate: z
        .string()
        .optional()
        .describe('Start date for filtering trades (ISO format, e.g., "2023-07-10T00:00:00Z")'),
      endDate: z
        .string()
        .optional()
        .describe('End date for filtering trades (ISO format, e.g., "2023-07-11T00:00:00Z")'),
      tradeLimit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(10)
        .describe('Maximum number of trades to display'),
    },
    async ({ pair, startDate, endDate, tradeLimit }) => {
      try {
        // Normalize the pair to lowercase as required by the Indodax API
        const normalizedPair = pair.toLowerCase();

        // Construct the API URL
        const url = `https://indodax.com/api/webdata/${normalizedPair}`;

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
                text: `Error: Failed to fetch market data for ${pair}. Status: ${response.status}`,
              },
            ],
            isError: true,
          };
        }

        // Parse the response
        const data = await response.json();

        // Format the market data for readability
        const lastPrice = data.last_price ? Number(data.last_price).toLocaleString() : 'N/A';
        const high24h = data._24h?.high ? Number(data._24h.high).toLocaleString() : 'N/A';
        const low24h = data._24h?.low ? Number(data._24h.low).toLocaleString() : 'N/A';
        const volume24h = data._24h?.vol_btc
          ? Number(data._24h.vol_btc / 100000000).toLocaleString()
          : 'N/A';
        const volumeIdr24h = data._24h?.vol_rp ? Number(data._24h.vol_rp).toLocaleString() : 'N/A';

        // Get best bid and ask
        const bestBid =
          data.buy_orders && data.buy_orders.length > 0
            ? Number(data.buy_orders[0].price).toLocaleString()
            : 'N/A';
        const bestAsk =
          data.sell_orders && data.sell_orders.length > 0
            ? Number(data.sell_orders[0].price).toLocaleString()
            : 'N/A';

        // Filter trades by date range if specified
        let filteredTrades = data.last_trades || [];
        let dateRangeText = '';

        const startTimestamp = startDate ? new Date(startDate).getTime() / 1000 : null;
        const endTimestamp = endDate ? new Date(endDate).getTime() / 1000 : null;

        if (startTimestamp !== null || endTimestamp !== null) {
          filteredTrades = filteredTrades.filter((trade: any) => {
            const tradeTimestamp = parseInt(trade.trade_time);

            if (startTimestamp !== null && endTimestamp !== null) {
              return tradeTimestamp >= startTimestamp && tradeTimestamp <= endTimestamp;
            } else if (startTimestamp !== null) {
              return tradeTimestamp >= startTimestamp;
            } else if (endTimestamp !== null) {
              return tradeTimestamp <= endTimestamp;
            }

            return true;
          });

          // Prepare date range text for the output
          if (startTimestamp !== null && endTimestamp !== null) {
            dateRangeText = `Showing trades from ${new Date(startTimestamp * 1000).toLocaleString()} to ${new Date(endTimestamp * 1000).toLocaleString()}`;
          } else if (startTimestamp !== null) {
            dateRangeText = `Showing trades from ${new Date(startTimestamp * 1000).toLocaleString()} onwards`;
          } else if (endTimestamp !== null) {
            dateRangeText = `Showing trades until ${new Date(endTimestamp * 1000).toLocaleString()}`;
          }
        }

        // Format recent trades
        let recentTradesText = '## Recent Trades\n';
        if (dateRangeText) {
          recentTradesText += `_${dateRangeText}_\n\n`;
        }

        if (filteredTrades.length > 0) {
          recentTradesText += filteredTrades
            .slice(0, tradeLimit)
            .map((trade: any) => {
              const type = trade.type === 'buy' ? '🟢 Buy' : '🔴 Sell';
              const time = new Date(Number(trade.trade_time) * 1000).toLocaleString();
              const price = Number(trade.price).toLocaleString();
              const amount = Number(trade.btc / 100000000).toFixed(8);
              const total = Number(trade.rp).toLocaleString();
              return `${time} | ${type} | Price: ${price} IDR | Amount: ${amount} | Total: ${total} IDR`;
            })
            .join('\n');

          if (filteredTrades.length > tradeLimit) {
            recentTradesText += `\n\n_Showing ${tradeLimit} of ${filteredTrades.length} trades in the selected timeframe_`;
          }
        } else {
          if (dateRangeText) {
            recentTradesText += 'No trades found in the specified date range.';
          } else {
            recentTradesText += 'No recent trades available.';
          }
        }

        // Calculate price change if possible
        let priceChangeText = '';
        if (data._24h && data._24h.last_price) {
          const currentPrice = Number(data.last_price);
          const previousPrice = Number(data._24h.last_price);
          const change = currentPrice - previousPrice;
          const changePercentage = (change / previousPrice) * 100;

          const changeDirection = change >= 0 ? '▲' : '▼';
          const changeColor = change >= 0 ? '🟢' : '🔴';

          priceChangeText = `\n- 24h Change: ${changeColor} ${changeDirection} ${Math.abs(change).toLocaleString()} IDR (${changePercentage.toFixed(2)}%)`;
        }

        // Format summary text
        const summaryText = `
# Market Summary for ${pair.toUpperCase()}

## Current Market
- Last Price: ${lastPrice} IDR${priceChangeText}
- Best Bid: ${bestBid} IDR
- Best Ask: ${bestAsk} IDR

## 24-Hour Statistics
- High: ${high24h} IDR
- Low: ${low24h} IDR
- Volume: ${volume24h} ${normalizedPair.substring(0, 3).toUpperCase()}
- Volume in IDR: ${volumeIdr24h} IDR

${recentTradesText}

Data retrieved from Indodax at ${new Date().toLocaleString()}
`;

        return {
          content: [
            {
              type: 'text',
              text: summaryText,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching market data: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
