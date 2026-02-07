from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from pypdf import PdfReader, PdfWriter

from typing import List, Optional
import os
import io
import shutil
from pathlib import Path

# PDF Processing Libraries

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4, legal
from reportlab.lib.utils import ImageReader
from PIL import Image
import pdfplumber
import pytesseract
from pdf2image import convert_from_path
import tempfile

# App Configuration
app = FastAPI(title="PDF Tools Pro", version="1.0.0")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# Directories
UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("output")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)


# ===================================
# UTILITY FUNCTIONS
# ===================================

def save_upload_file(upload_file: UploadFile, destination: Path):
    """Save uploaded file to destination"""
    with destination.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)


def cleanup_files(*files: Path):
    """Delete temporary files"""
    for file in files:
        try:
            if file.exists():
                file.unlink()
        except Exception as e:
            print(f"Error cleaning up {file}: {e}")


# ===================================
# ROUTES
# ===================================

@app.get("/")
async def home(request: Request):
    """Serve main page"""
    return templates.TemplateResponse("index.html", {"request": request})


# ===================================
# PDF MERGE
# ===================================

@app.post("/api/merge")
async def merge_pdfs(files: List[UploadFile] = File(...)):
    """Merge multiple PDFs into one"""
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="At least 2 files required")
    
    temp_files = []
    output_path = OUTPUT_DIR / f"merged_{os.urandom(8).hex()}.pdf"
    
    try:
        merger = PdfMerger()
        
        for file in files:
            if not file.filename.endswith('.pdf'):
                raise HTTPException(status_code=400, detail="Only PDF files allowed")
            
            temp_path = UPLOAD_DIR / file.filename
            save_upload_file(file, temp_path)
            temp_files.append(temp_path)
            
            merger.append(str(temp_path))
        
        merger.write(str(output_path))
        merger.close()
        
        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename=f"merged_{os.path.basename(output_path)}"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        cleanup_files(*temp_files)


# ===================================
# PDF SPLIT
# ===================================

@app.post("/api/split")
async def split_pdf(
    files: List[UploadFile] = File(...),
    pages: str = Form(default="")
):
    """Split PDF by page numbers"""
    if len(files) != 1:
        raise HTTPException(status_code=400, detail="Only one file allowed")
    
    file = files[0]
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    temp_path = UPLOAD_DIR / file.filename
    output_path = OUTPUT_DIR / f"split_{os.urandom(8).hex()}.pdf"
    
    try:
        save_upload_file(file, temp_path)
        
        reader = PdfReader(str(temp_path))
        writer = PdfWriter()
        
        # Parse page ranges (e.g., "1-3,5,7-10")
        if pages:
            page_numbers = parse_page_ranges(pages, len(reader.pages))
        else:
            page_numbers = range(len(reader.pages))
        
        for page_num in page_numbers:
            if 0 <= page_num < len(reader.pages):
                writer.add_page(reader.pages[page_num])
        
        with open(output_path, "wb") as output_file:
            writer.write(output_file)
        
        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename=f"split_{os.path.basename(output_path)}"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        cleanup_files(temp_path)


def parse_page_ranges(ranges: str, total_pages: int) -> List[int]:
    """Parse page ranges like '1-3,5,7-10' into list of page numbers (0-indexed)"""
    pages = []
    for part in ranges.split(','):
        if '-' in part:
            start, end = map(int, part.split('-'))
            pages.extend(range(start - 1, min(end, total_pages)))
        else:
            page = int(part) - 1
            if 0 <= page < total_pages:
                pages.append(page)
    return sorted(set(pages))


# ===================================
# PDF COMPRESSION
# ===================================

