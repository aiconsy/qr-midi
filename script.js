// Global Variables
const MAX_QR_LENGTH = 100; // Increased to support longer SSCC numbers
const QR_DENSITY_WARNING_THRESHOLD = 50; // Show warning for SSCCs longer than this
let currentLanguage = 'en';
let printedSSCCs;
try {
  printedSSCCs = new Set(JSON.parse(localStorage.getItem('printedSSCCs') || '[]'));
} catch (error) {
  printedSSCCs = new Set();
}
let lastPrintQuantity = 1;
let accumulatedCopies = 0;
let isGeneratingPreview = false; // Flag to prevent multiple simultaneous generations
let previewDebounceTimer = null; // Timer for debouncing preview generation

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
    'popup-blocked-error': 'Pop-up blocked. Please allow pop-ups for printing.',
    'total-label': 'Total: ',
    'add-1': '+1',
    'add-5': '+5',
    'add-10': '+10',
    'add-20': '+20',
    'printer-settings': 'Advanced Settings',
    'silent-print-error': 'Silent printing failed. Falling back to regular print.',
    'copies-added': 'Added {count} copies',
    'max-copies-error': 'Maximum 100 copies allowed. Current total: {current}',
    'select-copies-error': 'Please select number of copies first',
    'print-success': 'Print job sent successfully!',
    'thermal-printer-optimized': 'Optimized for Zebra thermal printer',
    'clear': 'Clear',
    'settings': 'Settings',
    'advanced-printer-settings': 'Advanced Printer Settings',
    'toggle-language': 'Toggle language',
    'sscc-input-field': 'SSCC input field',
    'clear-input': 'Clear input',
    'add-1-copy': 'Add 1 copy',
    'add-5-copies': 'Add 5 copies',
    'add-10-copies': 'Add 10 copies',
    'add-20-copies': 'Add 20 copies',
    'print-all-copies': 'Print all copies',
    'qr-code-preview-area': 'QR code preview area',
    'hotkeys-title': 'Keyboard Shortcuts:',
    'hotkey-esc': 'ESC - Clear all fields',
    'hotkey-enter': 'Enter - Add 1 copy & print if ready',
    'hotkey-space': 'Space - Add last print quantity',
    'hotkey-f1': 'F1 - Add 1 copy',
    'hotkey-f2': 'F2 - Add 5 copies',
    'hotkey-f3': 'F3 - Add 10 copies',
    'hotkey-f4': 'F4 - Add 20 copies',
    'hotkey-f5': 'F5 - Print accumulated copies',
    'instructions-title': 'Instructions:',
    'instructions-step1': '1. Scan or type SSCC number',
    'instructions-step2': '2. Click numbers to add copies',
    'instructions-step3': '3. Press print when ready',
    'instructions-printer': 'Optimized for Zebra ZD411 thermal printer'
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
    'popup-blocked-error': 'Pop-up blockiert. Bitte erlauben Sie Pop-ups für Drucken.',
    'total-label': 'Gesamt: ',
    'add-1': '+1',
    'add-5': '+5',
    'add-10': '+10',
    'add-20': '+20',
    'printer-settings': 'Erweiterte Einstellungen',
    'silent-print-error': 'Stilles Drucken fehlgeschlagen. Wechsel zu normalem Druck.',
    'copies-added': '{count} Kopien hinzugefügt',
    'max-copies-error': 'Maximum 100 Kopien erlaubt. Aktuell: {current}',
    'select-copies-error': 'Bitte wählen Sie zuerst die Anzahl der Kopien',
    'print-success': 'Druckauftrag erfolgreich gesendet!',
    'thermal-printer-optimized': 'Optimiert für Zebra Thermodrucker',
    'clear': 'Löschen',
    'settings': 'Einstellungen',
    'advanced-printer-settings': 'Erweiterte Druckereinstellungen',
    'toggle-language': 'Sprache wechseln',
    'sscc-input-field': 'SSCC Eingabefeld',
    'clear-input': 'Eingabe löschen',
    'add-1-copy': '1 Kopie hinzufügen',
    'add-5-copies': '5 Kopien hinzufügen',
    'add-10-copies': '10 Kopien hinzufügen',
    'add-20-copies': '20 Kopien hinzufügen',
    'print-all-copies': 'Alle Kopien drucken',
    'qr-code-preview-area': 'QR-Code Vorschaubereich',
    'hotkeys-title': 'Tastaturkürzel:',
    'hotkey-esc': 'ESC - Alle Felder löschen',
    'hotkey-enter': 'EINGABE - 1 Kopie hinzufügen & drucken, wenn bereit',
    'hotkey-space': 'LEERTASTE - Letzte Druckmenge hinzufügen',
    'hotkey-f1': 'F1 - 1 Kopie hinzufügen',
    'hotkey-f2': 'F2 - 5 Kopien hinzufügen',
    'hotkey-f3': 'F3 - 10 Kopien hinzufügen',
    'hotkey-f4': 'F4 - 20 Kopien hinzufügen',
    'hotkey-f5': 'F5 - Akkumulierte Kopien drucken',
    'instructions-title': 'Anweisungen:',
    'instructions-step1': '1. SSCC-Nummer scannen oder eingeben',
    'instructions-step2': '2. Zahlen anklicken, um Kopien hinzuzufügen',
    'instructions-step3': '3. Drucken, wenn bereit',
    'instructions-printer': 'Optimiert für Zebra ZD411 Thermodrucker'
  }
};

