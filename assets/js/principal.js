/* ==========================================================================
   CONTAGIE · comportamento da página
   Sem dependências, sem rastreadores e sem armazenamento no navegador.
   Tudo aqui é aprimoramento: sem JavaScript, a página continua completa.
   ========================================================================== */
(function () {
  'use strict';

  window.contagiePronto = true;

  var movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
  var telaLarga = window.matchMedia('(min-width: 64rem)');

  function todos(seletor, contexto) {
    return Array.prototype.slice.call((contexto || document).querySelectorAll(seletor));
  }

  /* ---------- Cabeçalho: borda discreta depois que a página rola ---------- */
  var cabecalho = document.querySelector('[data-cabecalho]');
  if (cabecalho) {
    var atualizarCabecalho = function () {
      cabecalho.classList.toggle('cabecalho--rolado', window.scrollY > 8);
    };
    atualizarCabecalho();
    window.addEventListener('scroll', atualizarCabecalho, { passive: true });
  }

  /* ---------- Menu em telas estreitas ---------- */
  var botaoMenu = document.querySelector('[data-menu-botao]');
  var navegacao = document.querySelector('[data-navegacao]');

  function definirMenu(aberto, devolverFoco) {
    if (!botaoMenu || !navegacao) return;
    botaoMenu.setAttribute('aria-expanded', String(aberto));
    botaoMenu.querySelector('.menu-botao__texto').textContent = aberto ? 'Fechar' : 'Menu';
    navegacao.classList.toggle('navegacao--aberta', aberto);
    document.body.classList.toggle('menu-aberto', aberto);
    if (!aberto && devolverFoco) botaoMenu.focus();
  }

  if (botaoMenu && navegacao) {
    botaoMenu.addEventListener('click', function () {
      definirMenu(botaoMenu.getAttribute('aria-expanded') !== 'true', false);
    });
    navegacao.addEventListener('click', function (evento) {
      if (evento.target.closest('a')) definirMenu(false, false);
    });
    document.addEventListener('keydown', function (evento) {
      if (evento.key === 'Escape' && botaoMenu.getAttribute('aria-expanded') === 'true') definirMenu(false, true);
    });
    telaLarga.addEventListener('change', function () {
      definirMenu(false, false);
    });
  }

  /* ---------- Navegação: indica a seção que está sendo lida ---------- */
  var linksNavegacao = todos('.navegacao ul a[href^="#"]');
  if ('IntersectionObserver' in window && linksNavegacao.length) {
    var porSecao = {};
    linksNavegacao.forEach(function (link) {
      porSecao[link.getAttribute('href').slice(1)] = link;
    });
    // observa todas as seções: as que não estão no menu (abertura, visão) limpam a marcação
    var observadorSecoes = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        linksNavegacao.forEach(function (link) { link.removeAttribute('aria-current'); });
        var ativo = porSecao[entrada.target.id];
        if (ativo) ativo.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    todos('main > section[id]').forEach(function (secao) { observadorSecoes.observe(secao); });
  }

  /* ---------- Traços desenhados à mão: mede cada linha antes de animar ---------- */
  function medirTracos(contexto) {
    todos('.desenhar', contexto).forEach(function (traco) {
      if (typeof traco.getTotalLength !== 'function') return;
      var comprimento = traco.getTotalLength();
      // com traço de espessura fixa em desenho esticado, o comprimento visível depende da escala na tela
      if (traco.getAttribute('vector-effect') === 'non-scaling-stroke') {
        var desenho = traco.ownerSVGElement;
        var caixa = desenho.getBoundingClientRect();
        var visao = desenho.viewBox.baseVal;
        var escala = Math.max(caixa.width / visao.width, caixa.height / visao.height) || 1;
        comprimento = comprimento * escala;
      }
      traco.style.setProperty('--comprimento', String(Math.ceil(comprimento * 1.06 + 2)));
    });
  }

  function marcarDesenhado(elemento) {
    elemento.classList.add('desenhado');
  }

  /* ---------- Um único momento animado: a árvore da abertura se desenha; os anéis pulsam ao serem vistos ---------- */
  var comDesenho = todos('[data-desenho]');
  comDesenho.forEach(function (elemento) { medirTracos(elemento); });

  if (!('IntersectionObserver' in window) || movimentoReduzido.matches) {
    comDesenho.forEach(marcarDesenhado);
  } else {
    var observadorDesenho = new IntersectionObserver(function (entradas, observador) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        marcarDesenhado(entrada.target);
        observador.unobserve(entrada.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.2 });

    // espera o estado inicial (traço escondido) ser pintado antes de iniciar a transição
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        comDesenho.forEach(function (elemento) { observadorDesenho.observe(elemento); });
      });
    });
  }

  // quando as fontes chegam, a palavra circulada muda de tamanho: remede o traço
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      todos('.rabiscado').forEach(function (palavra) { medirTracos(palavra); });
    });
  }

  /* ---------- Ciclo "Como funciona": roda interativa em telas largas ---------- */
  var ciclo = document.querySelector('[data-ciclo]');
  if (ciclo) {
    var lista = ciclo.querySelector('[data-ciclo-lista]');
    var roda = ciclo.querySelector('[data-ciclo-roda]');
    var painel = ciclo.querySelector('[data-ciclo-painel]');
    var botoesEtapa = todos('[data-ciclo-botao]', ciclo);
    var etapas = todos('.ciclo__etapa', lista).map(function (item) {
      return {
        titulo: item.querySelector('.ciclo__nome').textContent,
        texto: item.querySelector('.ciclo__descricao').textContent
      };
    });
    var progresso = ciclo.querySelector('[data-ciclo-progresso]');
    var circunferencia = 2 * Math.PI * 236;
    var atual = 0;

    if (progresso) {
      progresso.style.strokeDasharray = String(circunferencia);
      progresso.style.strokeDashoffset = String(circunferencia);
    }

    var selecionar = function (indice, focar) {
      atual = (indice + etapas.length) % etapas.length;
      botoesEtapa.forEach(function (botao, i) {
        botao.setAttribute('aria-pressed', String(i === atual));
        if (i === atual) botao.classList.add('ciclo__botao--visto');
      });
      painel.querySelector('[data-ciclo-numero]').textContent = String(atual + 1);
      painel.querySelector('[data-ciclo-titulo]').textContent = etapas[atual].titulo;
      painel.querySelector('[data-ciclo-texto]').textContent = etapas[atual].texto;
      painel.querySelector('[data-ciclo-proxima]').textContent = atual === etapas.length - 1 ? 'Recomeçar o ciclo' : 'Próxima etapa';
      if (progresso) progresso.style.strokeDashoffset = String(circunferencia * (1 - atual / etapas.length));
      if (focar) botoesEtapa[atual].focus();
    };

    botoesEtapa.forEach(function (botao, i) {
      botao.addEventListener('click', function () { selecionar(i, false); });
      botao.addEventListener('keydown', function (evento) {
        var mapa = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        if (evento.key in mapa) {
          evento.preventDefault();
          selecionar(atual + mapa[evento.key], true);
        } else if (evento.key === 'Home') {
          evento.preventDefault();
          selecionar(0, true);
        } else if (evento.key === 'End') {
          evento.preventDefault();
          selecionar(etapas.length - 1, true);
        }
      });
    });
    painel.querySelector('[data-ciclo-proxima]').addEventListener('click', function () { selecionar(atual + 1, false); });
    painel.querySelector('[data-ciclo-anterior]').addEventListener('click', function () { selecionar(atual - 1, false); });

    var aplicarModo = function () {
      var interativo = telaLarga.matches;
      lista.hidden = interativo;
      roda.hidden = !interativo;
      painel.hidden = !interativo;
      if (interativo) selecionar(atual, false);
    };
    aplicarModo();
    telaLarga.addEventListener('change', aplicarModo);
  }

  /* ---------- Atalhos "Conversar sobre..." já escolhem o assunto no formulário ---------- */
  var campoAssunto = document.getElementById('campo-frente');
  todos('[data-frente]').forEach(function (link) {
    link.addEventListener('click', function () {
      if (!campoAssunto) return;
      var valor = link.getAttribute('data-frente');
      todos('option', campoAssunto).forEach(function (opcao) {
        if (opcao.textContent === valor) campoAssunto.value = valor;
      });
    });
  });

  /* ---------- Formulário de contato ---------- */
  var formulario = document.querySelector('[data-formulario]');
  if (formulario) {
    formulario.noValidate = true;
    var status = formulario.querySelector('[data-formulario-status]');

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
