(() => {
  const reduz = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* Títulos: line-mask ao entrar na tela */
  const alvos = $$('section');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    alvos.forEach((s) => io.observe(s));
  } else {
    alvos.forEach((s) => s.classList.add('in'));
  }
  $('.hero')?.classList.add('in');

  /* Rolagem: escotilha, topo, rota e barra */
  const hero = $('.hero');
  const esc = $('.escotilha');
  const topo = $('.topo');
  const rota = $('.rota');
  const barra = $('.barra');
  let pendente = false;
  const quadro = () => {
    pendente = false;
    const y = window.scrollY;
    const h = hero.offsetHeight;
    if (!reduz.matches && esc) {
      const p = Math.min(1, Math.max(0, y / (h * 0.75)));
      esc.style.setProperty('--p', p.toFixed(3));
    }
    topo.classList.toggle('solido', y > 40);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    rota?.style.setProperty('--rota', max > 0 ? (y / max).toFixed(4) : 0);
    const fimVisivel = $('#atracar').getBoundingClientRect().top < window.innerHeight * 0.6;
    const temItens = !document.querySelector('.barra-sacola')?.hidden;
    barra?.classList.toggle('on', (y > h * 0.7 && !fimVisivel) || (temItens && y > h * 0.3));
  };
  const agenda = () => { if (!pendente) { pendente = true; requestAnimationFrame(quadro); } };
  window.addEventListener('scroll', agenda, { passive: true });
  window.addEventListener('resize', agenda);
  reduz.addEventListener?.('change', () => { esc?.style.setProperty('--p', 0); agenda(); });
  quadro();

  /* Porto ativo na rota */
  const portos = $$('.rota a');
  if (portos.length && 'IntersectionObserver' in window) {
    const ioP = new IntersectionObserver((ents) => {
      ents.forEach((e) => {
        if (e.isIntersecting) portos.forEach((a) => a.classList.toggle('ativo', a.dataset.porto === e.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    portos.forEach((a) => { const s = document.getElementById(a.dataset.porto); if (s) ioP.observe(s); });
  }

  /* Filtros do cardápio — ix-filter-chips com FLIP */
  const chips = $$('.chip');
  const cards = $$('.burger');
  const status = $('.filtro-status');
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const f = chip.dataset.filtro;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    const antes = new Map(cards.filter((c) => !c.hidden).map((c) => [c, c.getBoundingClientRect()]));
    let n = 0;
    cards.forEach((c) => {
      const mostra = f === 'todos' || c.dataset.tags.split(' ').includes(f);
      c.hidden = !mostra;
      if (mostra && !c.classList.contains('burger-kraken')) n++;
    });
    status.textContent = f === 'todos' ? '' : `${n} ${n === 1 ? 'hambúrguer' : 'hambúrgueres'} nesta rota`;
    if (reduz.matches) return;
    cards.forEach((c) => {
      if (c.hidden) return;
      const r = c.getBoundingClientRect();
      const a = antes.get(c);
      if (a) {
        const dx = a.left - r.left, dy = a.top - r.top;
        if (dx || dy) c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' });
      } else {
        c.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' });
      }
    });
  }));

  /* Kraken — seletor e preço em rolo (ix-quantity-roll) */
  const krakens = {
    2: { nome: 'Double Kraken', preco: '39,90' },
    3: { nome: 'Triple Kraken', preco: '49,90' },
    4: { nome: 'Monster Kraken', preco: '59,90' },
  };
  const rolo = $('.rolo');
  const precoTxt = $('.kraken-preco-txt');
  const montaRolo = (txt) => {
    rolo.textContent = '';
    precoTxt.textContent = `Preço: R$ ${txt}`;
    [...`R$ ${txt}`].forEach((ch) => {
      if (/\d/.test(ch)) {
        const dig = document.createElement('span'); dig.className = 'dig'; dig.setAttribute('aria-hidden', 'true');
        const col = document.createElement('span');
        for (let i = 0; i < 10; i++) { const s = document.createElement('span'); s.textContent = i; col.append(s); }
        col.style.transform = `translateY(-${ch}em)`;
        dig.append(col); rolo.append(dig);
      } else {
        const s = document.createElement('span'); s.setAttribute('aria-hidden', 'true'); s.textContent = ch === ' ' ? ' ' : ch; rolo.append(s);
      }
    });
  };
  const atualizaRolo = (txt) => {
    const digs = $$('.dig > span', rolo);
    const nums = txt.replace(/\D/g, '');
    if (digs.length !== nums.length) return montaRolo(txt);
    precoTxt.textContent = `Preço: R$ ${txt}`;
    digs.forEach((col, i) => { col.style.transform = `translateY(-${nums[i]}em)`; });
  };
  if (rolo) montaRolo(rolo.dataset.preco);
  const pilha = $$('.pilha i');
  const fotos = $$('.kraken-foto img');
  const setPilha = (k) => pilha.forEach((p, i) => p.classList.toggle('fora', i >= k));
  setPilha(2);
  $$('input[name="kraken"]').forEach((r) => r.addEventListener('change', () => {
    const k = Number(r.value);
    const dados = krakens[k];
    $('.kraken-nome').textContent = dados.nome;
    $$('.kn').forEach((s) => { s.textContent = k; });
    atualizaRolo(dados.preco);
    setPilha(k);
    const atual = fotos.find((f) => !f.hidden);
    const nova = fotos.find((f) => Number(f.dataset.k) === k);
    if (atual === nova) return;
    if (reduz.matches) { atual.hidden = true; nova.hidden = false; return; }
    nova.hidden = false; nova.classList.remove('sai'); nova.classList.add('entra');
    nova.style.zIndex = 2; atual.style.zIndex = 1;
    atual.classList.add('sai');
    setTimeout(() => { atual.hidden = true; atual.classList.remove('sai'); nova.classList.remove('entra'); }, 400);
  }));

  /* Trilho de porções */
  const trilho = $('.trilho');
  const setas = $$('.seta');
  const confereSetas = () => {
    const max = trilho.scrollWidth - trilho.clientWidth - 2;
    setas[0].disabled = trilho.scrollLeft <= 2;
    setas[1].disabled = trilho.scrollLeft >= max;
  };
  if (trilho && setas.length) {
    setas.forEach((b) => b.addEventListener('click', () => {
      const passo = (trilho.querySelector('.porcao')?.offsetWidth || 260) + 18;
      trilho.scrollBy({ left: passo * 2 * Number(b.dataset.dir), behavior: reduz.matches ? 'auto' : 'smooth' });
    }));
    trilho.addEventListener('scroll', confereSetas, { passive: true });
    window.addEventListener('resize', confereSetas);
    confereSetas();
  }

  /* Pedido pela página → mensagem no WhatsApp */
  const WA = '5548991351155';
  let catalogo = {};
  try { catalogo = JSON.parse($('#catalogo').textContent); } catch (e) { catalogo = {}; }
  const brl = (v) => 'R$ ' + v.toFixed(2).replace('.', ',');
  const CHAVE = 'theship-pedido-v1';
  let itens = {};
  try { const s = JSON.parse(localStorage.getItem(CHAVE) || '{}'); for (const k in s) if (catalogo[k] && s[k] > 0) itens[k] = Math.min(99, s[k] | 0); } catch (e) { itens = {}; }
  const salva = () => { try { localStorage.setItem(CHAVE, JSON.stringify(itens)); } catch (e) { /* sem armazenamento */ } };

  const sacola = $('.sacola');
  const lista = $('.sacola-itens');
  const form = $('.sacola-form');
  const erro = $('.sacola-erro');
  const aviso = $('.aviso-add');
  const sacolaBtns = $$('[data-abrir-sacola]');
  const topoSacola = $('.sacola-btn');
  const totais = () => {
    let n = 0, v = 0;
    for (const k in itens) { n += itens[k]; v += itens[k] * catalogo[k].p; }
    return { n, v };
  };

  const render = () => {
    const { n, v } = totais();
    $('.sacola-n').textContent = n;
    topoSacola.setAttribute('aria-label', `Abrir pedido, ${n} ${n === 1 ? 'item' : 'itens'}`);
    $('.sacola-subtotal').textContent = brl(v);
    sacola.classList.toggle('vazia', n === 0);
    const barraSac = $('.barra-sacola');
    barraSac.hidden = n === 0;
    $('.barra-resumo').textContent = `${n} ${n === 1 ? 'item' : 'itens'} · ${brl(v)}`;
    $$('.barra-montar, .barra-wa').forEach((a) => { a.hidden = n > 0; });
    $$('.add[data-add]').forEach((b) => {
      const q = itens[b.dataset.add] || 0;
      b.classList.toggle('tem', q > 0);
      b.querySelector('.qtd').textContent = q || '';
    });
    lista.textContent = '';
    for (const k in itens) {
      const it = catalogo[k];
      const li = document.createElement('li');
      li.innerHTML = `<span class="si-nome"></span><span class="si-preco"></span>
        <span class="si-ctrl"><button type="button" data-menos></button><output></output><button type="button" data-mais>+</button></span>`;
      li.querySelector('.si-nome').textContent = it.n;
      li.querySelector('.si-preco').textContent = `${brl(it.p)} · ${brl(it.p * itens[k])}`;
      li.querySelector('output').textContent = itens[k];
      const menos = li.querySelector('[data-menos]');
      menos.textContent = itens[k] === 1 ? '×' : '−';
      menos.setAttribute('aria-label', itens[k] === 1 ? `Remover ${it.n}` : `Diminuir ${it.n}`);
      li.querySelector('[data-mais]').setAttribute('aria-label', `Aumentar ${it.n}`);
      menos.addEventListener('click', () => muda(k, -1, menos));
      li.querySelector('[data-mais]').addEventListener('click', () => muda(k, 1));
      lista.append(li);
    }
    salva();
    agenda();
  };

  const muda = (k, d, origemFoco) => {
    const pos = Object.keys(itens).indexOf(k);
    itens[k] = (itens[k] || 0) + d;
    if (itens[k] <= 0) delete itens[k];
    else itens[k] = Math.min(99, itens[k]);
    render();
    if (origemFoco) {
      const n = lista.children.length;
      const alvo = n ? lista.children[Math.min(pos, n - 1)].querySelector('[data-menos]') : $('.fechar');
      alvo?.focus();
    }
  };

  let avisoT;
  const avisa = (txt) => {
    aviso.textContent = txt;
    aviso.classList.add('on');
    clearTimeout(avisoT);
    avisoT = setTimeout(() => aviso.classList.remove('on'), 1800);
  };

  const voa = (de) => {
    const alvoBtn = window.matchMedia('(max-width: 760px)').matches && !$('.barra-sacola').hidden ? $('.barra-sacola') : topoSacola;
    const pulsa = () => { alvoBtn.classList.remove('pulso'); void alvoBtn.offsetWidth; alvoBtn.classList.add('pulso'); };
    if (reduz.matches || !de || !alvoBtn.getBoundingClientRect().width) return pulsa();
    const a = de.getBoundingClientRect(), b = alvoBtn.getBoundingClientRect();
    const dot = document.createElement('span'); dot.className = 'voo';
    dot.style.left = a.left + a.width / 2 + 'px'; dot.style.top = a.top + a.height / 2 + 'px';
    document.body.append(dot);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    dot.animate([
      { transform: 'translate(0,0) scale(1)' },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) scale(1.2)`, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(.5)`, opacity: 0.6 },
    ], { duration: 560, easing: 'cubic-bezier(.45,0,.25,1)' }).onfinish = () => { dot.remove(); pulsa(); };
  };

  const adiciona = (k, botao) => {
    if (!catalogo[k]) return;
    itens[k] = Math.min(99, (itens[k] || 0) + 1);
    render();
    if (botao) { botao.classList.remove('pulso'); void botao.offsetWidth; botao.classList.add('pulso'); }
    voa(botao);
    avisa(`${catalogo[k].n} no pedido (${itens[k]})`);
  };

  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('.add[data-add]');
    if (b) adiciona(b.dataset.add, b);
  });
  $('[data-add-kraken]')?.addEventListener('click', (ev) => {
    const k = Number($('input[name="kraken"]:checked').value);
    adiciona({ 2: 'double-kraken', 3: 'triple-kraken', 4: 'monster-kraken' }[k], ev.currentTarget);
  });

  const abre = () => {
    if (typeof sacola.showModal !== 'function') { sacola.setAttribute('open', ''); return; }
    sacola.classList.remove('saindo');
    sacola.showModal();
    erro.textContent = '';
  };
  const fecha = () => {
    if (!sacola.open) return;
    if (reduz.matches) return sacola.close();
    sacola.classList.add('saindo');
    setTimeout(() => { sacola.classList.remove('saindo'); sacola.close(); }, 250);
  };
  sacolaBtns.forEach((b) => b.addEventListener('click', abre));
  $('.sacola-cab').addEventListener('submit', (ev) => { ev.preventDefault(); fecha(); });
  sacola.addEventListener('cancel', (ev) => { ev.preventDefault(); fecha(); });
  sacola.addEventListener('click', (ev) => { if (ev.target === sacola) fecha(); });

  const campoEnd = $('.campo-end');
  const syncModo = () => { campoEnd.hidden = form.modo.value !== 'Entrega'; };
  $$('input[name="modo"]', form).forEach((r) => r.addEventListener('change', syncModo));
  syncModo();

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const { n, v } = totais();
    const nome = form.nome.value.trim();
    const end = form.endereco.value.trim();
    const modo = form.modo.value;
    form.nome.removeAttribute('aria-invalid'); form.endereco.removeAttribute('aria-invalid');
    if (!n) { erro.textContent = 'Adicione pelo menos um item.'; return; }
    if (!nome) { erro.textContent = 'Informe seu nome.'; form.nome.setAttribute('aria-invalid', 'true'); form.nome.focus(); return; }
    if (modo === 'Entrega' && end.length < 6) { erro.textContent = 'Informe o endereço de entrega ou escolha retirada.'; form.endereco.setAttribute('aria-invalid', 'true'); form.endereco.focus(); return; }
    erro.textContent = '';
    const linhas = ['Olá, The Ship! Quero fazer um pedido pelo site:', ''];
    for (const k in itens) linhas.push(`${itens[k]}x ${catalogo[k].n} — ${brl(catalogo[k].p * itens[k])}`);
    linhas.push('', `Subtotal: ${brl(v)}`, `Nome: ${nome}`);
    linhas.push(modo === 'Entrega' ? `Entrega: ${end}` : 'Retirada no balcão');
    const obs = form.obs.value.trim();
    if (obs) linhas.push(`Observações: ${obs}`);
    linhas.push('', 'Valores do site; aguardo a confirmação do total, taxa e pagamento.');
    const url = `https://wa.me/${WA}?text=${encodeURIComponent(linhas.join('\n'))}`;
    window.open(url, '_blank', 'noopener');
  });

  render();
})();
