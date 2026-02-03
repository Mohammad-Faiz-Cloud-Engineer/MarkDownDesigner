/**
 * MarkDown Designer — Professional Markdown Editor
 * Premium client-side markdown editor with designer themes and export capabilities
 */

(function () {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================

    const CONFIG = {
        autosaveInterval: 2000,
        debounceDelay: 150,
        storageKeys: {
            content: 'md-designer-content',
            theme: 'md-designer-theme',
            metadata: 'md-designer-metadata',
            sidebarState: 'md-designer-sidebar'
        },
        defaultContent: `# Welcome to MarkDown Designer

A premium, client-side markdown editor with **real-time preview** and designer themes.

## Features

- ✨ **Three Designer Themes**: Minimalist Light, Cyberpunk Dark, Swiss Design
- 📝 **Real-time Preview**: See your markdown rendered instantly
- 💾 **Auto-save**: Your work is automatically saved to local storage
- 📄 **Export Options**: PDF, HTML, and Markdown downloads

## Getting Started

Start typing in the editor on the left, and watch your markdown come to life on the right!

### Code Highlighting

\`\`\`javascript
function greet(name) {
    console.log(\`Hello, \${name}!\`);
    return true;
}
\`\`\`

### Tables

| Feature | Status |
|---------|--------|
| Markdown Parsing | ✅ Complete |
| Syntax Highlighting | ✅ Complete |
| PDF Export | ✅ Complete |
| HTML Export | ✅ Complete |

### Task Lists

- [x] Create beautiful UI
- [x] Implement three themes
- [x] Add export functionality
- [ ] Write more markdown!

---

> "The best way to predict the future is to invent it." — Alan Kay

Enjoy writing! 🚀
`
    };

    // ============================================
    // DOM ELEMENTS
    // ============================================

    const elements = {
        // Main elements
        editor: document.getElementById('editor'),
        preview: document.getElementById('preview'),
        charCount: document.getElementById('charCount'),

        // Sidebar
        sidebar: document.getElementById('sidebar'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        sidebarClose: document.getElementById('sidebarClose'),
        sidebarOverlay: document.getElementById('sidebarOverlay'),

        // Metadata inputs
        docTitle: document.getElementById('docTitle'),
        docAuthor: document.getElementById('docAuthor'),
        docDate: document.getElementById('docDate'),
        includeTitle: document.getElementById('includeTitle'),
        includeAuthor: document.getElementById('includeAuthor'),
        includeDate: document.getElementById('includeDate'),

        // Theme buttons
        themeButtons: document.querySelectorAll('.theme-btn'),

        // Export buttons
        exportPDF: document.getElementById('exportPDF'),
        exportHTML: document.getElementById('exportHTML'),
        exportMD: document.getElementById('exportMD'),

        // Mobile tabs
        mobileTabs: document.querySelectorAll('.mobile-tab'),
        editorPane: document.getElementById('editorPane'),
        previewPane: document.getElementById('previewPane'),

        // Resizer
        paneResizer: document.getElementById('paneResizer'),

        // Notifications
        toast: document.getElementById('toast'),
        toastMessage: document.getElementById('toastMessage'),
        loadingOverlay: document.getElementById('loadingOverlay'),

        // PDF Container
        pdfContainer: document.getElementById('pdfContainer')
    };

    // ============================================
    // STATE
    // ============================================

    let state = {
        isDragging: false,
        autosaveTimer: null,
        currentTheme: 'minimalist'
    };

    // ============================================
    // UTILITIES
    // ============================================

    /**
     * Debounce function to limit rapid calls
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Show toast notification
     */
    function showToast(message, duration = 3000) {
        elements.toastMessage.textContent = message;
        elements.toast.classList.add('show');
        setTimeout(() => {
            elements.toast.classList.remove('show');
        }, duration);
    }

    /**
     * Show/hide loading overlay
     */
    function setLoading(show) {
        if (show) {
            elements.loadingOverlay.classList.add('show');
        } else {
            elements.loadingOverlay.classList.remove('show');
        }
    }

    /**
     * Format date for display
     */
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Get sanitized filename from title
     */
    function getFilename(extension) {
        const title = elements.docTitle.value.trim() || 'untitled-document';
        const sanitized = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        return `${sanitized}.${extension}`;
    }

    // ============================================
    // MARKDOWN RENDERING
    // ============================================

    /**
     * Configure marked.js with GFM and custom renderer
     */
    function configureMarked() {
        marked.setOptions({
            gfm: true,
            breaks: true,
            headerIds: true,
            mangle: false,
            highlight: function (code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (e) {
                        console.warn('Highlight error:', e);
                    }
                }
                return hljs.highlightAuto(code).value;
            }
        });

        // Custom renderer for task lists
        const renderer = new marked.Renderer();

        renderer.listitem = function (text, task, checked) {
            if (task) {
                const checkbox = `<input type="checkbox" ${checked ? 'checked' : ''} disabled>`;
                return `<li class="task-list-item">${checkbox} <span>${text}</span></li>`;
            }
            return `<li>${text}</li>`;
        };

        renderer.list = function (body, ordered, start) {
            const type = ordered ? 'ol' : 'ul';
            const startAttr = ordered && start !== 1 ? ` start="${start}"` : '';
            const taskClass = body.includes('task-list-item') ? ' class="contains-task-list"' : '';
            return `<${type}${startAttr}${taskClass}>${body}</${type}>`;
        };

        marked.use({ renderer });
    }

    /**
     * Render markdown to preview pane
     */
    function renderPreview() {
        const content = elements.editor.value;

        if (!content.trim()) {
            elements.preview.innerHTML = `
                <div class="preview-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                    </svg>
                    <p>Your rendered markdown will appear here</p>
                </div>
            `;
            return;
        }

        try {
            const html = marked.parse(content);
            elements.preview.innerHTML = html;

            // Re-highlight code blocks
            elements.preview.querySelectorAll('pre code').forEach(block => {
                hljs.highlightElement(block);
            });
        } catch (error) {
            console.error('Markdown parsing error:', error);
            elements.preview.innerHTML = `<p style="color: var(--error);">Error parsing markdown</p>`;
        }

        // Update character count
        updateCharCount();
    }

    /**
     * Update character count display
     */
    function updateCharCount() {
        const count = elements.editor.value.length;
        const words = elements.editor.value.trim() ?
            elements.editor.value.trim().split(/\s+/).length : 0;
        elements.charCount.textContent = `${count.toLocaleString()} chars · ${words.toLocaleString()} words`;
    }

    // ============================================
    // THEME MANAGEMENT
    // ============================================

    /**
     * Switch theme
     */
    function switchTheme(themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
        state.currentTheme = themeName;

        // Update active button
        elements.themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === themeName);
        });

        // Save theme preference
        localStorage.setItem(CONFIG.storageKeys.theme, themeName);

        showToast(`Theme changed to ${themeName.charAt(0).toUpperCase() + themeName.slice(1)}`);
    }

    /**
     * Load saved theme
     */
    function loadTheme() {
        const saved = localStorage.getItem(CONFIG.storageKeys.theme);
        if (saved && ['minimalist', 'cyberpunk', 'swiss'].includes(saved)) {
            switchTheme(saved);
        }
    }

    // ============================================
    // SIDEBAR MANAGEMENT
    // ============================================

    /**
     * Toggle sidebar
     */
    function toggleSidebar(show) {
        const isOpen = elements.sidebar.classList.contains('open') ||
            !elements.sidebar.classList.contains('collapsed');

        if (show === undefined) {
            show = elements.sidebar.classList.contains('collapsed') ||
                !elements.sidebar.classList.contains('open');
        }

        if (window.innerWidth <= 768) {
            elements.sidebar.classList.toggle('open', show);
            elements.sidebarOverlay.classList.toggle('show', show);
            document.body.style.overflow = show ? 'hidden' : '';
        } else {
            elements.sidebar.classList.toggle('collapsed', !show);
        }

        localStorage.setItem(CONFIG.storageKeys.sidebarState, show ? 'open' : 'closed');
    }

    /**
     * Load sidebar state
     */
    function loadSidebarState() {
        if (window.innerWidth <= 768) {
            elements.sidebar.classList.remove('open');
            elements.sidebar.classList.add('collapsed');
        } else {
            const saved = localStorage.getItem(CONFIG.storageKeys.sidebarState);
            if (saved === 'closed') {
                elements.sidebar.classList.add('collapsed');
            }
        }
    }

    // ============================================
    // MOBILE TABS
    // ============================================

    /**
     * Switch mobile tab
     */
    function switchMobileTab(tab) {
        elements.mobileTabs.forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });

        elements.editorPane.classList.toggle('active', tab === 'editor');
        elements.previewPane.classList.toggle('active', tab === 'preview');
    }

    // ============================================
    // PANE RESIZER
    // ============================================

    /**
     * Initialize pane resizer
     */
    function initResizer() {
        elements.paneResizer.addEventListener('mousedown', startDragging);
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDragging);

        // Touch support
        elements.paneResizer.addEventListener('touchstart', startDragging);
        document.addEventListener('touchmove', onDrag);
        document.addEventListener('touchend', stopDragging);
    }

    function startDragging(e) {
        e.preventDefault();
        state.isDragging = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }

    function onDrag(e) {
        if (!state.isDragging) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const container = document.querySelector('.editor-container');
        const containerRect = container.getBoundingClientRect();
        const sidebarWidth = elements.sidebar.classList.contains('collapsed') ? 0 : 320;

        let percentage = ((clientX - containerRect.left) / containerRect.width) * 100;
        percentage = Math.max(25, Math.min(75, percentage));

        elements.editorPane.style.flex = `0 0 ${percentage}%`;
        elements.previewPane.style.flex = `0 0 ${100 - percentage}%`;
    }

    function stopDragging() {
        state.isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }

    // ============================================
    // LOCAL STORAGE
    // ============================================

    /**
     * Save content to localStorage
     */
    function saveContent() {
        const data = {
            content: elements.editor.value,
            timestamp: Date.now()
        };
        localStorage.setItem(CONFIG.storageKeys.content, JSON.stringify(data));
    }

    /**
     * Save metadata to localStorage
     */
    function saveMetadata() {
        const data = {
            title: elements.docTitle.value,
            author: elements.docAuthor.value,
            date: elements.docDate.value,
            includeTitle: elements.includeTitle.checked,
            includeAuthor: elements.includeAuthor.checked,
            includeDate: elements.includeDate.checked
        };
        localStorage.setItem(CONFIG.storageKeys.metadata, JSON.stringify(data));
    }

    /**
     * Load content from localStorage
     */
    function loadContent() {
        const saved = localStorage.getItem(CONFIG.storageKeys.content);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                elements.editor.value = data.content || '';
            } catch (e) {
                elements.editor.value = saved;
            }
        } else {
            elements.editor.value = CONFIG.defaultContent;
        }
        renderPreview();
    }

    /**
     * Load metadata from localStorage
     */
    function loadMetadata() {
        const saved = localStorage.getItem(CONFIG.storageKeys.metadata);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                elements.docTitle.value = data.title || '';
                elements.docAuthor.value = data.author || '';
                elements.docDate.value = data.date || '';
                elements.includeTitle.checked = data.includeTitle !== false;
                elements.includeAuthor.checked = data.includeAuthor !== false;
                elements.includeDate.checked = data.includeDate !== false;
            } catch (e) {
                console.warn('Error loading metadata:', e);
            }
        } else {
            // Set default date to today
            elements.docDate.value = new Date().toISOString().split('T')[0];
        }
    }

    /**
     * Start autosave timer
     */
    function startAutosave() {
        state.autosaveTimer = setInterval(() => {
            saveContent();
            saveMetadata();
        }, CONFIG.autosaveInterval);
    }

    // ============================================
    // EXPORT FUNCTIONS
    // ============================================

    /**
     * Build metadata header HTML for exports
     */
    function buildMetadataHeader() {
        const parts = [];

        if (elements.includeTitle.checked && elements.docTitle.value.trim()) {
            parts.push(`<h1 class="pdf-title">${escapeHtml(elements.docTitle.value.trim())}</h1>`);
        }

        const metaInfo = [];
        if (elements.includeAuthor.checked && elements.docAuthor.value.trim()) {
            metaInfo.push(`<span><strong>Author:</strong> ${escapeHtml(elements.docAuthor.value.trim())}</span>`);
        }
        if (elements.includeDate.checked && elements.docDate.value) {
            metaInfo.push(`<span><strong>Date:</strong> ${formatDate(elements.docDate.value)}</span>`);
        }

        if (parts.length || metaInfo.length) {
            return `
                <div class="pdf-metadata">
                    ${parts.join('')}
                    ${metaInfo.length ? `<div class="pdf-meta-info">${metaInfo.join('')}</div>` : ''}
                </div>
            `;
        }

        return '';
    }

    /**
     * Escape HTML for safe insertion
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Export as PDF with proper pagination for long content
     * Uses page-by-page rendering to handle unlimited content length
     */
    async function exportPDF() {
        setLoading(true);

        try {
            // Parse markdown content
            const markdownContent = elements.editor.value;
            const htmlContent = marked.parse(markdownContent);

            // A4 dimensions in mm
            const pageWidth = 210;
            const pageHeight = 297;
            const margin = 15;
            const contentWidth = pageWidth - (margin * 2); // 180mm
            const contentHeight = pageHeight - (margin * 2); // 267mm

            // Create a wrapper container with fixed A4 width
            const wrapper = document.createElement('div');
            wrapper.id = 'pdf-export-wrapper';
            wrapper.style.cssText = `
                position: absolute;
                left: -9999px;
                top: 0;
                width: ${contentWidth}mm;
                background: #ffffff;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-size: 11pt;
                line-height: 1.7;
                color: #1a1a1a;
            `;

            // Create the content container
            const pdfContent = document.createElement('div');
            pdfContent.className = 'pdf-content';
            pdfContent.innerHTML = buildMetadataHeader() + htmlContent;

            // Apply PDF-specific styles
            const style = document.createElement('style');
            style.textContent = `
                #pdf-export-wrapper {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
                }
                
                #pdf-export-wrapper * {
                    box-sizing: border-box;
                }
                
                #pdf-export-wrapper h1, 
                #pdf-export-wrapper h2, 
                #pdf-export-wrapper h3, 
                #pdf-export-wrapper h4, 
                #pdf-export-wrapper h5, 
                #pdf-export-wrapper h6 {
                    color: #000000;
                    font-weight: 700;
                    line-height: 1.4;
                    margin-top: 1em;
                    margin-bottom: 0.5em;
                }
                
                #pdf-export-wrapper h1:first-child { margin-top: 0; }
                
                #pdf-export-wrapper h1 { font-size: 20pt; border-bottom: 2px solid #e5e5e5; padding-bottom: 0.3em; }
                #pdf-export-wrapper h2 { font-size: 16pt; }
                #pdf-export-wrapper h3 { font-size: 13pt; }
                #pdf-export-wrapper h4 { font-size: 11pt; }
                #pdf-export-wrapper h5 { font-size: 10pt; }
                #pdf-export-wrapper h6 { font-size: 9pt; color: #666; }
                
                #pdf-export-wrapper p {
                    margin: 0 0 0.8em 0;
                    line-height: 1.7;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                }
                
                #pdf-export-wrapper a { color: #2563eb; text-decoration: none; }
                
                #pdf-export-wrapper ul, 
                #pdf-export-wrapper ol {
                    margin: 0 0 0.8em 0;
                    padding-left: 1.5em;
                }
                
                #pdf-export-wrapper li {
                    margin-bottom: 0.3em;
                    line-height: 1.6;
                }
                
                #pdf-export-wrapper .contains-task-list {
                    list-style: none;
                    padding-left: 0;
                }
                
                #pdf-export-wrapper .task-list-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5em;
                }
                
                #pdf-export-wrapper .task-list-item input[type="checkbox"] {
                    margin-top: 4px;
                    width: 14px;
                    height: 14px;
                }
                
                #pdf-export-wrapper blockquote {
                    margin: 0.8em 0;
                    padding: 0.6em 1em;
                    border-left: 3px solid #6b7280;
                    background: #f9fafb;
                    font-style: italic;
                    color: #4b5563;
                }
                
                #pdf-export-wrapper code {
                    font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
                    font-size: 0.85em;
                    padding: 0.1em 0.3em;
                    background: #f1f5f9;
                    border-radius: 3px;
                }
                
                #pdf-export-wrapper pre {
                    margin: 0.8em 0;
                    padding: 0.8em;
                    background: #1e293b;
                    color: #e2e8f0;
                    border-radius: 4px;
                    overflow-x: hidden;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    word-break: break-word;
                }
                
                #pdf-export-wrapper pre code {
                    background: transparent;
                    padding: 0;
                    color: inherit;
                    font-size: 9pt;
                    line-height: 1.5;
                }
                
                #pdf-export-wrapper table {
                    width: 100%;
                    margin: 0.8em 0;
                    border-collapse: collapse;
                    font-size: 9pt;
                }
                
                #pdf-export-wrapper th, 
                #pdf-export-wrapper td {
                    padding: 0.4em 0.6em;
                    text-align: left;
                    border: 1px solid #d1d5db;
                }
                
                #pdf-export-wrapper th {
                    background: #f3f4f6;
                    font-weight: 600;
                }
                
                #pdf-export-wrapper tr:nth-child(even) { background: #f9fafb; }
                
                #pdf-export-wrapper hr {
                    margin: 1em 0;
                    border: none;
                    height: 1px;
                    background: #e5e7eb;
                }
                
                #pdf-export-wrapper img {
                    max-width: 100%;
                    height: auto;
                    margin: 0.5em 0;
                }
                
                #pdf-export-wrapper .pdf-metadata {
                    margin-bottom: 1.2em;
                    padding-bottom: 0.8em;
                    border-bottom: 2px solid #e5e5e5;
                }
                
                #pdf-export-wrapper .pdf-metadata .pdf-title {
                    font-size: 22pt;
                    font-weight: 700;
                    color: #000;
                    margin: 0 0 0.3em 0;
                    padding: 0;
                    border: none;
                }
                
                #pdf-export-wrapper .pdf-metadata .pdf-meta-info {
                    font-size: 9pt;
                    color: #666;
                }
                
                #pdf-export-wrapper .pdf-metadata .pdf-meta-info span {
                    margin-right: 1.5em;
                }
            `;

            wrapper.appendChild(style);
            wrapper.appendChild(pdfContent);
            document.body.appendChild(wrapper);

            // Re-highlight code blocks
            wrapper.querySelectorAll('pre code').forEach(block => {
                hljs.highlightElement(block);
            });

            // Wait for fonts and images to load
            await new Promise(resolve => setTimeout(resolve, 500));

            // Use html2pdf with enhanced settings for long content
            const opt = {
                margin: [margin, margin, margin, margin],
                filename: getFilename('pdf'),
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    letterRendering: true,
                    allowTaint: true,
                    scrollX: 0,
                    scrollY: 0,
                    windowWidth: wrapper.scrollWidth,
                    windowHeight: wrapper.scrollHeight
                },
                jsPDF: {
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait',
                    compress: true
                },
                pagebreak: {
                    mode: ['css', 'legacy'],
                    before: '.page-break-before',
                    after: '.page-break-after'
                }
            };

            // Always use chunked approach for reliable complete text rendering
            await generatePDFChunked(wrapper, opt);

            // Clean up
            document.body.removeChild(wrapper);
            showToast('PDF exported successfully!');

        } catch (error) {
            console.error('PDF export error:', error);
            showToast('Error exporting PDF. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    /**
     * Generate PDF by rendering content in chunks to avoid canvas size limits
     * This approach renders visible chunks of the content separately
     */
    async function generatePDFChunked(wrapper, opt) {
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 15;
        const contentWidth = pageWidth - (margin * 2);
        const contentHeight = pageHeight - (margin * 2);

        // Calculate scaling: convert mm to px at 96 DPI
        const mmToPx = 96 / 25.4;
        const renderWidth = contentWidth * mmToPx;
        const renderHeight = contentHeight * mmToPx;

        // Get the total scroll height of the content
        const totalHeight = wrapper.scrollHeight;
        const totalWidth = wrapper.scrollWidth;

        // Calculate number of pages needed based on content height
        const scale = renderWidth / totalWidth;
        const scaledTotalHeight = totalHeight * scale;
        const numPages = Math.ceil(scaledTotalHeight / renderHeight);

        // Create PDF
        const pdf = new jspdf.jsPDF({
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait',
            compress: true
        });

        // Height of content to capture per page (in original pixels)
        const chunkHeight = renderHeight / scale;

        // Render each page chunk separately
        for (let page = 0; page < numPages; page++) {
            if (page > 0) {
                pdf.addPage();
            }

            const yOffset = page * chunkHeight;
            const heightToRender = Math.min(chunkHeight, totalHeight - yOffset);

            try {
                // Render only the visible chunk
                const canvas = await html2canvas(wrapper, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    letterRendering: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    y: yOffset,
                    height: heightToRender,
                    width: totalWidth,
                    windowWidth: totalWidth,
                    windowHeight: heightToRender,
                    scrollX: 0,
                    scrollY: 0
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.92);
                const imgHeight = (canvas.height * contentWidth) / canvas.width;

                pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, Math.min(imgHeight, contentHeight));

            } catch (chunkError) {
                console.warn(`Error rendering chunk ${page}:`, chunkError);
                // Try with lower scale if chunk fails
                try {
                    const canvas = await html2canvas(wrapper, {
                        scale: 1,
                        useCORS: true,
                        logging: false,
                        backgroundColor: '#ffffff',
                        y: yOffset,
                        height: heightToRender,
                        width: totalWidth
                    });

                    const imgData = canvas.toDataURL('image/jpeg', 0.85);
                    const imgHeight = (canvas.height * contentWidth) / canvas.width;

                    pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, Math.min(imgHeight, contentHeight));
                } catch (fallbackError) {
                    console.error(`Failed to render chunk ${page}:`, fallbackError);
                    // Add a text placeholder for failed chunks
                    pdf.setFontSize(12);
                    pdf.text(`[Content chunk ${page + 1} could not be rendered]`, margin, margin + 20);
                }
            }
        }

        // Save the PDF
        pdf.save(opt.filename);
    }

    /**
     * Export as standalone HTML
     */
    function exportHTML() {
        try {
            const markdownContent = elements.editor.value;
            const htmlContent = marked.parse(markdownContent);
            const title = elements.docTitle.value.trim() || 'Untitled Document';

            // Build complete HTML document with embedded styles
            const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="generator" content="MarkDown Designer">
    ${elements.includeAuthor.checked && elements.docAuthor.value ? `<meta name="author" content="${escapeHtml(elements.docAuthor.value)}">` : ''}
    <title>${escapeHtml(title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        
        html {
            font-size: 16px;
            -webkit-font-smoothing: antialiased;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 1rem;
            line-height: 1.7;
            color: #1a1a1a;
            background: #ffffff;
            max-width: 800px;
            margin: 0 auto;
            padding: 3rem 2rem;
        }
        
        /* Headings */
        h1, h2, h3, h4, h5, h6 {
            color: #0f172a;
            font-weight: 700;
            line-height: 1.3;
            margin-top: 1.5em;
            margin-bottom: 0.75em;
        }
        
        h1 { font-size: 2.25rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5em; }
        h2 { font-size: 1.875rem; }
        h3 { font-size: 1.5rem; }
        h4 { font-size: 1.25rem; }
        h5 { font-size: 1.125rem; }
        h6 { font-size: 1rem; color: #64748b; }
        
        h1:first-child, h2:first-child, h3:first-child { margin-top: 0; }
        
        p { margin-bottom: 1.25em; }
        
        a { color: #2563eb; text-decoration: none; }
        a:hover { text-decoration: underline; }
        
        /* Lists */
        ul, ol { margin-bottom: 1.25em; padding-left: 1.5em; }
        li { margin-bottom: 0.5em; }
        
        /* Task Lists */
        .contains-task-list { list-style: none; padding-left: 0; }
        .task-list-item { display: flex; align-items: flex-start; gap: 0.5rem; }
        .task-list-item input { margin-top: 0.3em; accent-color: #10b981; }
        
        /* Blockquotes */
        blockquote {
            margin: 1.5em 0;
            padding: 1rem 1.25rem;
            border-left: 4px solid #64748b;
            background: #f8fafc;
            border-radius: 0 8px 8px 0;
            font-style: italic;
            color: #475569;
        }
        
        /* Code */
        code {
            font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
            font-size: 0.9em;
            padding: 0.15em 0.4em;
            background: #f1f5f9;
            border-radius: 4px;
        }
        
        pre {
            margin: 1.5em 0;
            padding: 1.25rem;
            background: #1e293b;
            color: #e2e8f0;
            border-radius: 8px;
            overflow-x: auto;
        }
        
        pre code {
            background: transparent;
            padding: 0;
            color: inherit;
        }
        
        /* Tables */
        table {
            width: 100%;
            margin: 1.5em 0;
            border-collapse: collapse;
        }
        
        th, td {
            padding: 0.75rem 1rem;
            text-align: left;
            border: 1px solid #e2e8f0;
        }
        
        th { background: #f8fafc; font-weight: 600; }
        tr:nth-child(even) { background: #f8fafc; }
        
        /* Horizontal Rule */
        hr { margin: 2em 0; border: none; height: 2px; background: #e2e8f0; }
        
        /* Images */
        img { max-width: 100%; height: auto; border-radius: 8px; margin: 1em 0; }
        
        /* Metadata Header */
        .document-header {
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .document-header h1 {
            margin: 0 0 0.5rem 0;
            padding: 0;
            border: none;
        }
        
        .document-meta {
            font-size: 0.875rem;
            color: #64748b;
        }
        
        .document-meta span { margin-right: 1.5rem; }
        
        /* Print styles */
        @media print {
            body { max-width: none; padding: 1cm; }
            pre { white-space: pre-wrap; word-wrap: break-word; }
            h1, h2, h3, h4 { page-break-after: avoid; }
            pre, blockquote, table { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    ${buildHtmlMetadataHeader()}
    ${htmlContent}
</body>
</html>`;

            // Create and trigger download
            const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = getFilename('html');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('HTML exported successfully!');
        } catch (error) {
            console.error('HTML export error:', error);
            showToast('Error exporting HTML. Please try again.');
        }
    }

    /**
     * Build metadata header for HTML export
     */
    function buildHtmlMetadataHeader() {
        const parts = [];

        if (elements.includeTitle.checked && elements.docTitle.value.trim()) {
            parts.push(`<h1>${escapeHtml(elements.docTitle.value.trim())}</h1>`);
        }

        const metaInfo = [];
        if (elements.includeAuthor.checked && elements.docAuthor.value.trim()) {
            metaInfo.push(`<span><strong>Author:</strong> ${escapeHtml(elements.docAuthor.value.trim())}</span>`);
        }
        if (elements.includeDate.checked && elements.docDate.value) {
            metaInfo.push(`<span><strong>Date:</strong> ${formatDate(elements.docDate.value)}</span>`);
        }

        if (parts.length || metaInfo.length) {
            return `
    <header class="document-header">
        ${parts.join('')}
        ${metaInfo.length ? `<div class="document-meta">${metaInfo.join('')}</div>` : ''}
    </header>`;
        }

        return '';
    }

    /**
     * Export as Markdown file
     */
    function exportMarkdown() {
        try {
            let content = elements.editor.value;

            // Optionally prepend metadata as YAML frontmatter
            if ((elements.includeTitle.checked && elements.docTitle.value.trim()) ||
                (elements.includeAuthor.checked && elements.docAuthor.value.trim()) ||
                (elements.includeDate.checked && elements.docDate.value)) {

                let frontmatter = '---\n';
                if (elements.includeTitle.checked && elements.docTitle.value.trim()) {
                    frontmatter += `title: "${elements.docTitle.value.trim()}"\n`;
                }
                if (elements.includeAuthor.checked && elements.docAuthor.value.trim()) {
                    frontmatter += `author: "${elements.docAuthor.value.trim()}"\n`;
                }
                if (elements.includeDate.checked && elements.docDate.value) {
                    frontmatter += `date: ${elements.docDate.value}\n`;
                }
                frontmatter += '---\n\n';
                content = frontmatter + content;
            }

            const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = getFilename('md');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('Markdown exported successfully!');
        } catch (error) {
            console.error('Markdown export error:', error);
            showToast('Error exporting Markdown. Please try again.');
        }
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    function initEventListeners() {
        // Editor input with debounced preview
        const debouncedRender = debounce(renderPreview, CONFIG.debounceDelay);
        elements.editor.addEventListener('input', debouncedRender);

        // Theme switching
        elements.themeButtons.forEach(btn => {
            btn.addEventListener('click', () => switchTheme(btn.dataset.theme));
        });

        // Sidebar controls
        elements.sidebarToggle.addEventListener('click', () => toggleSidebar());
        elements.sidebarClose.addEventListener('click', () => toggleSidebar(false));
        elements.sidebarOverlay.addEventListener('click', () => toggleSidebar(false));

        // Metadata inputs
        [elements.docTitle, elements.docAuthor, elements.docDate].forEach(input => {
            input.addEventListener('change', saveMetadata);
            input.addEventListener('input', saveMetadata);
        });

        [elements.includeTitle, elements.includeAuthor, elements.includeDate].forEach(checkbox => {
            checkbox.addEventListener('change', saveMetadata);
        });

        // Export buttons
        elements.exportPDF.addEventListener('click', exportPDF);
        elements.exportHTML.addEventListener('click', exportHTML);
        elements.exportMD.addEventListener('click', exportMarkdown);

        // Mobile tabs
        elements.mobileTabs.forEach(tab => {
            tab.addEventListener('click', () => switchMobileTab(tab.dataset.tab));
        });

        // Window resize handler
        window.addEventListener('resize', debounce(() => {
            if (window.innerWidth > 768) {
                elements.sidebar.classList.remove('open');
                elements.sidebarOverlay.classList.remove('show');
                document.body.style.overflow = '';
            }
        }, 200));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S to save/export
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveContent();
                saveMetadata();
                showToast('Document saved!');
            }

            // Ctrl/Cmd + P for PDF export
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                exportPDF();
            }

            // Escape to close sidebar
            if (e.key === 'Escape') {
                if (elements.sidebar.classList.contains('open')) {
                    toggleSidebar(false);
                }
            }
        });

        // Before unload - save content
        window.addEventListener('beforeunload', () => {
            saveContent();
            saveMetadata();
        });
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    function init() {
        // Configure markdown parser
        configureMarked();

        // Load saved data
        loadTheme();
        loadSidebarState();
        loadMetadata();
        loadContent();

        // Initialize components
        initEventListeners();
        initResizer();

        // Start autosave
        startAutosave();

        // Focus editor
        elements.editor.focus();

        console.log('MarkDown Designer initialized successfully');
    }

    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
