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
  let queryPreview = null;
  let clearButton = null;
  let submitButton = null;
  let requestController = null;
  let debounceTimer = 0;
  let composing = false;
  let open = false;
  let submitting = false;
  let inerted = [];

  const create = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  };
  const isMobile = () => media.matches;

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
    mobileInput = create('input', 'mobile-predictive-input');
    mobileInput.id = 'mobilePredictiveInput';
    mobileInput.type = 'search';
    mobileInput.autocomplete = 'off';
    mobileInput.autocapitalize = 'off';
    mobileInput.spellcheck = false;
    mobileInput.enterKeyHint = 'search';
    mobileInput.placeholder = 'キャラ・作品・グッズ名を入力';
    mobileInput.setAttribute('aria-label', '検索キーワード');

    clearButton = create('button', 'mobile-predictive-clear', '×');
    clearButton.type = 'button';
    clearButton.setAttribute('aria-label', '入力をクリア');

    field.append(mobileInput, clearButton);
    top.append(back, field);

    queryPreview = create('div', 'mobile-predictive-query-preview');
    queryPreview.hidden = true;
    queryPreview.setAttribute('aria-live', 'polite');
    queryPreview.append(create('span', '', '入力中'));
    queryPreview.append(create('b', 'mobile-predictive-query-preview-text', ''));

    const heading = create('div', 'mobile-predictive-heading');
    const headingCopy = create('div', 'mobile-predictive-heading-copy');
    const title = create('b', '', '検索候補');
    title.id = 'mobilePredictiveTitle';
    headingCopy.append(title, create('span', '', '近い候補・人気・新着を優先'));
    submitButton = create('button', 'mobile-predictive-submit', 'この言葉で検索');
    submitButton.type = 'button';
    heading.append(headingCopy, submitButton);

    results = create('div', 'mobile-predictive-results');
    results.id = 'mobilePredictiveResults';
    results.setAttribute('role', 'listbox');
    results.setAttribute('aria-label', '検索候補');
    results.setAttribute('aria-live', 'polite');

    shell.append(top, queryPreview, heading, results);
    layer.append(shell);
    document.body.append(layer);

    back.addEventListener('click', closeLayer);
    clearButton.addEventListener('click', () => {
      mobileInput.value = '';
      cancelRequest();
      syncInputChrome();
      renderMessage('検索したい言葉を入力してください。', 'キャラ・作品・グッズ名は、空白があってもなくても検索できます。');
      mobileInput.focus({ preventScroll: true });
    });
    submitButton.addEventListener('click', () => submitQuery(mobileInput.value));

    mobileInput.addEventListener('compositionstart', () => { composing = true; });
    mobileInput.addEventListener('compositionend', () => {
      composing = false;
      syncInputChrome();
      scheduleSuggest();
    });
    mobileInput.addEventListener('input', () => {
      syncInputChrome();
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

  function syncInputChrome() {
    if (!mobileInput) return;
    const value = mobileInput.value.trim();
    if (clearButton) clearButton.hidden = !value;
    if (submitButton) submitButton.disabled = !value || submitting;
    requestAnimationFrame(() => {
      if (!queryPreview || !mobileInput) return;
      const overflowed = mobileInput.scrollWidth > mobileInput.clientWidth + 3 || [...value].length >= 18;
      queryPreview.hidden = !value || !overflowed;
      const text = queryPreview.querySelector('.mobile-predictive-query-preview-text');
      if (text) text.textContent = value;
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
    const visible = items.filter(item => String(item?.name || '').trim()).slice(0, 6);
    if (!visible.length) {
      renderMessage('近い候補は見つかりませんでした。', '入力した言葉のまま検索できます。');
      return;
    }

    const fragment = document.createDocumentFragment();
    visible.forEach(item => {
      const name = String(item.name).trim();
      const button = create('button', 'mobile-predictive-row');
      button.type = 'button';
      button.setAttribute('role', 'option');
      button.dataset.value = name;
      button.dataset.kind = String(item.kind || 'search');

      const copy = create('span', 'mobile-predictive-copy');
      copy.append(create('b', '', name));

      const meta = create('span', 'mobile-predictive-meta');
      if (item.label) meta.append(create('span', 'mobile-predictive-badge', String(item.label)));
      if (item.detail) meta.append(create('small', '', String(item.detail)));
      if (meta.childNodes.length) copy.append(meta);

      const action = create('span', 'mobile-predictive-arrow', item.kind === 'exact' ? '検索' : '›');
      action.setAttribute('aria-hidden', 'true');
      button.append(copy, action);
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
      renderMessage('2文字以上入力すると候補を表示します。', '誤字や表記ゆれも、分かる範囲で補正します。');
      return;
    }
    debounceTimer = window.setTimeout(() => loadSuggestions(q), 320);
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
      if (controller !== requestController || !open || mobileInput.value.trim() !== q) return;
      renderSuggestions(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {
      if (error?.name === 'AbortError' || controller !== requestController || !open) return;
      renderMessage('候補を取得できませんでした。', '入力した言葉のまま検索できます。');
    }
  }

  function openLayer() {
    if (!isMobile() || open) return;
    ensureLayer();
    open = true;
    submitting = false;
    cancelRequest();
    legacySuggest?.classList.add('hidden');
    mobileInput.value = sourceInput.value || '';
    syncInputChrome();
    layer.hidden = false;
    document.body.classList.add('mobile-predictive-open');
    setBackgroundInert(true);

    if ([...mobileInput.value.trim()].length >= 2) scheduleSuggest();
    else renderMessage('検索したい言葉を入力してください。', 'キャラ・作品・グッズ名を自由に組み合わせられます。');

    requestAnimationFrame(() => {
      layer.classList.add('is-open');
      window.setTimeout(() => {
        mobileInput.focus({ preventScroll: true });
        mobileInput.setSelectionRange?.(mobileInput.value.length, mobileInput.value.length);
      }, 0);
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

  function executeSourceSearch() {
    if (typeof window.runSearch === 'function') {
      window.runSearch();
      return;
    }
    sourceSearchButton.click();
  }

  function submitQuery(value) {
    const q = String(value || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    if (!q || submitting) {
      if (!q) mobileInput?.focus({ preventScroll: true });
      return;
    }
    submitting = true;
    syncInputChrome();
    sourceInput.value = q;
    closeLayer();
    legacySuggest?.classList.add('hidden');
    requestAnimationFrame(() => {
      executeSourceSearch();
      window.setTimeout(() => { submitting = false; }, 0);
    });
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
