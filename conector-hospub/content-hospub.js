(() => {
if(globalThis.__SCIR_HOSPUB_CONNECTOR_ACTIVE__) return;
globalThis.__SCIR_HOSPUB_CONNECTOR_ACTIVE__ = true;

const CONNECTOR_VERSION = "1.0.2";
let scanRunning = false;

function cleanText(value){
  return String(value || "").replace(/\s+/g," ").trim();
}

function normalizeText(value){
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toUpperCase();
}

function sectorKey(value){
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"")
    .slice(0,80);
}

function validClinicLabel(value){
  const label = normalizeText(value);
  if(!label || label === "TODAS" || label.includes("ESCOLHA UMA OPCAO")) return false;
  if(label.includes("TESTE HOSPUB")) return false;
  if(/^X+$/.test(label.replace(/\s/g,""))) return false;
  return true;
}

function findClinicSelect(){
  return [...document.querySelectorAll("select")].find(select => {
    const labels = [...select.options].map(option => normalizeText(option.textContent));
    return labels.includes("ISOLAMENTO")
      && labels.includes("MASCULINA 1")
      && labels.some(label => label.startsWith("PA/"));
  }) || null;
}

function findSearchButton(select){
  const candidates = [...document.querySelectorAll("button,input[type='button'],input[type='submit']")]
    .filter(element => normalizeText(element.textContent || element.value) === "BUSCAR");
  if(!candidates.length) return null;
  const selectRect = select.getBoundingClientRect();
  return candidates
    .map(element => ({element,distance:Math.abs(element.getBoundingClientRect().top - selectRect.top)}))
    .sort((a,b) => a.distance - b.distance)[0].element;
}

function hasEmptyPatientResult(){
  return [...document.querySelectorAll("table tbody tr,td,.alert,.mensagem,.message")].some(element => {
    const text = normalizeText(element.textContent);
    return text.length <= 180 && text.includes("NENHUM PACIENTE ENCONTRADO");
  });
}

function selectedClinicMatches(expectedLabel){
  const select = findClinicSelect();
  const selected = select?.selectedOptions?.[0] || select?.options?.[select?.selectedIndex];
  const actual = normalizeText(selected?.textContent);
  const expected = normalizeText(expectedLabel);
  return Boolean(actual && expected && (actual === expected || actual.includes(expected) || expected.includes(actual)));
}

function currentListSnapshot(expectedLabel=""){
  const titleElements = [...document.querySelectorAll("h1,h2,h3,h4,h5,legend,strong,div")];
  for(const element of titleElements){
    const text = cleanText(element.textContent);
    if(text.length > 180 || !/LISTA\s+DE\s+PACIENTES/i.test(text)) continue;
    const match = text.match(/LISTA\s+DE\s+PACIENTES\s+(.+?)\s*-\s*\((\d+)\)/i);
    if(match) return {label:cleanText(match[1]),occupied:Number(match[2])};
    const unnamedMatch = text.match(/LISTA\s+DE\s+PACIENTES\s*-\s*\((\d+)\)/i);
    if(unnamedMatch && Number(unnamedMatch[1]) === 0 && hasEmptyPatientResult()){
      return {label:cleanText(expectedLabel),occupied:0,unnamedEmpty:true};
    }
  }
  return null;
}

function findPatientTable(){
  return [...document.querySelectorAll("table")].find(item => {
    const heading = normalizeText(item.querySelector("thead")?.textContent || item.textContent.slice(0,300));
    return heading.includes("PRONTUARIO") && heading.includes("LEITO") && heading.includes("DATA INTERNACAO");
  }) || null;
}

function patientTableText(){
  const table = findPatientTable();
  if(!table) return "";
  return [...table.querySelectorAll("tbody tr")]
    .map(row => [...row.cells].slice(0,3).map(cell => cleanText(cell.textContent)).join("|"))
    .sort()
    .join("\n");
}

async function localTableSignature(){
  const text = patientTableText();
  if(!text) return "sem-tabela";
  const digest = await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2,"0")).join("");
}

