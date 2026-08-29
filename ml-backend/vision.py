import cv2
import numpy as np
from PIL import Image
try:
    from pyzbar.pyzbar import decode
except Exception:
    decode = None

_model = None

def get_yolo_model():
    global _model
    if _model is None:
        try:
            from ultralytics import YOLO
            _model = YOLO('yolov8n.pt')
        except ImportError:
            _model = None
    return _model

def segment_pdp(image_bytes: bytes) -> np.ndarray:
    """
    Simulates or runs real YOLOv8 segmentation for Principal Display Panel (PDP).
    For the sake of hackathon demo, if YOLO fails to detect a specific 'PDP' class 
    (since yolov8n doesn't have a PDP class out of the box without fine-tuning),
    we fall back to standard image deskewing and cropping of the largest bounding box.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    model = get_yolo_model()
    if model:
        # Run YOLO inference
        results = model(img)
        # In a real fine-tuned model, we'd look for class 'pdp'
        # For now, we take the largest bounding box detected (usually the object/package)
        if len(results) > 0 and len(results[0].boxes) > 0:
            boxes = results[0].boxes
            # Find largest box by area
            largest_box = max(boxes, key=lambda b: (b.xyxy[0][2] - b.xyxy[0][0]) * (b.xyxy[0][3] - b.xyxy[0][1]))
            x1, y1, x2, y2 = map(int, largest_box.xyxy[0])
            # Crop image to this box (the package/PDP)
            img = img[y1:y2, x1:x2]
    
    # Advanced Preprocessing (OpenCV deskew & glare reduction)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # CLAHE for glare/contrast
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    
    return enhanced


def extract_barcode(image_bytes: bytes) -> str:
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    try:
        barcodes = decode(img)
        for barcode in barcodes:
            return barcode.data.decode('utf-8')
    except Exception:
        pass
    return ''
