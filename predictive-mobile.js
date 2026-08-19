(() => {
  'use strict';

  const media = window.matchMedia('(max-width: 900px)');
  const sourceInput = document.getElementById('q');
  const sourceSearchButton = document.getElementById('searchBtn');
  const legacySuggest = document.getElementById('suggestBox');
  if (!sourceInput || !sourceSearchButton) return;

  let layer = null;
  let mobileInput = null;
  let results = null;
  let requestController = null;
  let debounceTimer = 0;
  let composing = false;
  let open = false;
  let inerted = [];

  const create = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  };

  function isMobile() {
    return media.matches;
  }

  function setBackgroundInert(on) {
    if (!('inert' in HTMLElement.prototype)) return;
    if (on) {
      inerted = [...document.body.children].filter(el => el !== layer && !el.inert);
      inerted.forEach(el => { el.inert = true; });
    } else {
      inerted.forEach(el => { el.inert = false; });
      inerted = [];
    }
  }

  function ensureLayer() {
    if (layer) return;

    layer = create('section', 'mobile-predictive-search');
    layer.id = 'mobilePredictiveSearch';
    layer.hidden = true;
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-labelledby', 'mobilePredictiveTitle');

    const shell = create('div', 'mobile-predictive-shell');
    const top = create('div', 'mobile-predictive-top');

    const back = create('button', 'mobile-predictive-back', '‹');
    back.type = 'button';
    back.setAttribute('aria-label', '検索画面を閉じる');

    const field = create('div', 'mobile-predictive-field');
    const icon = create('span', 'mobile-predictive-icon', '⌕');
    icon.setAttribute('aria-hidden', 'true');

    mobileInput = create('input', 'mobile-predictive-input');
    mobileInput.id = 'mobilePredictiveInput';
    mobileInput.type = 'search';
    mobileInput.autocomplete = 'off';
    mobileInput.autocapitalize = 'off';
    mobileInput.spellcheck = false;
    mobileInput.enterKeyHint = 'search';
    mobileInput.placeholder = 'キャラ・作品・グッズ名を入力';
    mobileInput.setAttribute('aria-label', '予測検索');

    const clear = create('button', 'mobile-predictive-clear', '×');
    clear.type = 'button';
    clear.setAttribute('aria-label', '入力をクリア');

    const submit = create('button', 'mobile-predictive-submit', '検索');
    submit.type = 'button';

    field.append(icon, mobileInput, clear);
    top.append(back, field, submit);

    const heading = create('div', 'mobile-predictive-heading');
    const title = create('b', '', '予測検索');
    title.id = 'mobilePredictiveTitle';
    const signal = create('span', '', '人気・新着・一致度');
    heading.append(title, signal);

    results = create('div', 'mobile-predictive-results');
    results.id = 'mobilePredictiveResults';
    results.setAttribute('role', 'listbox');
    results.setAttribute('aria-label', '予測検索候補');
    results.setAttribute('aria-live', 'polite');

    shell.append(top, heading, results);
    layer.append(shell);
    document.body.append(layer);

    back.addEventListener('click', closeLayer);
    clear.addEventListener('click', () => {
      mobileInput.value = '';
      cancelRequest();
      renderMessage('キャラ・作品・グッズ名を入力すると、候補を表示します。');
      mobileInput.focus({ preventScroll: true });
    });
    submit.addEventListener('click', () => submitQuery(mobileInput.value));

    mobileInput.addEventListener('compositionstart', () => { composing = true; });
    mobileInput.addEventListener('compositionend', () => {
      composing = false;
      scheduleSuggest();
    });
    mobileInput.addEventListener('input', () => {
      if (!composing) scheduleSuggest();
    });
    mobileInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitQuery(mobileInput.value);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        closeLayer();
      }
    });
  }

  function renderMessage(message, detail = '') {
    if (!results) return;
    results.replaceChildren();
    const box = create('div', 'mobile-predictive-message');
    box.append(create('b', '', message));
    if (detail) box.append(create('span', '', detail));
    results.append(box);
  }

  function renderLoading() {
    if (!results) return;
    results.replaceChildren();
    const row = create('div', 'mobile-predictive-loading');
    row.append(create('span', 'mobile-predictive-spinner'));
    row.append(create('span', '', '候補を確認しています…'));
    results.append(row);
  }

  function renderSuggestions(items) {
    results.replaceChildren();
    if (!items.length) {
      renderMessage('予測候補が見つかりませんでした。', '入力した検索語のまま「検索」を押せます。');
      return;
    }

    const fragment = document.createDocumentFragment();
    items.slice(0, 8).forEach(item => {
      const name = String(item?.name || '').trim();
      if (!name) return;

      const button = create('button', 'mobile-predictive-row');
      button.type = 'button';
      button.setAttribute('role', 'option');
      button.dataset.value = name;

      const copy = create('span', 'mobile-predictive-copy');
      copy.append(create('b', '', name));

      const metaParts = [item?.label, item?.detail].filter(Boolean).map(String);
      if (metaParts.length) copy.append(create('small', '', metaParts.join(' ・ ')));

      const arrow = create('span', 'mobile-predictive-arrow', '›');
      arrow.setAttribute('aria-hidden', 'true');
      button.append(copy, arrow);
      button.addEventListener('click', () => submitQuery(name));
      fragment.append(button);
    });
    results.append(fragment);
  }

  function cancelRequest() {
    clearTimeout(debounceTimer);
    requestController?.abort();
    requestController = null;
  }

  function scheduleSuggest() {
    cancelRequest();
    const q = mobileInput.value.trim();
    if ([...q].length < 2) {
      renderMessage('2文字以上入力すると予測候補を表示します。');
      return;
    }
    debounceTimer = window.setTimeout(() => loadSuggestions(q), 280);
  }

  async function loadSuggestions(q) {
    cancelRequest();
    requestController = new AbortController();
    const controller = requestController;
    renderLoading();

    try {
      const response = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`, {
        headers: { accept: 'application/json' },
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`suggest_${response.status}`);
      const data = await response.json();
      if (controller !== requestController || !open) return;
      renderSuggestions(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {
      if (error?.name === 'AbortError' || controller !== requestController || !open) return;
      renderMessage('予測候補を取得できませんでした。', '入力した検索語のまま検索できます。');
    }
  }

  function openLayer() {
    if (!isMobile() || open) return;
    ensureLayer();

    open = true;
    cancelRequest();
    legacySuggest?.classList.add('hidden');
    mobileInput.value = sourceInput.value || '';
    layer.hidden = false;
    document.body.classList.add('mobile-predictive-open');
    setBackgroundInert(true);

    if ([...mobileInput.value.trim()].length >= 2) scheduleSuggest();
    else renderMessage('キャラ・作品・グッズ名を入力すると、候補を表示します。');

    requestAnimationFrame(() => {
      layer.classList.add('is-open');
      window.setTimeout(() => mobileInput.focus({ preventScroll: true }), 0);
    });
  }

  function closeLayer() {
    if (!open) return;
    open = false;
    cancelRequest();
    layer?.classList.remove('is-open');
    document.body.classList.remove('mobile-predictive-open');
    setBackgroundInert(false);
    if (layer) layer.hidden = true;
  }

  function submitQuery(value) {
    const q = String(value || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    if (!q) {
      mobileInput?.focus({ preventScroll: true });
      return;
    }

    sourceInput.value = q;
    closeLayer();
    legacySuggest?.classList.add('hidden');
    window.setTimeout(() => sourceSearchButton.click(), 0);
  }

  sourceInput.addEventListener('pointerdown', event => {
    if (!isMobile()) return;
    event.preventDefault();
    openLayer();
  }, { passive: false });

  sourceInput.addEventListener('focus', () => {
    if (!isMobile() || open) return;
    sourceInput.blur();
    openLayer();
  });

  media.addEventListener?.('change', event => {
    if (!event.matches) closeLayer();
  });
})();
