import urllib.request
import urllib.parse
import json

url = "http://localhost/Handlers/PontoHandler_vFinal.ashx"
params = {
    "busca": "C818",
    "dataInicial": "2026-03-16",
    "dataFinal": "2026-03-16"
}

query_string = urllib.parse.urlencode(params)
full_url = f"{url}?{query_string}"

try:
    print(f"Fetching: {full_url}")
    with urllib.request.urlopen(full_url) as response:
        data = response.read().decode('utf-8')
        print(f"Status: {response.status}")
        print("Response Body:")
        print(data)
except Exception as e:
    print(f"Error: {e}")