function waitForClinicResult(expectedLabel,triggerSearch,timeoutMs=18000){
  const expected = normalizeText(expectedLabel);
  return new Promise((resolve,reject) => {
    const startedAt = Date.now();
    let resultAreaChanged = false;
    let settled = false;
    const observer = new MutationObserver(records => {
      const patientTable = findPatientTable();
      if(records.some(record => {
        const target = record.target?.nodeType === Node.ELEMENT_NODE
          ? record.target
          : record.target?.parentElement;
        if(!target) return false;
        if(patientTable && (target === patientTable || patientTable.contains(target) || target.contains(patientTable))) return true;
        const text = normalizeText(target.textContent);
        return text.length <= 220 && text.includes("LISTA DE PACIENTES");
      })) resultAreaChanged = true;
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    const finish = callback => {
      if(settled) return;
      settled = true;
      observer.disconnect();
      callback();
    };
    const check = () => {
      const elapsed = Date.now() - startedAt;
      const snapshot = currentListSnapshot(expectedLabel);
      const actual = normalizeText(snapshot?.label);
      const matchingNamedResult = snapshot && !snapshot.unnamedEmpty
        && (actual === expected || actual.includes(expected) || expected.includes(actual));
      const matchingEmptyResult = snapshot?.unnamedEmpty
        && selectedClinicMatches(expectedLabel)
        && (resultAreaChanged || elapsed >= 3000);
      if((matchingNamedResult && elapsed >= 350) || matchingEmptyResult){
        finish(() => setTimeout(() => resolve(snapshot),250));
        return;
      }
      if(elapsed >= timeoutMs){
        finish(() => reject(new Error(`Tempo esgotado ao consultar ${expectedLabel}.`)));
        return;
      }
      setTimeout(check,250);
    };
    try{
      triggerSearch();
    }catch(error){
      finish(() => reject(error));
      return;
    }
    setTimeout(check,350);
  });
}

function notify(message){
  chrome.runtime.sendMessage({source:"hospub-content",version:CONNECTOR_VERSION,...message},() => void chrome.runtime.lastError);
}

function ensureWidget(){
  if(document.getElementById("scirHospubConnectorWidget")) return;
  const widget = document.createElement("div");
  widget.id = "scirHospubConnectorWidget";
  widget.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:2147483647;display:flex;align-items:center;gap:9px;padding:10px 12px;border:1px solid #93c5fd;border-radius:9px;background:#eff6ff;color:#0f2747;font:700 12px Arial,sans-serif;box-shadow:0 8px 28px rgba(15,39,71,.2)";
  widget.innerHTML = '<span id="scirHospubConnectorText">Conector SCIR pronto</span><button id="scirHospubConnectorButton" type="button" style="padding:7px 10px;border:0;border-radius:6px;background:#0f2747;color:#fff;font:700 11px Arial;cursor:pointer">Atualizar SCIR</button>';
  document.body.appendChild(widget);
  widget.querySelector("button").addEventListener("click",() => scanClinics(`manual-${Date.now()}`));
}

function setWidgetText(text){
  ensureWidget();
  const element = document.getElementById("scirHospubConnectorText");
  if(element) element.textContent = text;
}

async function scanClinics(requestId){
  if(scanRunning){
    notify({type:"SCAN_STATUS",status:"scanning",requestId,message:"A consulta ao Hospub já está em andamento"});
    return;
  }
  const select = findClinicSelect();
  const searchButton = select ? findSearchButton(select) : null;
  if(!select || !searchButton){
    notify({type:"SCAN_STATUS",status:"error",requestId,message:"Abra Internação → Consulta por Clínica no Visual Hospub"});
    setWidgetText("Abra Consulta por Clínica");
    return;
  }

  const options = [...select.options]
    .map((option,index) => ({value:option.value,label:cleanText(option.textContent),index}))
    .filter(option => validClinicLabel(option.label));
  if(!options.length){
    notify({type:"SCAN_STATUS",status:"error",requestId,message:"Nenhuma clínica válida foi localizada"});
    return;
  }

  scanRunning = true;
  notify({type:"SCAN_STATUS",status:"scanning",requestId,message:"Consultando os setores do Hospub…"});
  setWidgetText("Atualizando setores…");
  const previousValue = select.value;
  const results = [];
  const skippedSectors = [];
  const labelSignatures = new Map();
  const labelOccurrences = new Map();

  try{
    for(let index=0;index<options.length;index += 1){
      const option = options[index];
      setWidgetText(`Consultando ${index + 1}/${options.length}: ${option.label}`);
      notify({
        type:"SCAN_STATUS",
        status:"scanning",
        requestId,
        message:`Consultando ${index + 1}/${options.length}: ${option.label}`
      });
      const activeSelect = findClinicSelect() || select;
      const activeSearchButton = findSearchButton(activeSelect) || searchButton;
      try{
        const snapshot = await waitForClinicResult(option.label,() => {
          activeSelect.value = option.value;
          activeSelect.dispatchEvent(new Event("input",{bubbles:true}));
          activeSelect.dispatchEvent(new Event("change",{bubbles:true}));
          activeSearchButton.click();
        });
        const signature = `${snapshot.occupied}:${await localTableSignature()}`;
        const normalizedLabel = normalizeText(option.label);
        const previousSignatures = labelSignatures.get(normalizedLabel) || new Set();
        if(previousSignatures.has(signature)) continue;
        previousSignatures.add(signature);
        labelSignatures.set(normalizedLabel,previousSignatures);
        const occurrence = (labelOccurrences.get(normalizedLabel) || 0) + 1;
        labelOccurrences.set(normalizedLabel,occurrence);
        const baseKey = sectorKey(option.label) || `setor-${index + 1}`;
        results.push({
          key:occurrence === 1 ? baseKey : `${baseKey}-${occurrence}`,
          label:occurrence === 1 ? option.label : `${option.label} (${occurrence})`,
          occupied:Math.max(0,Math.trunc(snapshot.occupied))
        });
      }catch(error){
        skippedSectors.push({label:option.label,message:error?.message || "Falha na consulta"});
        setWidgetText(`Setor não lido: ${option.label} — continuando…`);
        notify({
          type:"SCAN_STATUS",
          status:"scanning",
          requestId,
          message:`${option.label} não respondeu; seguindo para o próximo setor…`
        });
      }
    }

    if(!results.length){
      throw new Error("Nenhum setor pôde ser atualizado no Hospub.");
    }

    const restoredSelect = findClinicSelect() || select;
    const restoredSearchButton = findSearchButton(restoredSelect) || searchButton;
    if(previousValue && [...restoredSelect.options].some(option => option.value === previousValue)){
      restoredSelect.value = previousValue;
      restoredSelect.dispatchEvent(new Event("change",{bubbles:true}));
      restoredSearchButton.click();
    }
    const capturedAt = new Date().toISOString();
    notify({type:"CENSUS_RESULT",requestId,payload:{sectors:results,capturedAt,skippedSectors}});
    setWidgetText(skippedSectors.length
      ? `SCIR atualizado: ${results.length} setores; ${skippedSectors.length} não lido(s)`
      : `SCIR atualizado: ${results.length} setores`);
  }catch(error){
    notify({type:"SCAN_STATUS",status:"error",requestId,message:error?.message || "Falha ao consultar o Hospub"});
    setWidgetText("Falha na atualização — tente novamente");
  }finally{
    scanRunning = false;
  }
}

chrome.runtime.onMessage.addListener(message => {
  if(!message || message.target !== "hospub-content" || message.type !== "START_SCAN") return;
  scanClinics(String(message.requestId || `scan-${Date.now()}`));
});

ensureWidget();
})();
