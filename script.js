// Global Variables
const MAX_QR_LENGTH = 100; // Increased to support longer SSCC numbers
const QR_DENSITY_WARNING_THRESHOLD = 50; // Show warning for SSCCs longer than this
let currentLanguage = 'en';
let printedSSCCs = new Set(JSON.parse(localStorage.getItem('printedSSCCs') || '[]'));
let lastPrintQuantity = 1;
let clearTimer = null;

// Language Translations
const translations = {
  en: {
    title: 'SSCC QR Code Generator',
    'sscc-label': 'SSCC Number:',
    'sscc-placeholder': 'Scan SSCC number here...',
    'copies-label': 'Number of Copies:',
    'copy-1': '1',
    'copy-5': '5',
    'copy-10': '10',
    'copy-20': '20',
    'preview-label': 'Preview:',
    'preview-placeholder': '📱 QR code will appear here',
    'print-status': 'Print Status:',
    'connection-status': 'Connection:',
    'footer-text': 'Micro SAAS built by',
    'printing': 'Printing...',
    'ready': 'Ready',
    'connected': 'Connected',
    'disconnected': 'Disconnected',
    'error': 'Error',
    'duplicate-warning': '⚠️ This SSCC was already printed today',
    'empty-sscc-error': 'Please enter an SSCC number',
    'invalid-sscc-error': 'Invalid SSCC format',
    'print-success': 'Print job sent successfully',
    'print-error': 'Print failed - please try again',
    'too-long-error': 'Warning: SSCC length exceeds {max} characters',
    'long-sscc-warning': 'Warning: Very long codes may not scan reliably. Consider using a shorter SSCC if possible.',
    'qr-generation-error': 'QR generation error - please try again later',
    'popup-blocked-error': 'Pop-up blocked. Please allow pop-ups for printing.'
  },
  de: {
    title: 'SSCC QR-Code Generator',
    'sscc-label': 'SSCC Nummer:',
    'sscc-placeholder': 'SSCC Nummer hier scannen...',
    'copies-label': 'Anzahl Kopien:',
    'copy-1': '1',
    'copy-5': '5',
    'copy-10': '10',
    'copy-20': '20',
    'preview-label': 'Vorschau:',
    'preview-placeholder': '📱 QR-Code wird hier erscheinen',
    'print-status': 'Druckstatus:',
    'connection-status': 'Verbindung:',
    'footer-text': 'Micro SAAS erstellt von',
    'printing': 'Druckt...',
    'ready': 'Bereit',
    'connected': 'Verbunden',
    'disconnected': 'Getrennt',
    'error': 'Fehler',
    'duplicate-warning': '⚠️ Diese SSCC wurde heute bereits gedruckt',
    'empty-sscc-error': 'Bitte eine SSCC Nummer eingeben',
    'invalid-sscc-error': 'Ungültiges SSCC Format',
    'print-success': 'Druckauftrag erfolgreich gesendet',
    'print-error': 'Druck fehlgeschlagen - bitte erneut versuchen',
    'too-long-error': 'Warnung: SSCC-Länge überschreitet {max} Zeichen',
    'long-sscc-warning': 'Warnung: Sehr lange Codes können nicht zuverlässig gescannt werden. Verwenden Sie nach Möglichkeit einen kürzeren SSCC.',
    'qr-generation-error': 'QR-Generierungsfehler - bitte später erneut versuchen',
    'popup-blocked-error': 'Pop-up blockiert. Bitte erlauben Sie Pop-ups für Drucken.'
  }
};

// Remove duplicate symbols
const uniqueSymbols = ['🔹', '🔸', '🔺', '🔻', '⭐', '🌟', '💎', '🔮', '🎯', '🎪', '🎨', '🎭', '🔥', '⚡', '🌈', '🎃', '🎄', '🎁'];

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, waiting for QR library...');
  // The actual initialization will be triggered by the library load event
  // in index.html
});

