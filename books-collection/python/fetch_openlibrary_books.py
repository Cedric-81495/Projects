import os
from pymongo import MongoClient, UpdateOne
import requests
from format_utils import format_book_data, format_chapter_data
from dotenv import load_dotenv

load_dotenv(dotenv_path="../server/.env")

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
books_collection = db["books"]
chapters_collection = db["chapters"]  # May remain unused

BASE_URL = "https://openlibrary.org"

def fetch_books(query="love", limit=10):
    print(f"🔍 Searching Open Library for books: '{query}'")

    try:
        r = requests.get(f"{BASE_URL}/search.json", params={
            "q": query,
            "limit": limit,
            "fields": "key,title,author_name,first_publish_year,cover_i,subject",
            "subject": "fiction"
        })
        r.raise_for_status()
        docs = r.json().get("docs", [])
    except requests.RequestException as e:
        print(f"❌ Error fetching books: {e}")
        return []

    # Enrich with work details and images
    enriched_books = []
    for doc in docs:
        if not doc.get("key", "").startswith("/works/"):
            continue  # skip non-work types

        try:
            work_resp = requests.get(f"{BASE_URL}{doc['key']}.json")
            if work_resp.ok:
                work_data = work_resp.json()
                desc = work_data.get("description", "")
                if isinstance(desc, dict):
                    desc = desc.get("value", "")
                doc["description"] = desc
                doc["subjects"] = work_data.get("subjects", [])
            else:
                doc["description"] = ""
        except Exception:
            doc["description"] = ""

        # Add cover
        if doc.get("cover_i"):
            doc["cover_medium"] = f"https://covers.openlibrary.org/b/id/{doc['cover_i']}-M.jpg"
        else:
            doc["cover_medium"] = ""

        enriched_books.append(doc)

    return enriched_books


def fetch_chapters_for_book(book_id):
    # Not available in Open Library
    return []


def upsert_books(books):
    operations = []
    for book in books:
        book_id = book.get("key")  # e.g., "/works/OL12345W"
        db_entry = {
            "id": book_id,
            "raw": book,
            "ui": format_book_data(book)
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
    # You can keep this empty or log that it's skipped
    if not chapters:
        return
    operations = []
    for ch in chapters:
        ch_id = ch.get("id", f"{book_id}-ch-{len(operations)}")
        db_entry = {
            "id": ch_id,
            "book_id": book_id,
            "raw": ch,
            "ui": format_chapter_data(ch)
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
    books = fetch_books(query="love", limit=10)
    if not books:
        print("⚠ No books fetched. Skipping DB update.")
        return

    upsert_books(books)

    for book in books:
        book_id = book.get("key")
        chapters = fetch_chapters_for_book(book_id)  # will be empty
        upsert_chapters(book_id, chapters)

    print("✅ Sync complete")


if __name__ == "__main__":
    main()
