/* Contagie · direção Essencial. Menu do celular, formulário e ano. Sem bibliotecas. */
(function () {
  'use strict';
  var d = document;

  /* Menu do celular */
  var botao = d.querySelector('.menu-botao');
  var nav = d.getElementById('navegacao');
  if (botao && nav) {
    botao.hidden = false;
    var definir = function (aberto) {
      botao.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      nav.classList.toggle('aberta', aberto);
    };
    botao.addEventListener('click', function () { definir(botao.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) definir(false); });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && botao.getAttribute('aria-expanded') === 'true') { definir(false); botao.focus(); }
    });
    d.addEventListener('click', function (e) {
      if (botao.getAttribute('aria-expanded') === 'true' && !nav.contains(e.target) && !botao.contains(e.target)) definir(false);
    });
  }

  /* Formulário */
  var form = d.querySelector('form[name="contato"]');
  if (form) {
    var assunto = form.elements.assunto;
    var amostra = form.elements.amostra;
    d.querySelectorAll('[data-assunto]').forEach(function (a) {
      a.addEventListener('click', function () { if (assunto) assunto.value = a.getAttribute('data-assunto'); });
    });
    d.querySelectorAll('[data-amostra]').forEach(function (a) {
      a.addEventListener('click', function () { if (amostra) amostra.checked = true; });
    });

    form.noValidate = true;
    var status = form.querySelector('.formulario__status');
    var regras = {
      nome: function (v) { return v.trim().length >= 3 ? '' : 'Informe o seu nome completo.'; },
      cargo: function (v) { return v.trim().length >= 2 ? '' : 'Informe o seu cargo na rede.'; },
      municipio: function (v) { return v.trim().length >= 3 ? '' : 'Informe o município e o estado.'; },
      whatsapp: function (v) {
        var n = v.replace(/\D/g, '').length;
        return n >= 10 && n <= 13 ? '' : 'Informe um número de WhatsApp com código de área.';
      },
      email: function (v, c) { return !v.trim() || c.validity.valid ? '' : 'Confira o endereço de e-mail.'; }
    };
    var validar = function (c) {
      var msg = regras[c.name](c.value, c);
      var erro = d.getElementById('erro-' + c.name);
      c.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (erro) { erro.textContent = msg; erro.hidden = !msg; }
      return !msg;
    };
    Object.keys(regras).forEach(function (nome) {
      var c = form.elements[nome];
      if (!c) return;
      c.addEventListener('blur', function () { if (c.value.trim() || c.getAttribute('aria-invalid') === 'true') validar(c); });
      c.addEventListener('input', function () { if (c.getAttribute('aria-invalid') === 'true') validar(c); });
    });
    var tel = form.elements.whatsapp;
    if (tel) {
      tel.addEventListener('blur', function () {
        var n = tel.value.replace(/\D/g, '');
        if (n.length === 11) tel.value = '(' + n.slice(0, 2) + ') ' + n.slice(2, 7) + '-' + n.slice(7);
        else if (n.length === 10) tel.value = '(' + n.slice(0, 2) + ') ' + n.slice(2, 6) + '-' + n.slice(6);
      });
    }
    var mostrar = function (tipo, msg) {
      status.className = 'formulario__status formulario__status--' + tipo;
      status.textContent = msg;
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var primeiro = null;
      Object.keys(regras).forEach(function (nome) {
        var c = form.elements[nome];
        if (c && !validar(c) && !primeiro) primeiro = c;
      });
      if (primeiro) { mostrar('erro', 'Revise os campos indicados para enviar o contato.'); primeiro.focus(); return; }
      form.setAttribute('aria-busy', 'true');
      mostrar('sucesso', 'Enviando…');
      fetch(window.location.pathname, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        form.reset();
        mostrar('sucesso', 'Recebemos o seu contato. Nossa equipe vai falar com você pelo WhatsApp em breve.');
      }).catch(function () {
        mostrar('erro', 'Não foi possível enviar agora. Tente novamente em alguns minutos ou fale com a nossa equipe pelos contatos no fim da página.');
      }).then(function () { form.removeAttribute('aria-busy'); });
    });
  }

  d.querySelectorAll('[data-ano]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
