# MarkDown Designer

<p align="center">
  <img src="Web/favicon.png" alt="MarkDown Designer Logo" width="120" height="120">
</p>

<p align="center">
  <strong>A premium, client-side Markdown editor with designer themes and export capabilities</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#themes">Themes</a>
</p>

---

## Features

**Real-time Preview** — See your markdown rendered instantly as you type

**Designer Themes** — Three beautiful themes to choose from:
- **Minimalist Light** — Clean, modern aesthetic
- **Cyberpunk Dark** — Neon-inspired dark mode with glow effects
- **Swiss Design** — Bold typography with classic red accents

**Export Options**
- **PDF** — Generate professional PDFs with proper pagination
- **HTML** — Standalone HTML files with embedded styles
- **Markdown** — Download your raw `.md` files

**Auto-Save** — Your work is automatically saved to local storage

**Responsive Design** — Works beautifully on desktop and mobile

**100% Client-Side** — No server required, your data stays private

## Demo

Simply open `index.html` in your browser to start using MarkDown Designer.

## Installation

### Option 1: Direct Use
1. Download or clone this repository
2. Open `index.html` in your browser
3. Start writing!

### Option 2: Serve Locally
```bash
# Clone the repository
git clone https://github.com/Mohammad-Faiz-Cloud-Engineer/MarkDownDesigner.git

# Navigate to the directory
cd MarkDownDesigner

# Serve with Python
python3 -m http.server 8080

# Open http://localhost:8080 in your browser
```

## Usage

### Editor
- Write your markdown in the left pane
- See real-time preview in the right pane
- Use the resizer to adjust pane sizes

### Document Settings
- Click the menu icon to open the sidebar
- Add document metadata (Title, Author, Date)
- Choose which metadata to include in exports

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl + S` | Save document |
| `Ctrl + P` | Export as PDF |
| `Escape` | Close sidebar |

## Themes

### Minimalist Light
Clean, professional appearance with subtle shadows and a light color palette.

### Cyberpunk Dark
Dark mode with neon cyan and magenta accents, perfect for late-night coding.

### Swiss Design
Inspired by Swiss typography, featuring bold fonts, strong contrast, and iconic red accents.

## Technologies

- **Vanilla JavaScript** — No frameworks, pure ES6+
- **CSS Variables** — Dynamic theming system
- **marked.js** — Markdown parsing
- **highlight.js** — Code syntax highlighting
- **jsPDF** — PDF generation
- **html2canvas** — HTML to canvas rendering

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

MIT License — feel free to use this project for personal or commercial purposes.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Mohammad-Faiz-Cloud-Engineer">Mohammad Faiz</a>
</p>
