(() => {
  'use strict';

  const intro = document.getElementById('introCutin');
  const storage = {
    get(key){ try { return sessionStorage.getItem(key); } catch { return null; } },
    set(key,value){ try { sessionStorage.setItem(key,value); } catch {} }
  };

  function dismissIntro(immediate=false){
    if(!intro) return;
    if(immediate){ intro.remove(); return; }
    intro.classList.add('is-leaving');
    window.setTimeout(() => intro.remove(), 320);
  }

  if(intro){
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const seen = storage.get('oshiru-intro-v2') === '1';
    if(reduced || seen){
      dismissIntro(true);
    }else{
      storage.set('oshiru-intro-v2','1');
      const release = () => window.setTimeout(() => dismissIntro(false), 760);
      if(document.readyState === 'complete') release();
      else window.addEventListener('load', release, {once:true});
      window.setTimeout(() => dismissIntro(false), 1450);
      intro.addEventListener('click', () => dismissIntro(false), {once:true});
      window.addEventListener('keydown', e => { if(e.key === 'Escape') dismissIntro(false); }, {once:true});
    }
  }

  const categoryFor = label => {
    if(['価格','送料','実質額'].includes(label)) return 'price';
    if(['状態','販売状況'].includes(label)) return 'state';
    if(['確認'].includes(label)) return 'time';
    return 'base';
  };

  const numericYen = text => {
    const m = String(text || '').replace(/,/g,'').match(/¥\s*(\d+)/);
    return m ? Number(m[1]) : null;
  };

  function highlightBest(table){
    const rows = [...table.querySelectorAll('tr')];
    for(const row of rows){
      const head = row.querySelector('th');
      if(!head || !['価格','送料','実質額'].includes(head.textContent.trim())) continue;
      const cells = [...row.querySelectorAll('td')];
      const values = cells.map(td => numericYen(td.textContent));
      const valid = values.filter(Number.isFinite);
      if(!valid.length) continue;
      const min = Math.min(...valid);
      cells.forEach((td,i) => td.classList.toggle('best-value', values[i] === min));
    }
  }

  function enhanceCompare(){
    const table = document.querySelector('#modalContent .compare-table');
    if(!table || table.dataset.v2Enhanced === '1') return;
    table.dataset.v2Enhanced = '1';

    [...table.querySelectorAll('tr')].forEach(row => {
      const label = row.querySelector('th')?.textContent.trim() || '';
      row.dataset.compareGroup = categoryFor(label);
    });

    const bar = document.createElement('div');
    bar.className = 'compare-filterbar';
    bar.innerHTML = `
      <span class="compare-label">比較する項目</span>
      <button type="button" class="compare-tab active" data-compare-filter="all">すべて</button>
      <button type="button" class="compare-tab" data-compare-filter="price">料金</button>
      <button type="button" class="compare-tab" data-compare-filter="state">状態</button>
      <button type="button" class="compare-tab" data-compare-filter="time">更新時期</button>`;

    const tip = document.createElement('p');
    tip.className = 'compare-tip';
    tip.textContent = '料金では最安値を強調します。送料不明の商品は総額を断定せず、販売元での確認を優先します。';

    table.parentNode.insertBefore(bar, table);
    table.parentNode.insertBefore(tip, table);

    bar.addEventListener('click', e => {
      const btn = e.target.closest('[data-compare-filter]');
      if(!btn) return;
      const filter = btn.dataset.compareFilter;
      bar.querySelectorAll('.compare-tab').forEach(x => x.classList.toggle('active', x === btn));
      [...table.querySelectorAll('tr')].forEach((row,index) => {
        if(index === 0){ row.classList.remove('compare-row-hidden'); return; }
        const group = row.dataset.compareGroup || 'base';
        const visible = filter === 'all' || group === filter || group === 'base';
        row.classList.toggle('compare-row-hidden', !visible);
      });
    });

    highlightBest(table);
  }

  function markAffiliateCards(){
    document.querySelectorAll('.product-card').forEach(card => {
      const link=card.querySelector('.card-actions a[href]');
      if(!link) return;
      let affiliate=false;
      try{ affiliate=new URL(link.href,location.href).hostname==='hb.afl.rakuten.co.jp'; }catch{}
      const row=card.querySelector('.tag-row');
      const existing=card.querySelector('.affiliate-tag');
      if(affiliate && row && !existing){
        const tag=document.createElement('span');
        tag.className='tag affiliate-tag';
        tag.textContent='PR';
        tag.title='アフィリエイトリンクを含みます';
        row.appendChild(tag);
      }else if(!affiliate && existing){
        existing.remove();
      }
    });
  }

  const modalContent = document.getElementById('modalContent');
  if(modalContent){
    new MutationObserver(() => window.setTimeout(enhanceCompare,0))
      .observe(modalContent,{childList:true,subtree:true});
  }

  const productGrid=document.getElementById('productGrid');
  if(productGrid){
    new MutationObserver(() => window.setTimeout(markAffiliateCards,0))
      .observe(productGrid,{childList:true,subtree:true});
  }
  markAffiliateCards();

  document.getElementById('openCompare')?.addEventListener('click', () => window.setTimeout(enhanceCompare,0));
})();
