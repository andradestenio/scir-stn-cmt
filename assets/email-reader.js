(() => {
  const dialog = document.createElement("dialog");
  dialog.className = "email-reader";
  dialog.setAttribute("aria-label","Leitor de e-mail do NIR");
  document.body.append(dialog);
  let controller, currentKey, detail, focusBefore;
  const urls = new Set(), cache = new Map();
  const esc = value => String(value ?? "").replace(/[&<>"']/g,c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const sizeLabel = size => size < 1024 ? `${size} B` : size < 1048576 ? `${(size/1024).toFixed(1)} KB` : `${(size/1048576).toFixed(1)} MB`;
  function clear(){
    controller?.abort();
    urls.forEach(url => URL.revokeObjectURL(url)); urls.clear(); cache.clear();
    detail = null; currentKey = null; dialog.innerHTML = "";
  }
  window.scirCloseEmailReader = () => {if(dialog.open) dialog.close(); clear();};
  dialog.addEventListener("close",() => {clear();focusBefore?.focus();});
  async function request(query, signal, binary=false){
    const response = await fetch(`/api/email-message?${query}`,{credentials:"same-origin",cache:"no-store",signal});
    if(response.status === 401){window.scirCloseEmailReader();lockExpiredSession();throw new Error("Sua sessão expirou. Entre novamente.");}
    if(!response.ok){const body = await response.json().catch(() => ({}));throw new Error(body.error || "Não foi possível carregar o e-mail.");}
    return binary ? response.arrayBuffer() : response.json();
  }
  function shell(){
    dialog.innerHTML = `<header><div><p>NIR CEMETRON · Somente leitura</p><h2>Texto e anexos</h2></div><button type="button" data-reader-close aria-label="Fechar e-mail">Fechar</button></header><div class="reader-main"><div id="readerContent"></div><p class="reader-status" id="readerStatus" role="status" aria-live="polite">Carregando mensagem…</p><p class="reader-note">A mensagem original permanece no Zimbra. Imagens externas e conteúdo ativo são bloqueados. Os arquivos não são gravados no histórico do plantão.</p><a class="reader-link" href="https://webmail.sesau.ro.gov.br/" target="_blank" rel="noopener noreferrer">Abrir webmail</a></div>`;
  }
  function status(message){const node = dialog.querySelector("#readerStatus");if(node){node.textContent = message;node.hidden = !message;}}
  function render(){
    const d = detail;
    dialog.querySelector("#readerContent").innerHTML = `<section class="reader-meta"><h3>${esc(d.subject)}</h3><dl><dt>De</dt><dd>${esc(d.from)}</dd><dt>Para</dt><dd>${esc(d.to || "Não informado")}</dd>${d.cc ? `<dt>Cópia</dt><dd>${esc(d.cc)}</dd>`:""}<dt>Recebido</dt><dd>${esc(new Date(d.receivedAt).toLocaleString("pt-BR",{timeZone:"America/Porto_Velho"}))}</dd></dl></section><div class="reader-tabs"><button type="button" data-reader-mode="html" aria-pressed="${Boolean(d.html)}" ${d.html ? "":"disabled"}>Formatado</button><button type="button" data-reader-mode="text" aria-pressed="${!d.html}">Texto</button></div><div class="reader-body"><iframe title="Texto formatado do e-mail" sandbox referrerpolicy="no-referrer" ${d.html ? "":"hidden"}></iframe><pre ${d.html ? "hidden":""}></pre></div><section class="reader-attachments"><h3>Anexos (${d.attachments.length})</h3><div class="reader-files">${d.attachments.map(a => `<article class="reader-file"><strong>${esc(a.filename)}</strong><small>${esc(sizeLabel(a.size))} · ${esc(a.contentType)}</small><div class="reader-file-actions">${/^(application\/pdf|image\/(png|jpeg|gif|webp))$/.test(a.contentType) ? `<button type="button" data-reader-file="${a.id}" data-reader-action="preview">Visualizar</button>`:""}<button type="button" data-reader-file="${a.id}" data-reader-action="download">Baixar</button></div></article>`).join("") || "<p>Esta mensagem não contém anexos.</p>"}</div></section><section class="reader-preview" hidden></section>`;
    dialog.querySelector("pre").textContent = d.text || "Mensagem sem versão em texto. Consulte a visualização formatada.";
    dialog.querySelector(".reader-body iframe").srcdoc = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; form-action 'none'; base-uri 'none'"><style>body{font:16px/1.6 system-ui;color:#183454;padding:12px;overflow-wrap:anywhere}table{border-collapse:collapse;max-width:100%;display:block;overflow-x:auto}td,th{padding:6px;border:1px solid #dce5ef}pre{white-space:pre-wrap}blockquote{margin:12px 0;padding-left:14px;border-left:3px solid #cbd8e8}</style></head><body>${d.html || ""}</body></html>`;
    status("");
  }
  async function open(key){
    if(!isAuthenticated) return;
    focusBefore = document.activeElement;
    clear(); currentKey = key; controller = new AbortController();
    const signal = controller.signal;
    shell(); if(!dialog.open) dialog.showModal();
    try{const result = await request(new URLSearchParams({eventKey:key}),signal);if(signal.aborted)return;detail=result;render();}
    catch(error){if(!signal.aborted){status(error.message);dialog.querySelector("#readerContent").innerHTML='<button type="button" data-reader-retry>Tentar novamente</button>';}}
  }
  async function file(id,action,button){
    const attachment = detail?.attachments.find(item => item.id === id);
    if(!attachment) return;
    const signal = controller.signal;
    button.disabled = true;
    try{
      let blob = cache.get(id);
      if(!blob){
        const chunks = [];let offset=0;
        do{
          status(`Carregando ${attachment.filename}: ${Math.min(100,Math.round(offset/Math.max(1,attachment.size)*100))}%`);
          const chunk = await request(new URLSearchParams({eventKey:currentKey,attachment:String(id),offset:String(offset),sha256:attachment.sha256}),signal,true);
          if(signal.aborted)return;
          if(!chunk.byteLength && offset < attachment.size) throw new Error("Download incompleto. Tente novamente.");
          chunks.push(chunk);offset+=chunk.byteLength;
        }while(offset < attachment.size);
        blob = new Blob(chunks,{type:attachment.contentType});
        if(blob.size !== attachment.size)throw new Error("Tamanho do anexo divergente. Reabra o e-mail.");
        const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",await blob.arrayBuffer()))).map(b => b.toString(16).padStart(2,"0")).join("");
        if(digest !== attachment.sha256)throw new Error("A verificação do anexo falhou. Reabra o e-mail.");
        if(signal.aborted)return;
        cache.set(id,blob);
      }
      const url = URL.createObjectURL(blob);urls.add(url);
      if(action === "preview"){
        const preview = dialog.querySelector(".reader-preview");preview.replaceChildren();preview.hidden=false;
        const title=document.createElement("h3");title.textContent=attachment.filename;preview.append(title);
        if(attachment.contentType === "application/pdf"){
          const frame=document.createElement("iframe");frame.title=attachment.filename;frame.setAttribute("sandbox", "");frame.src=url;preview.append(frame);
          const note=document.createElement("p");note.className="reader-note";note.textContent="Se o navegador não exibir o PDF, utilize Baixar para abri-lo no leitor do dispositivo.";preview.append(note);
        }else{const img=document.createElement("img");img.alt=attachment.filename;img.src=url;preview.append(img);}
        preview.scrollIntoView({behavior:"smooth",block:"start"});
      }else{
        const link=document.createElement("a");link.href=url;link.download=attachment.filename;dialog.append(link);link.click();link.remove();
      }
      status("");
    }catch(error){if(!signal.aborted)status(error.message || "Falha ao carregar o anexo.");}
    finally{button.disabled=false;}
  }
  document.addEventListener("click",event => {
    const trigger=event.target.closest("[data-email-open]");
    if(trigger)open(decodeURIComponent(trigger.dataset.emailOpen));
  });
  dialog.addEventListener("click",event => {
    const button=event.target.closest("button");if(!button)return;
    if(button.hasAttribute("data-reader-close"))window.scirCloseEmailReader();
    if(button.hasAttribute("data-reader-retry"))open(currentKey);
    if(button.dataset.readerMode){
      const html=button.dataset.readerMode === "html";
      dialog.querySelector(".reader-body iframe").hidden=!html;dialog.querySelector("pre").hidden=html;
      dialog.querySelectorAll("[data-reader-mode]").forEach(b => b.setAttribute("aria-pressed",String(b===button)));
    }
    if(button.hasAttribute("data-reader-file"))file(Number(button.dataset.readerFile),button.dataset.readerAction,button);
  });
})();
