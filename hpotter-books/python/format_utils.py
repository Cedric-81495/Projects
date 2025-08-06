# python/format_utils.py

def format_book_data(book):
    attributes = book.get("attributes", {})
    return {
        "title": attributes.get("title"),
        "author": attributes.get("author"),
        "summary": attributes.get("summary"),
        "slug": attributes.get("slug"),
        "release_date": attributes.get("release_date"),
        "cover": attributes.get("cover")
    }


def format_chapter_data(chapter):
    attrs = chapter.get("attributes", {})
    return {
        "title": attrs.get("title"),
        "number": attrs.get("number"),
        "summary": attrs.get("summary"),
        "slug": attrs.get("slug")
    }
