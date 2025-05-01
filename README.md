# MCP Indodax

A Model Context Protocol (MCP) server implementation with tools for interacting with the Indodax cryptocurrency exchange API.

## Overview

MCP Indodax provides a server built on the Model Context Protocol that enables AI systems to access real-time data from the Indodax cryptocurrency exchange. It includes specialized tools for retrieving market information, order books, and filtered trade history for various trading pairs.

## Features

- **MCP Server Implementation**: Full MCP server with HTTP and stdio transport support
- **Indodax Market Tools**:
  - Comprehensive market information for any trading pair
  - Detailed order book data with customizable depth
  - Date range filtering for trade history
- **Additional Utility Tools**:
  - Calculator for basic arithmetic operations
  - Timestamp generator in multiple formats
- **Resource Templates**: Dynamic resource access patterns
- **Prompt Templates**: Pre-defined prompts for common use cases

## Installation

### Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/cds-id/mcp-indodax.git
   cd mcp-indodax
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Usage

### Starting the Server

To start the HTTP server:

```bash
npm start
```

To start in stdio mode (for integration with other applications):

```bash
npm run start:stdio
```

### Development Mode

For development with hot reloading:

```bash
npm run dev
```

### Inspector Integration

To inspect the MCP server behavior:

```bash
npm run inspect
```

## Available Tools

### Indodax Market Info Tool

Fetches comprehensive market information for any trading pair on Indodax.

**Parameters:**

- `pair` (string): Trading pair symbol (e.g., "BTCIDR", "ETHIDR")
- `startDate` (string, optional): Start date for filtering trades (ISO format)
- `endDate` (string, optional): End date for filtering trades (ISO format)
- `tradeLimit` (number, optional): Maximum number of trades to display (default: 10, max: 50)

**Example:**

```javascript
// Fetch market data for BTC/IDR pair with date filter
const result = await callTool('indodax-market-info', {
  pair: 'BTCIDR',
  startDate: '2023-07-10T00:00:00Z',
  endDate: '2023-07-11T00:00:00Z',
  tradeLimit: 20,
});
```

### Indodax Order Book Tool

Fetches the order book for any trading pair on Indodax with customizable depth.

**Parameters:**

- `pair` (string): Trading pair symbol (e.g., "BTCIDR", "ETHIDR")
- `depth` (number, optional): Number of orders to retrieve (default: 10, max: 200)

**Example:**

```javascript
// Fetch order book for ETH/IDR with depth of 15
const result = await callTool('indodax-order-book', {
  pair: 'ETHIDR',
  depth: 15,
});
```

### Calculator Tool

Performs basic arithmetic operations.

**Parameters:**

- `operation` (string): One of 'add', 'subtract', 'multiply', 'divide'
- `a` (number): First operand
- `b` (number): Second operand

**Example:**

```javascript
const result = await callTool('calculate', {
  operation: 'multiply',
  a: 7,
  b: 6,
});
```

### Timestamp Tool

Provides the current timestamp in various formats.

**Parameters:**

- `format` (string, optional): One of 'iso', 'unix', 'readable' (default: 'iso')

**Example:**

```javascript
const result = await callTool('timestamp', {
  format: 'readable',
});
```
