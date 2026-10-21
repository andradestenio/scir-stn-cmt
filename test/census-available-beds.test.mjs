import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../",import.meta.url);
const html = fs.readFileSync(new URL("index.html",root),"utf8");

test("censo manual segue o padrão operacional do Hospub",() => {
  assert.match(html,/class="bed-census-overview-grid"/);
  assert.match(html,/id="bedCensusInfectologyTitle">Infectologia/);
  assert.match(html,/id="bedCensusClinicalTitle">Clínica Médica/);
  assert.match(html,/Leitos disponíveis<\/th><th>Enf\/Leito/);
  assert.match(html,/id="bedCensusGrandTotal"/);
  assert.match(html,/id="bedInfMasc2List"/);
  assert.match(html,/id="bedClinUtiGeralList"/);
  assert.match(html,/const BED_CENSUS_AVAILABLE_BEDS_FIELDS = \{/);
  assert.match(html,/availableBeds:emptyBedCensusAvailableBeds\(\)/);
  assert.match(html,/id="saveBedCensus" type="button">Salvar censo/);
  assert.match(html,/id="bedCensusModal"/);
  assert.match(html,/id="openBedCensusModal"[^>]*>Preencher ou atualizar censo/);
  assert.match(html,/id="bedCensusObservationsResult"/);
});

test("campo Enf/Leito permanece sempre disponível para preenchimento",() => {
  assert.match(html,/function updateBedCensusAvailableBedInputs\(\)/);
  assert.match(html,/listInput\.disabled = false/);
  assert.match(html,/listInput\.setAttribute\("aria-disabled", "false"\)/);
  assert.match(html,/result\.availableBeds\[sectionKey\]\[fieldKey\] = \$\(id\)\?\.value\.trim\(\) \|\| ""/);
  assert.doesNotMatch(html,/if\(!enabled\) listInput\.value = ""/);
});

test("identificação dos leitos acompanha dashboard SBAR histórico e cópia",() => {
  assert.match(html,/function censusAvailableBedsCell\(value, beds\)/);
  assert.match(html,/census\.availableBeds\?\.infectologia/);
  assert.match(html,/sbar-census-bed-list/);
  assert.match(html,/Descrição: \$\{bedList\}/);
  assert.match(html,/leito\(s\) disponível\(is\).*descrição:/);
});

test("dashboard mantém resumo elegante e formulário em janela própria",() => {
  assert.match(html,/function updateBedCensusDraftTotals\(\)/);
  assert.match(html,/renderBedCensusTotal\("bedCensusInfectologiaDraftTotal", totals\.infectologia\)/);
  assert.match(html,/renderBedCensusTotal\("bedCensusClinicaDraftTotal", totals\.clinica\)/);
  assert.match(html,/renderBedCensusTotal\("bedCensusGrandDraftTotal", totals\.infectologia \+ totals\.clinica\)/);
  assert.match(html,/\.bed-census-overview-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(html,/\.bed-census-form-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(html,/function openBedCensusModal\(\)/);
  assert.match(html,/function closeBedCensusModal\(\)/);
});
