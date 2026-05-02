/**
 * Quantix Scientific Calculator — script.js
 * Author: Senior Full-Stack Dev
 * Architecture: Modular, event-driven, zero external dependencies
 */

'use strict';

/* ============================================================
   STATE
   ============================================================ */
const State = {
  expression: '0',       // Current display expression string
  result: '',            // Live preview result
  memory: 0,             // Memory register
  angleMode: 'rad',      // 'rad' | 'deg'
  history: [],           // Array of { expr, result }
  isNewEntry: true,      // Whether next digit starts fresh
  lastWasEq: false,      // Did user just press "="
  pendingPostfix: null,  // Pending suffix for sci functions (e.g. ')²', '!')
};

/* ============================================================
   DOM REFERENCES
   ============================================================ */
const $ = id => document.getElementById(id);

const DOM = {
  expression:    $('expression'),
  result:        $('result'),
  memIndicator:  $('memIndicator'),
  angleMode:     $('angleMode'),
  voiceIndicator:$('voiceIndicator'),
  digitCount:    $('digitCount'),
  numberCount:   $('numberCount'),
  ansDigitCount: $('ansDigitCount'),
  historyList:   $('historyList'),
  historyPanel:  $('historyPanel'),
  historyToggle: $('historyToggle'),
  clearHistory:  $('clearHistory'),
  themeToggle:   $('themeToggle'),
  voiceBtn:      $('voiceBtn'),
  voiceModal:    $('voiceModal'),
  voiceCancel:   $('voiceCancel'),
  copyBtn:       $('copyBtn'),
  radBtn:        $('radBtn'),
  degBtn:        $('degBtn'),
  // Converter
  convInput:     $('convInput'),
  decVal:        $('decVal'),
  binVal:        $('binVal'),
  octVal:        $('octVal'),
  hexVal:        $('hexVal'),
  // Advanced
  diffFn:        $('diffFn'),
  diffX:         $('diffX'),
  diffResult:    $('diffResult'),
  intFn:         $('intFn'),
  intA:          $('intA'),
  intB:          $('intB'),
  intResult:     $('intResult'),
  // Graph
  graphCanvas:   $('graphCanvas'),
  graphTooltip:  $('graphTooltip'),
  fnList:        $('fnList'),
  addFnBtn:      $('addFnBtn'),
  graphXMin:     $('graphXMin'),
  graphXMax:     $('graphXMax'),
  plotBtn:       $('plotBtn'),
};

/* ============================================================
   DISPLAY ENGINE
   ============================================================ */
const Display = {
  /**
   * Render the current State to DOM
   */
  render() {
    let exprText = State.expression;
    DOM.expression.textContent = exprText;

    // Scale font for long expressions
    const len = exprText.length;
    if (len > 20)      DOM.expression.style.fontSize = 'clamp(0.8rem, 2.5vw, 1.1rem)';
    else if (len > 12) DOM.expression.style.fontSize = 'clamp(1rem, 3vw, 1.5rem)';
    else               DOM.expression.style.fontSize = '';

    DOM.result.textContent = State.result;
    DOM.memIndicator.textContent = State.memory !== 0 ? `M: ${State.memory}` : '';
    DOM.angleMode.textContent = State.angleMode.toUpperCase();

    // ── Pending sci-function badge ────────────────────────────
    let pendingBadge = document.getElementById('sciPendingBadge');
    if (State.pendingPostfix) {
      if (!pendingBadge) {
        pendingBadge = document.createElement('span');
        pendingBadge.id = 'sciPendingBadge';
        pendingBadge.className = 'sci-pending-badge';
        DOM.angleMode.parentNode.appendChild(pendingBadge);
      }
      pendingBadge.innerHTML = `<span class="spb-icon">ƒ</span> …${State.pendingPostfix}`;
    } else if (pendingBadge) {
      pendingBadge.remove();
    }

    // ── Counter badges in status bar ─────────────────────────
    // Badge 1 (blue): total individual digits across whole expression
    //   "85+36" → "4 digits"
    // Badge 2 (green): number of operand-numbers between operators
    //   "85+36" → "2 numbers"
    const allDigitMatches = exprText.match(/[0-9]/g);
    const totalDigits = allDigitMatches ? allDigitMatches.length : 0;

    const tokens = exprText
      .split(/[+\-−×÷*/^%()\s]+/)
      .map(t => t.trim())
      .filter(t => t !== '' && /\d/.test(t));
    const numCount = tokens.length;

    if (totalDigits > 0) {
      DOM.digitCount.textContent = `${totalDigits} digit${totalDigits !== 1 ? 's' : ''}`;
      DOM.digitCount.classList.add('has-digits');
    } else {
      DOM.digitCount.textContent = '';
      DOM.digitCount.classList.remove('has-digits');
    }

    if (numCount > 0) {
      DOM.numberCount.textContent = `${numCount} number${numCount !== 1 ? 's' : ''}`;
      DOM.numberCount.classList.add('has-digits');
    } else {
      DOM.numberCount.textContent = '';
      DOM.numberCount.classList.remove('has-digits');
    }

    // ── Answer digit count (next to = result line) ────────────
    const resultStr = State.result.replace(/^=\s*/, '').trim();
    const ansDigits = (resultStr.match(/[0-9]/g) || []).length;
    if (ansDigits > 0 && State.result !== '') {
      DOM.ansDigitCount.textContent = `${ansDigits}d`;
      DOM.ansDigitCount.classList.add('visible');
    } else {
      DOM.ansDigitCount.textContent = '';
      DOM.ansDigitCount.classList.remove('visible');
    }
  },

  /**
   * Flash error state
   */
  showError(msg = 'Error') {
    DOM.expression.textContent = msg;
    DOM.expression.classList.add('error');
    DOM.result.textContent = '';
    setTimeout(() => {
      DOM.expression.classList.remove('error');
      State.expression = '0';
      State.isNewEntry = true;
      Display.render();
    }, 1500);
  },
};

/* ============================================================
   EXPRESSION SANITIZER
   Convert display symbols → JS-evaluable string
   ============================================================ */
function toJSExpr(expr) {
  return expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, `(${Math.PI})`)
    .replace(/\^/g, '**')
    .replace(/e(?!xp|\^)/g, `(${Math.E})`); // lone 'e' → Euler's
}

/* ============================================================
   SAFE EVALUATOR
   Evaluate a mathematical expression string safely.
   ============================================================ */
function safeEval(expr) {
  // Sanitize
  const cleaned = toJSExpr(expr);

  // Whitelist: only allow safe math characters
  if (/[^0-9+\-*/().,%!E eπsincotagqrblfhkdux^_\s]/.test(cleaned)) {
    throw new Error('Invalid expression');
  }

  try {
    // Use Function constructor for controlled eval
    // eslint-disable-next-line no-new-func
    const fn = new Function(
      'Math', 'PI', 'E',
      `"use strict"; return (${cleaned});`
    );
    const val = fn(Math, Math.PI, Math.E);
    if (typeof val !== 'number' || isNaN(val)) throw new Error('NaN');
    return val;
  } catch {
    throw new Error('Invalid expression');
  }
}

/* ============================================================
   MATH HELPERS
   ============================================================ */
const MathLib = {

  factorial(n) {
    n = Math.floor(Math.abs(n));
    if (n > 170) throw new Error('Overflow');
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  },

  /**
   * Numeric derivative using central difference h = 1e-7
   */
  differentiate(fnStr, x) {
    const h = 1e-7;
    const f = buildFn(fnStr);
    return (f(x + h) - f(x - h)) / (2 * h);
  },

  /**
   * Simpson's rule integration (n must be even)
   */
  integrate(fnStr, a, b, n = 1000) {
    if (n % 2 !== 0) n++;
    const f = buildFn(fnStr);
    const h = (b - a) / n;
    let sum = f(a) + f(b);
    for (let i = 1; i < n; i++) {
      const x = a + i * h;
      sum += (i % 2 === 0 ? 2 : 4) * f(x);
    }
    return (h / 3) * sum;
  },
};

/**
 * Build a single-variable function from a string expression.
 * variable: 'x' (default) or 'y'
 * NOTE: intentionally no "use strict" so that `with(Math)` works.
 */
