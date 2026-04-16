import requests
import base64
import os

# Utilitário para testar o BioService localmente ou remoto
URL = "http://localhost:5050/verify" # Troque para a URL real para testar produção

def test_bio(img1_path, img2_path):
    with open(img1_path, "rb") as f1, open(img2_path, "rb") as f2:
        b64_1 = base64.b64string(f1.read()).decode()
        b64_2 = base64.b64string(f2.read()).decode()
        
    payload = {
        "img1_b64": b64_1,
        "img2_b64": b64_2
    }
    
    resp = requests.post(URL, json=payload)
    print(resp.json())

if __name__ == "__main__":
    # Exemplo (comente se não tiver os arquivos)
    # test_bio("selfie.jpg", "perfil.jpg")
    pass
