const state = {
    currentTool: null,
    uploadedFiles: [],
    theme: localStorage.getItem('theme') || 'dark'
};
const toolConfigs = {
    merge: {
        title: 'Merge PDFs',
        description: 'Combine multiple PDF files into a single document',
        endpoint: '/api/merge',
        acceptFiles: '.pdf',
        multiple: true,
        options: []
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
                placeholder: 'Enter password (min 6 characters)',
                required: true
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
        description: 'Add text watermarks to your PDF',
        endpoint: '/api/watermark',
        acceptFiles: '.pdf',
        multiple: false,
        options: [
            {
                type: 'text',
                name: 'watermark_text',
                label: 'Watermark Text',
                placeholder: 'CONFIDENTIAL',
                required: true
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
    },
    'analyze-text': {
        title: 'Text Analysis',
        description: 'Analyze PDF text for word count, keywords, and spelling',
        endpoint: '/api/analyze-text',
        acceptFiles: '.pdf',
        multiple: false,
        options: [],
        showResults: true
    },
    'text-decoration': {
        title: 'Style Text',
        description: 'Create a PDF with custom styled text',
        endpoint: '/api/edit-text-style',
        acceptFiles: '.pdf',
        multiple: false,
        optional: true,
        options: [
            {
                type: 'textarea',
                name: 'text_content',
                label: 'Text Content',
                placeholder: 'Enter text or upload a PDF to extract and style text',
                required: false
            },
            {
                type: 'number',
                name: 'font_size',
                label: 'Font Size',
                min: '8',
                max: '72',
                default: '12'
            },
            {
                type: 'select',
                name: 'font_family',
                label: 'Font Family',
                options: [
                    { value: 'Helvetica', label: 'Helvetica' },
                    { value: 'Times', label: 'Times New Roman' },
                    { value: 'Courier', label: 'Courier' }
                ]
            },
            {
                type: 'color',
                name: 'font_color',
                label: 'Text Color',
                default: '#000000'
            },
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
    }
};


const elements = {
    modal: document.getElementById('toolModal'),
    modalClose: document.getElementById('modalClose'),
    modalTitle: document.getElementById('modalTitle'),
    modalDescription: document.getElementById('modalDescription'),
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    fileList: document.getElementById('fileList'),
    toolOptions: document.getElementById('toolOptions'),
    resultsDisplay: document.getElementById('resultsDisplay'),
    progressContainer: document.getElementById('progressContainer'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    processBtn: document.getElementById('processBtn'),
    themeToggle: document.getElementById('themeToggle'),
    toastContainer: document.getElementById('toastContainer')
};


document.addEventListener('DOMContentLoaded', () => {
    console.log('Available tools:', Object.keys(toolConfigs));
    console.log('Tool cards in HTML:', Array.from(document.querySelectorAll('.tool-card')).map(c => c.getAttribute('data-tool')));
    
    initTheme();
    initToolCards();
    initModal();
    initUploadArea();
    initThemeToggle();
});


function initTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
}

function initThemeToggle() {
    elements.themeToggle.addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', state.theme);
        document.documentElement.setAttribute('data-theme', state.theme);
        elements.themeToggle.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            elements.themeToggle.style.transform = 'rotate(0deg)';
        }, 300);
    });
}


function initToolCards() {
    const toolCards = document.querySelectorAll('.tool-card');
    toolCards.forEach(card => {
        card.addEventListener('click', () => {
            const tool = card.getAttribute('data-tool');
            console.log('Tool clicked:', tool);
            console.log('Config exists:', !!toolConfigs[tool]);
            if (toolConfigs[tool]) {
                openModal(tool);
            } else {
                console.error('Tool config not found for:', tool);
                showToast('Tool not available yet', 'warning');
            }
        });
    });
}

function initModal() {
    elements.modalClose.addEventListener('click', closeModal);
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.modal.classList.contains('active')) {
            closeModal();
        }
    });
    elements.processBtn.addEventListener('click', processFiles);
}

