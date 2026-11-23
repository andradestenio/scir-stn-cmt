import test from 'node:test';
import assert from 'node:assert/strict';
import {readEmailContent,safeEmailHtml,MAX_MESSAGE_BYTES,CHUNK_BYTES} from '../lib/email-content.js';
import {createEmailMessageHandler} from '../api/email-message.js';
const key='<test@demo.invalid>', date='2026-11-22T17:00:00.000Z';
const source=Buffer.from(`From: Origem <demo@example.invalid>\r\nTo: NIR <nir@example.invalid>\r\nSubject: Teste\r\nMessage-ID: ${key}\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="demo"\r\n\r\n--demo\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${Buffer.from('Solicitação completa\nSegunda linha').toString('base64')}\r\n--demo\r\nContent-Type: application/pdf\r\nContent-Disposition: attachment; filename="exame.pdf"\r\nContent-Transfer-Encoding: base64\r\n\r\nJVBERi0xLjQ=\r\n--demo--\r\n`);
function fixture({legacy=false,size=source.length,missing=false}={}){
  const calls=[];
  const client={usable:true,search:async()=>[7],fetchOne:async(uid,query,options)=>{
    calls.push({uid,query,options});
    if(missing)return false;
    return query.source ? {source} : {uid:7,size,envelope:{messageId:key},internalDate:date};
  },logout:async()=>calls.push('logout')};
  return {calls,deps:{getNotification:async()=>({event_key:key,received_at:date,...(!legacy && {imap_uid:7,imap_uid_validity:'8'})}),getIntegration:async()=>({password_ciphertext:'encrypted'}),decrypt:()=> 'fake',connect:async()=>({client,mailbox:{uidValidity:8n}})}};
}
test('decodifica texto e anexos sem persistir corpo e sempre fecha a conexão',async()=>{
  const f=fixture();const result=await readEmailContent(key,f.deps);
  assert.match(result.detail.text,/Solicitação completa\nSegunda linha/);
  assert.equal(result.detail.attachments[0].filename,'exame.pdf');
  assert.equal(result.attachments[0].content.toString(),'%PDF-1.4');
  assert.equal(result.detail.attachments[0].sha256.length,64);
  assert.equal(f.calls.at(-1),'logout');
  assert.equal(f.calls[0].options.uid,true);
});
test('resolve avisos anteriores por Message-ID',async()=>{
  const f=fixture({legacy:true});assert.equal((await readEmailContent(key,f.deps)).detail.subject,'Teste');
});
test('recusa corpo acima do limite antes de fazer download',async()=>{
  const f=fixture({size:MAX_MESSAGE_BYTES+1});await assert.rejects(readEmailContent(key,f.deps),e=>e.status===413);
  assert.equal(f.calls.length,2);
});
test('mensagem removida não retorna outra mensagem',async()=>{
  const f=fixture({missing:true});await assert.rejects(readEmailContent(key,f.deps),e=>e.status===404);assert.equal(f.calls.at(-1),'logout');
});
test('conteúdo ativo, imagens remotas, formulários e links são removidos',()=>{
  const html=safeEmailHtml('<p onclick="x()">Texto<strong>normal</strong></p><script>alert(1)</script><img src="https://tracker.invalid/a"><iframe src="https://bad.invalid"></iframe><a href="javascript:alert(1)">link</a><form action="https://bad.invalid"><input></form>');
  assert.match(html,/<strong>normal<\/strong>/);assert.doesNotMatch(html,/script|iframe|onclick|src=|href=|<form|<input|tracker/);
});
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v},end(body){this.body=body}};}
test('rota bloqueia requisição não autenticada antes de acessar e-mail',async()=>{
  let called=false;await createEmailMessageHandler({authorize:()=>false,read:async()=>{called=true}})({method:'GET'},response());assert.equal(called,false);
});
test('rota retorna metadados sem bytes de anexos e fragmenta download com hash',async()=>{
  const bytes=Buffer.alloc(CHUNK_BYTES+7,42),result={detail:{text:'teste',attachments:[{sha256:'hash'}]},attachments:[{content:bytes}]};
  const handler=createEmailMessageHandler({authorize:()=>true,read:async()=>result});
  const detail=response();await handler({method:'GET',url:'/?eventKey=x'},detail);assert.deepEqual(JSON.parse(detail.body),result.detail);
  const res=response();await handler({method:'GET',url:`/?eventKey=x&attachment=0&offset=${CHUNK_BYTES}&sha256=hash`},res);assert.equal(res.body.length,7);assert.equal(res.headers['Cache-Control'],'no-store, private');
  const changed=response();await handler({method:'GET',url:'/?eventKey=x&attachment=0&sha256=wrong'},changed);assert.equal(changed.statusCode,409);
  const invalid=response();await handler({method:'GET',url:'/?eventKey=x&attachment=-1'},invalid);assert.equal(invalid.statusCode,400);
});
