# PDF Tools Pro

<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=32&duration=2800&pause=2000&color=6366F1&center=true&vCenter=true&width=940&lines=PDF+Tools+Pro;Advanced+PDF+Manipulation+Platform;Built+with+FastAPI+%2B+Python" alt="Typing SVG" />

<br/>

![PDF Tools Pro](https://img.shields.io/badge/PDF%20Tools-Pro-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE0IDJINmEyIDIgMCAwIDAtMiAydjE2YTIgMiAwIDAgMCAyIDJoMTJhMiAyIDAgMCAwIDItMlY4eiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjxwb2x5bGluZSBwb2ludHM9IjE0IDIgMTQgOCAyMCA4IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge&logo=opensourceinitiative&logoColor=white)
![Stars](https://img.shields.io/github/stars/amirsakib16/PDF_Manager?style=for-the-badge&logo=github&color=gold)
![Forks](https://img.shields.io/github/forks/amirsakib16/PDF_Manager?style=for-the-badge&logo=github&color=blue)

<br/>

** A powerful, modern web application for comprehensive PDF manipulation with advanced text analysis and styling capabilities.**

<br/>

<p align="center">
  <a href="https://pdf-manager-3-x2dh.onrender.com/">
    <img src="https://img.shields.io/badge/🌐_Live_Demo-6366f1?style=for-the-badge&logoColor=white" alt="Live Demo" height="50"/>
  </a>
  <a href="#features">
    <img src="https://img.shields.io/badge/📖_Documentation-4f46e5?style=for-the-badge&logoColor=white" alt="Documentation" height="50"/>
  </a>
  <a href="../../issues">
    <img src="https://img.shields.io/badge/🐛_Report_Bug-ef4444?style=for-the-badge&logoColor=white" alt="Report Bug" height="50"/>
  </a>
  <a href="../../issues">
    <img src="https://img.shields.io/badge/✨_Request_Feature-10b981?style=for-the-badge&logoColor=white" alt="Request Feature" height="50"/>
  </a>
</p>

<br/>

```ascii
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ██████╗ ██████╗ ███████╗    ████████╗ ██████╗  ██████╗  │
│   ██╔══██╗██╔══██╗██╔════╝    ╚══██╔══╝██╔═══██╗██╔═══██╗ │
│   ██████╔╝██║  ██║█████╗         ██║   ██║   ██║██║   ██║ │
│   ██╔═══╝ ██║  ██║██╔══╝         ██║   ██║   ██║██║   ██║ │
│   ██║     ██████╔╝██║            ██║   ╚██████╔╝╚██████╔╝ │
│   ╚═╝     ╚═════╝ ╚═╝            ╚═╝    ╚═════╝  ╚═════╝  │
│                                                             │
│               Professional PDF Manipulation Suite           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif">

</div>




---

## Features

### **Core PDF Operations**
- **Merge PDFs** - Combine multiple PDF files into one document
- **Compress PDF** - Reduce file size with quality control (High/Medium/Low)
- **Encrypt PDF** - Add password protection to secure documents
- **PDF to Text** - Extract all text content from PDFs
- **Image to PDF** - Convert JPG, PNG images to PDF format
- **Rotate PDF** - Rotate pages 90°, 180°, or 270°
- **Add Watermark** - Apply text watermarks with custom opacity
- **Word Count** - Get total words, unique words, and top keywords
- **Typo Detection** - Automatically detect spelling errors
- **Smart Suggestions** - Get up to 3 correction suggestions per typo
- **Frequency Analysis** - View top 20 most common keywords
- **Font Size** - Adjust from 8-72 points
- **Font Color** - Full color picker with hex support
- **Font Family** - Choose from Helvetica, Times, Courier
- **Page Size** - Support for A4, Letter, Legal formats

---
> **Note:** First load may take 30-60 seconds (free tier spin-up time)
---

## Tech Stack

### **Backend**
- **FastAPI** - Modern, fast Python web framework with async support
- **pypdf** - PDF manipulation and processing
- **pdfplumber** - Advanced text extraction
- **ReportLab** - PDF generation with styling
- **pyspellchecker** - Intelligent typo detection
- **Pillow** - Image processing

### **Frontend**
- **Pure HTML5** - Semantic, accessible markup
- **Advanced CSS3** - Custom animations, gradients, dark mode
- **Vanilla JavaScript** - Zero dependencies, lightweight
- **Responsive Design** - Works on mobile, tablet, and desktop

### **Deployment**
- **Render** - Automatic deployments from GitHub
- **Gunicorn + Uvicorn** - Production-ready ASGI server
- **Docker** - Containerization support

---

## Installation

### **Prerequisites**
- Python 3.11 or higher
- pip package manager
- Git

### **Quick Start**

1. **Clone the repository**
```bash
git clone https://github.com/amirsakib16/PDF_Manager.git
cd PDF_Manager
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Run the application**
```bash
python app.py
```

5. **Open in browser**
```
http://localhost:8000
```
---


##  Usage Guide

### **Merge PDFs**
1. Click "Merge PDFs"
2. Upload 2+ PDF files
3. Click "Process"
4. Download merged PDF

### **Text Analysis**
1. Click "Text Analysis"
2. Upload a PDF
3. Click "Analyze"
4. View:
   - Total word count
   - Top keywords with frequency
   - Detected typos with suggestions

### **Style Editor**
1. Click "Style Editor"
2. Upload PDF or enter text manually
3. Customize:
   - Font size, color, family
   - Optional highlight color
   - Page size
4. Click "Process"
5. Download styled PDF


---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Main interface |
| `/api/merge` | POST | Merge multiple PDFs |
| `/api/compress` | POST | Compress PDF file |
| `/api/encrypt` | POST | Encrypt with password |
| `/api/pdf-to-text` | POST | Extract text content |
| `/api/img-to-pdf` | POST | Convert images to PDF |
| `/api/rotate` | POST | Rotate PDF pages |
| `/api/watermark` | POST | Add watermark |
| `/api/analyze-text` | POST | Analyze text (word count, typos) |
| `/api/edit-text-style` | POST | Create styled PDF |
| `/api/health` | GET | Health check |

---

## Security Features

- ✅ **File Validation** - Type and size checking
- ✅ **Automatic Cleanup** - Temporary files deleted after processing
- ✅ **Password Encryption** - Secure PDF encryption
- ✅ **No Storage** - Files processed in memory, not stored
- ✅ **Rate Limiting** - Protection against abuse (configurable)

---

## Performance

- **Fast Processing** - Async operations with FastAPI
- **Optimized Assets** - Minified CSS/JS
- **Efficient Memory** - Stream processing for large files
- **Auto Scaling** - Handles multiple concurrent users

---


### **Development Setup**
```bash
# Install dev dependencies
pip install -r requirements.txt

# Run tests
pytest

# Format code
black app.py

# Lint code
flake8 app.py
```

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **FastAPI** - Amazing web framework
- **pypdf** - PDF manipulation library
- **ReportLab** - PDF generation
- **pyspellchecker** - Spell checking capabilities
- **Render** - Easy deployment platform

---

##  Roadmap

### **Planned Features**
- [ ] Batch processing (10+ files at once)
- [ ] Cloud storage integration (Google Drive, Dropbox)
- [ ] PDF form filling
- [ ] Digital signatures
- [ ] PDF comparison tool
- [ ] Multi-language UI support
- [ ] API rate limiting dashboard
- [ ] User accounts and history



