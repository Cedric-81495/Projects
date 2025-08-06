# format_utils.py

def format_book_data(book):
    return {
        "id": book.get("key", "").replace("/works/", ""),
        "title": book.get("title", "Untitled"),
        "authors": book.get("author_name", ["Unknown"]),
        "summary": (
            book.get("description", {}).get("value")
            if isinstance(book.get("description"), dict)
            else book.get("description", "")
        ),
        "subjects": book.get("subjects", []),
        "cover": book.get("cover_medium", ""),
        "release_year": book.get("first_publish_year"),
    }
