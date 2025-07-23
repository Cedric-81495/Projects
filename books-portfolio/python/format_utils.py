def format_book_data(book):
    attrs = book.get("attributes", {})
    return {
        "id": book.get("id"),
        "title": attrs.get("title"),
        "author": attrs.get("author"),
        "release_date": attrs.get("release_date"),
        "summary": attrs.get("summary"),
        "pages": attrs.get("pages"),
        "wiki": attrs.get("wiki"),
        "cover": attrs.get("cover"),
    }