function buildFn(fnStr, variable) {
  if (!fnStr || !fnStr.trim()) throw new Error('Empty function');
  const v = variable || 'x';

  // Normalise user input → valid JS
  let expr = fnStr.trim()
    .replace(/\^/g, '**')
    .replace(/π/g, 'PI')
    .replace(/\bln\s*\(/g, 'log(')
    .replace(/\blog10\s*\(/g, 'log10(')
    .replace(/\blog2\s*\(/g, 'log2(')
    .replace(new RegExp('(\\d)\\s*\\*?\\s*' + v, 'g'), '$1*' + v)
    .replace(new RegExp(v + '\\s*\\*?\\s*(\\d)', 'g'), v + '*$1');

  // Safety whitelist
  const allowed = /^[\sx y0-9+\-*/.(),PIE_]+$/i;
  const stripped = expr
    .replace(/\bsin\b|\bcos\b|\btan\b|\basin\b|\bacos\b|\batan\b/gi, '')
    .replace(/\bsqrt\b|\bcbrt\b|\babs\b|\bfloor\b|\bceil\b|\bround\b/gi, '')
    .replace(/\bsinh\b|\bcosh\b|\btanh\b/gi, '')
    .replace(/\blog10\b|\blog2\b|\blog\b|\bexp\b/gi, '')
    .replace(/\bmax\b|\bmin\b|\bpow\b/gi, '')
    .replace(/\bPI\b|\bE\b/g, '');

  if (!allowed.test(stripped)) {
    throw new Error('Invalid characters in function');
  }

  // Compile — no "use strict" so `with(Math)` works
  // eslint-disable-next-line no-new-func
  const compiled = new Function(v, 'Math',
    'with(Math){log10=function(v){return Math.log(v)/Math.log(10);}; return (' + expr + ');}'
  );

  return function(val) {
    return compiled(val, Math);
  };
}

/* ============================================================
   CORE CALCULATOR LOGIC
   ============================================================ */
const Calc = {

  appendToExpression(value) {
    if (State.isNewEntry || State.lastWasEq) {
      State.expression = value;
      State.isNewEntry = false;
      State.lastWasEq = false;
    } else {
      State.expression += value;
    }
    this.livePreview();
  },

  appendOp(op) {
    State.lastWasEq = false;
    const last = State.expression.slice(-1);
    const isOp = ['+', '−', '×', '÷'].includes(last);

    if (isOp) {
      // Replace last operator
      State.expression = State.expression.slice(0, -1) + op;
    } else {
      State.expression += op;
    }
    State.isNewEntry = false;
    this.livePreview();
  },

  appendDot() {
    if (State.isNewEntry) {
      State.expression = '0.';
      State.isNewEntry = false;
      return;
    }
    // Get current token (after last operator)
    const tokens = State.expression.split(/[+\-×÷]/);
    const lastToken = tokens[tokens.length - 1];
    if (!lastToken.includes('.')) {
      State.expression += '.';
    }
    this.livePreview();
  },

  applyScientific(fn) {
    State.lastWasEq = false;

    // Constants / operators — just append, no tab switch
    if (fn === 'pi')    { this.appendToExpression('π'); return; }
    if (fn === 'e')     { this.appendToExpression('e'); return; }
    if (fn === 'powY')  { this.appendToExpression('^'); return; }
    if (fn === 'mod')   { this.appendToExpression(' mod '); return; }

    /* ── Sci-function flow ──────────────────────────────────────────
       Every scientific function sets a prefix in the expression,
       optionally stores a pending postfix, then switches to the
       Standard tab so the user types the number and hits  =
       ─────────────────────────────────────────────────────────── */
    const sciFlows = {
      sin:       { expr: 'sin(',   postfix: ')',   newEntry: false },
      cos:       { expr: 'cos(',   postfix: ')',   newEntry: false },
      tan:       { expr: 'tan(',   postfix: ')',   newEntry: false },
      asin:      { expr: 'asin(',  postfix: ')',   newEntry: false },
      acos:      { expr: 'acos(',  postfix: ')',   newEntry: false },
      atan:      { expr: 'atan(',  postfix: ')',   newEntry: false },
      log:       { expr: 'log10(', postfix: ')',   newEntry: false },
      ln:        { expr: 'ln(',    postfix: ')',   newEntry: false },
      exp:       { expr: 'exp(',   postfix: ')',   newEntry: false },
      sqrt:      { expr: '√(',     postfix: ')',   newEntry: false },
      cbrt:      { expr: '∛(',     postfix: ')',   newEntry: false },
      abs:       { expr: '|',      postfix: '|',   newEntry: false },
      floor:     { expr: '⌊',      postfix: '⌋',   newEntry: false },
      ceil:      { expr: '⌈',      postfix: '⌉',   newEntry: false },
      round:     { expr: 'round(', postfix: ')',   newEntry: false },
      sign:      { expr: 'sgn(',   postfix: ')',   newEntry: false },
      log2:      { expr: 'log2(',  postfix: ')',   newEntry: false },
      sinh:      { expr: 'sinh(',  postfix: ')',   newEntry: false },
      cosh:      { expr: 'cosh(',  postfix: ')',   newEntry: false },
      tanh:      { expr: 'tanh(',  postfix: ')',   newEntry: false },
      pow2:      { expr: '(',      postfix: ')²',  newEntry: false },
      pow3:      { expr: '(',      postfix: ')³',  newEntry: false },
      inv:       { expr: '(1/(',   postfix: '))',  newEntry: false },
      factorial: { expr: '0',      postfix: '!',   newEntry: true  },
    };

    const flow = sciFlows[fn];
    if (!flow) return;

    State.expression      = flow.expr;
    State.pendingPostfix  = flow.postfix;
    State.isNewEntry      = flow.newEntry;
    State.result          = '';
    Display.render();

    // ── Switch to Standard tab so user can type the number ──
    switchToTab('standard');
    Toast.show(`${flow.expr}… type your number, then press =`);
  },

  evaluate() {
    // Apply any pending postfix (from sci function flow) before evaluating
    if (State.pendingPostfix) {
      State.expression += State.pendingPostfix;
      State.pendingPostfix = null;
    }

    const expr = State.expression;
    if (!expr || expr === '0') return;

    try {
      // Handle mod operator
      let evalExpr = expr.replace(/(\d+(?:\.\d+)?)\s*mod\s*(\d+(?:\.\d+)?)/g,
        (_, a, b) => `(${a} % ${b})`);

      // Handle display symbols for √ and ∛
      evalExpr = evalExpr
        .replace(/√\(([^)]+)\)/g, 'Math.sqrt($1)')
        .replace(/∛\(([^)]+)\)/g, 'Math.cbrt($1)')
        .replace(/\|([^|]+)\|/g, 'Math.abs($1)')
        .replace(/⌊([^⌋]+)⌋/g, 'Math.floor($1)')
        .replace(/⌈([^⌉]+)⌉/g, 'Math.ceil($1)')
        .replace(/sin\(([^)]+)\)/g, (_, v) =>
          State.angleMode === 'deg'
            ? `Math.sin(${v}*Math.PI/180)`
            : `Math.sin(${v})`)
        .replace(/cos\(([^)]+)\)/g, (_, v) =>
          State.angleMode === 'deg'
            ? `Math.cos(${v}*Math.PI/180)`
            : `Math.cos(${v})`)
        .replace(/tan\(([^)]+)\)/g, (_, v) =>
          State.angleMode === 'deg'
            ? `Math.tan(${v}*Math.PI/180)`
            : `Math.tan(${v})`)
        .replace(/asin\(([^)]+)\)/g, `Math.asin($1)`)
        .replace(/acos\(([^)]+)\)/g, `Math.acos($1)`)
        .replace(/atan\(([^)]+)\)/g, `Math.atan($1)`)
        .replace(/log10\(([^)]+)\)/g, 'Math.log10($1)')
        .replace(/log\(([^)]+)\)/g, 'Math.log10($1)')
        .replace(/ln\(([^)]+)\)/g, 'Math.log($1)')
        .replace(/exp\(([^)]+)\)/g, 'Math.exp($1)')
        .replace(/log2\(([^)]+)\)/g, 'Math.log2($1)')
        .replace(/sinh\(([^)]+)\)/g, 'Math.sinh($1)')
        .replace(/cosh\(([^)]+)\)/g, 'Math.cosh($1)')
        .replace(/tanh\(([^)]+)\)/g, 'Math.tanh($1)')
        .replace(/sgn\(([^)]+)\)/g, 'Math.sign($1)')
        .replace(/round\(([^)]+)\)/g, 'Math.round($1)')
        .replace(/(\d+(?:\.\d+)?)!/, (_, n) => MathLib.factorial(parseFloat(n)))
        .replace(/\(([^)]+)\)²/g, '($1)**2')
        .replace(/\(([^)]+)\)³/g, '($1)**3')
        .replace(/π/g, `(${Math.PI})`)
        .replace(/(?<![a-zA-Z])e(?![a-zA-Z])/g, `(${Math.E})`);

      // Replace display operators with JS ops
      evalExpr = evalExpr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-');

      // eslint-disable-next-line no-new-func
      const fn = new Function('"use strict"; return (' + evalExpr + ');');
      const rawResult = fn();

      if (!isFinite(rawResult) || isNaN(rawResult)) {
        Display.showError('Math Error');
        return;
      }

      const formatted = Format.number(rawResult);
      History.add(expr, formatted);
      State.expression = formatted;
      State.result = '';
      State.isNewEntry = true;
      State.lastWasEq = true;
      Display.render();

    } catch (err) {
      Display.showError('Syntax Error');
    }
  },

  livePreview() {
    try {
      const expr = State.expression;
      if (!expr || expr === '0') { State.result = ''; Display.render(); return; }

      // Include pending postfix in preview
      const previewRaw = State.pendingPostfix ? expr + State.pendingPostfix : expr;

      let preview = previewRaw
        .replace(/√\(([^)]+)\)/g, 'Math.sqrt($1)')
        .replace(/∛\(([^)]+)\)/g, 'Math.cbrt($1)')
        .replace(/\|([^|]+)\|/g, 'Math.abs($1)')
        .replace(/π/g, `(${Math.PI})`)
        .replace(/(?<![a-zA-Z])e(?![a-zA-Z])/g, `(${Math.E})`)
        .replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');

      // eslint-disable-next-line no-new-func
      const val = new Function('"use strict"; return (' + preview + ');')();
      if (isFinite(val) && !isNaN(val)) {
        State.result = `= ${Format.number(val)}`;
      } else {
        State.result = '';
      }
    } catch {
      State.result = '';
    }
    Display.render();
  },

  clear() {
    // If a sci function is pending and expression is just the prefix, cancel it
    if (State.pendingPostfix) {
      State.pendingPostfix = null;
      State.expression = '0';
      State.isNewEntry = true;
      State.result = '';
      Display.render();
      return;
    }
    const e = State.expression;
    if (e.length > 1) {
      State.expression = e.slice(0, -1) || '0';
    } else {
      State.expression = '0';
      State.isNewEntry = true;
    }
    State.result = '';
    this.livePreview();
  },

  allClear() {
    State.expression = '0';
    State.result = '';
    State.isNewEntry = true;
    State.lastWasEq = false;
    State.pendingPostfix = null;
    Display.render();
  },

  percent() {
    try {
      const val = parseFloat(State.expression);
      if (!isNaN(val)) {
        State.expression = Format.number(val / 100);
        State.isNewEntry = true;
        this.livePreview();
      }
    } catch { /* ignore */ }
  },

  random() {
    const r = Math.random();
    State.expression = Format.number(r);
    State.result = '';
    State.isNewEntry = true;
    Display.render();
    Toast.show('Random: ' + Format.number(r));
  },
};

