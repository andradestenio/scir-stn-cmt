import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../",import.meta.url);
const html = fs.readFileSync(new URL("index.html",root),"utf8");

test("seletores usam seta alinhada e botões centralizam o conteúdo",() => {
  assert.match(html,/select\{[\s\S]*?appearance:none;[\s\S]*?background-position:right 13px center;/);
  assert.match(html,/\.btn\{[\s\S]*?display:inline-flex;[\s\S]*?align-items:center;[\s\S]*?justify-content:center;/);
});

test("novo registro permite selecionar uma única origem da solicitação",() => {
  assert.match(html,/<legend class="request-source-title">Origem da solicitação:<\/legend>/);
  for(const source of ["crue","cerel","interna","direta"]){
    assert.match(html,new RegExp(`type="radio" name="requestSource" value="${source}"`));
  }
  assert.match(html,/requestSource: selectedRequestSource\(\)/);
  assert.match(html,/Selecione a origem da solicitação: CRUE, CEREL, Interna ou Direta\./);
});

test("origens da solicitação aparecem como tags coloridas e permanecem editáveis",() => {
  for(const source of ["crue","cerel","interna","direta"]){
    assert.match(html,new RegExp(`\\.request-source-tag\\.${source}`));
  }
  assert.match(html,/requestSourceTagHtml\(record\.requestSource\)/);
  assert.match(html,/setSelectedRequestSource\(record\.requestSource \|\| ""\)/);
  assert.match(html,/statisticsRequestSource/);
  assert.match(html,/statisticsRequestSources/);
});
