import {json,readJson} from "../../lib/http.js";
import {
  authConfiguration,
  createSessionToken,
  sessionCookie,
  verifyCredentials
} from "../../lib/auth.js";

const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const failedAttempts = new Map();

function clientKey(req){
  const forwarded = String(req?.headers?.["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req?.socket?.remoteAddress || "unknown";
}

function currentAttempt(key, now=Date.now()){
  const attempt = failedAttempts.get(key);
  if(!attempt || now - attempt.startedAt >= ATTEMPT_WINDOW_MS){
    failedAttempts.delete(key);
    return null;
  }
  return attempt;
}

function recordFailure(key, now=Date.now()){
  const attempt = currentAttempt(key,now) || {count:0,startedAt:now};
  attempt.count += 1;
  failedAttempts.set(key,attempt);
  return attempt;
}

export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method !== "POST") return json(res,405,{error:"Método não permitido."});

  const config = authConfiguration();
  if(!config.ready){
    return json(res,503,{
      error:"O acesso seguro ainda não foi configurado na Vercel.",
      code:"AUTH_NOT_CONFIGURED"
    });
  }

  const key = clientKey(req);
  const attempt = currentAttempt(key);
  if(attempt?.count >= MAX_FAILED_ATTEMPTS){
    res.setHeader("Retry-After",String(Math.ceil((ATTEMPT_WINDOW_MS - (Date.now() - attempt.startedAt)) / 1000)));
    return json(res,429,{
      error:"Muitas tentativas. Aguarde alguns minutos e tente novamente.",
      code:"AUTH_RATE_LIMITED"
    });
  }

  try{
    const body = await readJson(req);
    const username = String(body.username || "").slice(0,160);
    const password = String(body.password || "").slice(0,512);
    const verification = verifyCredentials(username,password);
    if(!verification.ok){
      recordFailure(key);
      return json(res,401,{
        error:"Usuário ou senha inválidos.",
        code:"AUTH_INVALID_CREDENTIALS"
      });
    }
    failedAttempts.delete(key);
    const token = createSessionToken(config.username);
    res.setHeader("Set-Cookie",sessionCookie(req,token));
    return json(res,200,{ok:true,user:{username:config.username}});
  }catch(error){
    console.error("Falha ao autenticar no SCIR:",error?.message || error);
    return json(res,400,{error:"Não foi possível processar o acesso."});
  }
}