function initializeApp() {
  console.log('Initializing app with QR code support...');
  
  try {
    // Check for required elements
    const requiredElements = ['ssccInput', 'stickerPreview'];
    for (const elementId of requiredElements) {
      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`Required element not found: ${elementId}`);
        showError(`App initialization failed: Missing ${elementId}`);
        return;
      }
    }
    
    // Check if QR code library is available
    if (typeof qrcode === 'undefined') {
      console.error('QR code library not loaded');
      showError('QR Code library not loaded. Please refresh the page.');
      return;
    }
    
    loadSettings();
    setupEventListeners();
    focusInput();
    updateConnectionStatus();
    
    // Load saved language preference
    const savedLang = localStorage.getItem('language') || 'en';
    if (savedLang !== currentLanguage) {
      currentLanguage = savedLang;
      updateLanguage();
    }
    
    console.log('App initialized successfully');
    
    // Run diagnostics
    const issues = runDiagnostics();
    if (issues.length > 0) {
      console.warn('Initialization issues detected:', issues);
    }
  } catch (error) {
    console.error('App initialization error:', error);
    showError('App initialization failed: ' + error.message);
  }
}

// Setup Event Listeners
function setupEventListeners() {
  const ssccInput = document.getElementById('ssccInput');
  
  // Input event listener for real-time QR generation
  ssccInput.addEventListener('input', function() {
    console.log('SSCC input changed:', this.value);
    clearTimeout(clearTimer);
    const sscc = this.value.trim();
    
    if (sscc) {
      console.log('Generating preview for:', sscc);
      try {
        generateQRPreview(sscc);
        checkDuplicate(sscc);
        clearError();
      } catch (error) {
        console.error('Error in input handler:', error);
        showError('Error processing SSCC: ' + error.message);
      }
    } else {
      console.log('Clearing preview - empty input');
      clearPreview();
      clearError();
      clearDuplicateWarning();
    }
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // ESC to clear fields
    if (e.key === 'Escape') {
      clearAllFields();
      focusInput();
    }
    
    // Enter to print 1 copy
    if (e.key === 'Enter' && ssccInput.value.trim()) {
      e.preventDefault();
      printCopies(1);
    }
    
    // Spacebar to repeat last print quantity
    if (e.key === ' ' && document.activeElement !== ssccInput && ssccInput.value.trim()) {
      e.preventDefault();
      printCopies(lastPrintQuantity);
    }
    
    // Function keys for quick print
    if (e.key === 'F1') { e.preventDefault(); printCopies(1); }
    if (e.key === 'F2') { e.preventDefault(); printCopies(5); }
    if (e.key === 'F3') { e.preventDefault(); printCopies(10); }
    if (e.key === 'F4') { e.preventDefault(); printCopies(20); }
  });
  
  // Auto-focus on input when clicking anywhere
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.copy-btn, .lang-btn, .change-printer-btn, .printer-select')) {
      focusInput();
    }
  });
}

// --- Cache for QR Preview Optimization ---
let lastSSCC = null;
let lastCanvas = null;

function generateQRPreview(sscc) {
    const previewContainer = document.getElementById('stickerPreview');
    if (!previewContainer) return;
    
    // Avoid unnecessary updates if SSCC hasn't changed
    if (lastSSCC === sscc) {
        if (lastCanvas && previewContainer.innerHTML === '') {
            const stickerContent = document.createElement('div');
            stickerContent.className = 'sticker-content';
            const qrContainer = document.createElement('div');
            qrContainer.className = 'qr-code-container';
            qrContainer.appendChild(lastCanvas);
            const stickerInfo = document.createElement('div');
            stickerInfo.className = 'sticker-info';
            const lastFive = document.createElement('div');
            lastFive.className = 'last-five';
            lastFive.textContent = sscc.slice(-5);
            const uniqueSymbol = document.createElement('div');
            uniqueSymbol.className = 'unique-symbol';
            uniqueSymbol.textContent = generateUniqueSymbol(sscc);
            stickerInfo.appendChild(lastFive);
            stickerInfo.appendChild(uniqueSymbol);
            stickerContent.appendChild(qrContainer);
            stickerContent.appendChild(stickerInfo);
            previewContainer.appendChild(stickerContent);
        }
        return;
    }
    
    previewContainer.innerHTML = '';
    clearError();
    clearDuplicateWarning();

    if (!sscc) {
        clearPreview();
        return;
    }

    // Show density warning for long SSCCs
    if (sscc.length > QR_DENSITY_WARNING_THRESHOLD) {
        showError(translations[currentLanguage]['long-sscc-warning']);
    }

    checkDuplicate(sscc);

    const stickerContent = document.createElement('div');
    stickerContent.className = 'sticker-content';

    const qrContainer = document.createElement('div');
    qrContainer.className = 'qr-code-container';
    
    const canvas = generateQRCode(sscc, 120);
    if (canvas) {
        qrContainer.appendChild(canvas);
        lastCanvas = canvas; // Cache the canvas
        lastSSCC = sscc; // Cache the SSCC
    } else {
        showError(translations[currentLanguage]['qr-generation-error']);
        return;
    }

    const stickerInfo = document.createElement('div');
    stickerInfo.className = 'sticker-info';

    const lastFive = document.createElement('div');
    lastFive.className = 'last-five';
    lastFive.textContent = sscc.slice(-5);

    const uniqueSymbol = document.createElement('div');
    uniqueSymbol.className = 'unique-symbol';
    uniqueSymbol.textContent = generateUniqueSymbol(sscc);

    stickerInfo.appendChild(lastFive);
    stickerInfo.appendChild(uniqueSymbol);

    stickerContent.appendChild(qrContainer);
    stickerContent.appendChild(stickerInfo);
    previewContainer.appendChild(stickerContent);
}

