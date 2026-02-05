// ===================================
// STATE MANAGEMENT
// ===================================

const state = {
    currentTool: null,
    uploadedFiles: [],
    theme: localStorage.getItem('theme') || 'dark'
};

// ===================================
// TOOL CONFIGURATIONS
// ===================================

const toolConfigs = {
    merge: {
        title: 'Merge PDFs',
        description: 'Combine multiple PDF files into a single document',
        endpoint: '/api/merge',
        acceptFiles: '.pdf',
        multiple: true,
        options: []
    },
    split: {
        title: 'Split PDF',
        description: 'Extract specific pages or split into multiple files',
        endpoint: '/api/split',
        acceptFiles: '.pdf',
        multiple: false,
        options: [
            {
                type: 'text',
                name: 'pages',
                label: 'Pages to extract (e.g., 1-3,5,7-10)',
                placeholder: '1-3,5,7-10'
            }
        ]
    },
    compress: {
        title: 'Compress PDF',
        description: 'Reduce file size while maintaining quality',
        endpoint: '/api/compress',
        acceptFiles: '.pdf',
        multiple: false,
        options: [
            {
                type: 'select',
                name: 'quality',
                label: 'Compression Quality',
                options: [
                    { value: 'high', label: 'High Quality (Minimal Compression)' },
                    { value: 'medium', label: 'Medium Quality (Balanced)' },
                    { value: 'low', label: 'Low Quality (Maximum Compression)' }
                ]
            }
        ]
    },
    encrypt: {
        title: 'Encrypt PDF',
        description: 'Add password protection to your document',
        endpoint: '/api/encrypt',
        acceptFiles: '.pdf',
        multiple: false,
        options: [
            {
                type: 'password',
                name: 'password',
                label: 'Password',
                placeholder: 'Enter password'
            },
            {
                type: 'password',
                name: 'confirm_password',
                label: 'Confirm Password',
                placeholder: 'Re-enter password'
            }
        ]
    },
    'pdf-to-text': {
        title: 'PDF to Text',
        description: 'Extract all text content from PDF',
        endpoint: '/api/pdf-to-text',
        acceptFiles: '.pdf',
        multiple: false,
        options: []
    },
    ocr: {
        title: 'OCR Scanner',
        description: 'Extract text from scanned documents and images',
        endpoint: '/api/ocr',
        acceptFiles: '.pdf,image/*',
        multiple: false,
        options: [
            {
                type: 'select',
                name: 'language',
                label: 'Language',
                options: [
                    { value: 'eng', label: 'English' },
                    { value: 'spa', label: 'Spanish' },
                    { value: 'fra', label: 'French' },
                    { value: 'deu', label: 'German' },
                    { value: 'chi_sim', label: 'Chinese (Simplified)' }
                ]
            }
        ]
    },
    'img-to-pdf': {
        title: 'Image to PDF',
        description: 'Convert images to PDF documents',
        endpoint: '/api/img-to-pdf',
        acceptFiles: 'image/*',
        multiple: true,
        options: [
            {
                type: 'select',
                name: 'page_size',
                label: 'Page Size',
                options: [
                    { value: 'A4', label: 'A4' },
                    { value: 'Letter', label: 'Letter' },
                    { value: 'Legal', label: 'Legal' }
                ]
            }
        ]
    },
    rotate: {
        title: 'Rotate PDF',
        description: 'Rotate pages clockwise or counterclockwise',
        endpoint: '/api/rotate',
        acceptFiles: '.pdf',
        multiple: false,
        options: [
            {
                type: 'select',
                name: 'rotation',
                label: 'Rotation',
                options: [
                    { value: '90', label: '90° Clockwise' },
                    { value: '180', label: '180°' },
                    { value: '270', label: '270° Clockwise (90° Counter)' }
                ]
            },
            {
                type: 'text',
                name: 'pages',
                label: 'Pages (leave empty for all)',
                placeholder: 'e.g., 1-3,5'
            }
        ]
    },
    watermark: {
        title: 'Add Watermark',
        description: 'Add text or image watermarks to your PDF',
        endpoint: '/api/watermark',
        acceptFiles: '.pdf',
        multiple: false,
        options: [
            {
                type: 'text',
                name: 'watermark_text',
                label: 'Watermark Text',
                placeholder: 'CONFIDENTIAL'
            },
            {
                type: 'select',
                name: 'opacity',
                label: 'Opacity',
                options: [
                    { value: '0.2', label: '20%' },
                    { value: '0.4', label: '40%' },
                    { value: '0.6', label: '60%' },
                    { value: '0.8', label: '80%' }
                ]
            }
        ]
    }
};

