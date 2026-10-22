import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../",import.meta.url);
const html = fs.readFileSync(new URL("index.html",root),"utf8");

test("a versão 1.16.20 aplica o cabeçalho institucional ao SBAR",() => {
  assert.match(html,/const SCIR_VERSION = "1\.16\.20"/);
  assert.match(html,/class="sbar-report-logo"/);
  assert.match(html,/class="sbar-detail-logo"/);
  assert.match(html,/RELATÓRIO DETALHADO DO PLANTÃO/);
});

test("a primeira página termina no resumo do R e na frase de continuidade",() => {
  const rIndex = html.indexOf('<div class="sbar-section sbar-r-section">');
  const summaryIndex = html.indexOf('<div class="sbar-summary-box">',rIndex);
  const noteIndex = html.indexOf('<div class="sbar-next-page-note">Relatório detalhado do plantão nas próximas páginas.</div>',summaryIndex);
  const detailIndex = html.indexOf('<section class="sbar-full-report-page-break">',noteIndex);
  const emailIndex = html.indexOf('${sbarEmailBlockMarkup()}',detailIndex);

  assert.ok(rIndex >= 0,"a seção R deve existir");
  assert.ok(summaryIndex > rIndex,"o resumo deve estar dentro da sequência da seção R");
  assert.ok(noteIndex > summaryIndex,"a frase de continuidade deve vir após o resumo");
  assert.ok(detailIndex > noteIndex,"o relatório detalhado deve começar após a frase");
  assert.ok(emailIndex > detailIndex,"a produtividade de e-mails deve começar na página detalhada");
  assert.equal(html.slice(rIndex,noteIndex).includes('${sbarEmailBlockMarkup()}'),false);
});

test("o relatório detalhado usa páginas próprias e cartões arredondados",() => {
  assert.match(html,/\.sbar-full-report-page-break,\.sbar-full-report-continuation\{break-before:page;page-break-before:always/);
  assert.match(html,/class="sbar-full-report-continuation"/);
  assert.match(html,/\.sbar-full-group\{margin-top:4px;border:1px solid #dbe3ec;border-radius:7px/);
  assert.match(html,/\.sbar-next-page-note\{[\s\S]*?border-radius:8px/);
});
