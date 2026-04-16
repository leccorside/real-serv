from flask import Flask, request, jsonify
from models import BioEngine
import os

app = Flask(__name__)
# Instancia o motor de biometria
engine = BioEngine()

@app.route('/', methods=['GET'])
def index():
    return "BioService RealServ Online"

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ready", 
        "engine": "OpenCV DNN + LBPH",
        "working_dir": os.getcwd()
    })

@app.route('/verify', methods=['POST'])
def verify():
    try:
        data = request.json
        img1_b64 = data.get('img1_b64')
        img2_b64 = data.get('img2_b64')
        img2_path = data.get('img2_path')

        if not img1_b64:
            return jsonify({"match": False, "similarity": 0.0, "message": "Falta img1_b64"}), 400

        if img2_b64:
            is_match, similarity, msg = engine.compare_b64_vs_b64(img1_b64, img2_b64)
        elif img2_path:
            is_match, similarity, msg = engine.compare_b64_vs_file(img1_b64, img2_path)
        else:
            return jsonify({"match": False, "similarity": 0.0, "message": "Falta foto de referencia"}), 400

        return jsonify({"match": is_match, "similarity": similarity, "message": msg})

    except Exception as e:
        return jsonify({"match": False, "similarity": 0.0, "message": str(e)}), 500

# Entrypoint para o PythonAnywhere
application = app

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050)
