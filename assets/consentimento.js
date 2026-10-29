/* Histórias Antigas: banner de consentimento + Google Analytics 4.
   O GA4 só é carregado DEPOIS de "Aceitar". Sem escolha, ou com "Recusar", nenhum script do Google é baixado e nenhum cookie
   de medição é gravado. A escolha fica no localStorage deste navegador ("consentimento-analytics": "sim" | "nao").
   O ID vem do atributo data-ga4 da tag <script> (gerado por paginas.py a partir de site.ga4_id do afiliados.json). */
(function () {
  "use strict";
  var tag = document.currentScript;
  var id = tag && tag.getAttribute("data-ga4");
  if (!id || !/^G-[A-Z0-9]{4,20}$/.test(id)) return;
  var privacidade = tag.getAttribute("data-privacidade") || "privacidade/";
  var CHAVE = "consentimento-analytics";
  var carregado = false;
  var banner = null;

  function ler() { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } }
  function gravar(v) { try { localStorage.setItem(CHAVE, v); } catch (e) { /* navegador sem storage: vale só nesta página */ } }

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  function carregar() {
    window["ga-disable-" + id] = false;
    if (carregado) return;
    carregado = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", id, { allow_google_signals: false, allow_ad_personalization_signals: false });
  }

  function apagarCookies() {
    var partes = location.hostname.split(".");
    var dominios = ["", location.hostname];
    for (var i = 1; i < partes.length - 1; i++) dominios.push("." + partes.slice(i).join("."));
    document.cookie.split(";").forEach(function (c) {
      var nome = c.split("=")[0].trim();
      if (nome !== "_ga" && nome.indexOf("_ga_") !== 0) return;
      dominios.forEach(function (d) {
        document.cookie = nome + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + (d ? "; domain=" + d : "");
      });
    });
  }

  function recusar() {
    window["ga-disable-" + id] = true;
    apagarCookies();
  }

  function decidir(aceitou) {
    gravar(aceitou ? "sim" : "nao");
    if (aceitou) carregar(); else recusar();
    fechar();
  }

  function fechar() {
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    banner = null;
  }

  function abrir() {
    if (banner) return;
    banner = document.createElement("div");
    banner.className = "consentimento";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Preferências de cookies");
    var texto = document.createElement("p");
    texto.appendChild(document.createTextNode("Usamos o Google Analytics, com cookies, para entender quais páginas e links são mais usados. Só medimos se você aceitar. "));
    var link = document.createElement("a");
    link.href = privacidade;
    link.textContent = "Política de Privacidade";
    texto.appendChild(link);
    texto.appendChild(document.createTextNode("."));
    var botoes = document.createElement("div");
    botoes.className = "consentimento-botoes";
    [["Recusar", false], ["Aceitar", true]].forEach(function (par) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = par[0];
      b.addEventListener("click", function () { decidir(par[1]); });
      botoes.appendChild(b);
    });
    banner.appendChild(texto);
    banner.appendChild(botoes);
    document.body.appendChild(banner);
    botoes.firstChild.focus();
  }

  document.addEventListener("click", function (ev) {
    var alvo = ev.target && ev.target.closest ? ev.target : null;
    if (!alvo) return;
    if (alvo.closest("[data-cookies]")) { abrir(); return; }
    if (!carregado || window["ga-disable-" + id]) return;
    var a = alvo.closest("a[href]");
    if (!a) return;
    if (a.hasAttribute("data-loja")) {
      var loja = a.getAttribute("data-loja");
      var livro = a.getAttribute("data-livro") || "";
      gtag("event", "clique_afiliado", { loja: loja, livro: livro, destino: a.hostname, transport_type: "beacon" });
      /* select_item é um evento de e-commerce padrão: o livro aparece em Monetização > Compras de e-commerce
         (Nome do item / Marca do item = loja) sem precisar registrar dimensão personalizada. */
      gtag("event", "select_item", {
        item_list_name: "livros",
        items: [{ item_id: livro, item_name: livro, item_brand: loja, item_category: "livro" }],
        transport_type: "beacon"
      });
    } else if (a.hostname && a.hostname !== location.hostname) {
      gtag("event", "clique_externo", { destino: a.hostname, transport_type: "beacon" });
    }
  });

  var escolha = ler();
  if (escolha === "sim") carregar();
  else if (escolha === "nao") window["ga-disable-" + id] = true;
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", abrir);
  else abrir();
})();
