import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../",import.meta.url);
const html = fs.readFileSync(new URL("index.html",root),"utf8");
const logo = fs.readFileSync(new URL("assets/logo-cemetron.png",root));

test("a logo oficial do CEMETRON está disponível em alta resolução",() => {
  assert.equal(logo.subarray(1,4).toString(),"PNG");
  assert.equal(logo.readUInt32BE(16),540);
  assert.equal(logo.readUInt32BE(20),150);
});

test("os documentos finais usam o cabeçalho padronizado com logo",() => {
  assert.match(html,/const DOCUMENT_LOGO_SRC = new URL\("assets\/logo-cemetron\.png", document\.baseURI\)\.href/);
  assert.match(html,/function documentHeaderHtml\(title, accent="#4f8edc"\)/);
  assert.match(html,/class="document-logo"/);
  assert.match(html,/function printDocumentWindow\(printWindow, errorMessage\)/);
  assert.match(html,/querySelectorAll\("\.document-logo,\.sbar-report-logo,\.sbar-detail-logo"\)/);
  assert.match(html,/logo\.addEventListener\("load", logoReady, \{once:true\}\)/);
  assert.match(html,/documentHeaderHtml\("INFORME PARA AVALIAÇÃO", "#4f8edc"\)/);
  assert.match(html,/documentHeaderHtml\("INFORME PARA EXAME", "#4f8edc"\)/);
  assert.match(html,/documentHeaderHtml\("INFORME DE TRANSFERÊNCIA EXTERNA", "#7c3aed"\)/);
  assert.match(html,/documentHeaderHtml\("PARECER DO REGULADOR", "#4caf72"\)/);
  assert.match(html,/documentHeaderHtml\("PARECER DO REGULADOR", "#d9534f"\)/);
});