/* ============================================================
   MEMORY FUNCTIONS
   ============================================================ */
const Memory = {
  mPlus() {
    try {
      const v = parseFloat(State.expression);
      if (!isNaN(v)) { State.memory += v; Display.render(); }
    } catch { /* ignore */ }
  },
  mMinus() {
    try {
      const v = parseFloat(State.expression);
      if (!isNaN(v)) { State.memory -= v; Display.render(); }
    } catch { /* ignore */ }
  },
  mr() {
    State.expression = Format.number(State.memory);
    State.isNewEntry = true;
    Calc.livePreview();
  },
  mc() {
    State.memory = 0;
    Display.render();
    Toast.show('Memory Cleared');
  },
};

/* ============================================================
   HISTORY
   ============================================================ */
const History = {
  add(expr, result) {
    const item = { expr, result, ts: Date.now() };
    State.history.unshift(item);
    if (State.history.length > 50) State.history.pop();
    this.render();
  },

  render() {
    const list = DOM.historyList;
    list.innerHTML = '';

    if (State.history.length === 0) {
      list.innerHTML = '<li class="history-empty">No calculations yet</li>';
      return;
    }

    State.history.forEach((item, idx) => {
      const li = document.createElement('li');
      li.className = 'history-item';
      li.innerHTML = `
        <div class="h-expr">${escHtml(item.expr)}</div>
        <div class="h-result">= ${escHtml(item.result)}</div>
      `;
      li.addEventListener('click', () => {
        State.expression = item.result;
        State.isNewEntry = true;
        State.result = '';
        Display.render();
      });
      list.appendChild(li);
    });
  },

  clear() {
    State.history = [];
    this.render();
  },
};

/* ============================================================
   NUMBER CONVERTER
   ============================================================ */
const Converter = {
  selectedBase: 10,

  // Allowed character sets per base
  VALID_CHARS: {
    2:  /^[01]+(\.[01]+)?$/,
    8:  /^[0-7]+(\.[0-7]+)?$/,
    10: /^-?[0-9]+(\.[0-9]+)?$/,
    16: /^[0-9A-Fa-f]+(\.[0-9A-Fa-f]+)?$/,
  },

  BASE_NAMES: { 2: 'Binary (Base-2)', 8: 'Octal (Base-8)', 10: 'Decimal (Base-10)', 16: 'Hexadecimal (Base-16)' },

  // Detect which base(s) this string is valid for (hints for alert)
  detectValidBases(raw) {
    return [2, 8, 10, 16].filter(b => this.VALID_CHARS[b].test(raw.trim()));
  },

  // Convert decimal float to another base (integer + fractional parts)
  decFloatToBase(decFloat, base, fracDigits = 8) {
    const neg    = decFloat < 0;
    const abs    = Math.abs(decFloat);
    const intPart  = Math.floor(abs);
    const fracPart = abs - intPart;

    let intStr  = intPart.toString(base).toUpperCase();
    let fracStr = '';
    if (fracPart > 0) {
      let frac = fracPart;
      let digits = 0;
      while (frac > 1e-10 && digits < fracDigits) {
        frac  *= base;
        const d = Math.floor(frac);
        fracStr += d.toString(base).toUpperCase();
        frac  -= d;
        digits++;
      }
    }
    const result = (neg ? '-' : '') + intStr + (fracStr ? '.' + fracStr : '');
    return result;
  },

  // Parse a float from any base
  parseBaseFloat(str, base) {
    const parts = str.split('.');
    const intVal = parseInt(parts[0], base);
    if (isNaN(intVal)) return NaN;
    if (parts.length === 1) return intVal;
    // Fractional part
    let frac = 0;
    const fracStr = parts[1];
    for (let i = 0; i < fracStr.length; i++) {
      const d = parseInt(fracStr[i], base);
      if (isNaN(d)) return NaN;
      frac += d / Math.pow(base, i + 1);
    }
    return intVal + frac;
  },

  // Convert decimal to fraction string (p/q) if clean, else round to 3 decimal places
  toFracOrDec(val) {
    if (Number.isInteger(val)) return val.toString();
    // Try to find fraction with small denominator
    for (let d = 2; d <= 256; d++) {
      const n = Math.round(val * d);
      if (Math.abs(n / d - val) < 1e-9) {
        const g = (a, b) => b === 0 ? a : g(b, a % b);
        const gv = g(Math.abs(n), d);
        return `${n/gv}/${d/gv}`;
      }
    }
    return val.toFixed(3);
  },

  _lastAlertTime: 0,

  showAlert(msg) {
    // Debounce: don't spam alerts
    const now = Date.now();
    if (now - this._lastAlertTime < 800) return;
    this._lastAlertTime = now;
    // Show inline error banner instead of window.alert
    let banner = $('convAlert');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'convAlert';
      banner.style.cssText = 'background:rgba(239,68,68,0.12);border:1px solid #ef4444;border-radius:8px;padding:10px 14px;margin-top:10px;font-size:0.82rem;color:#ef4444;font-family:var(--font-ui,sans-serif);line-height:1.5;';
      DOM.convInput.parentElement.insertAdjacentElement('afterend', banner);
    }
    banner.innerHTML = `⚠️ ${msg}`;
    banner.style.display = 'block';
    clearTimeout(banner._timer);
    banner._timer = setTimeout(() => { banner.style.display = 'none'; }, 4000);
  },

  hideAlert() {
    const banner = $('convAlert');
    if (banner) banner.style.display = 'none';
  },

  convert() {
    const raw = DOM.convInput.value.trim();
    if (!raw) {
      [DOM.decVal, DOM.binVal, DOM.octVal, DOM.hexVal]
        .forEach(el => el.textContent = '—');
      this.hideAlert();
      return;
    }

    const base = this.selectedBase;
    const validRe = this.VALID_CHARS[base];

    // Validate characters
    if (!validRe.test(raw)) {
      // Find which chars are invalid
      const allowed = { 2:'0 and 1', 8:'0–7', 10:'0–9 (with optional dot)', 16:'0–9 and A–F' }[base];
      const validBases = this.detectValidBases(raw);
      let hint = '';
      if (validBases.length > 0) {
        hint = ` — This looks like a valid <b>${validBases.map(b => this.BASE_NAMES[b]).join(' or ')}</b> number.`;
      }
      this.showAlert(
        `"${raw}" is not valid ${this.BASE_NAMES[base]}.<br>` +
        `${this.BASE_NAMES[base]} only allows digits: <b>${allowed}</b>.` +
        hint
      );
      [DOM.decVal, DOM.binVal, DOM.octVal, DOM.hexVal]
        .forEach(el => { el.textContent = '—'; el.style.color = '#ef4444'; });
      return;
    }

    this.hideAlert();
    [DOM.decVal, DOM.binVal, DOM.octVal, DOM.hexVal]
      .forEach(el => el.style.color = '');

    try {
      const decVal = this.parseBaseFloat(raw, base);
      if (isNaN(decVal)) throw new Error('Parse failed');

      const isFloat = !Number.isInteger(decVal);

      // Decimal: show fraction if float
      DOM.decVal.textContent = isFloat
        ? `${decVal.toFixed(3)}  (${this.toFracOrDec(decVal)})`
        : decVal.toString(10);

      // Binary
      DOM.binVal.textContent = this.decFloatToBase(decVal, 2);

      // Octal
      DOM.octVal.textContent = this.decFloatToBase(decVal, 8);

      // Hex
      DOM.hexVal.textContent = this.decFloatToBase(decVal, 16);

    } catch {
      [DOM.decVal, DOM.binVal, DOM.octVal, DOM.hexVal]
        .forEach(el => el.textContent = 'Error');
    }
  },

  setBase(base) {
    this.selectedBase = parseInt(base);
    document.querySelectorAll('.base-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.base) === this.selectedBase);
    });
    this.convert();
  },
};

/* ============================================================
   GRAPH PLOTTER  —  Desmos-inspired
   Features: pan, scroll-zoom, multi-function, tick labels,
             crosshair tooltip, auto-fit, bold fonts
   ============================================================ */
