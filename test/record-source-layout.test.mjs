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
  for(const source of ["crue","cerel","interna","direta","na"]){
    assert.match(html,new RegExp(`type="radio" name="requestSource" value="${source}"`));
  }
  assert.match(html,/name="requestSource" value="na" checked/);
  assert.match(html,/requestSource: selectedRequestSource\(\)/);
  assert.match(html,/return normalizeRequestSource\(document\.querySelector\('input\[name="requestSource"\]:checked'\)\?\.value\);/);
});

test("origens da solicitação aparecem como tags coloridas e permanecem editáveis",() => {
  for(const source of ["crue","cerel","interna","direta","na"]){
    assert.match(html,new RegExp(`\\.request-source-tag\\.${source}`));
  }
  assert.match(html,/request-source-tag\.crue\{border-color:#f87171;background:#fef2f2;color:#991b1b/);
  assert.match(html,/request-source-tag\.cerel\{border-color:#fb923c;background:#fff7ed;color:#9a3412/);
  assert.match(html,/request-source-tag\.interna\{border-color:#4ade80;background:#f0fdf4;color:#166534/);
  assert.match(html,/request-source-tag\.direta\{border-color:#60a5fa;background:#eff6ff;color:#1d4ed8/);
  assert.match(html,/request-source-tag\.na\{border-color:#94a3b8;background:#f1f5f9;color:#475569/);
  assert.match(html,/requestSourceTagHtml\(record\.requestSource\)/);
  assert.match(html,/setSelectedRequestSource\(record\.requestSource \|\| ""\)/);
  assert.match(html,/statisticsRequestSource/);
  assert.match(html,/statisticsRequestSources/);
});

test("novo registro inclui perfil do paciente com tags coloridas e integração completa",() => {
  assert.match(html,/<legend class="patient-profile-title">Perfil do paciente:<\/legend>/);
  for(const profile of ["enfermaria","isolamento","uti","pronto_atendimento"]){
    assert.match(html,new RegExp(`type="radio" name="patientProfile" value="${profile}"`));
  }
  assert.match(html,/\.patient-profile-tag\.enfermaria\{border-color:#4ade80;background:#f0fdf4;color:#166534/);
  assert.match(html,/\.patient-profile-tag\.isolamento\{border-color:#c084fc;background:#faf5ff;color:#7e22ce/);
  assert.match(html,/\.patient-profile-tag\.uti\{border-color:#f87171;background:#fef2f2;color:#991b1b/);
  assert.match(html,/\.patient-profile-tag\.pronto-atendimento\{border-color:#fb923c;background:#fff7ed;color:#9a3412/);
  assert.match(html,/patientProfile: selectedPatientProfile\(\)/);
  assert.match(html,/setSelectedPatientProfile\(record\.patientProfile \|\| ""\)/);
  assert.match(html,/Selecione o perfil do paciente: Enfermaria, Isolamento, UTI ou Pronto Atendimento\./);
  assert.match(html,/statisticsPatientProfile/);
  assert.match(html,/statisticsPatientProfiles/);
  assert.match(html,/patientProfileLabel\(record\.patientProfile\)/);
  assert.match(html,/PERFIL DO PACIENTE: \$\{patientProfileLabel\(r\.patientProfile\)\}/);
  assert.match(html,/const SCIR_VERSION = "1\.16\.23"/);
});
