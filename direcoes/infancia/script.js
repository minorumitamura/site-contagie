/* Contagie · menu do celular, preenchimento do assunto e validação do formulário. Sem bibliotecas. */
(function () {
  'use strict';

  /* Menu do celular */
  var botao = document.querySelector('.topo__menu');
  var nav = document.getElementById('navegacao');
  if (botao && nav) {
    botao.hidden = false;
    var definir = function (aberto, devolverFoco) {
      botao.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      nav.classList.toggle('aberta', aberto);
      if (!aberto && devolverFoco) botao.focus();
    };
    botao.addEventListener('click', function () {
      definir(botao.getAttribute('aria-expanded') !== 'true', false);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) definir(false, false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && botao.getAttribute('aria-expanded') === 'true') definir(false, true);
    });
    window.matchMedia('(min-width: 1080px)').addEventListener('change', function () { definir(false, false); });
  }

  /* Links que preenchem o assunto do formulário */
  var campoAssunto = document.getElementById('campo-assunto');
  var campoAmostra = document.getElementById('campo-amostra');
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href="#contato"]');
    if (!link) return;
    var assunto = link.getAttribute('data-assunto');
    if (assunto && campoAssunto) campoAssunto.value = assunto;
    if (link.hasAttribute('data-amostra') && campoAmostra) campoAmostra.checked = true;
  });

  /* Formulário de contato */
  var form = document.querySelector('[data-formulario]');
  if (form) {
    form.noValidate = true;
    var status = form.querySelector('[data-formulario-status]');
    var regras = {
      nome: function (v) { return v.trim().length >= 3 ? '' : 'Informe o seu nome completo.'; },
      cargo: function (v) { return v.trim().length >= 2 ? '' : 'Informe o seu cargo na rede.'; },
      municipio: function (v) { return v.trim().length >= 3 ? '' : 'Informe o município e o estado.'; },
      whatsapp: function (v) {
        var d = v.replace(/\D/g, '');
        return d.length >= 10 && d.length <= 13 ? '' : 'Informe um número de WhatsApp com código de área.';
      },
      email: function (v, campo) {
        if (!v.trim()) return '';
        return campo.validity.valid ? '' : 'Confira o endereço de e-mail.';
      }
    };
    var validar = function (campo) {
      var msg = regras[campo.name](campo.value, campo);
      var erro = document.getElementById('erro-' + campo.name);
      campo.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (erro) { erro.textContent = msg; erro.hidden = !msg; }
      return !msg;
    };
    Object.keys(regras).forEach(function (nome) {
      var campo = form.elements[nome];
      if (!campo) return;
      campo.addEventListener('blur', function () {
        if (campo.value.trim() || campo.getAttribute('aria-invalid') === 'true') validar(campo);
      });
      campo.addEventListener('input', function () {
        if (campo.getAttribute('aria-invalid') === 'true') validar(campo);
      });
    });
    var tel = form.elements.whatsapp;
    tel.addEventListener('blur', function () {
      var d = tel.value.replace(/\D/g, '');
      if (d.length === 11) tel.value = '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
      else if (d.length === 10) tel.value = '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    });
    var mostrar = function (tipo, msg) {
      status.className = 'formulario__status formulario__status--' + tipo;
      status.textContent = msg;
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var primeiro = null;
      Object.keys(regras).forEach(function (nome) {
        var campo = form.elements[nome];
        if (campo && !validar(campo) && !primeiro) primeiro = campo;
      });
      if (primeiro) {
        mostrar('erro', 'Revise os campos indicados para enviar o contato.');
        primeiro.focus();
        return;
      }
      form.setAttribute('aria-busy', 'true');
      mostrar('sucesso', 'Enviando…');
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (r) {
        if (!r.ok || r.redirected) throw new Error('resposta ' + r.status);
        form.reset();
        mostrar('sucesso', 'Recebemos o seu contato. Nossa equipe vai falar com você pelo WhatsApp em breve.');
      }).catch(function () {
        mostrar('erro', 'Não foi possível enviar agora. Tente novamente em alguns minutos ou fale com a nossa equipe pelos contatos no fim da página.');
      }).then(function () {
        form.removeAttribute('aria-busy');
      });
    });
  }

  /* Ano atual no rodapé */
  var ano = document.querySelector('[data-ano]');
  if (ano) ano.textContent = String(new Date().getFullYear());
})();