@app.post("/api/compress")
async def compress_pdf(
    files: List[UploadFile] = File(...),
    quality: str = Form(default="medium")
):
    """Compress PDF file"""
    if len(files) != 1:
        raise HTTPException(status_code=400, detail="Only one file allowed")
    
    file = files[0]
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    temp_path = UPLOAD_DIR / file.filename
    output_path = OUTPUT_DIR / f"compressed_{os.urandom(8).hex()}.pdf"
    
    try:
        save_upload_file(file, temp_path)
        
        reader = PdfReader(str(temp_path))
        writer = PdfWriter()
        
        for page in reader.pages:
            # Compress content streams
            page.compress_content_streams()
            writer.add_page(page)
        
        # Set compression level based on quality
        if quality == "high":
            compression_level = 1
        elif quality == "medium":
            compression_level = 5
        else:  # low
            compression_level = 9
        
        with open(output_path, "wb") as output_file:
            writer.write(output_file)
        
        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename=f"compressed_{os.path.basename(output_path)}"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        cleanup_files(temp_path)


# ===================================
# PDF ENCRYPTION
# ===================================

@app.post("/api/encrypt")
async def encrypt_pdf(
    files: List[UploadFile] = File(...),
    password: str = Form(...)
):
    """Encrypt PDF with password"""
    if len(files) != 1:
        raise HTTPException(status_code=400, detail="Only one file allowed")
    
    file = files[0]
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    temp_path = UPLOAD_DIR / file.filename
    output_path = OUTPUT_DIR / f"encrypted_{os.urandom(8).hex()}.pdf"
    
    try:
        save_upload_file(file, temp_path)
        
        reader = PdfReader(str(temp_path))
        writer = PdfWriter()
        
        for page in reader.pages:
            writer.add_page(page)
        
        writer.encrypt(password)
        
        with open(output_path, "wb") as output_file:
            writer.write(output_file)
        
        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename=f"encrypted_{os.path.basename(output_path)}"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        cleanup_files(temp_path)


# ===================================
# PDF TO TEXT
# ===================================