function openModal(tool) {
    if (!toolConfigs[tool]) {
        console.error('Cannot open modal - tool config not found:', tool);
        showToast('Tool configuration not found', 'error');
        return;
    }
    state.currentTool = tool;
    state.uploadedFiles = [];
    
    const config = toolConfigs[tool];
    elements.modalTitle.textContent = config.title;
    elements.modalDescription.textContent = config.description;
    elements.fileInput.setAttribute('accept', config.acceptFiles);
    elements.fileInput.multiple = config.multiple;
    elements.fileList.innerHTML = '';
    elements.toolOptions.innerHTML = '';
    elements.resultsDisplay.innerHTML = '';
    elements.resultsDisplay.style.display = 'none';
    elements.progressContainer.style.display = 'none';
    if (config.showResults) {
        elements.processBtn.querySelector('span').textContent = 'Analyze';
    } else {
        elements.processBtn.querySelector('span').textContent = 'Process';
    }
    renderToolOptions(config.options);
    elements.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    elements.modal.classList.remove('active');
    document.body.style.overflow = '';
    state.uploadedFiles = [];
}
function initUploadArea() {
    elements.uploadArea.addEventListener('click', () => {
        elements.fileInput.click();
    });
    elements.uploadArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            elements.fileInput.click();
        }
    });
    elements.fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
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
        showToast('Please select only one file', 'warning');
        files = [files[0]];
    }
    if (!config.multiple) {
        state.uploadedFiles = [];
    }
    state.uploadedFiles.push(...Array.from(files));
    renderFileList();
}
function renderFileList() {
    elements.fileList.innerHTML = '';
    state.uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.setAttribute('role', 'listitem');
        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                </div>
                <div class="file-details">
                    <h4>${file.name}</h4>
                    <p>${formatFileSize(file.size)}</p>
                </div>
            </div>
            <button class="file-remove" data-index="${index}" aria-label="Remove ${file.name}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
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

function renderToolOptions(options) {
    if (!options || options.length === 0) return;
    options.forEach(option => {
        const optionGroup = document.createElement('div');
        optionGroup.className = 'option-group';
        const label = document.createElement('label');
        label.textContent = option.label;
        label.setAttribute('for', option.name);
        optionGroup.appendChild(label);
        let input;
        
        if (option.type === 'select') {
            input = document.createElement('select');
            input.name = option.name;
            input.id = option.name;
            
            option.options.forEach(opt => {
                const optionElement = document.createElement('option');
                optionElement.value = opt.value;
                optionElement.textContent = opt.label;
                input.appendChild(optionElement);
            });
        } else if (option.type === 'textarea') {
            input = document.createElement('textarea');
            input.name = option.name;
            input.id = option.name;
            input.placeholder = option.placeholder || '';
            input.required = option.required || false;
        } else if (option.type === 'number') {
            input = document.createElement('input');
            input.type = 'number';
            input.name = option.name;
            input.id = option.name;
            input.min = option.min;
            input.max = option.max;
            input.value = option.default || '';
        } else if (option.type === 'color') {
            input = document.createElement('input');
            input.type = 'color';
            input.name = option.name;
            input.id = option.name;
            input.value = option.default || '#000000';
        } else {
            input = document.createElement('input');
            input.type = option.type;
            input.name = option.name;
            input.id = option.name;
            input.placeholder = option.placeholder || '';
            input.required = option.required || false;
        }
        
        optionGroup.appendChild(input);
        elements.toolOptions.appendChild(optionGroup);
    });
}

function getToolOptions() {
    const options = {};
    const inputs = elements.toolOptions.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        options[input.name] = input.value;
    });
    
    return options;
}

// ===================================
// FILE PROCESSING
// ===================================

async function processFiles() {
    const config = toolConfigs[state.currentTool];
    
    // Special validation for text-decoration tool
    if (state.currentTool === 'text-decoration') {
        const textContent = document.getElementById('text_content');
        if (state.uploadedFiles.length === 0 && (!textContent || !textContent.value.trim())) {
            showToast('Please upload a PDF or enter text content', 'warning');
            return;
        }
    } else {
        // Validate files (unless optional)
        if (state.uploadedFiles.length === 0 && !config.optional) {
            showToast('Please upload at least one file', 'warning');
            return;
        }
    }
    
    const options = getToolOptions();
    
    // Validate required options
    let valid = true;
    if (config.options) {
        config.options.forEach(option => {
            if (option.required) {
                const value = options[option.name];
                if (!value || value.trim() === '') {
                    showToast(`${option.label} is required`, 'warning');
                    valid = false;
                }
            }
        });
    }
    
    if (!valid) return;
    
    // Validate passwords if encrypting
    if (state.currentTool === 'encrypt') {
        if (options.password.length < 6) {
            showToast('Password must be at least 6 characters', 'warning');
            return;
        }
    }
    
    // Show progress
    elements.progressContainer.style.display = 'block';
    elements.progressFill.style.width = '0%';
    elements.progressFill.classList.add('indeterminate');
    elements.processBtn.disabled = true;
    elements.processBtn.classList.add('loading');
    
    try {
        const formData = new FormData();
        
        // Add files
        state.uploadedFiles.forEach((file) => {
            formData.append('files', file);
        });
        
        // Add options
        Object.keys(options).forEach(key => {
            if (options[key]) {
                formData.append(key, options[key]);
            }
        });
        
        const response = await fetch(config.endpoint, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Processing failed' }));
            throw new Error(error.detail || 'Processing failed');
        }
        
        // Handle different response types
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            // JSON response (for analysis)
            const data = await response.json();
            displayResults(data);
            elements.progressFill.style.width = '100%';
            showToast('Analysis complete!', 'success');
        } else {
            // File download response
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = getDownloadFilename(response);
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            elements.progressFill.style.width = '100%';
            showToast('Processing complete! File downloaded.', 'success');
            
            setTimeout(() => {
                closeModal();
            }, 1500);
        }
        
    } catch (error) {
        console.error('Error:', error);
        showToast(error.message || 'An error occurred. Please try again.', 'error');
    } finally {
        elements.processBtn.disabled = false;
        elements.processBtn.classList.remove('loading');
        elements.progressFill.classList.remove('indeterminate');
        setTimeout(() => {
            if (!elements.resultsDisplay.style.display || elements.resultsDisplay.style.display === 'none') {
                elements.progressContainer.style.display = 'none';
            }
        }, 1000);
    }
}

