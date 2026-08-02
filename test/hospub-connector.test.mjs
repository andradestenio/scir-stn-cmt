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
  assert.deepEqual(manifest.permissions,["tabs"]);
  assert.equal(manifest.permissions.includes("cookies"),false);
});

test("conector inclui setores PA e transmite apenas totais consolidados",() => {
  const content = fs.readFileSync(new URL("conector-hospub/content-hospub.js",root),"utf8");
  assert.match(content,/labels\.some\(label => label\.startsWith\("PA\/"\)\)/);
  assert.match(content,/label\.includes\("TESTE HOSPUB"\)/);
  assert.match(content,/\^X\+\$/);
  assert.match(content,/payload:\{sectors:results,capturedAt\}/);
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
