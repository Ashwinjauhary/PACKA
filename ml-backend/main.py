from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import Dict, Any

from vision import segment_pdp, extract_barcode
from nlp import perform_ocr_and_ner

app = FastAPI(title="PACKA ML Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ML Backend is running (YOLOv8 + Transformers NER Ready)"}

@app.post("/analyze")
async def analyze_image(image: UploadFile = File(...)):
    """
    Receives an image, runs YOLOv8 segmentation for PDP, 
    then runs EasyOCR + NER extraction for LMPC compliance.
    """
    try:
        # Read image bytes
        image_bytes = await image.read()
        
        # 1. Computer Vision (YOLOv8 PDP Segmentation + Preprocessing)
        processed_image_np = segment_pdp(image_bytes)
        
        # Extract Barcode if present
        barcode = extract_barcode(image_bytes)

        # 2. OCR & NLP Classification (LayoutLMv3 NER extraction)
        result = perform_ocr_and_ner(processed_image_np)
        
        return {
            "status": "success",
            "barcode": barcode,
            "fullText": result.get("fullText", ""),
            "extractedFields": result.get("extractedFields", []),
            "pipeline_steps": [
                "YOLOv8 PDP Segmentation",
                "OpenCV Deskewing & Glare Reduction",
                "Barcode Extraction (pyzbar)",
                "EasyOCR Text Extraction",
                "Transformers NER Entity Classification"
            ]
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
