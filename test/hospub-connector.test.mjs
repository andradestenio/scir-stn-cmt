import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../",import.meta.url);

test("novo módulo Hospub calcula ocupação e funciona somente com plantão ativo",() => {
  const html = fs.readFileSync(new URL("index.html",root),"utf8");
  assert.match(html,/data-view="ocupacaoHospub"/);
  assert.match(html,/Ocupação Hospitalar — Visual Hospub/);
  assert.match(html,/Leitos operacionais/);
  assert.match(html,/Pacientes internados/);
  assert.match(html,/Leitos disponíveis/);
  assert.match(html,/Taxa de ocupação/);
  assert.match(html,/HOSPUB_POLL_INTERVAL_MS = 5 \* 60 \* 1000/);
  assert.match(html,/if\(!state\.shift \|\| isShiftClosed\(\)\)/);
  assert.match(html,/hospubSectors:hospubHistorySnapshot/);
  assert.match(html,/Nenhum nome, prontuário, CID, diagnóstico/);
});

test("conector limita o acesso aos endereços do Hospub e do SCIR",() => {
  const manifest = JSON.parse(fs.readFileSync(new URL("conector-hospub/manifest.json",root),"utf8"));
  assert.equal(manifest.manifest_version,3);
  assert.deepEqual(manifest.host_permissions,[
    "https://cemetron-hospub.sesau.ro.gov.br/*",
    "https://scir-stn-cmt.vercel.app/*"
  ]);
  assert.deepEqual(manifest.permissions,["tabs","scripting"]);
  assert.equal(manifest.permissions.includes("cookies"),false);
});

test("conector ativa a leitura na aba e no quadro interno corretos",() => {
  const manifest = JSON.parse(fs.readFileSync(new URL("conector-hospub/manifest.json",root),"utf8"));
  const background = fs.readFileSync(new URL("conector-hospub/background.js",root),"utf8");
  const hospub = fs.readFileSync(new URL("conector-hospub/content-hospub.js",root),"utf8");
  assert.equal(manifest.version,"1.0.2");
  assert.match(background,/allFrames:true/);
  assert.match(background,/files:\["content-hospub\.js"\]/);
  assert.match(background,/\{frameId:target\.frameId\}/);
  assert.match(background,/inspections\.find\(item => item\.hasClinicSelect\)/);
  assert.match(hospub,/__SCIR_HOSPUB_CONNECTOR_ACTIVE__/);
});

test("conector reconhece setor vazio sem nome no título e não interrompe os próximos",() => {
  const content = fs.readFileSync(new URL("conector-hospub/content-hospub.js",root),"utf8");
  const html = fs.readFileSync(new URL("index.html",root),"utf8");
  assert.match(content,/NENHUM PACIENTE ENCONTRADO/);
  assert.match(content,/unnamedEmpty:true/);
  assert.match(content,/skippedSectors\.push/);
  assert.match(content,/continuando…/);
  assert.match(content,/seguindo para o próximo setor…/);
  assert.match(content,/findPatientTable/);
  assert.match(content,/payload:\{sectors:results,capturedAt,skippedSectors\}/);
  assert.match(html,/rawOccupied === "" \|\| rawOccupied === null \|\| rawOccupied === undefined/);
  assert.match(html,/Atualização parcial/);
});

test("indicadores Hospub mantêm ícones centralizados e proporcionais",() => {
  const html = fs.readFileSync(new URL("index.html",root),"utf8");
  assert.match(html,/\.hospub-summary-card>\.hospub-summary-icon\{display:grid;place-items:center;/);
  assert.match(html,/\.hospub-summary-card>\.hospub-summary-icon svg\{display:block;width:24px;height:24px;/);
  assert.match(html,/\.hospub-summary-card>div>span\{display:block;/);
  assert.doesNotMatch(html,/\.hospub-summary-card span\{display:block;/);
});

test("tabela Hospub exibe totais consolidados no rodapé",() => {
  const html = fs.readFileSync(new URL("index.html",root),"utf8");
  assert.match(html,/<tfoot id="hospubSectorTableFoot"><\/tfoot>/);
  assert.match(html,/const operationalTotal = operationalMetrics\.reduce/);
  assert.match(html,/const occupiedTotal = occupiedMetrics\.reduce/);
  assert.match(html,/const availableTotal = configuredMetrics\.reduce/);
  assert.match(html,/configuredOccupiedTotal \/ comparableOperationalTotal/);
  assert.match(html,/<td>TOTAL<\/td>/);
});

test("conector inclui setores PA e transmite apenas totais consolidados",() => {
  const content = fs.readFileSync(new URL("conector-hospub/content-hospub.js",root),"utf8");
  assert.match(content,/labels\.some\(label => label\.startsWith\("PA\/"\)\)/);
  assert.match(content,/label\.includes\("TESTE HOSPUB"\)/);
  assert.match(content,/\^X\+\$/);
  assert.match(content,/payload:\{sectors:results,capturedAt,skippedSectors\}/);
  assert.match(content,/occupied:Math\.max/);
  assert.doesNotMatch(content,/payload:\{[^}]*patient/i);
  assert.doesNotMatch(content,/payload:\{[^}]*prontuario/i);
  assert.doesNotMatch(content,/payload:\{[^}]*cid/i);
});

test("conector detecta listas repetidas sem transmitir dados identificáveis",() => {
  const content = fs.readFileSync(new URL("conector-hospub/content-hospub.js",root),"utf8");
  assert.match(content,/crypto\.subtle\.digest\("SHA-256"/);
  assert.match(content,/previousSignatures\.has\(signature\)/);
  assert.match(content,/slice\(0,3\)/);
  assert.match(content,/results\.push\(\{/);
  assert.doesNotMatch(content,/results\.push\(\{[\s\S]{0,220}(name|prontuario|cid|diagnosis):/i);
});
