import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");

test("conteúdo central pode encolher sem ser cortado pela barra lateral",() => {
  assert.match(html,/grid-template-columns:250px minmax\(0,1fr\)/);
  assert.match(html,/main\{[\s\S]*?min-width:0;[\s\S]*?max-width:100%/);
  assert.match(html,/\.view,\.panel\{min-width:0;max-width:100%\}/);
});

test("menu lateral possui controle de três barras e modo recolhido persistente",() => {
  assert.match(html,/id="sidebarToggleButton"[\s\S]*?sidebar-toggle-icon[\s\S]*?<span><\/span><span><\/span><span><\/span>/);
  assert.match(html,/body\.sidebar-collapsed \.app\{grid-template-columns:76px minmax\(0,1fr\)\}/);
  assert.match(html,/const SIDEBAR_COLLAPSED_STORAGE_KEY = "scirSidebarCollapsedV1"/);
  assert.match(html,/localStorage\.setItem\(SIDEBAR_COLLAPSED_STORAGE_KEY/);
  assert.match(html,/id="mobileMenuButton"[\s\S]*?>☰<\/button>/);
});

test("grades de estatísticas se adaptam à largura disponível",() => {
  assert.match(html,/\.statistics-filters\{[^}]*repeat\(auto-fit,minmax\(180px,1fr\)\)/);
  assert.match(html,/\.statistics-kpi-grid\{[^}]*repeat\(auto-fit,minmax\(145px,1fr\)\)/);
  assert.match(html,/\.statistics-insight-grid\{[^}]*repeat\(auto-fit,minmax\(320px,1fr\)\)/);
  assert.match(html,/\.statistics-triple-grid\{[^}]*repeat\(auto-fit,minmax\(260px,1fr\)\)/);
  assert.match(html,/\.statistics-ranking-grid\{[^}]*repeat\(auto-fit,minmax\(230px,1fr\)\)/);
  assert.match(html,/\.statistics-census-grid\{[^}]*repeat\(auto-fit,minmax\(250px,1fr\)\)/);
});