const Grapher = {

  // Viewport state (world coordinates at canvas centre)
  cx: 0, cy: 0,       // centre of view in world coords
  scale: 60,          // pixels per unit

  // ── Multi-function list  [{ expr, compiled, color, type:'x'|'y' }]
  fns: [],
  palette: [
    '#00f0ff','#ff6b9d','#ffc048','#00ffaa',
    '#c084fc','#ff7043','#69ff47','#f06292',
    '#40c4ff','#ffeb3b'
  ],

  // Graph canvas theme: 'dark' | 'light'
  graphTheme: 'dark',

  // Interaction state
  dragging: false,
  dragStart: { x: 0, y: 0 },
  dragOrigin: { cx: 0, cy: 0 },

  /** Convert world coord → canvas pixel */
  toCanvas(wx, wy, W, H) {
    return {
      px: W / 2 + (wx - this.cx) * this.scale,
      py: H / 2 - (wy - this.cy) * this.scale,
    };
  },

  /** Convert canvas pixel → world coord */
  toWorld(px, py, W, H) {
    return {
      wx: this.cx + (px - W / 2) / this.scale,
      wy: this.cy - (py - H / 2) / this.scale,
    };
  },

  /** Main draw call */
  draw() {
    const canvas = DOM.graphCanvas;
    const ctx    = canvas.getContext('2d');
    const wrap   = canvas.parentElement;
    const W      = canvas.width  = wrap.clientWidth  || 600;
    const H      = canvas.height = wrap.clientHeight || 480;

    const isDark = this.graphTheme === 'dark';

    // ── Background — always white in light mode, dark in dark mode ─
    ctx.fillStyle = isDark ? '#0a0e1a' : '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // ── Grid & Axes ─────────────────────────────────────────
    this._drawGrid(ctx, W, H, isDark);

    // ── Functions ───────────────────────────────────────────
    this.fns.forEach(fn => {
      if (fn.compiled) {
        if (fn.type === 'y') {
          this._drawCurveY(ctx, W, H, fn.compiled, fn.color);
        } else {
          this._drawCurve(ctx, W, H, fn.compiled, fn.color);
        }
      }
    });
  },

  _drawGrid(ctx, W, H, isDark) {
    // ── Pick a nice major step ──────────────────────────────
    const rawStep   = (W / this.scale) / 8;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const nice      = [1, 2, 5, 10];
    let majorStep   = magnitude;
    for (const n of nice) {
      if (magnitude * n >= rawStep) { majorStep = magnitude * n; break; }
    }
    const minorStep = majorStep / 5; // 5 minor divisions per major

    const xLeft  = this.cx - W / (2 * this.scale);
    const xRight = this.cx + W / (2 * this.scale);
    const yBot   = this.cy - H / (2 * this.scale);
    const yTop   = this.cy + H / (2 * this.scale);

    // Light mode: white bg, dark grid, light-red minor, deep-orange bold axes
    // Dark mode: dark bg, subtle white grid
    const minorColor    = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(220,50,50,0.12)';
    const majorColor    = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(10,10,10,0.35)';
    const axisColor     = isDark ? 'rgba(255,255,255,0.55)' : '#e05a00';   // deep orange axes
    const tickColor     = isDark ? 'rgba(200,220,255,0.85)' : 'rgba(30,30,30,0.85)';
    const labelColor    = isDark ? 'rgba(200,220,255,0.85)' : 'rgba(30,30,30,0.85)';
    const axisNameColor = isDark ? '#7dd3fc'                : '#e05a00';
    const originColor   = isDark ? 'rgba(200,220,255,0.5)'  : 'rgba(80,80,80,0.65)';

    // ── Minor grid lines ────────────────────────────────────
    ctx.strokeStyle = minorColor;
    ctx.lineWidth   = 0.75;
    let startX = Math.ceil(xLeft  / minorStep) * minorStep;
    let startY = Math.ceil(yBot   / minorStep) * minorStep;
    for (let x = startX; x <= xRight + minorStep; x += minorStep) {
      const { px } = this.toCanvas(x, 0, W, H);
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
    }
    for (let y = startY; y <= yTop + minorStep; y += minorStep) {
      const { py } = this.toCanvas(0, y, W, H);
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
    }

    // ── Major grid lines ────────────────────────────────────
    ctx.strokeStyle = majorColor;
    ctx.lineWidth   = 1;
    startX = Math.ceil(xLeft / majorStep) * majorStep;
    startY = Math.ceil(yBot  / majorStep) * majorStep;
    for (let x = startX; x <= xRight + majorStep; x += majorStep) {
      const { px } = this.toCanvas(x, 0, W, H);
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
    }
    for (let y = startY; y <= yTop + majorStep; y += majorStep) {
      const { py } = this.toCanvas(0, y, W, H);
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
    }

    // ── Axes ────────────────────────────────────────────────
    const origin = this.toCanvas(0, 0, W, H);
    ctx.strokeStyle = axisColor;
    ctx.lineWidth   = isDark ? 1.8 : 2.5;  // bold orange in light mode
    ctx.beginPath(); ctx.moveTo(0, origin.py); ctx.lineTo(W, origin.py); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(origin.px, 0); ctx.lineTo(origin.px, H); ctx.stroke();

    // Axis arrows
    ctx.fillStyle = axisColor;
    ctx.beginPath();
    ctx.moveTo(W - 2, origin.py);
    ctx.lineTo(W - 11, origin.py - 5); ctx.lineTo(W - 11, origin.py + 5); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(origin.px, 2);
    ctx.lineTo(origin.px - 5, 11); ctx.lineTo(origin.px + 5, 11); ctx.fill();

    // ── Tick marks + labels ─────────────────────────────────
    ctx.fillStyle    = tickColor;
    ctx.font         = 'bold 11px "Share Tech Mono", monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';

    startX = Math.ceil(xLeft / majorStep) * majorStep;
    for (let x = startX; x <= xRight + majorStep; x += majorStep) {
      if (Math.abs(x) < majorStep * 0.01) continue;
      const { px } = this.toCanvas(x, 0, W, H);
      ctx.strokeStyle = tickColor;
      ctx.lineWidth   = 1;
      ctx.beginPath(); ctx.moveTo(px, origin.py - 5); ctx.lineTo(px, origin.py + 5); ctx.stroke();
      const labelY = Math.min(Math.max(origin.py + 7, 4), H - 18);
      ctx.fillStyle = labelColor;
      ctx.fillText(this._niceLabel(x), px, labelY);
    }

    ctx.textAlign    = 'right';
    ctx.textBaseline = 'middle';
    startY = Math.ceil(yBot / majorStep) * majorStep;
    for (let y = startY; y <= yTop + majorStep; y += majorStep) {
      if (Math.abs(y) < majorStep * 0.01) continue;
      const { py } = this.toCanvas(0, y, W, H);
      ctx.strokeStyle = tickColor;
      ctx.lineWidth   = 1;
      ctx.beginPath(); ctx.moveTo(origin.px - 5, py); ctx.lineTo(origin.px + 5, py); ctx.stroke();
      const labelX = Math.min(Math.max(origin.px - 7, 30), W - 4);
      ctx.fillStyle = labelColor;
      ctx.fillText(this._niceLabel(y), labelX, py);
    }

    // Axis name labels
    ctx.fillStyle    = axisNameColor;
    ctx.font         = 'bold 13px "Share Tech Mono", monospace';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('x', W - 10, origin.py - 7);
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('y', origin.px + 7, 4);

    // Origin label
    ctx.fillStyle    = originColor;
    ctx.font         = 'bold 10px "Share Tech Mono", monospace';
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('0', origin.px - 6, origin.py + 5);
  },

  _niceLabel(v) {
    // Return clean string (avoid float noise like 0.10000000001)
    if (Math.abs(v) < 1e-9) return '0';
    const s = parseFloat(v.toPrecision(6)).toString();
    return s;
  },

  _drawCurve(ctx, W, H, fn, color) {
    const steps = W * 1.5;
    const xLeft  = this.cx - W / (2 * this.scale);
    const xRight = this.cx + W / (2 * this.scale);
    const dx = (xRight - xLeft) / steps;

    // Clamp y output to avoid absurd values ruining the viewport
    const yMin = this.cy - H / (2 * this.scale) * 20;
    const yMax = this.cy + H / (2 * this.scale) * 20;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2.5;
    ctx.shadowColor = color;
    ctx.shadowBlur  = 6;
    ctx.lineJoin    = 'round';

    let penDown = false;
    let prevY   = null;

    for (let i = 0; i <= steps; i++) {
      const wx = xLeft + i * dx;
      let wy;
      try { wy = fn(wx); } catch { wy = NaN; }

      if (!isFinite(wy) || isNaN(wy) || wy < yMin || wy > yMax) {
        penDown = false;
        prevY   = null;
        continue;
      }

      // Detect vertical asymptote — big jump → lift pen
      if (prevY !== null && Math.abs(wy - prevY) > H / this.scale * 0.8) {
        penDown = false;
      }
      prevY = wy;

      const { px, py } = this.toCanvas(wx, wy, W, H);
      if (!penDown) { ctx.moveTo(px, py); penDown = true; }
      else           ctx.lineTo(px, py);
    }

    ctx.stroke();
    ctx.shadowBlur = 0;
  },

  /** Draw f(y) — x is computed from y (horizontal sweep) */
  _drawCurveY(ctx, W, H, fn, color) {
    const steps  = H * 1.5;
    const yBot   = this.cy - H / (2 * this.scale);
    const yTop   = this.cy + H / (2 * this.scale);
    const dy     = (yTop - yBot) / steps;

    const xMin = this.cx - W / (2 * this.scale) * 20;
    const xMax = this.cx + W / (2 * this.scale) * 20;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2.5;
    ctx.shadowColor = color;
    ctx.shadowBlur  = 6;
    ctx.lineJoin    = 'round';

    let penDown = false;
    let prevX   = null;

    for (let i = 0; i <= steps; i++) {
      const wy = yBot + i * dy;
      let wx;
      try { wx = fn(wy); } catch { wx = NaN; }

      if (!isFinite(wx) || isNaN(wx) || wx < xMin || wx > xMax) {
        penDown = false; prevX = null; continue;
      }
      if (prevX !== null && Math.abs(wx - prevX) > W / this.scale * 0.8) {
        penDown = false;
      }
      prevX = wx;

      const { px, py } = this.toCanvas(wx, wy, W, H);
      if (!penDown) { ctx.moveTo(px, py); penDown = true; }
      else           ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  },
  drawCrosshair(mouseX, mouseY, W, H) {
    const canvas = DOM.graphCanvas;
    const ctx    = canvas.getContext('2d');
    const { wx, wy: _wy } = this.toWorld(mouseX, mouseY, W, H);

    // Draw vertical crosshair line
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(mouseX, 0); ctx.lineTo(mouseX, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, mouseY); ctx.lineTo(W, mouseY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Tooltip: show x and y value of every active function
    const tooltip = DOM.graphTooltip;
    const parts   = [`<b>x = ${this._niceLabel(parseFloat(wx.toPrecision(5)))}</b>`];

    this.fns.forEach((fn, idx) => {
      if (!fn.compiled) return;
      try {
        const y = fn.compiled(wx);
        if (isFinite(y)) {
          parts.push(
            `<span style="color:${fn.color};font-weight:700">` +
            `f${idx + 1} = ${this._niceLabel(parseFloat(y.toPrecision(5)))}` +
            `</span>`
          );
        }
      } catch { /* skip */ }
    });

    tooltip.innerHTML  = parts.join('  ');
    tooltip.classList.add('visible');

    // Position tooltip near cursor but keep inside canvas
    let tx = mouseX + 14;
    let ty = mouseY - 36;
    if (tx + 180 > W) tx = mouseX - 190;
    if (ty < 0)       ty = mouseY + 10;
    tooltip.style.left = tx + 'px';
    tooltip.style.top  = ty + 'px';
  },

  /** Recompile a single function slot by index and redraw */
  updateFn(idx, expr) {
    if (!this.fns[idx]) return;
    this.fns[idx].expr = expr;
    if (!expr.trim()) {
      this.fns[idx].compiled = null;
    } else {
      try   { this.fns[idx].compiled = buildFn(expr, this.fns[idx].type); }
      catch { this.fns[idx].compiled = null; }
    }
    this.draw();
  },

  /** Add a new empty function slot */
  addFn() {
    const color = this.palette[this.fns.length % this.palette.length];
    this.fns.push({ expr: '', compiled: null, color, type: 'x' });
  },

  /** Remove a function slot by index */
  removeFn(idx) {
    this.fns.splice(idx, 1);
    this.draw();
  },

  /** Set function type 'x' or 'y' for a slot and recompile */
  setFnType(idx, type) {
    if (!this.fns[idx]) return;
    this.fns[idx].type = type;
    // Recompile with new variable
    const expr = this.fns[idx].expr;
    if (expr.trim()) {
      try   { this.fns[idx].compiled = buildFn(expr, type); }
      catch { this.fns[idx].compiled = null; }
    }
    this.draw();
  },

  /** Toggle graph canvas between dark and light theme */
  toggleGraphTheme() {
    this.graphTheme = this.graphTheme === 'dark' ? 'light' : 'dark';
    const wrap = document.getElementById('graphCanvasWrap');
    wrap.classList.toggle('graph-light', this.graphTheme === 'light');
    const btn = document.getElementById('graphThemeBtn');
    btn.textContent = this.graphTheme === 'dark' ? '☀' : '🌙';
    btn.title = this.graphTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    this.draw();
  },

  /**
   * Apply optional viewport from x range then redraw.
   * Called by Plot button.
   */
  plotAll(xMin, xMax) {
    if (xMin !== null && xMax !== null && isFinite(xMin) && isFinite(xMax) && xMin < xMax) {
      const W = DOM.graphCanvas.offsetWidth || 600;
      this.cx    = (xMin + xMax) / 2;
      this.cy    = 0;
      this.scale = W / (xMax - xMin);
    }
    this.draw();
  },

  /** Zoom in/out centred on canvas centre */
  zoom(factor) {
    this.scale = Math.max(5, Math.min(2000, this.scale * factor));
    this.draw();
  },

  /** Zoom centred on a specific canvas pixel */
  zoomAt(factor, px, py) {
    const canvas = DOM.graphCanvas;
    const W = canvas.width, H = canvas.height;
    const { wx, wy } = this.toWorld(px, py, W, H);
    this.scale = Math.max(5, Math.min(2000, this.scale * factor));
    // Recompute cx/cy so the zoom point stays fixed
    this.cx = wx - (px - W / 2) / this.scale;
    this.cy = wy + (py - H / 2) / this.scale;
    this.draw();
  },

  reset() {
    this.cx = 0; this.cy = 0; this.scale = 60;
    this.draw();
  },

  /** Set up all event listeners on the canvas */
  bindEvents() {
    const canvas = DOM.graphCanvas;
    const wrap   = canvas.parentElement;

    // ── Scroll to zoom ──────────────────────────────────────
    wrap.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect   = canvas.getBoundingClientRect();
      const px     = e.clientX - rect.left;
      const py     = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      this.zoomAt(factor, px, py);
    }, { passive: false });

    // ── Drag to pan ─────────────────────────────────────────
    wrap.addEventListener('mousedown', (e) => {
      this.dragging   = true;
      this.dragStart  = { x: e.clientX, y: e.clientY };
      this.dragOrigin = { cx: this.cx, cy: this.cy };
      wrap.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx   = e.clientX - rect.left;
      const my   = e.clientY - rect.top;
      const W    = canvas.width, H = canvas.height;

      if (this.dragging) {
        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;
        this.cx = this.dragOrigin.cx - dx / this.scale;
        this.cy = this.dragOrigin.cy + dy / this.scale;
        this.draw();
      }

      // Crosshair — always draw on top
      if (mx >= 0 && mx <= W && my >= 0 && my <= H) {
        this.draw(); // redraw clean frame first
        this.drawCrosshair(mx, my, W, H);
      }
    });
    window.addEventListener('mouseup', () => {
      this.dragging     = false;
      wrap.style.cursor = 'crosshair';
    });
    wrap.addEventListener('mouseleave', () => {
      DOM.graphTooltip.classList.remove('visible');
      this.draw();
    });

    // ── Touch pan/zoom ───────────────────────────────────────
    let lastTouchDist = null;
    let lastTouchMid  = null;
    wrap.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.dragging   = true;
        this.dragStart  = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        this.dragOrigin = { cx: this.cx, cy: this.cy };
      } else if (e.touches.length === 2) {
        this.dragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDist = Math.hypot(dx, dy);
        lastTouchMid  = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
      }
    }, { passive: true });
    wrap.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && this.dragging) {
        const dx = e.touches[0].clientX - this.dragStart.x;
        const dy = e.touches[0].clientY - this.dragStart.y;
        this.cx = this.dragOrigin.cx - dx / this.scale;
        this.cy = this.dragOrigin.cy + dy / this.scale;
        this.draw();
      } else if (e.touches.length === 2) {
        const dx   = e.touches[0].clientX - e.touches[1].clientX;
        const dy   = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (lastTouchDist) {
          const rect = canvas.getBoundingClientRect();
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
          const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
          this.zoomAt(dist / lastTouchDist, midX, midY);
        }
        lastTouchDist = dist;
      }
    }, { passive: false });
    wrap.addEventListener('touchend', () => {
      this.dragging  = false;
      lastTouchDist  = null;
    });

    // ── Control buttons ─────────────────────────────────────
    $('graphZoomIn') .addEventListener('click', () => this.zoom(1.3));
    $('graphZoomOut').addEventListener('click', () => this.zoom(0.77));
    $('graphReset')  .addEventListener('click', () => this.reset());
    $('graphThemeBtn').addEventListener('click', () => this.toggleGraphTheme());

    // ── Resize observer ──────────────────────────────────────
    if (window.ResizeObserver) {
      new ResizeObserver(() => this.draw()).observe(wrap);
    }
  },
};

