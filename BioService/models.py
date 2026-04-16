import cv2
import numpy as np
import os
import base64

class BioEngine:
    def __init__(self):
        self.recognizer = cv2.face.LBPHFaceRecognizer_create()

        # Detector DNN (Caffe) — robusto para barba, óculos, cabeça raspada
        model_dir = os.path.dirname(os.path.abspath(__file__))
        prototxt   = os.path.join(model_dir, "deploy.prototxt")
        caffemodel = os.path.join(model_dir, "res10_300x300_ssd_iter_140000.caffemodel")

        if os.path.exists(prototxt) and os.path.exists(caffemodel):
            self.dnn_net = cv2.dnn.readNetFromCaffe(prototxt, caffemodel)
            print("BioEngine: Detector DNN carregado com sucesso.")
        else:
            self.dnn_net = None
            print("BioEngine: Modelos DNN não encontrados, usando Haar Cascade como fallback.")

        cascade_path = os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
        self.face_cascade = cv2.CascadeClassifier(cascade_path)

    def _b64_to_cv2(self, b64_str):
        """Decodifica string base64 para imagem OpenCV (sem arquivo temporário)."""
        # Remove prefixo data URI se presente
        if ',' in b64_str:
            b64_str = b64_str.split(',')[1]
        data = base64.b64decode(b64_str)
        arr = np.frombuffer(data, dtype=np.uint8)
        return cv2.imdecode(arr, cv2.IMREAD_COLOR)

    def _detect_dnn(self, image):
        """Detecta rosto via DNN."""
        if self.dnn_net is None:
            return None
        h, w = image.shape[:2]
        blob = cv2.dnn.blobFromImage(cv2.resize(image, (300, 300)), 1.0,
                                     (300, 300), (104.0, 177.0, 123.0))
        self.dnn_net.setInput(blob)
        detections = self.dnn_net.forward()
        best, best_conf = None, 0.4
        for i in range(detections.shape[2]):
            conf = float(detections[0, 0, i, 2])
            if conf > best_conf:
                best_conf = conf
                box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                best = box.astype(int)
        return best

    def _detect_haar(self, gray):
        """Haar Cascade com parâmetros relaxados."""
        faces = self.face_cascade.detectMultiScale(gray, 1.05, 3, minSize=(60, 60))
        if len(faces) == 0:
            return None
        (x, y, w, h) = sorted(faces, key=lambda f: f[2]*f[3], reverse=True)[0]
        return [x, y, x + w, y + h]

    def get_face(self, image):
        """Extrai rosto: DNN → Haar → Crop Central (nunca retorna None)."""
        if image is None:
            return None
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape

        box = self._detect_dnn(image)
        if box is None:
            box = self._detect_haar(gray)
        if box is None:
            print("WARN: Rosto não detectado — usando crop central.")
            mv, mh = int(h * 0.1), int(w * 0.1)
            box = [mh, mv, w - mh, h - mv]

        x1, y1, x2, y2 = [max(0, box[0]), max(0, box[1]),
                           min(w, box[2]), min(h, box[3])]
        face_roi = gray[y1:y2, x1:x2]
        if face_roi.size == 0:
            face_roi = gray
        return cv2.resize(face_roi, (200, 200))

    def compare_b64_vs_b64(self, img1_b64, img2_b64):
        """
        Compara duas imagens ambas em formato base64.
        Usado em producao (hosting compartilhado) onde o Python nao acessa
        o disco do servidor ASP.NET.
        """
        try:
            img1 = self._b64_to_cv2(img1_b64)
            img2 = self._b64_to_cv2(img2_b64)

            if img1 is None:
                return False, 0.0, "Selfie enviada nao pode ser decodificada."
            if img2 is None:
                return False, 0.0, "Foto de perfil nao pode ser decodificada."

            face1 = self.get_face(img1)
            face2 = self.get_face(img2)

            import numpy as np
            self.recognizer.train([face2], np.array([1]))
            label, confidence = self.recognizer.predict(face1)

            print(f"DEBUG b64vsb64: LBPH Distancia = {confidence:.2f}")

            similarity = max(0.0, (100.0 - confidence) / 100.0)
            is_match   = confidence < 55.0

            return is_match, float(similarity), "OK"

        except Exception as e:
            print(f"DEBUG: Excecao compare_b64_vs_b64: {e}")
            return False, 0.0, f"Erro interno: {str(e)}"

    def compare_b64_vs_file(self, img1_b64, img2_path):
        """
        Compara a selfie (base64) contra a foto de perfil (caminho no disco).
        O Python tem acesso direto ao D:\ — sem dependência de arquivo temporário.
        """
        try:
            # Decodifica selfie do app em memória (sem arquivo temporário)
            img1 = self._b64_to_cv2(img1_b64)
            if img1 is None:
                return False, 0.0, "Selfie enviada não pôde ser decodificada."

            # Lê foto de perfil do disco D: (Python tem acesso)
            abs2 = os.path.abspath(img2_path)
            print(f"DEBUG: Lendo perfil em: {abs2}")
            if not os.path.exists(abs2):
                print(f"DEBUG: PERFIL NAO ENCONTRADO: {abs2}")
                return False, 0.0, f"Foto de perfil não encontrada: {abs2}"

            img2 = cv2.imread(abs2)
            if img2 is None:
                return False, 0.0, "Foto de perfil não pôde ser decodificada (formato?)."

            # Extração de ROI facial
            face1 = self.get_face(img1)  # selfie
            face2 = self.get_face(img2)  # perfil

            # Comparação LBPH 1:1
            self.recognizer.train([face2], np.array([1]))  # treina com perfil
            label, confidence = self.recognizer.predict(face1)  # prediz selfie

            print(f"DEBUG: LBPH Distância = {confidence:.2f}")

            similarity = max(0.0, (100.0 - confidence) / 100.0)
            # Threshold 55: distância LBPH < 55 para aprovação (mais restrito que 75)
            # Quanto menor o número, mais exigente. 75 é permissivo, 55 é rigoroso.
            is_match   = confidence < 55.0

            return is_match, float(similarity), "OK"

        except Exception as e:
            print(f"DEBUG: Exceção: {e}")
            return False, 0.0, f"Erro interno: {str(e)}"
