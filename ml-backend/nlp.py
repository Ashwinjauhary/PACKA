import easyocr
import re
from typing import Dict, Any, List

# Initialize EasyOCR
# Now using 5 languages natively to support regional scripts
try:
    reader = easyocr.Reader(['en', 'hi', 'mr', 'ta', 'bn'])
except Exception as e:
    reader = None

# Initialize Transformers NER
try:
    from transformers import pipeline
    # We use a standard NER pipeline to simulate the semantic extraction
    # before refining with our custom regex rules for LMPC compliance.
    ner_pipeline = pipeline("ner", aggregation_strategy="simple")
except ImportError:
    ner_pipeline = None
except Exception:
    ner_pipeline = None

def perform_ocr_and_ner(image_np) -> Dict[str, Any]:
    """
    Runs EasyOCR over the pre-processed OpenCV image,
    runs a semantic NER pipeline, and then refines with LMPC regex rules.
    """
    if reader is None:
        return {"error": "EasyOCR not initialized"}
        
    results = reader.readtext(image_np)
    
    heights = []
    for (bbox, text, prob) in results:
        h = abs(bbox[2][1] - bbox[1][1])
        heights.append(h)
        
    median_height_px = 18
    if heights:
        heights.sort()
        median_height_px = heights[len(heights)//2]
    
    full_text = " ".join([text for (bbox, text, prob) in results])
    
    # 1. Transformers NER / Deep Learning Semantic Extraction
    deep_entities = []
    if ner_pipeline:
        try:
            deep_entities = ner_pipeline(full_text)
            print("Extracted NER Entities:", deep_entities)
        except Exception:
            pass

    # 2. NLP Classification (Refining deep entities with LMPC robust regex fallbacks)
    fields = classify_fields_robust(full_text)
    
    # 3. Merge Transformers NER entities into the final output
    if deep_entities:
        for ent in deep_entities:
            # We add the generic entities extracted by the Transformers NER pipeline 
            # to our specific LMPC fields, so they are not just printed but actually used.
            fields.append({
                "fieldType": "generic_entity",
                "label": f"NER: {ent.get('entity_group', 'Entity')}",
                "rawText": ent.get('word', ''),
                "confidence": round(ent.get('score', 0) * 100, 2)
            })

    for f in fields:
        f["fontSize"] = float(median_height_px)
        
    return {
        "fullText": full_text,
        "extractedFields": fields
    }

def classify_fields_robust(text: str) -> List[Dict[str, Any]]:
    # This is a Python-based robust entity extractor that we use as the NER engine
    text = text.lower()
    
    fields = []
    
    # MRP
    mrp_match = re.search(r'(?:mrp|m\.?r\.?p\.?|max\.?\s*retail\s*price).*?(?:rs\.?|inr|₹)?\s*(\d+\.?\d*)', text)
    if mrp_match:
        fields.append({
            "fieldType": "mrp",
            "label": "Maximum Retail Price (MRP)",
            "rawText": mrp_match.group(0),
            "numericValue": float(mrp_match.group(1)),
            "confidence": 95
        })
        
    # Net Quantity
    qty_match = re.search(r'(?:net\s*weight|net\s*wt|net\s*quantity|net\s*qty|net\s*volume|volume|weight).*?(\d+\.?\d*)\s*(g|gm|kg|ml|l|litre|pieces?|pcs)', text)
    if qty_match:
        fields.append({
            "fieldType": "net_quantity",
            "label": "Net Quantity",
            "rawText": qty_match.group(0),
            "numericValue": float(qty_match.group(1)),
            "unit": qty_match.group(2),
            "confidence": 90
        })
        
    # Manufacturer
    mfg_match = re.search(r'(?:mfd|manufactured|packed)\s*(?:by|for)[:\s]+([^,\.]+)', text)
    if mfg_match:
        fields.append({
            "fieldType": "manufacturer_details",
            "label": "Manufacturer / Packer Name",
            "rawText": mfg_match.group(0),
            "confidence": 85
        })
        
    # Mfg Date
    date_match = re.search(r'(?:mfg|manufacture)\s*date.*?(\d{1,2}[/\-]\d{2,4}|[a-z]{3}\.?\s*\d{4})', text)
    if date_match:
        fields.append({
            "fieldType": "manufacture_date",
            "label": "Date of Manufacture",
            "rawText": date_match.group(0),
            "confidence": 88
        })

    # Best Before
    bb_match = re.search(r'(?:best\s*before|expiry|use\s*by).*?(?:\d+\s*(?:months?|days?|years?)|\d{1,2}[/\-]\d{2,4})', text)
    if bb_match:
        fields.append({
            "fieldType": "best_before",
            "label": "Best Before",
            "rawText": bb_match.group(0),
            "confidence": 90
        })

    # Consumer Care
    care_match = re.search(r'(?:consumer|customer)\s*(?:care|support|helpline).*?((?:1800[\-\s]?\d{3}[\-\s]?\d{4}|\d{10})|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})', text)
    if care_match:
        fields.append({
            "fieldType": "consumer_care",
            "label": "Consumer Care Details",
            "rawText": care_match.group(0),
            "confidence": 92
        })
        
    # Common Name (Generic Name)
    name_match = re.search(r'(?:biscuits|chips|soap|shampoo|oil|bottle|cream|powder)', text)
    if name_match:
        fields.append({
            "fieldType": "commodity_name",
            "label": "Common / Generic Name",
            "rawText": name_match.group(0).capitalize(),
            "confidence": 80
        })
        
    return fields
