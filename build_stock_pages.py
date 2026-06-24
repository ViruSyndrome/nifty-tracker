import os
import json

with open("index.html", "r", encoding="utf-8") as f:
    base_html = f.read()

# Top 20 Indian Stocks by Market Cap / Search Volume
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

sitemap_urls = []
site_url = "https://www.getniftyready.com"

# Ensure stock directory exists
if not os.path.exists("stock"):
    os.makedirs("stock")

def generate_stock_page(ticker, full_name, slug, short_name):
    content = base_html
    
    # 1. Update Title & Meta
    content = content.replace(
        "<title>GetNiftyReady — Live NSE/BSE Share Prices, Nifty 50 & Sensex</title>", 
        f"<title>{full_name} Share Price Live | NSE: {ticker.replace('.NS', '')} Stock Value | GetNiftyReady</title>"
    )
    content = content.replace(
        'content="Live Indian share prices, Nifty 50, Sensex, FII/DII data, Gold & Silver rates, Crude Oil & FX. Personal Watchlist. No signup. 100% free."',
        f'content="Live {full_name} ({ticker.replace(".NS", "")}) share price, stock chart, historical data, and market metrics. Track {short_name} on GetNiftyReady."'
    )
    
    # 2. Update Canonical & OG URL
    content = content.replace(
        '<link rel="canonical" href="https://www.getniftyready.com/" />',
        f'<link rel="canonical" href="https://www.getniftyready.com/stock/{slug}-share-price.html" />'
    )
    content = content.replace(
        '<meta property="og:url" content="https://www.getniftyready.com/" />',
        f'<meta property="og:url" content="https://www.getniftyready.com/stock/{slug}-share-price.html" />'
    )
    
    content = content.replace(
        '<meta property="og:title" content="GetNiftyReady — Live Indian Share Prices & Nifty 50" />',
        f'<meta property="og:title" content="{full_name} Share Price Live" />'
    )
    content = content.replace(
        '<meta name="twitter:title" content="GetNiftyReady — Live Indian Share Prices" />',
        f'<meta name="twitter:title" content="{full_name} Share Price Live" />'
    )
    
    # 3. Update CSS/JS paths (since this will be inside /stock/)
    content = content.replace('href="style.css', 'href="../style.css')
    content = content.replace('href="favicon.svg', 'href="../favicon.svg')
    content = content.replace('src="script.js', 'src="../script.js')
    
    content = content.replace('href="sip-calculator.html"', 'href="../sip-calculator.html"')
    content = content.replace('href="swp-calculator.html"', 'href="../swp-calculator.html"')
    content = content.replace('href="market-insights.html"', 'href="../market-insights.html"')
    content = content.replace('href="about.html"', 'href="../about.html"')
    content = content.replace('href="contact.html"', 'href="../contact.html"')
    content = content.replace('href="privacy.html"', 'href="../privacy.html"')
    content = content.replace('href="terms.html"', 'href="../terms.html"')
    
    # 4. Update Hero Section
    content = content.replace(
        '<h1>Live Indian Share Prices</h1>',
        f'<h1>{full_name} Share Price</h1>'
    )
    content = content.replace(
        '<p class="hero-sub">Nifty 50, Sensex, FII/DII flow, Gold &amp; Commodities, and any stock — live. No signup. 100% free. Your personal Watchlist saves across visits.</p>',
        f'<p class="hero-sub">Live real-time stock price and market data for {full_name} (NSE: {ticker.replace(".NS", "")}).</p>'
    )
    
    # 5. Inject Auto-Search script at the end of body
    auto_search_script = f"""
<script>
window.addEventListener('DOMContentLoaded', () => {{
    setTimeout(() => {{
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        if(searchInput && searchBtn) {{
            searchInput.value = '{ticker}';
            searchBtn.click();
            setTimeout(() => {{
                const res = document.getElementById('resultSection');
                if(res) res.scrollIntoView({{ behavior: 'smooth', block: 'start' }});
            }}, 800);
        }}
    }}, 500);
}});
</script>
</body>"""
    content = content.replace("</body>", auto_search_script)
    
    file_path = f"stock/{slug}-share-price.html"
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    sitemap_urls.append(f"{site_url}/{file_path}")

for ticker, full_name, slug, short in top_stocks:
    generate_stock_page(ticker, full_name, slug, short)

print(f"Generated {len(top_stocks)} stock pSEO pages in /stock/.")

# Update sitemap
try:
    with open("sitemap.xml", "r", encoding="utf-8") as f:
        sitemap_content = f.read()
    
    if "</urlset>" in sitemap_content:
        sitemap_content = sitemap_content.replace("</urlset>", "")
    
    for url in sitemap_urls:
        if f"<loc>{url}</loc>" not in sitemap_content:
            sitemap_content += f"""  <url>
    <loc>{url}</loc>
    <lastmod>2026-06-24</lastmod>
    <priority>0.8</priority>
  </url>\n"""
            
    sitemap_content += "</urlset>"
    
    with open("sitemap.xml", "w", encoding="utf-8") as f:
        f.write(sitemap_content)
    print("sitemap.xml updated with new stock pages.")
except Exception as e:
    print(f"Error updating sitemap: {e}")
