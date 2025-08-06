import os
import requests
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv
from format_utils import format_book_data  # format_chapter_data removed

# Load environment variables
load_dotenv(dotenv_path="../server/.env")

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

# Initialize MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
books_collection = db["books"]

BASE_URL = "https://openlibrary.org"

def fetch_books(query="the", limit=100):
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

    # Enrich with work details and cover image
    enriched_books = []
    for doc in docs:
        if not doc.get("key", "").startswith("/works/"):
            continue  # Skip irrelevant entries

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

        # Cover image
        doc["cover_medium"] = (
            f"https://covers.openlibrary.org/b/id/{doc['cover_i']}-M.jpg"
            if doc.get("cover_i") else ""
        )

        enriched_books.append(doc)

    return enriched_books


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


def main():
    books = fetch_books(query="new", limit=1)
    if not books:
        print("⚠ No books fetched. Skipping DB update.")
        return

    upsert_books(books)
    print("✅ Sync complete")


if __name__ == "__main__":
    main()