/* ============================================================
   VOICE INPUT
   ============================================================ */
const Voice = {
  recognition: null,

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      this.processVoice(transcript);
      this.stop();
    };

    this.recognition.onerror = () => this.stop();
    this.recognition.onend = () => this.stop();
  },

  processVoice(text) {
    // Translate spoken words to math expression
    const translated = text
      .replace(/\bplus\b/g, '+')
      .replace(/\bminus\b/g, '−')
      .replace(/\btimes\b|\bmultiplied by\b/g, '×')
      .replace(/\bdivided by\b/g, '÷')
      .replace(/\bsquare root of\b/g, 'sqrt(')
      .replace(/\bpower\b|\bto the power of\b/g, '^')
      .replace(/\bpi\b/g, 'π')
      .replace(/\bpercent\b/g, '%')
      .replace(/\bpoint\b/g, '.')
      .replace(/\bzero\b/g, '0').replace(/\bone\b/g, '1')
      .replace(/\btwo\b/g, '2').replace(/\bthree\b/g, '3')
      .replace(/\bfour\b/g, '4').replace(/\bfive\b/g, '5')
      .replace(/\bsix\b/g, '6').replace(/\bseven\b/g, '7')
      .replace(/\beight\b/g, '8').replace(/\bnine\b/g, '9')
      .replace(/\s+/g, '');

    State.expression = translated;
    State.isNewEntry = false;
    Calc.livePreview();
    Toast.show('Voice: ' + text);
  },

  start() {
    if (!this.recognition) { Toast.show('Voice not supported'); return; }
    DOM.voiceModal.classList.add('open');
    DOM.voiceIndicator.classList.add('active');
    this.recognition.start();
  },

  stop() {
    DOM.voiceModal.classList.remove('open');
    DOM.voiceIndicator.classList.remove('active');
    try { this.recognition.stop(); } catch { /* ignore */ }
  },
};

/* ============================================================
   THEME
   ============================================================ */
const Theme = {
  toggle() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('quantix-theme', isDark ? 'light' : 'dark');
  },

  load() {
    const saved = localStorage.getItem('quantix-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
  },
};

/* ============================================================
   KEYBOARD SUPPORT
   ============================================================ */
function handleKeyboard(e) {
  // If typing inside an input, handle Enter smartly per context
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    if (e.key === 'Enter') {
      e.preventDefault();
      const id = e.target.id;
      // Diff/Int fields
      if (id === 'diffFn' || id === 'diffX') { $('calcDiff').click(); return; }
      if (id === 'intFn'  || id === 'intA' || id === 'intB') { $('calcInt').click(); return; }
      // Converter
      if (id === 'convInput') { Converter.convert(); return; }
      // Graph range
      if (id === 'graphXMin' || id === 'graphXMax') { DOM.plotBtn.click(); return; }
      // Math tools inputs — trigger nearest mt-btn
      const card = e.target.closest('.mt-card');
      if (card) {
        const btn = card.querySelector('.mt-btn:not(.mt-btn-secondary)');
        if (btn) { btn.click(); return; }
      }
    }
    return; // don't intercept other keys in inputs
  }

  const key = e.key;
  const map = {
    '0':'0','1':'1','2':'2','3':'3','4':'4',
    '5':'5','6':'6','7':'7','8':'8','9':'9',
    '+':'+', '-':'−', '*':'×', '/':'÷',
    '.':'.', '(':  '(', ')':')',
    'Enter': '=', '=': '=',
    'Backspace': 'c',
    'Escape': 'ac',
    '%': '%',
  };

  if (map[key]) {
    e.preventDefault();
    const action = map[key];
    if (action === '=') { Calc.evaluate(); rippleKey('='); }
    else if (action === 'c') { Calc.clear(); }
    else if (action === 'ac') { Calc.allClear(); }
    else if (action === '%') { Calc.percent(); }
    else if (['+','−','×','÷'].includes(action)) { Calc.appendOp(action); }
    else if (action === '.') { Calc.appendDot(); }
    else if ('()'.includes(action)) { Calc.appendToExpression(action); }
    else { Calc.appendToExpression(action); }
  }
}