// ===================================
// DOM ELEMENTS
// ===================================

const elements = {
    modal: document.getElementById('toolModal'),
    modalClose: document.getElementById('modalClose'),
    modalTitle: document.getElementById('modalTitle'),
    modalDescription: document.getElementById('modalDescription'),
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    fileList: document.getElementById('fileList'),
    toolOptions: document.getElementById('toolOptions'),
    progressContainer: document.getElementById('progressContainer'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    processBtn: document.getElementById('processBtn'),
    themeToggle: document.getElementById('themeToggle'),
    toastContainer: document.getElementById('toastContainer')
};

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initToolCards();
    initModal();
    initUploadArea();
    initThemeToggle();
});

// ===================================
// THEME MANAGEMENT
// ===================================

function initTheme() {
    document.body.setAttribute('data-theme', state.theme);
}

function initThemeToggle() {
    elements.themeToggle.addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', state.theme);
        document.body.setAttribute('data-theme', state.theme);
        
        // Animate toggle
        elements.themeToggle.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            elements.themeToggle.style.transform = 'rotate(0deg)';
        }, 300);
    });
}

// ===================================
// TOOL CARDS
// ===================================

function initToolCards() {
    const toolCards = document.querySelectorAll('.tool-card');
    toolCards.forEach(card => {
        card.addEventListener('click', () => {
            const tool = card.getAttribute('data-tool');
            openModal(tool);
        });
    });
}

// ===================================
// MODAL MANAGEMENT
// ===================================

function initModal() {
    elements.modalClose.addEventListener('click', closeModal);
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) closeModal();
    });
    
    elements.processBtn.addEventListener('click', processFiles);
}

function openModal(tool) {
    state.currentTool = tool;
    state.uploadedFiles = [];
    
    const config = toolConfigs[tool];
    
    // Update modal content
    elements.modalTitle.textContent = config.title;
    elements.modalDescription.textContent = config.description;
    
    // Update file input
    elements.fileInput.setAttribute('accept', config.acceptFiles);
    elements.fileInput.multiple = config.multiple;
    
    // Clear previous state
    elements.fileList.innerHTML = '';
    elements.toolOptions.innerHTML = '';
    elements.progressContainer.style.display = 'none';
    
    // Render tool options
    renderToolOptions(config.options);
    
    // Show modal
    elements.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    elements.modal.classList.remove('active');
    document.body.style.overflow = '';
    state.uploadedFiles = [];
}

// ===================================
// FILE UPLOAD
// ===================================

function initUploadArea() {
    elements.uploadArea.addEventListener('click', () => {
        elements.fileInput.click();
    });
    
    elements.fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
    
    // Drag and drop
    elements.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.add('dragover');
    });
    
    elements.uploadArea.addEventListener('dragleave', () => {
        elements.uploadArea.classList.remove('dragover');
    });
    
    elements.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
}

function handleFiles(files) {
    const config = toolConfigs[state.currentTool];
    
    if (!config.multiple && files.length > 1) {
        showToast('Please select only one file', 'error');
        return;
    }
    
    state.uploadedFiles = Array.from(files);
    renderFileList();
}

function renderFileList() {
    elements.fileList.innerHTML = '';
    
    state.uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                </div>
                <div class="file-details">
                    <h4>${file.name}</h4>
                    <p>${formatFileSize(file.size)}</p>
                </div>
            </div>
            <button class="file-remove" data-index="${index}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;
        
        fileItem.querySelector('.file-remove').addEventListener('click', () => {
            removeFile(index);
        });
        
        elements.fileList.appendChild(fileItem);
    });
}

