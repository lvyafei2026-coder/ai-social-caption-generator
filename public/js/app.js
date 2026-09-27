const btn = document.getElementById('generateBtn');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const resultEl = document.getElementById('result');
const resultTextEl = document.getElementById('resultText');
const resultMetaEl = document.getElementById('resultMeta');

async function generate() {
  const tr = (window.__i18n && window.__i18n.t) || {};
  const base = (window.__i18n && window.__i18n.base) || '';

  const topic = document.getElementById('topic').value.trim();
  const details = document.getElementById('details').value.trim();
  const platform = document.getElementById('platform').value;
  const tone = document.getElementById('tone').value;

  errorEl.style.display = 'none';
  resultEl.classList.remove('show');

  if (topic.length < 5) {
    showError(tr.errTopic || 'Please enter a topic (at least 5 characters).');
    return;
  }

  btn.disabled = true;
  loadingEl.style.display = 'flex';

  try {
    const res = await fetch(base + '/api/generate-caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, details, platform, tone })
    });

    if (res.status === 429) {
      showError(tr.errRateLimit || 'Too many requests. Please wait a minute and try again.');
      return;
    }

    const data = await res.json();
    if (!res.ok) {
      showError(data.error || (tr.errGeneric || 'Something went wrong.'));
      return;
    }

    resultTextEl.textContent = data.output;
    const variants = (data.output.match(/## Variant/g) || []).length;
    resultMetaEl.textContent = (tr.metaVariants || 'Variants:') + ' ' + (variants || 3);
    resultEl.classList.add('show');
  } catch (err) {
    console.error(err);
    showError(tr.errNetwork || 'Network error. Please try again.');
  } finally {
    btn.disabled = false;
    loadingEl.style.display = 'none';
  }
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.style.display = 'block';
}

function copyResult() {
  const text = resultTextEl.textContent;
  navigator.clipboard.writeText(text).then(() => {
    const el = document.getElementById('copyCopied');
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1800);
  }).catch(() => { prompt('Copy:', text); });
}

window.generate = generate;
window.copyResult = copyResult;