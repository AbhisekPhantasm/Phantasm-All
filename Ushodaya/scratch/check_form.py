import requests
from bs4 import BeautifulSoup

url = "https://ushodaya.phantasm.solutions/contact-us/"
r = requests.get(url)
soup = BeautifulSoup(r.text, 'html.parser')
for tag in soup.find_all(['input', 'textarea']):
    print(f"Tag: {tag.name}, Name: {tag.get('name')}, ID: {tag.get('id')}, Type: {tag.get('type')}")