@app.post("/api/pdf-to-text")
async def pdf_to_text(files: List[UploadFile] = File(...)):
    """Extract text from PDF"""
    if len(files) != 1:
        raise HTTPException(status_code=400, detail="Only one file allowed")
    
    file = files[0]
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    temp_path = UPLOAD_DIR / file.filename
    output_path = OUTPUT_DIR / f"text_{os.urandom(8).hex()}.txt"
    
    try:
        save_upload_file(file, temp_path)
        
        text_content = []
        
        with pdfplumber.open(str(temp_path)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_content.append(text)
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n\n".join(text_content))
        
        return FileResponse(
            output_path,
            media_type="text/plain",
            filename=f"extracted_text.txt"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        cleanup_files(temp_path)


# ===================================
# OCR (OPTICAL CHARACTER RECOGNITION)
# ===================================

@app.post("/api/ocr")
async def ocr_image(
    files: List[UploadFile] = File(...),
    language: str = Form(default="eng")
):
    """Extract text from images using OCR"""
    if len(files) != 1:
        raise HTTPException(status_code=400, detail="Only one file allowed")
    
    file = files[0]
    temp_path = UPLOAD_DIR / file.filename
    output_path = OUTPUT_DIR / f"ocr_{os.urandom(8).hex()}.txt"
    
    try:
        save_upload_file(file, temp_path)
        
        text_content = []
        
        if file.filename.endswith('.pdf'):
            # Convert PDF to images then OCR
            images = convert_from_path(str(temp_path))
            for img in images:
                text = pytesseract.image_to_string(img, lang=language)
                text_content.append(text)
        else:
            # Direct image OCR
            img = Image.open(temp_path)
            text = pytesseract.image_to_string(img, lang=language)
            text_content.append(text)
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n\n".join(text_content))
        
        return FileResponse(
            output_path,
            media_type="text/plain",
            filename=f"ocr_text.txt"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        cleanup_files(temp_path)


# ===================================
# IMAGE TO PDF
# ===================================

@app.post("/api/img-to-pdf")
async def image_to_pdf(
    files: List[UploadFile] = File(...),
    page_size: str = Form(default="A4")
):
    """Convert images to PDF"""
    if not files:
        raise HTTPException(status_code=400, detail="At least one file required")
    
    temp_files = []
    output_path = OUTPUT_DIR / f"images_{os.urandom(8).hex()}.pdf"
    
    try:
        # Get page size
        page_sizes = {
            "A4": A4,
            "Letter": letter,
            "Legal": legal
        }
        size = page_sizes.get(page_size, A4)
        
        c = canvas.Canvas(str(output_path), pagesize=size)
        width, height = size
        
        for file in files:
            temp_path = UPLOAD_DIR / file.filename
            save_upload_file(file, temp_path)
            temp_files.append(temp_path)
            
            # Open and process image
            img = Image.open(temp_path)
            
            # Calculate scaling to fit page
            img_width, img_height = img.size
            scale = min(width / img_width, height / img_height)
            
            new_width = img_width * scale * 0.9  # 90% of page
            new_height = img_height * scale * 0.9
            
            x = (width - new_width) / 2
            y = (height - new_height) / 2
            
            c.drawImage(str(temp_path), x, y, new_width, new_height)
            c.showPage()
        
        c.save()
        
        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename=f"converted_{os.path.basename(output_path)}"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        cleanup_files(*temp_files)


# ===================================
# ROTATE PDF
# ===================================

@app.post("/api/rotate")
async def rotate_pdf(
    files: List[UploadFile] = File(...),
    rotation: str = Form(...),
    pages: str = Form(default="")
):
    """Rotate PDF pages"""
    if len(files) != 1:
        raise HTTPException(status_code=400, detail="Only one file allowed")
    
    file = files[0]
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    temp_path = UPLOAD_DIR / file.filename
    output_path = OUTPUT_DIR / f"rotated_{os.urandom(8).hex()}.pdf"
    
    try:
        save_upload_file(file, temp_path)
        
        reader = PdfReader(str(temp_path))
        writer = PdfWriter()
        
        rotation_angle = int(rotation)
        
        # Parse page ranges
        if pages:
            page_numbers = set(parse_page_ranges(pages, len(reader.pages)))
        else:
            page_numbers = set(range(len(reader.pages)))
        
        for i, page in enumerate(reader.pages):
            if i in page_numbers:
                page.rotate(rotation_angle)
            writer.add_page(page)
        
        with open(output_path, "wb") as output_file:
            writer.write(output_file)
        
        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename=f"rotated_{os.path.basename(output_path)}"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        cleanup_files(temp_path)


# ===================================
# ADD WATERMARK
# ===================================

@app.post("/api/watermark")
async def add_watermark(
    files: List[UploadFile] = File(...),
    watermark_text: str = Form(...),
    opacity: str = Form(default="0.4")
):
    """Add text watermark to PDF"""
    if len(files) != 1:
        raise HTTPException(status_code=400, detail="Only one file allowed")
    
    file = files[0]
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    temp_path = UPLOAD_DIR / file.filename
    watermark_path = UPLOAD_DIR / f"watermark_{os.urandom(8).hex()}.pdf"
    output_path = OUTPUT_DIR / f"watermarked_{os.urandom(8).hex()}.pdf"
    
    try:
        save_upload_file(file, temp_path)
        
        reader = PdfReader(str(temp_path))
        
        # Create watermark PDF
        c = canvas.Canvas(str(watermark_path), pagesize=letter)
        c.setFont("Helvetica", 60)
        c.setFillAlpha(float(opacity))
        c.setFillColorRGB(0.5, 0.5, 0.5)
        
        # Rotate and center watermark
        c.saveState()
        c.translate(300, 400)
        c.rotate(45)
        c.drawCentredString(0, 0, watermark_text)
        c.restoreState()
        c.save()
        
        # Apply watermark to all pages
        watermark_reader = PdfReader(str(watermark_path))
        watermark_page = watermark_reader.pages[0]
        
        writer = PdfWriter()
        for page in reader.pages:
            page.merge_page(watermark_page)
            writer.add_page(page)
        
        with open(output_path, "wb") as output_file:
            writer.write(output_file)
        
        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename=f"watermarked_{os.path.basename(output_path)}"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        cleanup_files(temp_path, watermark_path)


# ===================================
# HEALTH CHECK
# ===================================

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "PDF Tools Pro API is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)