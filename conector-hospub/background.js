const HOSPUB_URL = "https://cemetron-hospub.sesau.ro.gov.br/*";
const SCIR_URL = "https://scir-stn-cmt.vercel.app/*";

function sendToScir(message){
  chrome.tabs.query({url:SCIR_URL}, tabs => {
    tabs.forEach(tab => {
      if(!tab.id) return;
      chrome.tabs.sendMessage(tab.id,{target:"scir-content",...message},() => void chrome.runtime.lastError);
    });
  });
}

function queryTabs(queryInfo){
  return new Promise(resolve => chrome.tabs.query(queryInfo,tabs => resolve(tabs || [])));
}

function executeScript(details){
  return new Promise((resolve,reject) => {
    chrome.scripting.executeScript(details,results => {
      const error = chrome.runtime.lastError;
      if(error){
        reject(new Error(error.message));
        return;
      }
      resolve(results || []);
    });
  });
}

function sendTabMessage(tabId,message,options={}){
  return new Promise((resolve,reject) => {
    chrome.tabs.sendMessage(tabId,message,options,response => {
      const error = chrome.runtime.lastError;
      if(error){
        reject(new Error(error.message));
        return;
      }
      resolve(response);
    });
  });
}

function inspectHospubDocument(){
  const normalize = value => String(value || "")
    .replace(/\s+/g," ")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toUpperCase();
  const clinicSelect = [...document.querySelectorAll("select")].find(select => {
    const labels = [...select.options].map(option => normalize(option.textContent));
    return labels.includes("ISOLAMENTO")
      && labels.includes("MASCULINA 1")
      && labels.some(label => label.startsWith("PA/"));
  });
  return {hasClinicSelect:Boolean(clinicSelect),href:location.href};
}

async function inspectHospubTab(tab){
  try{
    const frames = await executeScript({
      target:{tabId:tab.id,allFrames:true},
      func:inspectHospubDocument
    });
    const clinicFrame = frames.find(frame => frame.result?.hasClinicSelect);
    const topFrame = frames.find(frame => frame.frameId === 0) || frames[0];
    return {
      tab,
      frameId:clinicFrame?.frameId ?? topFrame?.frameId ?? 0,
      hasClinicSelect:Boolean(clinicFrame)
    };
  }catch(error){
    return {tab,error};
  }
}

async function activateHospubConnector(tabId,frameId){
  await executeScript({
    target:{tabId,frameIds:[frameId]},
    files:["content-hospub.js"]
  });
}

function friendlyActivationError(error){
  const detail = String(error?.message || "");
  if(/cannot access|permission|extensions gallery|not allowed/i.test(detail)){
    return "No Chrome, permita que o conector acesse o site do Hospub";
  }
  if(/receiving end does not exist|could not establish connection/i.test(detail)){
    return "Não foi possível ativar o conector na página do Hospub";
  }
  return "Falha ao ativar o conector do Hospub — recarregue a extensão";
}

async function requestHospubScan(message){
  try{
    const tabs = (await queryTabs({url:HOSPUB_URL})).filter(tab => tab.id);
    if(!tabs.length){
      sendToScir({
        type:"SCAN_STATUS",
        status:"error",
        requestId:message.requestId,
        message:"Abra e autentique o Visual Hospub em outra aba"
      });
      return;
    }

    const inspections = [];
    for(const tab of tabs) inspections.push(await inspectHospubTab(tab));
    const target = inspections.find(item => item.hasClinicSelect)
      || inspections.find(item => !item.error);
    if(!target){
      throw inspections[0]?.error || new Error("A página do Hospub não pôde ser acessada.");
    }

    await activateHospubConnector(target.tab.id,target.frameId);
    await sendTabMessage(target.tab.id,{
      target:"hospub-content",
      type:"START_SCAN",
      requestId:message.requestId
    },{frameId:target.frameId});
  }catch(error){
    sendToScir({
      type:"SCAN_STATUS",
      status:"error",
      requestId:message.requestId,
      message:friendlyActivationError(error)
    });
  }
}

chrome.runtime.onMessage.addListener((message,_sender,sendResponse) => {
  if(!message || typeof message !== "object") return;
  if(message.source === "scir-content" && message.type === "HOSPUB_SCAN_REQUEST"){
    requestHospubScan(message).finally(() => sendResponse({accepted:true}));
    return true;
  }
  if(message.source === "hospub-content" && ["SCAN_STATUS","CENSUS_RESULT"].includes(message.type)){
    sendToScir(message);
    sendResponse({accepted:true});
  }
});
