import test from "node:test";
import assert from "node:assert/strict";
import stateHandler from "../api/state.js";
import {createSessionToken, SESSION_COOKIE_NAME} from "../lib/auth.js";

test("salvamento e consulta preservam os SBARs e censos de plantões diferentes na mesma data", async () => {
  const names = ["ADMIN_USERNAME","ADMIN_PASSWORD","SESSION_SECRET","SUPABASE_URL","SUPABASE_SECRET_KEY"];
  const previous = Object.fromEntries(names.map(name => [name,process.env[name]]));
  const originalFetch = global.fetch;
  Object.assign(process.env, {
    ADMIN_USERNAME:"regulador-teste",
    ADMIN_PASSWORD:"senha-exclusiva-de-teste-sbar",
    SESSION_SECRET:"segredo-exclusivo-para-teste-sbar-123456789",
    SUPABASE_URL:"https://example.supabase.co",
    SUPABASE_SECRET_KEY:"sb_secret_ficticia_para_teste"
  });
  const originalState = {
    shift:{id:"atual",date:"2026-10-27"},
    sbar:{recommendation:"Informação atual diferente"},
    bedCensus:{observations:"Censo atual diferente"},
    history:["Manhã","Tarde"].map((type,index) => ({
      id:`arquivado-${index}`,
      shift:{date:"2026-10-26",type,status:"ENCERRADO"},
      sbar:{recommendation:`Recomendação ${type}`,richHtml:{recommendation:`<p><strong>${type}</strong></p>`}},
      records:[{id:`registro-${index}`,module:"yellow",status:`Pendência ${type}`}],
      emailSummary:{received:index + 1},
      sbarSnapshot:{schemaVersion:1,generatedAt:`2026-10-26T${index ? "23" : "17"}:00:00Z`,vacanciesFromCensus:true,bedCensus:{observations:`Censo ${type}`,infectologia:{masc2:index + 1}}}
    }))
  };
  let stored;
  global.fetch = async (url,options={}) => {
    assert.ok(String(url).startsWith("https://example.supabase.co/rest/v1/app_state"));
    if(options.method === "POST") stored = JSON.parse(options.body);
    return new Response(JSON.stringify(stored ? [stored] : []), {status:200});
  };
  const response = () => ({statusCode:0,body:"",setHeader(){},end(body){this.body=body;}});
  try{
    const headers={cookie:`${SESSION_COOKIE_NAME}=${createSessionToken(process.env.ADMIN_USERNAME)}`};
    const saved=response();
    await stateHandler({method:"PUT",headers,body:{state:originalState}},saved);
    assert.equal(saved.statusCode,200);
    const loaded=response();
    await stateHandler({method:"GET",headers},loaded);
    assert.equal(loaded.statusCode,200);
    const recovered=JSON.parse(loaded.body).state;
    assert.deepEqual(recovered,originalState);
    assert.equal(recovered.history.length,2);
    assert.notEqual(recovered.history[0].sbarSnapshot.bedCensus.observations,recovered.bedCensus.observations);
    assert.notEqual(recovered.history[0].sbarSnapshot.bedCensus.observations,recovered.history[1].sbarSnapshot.bedCensus.observations);
  }finally{
    global.fetch=originalFetch;
    names.forEach(name => previous[name] === undefined ? delete process.env[name] : process.env[name]=previous[name]);
  }
});
