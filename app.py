from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from pypdf import PdfReader, PdfWriter

from typing import List, Optional
import os
import io
import shutil
from pathlib import Path
import re
from collections import Counter

# PDF Processing Libraries
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4, legal
from reportlab.lib.utils import ImageReader
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image
import pdfplumber
from pdf2image import convert_from_path
import tempfile

# Spell checking
try:
    from spellchecker import SpellChecker
    SPELL_CHECKER_AVAILABLE = True
except ImportError:
    SPELL_CHECKER_AVAILABLE = False
    SpellChecker = None

# App Configuration
app = FastAPI(title="PDF Tools Pro", version="2.0.0")

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


@app.head("/")
async def home_head():
    """Handle HEAD requests for UptimeRobot and other monitoring services"""
    from fastapi.responses import Response
    return Response(status_code=200, headers={"Content-Type": "text/html"})


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
        from pypdf import PdfMerger
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
            page.compress_content_streams()
            writer.add_page(page)
        
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
            
            img = Image.open(temp_path)
            img_width, img_height = img.size
            scale = min(width / img_width, height / img_height)
            
            new_width = img_width * scale * 0.9
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
        
        for page in reader.pages:
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
        
        c = canvas.Canvas(str(watermark_path), pagesize=letter)
        c.setFont("Helvetica", 60)
        c.setFillAlpha(float(opacity))
        c.setFillColorRGB(0.5, 0.5, 0.5)
        
        c.saveState()
        c.translate(300, 400)
        c.rotate(45)
        c.drawCentredString(0, 0, watermark_text)
        c.restoreState()
        c.save()
        
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
# NEW FEATURE A: TEXT ANALYSIS
# ===================================

@app.post("/api/analyze-text")
async def analyze_text(files: List[UploadFile] = File(...)):
    """Analyze PDF text - keyword search, word count, spell check"""
    if len(files) != 1:
        raise HTTPException(status_code=400, detail="Only one file allowed")
    
    file = files[0]
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    temp_path = UPLOAD_DIR / file.filename
    
    try:
        save_upload_file(file, temp_path)
        
        # Extract all text
        all_text = []
        with pdfplumber.open(str(temp_path)) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                text = page.extract_text()
                if text:
                    all_text.append({
                        "page": page_num,
                        "text": text
                    })
        
        # Combine all text
        combined_text = " ".join([p["text"] for p in all_text])
        
        # Word count
        words = re.findall(r'\b\w+\b', combined_text.lower())
        total_words = len(words)
        word_freq = Counter(words)
        top_keywords = word_freq.most_common(20)
        
        # Spell check
        typos = []
        if SPELL_CHECKER_AVAILABLE:
            spell = SpellChecker()
            unique_words = set(words)
            misspelled = spell.unknown(unique_words)
            
            for word in list(misspelled)[:50]:  # Limit to 50 typos
                suggestions = spell.candidates(word)
                if suggestions:
                    typos.append({
                        "incorrect": word,
                        "suggestions": list(suggestions)[:3]
                    })
        
        return JSONResponse({
            "total_words": total_words,
            "unique_words": len(set(words)),
            "top_keywords": [{"word": word, "count": count} for word, count in top_keywords],
            "typos": typos,
            "pages": len(all_text),
            "spell_checker_available": SPELL_CHECKER_AVAILABLE
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        cleanup_files(temp_path)


@app.post("/api/search-keyword")
async def search_keyword(
    files: List[UploadFile] = File(...),
    keyword: str = Form(...)
):
    """Search for keyword in PDF"""
    if len(files) != 1:
        raise HTTPException(status_code=400, detail="Only one file allowed")
    
    file = files[0]
    temp_path = UPLOAD_DIR / file.filename
    
    try:
        save_upload_file(file, temp_path)
        
        results = []
        with pdfplumber.open(str(temp_path)) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                text = page.extract_text()
                if text and keyword.lower() in text.lower():
                    # Find all occurrences
                    lines = text.split('\n')
                    for line_num, line in enumerate(lines, 1):
                        if keyword.lower() in line.lower():
                            results.append({
                                "page": page_num,
                                "line": line_num,
                                "context": line.strip()
                            })
        
        return JSONResponse({
            "keyword": keyword,
            "total_matches": len(results),
            "results": results[:100]  # Limit to 100 results
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        cleanup_files(temp_path)


# ===================================
# NEW FEATURE B: TEXT DECORATION
# ===================================

@app.post("/api/edit-text-style")
async def edit_text_style(
    files: List[UploadFile] = File(...),
    text_content: str = Form(...),
    font_size: int = Form(default=12),
    font_color: str = Form(default="#000000"),
    font_family: str = Form(default="Helvetica"),
    highlight_color: str = Form(default=""),
    page_size: str = Form(default="A4")
):
    """Create new PDF with styled text"""
    if len(files) > 0:
        # If file provided, extract text first
        file = files[0]
        temp_path = UPLOAD_DIR / file.filename
        save_upload_file(file, temp_path)
        
        try:
            with pdfplumber.open(str(temp_path)) as pdf:
                extracted_text = []
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        extracted_text.append(text)
                text_content = "\n\n".join(extracted_text)
        finally:
            cleanup_files(temp_path)
    
    output_path = OUTPUT_DIR / f"styled_{os.urandom(8).hex()}.pdf"
    
    try:
        # Page size
        page_sizes_map = {"A4": A4, "Letter": letter, "Legal": legal}
        size = page_sizes_map.get(page_size, A4)
        
        # Create PDF
        c = canvas.Canvas(str(output_path), pagesize=size)
        width, height = size
        
        # Set font
        font_map = {
            "Helvetica": "Helvetica",
            "Times": "Times-Roman",
            "Courier": "Courier",
            "Arial": "Helvetica",  # Fallback
        }
        selected_font = font_map.get(font_family, "Helvetica")
        c.setFont(selected_font, font_size)
        
        # Set text color
        try:
            color = HexColor(font_color)
            c.setFillColor(color)
        except:
            c.setFillColorRGB(0, 0, 0)
        
        # Add highlight background if specified
        y_position = height - 50
        margin = 50
        line_height = font_size * 1.5
        
        lines = text_content.split('\n')
        for line in lines:
            if y_position < 50:  # New page
                c.showPage()
                c.setFont(selected_font, font_size)
                try:
                    c.setFillColor(HexColor(font_color))
                except:
                    c.setFillColorRGB(0, 0, 0)
                y_position = height - 50
            
            # Draw highlight if specified
            if highlight_color:
                try:
                    c.setFillColor(HexColor(highlight_color))
                    c.rect(margin - 5, y_position - 5, width - 2 * margin + 10, line_height, fill=1, stroke=0)
                    c.setFillColor(HexColor(font_color))
                except:
                    pass
            
            c.drawString(margin, y_position, line[:100])  # Limit line length
            y_position -= line_height
        
        c.save()
        
        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename=f"styled_{os.path.basename(output_path)}"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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