function rippleKey(val) {
  const btn = document.querySelector(`[data-value="${val}"]`);
  if (btn) triggerRipple(btn);
}

/* ============================================================
   RIPPLE EFFECT
   ============================================================ */
function triggerRipple(btn) {
  btn.classList.remove('ripple');
  void btn.offsetWidth; // reflow
  btn.classList.add('ripple');
  setTimeout(() => btn.classList.remove('ripple'), 600);
}

/* ============================================================
   UTILITIES
   ============================================================ */
const Format = {
  number(n) {
    if (!isFinite(n)) return 'Infinity';
    // Use exponential for very large/small numbers
    if (Math.abs(n) > 1e15 || (Math.abs(n) < 1e-10 && n !== 0)) {
      return n.toExponential(6);
    }
    // Trim floating point noise
    const str = parseFloat(n.toPrecision(12)).toString();
    return str;
  },
};

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const Toast = {
  el: null,
  timeout: null,

  show(msg) {
    if (!this.el) {
      this.el = document.createElement('div');
      this.el.className = 'toast';
      document.body.appendChild(this.el);
    }
    this.el.textContent = msg;
    this.el.classList.add('show');
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.el.classList.remove('show'), 2200);
  },
};

/* ============================================================
   ADVANCED MATH PANEL
   ============================================================ */

// Angle mode state for advanced panel
const AdvState = { diffMode: 'rad', intMode: 'rad' };

