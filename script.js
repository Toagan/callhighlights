// Configuration
const CONFIG = {
    UPDATE_INTERVAL: 10000, // 10 seconds
    MIN_PROFIT_THRESHOLD: 5, // 5% minimum profit
    POLYMARKET_FEE: 0.02, // 2% fee
    EXCHANGE_FEE: 0.001, // 0.1% fee
    CRYPTO_IDS: ['bitcoin', 'ethereum', 'solana', 'cardano', 'polygon'], // Top 5 cryptos
    CRYPTO_SYMBOLS: ['BTC', 'ETH', 'SOL', 'ADA', 'MATIC']
};

// State
let cryptoPrices = {};
let opportunities = [];
let updateInterval = null;

// DOM Elements
const pricesGrid = document.getElementById('pricesGrid');
const opportunitiesBody = document.getElementById('opportunitiesBody');
const opportunityCount = document.getElementById('opportunityCount');
const refreshBtn = document.getElementById('refreshBtn');
const lastUpdate = document.getElementById('lastUpdate');
const minProfitInput = document.getElementById('minProfit');
const minLiquidityInput = document.getElementById('minLiquidity');
const sortBySelect = document.getElementById('sortBy');
const statusMessage = document.getElementById('statusMessage');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    refreshBtn.addEventListener('click', () => {
        fetchAllData();
    });

    minProfitInput.addEventListener('change', filterAndDisplay);
    minLiquidityInput.addEventListener('change', filterAndDisplay);
    sortBySelect.addEventListener('change', filterAndDisplay);

    fetchAllData();
    startAutoRefresh();
});

// Fetch crypto prices from CoinGecko
async function fetchCryptoPrices() {
    try {
        const ids = CONFIG.CRYPTO_IDS.join(',');
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch prices');
        
        const data = await response.json();
        
        // Transform data
        const prices = {};
        CONFIG.CRYPTO_IDS.forEach((id, index) => {
            if (data[id]) {
                prices[CONFIG.CRYPTO_SYMBOLS[index]] = {
                    price: data[id].usd,
                    change24h: data[id].usd_24h_change || 0,
                    symbol: CONFIG.CRYPTO_SYMBOLS[index]
                };
            }
        });
        
        return prices;
    } catch (error) {
        console.error('Error fetching crypto prices:', error);
        showStatus('Error fetching crypto prices. Using mock data.', 'error');
        return getMockPrices();
    }
}

// Mock prices for testing (fallback)
function getMockPrices() {
    return {
        'BTC': { price: 43250.50, change24h: 2.5, symbol: 'BTC' },
        'ETH': { price: 2650.30, change24h: 1.8, symbol: 'ETH' },
        'SOL': { price: 98.45, change24h: 3.2, symbol: 'SOL' },
        'ADA': { price: 0.52, change24h: -0.5, symbol: 'ADA' },
        'MATIC': { price: 0.85, change24h: 1.2, symbol: 'MATIC' }
    };
}

// Fetch Polymarket data (mock implementation - real API requires authentication)
async function fetchPolymarketMarkets() {
    try {
        // Note: Polymarket API requires authentication and has CORS restrictions
        // This is a mock implementation that simulates market data
        // For production, you'd need a backend proxy
        
        showStatus('Using mock Polymarket data (API requires backend proxy)', 'error');
        return getMockPolymarketData();
    } catch (error) {
        console.error('Error fetching Polymarket data:', error);
        return getMockPolymarketData();
    }
}

// Mock Polymarket data for demonstration
function getMockPolymarketData() {
    const basePrice = cryptoPrices['BTC']?.price || 43000;
    
    return [
        {
            id: '1',
            question: 'Will BTC be above $45,000 on Dec 31, 2024?',
            yesPrice: 0.65, // 65% probability
            liquidity: 50000,
            token: 'BTC',
            resolutionDate: '2024-12-31',
            impliedPrice: basePrice * 1.05 // Slightly above current
        },
        {
            id: '2',
            question: 'Will ETH be above $2,700 on Dec 31, 2024?',
            yesPrice: 0.72,
            liquidity: 35000,
            token: 'ETH',
            resolutionDate: '2024-12-31',
            impliedPrice: (cryptoPrices['ETH']?.price || 2650) * 1.02
        },
        {
            id: '3',
            question: 'Will BTC be above $40,000 on Dec 31, 2024?',
            yesPrice: 0.85,
            liquidity: 75000,
            token: 'BTC',
            resolutionDate: '2024-12-31',
            impliedPrice: basePrice * 0.93 // Below current (arbitrage opportunity)
        },
        {
            id: '4',
            question: 'Will SOL be above $100 on Dec 31, 2024?',
            yesPrice: 0.55,
            liquidity: 25000,
            token: 'SOL',
            resolutionDate: '2024-12-31',
            impliedPrice: (cryptoPrices['SOL']?.price || 98) * 1.02
        },
        {
            id: '5',
            question: 'Will BTC be above $50,000 on Dec 31, 2024?',
            yesPrice: 0.35,
            liquidity: 40000,
            token: 'BTC',
            resolutionDate: '2024-12-31',
            impliedPrice: basePrice * 1.15
        }
    ];
}

