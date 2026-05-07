import requests
import json
import os

url = 'https://www.nseindia.com/api/fiidiiTradeReact'
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
}

def fetch_data():
    session = requests.Session()
    # 1. Hit main page to get cookies
    try:
        session.get('https://www.nseindia.com', headers=headers, timeout=10)
    except Exception as e:
        print(f"Error fetching main page: {e}")
        return False
        
    # 2. Hit the FII DII API
    try:
        res = session.get(url, headers=headers, timeout=10)
        res.raise_for_status()
        data = res.json()
        
        # Ensure 'data' directory exists
        os.makedirs('data', exist_ok=True)
        
        # Save to file
        with open('data/fiidii.json', 'w') as f:
            json.dump(data, f, indent=2)
            
        print("Successfully fetched and saved FII/DII data.")
        return True
    except Exception as e:
        print(f"Error fetching API: {e}")
        return False

if __name__ == '__main__':
    fetch_data()