// Remove duplicate symbols
const uniqueSymbols = ['🔹', '🔸', '🔺', '🔻', '⭐', '🌟', '💎', '🔮', '🎯', '🎪', '🎨', '🎭', '🔥', '⚡', '🌈', '🎃', '🎄', '🎁'];

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
  // The actual initialization will be triggered by the library load event
  // in index.html
});

function initializeApp() {
  try {
    // Check for required elements
    const requiredElements = ['ssccInput', 'stickerPreview'];
    for (const elementId of requiredElements) {
      const element = document.getElementById(elementId);
      if (!element) {
        showError(`App initialization failed: Missing ${elementId}`);
        return;
      }
    }
    
    // Check if QR code library is available
    if (typeof QRCode === 'undefined') {
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
    } else {
      // Initialize aria-labels even if language hasn't changed
      updateAriaLabels();
    }
    
    // Initialize copy display
    updateCopyDisplay();
    
    // Initialization complete
  } catch (error) {
    showError('App initialization failed: ' + error.message);
  }
}

// Setup Event Listeners
function setupEventListeners() {
  const ssccInput = document.getElementById('ssccInput');
  
  // Input event listener for real-time QR generation with debouncing
  ssccInput.addEventListener('input', function() {
    clearTimeout(previewDebounceTimer); // Clear any pending preview generation
    
    const sscc = this.value.trim();
    
    if (sscc) {
      // Debounce the preview generation to prevent multiple rapid generations
      previewDebounceTimer = setTimeout(() => {
        if (!isGeneratingPreview) {
          try {
            generateQRPreview(sscc).catch(error => {
              showError('Error processing SSCC: ' + error.message);
            });
            checkDuplicate(sscc);
            clearError();
          } catch (error) {
            showError('Error processing SSCC: ' + error.message);
          }
        }
      }, 300); // 300ms debounce delay
    } else {
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
    
    // Enter to add 1 copy and print if copies accumulated
    if (e.key === 'Enter' && ssccInput.value.trim()) {
      e.preventDefault();
      if (accumulatedCopies === 0) {
        addToCopies(1);
      }
      if (accumulatedCopies > 0) {
        printAccumulatedCopies();
      }
    }
    
    // Spacebar to add last print quantity
    if (e.key === ' ' && document.activeElement !== ssccInput && ssccInput.value.trim()) {
      e.preventDefault();
      addToCopies(lastPrintQuantity || 1);
    }
    
    // Function keys for quick copy addition
    if (e.key === 'F1') { e.preventDefault(); addToCopies(1); }
    if (e.key === 'F2') { e.preventDefault(); addToCopies(5); }
    if (e.key === 'F3') { e.preventDefault(); addToCopies(10); }
    if (e.key === 'F4') { e.preventDefault(); addToCopies(20); }
    
    // F5 to print accumulated copies
    if (e.key === 'F5' && accumulatedCopies > 0) { 
      e.preventDefault(); 
      printAccumulatedCopies(); 
    }
  });
  
  // Auto-focus on input when clicking anywhere
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.copy-btn, .lang-btn, .change-printer-btn, .printer-select')) {
      focusInput();
    }
  });
}

