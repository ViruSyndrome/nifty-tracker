import os
import json

with open("sip-calculator.html", "r", encoding="utf-8") as f:
    base_html = f.read()

amounts = [
    (1000, "1000 Rs SIP Calculator Returns", "1000-rs"),
    (2000, "2000 Rs SIP Calculator Returns", "2000-rs"),
    (5000, "5000 Rs SIP Calculator Returns", "5000-rs"),
    (10000, "10000 Rs SIP Calculator Returns", "10000-rs"),
    (50000, "50000 Rs SIP Calculator Returns", "50000-rs"),
]

sitemap_urls = []
site_url = "https://www.getniftyready.com"

def generate_page(amt, title, slug_prefix):
    content = base_html
    
    # Meta replacements
    content = content.replace("SIP Calculator — GetNiftyReady | Mutual Fund SIP Returns India", f"{title} | GetNiftyReady")
    content = content.replace("SIP Calculator — Calculate Mutual Fund SIP Returns | GetNiftyReady", f"{title} | Calculate Mutual Fund Returns")
    content = content.replace("Free SIP calculator for Indian mutual funds.", f"Free {amt} Rs SIP calculator. Calculate how much your {amt} per month investment will grow.")
    
    # Canonical
    content = content.replace('href="https://www.getniftyready.com/sip-calculator.html"', f'href="https://www.getniftyready.com/{slug_prefix}-sip-calculator-returns.html"')
    content = content.replace('content="https://www.getniftyready.com/sip-calculator.html"', f'content="https://www.getniftyready.com/{slug_prefix}-sip-calculator-returns.html"')
    
    # Hero
    content = content.replace(">SIP Calculator</h1>", f">{title}</h1>")
    content = content.replace("Calculate returns on your Systematic Investment Plan.", f"See exactly how much your ₹{amt} monthly investment will grow.")
    
    # Inject values
    # Replace default value 5000 in JS and HTML
    content = content.replace('var _amount = 5000;', f'var _amount = {amt};')
    content = content.replace('id="sliderAmount" min="500" max="100000" step="500" value="5000"', f'id="sliderAmount" min="500" max="100000" step="500" value="{amt}"')
    
    file_name = f"{slug_prefix}-sip-calculator-returns.html"
    with open(file_name, "w", encoding="utf-8") as f:
        f.write(content)
        
    sitemap_urls.append(f"{site_url}/{file_name}")

for amt, title, slug in amounts:
    generate_page(amt, title, slug)

print(f"Generated {len(amounts)} pSEO pages for Nifty-Tracker.")

# SWP Calculator modifications (example for 50000 rs)
with open("swp-calculator.html", "r", encoding="utf-8") as f:
    swp_html = f.read()

# E.g., generating a 50L SWP calculator (common high intent query)
amt = 5000000
monthly_wd = 50000
title = "50 Lakhs SWP Calculator Monthly"
slug = "50-lakhs-swp-calculator-monthly"

content = swp_html
content = content.replace("SWP Calculator — GetNiftyReady | Systematic Withdrawal Plan", f"{title} | GetNiftyReady")
content = content.replace('href="https://www.getniftyready.com/swp-calculator.html"', f'href="https://www.getniftyready.com/{slug}.html"')
content = content.replace(">SWP Calculator</h1>", f">{title}</h1>")
# JS replacements
content = content.replace('var _totalInvested = 1000000;', f'var _totalInvested = {amt};')
content = content.replace('var _withdrawalAmt = 10000;', f'var _withdrawalAmt = {monthly_wd};')
# HTML defaults
content = content.replace('id="sliderTotal" min="10000" max="50000000" step="10000" value="1000000"', f'id="sliderTotal" min="10000" max="50000000" step="10000" value="{amt}"')
content = content.replace('id="sliderWithdrawal" min="500" max="500000" step="500" value="10000"', f'id="sliderWithdrawal" min="500" max="500000" step="500" value="{monthly_wd}"')

with open(f"{slug}.html", "w", encoding="utf-8") as f:
    f.write(content)
sitemap_urls.append(f"{site_url}/{slug}.html")

print(f"Generated 1 SWP pSEO page.")

# Goal-based calculators
# E.g. 1 Crore SIP Calculator
content = base_html
content = content.replace("SIP Calculator — GetNiftyReady | Mutual Fund SIP Returns India", f"1 Crore SIP Calculator | GetNiftyReady")
content = content.replace('href="https://www.getniftyready.com/sip-calculator.html"', f'href="https://www.getniftyready.com/1-crore-sip-calculator.html"')
content = content.replace(">SIP Calculator</h1>", f">1 Crore SIP Calculator</h1>")
# A 15000 SIP over 15 years at 12% yields roughly 1 Crore (approx 75L, wait actually 21k over 15 years yields ~1Cr)
# Let's set 21500 for 15 years
content = content.replace('var _amount = 5000;', f'var _amount = 21500;')
content = content.replace('var _years  = 10;', f'var _years = 15;')
content = content.replace('id="sliderAmount" min="500" max="100000" step="500" value="5000"', f'id="sliderAmount" min="500" max="100000" step="500" value="21500"')
content = content.replace('id="sliderYears" min="1" max="40" step="1" value="10"', f'id="sliderYears" min="1" max="40" step="1" value="15"')

with open("1-crore-sip-calculator.html", "w", encoding="utf-8") as f:
    f.write(content)
sitemap_urls.append(f"{site_url}/1-crore-sip-calculator.html")

print(f"Generated 1 Goal-based SIP pSEO page.")

# Update sitemap
try:
    with open("sitemap.xml", "r", encoding="utf-8") as f:
        sitemap_content = f.read()
    
    sitemap_content = sitemap_content.replace("</urlset>", "")
    
    for url in sitemap_urls:
        if f"<loc>{url}</loc>" not in sitemap_content:
            sitemap_content += f"""  <url>
    <loc>{url}</loc>
    <lastmod>2026-05-31</lastmod>
    <priority>0.8</priority>
  </url>\n"""
            
    sitemap_content += "</urlset>"
    
    with open("sitemap.xml", "w", encoding="utf-8") as f:
        f.write(sitemap_content)
    print("sitemap.xml updated with new Nifty pages.")
except Exception as e:
    print(f"Error updating sitemap: {e}")
