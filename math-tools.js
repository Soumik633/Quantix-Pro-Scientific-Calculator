/**
 * Quantix — Math Tools  (math-tools.js)
 * Pure frontend JavaScript — no backend required.
 *
 * Modules:
 *  1. Permutation & Combination (nPr, nCr)
 *  2. Inequality Solver & Graph (wavy curve, double, modulus, quadratic, linear)
 *  3. Quadratic Equation Solver + Graph
 *  4. Binomial Theorem Value Finder
 *  5. Relation & Function (domain, range, type checker, diagram)
 */

'use strict';

/* ============================================================
   BOOTSTRAP — render into #mathToolsRoot when tab first opens
   ============================================================ */
(function () {
  // Wait for DOM
  document.addEventListener('DOMContentLoaded', () => {
    // Hook into tab switching
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tab="mathtools"]');
      if (btn) {
        setTimeout(initMathTools, 50);
      }
    });
  });

  let _initialized = false;

  function initMathTools() {
    if (_initialized) return;
    _initialized = true;
    const root = document.getElementById('mathToolsRoot');
    if (!root) return;
    root.innerHTML = buildHTML();
    bindAll();
  }

  /* ============================================================
     HTML SKELETON
     ============================================================ */
  function buildHTML() {
    return `
<div style="padding:4px">
  <!-- Sub-tab navigation -->
  <div class="mt-sub-tabs" id="mtSubTabs">
    <button class="mt-sub-btn active" data-section="pc">P &amp; C</button>
    <button class="mt-sub-btn" data-section="ineq">Inequalities</button>
    <button class="mt-sub-btn" data-section="quad">Quadratic</button>
    <button class="mt-sub-btn" data-section="binom">Binomial</button>
    <button class="mt-sub-btn" data-section="relfn">Relation &amp; Function</button>
  </div>

  <!-- 1. PERMUTATION & COMBINATION -->
  <div class="mt-section" id="section-pc">
    <div class="mt-grid">
      <div class="mt-card">
        <div class="mt-card-title"><span class="mt-icon">🔢</span> Permutation &amp; Combination</div>
        <div class="mt-row">
          <span class="mt-label">n =</span>
          <input class="mt-input" id="pcN" type="number" min="0" placeholder="e.g. 10" />
          <span class="mt-label">r =</span>
          <input class="mt-input" id="pcR" type="number" min="0" placeholder="e.g. 3" />
        </div>
        <div class="mt-row">
          <button class="mt-btn" id="calcPC">Calculate</button>
          <button class="mt-btn mt-btn-secondary" id="clearPC">Clear</button>
        </div>
        <div class="mt-result" id="pcResult">Enter n and r above, then press Calculate.</div>
      </div>

      <div class="mt-card">
        <div class="mt-card-title"><span class="mt-icon">📊</span> Factorials</div>
        <div class="mt-row">
          <span class="mt-label">n =</span>
          <input class="mt-input" id="factN" type="number" min="0" max="170" placeholder="0–170" />
          <button class="mt-btn" id="calcFact">n!</button>
          <button class="mt-btn mt-btn-secondary" id="clearFact">Clear</button>
        </div>
        <div class="mt-result" id="factResult">Enter n (0–170)</div>

        <div style="margin-top:16px" class="mt-card-title" style="font-size:0.65rem">Multinomial</div>
        <div class="mt-row">
          <span class="mt-label" style="font-size:0.7rem">n =</span>
          <input class="mt-input" id="multiN" type="number" min="0" placeholder="n" />
          <span class="mt-label" style="font-size:0.7rem">k₁,k₂…</span>
          <input class="mt-input" id="multiK" placeholder="e.g. 2,3,2" />
          <button class="mt-btn" id="calcMulti">Calc</button>
          <button class="mt-btn mt-btn-secondary" id="clearMulti">Clear</button>
        </div>
        <div class="mt-result" id="multiResult">n! / (k₁! × k₂! × …)</div>
      </div>
    </div>
  </div>

  <!-- 2. INEQUALITIES -->
  <div class="mt-section" id="section-ineq" style="display:none">
    <div class="mt-sub-tabs" id="ineqSubTabs" style="margin-bottom:12px">
      <button class="mt-sub-btn active" data-ineq="linear">Linear</button>
      <button class="mt-sub-btn" data-ineq="quad">Quadratic</button>
      <button class="mt-sub-btn" data-ineq="modulus">Modulus |f(x)|</button>
      <button class="mt-sub-btn" data-ineq="double">Double Inequality</button>
      <button class="mt-sub-btn" data-ineq="wavy">Wavy Curve</button>
    </div>

    <!-- Linear -->
    <div id="ineq-linear">
      <div class="mt-card">
        <div class="mt-card-title"><span class="mt-icon">📐</span> Linear Inequality</div>
        <div class="mt-row">
          <input class="mt-input" id="linIneqExpr" placeholder="e.g.  2x + 3 > 7  or  -x ≤ 5" style="flex:2" />
          <button class="mt-btn" id="solveLinIneq">Solve</button>
          <button class="mt-btn mt-btn-secondary" id="clearLinIneq">Clear</button>
        </div>
        <div class="mt-result" id="linIneqResult">Enter a linear inequality like 2x + 3 &gt; 7</div>
        <div class="mt-number-line-wrap"><canvas class="mt-number-line-canvas" id="linIneqCanvas" height="70"></canvas></div>
      </div>
    </div>

    <!-- Quadratic Inequality -->
    <div id="ineq-quad" style="display:none">
      <div class="mt-card">
        <div class="mt-card-title"><span class="mt-icon">〰️</span> Quadratic Inequality (Wavy Curve / Sign Chart)</div>
        <div class="mt-row">
          <span class="mt-label">ax²+bx+c</span>
          <input class="mt-input" id="qiA" type="number" placeholder="a" style="max-width:70px"/>
          <input class="mt-input" id="qiB" type="number" placeholder="b" style="max-width:70px"/>
          <input class="mt-input" id="qiC" type="number" placeholder="c" style="max-width:70px"/>
          <select class="mt-input" id="qiSign" style="flex:0 0 80px">
            <option>&gt; 0</option><option>≥ 0</option><option>&lt; 0</option><option>≤ 0</option>
          </select>
          <button class="mt-btn" id="solveQI">Solve</button>
          <button class="mt-btn mt-btn-secondary" id="clearQI">Clear</button>
        </div>
        <div class="mt-result" id="qiResult">Enter coefficients and sign</div>
        <div class="mt-number-line-wrap"><canvas class="mt-number-line-canvas" id="qiCanvas" height="90"></canvas></div>
      </div>
    </div>

    <!-- Modulus -->
    <div id="ineq-modulus" style="display:none">
      <div class="mt-card">
        <div class="mt-card-title"><span class="mt-icon">|x|</span> Modulus Inequality</div>
        <div class="mt-row">
          <select class="mt-input" id="modType" style="flex:0 0 150px">
            <option>|ax+b| &lt; c</option>
            <option>|ax+b| &gt; c</option>
            <option>|ax+b| ≤ c</option>
            <option>|ax+b| ≥ c</option>
            <option>|ax+b| &lt; |cx+d|</option>
          </select>
        </div>
        <div class="mt-row">
          <span class="mt-label">a =</span><input class="mt-input" id="modA" type="number" placeholder="a" style="max-width:70px"/>
          <span class="mt-label">b =</span><input class="mt-input" id="modB" type="number" placeholder="b" style="max-width:70px"/>
          <span class="mt-label">c =</span><input class="mt-input" id="modC" type="number" placeholder="c" style="max-width:70px"/>
          <span class="mt-label">d =</span><input class="mt-input" id="modD" type="number" placeholder="d (if needed)" style="max-width:90px"/>
          <button class="mt-btn" id="solveMod">Solve</button>
          <button class="mt-btn mt-btn-secondary" id="clearMod">Clear</button>
        </div>
        <div class="mt-result" id="modResult">Select type and enter values</div>
        <div class="mt-number-line-wrap"><canvas class="mt-number-line-canvas" id="modCanvas" height="70"></canvas></div>
      </div>
    </div>

    <!-- Double Inequality -->
    <div id="ineq-double" style="display:none">
      <div class="mt-card">
        <div class="mt-card-title"><span class="mt-icon">⟺</span> Double Inequality  a &lt; f(x) &lt; b</div>
        <div class="mt-row">
          <input class="mt-input" id="dblLeft" type="number" placeholder="left bound a" />
          <select class="mt-input" id="dblSignL" style="flex:0 0 70px"><option>&lt;</option><option>≤</option></select>
          <input class="mt-input" id="dblExpr" placeholder="expression in x" />
          <select class="mt-input" id="dblSignR" style="flex:0 0 70px"><option>&lt;</option><option>≤</option></select>
          <input class="mt-input" id="dblRight" type="number" placeholder="right bound b" />
          <button class="mt-btn" id="solveDbl">Solve</button>
          <button class="mt-btn mt-btn-secondary" id="clearDbl">Clear</button>
        </div>
        <div class="mt-result" id="dblResult">Enter a double inequality like 1 &lt; 2x+3 &lt; 9</div>
        <div class="mt-number-line-wrap"><canvas class="mt-number-line-canvas" id="dblCanvas" height="70"></canvas></div>
      </div>
    </div>

    <!-- Wavy Curve -->
    <div id="ineq-wavy" style="display:none">
      <div class="mt-card">
        <div class="mt-card-title"><span class="mt-icon">〰</span> Wavy Curve Method — Rational / Polynomial Inequality</div>
        <p style="font-size:0.73rem;color:var(--text-secondary);margin-bottom:10px">
          Enter as product of factors: roots separated by commas, with their powers. The wavy curve method determines the sign of the expression in each interval.
        </p>
        <div class="mt-row">
          <span class="mt-label">Roots (comma-sep):</span>
          <input class="mt-input" id="wavyRoots" placeholder="e.g. -3, 0, 2, 5" />
        </div>
        <div class="mt-row">
          <span class="mt-label">Powers (comma-sep):</span>
          <input class="mt-input" id="wavyPowers" placeholder="e.g. 1, 2, 1, 3  (each root's multiplicity)" />
          <select class="mt-input" id="wavySign" style="flex:0 0 90px">
            <option>f(x) &gt; 0</option><option>f(x) ≥ 0</option>
            <option>f(x) &lt; 0</option><option>f(x) ≤ 0</option>
          </select>
          <button class="mt-btn" id="solveWavy">Solve</button>
          <button class="mt-btn mt-btn-secondary" id="clearWavy">Clear</button>
        </div>
        <div class="mt-result" id="wavyResult">Enter roots and their multiplicities</div>
        <div class="mt-number-line-wrap"><canvas class="mt-number-line-canvas" id="wavyCanvas" height="110"></canvas></div>
      </div>
    </div>
  </div>

  <!-- 3. QUADRATIC EQUATION + GRAPH -->
  <div class="mt-section" id="section-quad" style="display:none">
    <div class="mt-grid">
      <div class="mt-card">
        <div class="mt-card-title"><span class="mt-icon">x²</span> Quadratic Equation Solver</div>
        <div style="font-size:0.72rem;color:var(--text-secondary);margin-bottom:10px">ax² + bx + c = 0</div>
        <div class="mt-row">
          <span class="mt-label">a =</span><input class="mt-input" id="qaA" type="number" placeholder="a ≠ 0" />
          <span class="mt-label">b =</span><input class="mt-input" id="qaB" type="number" placeholder="b" />
          <span class="mt-label">c =</span><input class="mt-input" id="qaC" type="number" placeholder="c" />
        </div>
        <div class="mt-row">
          <button class="mt-btn" id="solveQA">Solve</button>
          <button class="mt-btn mt-btn-secondary" id="clearQA">Clear</button>
        </div>
        <div class="mt-result" id="qaResult">Enter a, b, c and press Solve</div>
      </div>

      <div class="mt-card">
        <div class="mt-card-title"><span class="mt-icon">📈</span> Parabola Graph</div>
        <div style="font-size:0.72rem;color:var(--text-secondary);margin-bottom:6px">Graph of y = ax² + bx + c (uses values from Solver)</div>
        <button class="mt-btn" id="plotQA" style="margin-bottom:8px">Plot Parabola</button>
        <div class="mt-canvas-wrap" id="qaCanvasWrap" style="height:220px"><canvas class="mt-canvas" id="qaCanvas"></canvas></div>
      </div>
    </div>
  </div>

  <!-- 4. BINOMIAL THEOREM -->
  <div class="mt-section" id="section-binom" style="display:none">
    <div class="mt-card" style="max-width:700px">
      <div class="mt-card-title"><span class="mt-icon">🔣</span> Binomial Theorem — (a + b)ⁿ</div>
      <div class="mt-row">
        <span class="mt-label">a =</span><input class="mt-input" id="binA" type="number" placeholder="a" style="max-width:80px"/>
        <span class="mt-label">b =</span><input class="mt-input" id="binB" type="number" placeholder="b" style="max-width:80px"/>
        <span class="mt-label">n =</span><input class="mt-input" id="binN" type="number" min="0" max="30" placeholder="n (0–30)" style="max-width:100px"/>
        <span class="mt-label">r =</span><input class="mt-input" id="binR" type="number" min="0" placeholder="term r (opt)" style="max-width:80px"/>
        <button class="mt-btn" id="calcBin">Expand</button>
        <button class="mt-btn mt-btn-secondary" id="clearBin">Clear</button>
      </div>
      <div class="mt-result" id="binResult">Enter a, b, n — optionally r for a specific term</div>
      <div id="binTableWrap" style="overflow-x:auto;margin-top:10px"></div>
    </div>
  </div>

  <!-- 5. RELATION & FUNCTION -->
  <div class="mt-section" id="section-relfn" style="display:none">
    <div class="mt-grid">
      <div class="mt-card">
        <div class="mt-card-title"><span class="mt-icon">🔗</span> Relation Analyser</div>
        <div style="font-size:0.72rem;color:var(--text-secondary);margin-bottom:8px">
          Enter ordered pairs — e.g. (1,2), (2,3), (3,4)
        </div>
        <div class="mt-row">
          <input class="mt-input" id="relPairs" placeholder="(1,2), (2,3), (1,4), (3,3)" />
          <button class="mt-btn" id="analyseRel">Analyse</button>
          <button class="mt-btn mt-btn-secondary" id="clearRel">Clear</button>
        </div>
        <div class="mt-result" id="relResult">Enter pairs and press Analyse</div>
        <canvas class="mt-rf-canvas" id="relCanvas"></canvas>
      </div>

      <div class="mt-card">
        <div class="mt-card-title"><span class="mt-icon">ƒ</span> Function Type Checker</div>
        <div style="font-size:0.72rem;color:var(--text-secondary);margin-bottom:8px">
          Checks if the relation is a function, and if so its type.
        </div>
        <div class="mt-row">
          <span class="mt-label">Domain set A:</span>
          <input class="mt-input" id="fnDomain" placeholder="e.g. 1, 2, 3, 4" />
        </div>
        <div class="mt-row">
          <span class="mt-label">Co-domain set B:</span>
          <input class="mt-input" id="fnCodomain" placeholder="e.g. 1, 2, 3, 4, 5" />
        </div>
        <div class="mt-row">
          <span class="mt-label">Mapping pairs:</span>
          <input class="mt-input" id="fnPairs" placeholder="(1,2),(2,3),(3,4),(4,5)" />
          <button class="mt-btn" id="checkFn">Check</button>
          <button class="mt-btn mt-btn-secondary" id="clearFn">Clear</button>
        </div>
        <div class="mt-result" id="fnResult">Enter domain, co-domain, and pairs</div>
        <canvas class="mt-rf-canvas" id="fnCanvas"></canvas>
      </div>
    </div>
  </div>
</div>
    `;
  }

  /* ============================================================
     BIND ALL EVENT HANDLERS
     ============================================================ */
  function bindAll() {
    // Sub-tab switching
    document.getElementById('mtSubTabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.mt-sub-btn');
      if (!btn) return;
      document.querySelectorAll('#mtSubTabs .mt-sub-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const sec = btn.dataset.section;
      document.querySelectorAll('#mathToolsRoot .mt-section').forEach(s => s.style.display = 'none');
      document.getElementById('section-' + sec).style.display = 'block';
    });

    // Inequality sub-tabs
    document.getElementById('ineqSubTabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.mt-sub-btn[data-ineq]');
      if (!btn) return;
      document.querySelectorAll('#ineqSubTabs .mt-sub-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      ['linear','quad','modulus','double','wavy'].forEach(t => {
        document.getElementById('ineq-' + t).style.display = (t === btn.dataset.ineq) ? 'block' : 'none';
      });
    });

    // ── P&C ──
    document.getElementById('calcPC').addEventListener('click', calcPC);
    document.getElementById('clearPC').addEventListener('click', () => {
      document.getElementById('pcN').value = '';
      document.getElementById('pcR').value = '';
      document.getElementById('pcResult').innerHTML = 'Enter n and r above, then press Calculate.';
      document.getElementById('pcResult').classList.remove('error');
    });
    document.getElementById('calcFact').addEventListener('click', calcFact);
    document.getElementById('clearFact').addEventListener('click', () => {
      document.getElementById('factN').value = '';
      document.getElementById('factResult').innerHTML = 'Enter n (0–170)';
      document.getElementById('factResult').classList.remove('error');
    });
    document.getElementById('calcMulti').addEventListener('click', calcMultinomial);
    document.getElementById('clearMulti').addEventListener('click', () => {
      document.getElementById('multiN').value = '';
      document.getElementById('multiK').value = '';
      document.getElementById('multiResult').innerHTML = 'n! / (k₁! × k₂! × …)';
      document.getElementById('multiResult').classList.remove('error');
    });

    // ── Inequalities ──
    document.getElementById('solveLinIneq').addEventListener('click', solveLinearIneq);
    document.getElementById('clearLinIneq').addEventListener('click', () => clearIneq('linIneq','linIneqCanvas'));
    document.getElementById('solveQI').addEventListener('click', solveQuadIneq);
    document.getElementById('clearQI').addEventListener('click', () => {
      ['qiA','qiB','qiC'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('qiSign').selectedIndex = 0;
      document.getElementById('qiResult').innerHTML = 'Enter coefficients and sign';
      document.getElementById('qiResult').classList.remove('error');
      const c = document.getElementById('qiCanvas'); if (c) c.getContext('2d').clearRect(0,0,c.width,c.height);
    });
    document.getElementById('solveMod').addEventListener('click', solveModIneq);
    document.getElementById('clearMod').addEventListener('click', () => {
      ['modA','modB','modC','modD'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('modType').selectedIndex = 0;
      document.getElementById('modResult').innerHTML = 'Select type and enter values';
      document.getElementById('modResult').classList.remove('error');
      const c = document.getElementById('modCanvas'); if (c) c.getContext('2d').clearRect(0,0,c.width,c.height);
    });
    document.getElementById('solveDbl').addEventListener('click', solveDoubleIneq);
    document.getElementById('clearDbl').addEventListener('click', clearDoubleIneq);
    document.getElementById('solveWavy').addEventListener('click', solveWavy);
    document.getElementById('clearWavy').addEventListener('click', () => {
      document.getElementById('wavyRoots').value = '';
      document.getElementById('wavyPowers').value = '';
      document.getElementById('wavySign').selectedIndex = 0;
      document.getElementById('wavyResult').innerHTML = 'Enter roots and their multiplicities';
      document.getElementById('wavyResult').classList.remove('error');
      const c = document.getElementById('wavyCanvas'); if (c) c.getContext('2d').clearRect(0,0,c.width,c.height);
    });

    // ── Quadratic ──
    document.getElementById('solveQA').addEventListener('click', solveQuadratic);
    document.getElementById('clearQA').addEventListener('click', () => {
      ['qaA','qaB','qaC'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('qaResult').innerHTML = 'Enter a, b, c and press Solve';
      document.getElementById('qaResult').classList.remove('error');
    });
    document.getElementById('plotQA').addEventListener('click', plotParabola);

    // ── Binomial ──
    document.getElementById('calcBin').addEventListener('click', calcBinomial);
    document.getElementById('clearBin').addEventListener('click', () => {
      ['binA','binB','binN','binR'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('binResult').innerHTML = 'Enter a, b, n — optionally r for a specific term';
      document.getElementById('binResult').classList.remove('error');
      document.getElementById('binTableWrap').innerHTML = '';
    });

    // ── Relation & Function ──
    document.getElementById('analyseRel').addEventListener('click', analyseRelation);
    document.getElementById('clearRel').addEventListener('click', () => {
      document.getElementById('relPairs').value = '';
      document.getElementById('relResult').innerHTML = 'Enter pairs and press Analyse';
      clearCanvas('relCanvas');
    });
    document.getElementById('checkFn').addEventListener('click', checkFunction);
    document.getElementById('clearFn').addEventListener('click', () => {
      ['fnDomain','fnCodomain','fnPairs'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('fnResult').innerHTML = 'Enter domain, co-domain, and pairs';
      document.getElementById('fnResult').classList.remove('error');
      const c = document.getElementById('fnCanvas'); if (c) c.getContext('2d').clearRect(0,0,c.width,c.height);
    });
  }

  /* ============================================================
     1. PERMUTATION & COMBINATION
     ============================================================ */

  /** Exact factorial using BigInt for large values */
  function factBig(n) {
    if (n < 0) throw new Error('n must be ≥ 0');
    let r = 1n;
    for (let i = 2n; i <= BigInt(n); i++) r *= i;
    return r;
  }

  function formatBig(b) {
    const s = b.toString();
    return s.length > 20 ? s.slice(0, 20) + `… (${s.length} digits)` : s;
  }

  function calcPC() {
    const n = parseInt(document.getElementById('pcN').value);
    const r = parseInt(document.getElementById('pcR').value);
    const el = document.getElementById('pcResult');
    el.classList.remove('error');

    if (isNaN(n) || isNaN(r)) { el.innerHTML = 'Please enter both n and r.'; el.classList.add('error'); return; }
    if (n < 0 || r < 0)       { el.innerHTML = 'n and r must be ≥ 0.'; el.classList.add('error'); return; }
    if (r > n)                 { el.innerHTML = 'r cannot be greater than n.'; el.classList.add('error'); return; }

    const nPr = factBig(n) / factBig(n - r);
    const nCr = factBig(n) / (factBig(r) * factBig(n - r));

    el.innerHTML = `
      <div class="mt-result-label" data-sec="perm">Permutation P(n,r) = n! / (n−r)!</div>
      <div class="mt-result-line" data-sec="perm">P(${n}, ${r}) = ${formatBig(nPr)}</div>
      <div class="mt-result-label" data-sec="comb" style="margin-top:8px">Combination C(n,r) = n! / (r! × (n−r)!)</div>
      <div class="mt-result-line" data-sec="comb">C(${n}, ${r}) = ${formatBig(nCr)}</div>
      <div class="mt-result-label" data-sec="pc-rel" style="margin-top:8px">Relation</div>
      <div class="mt-result-line" data-sec="pc-rel">P(n,r) = r! × C(n,r)  →  ${formatBig(nPr)} = ${r}! × ${formatBig(nCr)}</div>
    `;
  }

  function calcFact() {
    const n = parseInt(document.getElementById('factN').value);
    const el = document.getElementById('factResult');
    if (isNaN(n) || n < 0 || n > 170) { el.innerHTML = 'Enter n between 0 and 170'; el.classList.add('error'); return; }
    el.classList.remove('error');
    el.innerHTML = `${n}! = ${formatBig(factBig(n))}`;
  }

  function calcMultinomial() {
    const n  = parseInt(document.getElementById('multiN').value);
    const ks = document.getElementById('multiK').value.split(',').map(s => parseInt(s.trim())).filter(x => !isNaN(x));
    const el = document.getElementById('multiResult');
    el.classList.remove('error');
    if (isNaN(n) || ks.length === 0) { el.innerHTML = 'Enter n and comma-separated k values'; el.classList.add('error'); return; }
    const kSum = ks.reduce((a, b) => a + b, 0);
    if (kSum !== n) { el.innerHTML = `k₁+k₂+…+kₘ must equal n (${kSum} ≠ ${n})`; el.classList.add('error'); return; }
    const denom = ks.reduce((acc, k) => acc * factBig(k), 1n);
    const result = factBig(n) / denom;
    el.innerHTML = `${n}! / (${ks.join('! × ')}!) = ${formatBig(result)}`;
  }

  /* ============================================================
     2. INEQUALITIES
     ============================================================ */

  function clearIneq(resultId, canvasId) {
    document.getElementById(resultId).innerHTML = '';
    document.getElementById(resultId).classList.remove('error');
    const c = document.getElementById(canvasId);
    if (c) { const ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height); }
  }

  /** Draw a number line showing solution intervals
   *  intervals: [ { from, to, openFrom, openTo } ]  — use ±Infinity for unbounded
   */
  function drawNumberLine(canvasId, intervals, roots) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx    = canvas.getContext('2d');
    const W      = canvas.width = canvas.parentElement.clientWidth || 500;
    const H      = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Compute display range
    const finite_roots = roots.filter(r => isFinite(r));
    const pad  = 3;
    let lo = finite_roots.length ? Math.min(...finite_roots) - pad : -5;
    let hi = finite_roots.length ? Math.max(...finite_roots) + pad :  5;
    if (lo === hi) { lo -= 3; hi += 3; }

    const midY = H / 2;
    const margin = 40;
    const lineW  = W - 2 * margin;

    const toX = val => {
      if (val === -Infinity) return margin - 10;
      if (val === +Infinity) return margin + lineW + 10;
      return margin + ((val - lo) / (hi - lo)) * lineW;
    };

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Axis line
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(margin - 15, midY); ctx.lineTo(margin + lineW + 15, midY); ctx.stroke();
    // Arrows
    ctx.fillStyle = '#555';
    arrowHead(ctx, margin + lineW + 15, midY, 'right');
    arrowHead(ctx, margin - 15, midY, 'left');

    // Shade solution intervals
    intervals.forEach(iv => {
      const x1 = toX(iv.from);
      const x2 = toX(iv.to);
      ctx.fillStyle = 'rgba(14,165,233,0.20)';
      ctx.fillRect(x1, midY - 14, x2 - x1, 28);
      ctx.strokeStyle = '#0ea5e9';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x1, midY); ctx.lineTo(x2, midY); ctx.stroke();

      // Endpoints
      drawPoint(ctx, x1, midY, iv.openFrom ? 'open' : 'closed');
      drawPoint(ctx, x2, midY, iv.openTo   ? 'open' : 'closed');
    });

    // Root tick marks + labels
    ctx.fillStyle = '#333';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    roots.filter(r => isFinite(r)).forEach(r => {
      const x = toX(r);
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, midY - 6); ctx.lineTo(x, midY + 6); ctx.stroke();
      ctx.fillText(round4(r), x, midY + 10);
    });

    // Axis scale labels
    ctx.fillStyle = '#999';
    ctx.font = '10px "Inter", sans-serif';
    [lo, hi].forEach(v => {
      ctx.fillText(round4(v), toX(v), midY + 10);
    });
  }

  function arrowHead(ctx, x, y, dir) {
    ctx.beginPath();
    if (dir === 'right') { ctx.moveTo(x, y); ctx.lineTo(x-7, y-4); ctx.lineTo(x-7, y+4); }
    else                 { ctx.moveTo(x, y); ctx.lineTo(x+7, y-4); ctx.lineTo(x+7, y+4); }
    ctx.closePath(); ctx.fill();
  }

  function drawPoint(ctx, x, y, type) {
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    if (type === 'closed') {
      ctx.fillStyle = '#0ea5e9';
      ctx.fill();
    } else {
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#0ea5e9';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function round4(v) { return parseFloat(v.toPrecision(4)).toString(); }

  /** Convert a decimal to a fraction string if it has a clean rational form (e.g. 0.3333 → "1/3") */
  function toFrac(decimal, maxDenom = 120) {
    if (!isFinite(decimal)) return decimal > 0 ? '+∞' : '−∞';
    if (Number.isInteger(decimal)) return String(decimal);
    const sign = decimal < 0 ? '-' : '';
    const abs  = Math.abs(decimal);
    for (let d = 2; d <= maxDenom; d++) {
      const n = Math.round(abs * d);
      if (Math.abs(n / d - abs) < 1e-9) {
        const g = gcdInt(n, d);
        return `${sign}${n/g}/${d/g}`;
      }
    }
    return round4(decimal); // fallback to 4-sig decimal
  }
  function gcdInt(a, b) { return b === 0 ? a : gcdInt(b, a % b); }

  /** Solve ax + b OP c  (supports >, >=, <, <=, =) */
  function solveLinearIneq() {
    let expr = document.getElementById('linIneqExpr').value.trim();
    const el = document.getElementById('linIneqResult');
    el.classList.remove('error');
    if (!expr) { el.innerHTML = 'Enter an inequality'; el.classList.add('error'); return; }

    // Normalise unicode
    expr = expr.replace(/≤/g,'<=').replace(/≥/g,'>=').replace(/−/g,'-');

    // Detect operator
    let op, parts;
    for (const o of ['<=','>=','<','>','=']) {
      if (expr.includes(o)) { op = o; parts = expr.split(o); break; }
    }
    if (!parts || parts.length !== 2) { el.innerHTML = 'Cannot parse. Use: ax + b > c'; el.classList.add('error'); return; }

    // Move everything to LHS: LHS - RHS op 0
    // Parse LHS and RHS as linear in x
    const lhsCoeffs = parseLinear(parts[0]);
    const rhsCoeffs = parseLinear(parts[1]);
    if (!lhsCoeffs || !rhsCoeffs) { el.innerHTML = 'Only linear expressions supported (ax + b)'; el.classList.add('error'); return; }

    const a = lhsCoeffs.a - rhsCoeffs.a; // coefficient of x
    const b = lhsCoeffs.b - rhsCoeffs.b; // constant

    if (a === 0) {
      const alwaysTrue  = evalOp(b, op, 0);
      el.innerHTML = alwaysTrue
        ? `Always true — all real numbers satisfy this inequality.  x ∈ (−∞, +∞)`
        : `Never true — no solution exists.`;
      return;
    }

    // a*x + b op 0  →  x op -b/a  (flip if a < 0)
    let root = -b / a;
    let finalOp = a < 0 ? flipOp(op) : op;
    const { solution, intervals } = opToInterval(root, finalOp);

    el.innerHTML = `
      <div class="mt-result-label" data-sec="ineq-sol">Solution</div>
      <div class="mt-result-line" data-sec="ineq-sol">x ${finalOp} ${round4(root)}</div>
      <div class="mt-result-label" data-sec="ineq-int" style="margin-top:6px">Interval Notation</div>
      <div class="mt-result-line" data-sec="ineq-int">${solution}</div>
    `;
    drawNumberLine('linIneqCanvas', intervals, [root]);
  }

  function parseLinear(str) {
    // Returns { a, b } for ax+b — simple parser
    str = str.trim().replace(/\s+/g, '');
    // Match forms like: 2x+3, -x, 5, x-4, -3x, etc.
    let a = 0, b = 0;
    // Extract x coefficient
    const xMatch = str.match(/([+-]?\d*\.?\d*)\s*x/);
    if (xMatch) {
      const coefStr = xMatch[1];
      a = coefStr === '' || coefStr === '+' ? 1 : coefStr === '-' ? -1 : parseFloat(coefStr);
      str = str.replace(xMatch[0], '');
    }
    // Remaining is constant
    if (str !== '') {
      const val = parseFloat(str.replace(/^\+/, ''));
      if (!isNaN(val)) b = val;
    }
    return { a, b };
  }

  function evalOp(lhs, op, rhs) {
    switch(op) {
      case '<':  return lhs <  rhs;
      case '<=': return lhs <= rhs;
      case '>':  return lhs >  rhs;
      case '>=': return lhs >= rhs;
      case '=':  return lhs === rhs;
    }
  }

  function flipOp(op) {
    return {'>':'<', '<':'>', '>=':'<=', '<=':'>=', '=':'='}[op];
  }

  function opToInterval(root, op) {
    const r = round4(root);
    switch(op) {
      case '<':  return { solution: `(−∞, ${r})`,  intervals: [{ from:-Infinity, to:root, openFrom:true, openTo:true  }] };
      case '<=': return { solution: `(−∞, ${r}]`,  intervals: [{ from:-Infinity, to:root, openFrom:true, openTo:false }] };
      case '>':  return { solution: `(${r}, +∞)`,  intervals: [{ from:root, to:Infinity, openFrom:true,  openTo:true  }] };
      case '>=': return { solution: `[${r}, +∞)`,  intervals: [{ from:root, to:Infinity, openFrom:false, openTo:true  }] };
      case '=':  return { solution: `{${r}}`,       intervals: [{ from:root, to:root, openFrom:false, openTo:false }] };
    }
  }

  /** Quadratic inequality ax²+bx+c op 0 */
  function solveQuadIneq() {
    const a = parseFloat(document.getElementById('qiA').value);
    const b = parseFloat(document.getElementById('qiB').value);
    const c = parseFloat(document.getElementById('qiC').value);
    const signText = document.getElementById('qiSign').value;
    const el = document.getElementById('qiResult');
    el.classList.remove('error');

    if (isNaN(a) || isNaN(b) || isNaN(c)) { el.innerHTML = 'Enter all three coefficients.'; el.classList.add('error'); return; }
    if (a === 0) { el.innerHTML = 'Coefficient a must be non-zero for a quadratic.'; el.classList.add('error'); return; }

    const disc = b*b - 4*a*c;
    const op   = signText.replace(' 0','').trim(); // '>', '≥', '<', '≤'
    const normOp = op.replace('≥','>=').replace('≤','<=');

    let r1, r2, solution, intervals = [], roots = [];

    if (disc < 0) {
      // No real roots — parabola always same sign
      const alwaysPos = a > 0; // opens upward → always positive
      const satisfies = evalOp(alwaysPos ? 1 : -1, normOp, 0);
      solution = satisfies ? 'All real numbers  x ∈ (−∞, +∞)' : 'No solution (empty set)';
    } else if (disc === 0) {
      r1 = r2 = -b / (2*a);
      roots = [r1];
      const incl = normOp === '>=' || normOp === '<=';
      if (normOp === '>' || normOp === '<') {
        solution = normOp === '>' && a > 0 || normOp === '<' && a < 0
          ? `x ∈ (−∞, ${round4(r1)}) ∪ (${round4(r1)}, +∞)`
          : 'No solution';
        intervals = normOp === '>' && a > 0 || normOp === '<' && a < 0
          ? [{ from:-Infinity, to:r1, openFrom:true, openTo:true }, { from:r1, to:Infinity, openFrom:true, openTo:true }]
          : [];
      } else {
        solution = incl ? `x = ${round4(r1)}` : 'No solution';
        intervals = incl ? [{ from:r1, to:r1, openFrom:false, openTo:false }] : [];
      }
    } else {
      r1 = (-b - Math.sqrt(disc)) / (2*a);
      r2 = (-b + Math.sqrt(disc)) / (2*a);
      roots = [r1, r2];
      const incl  = normOp === '>=' || normOp === '<=';
      const wantOut = (normOp === '>' || normOp === '>=') ? a > 0 : a < 0; // want outside roots?

      if (wantOut) {
        solution = incl
          ? `x ∈ (−∞, ${round4(r1)}] ∪ [${round4(r2)}, +∞)`
          : `x ∈ (−∞, ${round4(r1)}) ∪ (${round4(r2)}, +∞)`;
        intervals = [
          { from:-Infinity, to:r1, openFrom:true, openTo:!incl },
          { from:r2, to:Infinity,  openFrom:!incl, openTo:true  }
        ];
      } else {
        solution = incl
          ? `x ∈ [${round4(r1)}, ${round4(r2)}]`
          : `x ∈ (${round4(r1)}, ${round4(r2)})`;
        intervals = [{ from:r1, to:r2, openFrom:!incl, openTo:!incl }];
      }
    }

    el.innerHTML = `
      <div class="mt-result-label" data-sec="ineq-disc">Discriminant Δ = b²−4ac = ${round4(disc)}</div>
      <div class="mt-result-line" data-sec="ineq-disc" style="margin-top:4px">${solution}</div>
    `;
    drawNumberLine('qiCanvas', intervals, roots);
  }

  /** Modulus inequality |ax+b| op c */
  function solveModIneq() {
    const a = parseFloat(document.getElementById('modA').value);
    const b = parseFloat(document.getElementById('modB').value);
    const c = parseFloat(document.getElementById('modC').value);
    const d = parseFloat(document.getElementById('modD').value);
    const type = document.getElementById('modType').value;
    const el = document.getElementById('modResult');
    el.classList.remove('error');

    if (isNaN(a) || isNaN(b) || isNaN(c)) { el.innerHTML = 'Enter values a, b, c.'; el.classList.add('error'); return; }

    let solution = '', intervals = [], roots = [];

    if (type.includes('|cx+d|')) {
      // |ax+b| < |cx+d|  → square both sides: (ax+b)² < (cx+d)²
      // (ax+b-cx-d)(ax+b+cx+d) < 0
      const A = a - (isNaN(d) ? 0 : c);
      const B = b - (isNaN(d) ? 0 : d);
      const C = a + (isNaN(d) ? 0 : c);
      const D = b + (isNaN(d) ? 0 : d);
      const r1 = A !== 0 ? -B/A : NaN;
      const r2 = C !== 0 ? -D/C : NaN;
      roots = [r1, r2].filter(r => isFinite(r)).sort((x,y) => x-y);
      solution = `Critical points: x = ${roots.map(round4).join(', ')}. Test each interval.`;
    } else {
      // Single modulus
      const op = type.includes('< c') ? '<' : type.includes('> c') ? '>' : type.includes('≤') ? '<=' : '>=';
      if (c < 0 && (op === '<' || op === '<=')) {
        solution = 'No solution — |f(x)| ≥ 0 so it cannot be < a negative number.';
      } else if (c < 0 && (op === '>' || op === '>=')) {
        solution = 'All real numbers — |f(x)| ≥ 0 > c for all x.';
        intervals = [{ from:-Infinity, to:Infinity, openFrom:true, openTo:true }];
      } else {
        // |ax+b| < c  →  -c < ax+b < c  →  (-c-b)/a < x < (c-b)/a
        const r1 = (-c - b) / a;
        const r2 = ( c - b) / a;
        const lo  = Math.min(r1, r2);
        const hi  = Math.max(r1, r2);
        roots = [lo, hi];
        const incl = op === '<=' || op === '>=';
        if (op === '<' || op === '<=') {
          solution = incl ? `x ∈ [${round4(lo)}, ${round4(hi)}]` : `x ∈ (${round4(lo)}, ${round4(hi)})`;
          intervals = [{ from:lo, to:hi, openFrom:!incl, openTo:!incl }];
        } else {
          solution = incl
            ? `x ∈ (−∞, ${round4(lo)}] ∪ [${round4(hi)}, +∞)`
            : `x ∈ (−∞, ${round4(lo)}) ∪ (${round4(hi)}, +∞)`;
          intervals = [
            { from:-Infinity, to:lo, openFrom:true, openTo:!incl },
            { from:hi, to:Infinity, openFrom:!incl, openTo:true  }
          ];
        }
      }
    }

    el.innerHTML = `<div class="mt-result-line" data-sec="mod-sol">${solution}</div>`;
  }

  /** Double inequality: a op1 expr op2 b */
  function solveDoubleIneq() {
    const left  = parseFloat(document.getElementById('dblLeft').value);
    const right = parseFloat(document.getElementById('dblRight').value);
    const expr  = document.getElementById('dblExpr').value.trim();
    const sl    = document.getElementById('dblSignL').value;
    const sr    = document.getElementById('dblSignR').value;
    const el    = document.getElementById('dblResult');
    el.classList.remove('error');

    if (isNaN(left) || isNaN(right) || !expr) { el.innerHTML = 'Fill in all fields.'; el.classList.add('error'); return; }

    const coeffs = parseLinear(expr);
    if (!coeffs || coeffs.a === 0) { el.innerHTML = 'Only linear expressions in x are supported.'; el.classList.add('error'); return; }

    const { a, b } = coeffs;
    let lo = (left  - b) / a;
    let hi = (right - b) / a;
    let openLo = sl === '<';
    let openHi = sr === '<';
    if (a < 0) { [lo, hi] = [hi, lo]; [openLo, openHi] = [openHi, openLo]; }

    const loStr = toFrac(lo);
    const hiStr = toFrac(hi);
    const loBracket = openLo ? '(' : '[';
    const hiBracket = openHi ? ')' : ']';
    const slSym = sl === '<' ? '<' : '≤';
    const srSym = sr === '<' ? '<' : '≤';

    const bStr  = b !== 0 ? (b > 0 ? `subtract ${toFrac(b)}` : `add ${toFrac(Math.abs(b))}`) : '';
    const step2 = b !== 0
      ? `${toFrac(left - b)} ${slSym} ${a}x ${srSym} ${toFrac(right - b)}   (${bStr} throughout)`
      : `${toFrac(left)} ${slSym} ${a}x ${srSym} ${toFrac(right)}`;
    const divNote = a < 0 ? '  ← signs flip (÷ negative)' : '';
    const step3 = `${loStr} ${openLo ? '<' : '≤'} x ${openHi ? '<' : '≤'} ${hiStr}   (÷ ${a}${divNote})`;

    el.innerHTML = `
      <div class="mt-result-label" data-sec="dbl-step">Steps</div>
      <div class="mt-result-line" data-sec="dbl-step">① Given:  ${toFrac(left)} ${slSym} ${expr} ${srSym} ${toFrac(right)}</div>
      <div class="mt-result-line" data-sec="dbl-step">② Isolate x:  ${step2}</div>
      <div class="mt-result-line" data-sec="dbl-step">③ Divide:  ${step3}</div>
      <div class="mt-result-label" data-sec="dbl-sol" style="margin-top:8px">Solution</div>
      <div class="mt-result-line" data-sec="dbl-sol">x ∈ ${loBracket}${loStr}, ${hiStr}${hiBracket}</div>
      <div class="mt-result-label" data-sec="dbl-final" style="margin-top:6px">Final Answer</div>
      <div class="mt-result-line" data-sec="dbl-final">✅  x ${openLo ? '>' : '≥'} ${loStr}   and   x ${openHi ? '<' : '≤'} ${hiStr}</div>
    `;
    drawNumberLine('dblCanvas', [{ from:lo, to:hi, openFrom:openLo, openTo:openHi }], [lo, hi]);
  }

  function clearDoubleIneq() {
    document.getElementById('dblLeft').value  = '';
    document.getElementById('dblRight').value = '';
    document.getElementById('dblExpr').value  = '';
    document.getElementById('dblSignL').selectedIndex = 0;
    document.getElementById('dblSignR').selectedIndex = 0;
    const el = document.getElementById('dblResult');
    el.innerHTML = 'Enter a double inequality like 1 &lt; 2x+3 &lt; 9';
    el.classList.remove('error');
    const c = document.getElementById('dblCanvas');
    if (c) { const ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height); }
  }

  /** Wavy Curve Method */
  function solveWavy() {
    const rootsRaw  = document.getElementById('wavyRoots').value.split(',').map(s => parseFloat(s.trim())).filter(v => !isNaN(v));
    const powsRaw   = document.getElementById('wavyPowers').value.split(',').map(s => parseInt(s.trim())).filter(v => !isNaN(v));
    const signChoice = document.getElementById('wavySign').value; // "f(x) > 0" etc.
    const el = document.getElementById('wavyResult');
    el.classList.remove('error');

    if (rootsRaw.length === 0) { el.innerHTML = 'Enter at least one root.'; el.classList.add('error'); return; }

    // Default powers to 1 if not given
    const powers = rootsRaw.map((_, i) => powsRaw[i] ?? 1);
    // Sort roots ascending, zipping with powers
    const pairs = rootsRaw.map((r, i) => ({ root: r, pow: powers[i] })).sort((a, b) => a.root - b.root);
    const sorted = pairs.map(p => p.root);
    const sortedPows = pairs.map(p => p.pow);

    // Wavy curve: start from rightmost → sign alternates only at odd-power roots
    // Determine sign for x → +∞ (leading coefficient positive)
    let signRight = 1; // assume product coefficient > 0

    // Build sign in each interval (n+1 intervals for n roots)
    const intervals = []; // world intervals with sign
    let currentSign = signRight;
    // Process from right to left
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (i === sorted.length - 1) {
        // Rightmost interval: (root_n, +∞), sign = +
        intervals.unshift({ from: sorted[i], to: Infinity, sign: currentSign, openFrom: true, openTo: true });
      } else {
        intervals.unshift({ from: sorted[i], to: sorted[i+1], sign: currentSign, openFrom: true, openTo: true });
      }
      // Crossing root i → flip sign only if odd power
      if (sortedPows[i] % 2 === 1) currentSign = -currentSign;
    }
    // Leftmost interval: (-∞, root_0)
    intervals.unshift({ from: -Infinity, to: sorted[0], sign: currentSign, openFrom: true, openTo: true });

    // Determine which sign we want
    const wantPos  = signChoice.includes('> 0') || signChoice.includes('≥ 0');
    const wantIncl = signChoice.includes('≥') || signChoice.includes('≤');

    const solutions = [];
    intervals.forEach(iv => {
      const matchSign = wantPos ? iv.sign > 0 : iv.sign < 0;
      if (matchSign) {
        // Check if root endpoint can be included
        const openL = !wantIncl || iv.from === -Infinity;
        const openR = !wantIncl || iv.to   === Infinity;
        solutions.push({ from: iv.from, to: iv.to, openFrom: openL, openTo: openR });
      } else if (iv.sign === 0 && wantIncl) {
        // At the root itself
        solutions.push({ from: iv.from, to: iv.from, openFrom: false, openTo: false });
      }
    });

    // If include roots, add root points where sign = 0 and inequality allows
    if (wantIncl) {
      sorted.forEach(r => {
        if (!solutions.some(iv => iv.from <= r && iv.to >= r)) {
          solutions.push({ from: r, to: r, openFrom: false, openTo: false });
        }
      });
    }

    // Format solution text
    const fmt = (iv) => {
      const lb = iv.openFrom ? '(' : '[';
      const rb = iv.openTo   ? ')' : ']';
      const l  = iv.from === -Infinity ? '−∞' : round4(iv.from);
      const r  = iv.to   === +Infinity ? '+∞' : round4(iv.to);
      return `${lb}${l}, ${r}${rb}`;
    };
    solutions.sort((a,b) => (a.from === -Infinity ? -Infinity : a.from) - (b.from === -Infinity ? -Infinity : b.from));
    const solutionText = solutions.length > 0 ? solutions.map(fmt).join(' ∪ ') : 'No solution';

    el.innerHTML = `
      <div class="mt-result-label" data-sec="wavy-roots">Roots: ${sorted.map(round4).join(', ')}   |   Powers: ${sortedPows.join(', ')}</div>
      <div class="mt-result-line" data-sec="wavy-sol" style="margin-top:4px">Solution: x ∈ ${solutionText}</div>
    `;

    drawWavyCanvas('wavyCanvas', sorted, sortedPows, intervals, solutions);
  }

  function drawWavyCanvas(id, roots, powers, signIntervals, solutions) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const W   = canvas.width = canvas.parentElement.clientWidth || 500;
    const H   = canvas.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,W,H);

    const margin = 40;
    const midY   = H * 0.45;
    const lineW  = W - 2 * margin;
    const pad    = 2;
    const lo     = roots.length ? Math.min(...roots) - pad : -5;
    const hi     = roots.length ? Math.max(...roots) + pad :  5;
    const toX    = v => { if(v===-Infinity) return margin-10; if(v===Infinity) return margin+lineW+10; return margin+((v-lo)/(hi-lo))*lineW; };

    // Shade solutions
    solutions.forEach(iv => {
      const x1 = toX(iv.from); const x2 = toX(iv.to);
      ctx.fillStyle = 'rgba(14,165,233,0.15)';
      ctx.fillRect(x1, midY-12, x2-x1, 24);
    });

    // Draw wavy curve (sinusoidal between roots with sign)
    ctx.beginPath();
    ctx.strokeStyle = '#e05a00';
    ctx.lineWidth = 2;
    const steps = W * 2;
    for (let i = 0; i <= steps; i++) {
      const x = lo + (i / steps) * (hi - lo);
      const px = toX(x);
      // Determine sign at this x
      let sign = 1;
      for (let j = 0; j < roots.length; j++) if (x > roots[j] && powers[j] % 2 === 1) sign = -sign;
      // Use sine curve that goes up/down according to sign, squeezing near roots
      const distToNearest = roots.length ? Math.min(...roots.map(r => Math.abs(x-r))) : 1;
      const amp = Math.min(distToNearest * 0.4, 14);
      const py  = midY - sign * amp * Math.sin(x * Math.PI * 0.6 + 0.5);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Axis
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(margin-15, midY); ctx.lineTo(margin+lineW+15, midY); ctx.stroke();
    arrowHead(ctx, margin+lineW+15, midY, 'right');

    // Root points + labels
    ctx.font = 'bold 11px "JetBrains Mono",monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    roots.forEach((r, i) => {
      const x = toX(r);
      ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, midY-5); ctx.lineTo(x, midY+5); ctx.stroke();
      ctx.fillStyle = '#333';
      ctx.fillText(`${round4(r)}${powers[i]>1?'('+powers[i]+')':''}`, x, midY-16);
      // Circle at root
      ctx.beginPath(); ctx.arc(x, midY, 4, 0, Math.PI*2);
      ctx.fillStyle = '#fff'; ctx.fill();
      ctx.strokeStyle = '#e05a00'; ctx.lineWidth = 1.5; ctx.stroke();
    });

    // Sign labels in each interval
    ctx.font = 'bold 13px "Inter",sans-serif';
    ctx.textBaseline = 'middle';
    const allBounds = [-Infinity, ...roots, Infinity];
    signIntervals.forEach((iv, i) => {
      const mid = isFinite(iv.from) && isFinite(iv.to) ? (iv.from+iv.to)/2 : isFinite(iv.from) ? iv.from+pad/2 : iv.to-pad/2;
      const px  = toX(mid);
      ctx.fillStyle = iv.sign > 0 ? '#059669' : '#dc2626';
      ctx.textAlign = 'center';
      ctx.fillText(iv.sign > 0 ? '+' : '−', px, midY + 24);
    });
  }

  /* ============================================================
     3. QUADRATIC EQUATION SOLVER + PARABOLA
     ============================================================ */

  function solveQuadratic() {
    const a = parseFloat(document.getElementById('qaA').value);
    const b = parseFloat(document.getElementById('qaB').value);
    const c = parseFloat(document.getElementById('qaC').value);
    const el = document.getElementById('qaResult');
    el.classList.remove('error');

    if (isNaN(a) || isNaN(b) || isNaN(c)) { el.innerHTML = 'Enter a, b, c.'; el.classList.add('error'); return; }
    if (a === 0) { el.innerHTML = 'a must be non-zero.'; el.classList.add('error'); return; }

    const disc  = b*b - 4*a*c;
    const vx    = -b / (2*a);
    const vy    = c - (b*b)/(4*a);

    let rootInfo;
    if (disc > 0) {
      const r1 = (-b + Math.sqrt(disc)) / (2*a);
      const r2 = (-b - Math.sqrt(disc)) / (2*a);
      rootInfo  = `Two real roots:  x₁ = ${round4(r1)},  x₂ = ${round4(r2)}`;
    } else if (disc === 0) {
      const r = -b / (2*a);
      rootInfo = `One repeated root:  x = ${round4(r)}`;
    } else {
      const realPart = -b / (2*a);
      const imagPart = Math.sqrt(-disc) / (2*a);
      rootInfo = `Complex roots:  x = ${round4(realPart)} ± ${round4(imagPart)}i`;
    }

    el.innerHTML = `
      <div class="mt-result-label" data-sec="disc">Discriminant  Δ = b²−4ac</div>
      <div class="mt-result-line" data-sec="disc">Δ = ${round4(disc)}  →  ${disc>0?'Two real roots':disc===0?'One repeated root':'Complex roots'}</div>
      <div class="mt-result-label" data-sec="roots" style="margin-top:6px">Roots</div>
      <div class="mt-result-line" data-sec="roots">${rootInfo}</div>
      <div class="mt-result-label" data-sec="vertex" style="margin-top:6px">Vertex (turning point)</div>
      <div class="mt-result-line" data-sec="vertex">(${round4(vx)}, ${round4(vy)})</div>
      <div class="mt-result-label" data-sec="vform" style="margin-top:6px">Vertex Form</div>
      <div class="mt-result-line" data-sec="vform">y = ${a}(x − ${round4(vx)})² + ${round4(vy)}</div>
      <div class="mt-result-label" data-sec="sumproduct" style="margin-top:6px">Sum &amp; Product of roots</div>
      <div class="mt-result-line" data-sec="sumproduct">Sum = −b/a = ${round4(-b/a)}   |   Product = c/a = ${round4(c/a)}</div>
    `;
  }

  // Store parabola state for hover interaction
  let _parabolaState = null;

  function plotParabola() {
    const a = parseFloat(document.getElementById('qaA').value);
    const b = parseFloat(document.getElementById('qaB').value);
    const c = parseFloat(document.getElementById('qaC').value);
    const canvas = document.getElementById('qaCanvas');
    if (!canvas) return;
    const W   = canvas.width  = canvas.parentElement.clientWidth  || 400;
    const H   = canvas.height = canvas.parentElement.clientHeight || 220;
    const ctx = canvas.getContext('2d');

    if (isNaN(a) || a === 0) { ctx.fillStyle='#ef4444'; ctx.fillRect(0,0,W,H); ctx.fillStyle='#fff'; ctx.font='14px Inter'; ctx.fillText('Enter valid a ≠ 0', 20, H/2); return; }

    const vx = -b / (2*a);
    const vy = a*vx*vx + b*vx + c;
    const xRange = 6;
    const lo  = vx - xRange;
    const hi  = vx + xRange;
    const pts = [];
    for (let i = 0; i <= W; i++) {
      const x = lo + (i/W)*(hi-lo);
      pts.push({ x, y: a*x*x + b*x + c });
    }
    const ys = pts.map(p=>p.y).filter(isFinite);
    let yMin = Math.min(...ys), yMax = Math.max(...ys);
    if (yMin === yMax) { yMin -= 1; yMax += 1; }
    yMin -= (yMax-yMin)*0.1; yMax += (yMax-yMin)*0.15;

    const toCanvasX = x => (x - lo) / (hi - lo) * W;
    const toCanvasY = y => H - (y - yMin) / (yMax - yMin) * H;
    const fromCanvasX = px => lo + (px / W) * (hi - lo);

    // Compute root points
    const disc = b*b - 4*a*c;
    const rootPoints = [];
    if (disc >= 0) {
      rootPoints.push({ x: (-b+Math.sqrt(disc))/(2*a), y: 0, label: 'Root x₁', color: '#10b981' });
      if (disc > 0) rootPoints.push({ x: (-b-Math.sqrt(disc))/(2*a), y: 0, label: 'Root x₂', color: '#10b981' });
    }
    const specialPoints = [
      { x: vx, y: vy, label: 'Vertex', color: '#e05a00' },
      ...rootPoints
    ];

    // Store state for redrawing
    _parabolaState = { a, b, c, lo, hi, yMin, yMax, W, H, pts, specialPoints, toCanvasX, toCanvasY, fromCanvasX };

    drawParabolaFrame(ctx, _parabolaState, null);

    // Remove old listener and add fresh one
    const newCanvas = canvas.cloneNode(true);
    canvas.parentElement.replaceChild(newCanvas, canvas);
    newCanvas.addEventListener('mousemove', onParabolaHover);
    newCanvas.addEventListener('mouseleave', () => {
      const ctx2 = newCanvas.getContext('2d');
      drawParabolaFrame(ctx2, _parabolaState, null);
    });
  }

  function onParabolaHover(e) {
    if (!_parabolaState) return;
    const canvas = e.currentTarget;
    const ctx    = canvas.getContext('2d');
    const rect   = canvas.getBoundingClientRect();
    const mx     = e.clientX - rect.left;
    const my     = e.clientY - rect.top;

    // Check if near any special point (20px radius)
    let hovered = null;
    for (const sp of _parabolaState.specialPoints) {
      const px = _parabolaState.toCanvasX(sp.x);
      const py = _parabolaState.toCanvasY(sp.y);
      if (Math.hypot(mx - px, my - py) < 20) { hovered = { ...sp, px, py }; break; }
    }
    drawParabolaFrame(ctx, _parabolaState, hovered);
  }

  function drawParabolaFrame(ctx, state, hovered) {
    const { a, b, c, W, H, pts, specialPoints, toCanvasX, toCanvasY, lo, hi, yMin, yMax } = state;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    drawGraphGrid(ctx, W, H, lo, hi, yMin, yMax, toCanvasX, toCanvasY);

    // Parabola curve
    ctx.beginPath();
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth   = 2.5;
    pts.forEach(({x,y}, i) => {
      if (!isFinite(y)) return;
      const px = toCanvasX(x);
      const py = toCanvasY(y);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Draw all special points
    specialPoints.forEach(sp => {
      const px = toCanvasX(sp.x);
      const py = toCanvasY(sp.y);
      const isHov = hovered && sp.label === hovered.label;
      ctx.beginPath();
      ctx.arc(px, py, isHov ? 8 : 6, 0, Math.PI*2);
      ctx.fillStyle = sp.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Tooltip for hovered point
    if (hovered) {
      const tx = hovered.px;
      const ty = hovered.py;
      const xStr = toFrac(hovered.x);
      const yStr = toFrac(hovered.y);
      const lines = [hovered.label, `x = ${xStr}`, `y = ${yStr}`];
      const pad   = 10;
      const lh    = 18;
      ctx.font = 'bold 12px "JetBrains Mono",monospace';
      const maxW  = Math.max(...lines.map(l => ctx.measureText(l).width));
      const bw    = maxW + pad*2;
      const bh    = lines.length * lh + pad*1.5;

      let bx = tx + 14;
      let by = ty - bh / 2;
      if (bx + bw > W - 4) bx = tx - bw - 14;
      if (by < 4) by = 4;
      if (by + bh > H - 4) by = H - bh - 4;

      // Tooltip background
      ctx.fillStyle = 'rgba(15,23,42,0.92)';
      const r = 7;
      ctx.beginPath();
      ctx.moveTo(bx+r, by); ctx.lineTo(bx+bw-r, by);
      ctx.quadraticCurveTo(bx+bw, by, bx+bw, by+r);
      ctx.lineTo(bx+bw, by+bh-r);
      ctx.quadraticCurveTo(bx+bw, by+bh, bx+bw-r, by+bh);
      ctx.lineTo(bx+r, by+bh);
      ctx.quadraticCurveTo(bx, by+bh, bx, by+bh-r);
      ctx.lineTo(bx, by+r);
      ctx.quadraticCurveTo(bx, by, bx+r, by);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = hovered.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Tooltip text
      lines.forEach((line, i) => {
        ctx.fillStyle = i === 0 ? hovered.color : (i === 1 ? '#00d4ff' : '#34d399');
        ctx.font = i === 0 ? 'bold 11px "Inter",sans-serif' : '12px "JetBrains Mono",monospace';
        ctx.textAlign = 'left';
        ctx.fillText(line, bx + pad, by + pad + i * lh + (i === 0 ? 0 : 4));
      });

      // Dashed crosshair lines
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = hovered.color + '55';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(tx, 0); ctx.lineTo(tx, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(W, ty); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Label
    ctx.fillStyle = '#0ea5e9';
    ctx.font = 'bold 11px "JetBrains Mono",monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`y = ${a}x² + ${b}x + ${c}`, 10, 16);
  }

  function drawGraphGrid(ctx, W, H, xMin, xMax, yMin, yMax, toX, toY) {
    // Grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth   = 0.5;
    const xs = 5, ys = 4;
    for (let i = 0; i <= xs; i++) {
      const x = xMin + (i/xs)*(xMax-xMin);
      ctx.beginPath(); ctx.moveTo(toX(x),0); ctx.lineTo(toX(x),H); ctx.stroke();
    }
    for (let i = 0; i <= ys; i++) {
      const y = yMin + (i/ys)*(yMax-yMin);
      ctx.beginPath(); ctx.moveTo(0,toY(y)); ctx.lineTo(W,toY(y)); ctx.stroke();
    }
    // Axes
    const originX = toX(0), originY = toY(0);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1.5;
    if (originX >= 0 && originX <= W) { ctx.beginPath(); ctx.moveTo(originX,0); ctx.lineTo(originX,H); ctx.stroke(); }
    if (originY >= 0 && originY <= H) { ctx.beginPath(); ctx.moveTo(0,originY); ctx.lineTo(W,originY); ctx.stroke(); }
  }

  /* ============================================================
     4. BINOMIAL THEOREM
     ============================================================ */

  function binomCoeff(n, r) {
    if (r < 0 || r > n) return 0n;
    return factBig(n) / (factBig(r) * factBig(n-r));
  }

  function calcBinomial() {
    const a = parseFloat(document.getElementById('binA').value);
    const b = parseFloat(document.getElementById('binB').value);
    const n = parseInt(document.getElementById('binN').value);
    const r = document.getElementById('binR').value.trim();
    const el = document.getElementById('binResult');
    const tableWrap = document.getElementById('binTableWrap');
    el.classList.remove('error');
    tableWrap.innerHTML = '';

    if (isNaN(a) || isNaN(b) || isNaN(n) || n < 0 || n > 30) {
      el.innerHTML = 'Enter valid a, b, and n (0–30).';
      el.classList.add('error');
      return;
    }

    // Specific term Tr+1 if r is given
    if (r !== '') {
      const rVal = parseInt(r);
      if (isNaN(rVal) || rVal < 0 || rVal > n) {
        el.innerHTML = `r must be between 0 and ${n}.`;
        el.classList.add('error');
        return;
      }
      const coeff  = binomCoeff(n, rVal);
      const aPow   = n - rVal;
      const bPow   = rVal;
      const numVal = Number(coeff) * Math.pow(a, aPow) * Math.pow(b, bPow);
      el.innerHTML = `
        <div class="mt-result-label" data-sec="binom-term">Term T_{r+1} = T_{${rVal+1}}</div>
        <div class="mt-result-line" data-sec="binom-term">C(${n},${rVal}) × a^${aPow} × b^${bPow}</div>
        <div class="mt-result-line" data-sec="binom-term">= ${formatBig(coeff)} × ${a}^${aPow} × ${b}^${bPow}</div>
        <div class="mt-result-line" data-sec="binom-term">= ${numVal.toPrecision(8)}</div>
      `;
    }

    // Full expansion value
    const totalVal = Math.pow(a + b, n);
    el.innerHTML += `
      <div class="mt-result-label" data-sec="binom-total" style="margin-top:8px">Total value: (${a} + ${b})^${n}</div>
      <div class="mt-result-line" data-sec="binom-total">= ${totalVal.toPrecision(10)}</div>
      <div class="mt-result-label" data-sec="binom-final" style="margin-top:6px">Final Answer</div>
      <div class="mt-result-line" data-sec="binom-final">✅ (${a} + ${b})^${n} = <b>${Number.isInteger(totalVal) ? totalVal : totalVal.toPrecision(6)}</b></div>
    `;

    // Build term table
    const terms = [];
    for (let k = 0; k <= n; k++) {
      const coeff = binomCoeff(n, k);
      const aPow  = n - k;
      const bPow  = k;
      const val   = Number(coeff) * Math.pow(a, aPow) * Math.pow(b, bPow);
      terms.push({ k, coeff, aPow, bPow, val });
    }

    const table = document.createElement('table');
    table.className = 'mt-table';
    table.innerHTML = `
      <thead><tr>
        <th>r</th><th>Term T_{r+1}</th><th>C(n,r)</th>
        <th>a^(n−r)</th><th>b^r</th><th>Value</th>
      </tr></thead>
      <tbody>
        ${terms.map(t => `<tr>
          <td>${t.k}</td>
          <td>T_{${t.k+1}}</td>
          <td>${formatBig(t.coeff)}</td>
          <td>${a}^${t.aPow} = ${Math.pow(a,t.aPow).toPrecision(5)}</td>
          <td>${b}^${t.bPow} = ${Math.pow(b,t.bPow).toPrecision(5)}</td>
          <td>${t.val.toPrecision(6)}</td>
        </tr>`).join('')}
      </tbody>
    `;
    tableWrap.appendChild(table);
  }

  /* ============================================================
     5. RELATION & FUNCTION
     ============================================================ */

  function parsePairs(str) {
    const pairs = [];
    const re    = /\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/g;
    let m;
    while ((m = re.exec(str)) !== null) {
      pairs.push([parseFloat(m[1]), parseFloat(m[2])]);
    }
    return pairs;
  }

  function analyseRelation() {
    const str  = document.getElementById('relPairs').value;
    const el   = document.getElementById('relResult');
    const pairs = parsePairs(str);
    el.classList.remove('error');

    if (pairs.length === 0) { el.innerHTML = 'No valid pairs found. Use format (1,2),(3,4)'; el.classList.add('error'); return; }

    const domain   = [...new Set(pairs.map(p => p[0]))].sort((a,b)=>a-b);
    const range    = [...new Set(pairs.map(p => p[1]))].sort((a,b)=>a-b);
    const isFunc   = domain.length === pairs.length; // each domain element appears once

    // Properties
    const isRefl   = domain.every(x => pairs.some(p => p[0]===x && p[1]===x));
    const isSymm   = pairs.every(p => pairs.some(q => q[0]===p[1] && q[1]===p[0]));
    const isTrans  = pairs.every(p => pairs.filter(q => q[0]===p[1]).every(q => pairs.some(r => r[0]===p[0] && r[1]===q[1])));
    const isEquiv  = isRefl && isSymm && isTrans;

    el.innerHTML = `
      <div class="mt-result-label" data-sec="rf-domain">Domain</div>
      <div class="mt-result-line" data-sec="rf-domain">{${domain.join(', ')}}</div>
      <div class="mt-result-label" data-sec="rf-range" style="margin-top:6px">Range</div>
      <div class="mt-result-line" data-sec="rf-range">{${range.join(', ')}}</div>
      <div class="mt-result-label" data-sec="rf-props" style="margin-top:6px">Properties</div>
      <div class="mt-result-line" data-sec="rf-props">
        Is a Function: ${isFunc ? '✅ Yes' : '❌ No (some domain element maps to multiple values)'}<br>
        Reflexive: ${isRefl ? '✅' : '❌'}  |  Symmetric: ${isSymm ? '✅' : '❌'}  |  Transitive: ${isTrans ? '✅' : '❌'}<br>
        Equivalence Relation: ${isEquiv ? '✅ Yes' : '❌ No'}
      </div>
    `;

    drawRelationDiagram('relCanvas', domain, range, pairs, false);
  }

  function checkFunction() {
    const domStr  = document.getElementById('fnDomain').value;
    const codStr  = document.getElementById('fnCodomain').value;
    const pairStr = document.getElementById('fnPairs').value;
    const el      = document.getElementById('fnResult');
    el.classList.remove('error');

    const domain   = domStr.split(',').map(s=>s.trim()).filter(Boolean);
    const codomain = codStr.split(',').map(s=>s.trim()).filter(Boolean);
    const pairs    = parsePairs(pairStr);

    if (!domain.length || !codomain.length || !pairs.length) {
      el.innerHTML = 'Please fill in all three fields.';
      el.classList.add('error');
      return;
    }

    // Convert to string-keyed for comparison
    const domSet  = new Set(domain);
    const codSet  = new Set(codomain);
    const pairMap = {};
    pairs.forEach(p => {
      const key = String(p[0]);
      if (!pairMap[key]) pairMap[key] = [];
      pairMap[key].push(String(p[1]));
    });

    // Is function: every domain element maps to exactly one codomain element
    const isFunc = domain.every(d => pairMap[d] && pairMap[d].length === 1 && codSet.has(pairMap[d][0]));

    // Find which domain elements (if any) are missing or have multiple images
    const notFuncReasons = [];
    domain.forEach(d => {
      if (!pairMap[d] || pairMap[d].length === 0) notFuncReasons.push(`"${d}" has no image`);
      else if (pairMap[d].length > 1) notFuncReasons.push(`"${d}" maps to multiple values: {${pairMap[d].join(', ')}}`);
      else if (!codSet.has(pairMap[d][0])) notFuncReasons.push(`"${d}" maps to "${pairMap[d][0]}" which is not in the codomain`);
    });

    let funcType = '', typeReason = '', injLine = '', surLine = '';
    if (isFunc) {
      const rangeVals = Object.values(pairMap).flat();
      const rangeSet  = new Set(rangeVals);
      const isInj = rangeVals.length === rangeSet.size; // One-to-One: no two domain elements share an image
      const isSur = codomain.every(c => rangeSet.has(c)); // Onto: every codomain element is covered

      // Injective reasoning
      if (isInj) {
        injLine = `✅ One-to-One (Injective): Every domain element maps to a <b>distinct</b> codomain element — no two inputs share the same output.`;
      } else {
        const dupes = [];
        rangeSet.forEach(img => {
          const sources = domain.filter(d => pairMap[d] && pairMap[d][0] === String(img));
          if (sources.length > 1) dupes.push(`${sources.join(', ')} → ${img}`);
        });
        injLine = `❌ Many-One (Not Injective): Multiple domain elements share the same image — <b>${dupes.join(' ; ')}</b>`;
      }

      // Surjective reasoning
      if (isSur) {
        surLine = `✅ Onto (Surjective): Every codomain element <b>{${codomain.join(', ')}}</b> has at least one pre-image.`;
      } else {
        const uncovered = codomain.filter(c => !rangeSet.has(c));
        surLine = `❌ Into (Not Surjective): Codomain elements <b>{${uncovered.join(', ')}}</b> have no pre-image — function does not cover the full codomain.`;
      }

      if (isInj && isSur) {
        funcType = '🔷 Bijective — One-to-One and Onto';
        typeReason = 'The function is both injective and surjective, making it a perfect one-to-one correspondence between domain and codomain.';
      } else if (isInj && !isSur) {
        funcType = '🔹 Injective Into — One-to-One but not Onto (Into)';
        typeReason = 'Each domain element maps to a unique codomain element, but some codomain elements remain uncovered → Into function.';
      } else if (!isInj && isSur) {
        funcType = '🔸 Many-One Onto — Surjective but not One-to-One';
        typeReason = 'Every codomain element is covered, but multiple domain elements share images → Many-One Onto function.';
      } else {
        funcType = '🔺 Many-One Into — Neither Injective nor Surjective';
        typeReason = 'Multiple domain elements share images AND some codomain elements are uncovered → Many-One Into function.';
      }
    }

    el.innerHTML = `
      <div class="mt-result-line" data-sec="fn-check">Is a Function: ${isFunc ? '✅ Yes — every domain element has exactly one image in the codomain.' : `❌ No — ${notFuncReasons.join('; ')}`}</div>
      ${isFunc ? `
        <div class="mt-result-label" data-sec="fn-type" style="margin-top:8px">Function Type</div>
        <div class="mt-result-line" data-sec="fn-type"><b>${funcType}</b></div>
        <div class="mt-result-label" data-sec="fn-reason" style="margin-top:8px">Reason</div>
        <div class="mt-result-line" data-sec="fn-reason">${typeReason}</div>
        <div class="mt-result-label" data-sec="fn-inj" style="margin-top:8px">One-to-One Check</div>
        <div class="mt-result-line" data-sec="fn-inj">${injLine}</div>
        <div class="mt-result-label" data-sec="fn-sur" style="margin-top:6px">Onto Check</div>
        <div class="mt-result-line" data-sec="fn-sur">${surLine}</div>
      ` : ''}
    `;

    // Draw mapping diagram
    const domNums  = domain.map(Number);
    const codNums  = codomain.map(Number);
    const pairNums = pairs.map(p => [p[0], p[1]]);
    drawRelationDiagram('fnCanvas', domNums.length ? domNums : domain, codNums.length ? codNums : codomain, pairNums, true);
  }

  function drawRelationDiagram(canvasId, domArr, rangeArr, pairs, isFunctionMode) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const W   = canvas.width  = canvas.offsetWidth || 420;
    const H   = canvas.height = Math.max(220, Math.max(domArr.length, rangeArr.length) * 44 + 60);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,W,H);

    const margin = 24;
    const ellW   = 80;
    const ellH   = H - 50;
    const lx     = margin + ellW / 2;
    const rx     = W - margin - ellW / 2;
    const cy     = H / 2 + 8;

    // Draw ellipses
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.ellipse(lx, cy, ellW/2, ellH/2, 0, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(rx, cy, ellW/2, ellH/2, 0, 0, Math.PI*2); ctx.stroke();

    // Labels
    ctx.fillStyle = '#0ea5e9';
    ctx.font = 'bold 11px "Inter",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Domain A', lx, margin + 4);
    ctx.fillText('Co-domain B', rx, margin + 4);

    // Position points
    const posL = domArr.map((v, i) => ({ val: v, x: lx, y: cy - ellH/2 + (i+1) * (ellH / (domArr.length+1)) }));
    const posR = rangeArr.map((v, i) => ({ val: v, x: rx, y: cy - ellH/2 + (i+1) * (ellH / (rangeArr.length+1)) }));

    // Count how many domain elements map to each codomain element (for color logic)
    const imageCounts = {};
    pairs.forEach(([from, to]) => { imageCounts[String(to)] = (imageCounts[String(to)] || 0) + 1; });

    // Draw arrows
    pairs.forEach(([from, to]) => {
      const lp = posL.find(p => String(p.val) === String(from));
      const rp = posR.find(p => String(p.val) === String(to));
      if (!lp || !rp) return;

      const isManyOne = imageCounts[String(to)] > 1;
      const arrowColor = isManyOne ? '#e05a00' : '#7c3aed';

      const startX = lp.x + ellW/2 - 6;
      const startY = lp.y;
      const endX   = rp.x - ellW/2 + 6;
      const endY   = rp.y;

      ctx.strokeStyle = arrowColor;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Arrowhead (solid triangle)
      const dx    = endX - startX;
      const dy    = endY - startY;
      const angle = Math.atan2(dy, dx);
      const aLen  = 11;
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - aLen*Math.cos(angle - 0.38), endY - aLen*Math.sin(angle - 0.38));
      ctx.lineTo(endX - aLen*Math.cos(angle + 0.38), endY - aLen*Math.sin(angle + 0.38));
      ctx.closePath();
      ctx.fillStyle = arrowColor;
      ctx.fill();
    });

    // Highlight uncovered codomain elements in red
    const coveredRange = new Set(pairs.map(([,to]) => String(to)));

    // Draw dots and labels
    posL.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI*2);
      ctx.fillStyle = '#0ea5e9'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#111';
      ctx.font = 'bold 11px "JetBrains Mono",monospace';
      ctx.textAlign = 'right';
      ctx.fillText(String(p.val), p.x - 10, p.y + 4);
    });
    posR.forEach(p => {
      const uncovered = !coveredRange.has(String(p.val));
      ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI*2);
      ctx.fillStyle = uncovered ? '#ef4444' : '#0ea5e9'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = uncovered ? '#ef4444' : '#111';
      ctx.font = 'bold 11px "JetBrains Mono",monospace';
      ctx.textAlign = 'left';
      ctx.fillText(String(p.val), p.x + 10, p.y + 4);
    });

    // Legend
    const legendY = H - 10;
    ctx.font = '9px "Inter",sans-serif';
    ctx.fillStyle = '#7c3aed'; ctx.textAlign = 'left';
    ctx.fillText('● One-to-One arrow', margin, legendY);
    ctx.fillStyle = '#e05a00';
    ctx.fillText('● Many-One arrow', margin + 130, legendY);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('● Uncovered element', margin + 255, legendY);
  }

  function clearCanvas(id) {
    const c = document.getElementById(id);
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
  }

})();
