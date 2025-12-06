# Polymarket Crypto Arbitrage Analyzer

A web application that identifies arbitrage opportunities in Polymarket cryptocurrency prediction markets by comparing real-time prices from major crypto exchanges with Polymarket bet prices.

## Overview

This tool helps traders find mispriced bets on Polymarket by:
1. Fetching real-time cryptocurrency prices from the top 5 exchanges
2. Analyzing Polymarket markets related to crypto prices
3. Comparing Polymarket odds with current market prices
4. Calculating potential arbitrage opportunities with profit estimates

## Features

- **Real-time Price Comparison**: Displays current crypto prices from 5 major exchanges
- **Polymarket Scanner**: Lists active crypto-related prediction markets
- **Arbitrage Detection**: Identifies mispriced bets based on market price discrepancies
- **Profit Calculator**: Shows potential ROI accounting for fees and risks
- **Risk Assessment**: Displays liquidity, time to resolution, and other risk factors

## How It Works

1. The app fetches real-time crypto prices from major exchanges (Binance, Coinbase, Kraken, OKX, etc.)
2. It retrieves active Polymarket markets related to cryptocurrencies
3. For each market, it compares the Polymarket "Yes" price with the current market price
4. When a significant mispricing is detected (>threshold), it's flagged as an arbitrage opportunity
5. The tool calculates potential profit, accounting for fees and risks

## Technical Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **APIs**: 
  - CoinGecko API (crypto prices)
  - Polymarket API (market data)
  - Exchange APIs (Binance, Coinbase, Kraken, OKX)

## Setup

1. Clone the repository
2. Open `index.html` in a browser
3. Configure API keys if needed (see API documentation)

## API Keys

Some APIs may require keys:
- CoinGecko: Free tier available
- Polymarket: Check their API documentation
- Exchange APIs: May require API keys for higher rate limits

## Development Status

See `PLAN.md` for detailed implementation plan and phases.

## Disclaimer

This tool is for informational purposes only. Trading involves risk. Always do your own research and consider fees, slippage, and liquidity before making any trades.