/** Regex to detect trig functions in an expression */
const TRIG_RE = /\b(sin|cos|tan|asin|acos|atan)\s*\(/i;

/**
 * Build a numeric function that correctly handles degrees.
 * In DEG mode the function receives degrees, converts to radians
 * before passing to the trig calls — done at the JS level inside
 * the closure so buildFn's whitelist is never polluted.
 */
function buildFnWithAngle(fnStr, mode) {
  // We build a raw JS function body manually — bypassing buildFn's
  // whitelist because we need to inject the deg→rad conversion cleanly.
  let expr = fnStr.trim()
    .replace(/\^/g, '**')
    .replace(/π/g, String(Math.PI))
    .replace(/\bln\s*\(/g, 'Math.log(')
    .replace(/\blog10\s*\(/g, 'Math.log10(')
    .replace(/\blog2\s*\(/g, 'Math.log2(')
    .replace(/\bsqrt\s*\(/g, 'Math.sqrt(')
    .replace(/\bcbrt\s*\(/g, 'Math.cbrt(')
    .replace(/\babs\s*\(/g,  'Math.abs(')
    .replace(/\bfloor\s*\(/g,'Math.floor(')
    .replace(/\bceil\s*\(/g, 'Math.ceil(')
    .replace(/\bround\s*\(/g,'Math.round(')
    .replace(/\bexp\s*\(/g,  'Math.exp(')
    .replace(/\bPI\b/g, String(Math.PI))
    .replace(/\bE\b/g,  String(Math.E));

  if (mode === 'deg') {
    // Wrap forward trig: sin(expr) → Math.sin(expr * D2R)
    const D2R = Math.PI / 180;
    expr = expr
      .replace(/\bsin\s*\(/g,  `Math.sin(${D2R}*(`)
      .replace(/\bcos\s*\(/g,  `Math.cos(${D2R}*(`)
      .replace(/\btan\s*\(/g,  `Math.tan(${D2R}*(`)
      .replace(/\basin\s*\(/g, 'Math.asin(')
      .replace(/\bacos\s*\(/g, 'Math.acos(')
      .replace(/\batan\s*\(/g, 'Math.atan(');

    // Each forward trig call now has an extra open paren — close it
    // by appending ')' after its argument group.
    // We handle this by replacing the pattern we just created:
    // Math.sin(D2R*(INNER)) needs one extra ')' to close the D2R*(
    // We use a balanced-paren scanner for safety.
    expr = closeTrigParens(expr, ['Math.sin','Math.cos','Math.tan'], D2R);
  } else {
    expr = expr
      .replace(/\bsin\s*\(/g,  'Math.sin(')
      .replace(/\bcos\s*\(/g,  'Math.cos(')
      .replace(/\btan\s*\(/g,  'Math.tan(')
      .replace(/\basin\s*\(/g, 'Math.asin(')
      .replace(/\bacos\s*\(/g, 'Math.acos(')
      .replace(/\batan\s*\(/g, 'Math.atan(');
  }

  // Implicit multiplication: 2x → 2*x
  expr = expr.replace(/(\d)\s*\*?\s*x/g, '$1*x').replace(/x\s*\*?\s*(\d)/g, 'x*$1');

  // eslint-disable-next-line no-new-func
  const fn = new Function('x', '"use strict"; return (' + expr + ');');
  return (xVal) => fn(xVal);
}

/**
 * After replacing e.g. sin( with Math.sin(D2R*( we have an extra
 * unclosed paren for each forward-trig call.  This scanner walks
 * the string and inserts the closing ')' at the right depth.
 */
function closeTrigParens(expr, trigNames) {
  // For each trigName pattern "Math.sin(D2R*(" we need to find the
  // matching close of the original argument and insert an extra ')'.
  let result = expr;
  for (const name of trigNames) {
    // pattern is like: Math.sin(0.01745...*(
    const searchRe = new RegExp(name.replace('.','\\.')+'\\([^(]+\\*\\(', 'g');
    let match;
    let out = '';
    let lastEnd = 0;
    const copy = result;
    searchRe.lastIndex = 0;
    while ((match = searchRe.exec(copy)) !== null) {
      const start = match.index + match[0].length; // position after the second '('
      // walk forward counting parens to find the matching ')'
      let depth = 1, i = start;
      while (i < copy.length && depth > 0) {
        if (copy[i] === '(') depth++;
        else if (copy[i] === ')') depth--;
        i++;
      }
      // insert ')' at position i (after the matched close paren)
      out += copy.slice(lastEnd, i) + ')';
      lastEnd = i;
    }
    result = out + copy.slice(lastEnd) || result;
  }
  return result;
}

/**
 * Detect trig functions in input and show/hide the RAD/DEG row.
 */
function checkTrigAndToggle(inputEl, rowEl) {
  const hasTrig = TRIG_RE.test(inputEl.value);
  rowEl.classList.toggle('visible', hasTrig);
}

/**
 * Generate informal indefinite derivative description.
 * Shows the symbolic anti-derivative pattern for common functions.
 */
function informalDerivative(fnStr) {
  const f = fnStr.trim().replace(/\s+/g,'');
  if (/^sin\(x\)$/i.test(f))       return 'cos(x)';
  if (/^cos\(x\)$/i.test(f))       return '−sin(x)';
  if (/^tan\(x\)$/i.test(f))       return 'sec²(x)  =  1/cos²(x)';
  if (/^asin\(x\)$/i.test(f))      return '1 / √(1 − x²)';
  if (/^acos\(x\)$/i.test(f))      return '−1 / √(1 − x²)';
  if (/^atan\(x\)$/i.test(f))      return '1 / (1 + x²)';
  if (/^sinh\(x\)$/i.test(f))      return 'cosh(x)';
  if (/^cosh\(x\)$/i.test(f))      return 'sinh(x)';
  if (/^tanh\(x\)$/i.test(f))      return '1 − tanh²(x)  =  sech²(x)';
  if (/^x\^(\d+)$/.test(f)) {
    const n = parseInt(f.match(/\^(\d+)/)[1]);
    return `${n}·x^${n-1}`;
  }
  if (/^(\d+)x\^(\d+)$/.test(f)) {
    const [,c,n] = f.match(/^(\d+)x\^(\d+)$/);
    return `${parseInt(c)*parseInt(n)}·x^${parseInt(n)-1}`;
  }
  if (/^x$/.test(f))               return '1';
  if (/^(\d+)x$/.test(f))          return f.match(/^(\d+)/)[1];
  if (/^(\d+)$/.test(f))           return '0';
  if (/^e\^x$/i.test(f))           return 'eˣ';
  if (/^ln\(x\)$/i.test(f))        return '1/x';
  if (/^log\(x\)$/i.test(f))       return '1/(x·ln10)';
  if (/^log2\(x\)$/i.test(f))      return '1/(x·ln2)';
  if (/^sqrt\(x\)$/i.test(f))      return '1 / (2·√x)';
  if (/^1\/x$/.test(f))            return '−1/x²';
  if (/^x\^2$/.test(f))            return '2x';
  if (/^x\^3$/.test(f))            return '3x²';
  return null;
}

function informalAntiderivative(fnStr) {
  const f = fnStr.trim().replace(/\s+/g,'');
  if (/^sin\(x\)$/i.test(f))       return '−cos(x) + C';
  if (/^cos\(x\)$/i.test(f))       return 'sin(x) + C';
  if (/^tan\(x\)$/i.test(f))       return 'ln|sec(x)| + C';
  if (/^asin\(x\)$/i.test(f))      return 'x·asin(x) + √(1−x²) + C';
  if (/^acos\(x\)$/i.test(f))      return 'x·acos(x) − √(1−x²) + C';
  if (/^atan\(x\)$/i.test(f))      return 'x·atan(x) − ½·ln(1+x²) + C';
  if (/^sinh\(x\)$/i.test(f))      return 'cosh(x) + C';
  if (/^cosh\(x\)$/i.test(f))      return 'sinh(x) + C';
  if (/^tanh\(x\)$/i.test(f))      return 'ln(cosh(x)) + C';
  if (/^x\^(\d+)$/.test(f)) {
    const n = parseInt(f.match(/\^(\d+)/)[1]);
    return `x^${n+1}/${n+1} + C`;
  }
  if (/^(\d+)x\^(\d+)$/.test(f)) {
    const [,c,n] = f.match(/^(\d+)x\^(\d+)$/);
    const nn = parseInt(n)+1;
    return `${c}x^${nn}/${nn} + C`;
  }
  if (/^x$/.test(f))               return 'x²/2 + C';
  if (/^(\d+)x$/.test(f))          return `${f.match(/^(\d+)/)[1]}x²/2 + C`;
  if (/^(\d+)$/.test(f))           return `${f}x + C`;
  if (/^e\^x$/i.test(f))           return 'eˣ + C';
  if (/^1\/x$/.test(f))            return 'ln|x| + C';
  if (/^ln\(x\)$/i.test(f))        return 'x·ln(x) − x + C';
  if (/^log\(x\)$/i.test(f))       return 'x·log(x) − x/ln10 + C';
  if (/^sqrt\(x\)$/i.test(f))      return '(2/3)·x^(3/2) + C';
  if (/^x\^2$/.test(f))            return 'x³/3 + C';
  if (/^x\^3$/.test(f))            return 'x⁴/4 + C';
  return null;
}

function setupAdvanced() {
  const diffRow = document.querySelector('#tab-advanced .advanced-section:nth-child(1) .adv-angle-row');
  const intRow  = document.querySelector('#tab-advanced .advanced-section:nth-child(2) .adv-angle-row');

  // ── Clear buttons ─────────────────────────────────────────
  $('clearDiff').addEventListener('click', () => {
    DOM.diffFn.value  = '';
    DOM.diffX.value   = '';
    DOM.diffResult.innerHTML = '';
    diffRow.classList.remove('visible');
    DOM.diffFn.focus();
  });

  $('clearInt').addEventListener('click', () => {
    DOM.intFn.value  = '';
    DOM.intA.value   = '';
    DOM.intB.value   = '';
    DOM.intResult.innerHTML = '';
    intRow.classList.remove('visible');
    DOM.intFn.focus();
  });

  // ── π insertion — single button above Calc, targets last focused input ──
  const diffInputs = [DOM.diffFn, DOM.diffX];
  const intInputs  = [DOM.intFn, DOM.intA, DOM.intB];
  let lastDiffFocus = DOM.diffFn;
  let lastIntFocus  = DOM.intFn;

  diffInputs.forEach(el => el.addEventListener('focus', () => { lastDiffFocus = el; }));
  intInputs.forEach(el  => el.addEventListener('focus', () => { lastIntFocus  = el; }));

  function insertPi(targetEl) {
    if (!targetEl) return;
    targetEl.focus();
    const pos = targetEl.selectionStart ?? targetEl.value.length;
    targetEl.value = targetEl.value.slice(0, pos) + 'π' + targetEl.value.slice(pos);
    targetEl.setSelectionRange(pos + 1, pos + 1);
    targetEl.dispatchEvent(new Event('input'));
  }

  $('diffPiBtn').addEventListener('click', () => insertPi(lastDiffFocus));
  $('intPiBtn').addEventListener('click',  () => insertPi(lastIntFocus));

  // ── Enter key in diff/int fields ──────────────────────────
  [DOM.diffFn, DOM.diffX].forEach(el => {
    el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('calcDiff').click(); } });
  });
  [DOM.intFn, DOM.intA, DOM.intB].forEach(el => {
    el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('calcInt').click(); } });
  });

  // ── Auto-detect trig on input ─────────────────────────────
  DOM.diffFn.addEventListener('input', () => checkTrigAndToggle(DOM.diffFn, diffRow));
  DOM.intFn .addEventListener('input', () => checkTrigAndToggle(DOM.intFn,  intRow));

  // ── Differentiation angle toggle ──────────────────────────
  ['diffRad', 'diffDeg'].forEach(id => {
    $(id).addEventListener('click', () => {
      AdvState.diffMode = $(id).dataset.mode;
      $('diffRad').classList.toggle('active', AdvState.diffMode === 'rad');
      $('diffDeg').classList.toggle('active', AdvState.diffMode === 'deg');
    });
  });

  // ── Integration angle toggle ──────────────────────────────
  ['intRad', 'intDeg'].forEach(id => {
    $(id).addEventListener('click', () => {
      AdvState.intMode = $(id).dataset.mode;
      $('intRad').classList.toggle('active', AdvState.intMode === 'rad');
      $('intDeg').classList.toggle('active', AdvState.intMode === 'deg');
    });
  });

  // ── Calc differentiation ──────────────────────────────────
  $('calcDiff').addEventListener('click', () => {
    const rawFn = DOM.diffFn.value.trim();
    const xRaw  = (DOM.diffX.value || '').trim().replace(/π/g, String(Math.PI)).replace(/pi/gi, String(Math.PI));
    const x     = parseFloat(xRaw);
    if (!rawFn) { DOM.diffResult.innerHTML = 'Enter a function f(x)'; return; }

    const modeLabel = TRIG_RE.test(rawFn) ? ` (${AdvState.diffMode.toUpperCase()})` : '';
    const xDisplay  = DOM.diffX.value.trim() || '';

    // ── Definite derivative at x ──────────────────────────
    let definitePart = '';
    if (!isNaN(x)) {
      try {
        const fn     = buildFnWithAngle(rawFn, TRIG_RE.test(rawFn) ? AdvState.diffMode : 'rad');
        const h      = 1e-7;
        const result = (fn(x + h) - fn(x - h)) / (2 * h);
        definitePart = `<div class="adv-result-row"><span class="adv-result-label">Definite:</span> d/dx [${rawFn}] at x = ${xDisplay}${modeLabel}  ≈  <b>${Format.number(result)}</b></div>`;
      } catch (e) {
        definitePart = `<div class="adv-result-row adv-result-error">Error: ${e.message}</div>`;
      }
    }

    // ── Indefinite / symbolic ─────────────────────────────
    const symbolic = informalDerivative(rawFn);
    const indefinitePart = symbolic
      ? `<div class="adv-result-row"><span class="adv-result-label">Indefinite:</span> d/dx [${rawFn}] = <b>${symbolic}</b></div>`
      : '';

    if (!definitePart && !indefinitePart) {
      DOM.diffResult.innerHTML = 'Enter an x value for the definite derivative';
      return;
    }
    DOM.diffResult.innerHTML = indefinitePart + definitePart;
  });

  // ── Calc integration ──────────────────────────────────────
  $('calcInt').addEventListener('click', () => {
    const rawFn = DOM.intFn.value.trim();
    const parseVal = s => parseFloat((s || '').trim().replace(/π/g, String(Math.PI)).replace(/pi/gi, String(Math.PI)));
    const a     = parseVal(DOM.intA.value);
    const b     = parseVal(DOM.intB.value);
    const aDisp = DOM.intA.value.trim();
    const bDisp = DOM.intB.value.trim();
    if (!rawFn) { DOM.intResult.innerHTML = 'Enter a function f(x)'; return; }

    const modeLabel = TRIG_RE.test(rawFn) ? ` (${AdvState.intMode.toUpperCase()})` : '';

    // ── Definite integral from a to b ─────────────────────
    let definitePart = '';
    if (!isNaN(a) && !isNaN(b)) {
      try {
        const fn  = buildFnWithAngle(rawFn, TRIG_RE.test(rawFn) ? AdvState.intMode : 'rad');
        const n   = 1000;
        const h   = (b - a) / n;
        let sum   = fn(a) + fn(b);
        for (let i = 1; i < n; i++) sum += (i % 2 === 0 ? 2 : 4) * fn(a + i * h);
        const result = (h / 3) * sum;
        definitePart = `<div class="adv-result-row"><span class="adv-result-label">Definite:</span> ∫[${aDisp} to ${bDisp}] ${rawFn} dx${modeLabel}  ≈  <b>${Format.number(result)}</b></div>`;
      } catch (e) {
        definitePart = `<div class="adv-result-row adv-result-error">Error: ${e.message}</div>`;
      }
    }

    // ── Indefinite / antiderivative ───────────────────────
    const symbolic = informalAntiderivative(rawFn);
    const indefinitePart = symbolic
      ? `<div class="adv-result-row"><span class="adv-result-label">Indefinite:</span> ∫ ${rawFn} dx = <b>${symbolic}</b></div>`
      : '';

    if (!definitePart && !indefinitePart) {
      DOM.intResult.innerHTML = 'Enter a and b for the definite integral';
      return;
    }
    DOM.intResult.innerHTML = indefinitePart + definitePart;
  });
}

/* ============================================================
   EVENT BINDING
   ============================================================ */
function bindButtons() {
  document.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      triggerRipple(btn);
      const action = btn.dataset.action;
      const value  = btn.dataset.value;
      const fn     = btn.dataset.fn;

      switch (action) {
        case 'num':     Calc.appendToExpression(value); break;
        case 'op':      Calc.appendOp(value); break;
        case 'dot':     Calc.appendDot(); break;
        case 'equals':  Calc.evaluate(); break;
        case 'c':       Calc.clear(); break;
        case 'ac':      Calc.allClear(); break;
        case 'percent': Calc.percent(); break;
        case 'bracket': Calc.appendToExpression(value); break;
        case 'sci':     Calc.applyScientific(fn); break;
        case 'random':  Calc.random(); break;
        case 'mc':      Memory.mc(); break;
        case 'mr':      Memory.mr(); break;
        case 'm-plus':  Memory.mPlus(); break;
        case 'm-minus': Memory.mMinus(); break;
      }
    });
  });
}

/* ============================================================
   SWITCH TAB HELPER
   Programmatically activate a tab by name
   ============================================================ */
function switchToTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  const content = $(`tab-${tabName}`);
  if (btn) btn.classList.add('active');
  if (content) content.classList.add('active');
}

function bindTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      $(`tab-${tab}`).classList.add('active');
    });
  });
}

function bindConverter() {
  DOM.convInput.addEventListener('input', () => Converter.convert());
  document.querySelectorAll('.base-btn').forEach(btn => {
    btn.addEventListener('click', () => Converter.setBase(btn.dataset.base));
  });
  // Copy conv values on click
  document.querySelectorAll('.conv-result-card').forEach(card => {
    card.addEventListener('click', () => {
      const val = card.querySelector('.conv-value').textContent;
      if (val !== '—' && val !== 'Invalid') {
        navigator.clipboard.writeText(val).catch(() => {});
        Toast.show('Copied: ' + val);
      }
    });
  });
}

function bindControls() {
  // History panel
  DOM.historyToggle.addEventListener('click', () => {
    DOM.historyPanel.classList.toggle('open');
  });

  DOM.clearHistory.addEventListener('click', () => History.clear());

  // Theme
  DOM.themeToggle.addEventListener('click', () => Theme.toggle());

  // Copy result
  DOM.copyBtn.addEventListener('click', () => {
    const text = State.expression;
    navigator.clipboard.writeText(text).catch(() => {});
    Toast.show('Copied!');
  });

  // Angle mode
  DOM.radBtn.addEventListener('click', () => {
    State.angleMode = 'rad';
    DOM.radBtn.classList.add('active');
    DOM.degBtn.classList.remove('active');
    Display.render();
  });
  DOM.degBtn.addEventListener('click', () => {
    State.angleMode = 'deg';
    DOM.degBtn.classList.add('active');
    DOM.radBtn.classList.remove('active');
    Display.render();
  });

  // Voice
  DOM.voiceBtn.addEventListener('click', () => Voice.start());
  DOM.voiceCancel.addEventListener('click', () => Voice.stop());

  // Graph — multi-function Desmos-style
  Grapher.bindEvents();
  _initFnList();

  // Plot button — applies optional x range, then redraws
  DOM.plotBtn.addEventListener('click', () => {
    const xMin = DOM.graphXMin.value !== '' ? parseFloat(DOM.graphXMin.value) : null;
    const xMax = DOM.graphXMax.value !== '' ? parseFloat(DOM.graphXMax.value) : null;
    if (xMin !== null && xMax !== null && (isNaN(xMin) || isNaN(xMax) || xMin >= xMax)) {
      Toast.show('x min must be less than x max');
      return;
    }
    Grapher.plotAll(xMin, xMax);
  });

  // Keyboard
  document.addEventListener('keydown', handleKeyboard);
}



/* ============================================================
   FUNCTION LIST MANAGER  —  Desmos-style rows
   ============================================================ */
function _initFnList() {
  // Seed with one function (sin(x) as demo)
  Grapher.addFn();
  Grapher.fns[0].expr = 'sin(x)';
  try { Grapher.fns[0].compiled = buildFn('sin(x)'); } catch { /**/ }

  _renderFnList();
}

function _renderFnList() {
  const list = DOM.fnList;
  list.innerHTML = '';

  Grapher.fns.forEach((fn, idx) => {
    const row = document.createElement('div');
    row.className = 'fn-row';
    row.style.borderLeftColor = fn.color;

    row.innerHTML = `
      <div class="fn-type-toggle">
        <button class="fn-type-btn ${fn.type === 'x' ? 'active' : ''}" data-type="x" data-idx="${idx}" title="f(x)">x</button>
        <button class="fn-type-btn ${fn.type === 'y' ? 'active' : ''}" data-type="y" data-idx="${idx}" title="f(y)">y</button>
      </div>
      <span class="fn-row-label" style="color:${fn.color}">f${idx + 1}(${fn.type}) =</span>
      <input
        class="fn-row-input"
        type="text"
        placeholder="${fn.type === 'x' ? 'e.g. sin(x), x^2' : 'e.g. y^2, sin(y)'}"
        value="${escHtml(fn.expr)}"
        data-idx="${idx}"
      />
      <button class="fn-row-remove" data-idx="${idx}" title="Remove">✕</button>
    `;

    // Type toggle buttons
    row.querySelectorAll('.fn-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        Grapher.setFnType(idx, type);
        _renderFnList();
      });
    });

    // Input → live recompile
    row.querySelector('.fn-row-input').addEventListener('input', (e) => {
      Grapher.updateFn(idx, e.target.value);
    });
    // Enter key → Plot
    row.querySelector('.fn-row-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') DOM.plotBtn.click();
    });

    // Remove button
    row.querySelector('.fn-row-remove').addEventListener('click', () => {
      if (Grapher.fns.length === 1) {
        Grapher.fns[0].expr     = '';
        Grapher.fns[0].compiled = null;
        _renderFnList();
        Grapher.draw();
        return;
      }
      Grapher.removeFn(idx);
      _renderFnList();
    });

    list.appendChild(row);
  });

  // Re-wire Add button (clone to remove old listeners)
  const addBtn = DOM.addFnBtn;
  const freshAdd = addBtn.cloneNode(true);
  addBtn.parentNode.replaceChild(freshAdd, addBtn);
  DOM.addFnBtn = freshAdd;

  freshAdd.addEventListener('click', () => {
    if (Grapher.fns.length >= 10) { Toast.show('Max 10 functions'); return; }
    Grapher.addFn();
    _renderFnList();
    // ── Auto-focus the new input row ──
    requestAnimationFrame(() => {
      const inputs = DOM.fnList.querySelectorAll('.fn-row-input');
      if (inputs.length) inputs[inputs.length - 1].focus();
    });
  });
}


function init() {
  Theme.load();
  Voice.init();
  bindButtons();
  bindTabs();
  bindConverter();
  bindControls();
  setupAdvanced();
  Display.render();
  startClock();

  // Draw graph when tab becomes visible
  document.querySelector('[data-tab="graph"]').addEventListener('click', () => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      Grapher.draw();
    }));
  });

  console.log('%c Quantix — Precision Meets Intelligence ', 'background:linear-gradient(90deg,#00d4ff,#a855f7);color:#fff;font-weight:bold;font-size:16px;padding:6px 12px;border-radius:4px;');
}

