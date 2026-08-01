import os

top_stocks = [
    ("RELIANCE.NS", "Reliance Industries", "reliance", "Reliance"),
    ("TCS.NS", "Tata Consultancy Services (TCS)", "tcs", "TCS"),
    ("HDFCBANK.NS", "HDFC Bank", "hdfc-bank", "HDFC Bank"),
    ("ICICIBANK.NS", "ICICI Bank", "icici-bank", "ICICI Bank"),
    ("BHARTIARTL.NS", "Bharti Airtel", "bharti-airtel", "Bharti Airtel"),
    ("SBIN.NS", "State Bank of India (SBI)", "sbi", "SBI"),
    ("INFY.NS", "Infosys", "infosys", "Infosys"),
    ("LICI.NS", "Life Insurance Corporation (LIC)", "lic", "LIC"),
    ("ITC.NS", "ITC", "itc", "ITC"),
    ("HINDUNILVR.NS", "Hindustan Unilever (HUL)", "hul", "Hindustan Unilever"),
    ("LT.NS", "Larsen & Toubro (L&T)", "larsen-and-toubro", "L&T"),
    ("BAJFINANCE.NS", "Bajaj Finance", "bajaj-finance", "Bajaj Finance"),
    ("HCLTECH.NS", "HCL Technologies", "hcl-tech", "HCL Tech"),
    ("MARUTI.NS", "Maruti Suzuki", "maruti-suzuki", "Maruti Suzuki"),
    ("SUNPHARMA.NS", "Sun Pharma", "sun-pharma", "Sun Pharma"),
    ("ADANIENT.NS", "Adani Enterprises", "adani-enterprises", "Adani Enterprises"),
    ("KOTAKBANK.NS", "Kotak Mahindra Bank", "kotak-mahindra-bank", "Kotak Bank"),
    ("TITAN.NS", "Titan Company", "titan", "Titan"),
    ("ONGC.NS", "ONGC", "ongc", "ONGC"),
    ("TATAMOTORS.NS", "Tata Motors", "tata-motors", "Tata Motors"),
]

html = '''
        <!-- PSEO Stocks Grid -->
        <div class="stocks-grid-section" style="max-width: 1200px; margin: 4rem auto 2rem; padding: 0 1.5rem;">
            <h3 style="font-size: 1.5rem; margin-bottom: 1.5rem; color: var(--text-primary, #1e293b); text-align: center;">Popular NSE Stocks Live Prices</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
'''
for ticker, full_name, slug, short in top_stocks:
    html += f'                <a href="stock/{slug}-share-price.html" style="color: var(--accent, #38bdf8); text-decoration: none; font-size: 0.95rem; padding: 0.75rem; background: rgba(0,0,0,0.03); border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; text-align: center; transition: background 0.2s;">{short} Share Price</a>\n'

html += '''            </div>
        </div>
'''

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Inject right before <footer class="footer">
if '<footer class="footer">' in content:
    content = content.replace('<footer class="footer">', html + '\n<footer class="footer">')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Injected grid into Nifty-Tracker index.html successfully.")
else:
    print("Could not find footer tag to inject.")
