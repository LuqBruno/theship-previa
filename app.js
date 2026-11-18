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
    barra?.classList.toggle('on', y > h * 0.7 && !fimVisivel);
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
})();