/* ============================================================
   LIVE CLOCK
   ============================================================ */
function startClock() {
  const timeEl = $('clockTime');
  const dateEl = $('clockDate');
  if (!timeEl || !dateEl) return;

  const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function tick() {
    const now = new Date();

    // Time: HH:MM:SS
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    timeEl.textContent = `${hh}:${mm}:${ss}`;

    // Date: Mon, 27 Mar 2026
    const day  = days[now.getDay()];
    const d    = String(now.getDate()).padStart(2, '0');
    const mon  = months[now.getMonth()];
    const yr   = now.getFullYear();
    dateEl.textContent = `${day}, ${d} ${mon} ${yr}`;
  }

  tick(); // run immediately
  setInterval(tick, 1000); // update every second
}

document.addEventListener('DOMContentLoaded', init);

/* ── Smart tooltip positioning — prevents edge clipping on all sides ── */
(function() {
  const TOOLTIP_W = 240;
  const GAP       = 10;
  const MARGIN    = 8;

  function positionTooltip(wrap, tooltip) {
    const btn  = wrap.querySelector('.calc-btn') || wrap;
    const rect = btn.getBoundingClientRect();
    const vw   = window.innerWidth;

    /* ── Make visible off-screen to measure real height ── */
    tooltip.style.visibility = 'hidden';
    tooltip.style.display    = 'block';
    tooltip.style.top        = '-9999px';
    tooltip.style.left       = '-9999px';
    const th = tooltip.offsetHeight || 120;
    tooltip.style.visibility = '';

    /* ── Vertical: prefer above button, flip below if not enough space ── */
    let top = rect.top - th - GAP;
    let arrowAtBottom = true;
    if (top < MARGIN) {
      top = rect.bottom + GAP;
      arrowAtBottom = false;
    }

    /* ── Horizontal: centre on button, clamp to viewport ── */
    let left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
    if (left < MARGIN)              left = MARGIN;
    if (left + TOOLTIP_W > vw - MARGIN) left = vw - TOOLTIP_W - MARGIN;

    tooltip.style.top  = top  + 'px';
    tooltip.style.left = left + 'px';
    tooltip.style.width = TOOLTIP_W + 'px';

    /* ── Arrow: track button centre horizontally ── */
    const btnCentreX = rect.left + rect.width / 2;
    const arrowLeft  = Math.max(16, Math.min(TOOLTIP_W - 16, btnCentreX - left));
    tooltip.style.setProperty('--arrow-left', arrowLeft + 'px');

    /* ── Flip arrow to top when tooltip is below button ── */
    tooltip.dataset.arrowPos = arrowAtBottom ? 'bottom' : 'top';
  }

  /* ── CSS arrow direction driven by data attribute ── */
  const arrowStyle = document.createElement('style');
  arrowStyle.textContent = `
    .fn-tooltip[data-arrow-pos="top"]::after {
      top: auto;
      bottom: 100%;
      border-top-color: transparent;
      border-bottom-color: rgba(124,58,237,0.55);
    }
    .fn-tooltip[data-arrow-pos="top"]::before {
      top: auto;
      bottom: 0;
    }
  `;
  document.head.appendChild(arrowStyle);

  document.addEventListener('mouseover', (e) => {
    const wrap = e.target.closest('.fn-tooltip-wrap');
    if (!wrap) return;
    const tooltip = wrap.querySelector('.fn-tooltip');
    if (!tooltip) return;
    positionTooltip(wrap, tooltip);
  });

  document.addEventListener('mouseout', (e) => {
    const wrap = e.target.closest('.fn-tooltip-wrap');
    if (!wrap) return;
    if (wrap.contains(e.relatedTarget)) return;
    const tooltip = wrap.querySelector('.fn-tooltip');
    if (tooltip) { tooltip.style.display = 'none'; tooltip.style.visibility = ''; }
  });
})();
