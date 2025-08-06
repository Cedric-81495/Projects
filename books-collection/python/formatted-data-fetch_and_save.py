import os
from pymongo import MongoClient, UpdateOne
import requests
from format_utils import format_openlibrary_book
from dotenv import load_dotenv

load_dotenv(dotenv_path="../server/.env")

BASE = "https://openlibrary.org"
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
books_collection = db["books"]

def fetch_fiction_books(query, limit=5):
    print(f"\n🔍 Searching for fiction books with query: '{query}'")

    r = requests.get(
        f"{BASE}/search.json",
        params={
            "q": query,
            "limit": limit,
            "fields": "key,title,author_name,first_publish_year,cover_i,subject",
            "subject": "fiction"
        }
    )
    r.raise_for_status()
    docs = r.json().get("docs", [])

    fiction_docs = [
        doc for doc in docs
        if "Fiction" in [s.lower().capitalize() for s in doc.get("subject", [])]
    ]

    for doc in fiction_docs:
        # Enrich with work details
        work_url = f"{BASE}{doc['key']}.json"
        r = requests.get(work_url)
        if r.ok:
            work_data = r.json()

            desc_data = work_data.get("description", "")
            if isinstance(desc_data, dict):
                doc["description"] = desc_data.get("value", "")
            else:
                doc["description"] = desc_data

            doc["subjects"] = work_data.get("subjects", [])

        # Cover image links
        if doc.get("cover_i"):
            doc["cover_medium"] = f"https://covers.openlibrary.org/b/id/{doc['cover_i']}-M.jpg"
            doc["cover_large"] = f"https://covers.openlibrary.org/b/id/{doc['cover_i']}-L.jpg"
        else:
            doc["cover_medium"] = ""
            doc["cover_large"] = ""

    return fiction_docs


def upsert_books(books):
    operations = []

    for book in books:
        book_id = book.get("key")  # e.g., "/works/OL12345W"

        db_entry = {
            "id": book_id,
            "raw": book,
            "ui": format_openlibrary_book(book)
        }

        operations.append(UpdateOne(
            {"id": book_id},
            {"$set": db_entry},
            upsert=True
        ))

    if operations:
        result = books_collection.bulk_write(operations)
        print(f"✔ {result.upserted_count} inserted, {result.modified_count} updated.")


def main():
    query = "love"
    books = fetch_fiction_books(query, limit=10)
    if not books:
        print("⚠ No books fetched.")
        return

    upsert_books(books)
    print("✅ Sync complete")


if __name__ == "__main__":
    main()
