import requests
import json
import os
import sys
from datetime import datetime

url = 'https://www.nseindia.com/api/fiidiiTradeReact'
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com/reports/fii-dii',
}

def fetch_data():
    session = requests.Session()
    # 1. Hit main page to get cookies
    try:
        session.get('https://www.nseindia.com', headers=headers, timeout=15)
    except Exception as e:
        print(f"Error fetching main page: {e}")
        return False
        
    # 2. Hit the FII DII API
    try:
        res = session.get(url, headers=headers, timeout=15)
        res.raise_for_status()
        new_data = res.json()
        
        # Ensure 'data' directory exists
        os.makedirs('data', exist_ok=True)
        
        # Load existing data
        history = []
        if os.path.exists('data/fiidii.json'):
            try:
                with open('data/fiidii.json', 'r') as f:
                    history = json.load(f)
                    if not isinstance(history, list):
                        history = []
            except:
                history = []
        
        # Ensure response is a list before indexing
        if not isinstance(new_data, list):
            print(f"Unexpected NSE API response type: {type(new_data).__name__}")
            return False

        # Avoid duplicates (check if the latest date already exists)
        if len(new_data) > 0:
            first_entry = new_data[0]
            latest_date = first_entry.get('date') if isinstance(first_entry, dict) else None
            if not latest_date:
                print("Unexpected entry format in NSE API response.")
                return False

            # Filter out entries from the same date to avoid duplicates
            history = [h for h in history if isinstance(h, dict) and h.get('date') != latest_date]
            
            # Append new data to the FRONT (newest first)
            history = new_data + history
            
            # Keep last 20 entries (10 trading days worth of FII/DII)
            history = history[:20]
            
            # Save to file
            with open('data/fiidii.json', 'w') as f:
                json.dump(history, f, indent=2)
                
            print(f"Successfully updated FII/DII data for {latest_date}.")
            return True
        else:
            print("No new data from NSE API (likely market closed). Preserving history.")
            return True # Success because we want the workflow to finish without error
            
    except Exception as e:
        print(f"Error fetching API: {e}")
        return False

if __name__ == '__main__':
    if not fetch_data():
        sys.exit(1)