async function generateQRPreview(sscc) {
    // Prevent multiple simultaneous generations
    if (isGeneratingPreview) {
        return;
    }
    
    isGeneratingPreview = true;
    
    const previewContainer = document.getElementById('stickerPreview');
    if (!previewContainer) {
        isGeneratingPreview = false;
        return;
    }
    
    // Clear previous content
    previewContainer.innerHTML = '';
    clearError();
    clearDuplicateWarning();

    if (!sscc) {
        clearPreview();
        isGeneratingPreview = false;
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
    
    try {
        const canvas = await generateQRCode(sscc, 120);
        if (canvas) {
            qrContainer.appendChild(canvas);
        } else {
            showError(translations[currentLanguage]['qr-generation-error']);
            isGeneratingPreview = false;
            return;
        }
    } catch (error) {
        showError(translations[currentLanguage]['qr-generation-error']);
        isGeneratingPreview = false;
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
    
    // Reset the flag after successful generation
    isGeneratingPreview = false;
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

// Legacy print function - removed in favor of copy accumulation system

// Generate Print Content
async function generatePrintContent(sscc, quantity) {
  let stickersHTML = '';

  for (let i = 0; i < quantity; i++) {
    // Generate QR code with better error handling and Zebra printer optimization
    let qrDataURL = '';
    
    try {
      const qrCanvas = await generateQRCode(sscc, 200); // Reduced size for thermal printer
      if (qrCanvas && qrCanvas.toDataURL) {
        qrDataURL = qrCanvas.toDataURL('image/png', 1.0); // High quality, no compression
      } else {
        throw new Error('Invalid QR canvas generated');
      }
    } catch (error) {
      // Fallback: create a simple text-based QR representation
      qrDataURL = `data:image/svg+xml;base64,${btoa(`
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="white"/>
          <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="12">QR ERROR</text>
        </svg>
      `)}`;
    }
    
    const lastFive = sscc.slice(-5);
    const uniqueSymbol = generateUniqueSymbol(sscc);

    stickersHTML += `
      <div class="sticker">
        <div class="qr-code-container">
          <img src="${qrDataURL}" alt="QR Code for ${sscc}" style="image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges;" />
        </div>
        <div class="sticker-info">
          <div class="last-five">${lastFive}</div>
          <div class="unique-symbol">${uniqueSymbol}</div>
        </div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title></title>
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
            background: white;
          }
          .sticker {
            width: 50mm;
            height: 30mm;
            box-sizing: border-box;
            margin: 0;
            padding: 2mm;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 2mm;
            page-break-after: always;
            overflow: hidden;
            background: white;
            border: 1px solid #ccc;
          }
          .sticker:last-child {
            page-break-after: avoid;
          }
          .qr-code-container {
            width: 22mm;
            height: 22mm;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
          }
          .qr-code-container img {
            width: 100%;
            height: 100%;
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .sticker-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
            flex-grow: 1;
            text-align: center;
            background: white;
          }
          .last-five {
            font-size: 14px;
            font-weight: bold;
            color: black;
            margin-bottom: 1mm;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .unique-symbol {
            font-size: 18px;
            color: black;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @media print {
            body { background: white !important; }
            .sticker { background: white !important; border: none !important; }
            .qr-code-container { background: white !important; }
            .sticker-info { background: white !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        </style>
      </head>
      <body>
        ${stickersHTML}
      </body>
    </html>
  `;
}

// Old sendToPrinter function removed - replaced with silent printing

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

function showSuccessMessage() {
  const notification = document.createElement('div');
  notification.textContent = `✅ ${translations[currentLanguage]['print-success']}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #27ae60;
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    z-index: 1000;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.style.opacity = '1', 10);
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 2500);
}

// UI Helper Functions
function clearPreview() {
  const previewContainer = document.getElementById('stickerPreview');
  if (previewContainer) {
    previewContainer.innerHTML = `<div class="preview-placeholder" data-lang="preview-placeholder"><span>${translations[currentLanguage]['preview-placeholder']}</span></div>`;
  }
}

function clearAllFields() {
  document.getElementById('ssccInput').value = '';
  clearPreview();
  clearError();
  clearDuplicateWarning();
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
  langBtn.textContent = currentLanguage === 'en' ? '🌍 EN' : '🌍 DE';
  langBtn.setAttribute('aria-label', translations[currentLanguage]['toggle-language']);
  
  // Update HTML lang attribute
  document.documentElement.lang = currentLanguage;
  
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
  
  // Update aria-labels for accessibility
  updateAriaLabels();
  
  // Update preview if no SSCC is entered
  const ssccInput = document.getElementById('ssccInput');
  if (!ssccInput.value.trim()) {
    clearPreview();
  }
  
  // Update status
  updateConnectionStatus();
  updatePrintStatus('ready');
}

// New function to update aria-labels for accessibility
function updateAriaLabels() {
  // Update SSCC input field
  const ssccInput = document.getElementById('ssccInput');
  if (ssccInput) {
    ssccInput.setAttribute('aria-label', translations[currentLanguage]['sscc-input-field']);
  }
  
  // Update clear input button
  const clearBtn = document.querySelector('.clear-btn');
  if (clearBtn) {
    clearBtn.setAttribute('aria-label', translations[currentLanguage]['clear-input']);
  }
  
  // Update printer settings button
  const printerSettingsBtn = document.querySelector('.printer-settings-btn');
  if (printerSettingsBtn) {
    printerSettingsBtn.setAttribute('aria-label', translations[currentLanguage]['advanced-printer-settings']);
    printerSettingsBtn.setAttribute('title', translations[currentLanguage]['advanced-printer-settings']);
  }
  
  // Update copy buttons
  const copyButtons = document.querySelectorAll('.copy-btn');
  copyButtons.forEach((btn, index) => {
    const amounts = [1, 5, 10, 20];
    const ariaKeys = ['add-1-copy', 'add-5-copies', 'add-10-copies', 'add-20-copies'];
    if (ariaKeys[index]) {
      btn.setAttribute('aria-label', translations[currentLanguage][ariaKeys[index]]);
    }
  });
  
  // Update print button
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.setAttribute('aria-label', translations[currentLanguage]['print-all-copies']);
    // Update print button text elements
    const printText = printBtn.querySelector('[data-lang="print-all-copies"]');
    const copiesText = printBtn.querySelector('[data-lang="copies-label"]');
    if (printText) {
      printText.textContent = translations[currentLanguage]['print-all-copies'];
    }
    if (copiesText) {
      copiesText.textContent = translations[currentLanguage]['copies-label'];
    }
  }
  
  // Update QR preview area
  const stickerPreview = document.getElementById('stickerPreview');
  if (stickerPreview) {
    stickerPreview.setAttribute('aria-label', translations[currentLanguage]['qr-code-preview-area']);
  }
}

// Storage Functions
function loadSettings() {
  try {
    // Load printed SSCCs (reset daily)
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('lastPrintDate');
    
    if (lastDate !== today) {
      // New day, clear printed SSCCs
      printedSSCCs.clear();
      localStorage.setItem('lastPrintDate', today);
      localStorage.setItem('printedSSCCs', '[]');
    }
  } catch (error) {
    // localStorage not available, continue without persistence
    printedSSCCs.clear();
  }
}

function savePrintedSSCCs() {
  try {
    localStorage.setItem('printedSSCCs', JSON.stringify(Array.from(printedSSCCs)));
  } catch (error) {
    // localStorage not available, skip saving
  }
}

// Connection monitoring
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

// Input validation function

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
    return new Promise((resolve, reject) => {
        try {
            // Check if QRCode library is available
            if (typeof QRCode === 'undefined') {
                reject(new Error('QR Code library not loaded'));
                return;
            }
            
            // Create a temporary div for QR code generation
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.top = '-9999px';
            document.body.appendChild(tempDiv);
            
            // Create QR code using the QRCode library API
            const errorCorrectionLevel = text.length > QR_DENSITY_WARNING_THRESHOLD ? QRCode.CorrectLevel.M : QRCode.CorrectLevel.H;
            
            const qr = new QRCode(tempDiv, {
                text: text,
                width: size,
                height: size,
                colorDark: '#000000',
                colorLight: '#FFFFFF',
                correctLevel: errorCorrectionLevel
            });
            
            // Wait for QR code to be generated
            setTimeout(() => {
                try {
                    // Get the generated canvas
                    const canvas = tempDiv.querySelector('canvas');
                    if (canvas) {
                        // Create a new canvas with the same content
                        const newCanvas = document.createElement('canvas');
                        newCanvas.width = size;
                        newCanvas.height = size;
                        const ctx = newCanvas.getContext('2d');
                        
                        // Draw the QR code
                        ctx.drawImage(canvas, 0, 0);
                        
                        // Add border for better thermal printer recognition
                        ctx.strokeStyle = '#000000';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(0, 0, size, size);
                        
                        // Clean up
                        document.body.removeChild(tempDiv);
                        resolve(newCanvas);
                    } else {
                        throw new Error('QR code generation failed');
                    }
                } catch (error) {
                    document.body.removeChild(tempDiv);
                    reject(error);
                }
            }, 100);
            
        } catch (error) {
            reject(error);
        }
    });
}

// Remove duplicate event listener - this is handled in setupEventListeners()



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

// --- Copy Accumulation Functions ---
function addToCopies(amount) {
    // Check maximum limit
    if (accumulatedCopies + amount > 100) {
        showError(translations[currentLanguage]['max-copies-error'].replace('{current}', accumulatedCopies));
        return;
    }
    
    accumulatedCopies += amount;
    updateCopyDisplay();
    
    // Show brief feedback
    const notification = document.createElement('div');
    notification.textContent = translations[currentLanguage]['copies-added'].replace('{count}', amount);
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.style.opacity = '1', 10);
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 2000);
}

function clearCopyTotal() {
    accumulatedCopies = 0;
    updateCopyDisplay();
}

function updateCopyDisplay() {
    const totalElement = document.getElementById('copyTotal');
    const printBtn = document.getElementById('printBtn');
    const printBtnCount = document.getElementById('printBtnCount');
    
    if (totalElement) totalElement.textContent = accumulatedCopies;
    if (printBtnCount) printBtnCount.textContent = accumulatedCopies;
    
    if (printBtn) {
        printBtn.disabled = accumulatedCopies === 0;
        // Update the print button text with proper translations
        const printText = printBtn.querySelector('[data-lang="print-all-copies"]');
        const copiesText = printBtn.querySelector('[data-lang="copies-label"]');
        if (printText && copiesText) {
            printText.textContent = translations[currentLanguage]['print-all-copies'];
            copiesText.textContent = translations[currentLanguage]['copies-label'];
        }
    }
}

// --- Silent Printing Functions ---
async function printAccumulatedCopies() {
    const sscc = document.getElementById('ssccInput').value.trim();
    
    if (!isValidSSCC(sscc)) {
        return;
    }
    
    if (accumulatedCopies === 0) {
        showError(translations[currentLanguage]['select-copies-error']);
        return;
    }
    
    showLoading();
    updatePrintStatus('printing');
    
    try {
        const success = await attemptSilentPrint(sscc, accumulatedCopies);
        
                 if (success) {
             // Add to printed list
             printedSSCCs.add(sscc);
             savePrintedSSCCs();
             
             // Show success and reset after confirmation
             updatePrintStatus('ready');
             showSuccessMessage();
             
             // Clear input and reset copies after brief delay for user to see success
             setTimeout(() => {
                 clearInput();
                 clearCopyTotal();
                 focusInput();
             }, 1500);
         } else {
             // Fallback to regular print
             const printSuccess = await regularPrint(sscc, accumulatedCopies);
             if (printSuccess) {
                 printedSSCCs.add(sscc);
                 savePrintedSSCCs();
                 showSuccessMessage();
                 
                 setTimeout(() => {
                     clearInput();
                     clearCopyTotal();
                     focusInput();
                 }, 1500);
             }
         }
    } catch (error) {
        showError(translations[currentLanguage]['print-error']);
        updatePrintStatus('error');
    } finally {
        hideLoading();
    }
}

async function attemptSilentPrint(sscc, quantity) {
    try {
        // Enhanced silent printing with better background operation support
        if ('print' in window && typeof window.print === 'function') {
            const printContent = await generatePrintContent(sscc, quantity);
            
            // Create a hidden iframe optimized for background printing
            const iframe = document.createElement('iframe');
            iframe.style.cssText = `
                position: absolute;
                top: -9999px;
                left: -9999px;
                width: 210mm;
                height: 297mm;
                opacity: 0.01;
                pointer-events: none;
                border: none;
                z-index: -1000;
            `;
            
            // Set iframe attributes for better compatibility with thermal printers
            iframe.setAttribute('sandbox', 'allow-modals allow-scripts allow-same-origin');
            iframe.setAttribute('aria-hidden', 'true');
            
            document.body.appendChild(iframe);
            
            // Wait for iframe to be ready and load content
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(printContent);
            iframeDoc.close();
            
            // Wait for content to load with longer timeout for thermal printers
            await new Promise(resolve => {
                iframe.onload = resolve;
                // Extended timeout for thermal printer compatibility
                setTimeout(resolve, 2000);
            });
            
            // Silent print with thermal printer optimization
            try {
                const iframeWindow = iframe.contentWindow;
                
                // Set up print event handlers for better detection
                let printCompleted = false;
                
                iframeWindow.addEventListener('beforeprint', () => {
                    // Print is starting
                });
                
                iframeWindow.addEventListener('afterprint', () => {
                    printCompleted = true;
                });
                
                // Focus and print with thermal printer delay
                iframeWindow.focus();
                
                // Add delay for thermal printer initialization
                setTimeout(() => {
                    iframeWindow.print();
                }, 1000);
                
                // Enhanced cleanup with extended delay for thermal printers
                setTimeout(() => {
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                    }
                }, 8000);
                
                return true;
            } catch (printError) {
                // Clean up on error
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
                return false;
            }
        }
    } catch (error) {
        return false;
    }
    
    return false;
}

async function regularPrint(sscc, quantity) {
    // Fallback to regular printing method optimized for thermal printers
    const printContent = await generatePrintContent(sscc, quantity);
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
        throw new Error('Print window blocked');
    }
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Add delay for thermal printer initialization
    setTimeout(() => {
        printWindow.print();
    }, 1500);
    
    // Auto-close after print with extended delay for thermal printers
    setTimeout(() => {
        try {
            printWindow.close();
        } catch (e) {
            // Window may already be closed
        }
    }, 5000);
    
    return true; // Assume success for fallback method
}

// --- Printer Settings Functions ---
function openPrinterSettings() {
    // Create optimized test print content for Zebra ZD411 thermal printer
    try {
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Zebra ZD411 Test Print</title>
                <style>
                    @page {
                        size: 50mm 30mm;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: Arial, sans-serif;
                        background: white;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .test-label {
                        width: 50mm;
                        height: 30mm;
                        box-sizing: border-box;
                        margin: 0;
                        padding: 1mm;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        page-break-after: always;
                        background: white;
                        border: 1px solid #000;
                        font-size: 8px;
                        line-height: 1.2;
                    }
                    .test-label:last-child {
                        page-break-after: avoid;
                    }
                    .label-title {
                        font-size: 10px;
                        font-weight: bold;
                        margin-bottom: 1mm;
                        color: black;
                    }
                    .label-content {
                        font-size: 7px;
                        color: black;
                        margin: 0.5mm 0;
                    }
                    .label-divider {
                        border-top: 1px solid #000;
                        margin: 1mm 0;
                        width: 100%;
                    }
                    @media print {
                        body { background: white !important; }
                        .test-label { background: white !important; border: 1px solid #000 !important; }
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    }
                </style>
            </head>
            <body>
                <!-- Label 1: Printer Info -->
                <div class="test-label">
                    <div class="label-title">ZEBRA ZD411</div>
                    <div class="label-content">THERMAL PRINTER</div>
                    <div class="label-divider"></div>
                    <div class="label-content">TEST PRINT</div>
                    <div class="label-content">LABEL 1/5</div>
                </div>
                
                <!-- Label 2: Settings -->
                <div class="test-label">
                    <div class="label-title">PRINTER SETTINGS</div>
                    <div class="label-divider"></div>
                    <div class="label-content">PAPER: 50mm x 30mm</div>
                    <div class="label-content">ORIENTATION: LANDSCAPE</div>
                    <div class="label-content">MARGINS: NONE</div>
                    <div class="label-content">LABEL 2/5</div>
                </div>
                
                <!-- Label 3: DPI Info -->
                <div class="test-label">
                    <div class="label-title">RESOLUTION</div>
                    <div class="label-divider"></div>
                    <div class="label-content">DPI: 203</div>
                    <div class="label-content">OPTIMIZED FOR</div>
                    <div class="label-content">THERMAL PRINTING</div>
                    <div class="label-content">LABEL 3/5</div>
                </div>
                
                <!-- Label 4: Usage -->
                <div class="test-label">
                    <div class="label-title">USAGE GUIDE</div>
                    <div class="label-divider"></div>
                    <div class="label-content">SCAN SSCC NUMBER</div>
                    <div class="label-content">SELECT COPIES</div>
                    <div class="label-content">AUTO PRINT</div>
                    <div class="label-content">LABEL 4/5</div>
                </div>
                
                <!-- Label 5: Status -->
                <div class="test-label">
                    <div class="label-title">STATUS</div>
                    <div class="label-divider"></div>
                    <div class="label-content">READY FOR</div>
                    <div class="label-content">WAREHOUSE USE</div>
                    <div class="label-content">LABEL 5/5</div>
                </div>
            </body>
            </html>
        `;
        
        const printWindow = window.open('', '_blank', 'width=600,height=400');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            
            // Trigger print dialog which will show printer settings
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
            }, 100);
        } else {
            // Fallback: try to trigger print on current window
            window.print();
        }
    } catch (error) {
        // Fallback to current window print dialog
        window.print();
    }
}

// Old showPrinterSettingsDialog function removed - replaced with direct print dialog access 