/* ==========================================================================
   CONTAGIE · movimento e comportamento da página
   Bibliotecas hospedadas no próprio site: GSAP com ScrollTrigger, SplitText e
   DrawSVGPlugin, e Lenis para a rolagem suave. Sem rastreadores e sem
   armazenamento no navegador.

   Três modos, decididos pela tela e pela preferência de movimento:
   - cinema: tela larga com movimento; a abertura e o ciclo ficam fixos e são
     conduzidos pela rolagem;
   - movimento: telas estreitas; revelações leves, sem seções fixas;
   - repouso: movimento reduzido ou bibliotecas indisponíveis; nada se move e
     todo o conteúdo aparece de imediato.
   ========================================================================== */
(function () {
  'use strict';

  window.contagiePronto = true;

  var raiz = document.documentElement;
  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var SplitText = window.SplitText;
  var temMovimento = Boolean(gsap && ScrollTrigger && SplitText);
  var consultaReduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
  var consultaLarga = window.matchMedia('(min-width: 64rem)');
  var lenis = null;

  function um(seletor, contexto) {
    return (contexto || document).querySelector(seletor);
  }

  function todos(seletor, contexto) {
    return Array.prototype.slice.call((contexto || document).querySelectorAll(seletor));
  }

  function fontesProntas(limite) {
    var espera = new Promise(function (resolver) { window.setTimeout(resolver, limite); });
    if (!document.fonts || !document.fonts.ready) return espera;
    return Promise.race([document.fonts.ready, espera]);
  }

  var cabecalho = um('[data-cabecalho]');
  var abertura = um('[data-abertura]');
  var palco = um('[data-palco]');
  var declaracaoEstatica = um('[data-declaracao]');
  var barraProgresso = um('[data-progresso]');
  var estado = { aberturaEscura: false, menuAberto: false };

  /* ======================================================================
     1. Rolagem suave
     ====================================================================== */
  function ligarRolagemSuave() {
    if (lenis || !temMovimento || !window.Lenis || consultaReduzido.matches) return;
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(avancarRolagem);
    gsap.ticker.lagSmoothing(0);
  }

  function avancarRolagem(tempo) {
    if (lenis) lenis.raf(tempo * 1000);
  }

  function desligarRolagemSuave() {
    if (!lenis) return;
    gsap.ticker.remove(avancarRolagem);
    lenis.destroy();
    lenis = null;
  }

  function rolarAte(alvo, aoTerminar) {
    var topo = typeof alvo === 'number' ? alvo : alvo.getBoundingClientRect().top + window.scrollY;
    if (lenis) {
      // parte sempre da posição real da página, mesmo que ela tenha mudado sem passar pela rolagem suave
      lenis.scrollTo(window.scrollY, { immediate: true, force: true });
      lenis.scrollTo(topo, { duration: 1.4, onComplete: aoTerminar });
      return;
    }
    window.scrollTo({ top: topo, behavior: consultaReduzido.matches ? 'auto' : 'smooth' });
    if (aoTerminar) window.setTimeout(aoTerminar, consultaReduzido.matches ? 0 : 700);
  }

  /* ======================================================================
     2. Cabeçalho, barra de progresso e seção atual
     ====================================================================== */
  var regioesEscuras = todos('.secao--escura, .rodape');
  var linksNavegacao = todos('.navegacao ul a[href^="#"]');
  var secoesNavegacao = linksNavegacao.map(function (link) {
    return document.getElementById(link.getAttribute('href').slice(1));
  });
  var ultimaRolagem = window.scrollY;
  var quadroPedido = false;

  function sobrepoe(elemento, linha) {
    if (!elemento) return false;
    var caixa = elemento.getBoundingClientRect();
    return caixa.top <= linha && caixa.bottom >= linha;
  }

  function atualizarRolagem() {
    quadroPedido = false;
    var rolagem = window.scrollY;
    var alturaTela = window.innerHeight;
    var alturaUtil = document.documentElement.scrollHeight - alturaTela;
    var cinema = raiz.classList.contains('cinema');

    if (barraProgresso) {
      barraProgresso.style.transform = 'scaleX(' + (alturaUtil > 0 ? Math.min(1, rolagem / alturaUtil) : 0) + ')';
    }

    if (cabecalho) {
      var alturaCabecalho = cabecalho.offsetHeight;
      var linha = alturaCabecalho / 2;
      var escuro = regioesEscuras.some(function (regiao) { return sobrepoe(regiao, linha); });
      if (cinema) {
        if (estado.aberturaEscura && sobrepoe(palco, linha)) escuro = true;
      } else if (sobrepoe(declaracaoEstatica, linha)) {
        escuro = true;
      }
      var naAberturaCinema = cinema && abertura && abertura.getBoundingClientRect().bottom > alturaCabecalho;

      cabecalho.classList.toggle('cabecalho--escuro', escuro);
      cabecalho.classList.toggle('cabecalho--fundo', rolagem > 24 && !naAberturaCinema);

      // na abertura em cinema o cabeçalho sai de cena logo no início, para não disputar com a foto que se expande
      var limiteParaOcultar = naAberturaCinema ? 60 : alturaTela * 0.9;
      var diferenca = rolagem - ultimaRolagem;
      var manterVisivel = rolagem < limiteParaOcultar || estado.menuAberto || cabecalho.contains(document.activeElement);
      if (manterVisivel || diferenca < -6) cabecalho.classList.remove('cabecalho--oculto');
      else if (diferenca > 6) cabecalho.classList.add('cabecalho--oculto');
    }
    ultimaRolagem = rolagem;

    var linhaLeitura = window.innerHeight * 0.4;
    linksNavegacao.forEach(function (link, indice) {
      if (sobrepoe(secoesNavegacao[indice], linhaLeitura)) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  function pedirAtualizacao() {
    if (quadroPedido) return;
    quadroPedido = true;
    window.requestAnimationFrame(atualizarRolagem);
  }

  window.addEventListener('scroll', pedirAtualizacao, { passive: true });
  window.addEventListener('resize', pedirAtualizacao);
  if (cabecalho) cabecalho.addEventListener('focusin', function () { cabecalho.classList.remove('cabecalho--oculto'); });
  atualizarRolagem();

  /* ======================================================================
     3. Menu em telas estreitas
     ====================================================================== */
  var botaoMenu = um('[data-menu-botao]');
  var navegacao = um('[data-navegacao]');
  var areasForaDoMenu = todos('main, .rodape');

  function definirMenu(aberto, devolverFoco) {
    if (!botaoMenu || !navegacao) return;
    estado.menuAberto = aberto;
    botaoMenu.setAttribute('aria-expanded', String(aberto));
    botaoMenu.querySelector('.menu-botao__texto').textContent = aberto ? 'Fechar' : 'Menu';
    navegacao.classList.toggle('navegacao--aberta', aberto);
    document.body.classList.toggle('menu-aberto', aberto);
    areasForaDoMenu.forEach(function (area) { area.inert = aberto; });
    if (lenis) {
      if (aberto) lenis.stop();
      else lenis.start();
    }
    if (aberto) cabecalho.classList.remove('cabecalho--oculto');
    if (!aberto && devolverFoco) botaoMenu.focus();
  }

  if (botaoMenu && navegacao) {
    botaoMenu.addEventListener('click', function () {
      definirMenu(botaoMenu.getAttribute('aria-expanded') !== 'true', false);
    });
    navegacao.addEventListener('click', function (evento) {
      if (evento.target.closest('a') && estado.menuAberto) definirMenu(false, false);
    });
    document.addEventListener('keydown', function (evento) {
      if (evento.key === 'Escape' && estado.menuAberto) definirMenu(false, true);
    });
    consultaLarga.addEventListener('change', function () {
      if (estado.menuAberto) definirMenu(false, false);
    });
  }

  /* ======================================================================
     4. Links internos: rolagem suave, foco no destino e preenchimento do formulário
     ====================================================================== */
  var campoAssunto = document.getElementById('campo-assunto');
  var campoAmostra = document.getElementById('campo-amostra');

  document.addEventListener('click', function (evento) {
    var link = evento.target.closest('a[href^="#"]');
    if (!link || evento.defaultPrevented || evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey) return;

    var assunto = link.getAttribute('data-assunto');
    if (assunto && campoAssunto) campoAssunto.value = assunto;
    if (link.hasAttribute('data-amostra') && campoAmostra) campoAmostra.checked = true;

    if (!lenis) return;
    var identificador = link.getAttribute('href').slice(1);
    var alvo = identificador ? document.getElementById(identificador) : null;
    if (!alvo) return;

    evento.preventDefault();
    var paraOInicio = identificador === 'inicio';
    var focar = function () {
      var focavel = alvo;
      if (identificador === 'contato') focavel = document.getElementById('titulo-contato') || alvo;
      if (!focavel.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(focavel.tagName)) {
        focavel.setAttribute('tabindex', '-1');
      }
      focavel.focus({ preventScroll: true });
    };

    if (identificador === 'conteudo') {
      lenis.scrollTo(alvo, { immediate: true });
      focar();
      return;
    }

    rolarAte(paraOInicio ? 0 : alvo, focar);
    if (window.history && window.history.pushState) window.history.pushState(null, '', '#' + identificador);
  });

  /* Coleção: em telas estreitas os livros correm na horizontal; o trilho precisa aceitar o teclado */
  var trilhoLivros = um('[data-livros]');
  function ajustarTrilhoLivros() {
    if (!trilhoLivros) return;
    if (trilhoLivros.scrollWidth > trilhoLivros.clientWidth + 1) {
      trilhoLivros.tabIndex = 0;
      trilhoLivros.setAttribute('aria-label', 'Livros da coleção. Role para o lado para ver os cinco grupos.');
    } else {
      trilhoLivros.removeAttribute('tabindex');
      trilhoLivros.removeAttribute('aria-label');
    }
  }
  ajustarTrilhoLivros();
  window.addEventListener('resize', ajustarTrilhoLivros);

  /* ======================================================================
     5. Ciclo do método: marcas da roda (desenhadas uma única vez)
     ====================================================================== */
  var etapas = todos('[data-etapa]');
  var grupoMarcas = um('[data-metodo-marcas]');
  var numeroCentral = um('[data-metodo-numero]');
  var arcoAvanco = um('[data-metodo-avanco]');
  var marcas = [];
  var rotulosMarcas = [];
  var CIRCUNFERENCIA = 2 * Math.PI * 270;

  if (grupoMarcas && etapas.length) {
    var espacoSvg = 'http://www.w3.org/2000/svg';
    etapas.forEach(function (etapa, indice) {
      var angulo = (-90 + indice * (360 / etapas.length)) * Math.PI / 180;
      var cosseno = Math.cos(angulo);
      var seno = Math.sin(angulo);

      var marca = document.createElementNS(espacoSvg, 'circle');
      marca.setAttribute('class', 'metodo__marca');
      marca.setAttribute('cx', (300 + 270 * cosseno).toFixed(2));
      marca.setAttribute('cy', (300 + 270 * seno).toFixed(2));
      marca.setAttribute('r', '8');
      grupoMarcas.appendChild(marca);
      marcas.push(marca);

      var rotulo = document.createElementNS(espacoSvg, 'text');
      rotulo.setAttribute('class', 'metodo__marca-rotulo');
      rotulo.setAttribute('x', (300 + 304 * cosseno).toFixed(2));
      rotulo.setAttribute('y', (300 + 304 * seno).toFixed(2));
      rotulo.setAttribute('dominant-baseline', 'middle');
      rotulo.setAttribute('text-anchor', cosseno > 0.25 ? 'start' : cosseno < -0.25 ? 'end' : 'middle');
      rotulo.textContent = etapa.querySelector('.etapa__numero').textContent;
      grupoMarcas.appendChild(rotulo);
      rotulosMarcas.push(rotulo);
    });
  }

  var etapaAtiva = -1;

  function ativarEtapa(indice) {
    if (indice === etapaAtiva || !etapas[indice]) return;
    var anterior = etapaAtiva;
    etapaAtiva = indice;
    etapas.forEach(function (etapa, n) { etapa.classList.toggle('etapa--ativa', n === indice); });
    marcas.forEach(function (marca, n) { marca.classList.toggle('metodo__marca--feita', n <= indice); });
    rotulosMarcas.forEach(function (rotulo, n) { rotulo.classList.toggle('metodo__marca-rotulo--ativo', n === indice); });
    if (!numeroCentral) return;
    numeroCentral.textContent = etapas[indice].querySelector('.etapa__numero').textContent;
    if (anterior !== -1 && temMovimento) {
      gsap.fromTo(numeroCentral,
        { yPercent: indice > anterior ? 18 : -18, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: 'expo.out', overwrite: true });
    }
  }

  function limparEtapas() {
    etapaAtiva = -1;
    etapas.forEach(function (etapa) { etapa.classList.remove('etapa--ativa'); });
  }

  /* ======================================================================
     6. Convergência: as seis frentes ligadas a cada criança
     ====================================================================== */
  var convergencia = um('[data-convergencia]');
  var linhasConvergencia = um('[data-convergencia-linhas]');
  var palavrasFrentes = todos('[data-frente-palavra]');
  var alvoConvergencia = um('[data-convergencia-alvo]');
  var caminhos = [];

  if (convergencia && linhasConvergencia && alvoConvergencia) {
    palavrasFrentes.forEach(function () {
      var caminho = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      caminho.setAttribute('pathLength', '1');
      linhasConvergencia.appendChild(caminho);
      caminhos.push(caminho);
    });
  }

  function tracarConvergencia() {
    if (!caminhos.length) return;
    var largura = convergencia.offsetWidth;
    var altura = convergencia.offsetHeight;
    var ponto = um('.convergencia__ponto', alvoConvergencia);
    var folga = parseFloat(window.getComputedStyle(document.documentElement).fontSize) * 0.6 + 6;
    var pontoEsquerda = alvoConvergencia.offsetLeft + ponto.offsetLeft;
    var pontoTopo = alvoConvergencia.offsetTop + ponto.offsetTop;
    var diametro = ponto.offsetWidth;
    var chegadaX = pontoEsquerda - folga;
    var chegadaY = pontoTopo + diametro / 2;

    linhasConvergencia.setAttribute('viewBox', '0 0 ' + largura + ' ' + altura);
    palavrasFrentes.forEach(function (palavra, indice) {
      var saidaX = palavra.offsetLeft + palavra.offsetWidth + 14;
      var saidaY = palavra.offsetTop + palavra.offsetHeight * 0.55;
      var curva = Math.max(24, (chegadaX - saidaX) * 0.55);
      caminhos[indice].setAttribute('d',
        'M' + saidaX.toFixed(1) + ' ' + saidaY.toFixed(1) +
        ' C' + (saidaX + curva).toFixed(1) + ' ' + saidaY.toFixed(1) +
        ' ' + (chegadaX - curva).toFixed(1) + ' ' + chegadaY.toFixed(1) +
        ' ' + chegadaX.toFixed(1) + ' ' + chegadaY.toFixed(1));
    });
  }

  if (caminhos.length) {
    tracarConvergencia();
    fontesProntas(3000).then(tracarConvergencia);
    if ('ResizeObserver' in window) new ResizeObserver(tracarConvergencia).observe(convergencia);
    else window.addEventListener('resize', tracarConvergencia);
  }

  /* ======================================================================
     7. Revelação de títulos linha a linha, no momento em que entram na tela
     ====================================================================== */
  function revelarLinhas(elemento) {
    var ehTitulo = /^H[1-6]$/.test(elemento.tagName);
    var divisao = SplitText.create(elemento, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'linha',
      tag: 'span',
      aria: ehTitulo ? 'auto' : 'none'
    });
    gsap.set(elemento, { autoAlpha: 1 });
    gsap.from(divisao.lines, {
      yPercent: 108,
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.09,
      onComplete: function () { divisao.revert(); }
    });
  }

  function prepararRevelacao(elemento, inicio) {
    if (!elemento) return;
    gsap.set(elemento, { autoAlpha: 0 });
    ScrollTrigger.create({
      trigger: elemento,
      start: inicio || 'top 88%',
      once: true,
      onEnter: function () { revelarLinhas(elemento); }
    });
  }

  /* ======================================================================
     8. Cenas conduzidas pela rolagem
     ====================================================================== */
  function montarCenas(contexto) {
    var condicoes = contexto.conditions;
    raiz.classList.toggle('cinema', Boolean(condicoes.cinema));
    if (!condicoes.movimento) return function () {};

    var divisoes = [];

    /* 8.1 Abertura: a copa do logotipo se abre até ocupar a tela */
    if (condicoes.cinema && abertura && palco) {
      var copa = um('[data-copa]');
      var veu = um('[data-veu]');
      var anel = um('[data-anel]');
      var conteudo = um('[data-abertura-conteudo]');
      var declaracao = um('[data-declaracao]');
      var tituloDeclaracao = um('[data-dividir-linhas]', declaracao);
      var textoDeclaracao = um('p', declaracao);
      var rolar = um('[data-rolar]');
      var palavrasDeclaracao = SplitText.create(tituloDeclaracao, {
        type: 'words',
        mask: 'words',
        wordsClass: 'palavra',
        tag: 'span',
        aria: 'auto'
      });
      divisoes.push(palavrasDeclaracao);

      var raioInicial = function () { return Math.min(palco.offsetWidth * 0.19, palco.offsetHeight * 0.36); };
      var raioFinal = function () {
        var largura = palco.offsetWidth;
        var altura = palco.offsetHeight;
        return Math.hypot(Math.max(largura * 0.76, largura * 0.24), Math.max(altura * 0.53, altura * 0.47)) + 8;
      };

      gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: abertura,
          start: 'top top',
          end: '+=190%',
          pin: palco,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: function (gatilho) {
            var escura = gatilho.progress > 0.46;
            if (escura !== estado.aberturaEscura) {
              estado.aberturaEscura = escura;
              pedirAtualizacao();
            }
          }
        }
      })
        .fromTo(abertura, { '--raio-copa': function () { return raioInicial() + 'px'; } },
          { '--raio-copa': function () { return raioFinal() + 'px'; }, duration: 1, ease: 'power2.inOut' }, 0)
        .to(conteudo, { yPercent: -8, autoAlpha: 0, duration: 0.42, ease: 'power1.in' }, 0)
        .to(rolar, { autoAlpha: 0, duration: 0.12 }, 0)
        .to(anel, { autoAlpha: 0, duration: 0.3 }, 0.05)
        .fromTo(copa.querySelector('img'), { scale: 1.08 }, { scale: 1, duration: 1.3 }, 0)
        .to(veu, { opacity: 1, duration: 0.45 }, 0.5)
        .fromTo(declaracao, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, 0.72)
        .from(palavrasDeclaracao.words, { yPercent: 110, duration: 0.36, ease: 'power3.out', stagger: 0.018 }, 0.72)
        .from(textoDeclaracao, { autoAlpha: 0, y: 28, duration: 0.3, ease: 'power2.out' }, 0.98)
        .to({}, { duration: 0.35 });
    } else if (declaracaoEstatica) {
      prepararRevelacao(um('[data-dividir-linhas]', declaracaoEstatica), 'top 85%');
    }

    /* 8.2 Convergência */
    if (caminhos.length) {
      var escala = function () { return Math.min(1, window.innerWidth / 1280); };
      var desvios = [[-60, -46, -5], [48, -18, 4], [-84, 14, -3], [30, 36, 5], [-40, 58, -4], [70, 30, 3]];
      gsap.set(caminhos, { strokeDasharray: '1 1' });
      gsap.timeline({
        scrollTrigger: { trigger: convergencia, start: 'top 82%', end: 'bottom 52%', scrub: 1, invalidateOnRefresh: true }
      })
        .from(palavrasFrentes, {
          x: function (i) { return desvios[i % desvios.length][0] * escala(); },
          y: function (i) { return desvios[i % desvios.length][1] * escala(); },
          rotation: function (i) { return desvios[i % desvios.length][2]; },
          autoAlpha: 0.12,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.035
        }, 0)
        .fromTo(caminhos, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.42, ease: 'power1.inOut', stagger: 0.035 }, 0.32)
        .from(um('.convergencia__ponto', alvoConvergencia), { scale: 0, duration: 0.3, ease: 'back.out(2.2)' }, 0.62)
        .from(um('span:last-child', alvoConvergencia), { autoAlpha: 0, y: 14, duration: 0.25, ease: 'power2.out' }, 0.72);
    }

    /* 8.3 O ciclo: roda fixa, uma etapa por vez */
    var palcoMetodo = um('[data-metodo-palco]');
    if (condicoes.cinema && palcoMetodo && etapas.length && arcoAvanco) {
      gsap.set(arcoAvanco, { strokeDasharray: CIRCUNFERENCIA, strokeDashoffset: CIRCUNFERENCIA });
      ativarEtapa(0);
      gsap.to(arcoAvanco, {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: palcoMetodo,
          start: 'top top',
          end: function () { return '+=' + Math.round(window.innerHeight * 0.55 * etapas.length); },
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: function (gatilho) {
            ativarEtapa(Math.min(etapas.length - 1, Math.round(gatilho.progress * etapas.length)));
          }
        }
      });
    }

    /* 8.4 Títulos das seções */
    todos('[data-revelar-linhas]').forEach(function (elemento) { prepararRevelacao(elemento); });

    /* 8.5 Conexões: cada frase desliza para o seu lugar */
    todos('[data-conexoes] li').forEach(function (item, indice) {
      gsap.from(item, {
        xPercent: indice % 2 ? 7 : -7,
        autoAlpha: 0,
        ease: 'power2.out',
        scrollTrigger: { trigger: item, start: 'top 94%', end: 'top 64%', scrub: 0.8 }
      });
    });

    /* 8.6 Frentes: a foto se abre e desliza devagar dentro da moldura */
    todos('[data-paralaxe]').forEach(function (foto) {
      var imagem = um('img', foto);
      gsap.fromTo(imagem, { yPercent: -6 }, {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: { trigger: foto, start: 'top bottom', end: 'bottom top', scrub: true }
      });
      gsap.fromTo(foto,
        { clipPath: 'inset(16% 9% 0% 9% round 0.375rem)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 0.375rem)',
          ease: 'power2.out',
          scrollTrigger: { trigger: foto, start: 'top 96%', end: 'top 40%', scrub: 0.8 }
        });
    });

    /* 8.7 Coleção: os livros chegam em sequência */
    var livros = todos('[data-livros] .livro');
    if (livros.length) {
      gsap.from(livros, {
        y: 80,
        autoAlpha: 0,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: { trigger: um('[data-livros]'), start: 'top 86%', once: true }
      });
    }

    /* 8.8 Inteligência da Aprendizagem: a linha percorre o fluxo */
    var fluxo = um('[data-fluxo]');
    if (fluxo) {
      gsap.timeline({ scrollTrigger: { trigger: fluxo, start: 'top 82%', end: 'bottom 58%', scrub: 0.8 } })
        .fromTo(fluxo, { '--avanco-fluxo': 0 }, { '--avanco-fluxo': 1, duration: 1, ease: 'none' }, 0)
        .from(fluxo.children, { autoAlpha: 0.15, y: 18, duration: 0.3, ease: 'power2.out', stagger: 0.17 }, 0);
    }

    /* 8.9 Manifesto: as palavras acendem conforme a leitura */
    var refrao = um('[data-acender]');
    if (refrao) {
      var palavrasRefrao = SplitText.create(refrao, { type: 'words', wordsClass: 'palavra-acesa', tag: 'span', aria: 'none' });
      divisoes.push(palavrasRefrao);
      gsap.fromTo(palavrasRefrao.words, { opacity: 0.16 }, {
        opacity: 1,
        ease: 'none',
        stagger: 0.1,
        scrollTrigger: { trigger: refrao, start: 'top 80%', end: 'bottom 48%', scrub: true }
      });
    }

    /* 8.10 Visão: as ondas se expandem com a rolagem */
    var visao = um('[data-visao]');
    var ondas = visao ? um('.visao__ondas', visao) : null;
    if (ondas) {
      gsap.set(ondas, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
      gsap.fromTo(ondas, { scale: 0.5, autoAlpha: 0 }, {
        scale: 1.12,
        autoAlpha: 1,
        ease: 'none',
        scrollTrigger: { trigger: visao, start: 'top bottom', end: 'bottom 35%', scrub: true }
      });
    }

    return function () {
      divisoes.forEach(function (divisao) { divisao.revert(); });
      limparEtapas();
      estado.aberturaEscura = false;
      raiz.classList.remove('cinema');
    };
  }

  /* ======================================================================
     9. Entrada da abertura
     ====================================================================== */
  function entrarAbertura() {
    var titulo = um('[data-dividir]');
    var copa = um('[data-copa]');
    var circuloAnel = um('[data-anel] circle');
    if (!titulo) {
      raiz.classList.add('pronto');
      return;
    }

    var divisao = SplitText.create(titulo, { type: 'lines', mask: 'lines', linesClass: 'linha', tag: 'span', aria: 'auto' });
    var linha = gsap.timeline({ delay: 0.1, defaults: { ease: 'expo.out' } });
    linha
      .from(divisao.lines, {
        yPercent: 112,
        duration: 1.35,
        stagger: 0.1,
        onComplete: function () { divisao.revert(); }
      }, 0)
      .fromTo(copa, { '--entrada': 0 }, { '--entrada': 1, duration: 1.8, ease: 'expo.inOut' }, 0)
      .from(um('.abertura .rotulo'), { autoAlpha: 0, y: 14, duration: 1 }, 0.15)
      .from(todos('.abertura__base > *'), { autoAlpha: 0, y: 26, duration: 1.1, stagger: 0.09 }, 0.45);
    if (circuloAnel && window.DrawSVGPlugin) {
      linha.fromTo(circuloAnel, { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 2, ease: 'power3.inOut' }, 0.5);
    }
    raiz.classList.add('pronto');
  }

  /* ======================================================================
     10. Início
     ====================================================================== */
  if (!temMovimento) {
    raiz.classList.remove('cinema');
    raiz.classList.add('pronto');
  } else {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    if (window.DrawSVGPlugin) gsap.registerPlugin(window.DrawSVGPlugin);
    ScrollTrigger.config({ ignoreMobileResize: true });

    ligarRolagemSuave();
    consultaReduzido.addEventListener('change', function () {
      if (consultaReduzido.matches) desligarRolagemSuave();
      else ligarRolagemSuave();
    });

    fontesProntas(1200).then(function () {
      var mm = gsap.matchMedia();
      mm.add({
        cinema: '(min-width: 64rem) and (prefers-reduced-motion: no-preference)',
        movimento: '(prefers-reduced-motion: no-preference)'
      }, montarCenas);

      if (consultaReduzido.matches) raiz.classList.add('pronto');
      else entrarAbertura();

      ScrollTrigger.refresh();
      pedirAtualizacao();

      // quem chega por um endereço com âncora vai direto à seção, já com as cenas montadas
      if (window.location.hash.length > 1) {
        var destino = document.getElementById(window.location.hash.slice(1));
        if (destino) {
          if (lenis) lenis.scrollTo(destino, { immediate: true, force: true });
          else destino.scrollIntoView();
        }
      }
    });

    // a altura das respostas abertas muda a página: recalcula as posições das cenas
    todos('.sanfona details').forEach(function (detalhe) {
      detalhe.addEventListener('toggle', function () {
        window.setTimeout(function () { ScrollTrigger.refresh(); }, 650);
      });
    });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  /* ======================================================================
     11. Formulário de contato
     ====================================================================== */
  var formulario = um('[data-formulario]');
  if (formulario) {
    formulario.noValidate = true;
    var status = um('[data-formulario-status]', formulario);

    var regras = {
      nome: function (valor) { return valor.trim().length >= 3 ? '' : 'Informe o seu nome completo.'; },
      cargo: function (valor) { return valor.trim().length >= 2 ? '' : 'Informe o seu cargo na rede.'; },
      municipio: function (valor) { return valor.trim().length >= 3 ? '' : 'Informe o município e o estado.'; },
      whatsapp: function (valor) {
        var digitos = valor.replace(/\D/g, '');
        return digitos.length >= 10 && digitos.length <= 13 ? '' : 'Informe um número de WhatsApp com código de área.';
      },
      email: function (valor, campo) {
        if (!valor.trim()) return '';
        return campo.validity.valid ? '' : 'Confira o endereço de e-mail.';
      }
    };

    var validarCampo = function (campo) {
      var regra = regras[campo.name];
      if (!regra) return true;
      var mensagem = regra(campo.value, campo);
      var erro = document.getElementById('erro-' + campo.name);
      campo.setAttribute('aria-invalid', mensagem ? 'true' : 'false');
      if (erro) {
        erro.textContent = mensagem;
        erro.hidden = !mensagem;
      }
      return !mensagem;
    };

    Object.keys(regras).forEach(function (nome) {
      var campo = formulario.elements[nome];
      if (!campo) return;
      campo.addEventListener('blur', function () {
        if (campo.value.trim() || campo.getAttribute('aria-invalid') === 'true') validarCampo(campo);
      });
      campo.addEventListener('input', function () {
        if (campo.getAttribute('aria-invalid') === 'true') validarCampo(campo);
      });
    });

    // formata o telefone ao sair do campo: (43) 99999-9999
    var campoTelefone = formulario.elements.whatsapp;
    if (campoTelefone) {
      campoTelefone.addEventListener('blur', function () {
        var d = campoTelefone.value.replace(/\D/g, '');
        if (d.length === 11) campoTelefone.value = '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
        else if (d.length === 10) campoTelefone.value = '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
      });
    }

    var mostrarStatus = function (tipo, mensagem) {
      status.className = 'formulario__status formulario__status--' + tipo;
      status.textContent = mensagem;
    };

    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      var primeiroInvalido = null;
      Object.keys(regras).forEach(function (nome) {
        var campo = formulario.elements[nome];
        if (campo && !validarCampo(campo) && !primeiroInvalido) primeiroInvalido = campo;
      });
      if (primeiroInvalido) {
        mostrarStatus('erro', 'Revise os campos indicados para enviar o contato.');
        primeiroInvalido.focus();
        return;
      }

      if (formulario.hasAttribute('data-previa')) {
        mostrarStatus('sucesso', 'Formulário válido. Esta é uma prévia: no site publicado no Netlify, o contato chega à equipe da Contagie.');
        return;
      }

      formulario.setAttribute('aria-busy', 'true');
      mostrarStatus('sucesso', 'Enviando…');
      var dados = new URLSearchParams(new FormData(formulario)).toString();

      fetch(window.location.pathname, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: dados
      }).then(function (resposta) {
        if (!resposta.ok) throw new Error('resposta ' + resposta.status);
        formulario.reset();
        mostrarStatus('sucesso', 'Recebemos o seu contato. Nossa equipe vai falar com você pelo WhatsApp em breve.');
      }).catch(function () {
        mostrarStatus('erro', 'Não foi possível enviar agora. Tente novamente em alguns minutos ou fale com a nossa equipe pelos contatos no fim da página.');
      }).then(function () {
        formulario.removeAttribute('aria-busy');
      });
    });
  }

  /* ---------- Ano atual no rodapé ---------- */
  todos('[data-ano]').forEach(function (elemento) {
    elemento.textContent = String(new Date().getFullYear());
  });

})();