// Calculate arbitrage opportunities
function calculateArbitrage(markets, prices) {
    const opportunities = [];
    
    markets.forEach(market => {
        const currentPrice = prices[market.token]?.price;
        if (!currentPrice) return;
        
        // Calculate implied price from Polymarket odds
        // If "Yes" is 65%, it implies price will be above threshold
        // We need to reverse engineer the threshold from the yes price
        const threshold = market.impliedPrice;
        const yesPrice = market.yesPrice;
        
        // Calculate mispricing
        // If current price is $43,000 and market says 85% chance it's above $40,000
        // That's a mispricing if current is already above $40,000
        const priceDifference = currentPrice - threshold;
        const mispricingPercent = (priceDifference / currentPrice) * 100;
        
        // Calculate potential profit
        // If we bet "Yes" at 85% when current price suggests it should be 95%
        const expectedProbability = currentPrice > threshold ? 0.95 : 0.05;
        const probabilityDifference = Math.abs(yesPrice - expectedProbability);
        const potentialProfitPercent = (probabilityDifference * 100) - (CONFIG.POLYMARKET_FEE * 100) - (CONFIG.EXCHANGE_FEE * 100);
        
        // Risk assessment
        let risk = 'low';
        if (market.liquidity < 10000) risk = 'high';
        else if (market.liquidity < 25000) risk = 'medium';
        
        opportunities.push({
            ...market,
            currentPrice,
            mispricingPercent,
            potentialProfitPercent,
            risk,
            threshold
        });
    });
    
    return opportunities;
}

// Display crypto prices
function displayPrices(prices) {
    cryptoPrices = prices;
    
    pricesGrid.innerHTML = '';
    
    Object.values(prices).forEach(priceData => {
        const card = document.createElement('div');
        card.className = 'price-card';
        
        const changeColor = priceData.change24h >= 0 ? '#4ade80' : '#f87171';
        const changeSymbol = priceData.change24h >= 0 ? '+' : '';
        
        card.innerHTML = `
            <div class="price-symbol">${priceData.symbol}</div>
            <div class="price-value">$${priceData.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div class="price-change" style="color: ${changeColor}">
                ${changeSymbol}${priceData.change24h.toFixed(2)}% (24h)
            </div>
        `;
        
        pricesGrid.appendChild(card);
    });
}

// Display arbitrage opportunities
function displayOpportunities(opps) {
    opportunities = opps;
    filterAndDisplay();
}

function filterAndDisplay() {
    const minProfit = parseFloat(minProfitInput.value) || 0;
    const minLiquidity = parseFloat(minLiquidityInput.value) || 0;
    const sortBy = sortBySelect.value;
    
    // Filter opportunities
    let filtered = opportunities.filter(opp => {
        return Math.abs(opp.potentialProfitPercent) >= minProfit &&
               opp.liquidity >= minLiquidity;
    });
    
    // Sort opportunities
    filtered.sort((a, b) => {
        switch(sortBy) {
            case 'profit':
                return Math.abs(b.potentialProfitPercent) - Math.abs(a.potentialProfitPercent);
            case 'liquidity':
                return b.liquidity - a.liquidity;
            case 'mispricing':
                return Math.abs(b.mispricingPercent) - Math.abs(a.mispricingPercent);
            default:
                return 0;
        }
    });
    
    // Display
    opportunityCount.textContent = `${filtered.length} opportunity${filtered.length !== 1 ? 'ies' : ''} found`;
    
    opportunitiesBody.innerHTML = '';
    
    if (filtered.length === 0) {
        opportunitiesBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #a0a0a0;">
                    No opportunities found matching your criteria
                </td>
            </tr>
        `;
        return;
    }
    
    filtered.forEach(opp => {
        const row = document.createElement('tr');
        
        const profitClass = opp.potentialProfitPercent > 0 ? 'profit-positive' : 
                           opp.potentialProfitPercent < 0 ? 'profit-negative' : 'profit-neutral';
        const riskClass = `risk-${opp.risk}`;
        
        row.innerHTML = `
            <td class="market-name">${opp.question}</td>
            <td class="price-cell">$${opp.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="price-cell">${(opp.yesPrice * 100).toFixed(1)}%</td>
            <td class="price-cell">$${opp.threshold.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td class="${profitClass}">${opp.mispricingPercent > 0 ? '+' : ''}${opp.mispricingPercent.toFixed(2)}%</td>
            <td class="${profitClass}">${opp.potentialProfitPercent > 0 ? '+' : ''}${opp.potentialProfitPercent.toFixed(2)}%</td>
            <td>$${opp.liquidity.toLocaleString('en-US')}</td>
            <td class="${riskClass}">${opp.risk.toUpperCase()}</td>
        `;
        
        opportunitiesBody.appendChild(row);
    });
}

// Fetch all data
async function fetchAllData() {
    showStatus('Fetching data...', '');
    
    try {
        const [prices, markets] = await Promise.all([
            fetchCryptoPrices(),
            fetchPolymarketMarkets()
        ]);
        
        displayPrices(prices);
        
        const opps = calculateArbitrage(markets, prices);
        displayOpportunities(opps);
        
        lastUpdate.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
        showStatus('Data updated successfully!', '');
    } catch (error) {
        console.error('Error fetching data:', error);
        showStatus('Error fetching data. Check console for details.', 'error');
    }
}

// Auto-refresh
function startAutoRefresh() {
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(fetchAllData, CONFIG.UPDATE_INTERVAL);
}

// Show status message
function showStatus(message, type = '') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message show ${type}`;
    
    setTimeout(() => {
        statusMessage.classList.remove('show');
    }, 3000);
}
