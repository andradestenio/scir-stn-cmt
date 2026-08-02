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

function requestHospubScan(message){
  chrome.tabs.query({url:HOSPUB_URL}, tabs => {
    const tab = tabs.find(item => item.id);
    if(!tab?.id){
      sendToScir({
        type:"SCAN_STATUS",
        status:"error",
        requestId:message.requestId,
        message:"Abra e autentique o Visual Hospub em outra aba"
      });
      return;
    }
    chrome.tabs.sendMessage(tab.id,{
      target:"hospub-content",
      type:"START_SCAN",
      requestId:message.requestId
    },() => {
      if(!chrome.runtime.lastError) return;
      sendToScir({
        type:"SCAN_STATUS",
        status:"error",
        requestId:message.requestId,
        message:"Atualize a aba do Visual Hospub para ativar o conector"
      });
    });
  });
}

chrome.runtime.onMessage.addListener((message,_sender,sendResponse) => {
  if(!message || typeof message !== "object") return;
  if(message.source === "scir-content" && message.type === "HOSPUB_SCAN_REQUEST"){
    requestHospubScan(message);
    sendResponse({accepted:true});
    return;
  }
  if(message.source === "hospub-content" && ["SCAN_STATUS","CENSUS_RESULT"].includes(message.type)){
    sendToScir(message);
    sendResponse({accepted:true});
  }
});
