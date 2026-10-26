import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

function loadCensusCalculator(){
  const start = html.indexOf("const STATISTICS_CENSUS_FIELDS");
  const end = html.indexOf("function buildStatisticsData",start);
  assert.ok(start >= 0 && end > start,"bloco de cálculo estatístico não localizado");
  const source = html.slice(start,end);
  return new Function(`${source}\nreturn {statisticsCensusMetrics,STATISTICS_TOTAL_OPERATIONAL_BEDS};`)();
}

test("estatísticas usam o censo manual da dashboard e 91 leitos operacionais",() => {
  assert.match(html,/const STATISTICS_TOTAL_OPERATIONAL_BEDS = STATISTICS_OPERATIONAL_SECTORS\.reduce/);
  assert.match(html,/id="statisticsCensusCapacity">91 LEITOS OPERACIONAIS/);
  assert.match(html,/label:"Clínica Feminina"[^\n]+capacity:17/);
  assert.match(html,/label:"Isolamento"[^\n]+capacity:11/);
  assert.match(html,/label:"Masculina 1"[^\n]+capacity:19/);
  assert.match(html,/label:"Masculina 2"[^\n]+capacity:10/);
  assert.match(html,/label:"Masculina 3"[^\n]+capacity:14/);
  assert.match(html,/label:"UTI Geral"[^\n]+capacity:8/);
  assert.match(html,/label:"UTI Infecto"[^\n]+capacity:10/);
});

test("ocupação depende de censo completo e exclui atualizações automáticas do Hospub",() => {
  assert.match(html,/!Array\.isArray\(census\.hospubSectors\)/);
  assert.match(html,/if\(values\.some\(value => value === null\)\) return null/);
  assert.match(html,/STATISTICS_TOTAL_OPERATIONAL_BEDS - averageAvailable/);
  assert.match(html,/statisticsPercent\(averageOccupied,STATISTICS_TOTAL_OPERATIONAL_BEDS\)/);
  assert.match(html,/Atualizações automáticas do Hospub não entram neste cálculo/);
});

test("censo de referência calcula 20 disponíveis 71 ocupados e 78 por cento",() => {
  const {statisticsCensusMetrics,STATISTICS_TOTAL_OPERATIONAL_BEDS} = loadCensusCalculator();
  const manual = {
    recordedAt:"2026-10-25T06:29:00",
    infectologia:{masc2:0,masc2Ppl:0,masc3:1,fem:3,tb:7,utiColetivo:3,utiIsolamento:0},
    clinica:{masc1:1,masc1Isolamento:0,fem:1,utiGeral:4}
  };
  const automatic = {recordedAt:"2026-10-25T07:00:00",hospubSectors:[{key:"uti-geral",occupied:8}]};
  const metrics = statisticsCensusMetrics([{shift:{date:"2026-10-25"},censusUpdates:[manual,automatic]}]);
  assert.equal(STATISTICS_TOTAL_OPERATIONAL_BEDS,91);
  assert.equal(metrics.records.length,1);
  assert.equal(metrics.averageAvailable,20);
  assert.equal(metrics.averageOccupied,71);
  assert.equal(Number(metrics.occupancyRate.toFixed(1)),78);
});

test("censo incompleto não é convertido silenciosamente em zero",() => {
  const {statisticsCensusMetrics} = loadCensusCalculator();
  const incomplete = {infectologia:{masc2:0},clinica:{}};
  const metrics = statisticsCensusMetrics([{shift:{date:"2026-10-25"},censusUpdates:[incomplete]}]);
  assert.equal(metrics.records.length,1);
  assert.equal(metrics.valid.length,0);
  assert.equal(metrics.incompleteCount,1);
  assert.equal(metrics.occupancyRate,null);
});

test("aba final inclui filtros e indicadores assistenciais aprovados",() => {
  assert.match(html,/id="statisticsTransferStatus"/);
  assert.match(html,/id="statisticsBlueType"/);
  assert.match(html,/id="statisticsAuthorizationRate"/);
  assert.match(html,/id="statisticsTransferWaiting"/);
  assert.match(html,/id="statisticsOccupancyRate"/);
  assert.match(html,/id="statisticsLatestCensus"/);
  assert.match(html,/id="statisticsCensusGrid"/);
  assert.match(html,/Taxa individual preservada como N\/D/i);
});

test("exportação estatística inclui ocupação e disponibilidade por setor",() => {
  assert.match(html,/OCUPAÇÃO E DISPONIBILIDADE DE LEITOS/);
  assert.match(html,/Disponíveis em média<\/th><th>Ocupados em média<\/th><th>Taxa de ocupação/);
  assert.match(html,/Fonte no censo da dashboard/);
});
