import requests

def search_book(title):
    """Search for a book by title in Open Library."""
    url = "https://openlibrary.org/search.json"
    params = {"title": title}
    res = requests.get(url, params=params)
    if res.status_code != 200:
        print("Search failed")
        return None

    data = res.json()
    if data["numFound"] == 0:
        print("No books found.")
        return None

    # Pick the top search result (best match)
    return data["docs"][0]

def get_book_details(work_key):
    """Get detailed info about a book by work key."""
    url = f"https://openlibrary.org{work_key}.json"
    res = requests.get(url)
    if res.status_code != 200:
        print("Failed to get book details.")
        return None
    return res.json()

def print_book_info(book_data, detail_data):
    title = book_data.get("title")
    authors = book_data.get("author_name", [])
    publish_year = book_data.get("first_publish_year")
    print(f"\nTitle: {title}")
    print(f"Authors: {', '.join(authors) if authors else 'N/A'}")
    print(f"First Published: {publish_year}")

    description = detail_data.get("description")
    if isinstance(description, dict):
        description = description.get("value")
    elif isinstance(description, str):
        pass
    else:
        description = "No description available."
    print(f"\nDescription:\n{description}")

    # Table of Contents (chapters) may be in detail_data['table_of_contents']
    toc = detail_data.get("table_of_contents")
    if toc:
        print("\nTable of Contents:")
        for i, chapter in enumerate(toc, 1):
            title = chapter.get("title", "Unknown")
            print(f"  {i}. {title}")
    else:
        print("\nNo table of contents available.")

    # Link to the book page
    print(f"\nMore info: https://openlibrary.org{book_data['key']}")

def main():
    title = "Harry Potter and the Philosopher's Stone"
    book_data = search_book(title)
    if not book_data:
        return

    work_key = book_data.get("key")
    if not work_key:
        print("No work key found.")
        return

    detail_data = get_book_details(work_key)
    if not detail_data:
        return

    print_book_info(book_data, detail_data)

if __name__ == "__main__":
    main()
