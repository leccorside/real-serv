import requests

url = "http://localhost/Handlers/PontoHandler_vFinal.ashx"
params = {
    "busca": "C818",
    "dataInicial": "2026-03-16",
    "dataFinal": "2026-03-16"
}

try:
    response = requests.get(url, params=params)
    print(f"Status: {response.status_code}")
    print("Response Body:")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
