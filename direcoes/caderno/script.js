/* Contagie · menu do celular, preenchimento do assunto e validação do formulário. Sem bibliotecas. */
(function () {
  'use strict';
  var d = document;

  /* Menu do celular */
  var botao = d.querySelector('[data-menu-botao]');
  var nav = d.querySelector('[data-navegacao]');
  if (botao && nav) {
    var definir = function (aberto, devolverFoco) {
      botao.setAttribute('aria-expanded', String(aberto));
      nav.classList.toggle('aberta', aberto);
      if (!aberto && devolverFoco) botao.focus();
    };
    botao.addEventListener('click', function () {
      definir(botao.getAttribute('aria-expanded') !== 'true', false);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) definir(false, false);
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && botao.getAttribute('aria-expanded') === 'true') definir(false, true);
    });
  }

  /* Links que já escolhem o assunto do formulário */
  var assunto = d.getElementById('campo-assunto');
  var amostra = d.getElementById('campo-amostra');
  d.addEventListener('click', function (e) {
    var link = e.target.closest('[data-assunto], [data-amostra]');
    if (!link) return;
    var valor = link.getAttribute('data-assunto');
    if (valor && assunto) assunto.value = valor;
    if (link.hasAttribute('data-amostra') && amostra) amostra.checked = true;
  });

  /* Formulário de contato */
  var form = d.querySelector('[data-formulario]');
  if (form) {
    form.noValidate = true;
    var status = form.querySelector('[data-formulario-status]');
    var regras = {
      nome: function (v) { return v.trim().length >= 3 ? '' : 'Informe o seu nome completo.'; },
      cargo: function (v) { return v.trim().length >= 2 ? '' : 'Informe o seu cargo na rede.'; },
      municipio: function (v) { return v.trim().length >= 3 ? '' : 'Informe o município e o estado.'; },
      whatsapp: function (v) {
        var n = v.replace(/\D/g, '').length;
        return n >= 10 && n <= 13 ? '' : 'Informe um número de WhatsApp com código de área.';
      },
      email: function (v, campo) {
        if (!v.trim()) return '';
        return campo.validity.valid ? '' : 'Confira o endereço de e-mail.';
      }
    };
    var validar = function (campo) {
      var regra = regras[campo.name];
      if (!regra) return true;
      var msg = regra(campo.value, campo);
      var erro = d.getElementById('erro-' + campo.name);
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
        if (!r.ok || r.redirected) throw new Error(String(r.status));
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
  var ano = d.querySelector('[data-ano]');
  if (ano) ano.textContent = String(new Date().getFullYear());
})();
