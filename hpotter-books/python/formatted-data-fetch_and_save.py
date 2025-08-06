import os
from pymongo import MongoClient, UpdateOne
import requests
from format_utils import format_book_data, format_chapter_data  # New utility to handle chapter formatting
from dotenv import load_dotenv

load_dotenv(dotenv_path="../server/.env")

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
books_collection = db["books"]
chapters_collection = db["chapters"]

API_URL = "https://api.potterdb.com/v1/books"


def fetch_books():
    try:
        res = requests.get(API_URL)
        res.raise_for_status()
        return res.json().get("data", [])
    except requests.RequestException as e:
        print(f"Error fetching books: {e}")
        return []


def fetch_chapters_for_book(book_id):
    try:
        res = requests.get(f"{API_URL}/{book_id}/chapters")
        res.raise_for_status()
        return res.json().get("data", [])
    except requests.RequestException as e:
        print(f"Error fetching chapters for book {book_id}: {e}")
        return []


def upsert_books(books):
    operations = []
    for book in books:
        book_id = book.get("id")

        full_book = book  # full raw JSON from API
        formatted_book = format_book_data(book)  # format only what frontend needs

        db_entry = {
            "id": book_id,
            "raw": full_book,
            "ui": formatted_book
        }

        operations.append(UpdateOne(
            {"id": book_id},
            {"$set": db_entry},
            upsert=True
        ))

    if operations:
        result = books_collection.bulk_write(operations)
        print(f"✔ {result.upserted_count} books inserted, {result.modified_count} updated.")


def upsert_chapters(book_id, chapters):
    operations = []
    for ch in chapters:
        ch_id = ch.get("id")

        full_chapter = ch
        formatted = format_chapter_data(ch)

        db_entry = {
            "id": ch_id,
            "book_id": book_id,
            "raw": full_chapter,
            "ui": formatted
        }

        operations.append(UpdateOne(
            {"id": ch_id},
            {"$set": db_entry},
            upsert=True
        ))

    if operations:
        result = chapters_collection.bulk_write(operations)
        print(f"✔ {result.upserted_count} chapters inserted, {result.modified_count} updated.")


def main():
    books = fetch_books()
    if not books:
        print("⚠ No books fetched. Skipping DB update.")
        return

    upsert_books(books)

    for book in books:
        book_id = book.get("id")
        chapters = fetch_chapters_for_book(book_id)
        upsert_chapters(book_id, chapters)

    print("✅ Sync complete")


if __name__ == "__main__":
    main()