// Generate Unique Symbol (deterministic based on SSCC)
function generateUniqueSymbol(sscc) {
  // Create a simple hash from the SSCC
  let hash = 0;
  for (let i = 0; i < sscc.length; i++) {
    const char = sscc.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use hash to select symbol
  const index = Math.abs(hash) % uniqueSymbols.length;
  return uniqueSymbols[index];
}

// Print Copies Function
async function printCopies(quantity) {
  updatePrintStatus('ready');
  const sscc = document.getElementById('ssccInput').value.trim();

  if (!isValidSSCC(sscc)) {
    return;
  }
  
  // Update last print quantity
  lastPrintQuantity = quantity;
  
  // Show loading
  showLoading();
  updatePrintStatus('printing');
  
  try {
    // Generate print content
    const printContent = await generatePrintContent(sscc, quantity);
    
    // Attempt to print using native browser print
    const success = await sendToPrinter(printContent, quantity);
    
    if (success) {
      // Mark as printed
      printedSSCCs.add(sscc);
      savePrintedSSCCs();
      
      // Show success
      updatePrintStatus('ready');
      
      // Schedule auto-clear after 5 seconds
      clearTimer = setTimeout(() => {
        clearAllFields();
        focusInput();
      }, 5000);
      
    } else {
      throw new Error('Print canceled by user');
    }
    
  } catch (error) {
    console.error('Print error:', error);
    showError(translations[currentLanguage]['print-error']);
    updatePrintStatus('error');
  } finally {
    hideLoading();
  }
}

// Generate Print Content
async function generatePrintContent(sscc, quantity) {
  const container = document.createElement('div');
  container.className = 'print-container';

  for (let i = 0; i < quantity; i++) {
    const sticker = document.createElement('div');
    sticker.className = 'sticker';

    const qrContainer = document.createElement('div');
    qrContainer.className = 'qr-code-container';
    
    // Generate a 240x240px canvas for high-resolution printing on a 30mm label.
    const canvas = generateQRCode(sscc, 240); 
    const qrImage = document.createElement('img');
    qrImage.src = canvas.toDataURL('image/png');
    qrContainer.appendChild(qrImage);

    const stickerInfo = document.createElement('div');
    stickerInfo.className = 'sticker-info';
    
    const lastFive = document.createElement('div');
    lastFive.className = 'last-five';
    lastFive.textContent = sscc.slice(-5);

    const uniqueSymbol = document.createElement('div');
    uniqueSymbol.className = 'unique-symbol';
    uniqueSymbol.textContent = generateUniqueSymbol(sscc);

    stickerInfo.appendChild(lastFive);
    stickerInfo.appendChild(uniqueSymbol);

    sticker.appendChild(qrContainer);
    sticker.appendChild(stickerInfo);
    container.appendChild(sticker);
  }
  return container;
}

// Send to Printer (Native Browser Print)
async function sendToPrinter(content, quantity) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showError(translations[currentLanguage]['popup-blocked-error']);
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title></title> <!-- Empty title to prevent browser headers/footers -->
        <style>
          @page {
            size: 50mm 30mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .sticker {
            width: 50mm;
            height: 30mm;
            box-sizing: border-box;
            margin: 0;
            padding: 3mm;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 3mm;
            page-break-after: always;
            overflow: hidden;
          }
          .sticker:last-child {
            page-break-after: avoid;
          }
          .qr-code-container {
            width: 24mm;
            height: 24mm;
            flex-shrink: 0;
          }
          .qr-code-container img {
            width: 100%;
            height: 100%;
          }
          .sticker-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
            flex-grow: 1;
            height: 100%;
          }
          .last-five {
            font-size: 16pt;
            font-weight: bold;
          }
          .unique-symbol {
            font-size: 18pt;
            margin-top: 2mm;
          }
        </style>
      </head>
      <body>
        ${content.outerHTML}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 1000); // Increased delay for slower systems
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
  updatePrintStatus('printing');
  setTimeout(() => {
    updatePrintStatus('ready');
  }, 30000);
  focusInput(); // Ensure input focus after printing
}

