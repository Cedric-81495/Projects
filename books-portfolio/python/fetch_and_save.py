
import requests
import json
from datetime import datetime
from format_utils import format_book_data
import os

API_URL = "https://api.potterdb.com/v1/books"
OUTPUT_DIR = "data"

def fetch_data():
    try:
        response = requests.get(API_URL)
        response.raise_for_status()
        return response.json().get("data", [])
    except requests.RequestException as e:
        print(f"API Error: {e}")
        return []

def save_data(data):
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filepath = os.path.join(OUTPUT_DIR, f"books_{timestamp}.json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved data to {filepath}")

if __name__ == "__main__":
    raw_data = fetch_data()
    formatted_data = [format_book_data(book) for book in raw_data]
    save_data(formatted_data)
