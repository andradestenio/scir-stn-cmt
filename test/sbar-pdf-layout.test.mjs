import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../",import.meta.url);
const html = fs.readFileSync(new URL("index.html",root),"utf8");

test("a versão 1.16.23 mantém o cabeçalho institucional do SBAR",() => {
  assert.match(html,/const SCIR_VERSION = "1\.16\.23"/);
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

test("o relatório detalhado segue continuamente e mantém cartões arredondados",() => {
  const detailIndex = html.indexOf('<section class="sbar-full-report-page-break">');
  const yellowIndex = html.indexOf('${sbarFullGroupMarkup("yellow")}',detailIndex);
  const transferIndex = html.indexOf('${sbarFullGroupMarkup("transfer")}',yellowIndex);
  const blueIndex = html.indexOf('${sbarFullGroupMarkup("blue")}',transferIndex);
  const greenIndex = html.indexOf('${sbarFullGroupMarkup("green")}',blueIndex);
  const redIndex = html.indexOf('${sbarFullGroupMarkup("red")}',greenIndex);
  const closingIndex = html.indexOf('${sbarClosingBlockMarkup()}',redIndex);

  assert.ok(detailIndex >= 0);
  assert.ok(yellowIndex < transferIndex && transferIndex < blueIndex && blueIndex < greenIndex && greenIndex < redIndex);
  assert.ok(closingIndex > redIndex);
  assert.doesNotMatch(html,/class="sbar-full-report-continuation"/);
  assert.match(html,/\.sbar-full-report-page-break\{break-before:page;page-break-before:always/);
  assert.match(html,/\.sbar-full-group\{margin-top:4px;border:1px solid #dbe3ec;border-radius:7px/);
  assert.match(html,/\.sbar-next-page-note\{[\s\S]*?border-radius:8px/);
});

test("o encerramento e o rodapé seguem o texto e a disposição aprovados",() => {
  assert.match(html,/Encerramento do plantão/);
  assert.match(html,/Pendências e encaminhamentos revisados\. Favor, confirmar as vagas sinalizadas no censo atualizado e acompanhar os registros de pendências\./);
  assert.match(html,/function sbarRegulatorFooterHtml\(issueDate="", issueTime=""\)/);
  assert.match(html,/\$\{sbarRegulatorFooterHtml\(generatedDate, generatedTime\)\}/);
  assert.match(html,/\.regulator-footer-issued\{text-align:right/);
});
