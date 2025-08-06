import requests
from bs4 import BeautifulSoup

url = "https://harrypotter.fandom.com/wiki/Riddle_House"
res = requests.get(url)

print("Status Code:", res.status_code)

if res.status_code == 200:
    soup = BeautifulSoup(res.text, "html.parser")
    
    # Try to extract the first paragraph from the article content
    content = soup.find("div", {"class": "mw-parser-output"})
    if content:
        first_paragraph = content.find("p")
        if first_paragraph:
            print(first_paragraph.get_text(strip=True))
        else:
            print("No paragraph found.")
    else:
        print("No content section found.")
else:
    print("Failed to load page.")
