const APP_SOURCE = "scir-hospub-app-v1";
const CONNECTOR_SOURCE = "scir-hospub-connector-v1";
const CONNECTOR_VERSION = "1.0.1";

function sendToPage(message){
  window.postMessage({source:CONNECTOR_SOURCE,version:CONNECTOR_VERSION,...message},window.location.origin);
}

window.addEventListener("message",event => {
  if(event.source !== window || event.origin !== window.location.origin) return;
  const message = event.data;
  if(!message || message.source !== APP_SOURCE || message.type !== "HOSPUB_SCAN_REQUEST") return;
  chrome.runtime.sendMessage({
    source:"scir-content",
    type:"HOSPUB_SCAN_REQUEST",
    requestId:String(message.requestId || "")
  },() => void chrome.runtime.lastError);
});

chrome.runtime.onMessage.addListener(message => {
  if(!message || message.target !== "scir-content") return;
  if(message.type === "SCAN_STATUS"){
    sendToPage({
      type:"SCAN_STATUS",
      status:message.status,
      message:message.message,
      requestId:message.requestId
    });
  }
  if(message.type === "CENSUS_RESULT"){
    sendToPage({type:"CENSUS_RESULT",payload:message.payload,requestId:message.requestId});
  }
});

sendToPage({type:"CONNECTOR_READY"});
document.addEventListener("DOMContentLoaded",() => sendToPage({type:"CONNECTOR_READY"}),{once:true});
