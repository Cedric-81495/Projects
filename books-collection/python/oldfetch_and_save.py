import requests
import json
import os
from datetime import datetime
from format_utils import format_book_data  # Ensure this file exists and is correct

# Base URLs
API_URL = "https://api.potterdb.com/v1/books"
OUTPUT_DIR = "data"


def fetch_books():
    try:
        response = requests.get(API_URL)
        response.raise_for_status()
        return response.json().get("data", [])
    except requests.RequestException as e:
        print(f"[ERROR] Failed to fetch books: {e}")
        return []


def fetch_chapters_for_book(book_id):
    url = f"{API_URL}/{book_id}/chapters"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json().get("data", [])
    except requests.RequestException as e:
        print(f"[WARNING] Could not fetch chapters for book {book_id}: {e}")
        return []


def save_data(data):
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filepath = os.path.join(OUTPUT_DIR, f"books_with_chapters_{timestamp}.json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[✔] Saved data to {filepath}")


def main():
    raw_books = fetch_books()
    print(f"[INFO] Fetched {len(raw_books)} books")

    formatted_books = {}

    for book in raw_books:
        book_id = book.get("id")
        if not book_id:
            continue

        formatted_book = format_book_data(book)

        chapters = fetch_chapters_for_book(book_id)
        formatted_chapters = []

        for ch in chapters:
            attrs = ch.get("attributes", {})
            chapter_data = {
                "id": ch.get("id"),
                "title": attrs.get("title"),
                "number": attrs.get("number"),
                "summary": attrs.get("summary"),
                "slug": attrs.get("slug")
            }
            formatted_chapters.append(chapter_data)

        formatted_book["chapters"] = formatted_chapters
        formatted_books[book_id] = formatted_book

    save_data(formatted_books)


if __name__ == "__main__":
    main()
