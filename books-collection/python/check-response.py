import requests

# url = "https://harrypotter.fandom.com/wiki/Riddle_House.json"
url = "https://api.potterdb.com/v1/books/b3f0a008-1468-4890-aae4-2db54b366aab"
res = requests.get(url)

print(res.status_code)
print(res.json())