function removeFile(index) {
    state.uploadedFiles.splice(index, 1);
    renderFileList();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ===================================
// TOOL OPTIONS
// ===================================

function renderToolOptions(options) {
    if (options.length === 0) return;
    
    options.forEach(option => {
        const optionGroup = document.createElement('div');
        optionGroup.className = 'option-group';
        
        const label = document.createElement('label');
        label.textContent = option.label;
        optionGroup.appendChild(label);
        
        if (option.type === 'select') {
            const select = document.createElement('select');
            select.name = option.name;
            
            option.options.forEach(opt => {
                const optionElement = document.createElement('option');
                optionElement.value = opt.value;
                optionElement.textContent = opt.label;
                select.appendChild(optionElement);
            });
            
            optionGroup.appendChild(select);
        } else {
            const input = document.createElement('input');
            input.type = option.type;
            input.name = option.name;
            input.placeholder = option.placeholder || '';
            optionGroup.appendChild(input);
        }
        
        elements.toolOptions.appendChild(optionGroup);
    });
}

function getToolOptions() {
    const options = {};
    const inputs = elements.toolOptions.querySelectorAll('input, select');
    
    inputs.forEach(input => {
        options[input.name] = input.value;
    });
    
    return options;
}

// ===================================
// FILE PROCESSING
// ===================================

async function processFiles() {
    if (state.uploadedFiles.length === 0) {
        showToast('Please upload at least one file', 'error');
        return;
    }
    
    const config = toolConfigs[state.currentTool];
    const options = getToolOptions();
    
    // Validate passwords if encrypting
    if (state.currentTool === 'encrypt') {
        if (options.password !== options.confirm_password) {
            showToast('Passwords do not match', 'error');
            return;
        }
        if (options.password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
    }
    
    // Show progress
    elements.progressContainer.style.display = 'block';
    elements.progressFill.style.width = '0%';
    elements.processBtn.disabled = true;
    elements.processBtn.classList.add('loading');
    
    try {
        const formData = new FormData();
        
        // Add files
        state.uploadedFiles.forEach((file, index) => {
            formData.append('files', file);
        });
        
        // Add options
        Object.keys(options).forEach(key => {
            formData.append(key, options[key]);
        });
        
        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            elements.progressFill.style.width = progress + '%';
        }, 200);
        
        const response = await fetch(config.endpoint, {
            method: 'POST',
            body: formData
        });
        
        clearInterval(progressInterval);
        elements.progressFill.style.width = '100%';
        
        if (!response.ok) {
            throw new Error('Processing failed');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = getDownloadFilename();
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast('Processing complete! File downloaded.', 'success');
        
        setTimeout(() => {
            closeModal();
        }, 1000);
        
    } catch (error) {
        console.error('Error:', error);
        showToast('An error occurred. Please try again.', 'error');
    } finally {
        elements.processBtn.disabled = false;
        elements.processBtn.classList.remove('loading');
        setTimeout(() => {
            elements.progressContainer.style.display = 'none';
        }, 1000);
    }
}

function getDownloadFilename() {
    const tool = state.currentTool;
    const timestamp = new Date().getTime();
    
    switch (tool) {
        case 'merge':
            return `merged_${timestamp}.pdf`;
        case 'split':
            return `split_${timestamp}.pdf`;
        case 'compress':
            return `compressed_${timestamp}.pdf`;
        case 'encrypt':
            return `encrypted_${timestamp}.pdf`;
        case 'pdf-to-text':
            return `extracted_text_${timestamp}.txt`;
        case 'ocr':
            return `ocr_text_${timestamp}.txt`;
        case 'img-to-pdf':
            return `converted_${timestamp}.pdf`;
        case 'rotate':
            return `rotated_${timestamp}.pdf`;
        case 'watermark':
            return `watermarked_${timestamp}.pdf`;
        default:
            return `output_${timestamp}.pdf`;
    }
}

// ===================================
// TOAST NOTIFICATIONS
// ===================================

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    
    toast.innerHTML = `
        <span style="font-size: 1.2rem; font-weight: bold;">${icon}</span>
        <span>${message}</span>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastSlideIn 0.3s ease reverse';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// ===================================
// KEYBOARD SHORTCUTS
// ===================================

document.addEventListener('keydown', (e) => {
    // Close modal on Escape
    if (e.key === 'Escape' && elements.modal.classList.contains('active')) {
        closeModal();
    }
});