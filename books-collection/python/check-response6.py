import requests

BASE = "https://openlibrary.org"

def fetch_fiction_books(query, limit=3):
    print(f"\n🔍 Searching for fiction books with query: '{query}' (limit: {limit})")

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
    result = r.json()
    docs = result.get("docs", [])

    # Filter locally in case API doesn't respect subject filter strictly
    fiction_docs = [doc for doc in docs if "Fiction" in [s.lower().capitalize() for s in doc.get("subject", [])]]

    print(f"✅ Found {len(fiction_docs)} fiction books.\n")

    for idx, doc in enumerate(fiction_docs, start=1):
        title = doc.get("title", "N/A")
        authors = ", ".join(doc.get("author_name", ["Unknown"]))
        year = doc.get("first_publish_year", "Unknown")
        print(f"📘 Book {idx}: {title}")
        print(f"   ✍️ Author(s): {authors}")
        print(f"   📅 First Published: {year}")

        work_key = doc.get("key")
        work_url = f"{BASE}{work_key}.json"
        work_resp = requests.get(work_url)

        # Defaults
        doc["description"] = ""
        doc["subjects"] = []

        if work_resp.ok:
            work_data = work_resp.json()

            # Description
            desc_data = work_data.get("description", "")
            if isinstance(desc_data, dict):
                doc["description"] = desc_data.get("value", "")
            else:
                doc["description"] = desc_data

            # Subjects
            doc["subjects"] = work_data.get("subjects", [])

        print(f"   📝 Description: {doc['description'][:200]}{'...' if len(doc['description']) > 200 else ''}")
        if doc["subjects"]:
            print(f"   🗂️ Categories: {', '.join(doc['subjects'][:5])}{' ...' if len(doc['subjects']) > 5 else ''}")
        else:
            print("   🗂️ Categories: (none listed)")

        if doc.get("cover_i"):
            doc["cover_medium"] = f"https://covers.openlibrary.org/b/id/{doc['cover_i']}-M.jpg"
            doc["cover_large"] = f"https://covers.openlibrary.org/b/id/{doc['cover_i']}-L.jpg"
            print(f"   🖼️ Cover (Medium): {doc['cover_medium']}")
            print(f"   🖼️ Cover (Large): {doc['cover_large']}")
        print()

    return fiction_docs

# Example usage
if __name__ == "__main__":
    fetch_fiction_books("love", limit=5)
