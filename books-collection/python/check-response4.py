import requests
import json

def search_books(query: str, limit: int = 5, fields: str = "key,title,author_name,first_publish_year,cover_i,editions.editions"):
    url = "https://openlibrary.org/search.json"
    params = {
        "q": query,
        "limit": limit,
        "fields": fields
    }
    headers = {
        "User-Agent": "MyOpenLibraryApp/1.0 (contact@example.com)"
    }
    response = requests.get(url, params=params, headers=headers)
    response.raise_for_status()
    return response.json()

if __name__ == "__main__":
    query = "Python programming"
    data = search_books(query, limit=3)
    print(json.dumps(data, indent=2))