// Check for Duplicate SSCC
function checkDuplicate(sscc) {
  if (printedSSCCs.has(sscc)) {
    showDuplicateWarning();
  } else {
    clearDuplicateWarning();
  }
}

// Error Handling Functions
function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  } else {
    alert(message);
  }
}

function clearError() {
  const errorDiv = document.getElementById('errorMessage');
  if (errorDiv) errorDiv.textContent = '';
}

function showDuplicateWarning() {
  const warningDiv = document.getElementById('duplicateWarning');
  warningDiv.textContent = translations[currentLanguage]['duplicate-warning'];
  warningDiv.style.display = 'block';
}

function clearDuplicateWarning() {
  const warningDiv = document.getElementById('duplicateWarning');
  warningDiv.style.display = 'none';
}

// UI Helper Functions
function clearPreview() {
  console.log('Clearing preview');
  const previewContainer = document.getElementById('stickerPreview');
  if (previewContainer) {
    previewContainer.innerHTML = `<div class="preview-placeholder" data-lang="preview-placeholder"><span>${translations[currentLanguage]['preview-placeholder']}</span></div>`;
  } else {
    console.error('Preview container not found');
  }
}

function clearAllFields() {
  document.getElementById('ssccInput').value = '';
  clearPreview();
  clearError();
  clearDuplicateWarning();
  clearTimeout(clearTimer);
}

function focusInput() {
  const ssccInput = document.getElementById('ssccInput');
  if (ssccInput) {
    ssccInput.focus();
  }
}

function showLoading() {
  document.getElementById('loadingOverlay').classList.add('show');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('show');
}

// Status Functions
function updatePrintStatus(status) {
  const statusElement = document.getElementById('printStatus');
  statusElement.className = `status-${status}`;
  statusElement.textContent = translations[currentLanguage][status] || status;
}

function updateConnectionStatus() {
  const statusElement = document.getElementById('connectionStatus');
  if (navigator.onLine) {
    statusElement.className = 'status-connected';
    statusElement.textContent = translations[currentLanguage]['connected'];
  } else {
    statusElement.className = 'status-disconnected';
    statusElement.textContent = translations[currentLanguage]['disconnected'];
  }
}

// Language Functions
function toggleLanguage() {
  currentLanguage = currentLanguage === 'en' ? 'de' : 'en';
  localStorage.setItem('language', currentLanguage);
  updateLanguage();
  focusInput(); // Retain focus after language toggle
}

function updateLanguage() {
  const langBtn = document.getElementById('langBtn');
  langBtn.textContent = currentLanguage === 'en' ? '🌍 DE' : '🌍 EN';
  
  // Update all translatable elements
  document.querySelectorAll('[data-lang]').forEach(element => {
    const key = element.getAttribute('data-lang');
    if (translations[currentLanguage][key]) {
      element.textContent = translations[currentLanguage][key];
    }
  });
  
  // Update placeholders
  document.querySelectorAll('[data-lang-placeholder]').forEach(element => {
    const key = element.getAttribute('data-lang-placeholder');
    if (translations[currentLanguage][key]) {
      element.placeholder = translations[currentLanguage][key];
    }
  });
  
  // Update preview if no SSCC is entered
  const ssccInput = document.getElementById('ssccInput');
  if (!ssccInput.value.trim()) {
    clearPreview();
  }
  
  // Update status
  updateConnectionStatus();
  updatePrintStatus('ready');
}

// Storage Functions
function loadSettings() {
  // Load printed SSCCs (reset daily)
  const today = new Date().toDateString();
  const lastDate = localStorage.getItem('lastPrintDate');
  
  if (lastDate !== today) {
    // New day, clear printed SSCCs
    printedSSCCs.clear();
    localStorage.setItem('lastPrintDate', today);
    localStorage.setItem('printedSSCCs', '[]');
  }
}