function getDownloadFilename(response) {
    const disposition = response.headers.get('content-disposition');
    if (disposition) {
        const match = disposition.match(/filename="?(.+)"?/);
        if (match) return match[1];
    }
    
    const tool = state.currentTool;
    const timestamp = new Date().getTime();
    
    switch (tool) {
        case 'merge':
            return `merged_${timestamp}.pdf`;
        case 'compress':
            return `compressed_${timestamp}.pdf`;
        case 'encrypt':
            return `encrypted_${timestamp}.pdf`;
        case 'pdf-to-text':
            return `extracted_text_${timestamp}.txt`;
        case 'img-to-pdf':
            return `converted_${timestamp}.pdf`;
        case 'rotate':
            return `rotated_${timestamp}.pdf`;
        case 'watermark':
            return `watermarked_${timestamp}.pdf`;
        case 'text-decoration':
            return `styled_${timestamp}.pdf`;
        default:
            return `output_${timestamp}.pdf`;
    }
}

// ===================================
// RESULTS DISPLAY
// ===================================

function displayResults(data) {
    elements.resultsDisplay.innerHTML = '';
    elements.resultsDisplay.style.display = 'block';
    
    const title = document.createElement('h3');
    title.textContent = 'Analysis Results';
    elements.resultsDisplay.appendChild(title);
    
    // Stats
    if (data.total_words !== undefined) {
        const statGrid = document.createElement('div');
        statGrid.className = 'stat-grid';
        
        const stats = [
            { label: 'Total Words', value: data.total_words },
            { label: 'Unique Words', value: data.unique_words },
            { label: 'Pages', value: data.pages }
        ];
        
        stats.forEach(stat => {
            const statCard = document.createElement('div');
            statCard.className = 'stat-card';
            statCard.innerHTML = `
                <span class="stat-value">${stat.value.toLocaleString()}</span>
                <span class="stat-label">${stat.label}</span>
            `;
            statGrid.appendChild(statCard);
        });
        
        elements.resultsDisplay.appendChild(statGrid);
    }
    
    // Top Keywords
    if (data.top_keywords && data.top_keywords.length > 0) {
        const keywordsSection = document.createElement('div');
        keywordsSection.className = 'keyword-list';
        
        const keywordsTitle = document.createElement('h4');
        keywordsTitle.textContent = 'Top Keywords';
        keywordsTitle.style.marginBottom = 'var(--spacing-md)';
        keywordsSection.appendChild(keywordsTitle);
        
        data.top_keywords.slice(0, 10).forEach(item => {
            const keywordItem = document.createElement('div');
            keywordItem.className = 'keyword-item';
            keywordItem.innerHTML = `
                <span class="keyword">${item.word}</span>
                <span class="count">${item.count}</span>
            `;
            keywordsSection.appendChild(keywordItem);
        });
        
        elements.resultsDisplay.appendChild(keywordsSection);
    }
    
    // Typos
    if (data.typos && data.typos.length > 0) {
        const typosSection = document.createElement('div');
        typosSection.className = 'typo-list';
        
        const typosTitle = document.createElement('h4');
        typosTitle.textContent = 'Potential Spelling Issues';
        typosTitle.style.marginBottom = 'var(--spacing-md)';
        typosSection.appendChild(typosTitle);
        
        data.typos.slice(0, 20).forEach(typo => {
            const typoItem = document.createElement('div');
            typoItem.className = 'typo-item';
            typoItem.innerHTML = `
                <span class="incorrect">${typo.incorrect}</span>
                <span class="suggestions">Suggestions: ${typo.suggestions.join(', ')}</span>
            `;
            typosSection.appendChild(typoItem);
        });
        
        elements.resultsDisplay.appendChild(typosSection);
    } else if (data.spell_checker_available === false) {
        const notice = document.createElement('p');
        notice.className = 'text-muted';
        notice.style.marginTop = 'var(--spacing-md)';
        notice.textContent = 'Spell checker not available. Install pyspellchecker for spell checking features.';
        elements.resultsDisplay.appendChild(notice);
    }
}

// ===================================
// TOAST NOTIFICATIONS
// ===================================

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = getToastIcon(type);
    
    toast.innerHTML = `
        ${icon}
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastSlideIn 0.3s ease reverse';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

function getToastIcon(type) {
    const icons = {
        success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
        error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    return icons[type] || icons.info;
}