# <img src="Qunatix-LOGO.png" alt="Quantix Logo" width="36" style="vertical-align:middle"/> Quantix — Scientific Calculator

> **Precision Meets Intelligence** — A feature-rich, browser-based scientific calculator with graphing, math tools, and voice input.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

---

For Testing Purpose You Can Visit :- https://quantixbysoumik.netlify.app/

## ✨ Features

| Tab | What it does |
|-----|-------------|
| **Standard** | Basic arithmetic with memory (MC / MR / M+ / M−) |
| **Scientific** | Trig, log, hyperbolic, floor/ceil, modulo, random & more |
| **Advanced** | Summation (Σ), differentiation, integration |
| **Converter** | Decimal ↔ Binary ↔ Octal ↔ Hexadecimal |
| **Graph** | Multi-function plotter — drag to pan, scroll to zoom |
| **Math Tools** | P&C, Inequalities, Quadratic Solver, Binomial Theorem, Relations & Functions |

### Extra goodies
- 🎤 **Voice Input** — speak your calculation
- 🌓 **Dark / Light theme** toggle
- 🕐 **Live clock** in the header
- 📋 **Copy result** to clipboard
- 🕘 **Calculation history** panel

---

## 📁 Project Structure

```
Quantix-Pro-Scientific-Calculator/
├── index.html        # App shell & tab layout
├── style.css         # Global design tokens & component styles
├── script.js         # Calculator logic, graphing, voice, history
├── math-tools.css    # Styles for the Math Tools panel
├── math-tools.js     # Math Tools panel logic
└── Qunatix-LOGO.png  # App logo / favicon
```

---

## 🚀 Getting Started

### Run locally
Just open `index.html` in any modern browser — no build step, no dependencies.

```bash
# Clone the repo
git clone https://github.com/<your-username>/quantix.git
cd quantix

# Open in browser (macOS)
open index.html

# Open in browser (Linux)
xdg-open index.html

# Open in browser (Windows)
start index.html
```

### VS Code Live Server (recommended for development)
1. Install the **Live Server** extension in VS Code.
2. Right-click `index.html` → **Open with Live Server**.
3. The page hot-reloads on every save.

---

## 🛠️ Math Tools Reference

### Permutations & Combinations
- **ⁿPᵣ** = n! / (n−r)!
- **ⁿCᵣ** = n! / (r! × (n−r)!)

### Inequality Solver
- Linear, Quadratic (discriminant method), Wavy Curve, Modulus, Double inequalities

### Quadratic Solver
Given **ax² + bx + c = 0**:
- Discriminant · Roots · Vertex · Vertex form · Sum & Product of roots

### Binomial Theorem
- General term: **Tᵣ₊₁ = ⁿCᵣ × aⁿ⁻ʳ × bʳ**
- Full expansion table for (a + b)ⁿ

### Relations & Functions
- Domain, Range, Injectivity, Surjectivity checker with arrow-diagram visualisation

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary font | Inter |
| Mono font | JetBrains Mono |
| Accent (cyan) | `#00d4ff` |
| Accent (violet) | `#a855f7` |
| Border radius | `8px / 12px` |

---

## 📜 License

MIT © 2026 Quantix. Free to use and modify.