function savePrintedSSCCs() {
  localStorage.setItem('printedSSCCs', JSON.stringify(Array.from(printedSSCCs)));
}

// Connection monitoring
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

// Debug and Error Checking Functions
function runDiagnostics() {
  console.log('=== SSCC QR App Diagnostics ===');
  
  // Check DOM elements
  const requiredElements = ['ssccInput', 'stickerPreview', 'errorMessage'];
  const missingElements = [];
  
  requiredElements.forEach(id => {
    const element = document.getElementById(id);
    if (!element) {
      missingElements.push(id);
    }
    console.log(`Element ${id}:`, element ? 'Found' : 'MISSING');
  });
  
  // Check QRCode library
  console.log('QRCode library:', typeof QRCode !== 'undefined' ? 'Loaded' : 'NOT LOADED');
  if (typeof QRCode !== 'undefined') {
    console.log('QRCode methods:', Object.getOwnPropertyNames(QRCode));
  }
  
  // Check translations
  console.log('Current language:', currentLanguage);
  console.log('Translations available:', Object.keys(translations));
  
  // Check local storage
  console.log('Local storage test:', localStorage.getItem('test') || 'accessible');
  
  // Return summary
  const issues = [];
  if (missingElements.length > 0) {
    issues.push(`Missing elements: ${missingElements.join(', ')}`);
  }
  if (typeof QRCode === 'undefined') {
    issues.push('QRCode library not loaded');
  }
  
  console.log('Issues found:', issues.length > 0 ? issues : 'None');
  return issues;
}

function isValidSSCC(sscc) {
    // Validation is now just a non-empty check and max length for QR scannability
    if (sscc.length === 0) {
        showError(translations[currentLanguage]['empty-sscc-error']);
        return false;
    }
    if (sscc.length > MAX_QR_LENGTH) {
        showError(translations[currentLanguage]['too-long-error'].replace('{max}', MAX_QR_LENGTH));
        return false;
    }
    return true;
}

// --- QR Code Generation ---
function generateQRCode(text, size = 120) {
    try {
        // Adjust error correction level based on text length
        const errorCorrectionLevel = text.length > QR_DENSITY_WARNING_THRESHOLD ? 'M' : 'H';
        const qr = qrcode(0, errorCorrectionLevel); // Use auto type number for optimal size
        qr.addData(text);
        qr.make();
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const modules = qr.getModuleCount();
        const cellSize = size / modules;
        
        canvas.width = size;
        canvas.height = size;
        
        // Draw modules
        for (let row = 0; row < modules; row++) {
            for (let col = 0; col < modules; col++) {
                ctx.fillStyle = qr.isDark(row, col) ? '#000000' : '#FFFFFF';
                ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
            }
        }
        
        return canvas;
    } catch (error) {
        console.error('QR generation error:', error);
        // Return a visual error representation on the canvas
        const errorCanvas = document.createElement('canvas');
        errorCanvas.width = size;
        errorCanvas.height = size;
        const eCtx = errorCanvas.getContext('2d');
        eCtx.fillStyle = '#ffcccc';
        eCtx.fillRect(0, 0, size, size);
        eCtx.fillStyle = '#ff0000';
        eCtx.font = '16px Arial';
        eCtx.textAlign = 'center';
        eCtx.fillText('QR Error', size / 2, size / 2);
        return errorCanvas;
    }
}

// --- Debounced QR Preview ---
let debounceTimer;
const ssccInput = document.getElementById('ssccInput');
if (ssccInput) {
    ssccInput.setAttribute('aria-label', 'SSCC input');
    ssccInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            generateQRPreview(ssccInput.value.trim());
        }, 100);
    });
}

// --- Test Print Functionality ---
function testPrint() {
    const testSSCC = 'TEST-12345';
    const ssccInput = document.getElementById('ssccInput');
    if (ssccInput) {
        ssccInput.value = testSSCC;
        generateQRPreview(testSSCC);
        printCopies(1);
    } else {
        showError('Test print failed: Input field not found.');
    }
}

// --- Clear Input Functionality ---
function clearInput() {
    const ssccInput = document.getElementById('ssccInput');
    if (ssccInput) {
        ssccInput.value = '';
        generateQRPreview('');
        clearError();
        clearDuplicateWarning();
        focusInput();
    }
} 