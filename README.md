# SSCC QR Code Generator

A high-performance web application for generating QR code stickers from SSCC (Serial Shipping Container Code) numbers. Designed for warehouse environments with 1000+ daily operations across 20+ users.

## 🎯 Features

### Core Functionality
- **SSCC Input**: Auto-focused input field optimized for handheld scanners
- **QR Code Generation**: Instant QR code creation with real-time preview
- **One-Click Printing**: 1, 5, 10, or 20 copies with automatic print jobs
- **Sticker Design**: 5.5cm x 3.1cm landscape format with QR code, last 5 digits, and unique symbol

### Smart Features
- **Duplicate Detection**: Warns when SSCC was already printed today
- **Auto-Clear**: 5-second delay after printing for next job
- **Printer Memory**: Remembers selected printer per device
- **Language Toggle**: Instant EN/DE switching
- **Unique Symbols**: Visual identification symbols generated per SSCC

### Power User Features
- **Keyboard Shortcuts**:
  - `ESC` - Clear all fields
  - `Enter` - Print 1 copy
  - `Spacebar` - Repeat last print quantity
  - `F1-F4` - Quick print (1, 5, 10, 20 copies)
- **Status Indicators**: Print status and connection monitoring
- **Touch Optimized**: Large buttons for touch devices
- **Responsive Design**: Works on all screen sizes

## 🚀 Quick Start

### For Local Testing
1. Download all files (`index.html`, `styles.css`, `script.js`)
2. Open `index.html` in a modern web browser
3. Select a printer when prompted
4. Start scanning SSCC numbers!

### For Production Deployment
1. Upload files to your web server (e.g., `midiqr.aiconsy.com`)
2. Ensure HTTPS is enabled for printer access
3. Configure printer settings on each device
4. Ready for warehouse operations!

## 📱 How to Use

### Basic Operation
1. **Scan SSCC**: Use handheld scanner or type SSCC number
2. **Preview**: QR code appears instantly with last 5 digits and unique symbol
3. **Select Copies**: Click 1, 5, 10, or 20 button
4. **Auto Print**: Stickers print automatically to selected printer
5. **Next Job**: Input clears after 5 seconds for next SSCC

### First-Time Setup
1. **Language**: Click 🌍 button to switch between EN/DE
2. **Printer**: Select printer from dropdown (remembers choice)
3. **Test Print**: Try with sample SSCC number

### Advanced Usage
- **Multiple Users**: Each device remembers its own printer preference
- **Daily Reset**: Duplicate tracking resets daily automatically
- **Error Recovery**: Clear error messages with ESC key
- **Batch Operations**: Print 21 stickers by clicking 1 + 20 buttons

## 🛠 Technical Specifications

### Browser Requirements
- Modern browsers (Chrome, Firefox, Edge, Safari)
- JavaScript enabled
- Local storage support
- Printer access (HTTPS recommended)

### Dependencies
- QRCode.js (loaded via CDN)
- No other external libraries required

### Supported Characters
- All standard SSCC characters
- Special characters and spaces
- Unicode symbols for visual identification

### Print Specifications
- **Sticker Size**: 5.5cm x 3.1cm (landscape)
- **QR Code**: High-density, optimized for scanning
- **Text**: Last 5 digits in large, bold font
- **Symbol**: Unique visual identifier per SSCC

## 🔧 Customization

### Adding More Printers
Edit the `simulatedPrinters` array in `script.js`:
```javascript
const simulatedPrinters = [
  'Your Printer Name Here',
  'Another Printer Model'
];
```

### Changing Languages
Add new language to `translations` object in `script.js`:
```javascript
const translations = {
  en: { /* English translations */ },
  de: { /* German translations */ },
  fr: { /* Your French translations */ }
};
```

### Sticker Layout
Modify print styles in `generatePrintContent()` function for different layouts.

## 📞 Support

This Micro SAAS was built by [aiconsy.com](https://aiconsy.com)

For support or customization requests, visit our website.

## 🔒 Privacy & Security

- All data stored locally in browser
- No external API calls (except QR library CDN)
- SSCC numbers never transmitted to external servers
- Daily automatic cleanup of duplicate tracking 