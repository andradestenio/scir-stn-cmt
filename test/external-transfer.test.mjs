import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../",import.meta.url);
const html = fs.readFileSync(new URL("index.html",root),"utf8");

test("transferências externas são separadas de avaliações e exames",() => {
  assert.match(html,/<option value="transfer">🟪 Transferências externas<\/option>/);
  assert.match(html,/<option value="blue">🟦 Avaliações \/ Exames<\/option>/);
  assert.doesNotMatch(html,/<option value="transferencia">Transferência externa<\/option>/);
  assert.match(html,/transfer: \{ title: "🟪 TRANSFERÊNCIAS EXTERNAS", css: "transfer" \}/);
  assert.match(html,/blue: \{ title: "🟦 AVALIAÇÕES \/ EXAMES", css: "blue" \}/);
});

test("transferência aguardando registra meio e protocolo RegulaRO",() => {
  assert.match(html,/id="externalTransferStatus"/);
  assert.match(html,/<option value="autorizada">Autorizada<\/option>/);
  assert.match(html,/<option value="aguardando">Aguardando<\/option>/);
  assert.match(html,/<option value="email">E-mail<\/option>/);
  assert.match(html,/<option value="regularo">RegulaRO<\/option>/);
  assert.match(html,/id="externalTransferProtocol"/);
  assert.match(html,/Informe o protocolo RegulaRO\./);
});

test("transferência autorizada inclui destino e enfermaria ou leito",() => {
  assert.match(html,/id="externalTransferWardBed"/);
  assert.match(html,/externalTransferWardBed: \$\("module"\)\.value === "transfer" && \$\("externalTransferStatus"\)\.value === "autorizada"/);
  assert.match(html,/transferAuthorized \? "Destino autorizado" : "Destino"/);
  assert.match(html,/\["Enfermaria\/Leito", record\.externalTransferWardBed \|\| ""\]/);
});

test("transferências antigas são migradas sem apagar dados",() => {
  assert.match(html,/record\.module === "blue" && record\.blueRecordType === "transferencia"/);
  assert.match(html,/\? \{\.\.\.record,module:"transfer"\}/);
  assert.match(html,/externalTransferStatus === "solicitada"[\s\S]*?externalTransferStatus:"aguardando"/);
  assert.match(html,/item\.records\.map\(normalizeRecordCategory\)/);
  assert.match(html,/normalizeRecordCollections\(state\)/);
});

test("nova categoria participa de indicadores estatísticas e SBAR",() => {
  assert.match(html,/id="countTransfer"/);
  assert.match(html,/id="chartTransferValue"/);
  assert.match(html,/const moduleCounts = \{yellow:0,transfer:0,blue:0,green:0,red:0\}/);
  assert.match(html,/sbarFullGroupMarkup\("transfer"\)/);
  assert.match(html,/TRANSFERÊNCIAS EXTERNAS: \$\{counts\.transfer\}/);
});

test("transferência externa permite copiar e gerar PDF com cores próprias",() => {
  assert.match(html,/copyExternalTransferReport\('\$\{record\.id\}'\)/);
  assert.match(html,/printExternalTransferReport\('\$\{record\.id\}'\)/);
  assert.match(html,/function buildExternalTransferReportText\(record\)/);
  assert.match(html,/function buildExternalTransferReportHtml\(record, showActions=true\)/);
  assert.match(html,/INFORME DE TRANSFERÊNCIA EXTERNA/);
  assert.match(html,/\.evaluation-summary\.transfer-summary/);
  assert.match(html,/\.transfer-status-tag\.autorizada/);
  assert.match(html,/\.transfer-status-tag\.aguardando/);
});

test("indicadores do dashboard ficam simétricos em uma linha",() => {
  assert.match(html,/\.dashboard-record-stats\{\s*grid-template-columns:repeat\(6,minmax\(0,1fr\)\);/);
  assert.match(html,/\.dashboard-record-stats \.stat\{[\s\S]*?min-height:116px;[\s\S]*?flex-direction:column;/);
  assert.match(html,/\.dashboard-record-stats \.stat \.label\{[\s\S]*?min-height:32px;/);
});
