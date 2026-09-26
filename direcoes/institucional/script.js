/* Contagie · menu do celular, atalhos para o formulário e validação. Sem bibliotecas. */
(function () {
  'use strict';

  /* Menu do celular */
  var botao = document.querySelector('[data-menu-botao]');
  var menu = document.querySelector('[data-navegacao]');
  if (botao && menu) {
    var definir = function (aberto) {
      botao.setAttribute('aria-expanded', String(aberto));
      menu.classList.toggle('esta-aberta', aberto);
    };
    botao.addEventListener('click', function () { definir(botao.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) definir(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && botao.getAttribute('aria-expanded') === 'true') { definir(false); botao.focus(); }
    });
    window.matchMedia('(min-width: 72rem)').addEventListener('change', function (m) { if (m.matches) definir(false); });
  }

  var formulario = document.querySelector('[data-formulario]');

  /* Links que já escolhem o assunto ou pedem o material demonstrativo */
  if (formulario) {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('[data-assunto], [data-amostra]');
      if (!link) return;
      var assunto = link.getAttribute('data-assunto');
      if (assunto) formulario.elements.assunto.value = assunto;
      if (link.hasAttribute('data-amostra')) formulario.elements.amostra.checked = true;
    });
  }

  /* Validação do formulário */
  if (formulario) {
    formulario.noValidate = true;
    var status = formulario.querySelector('[data-formulario-status]');
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
      var regra = regras[campo.name];
      if (!regra) return true;
      var mensagem = regra(campo.value, campo);
      var erro = document.getElementById('erro-' + campo.name);
      campo.setAttribute('aria-invalid', mensagem ? 'true' : 'false');
      if (erro) { erro.textContent = mensagem; erro.hidden = !mensagem; }
      return !mensagem;
    };
    Object.keys(regras).forEach(function (nome) {
      var campo = formulario.elements[nome];
      if (!campo) return;
      campo.addEventListener('blur', function () {
        if (campo.value.trim() || campo.getAttribute('aria-invalid') === 'true') validar(campo);
      });
      campo.addEventListener('input', function () {
        if (campo.getAttribute('aria-invalid') === 'true') validar(campo);
      });
    });
    var telefone = formulario.elements.whatsapp;
    telefone.addEventListener('blur', function () {
      var d = telefone.value.replace(/\D/g, '');
      if (d.length === 11) telefone.value = '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
      else if (d.length === 10) telefone.value = '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    });
    var mostrar = function (tipo, mensagem) {
      status.className = 'formulario__status formulario__status--' + tipo;
      status.textContent = mensagem;
    };
    formulario.addEventListener('submit', function (e) {
      e.preventDefault();
      var primeiro = null;
      Object.keys(regras).forEach(function (nome) {
        var campo = formulario.elements[nome];
        if (campo && !validar(campo) && !primeiro) primeiro = campo;
      });
      if (primeiro) {
        mostrar('erro', 'Revise os campos indicados para enviar o contato.');
        primeiro.focus();
        return;
      }
      formulario.setAttribute('aria-busy', 'true');
      mostrar('sucesso', 'Enviando…');
      fetch(window.location.pathname, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(formulario)).toString()
      }).then(function (r) {
        if (!r.ok) throw new Error(String(r.status));
        formulario.reset();
        mostrar('sucesso', 'Recebemos o seu contato. Nossa equipe vai falar com você pelo WhatsApp em breve.');
      }).catch(function () {
        mostrar('erro', 'Não foi possível enviar agora. Tente novamente em alguns minutos ou fale com a nossa equipe pelos contatos no fim da página.');
      }).then(function () { formulario.removeAttribute('aria-busy'); });
    });
  }

  /* Ano atual no rodapé */
  var ano = document.querySelector('[data-ano]');
  if (ano) ano.textContent = String(new Date().getFullYear());
})();
