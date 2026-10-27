import {
  createHash,
  createHmac,
  scryptSync,
  timingSafeEqual
} from "node:crypto";
import {json} from "./http.js";

export const SESSION_COOKIE_NAME = "scir_session";
export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

function cleanEnvironmentValue(value){
  const cleaned = String(value || "").trim();
  if(cleaned.length >= 2 && ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'")))){
    return cleaned.slice(1,-1).trim();
  }
  return cleaned;
}

function configuredUsername(){
  return cleanEnvironmentValue(process.env.ADMIN_USERNAME);
}

function configuredSessionSecret(){
  return cleanEnvironmentValue(process.env.SESSION_SECRET);
}

function normalizeUsername(value){
  return String(value || "").trim().normalize("NFKC").toLocaleLowerCase("pt-BR");
}

function safeEqualText(left, right){
  const leftDigest = createHash("sha256").update(String(left)).digest();
  const rightDigest = createHash("sha256").update(String(right)).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

function verifyScryptPassword(password, encodedHash){
  const [algorithm,saltEncoded,hashEncoded] = String(encodedHash || "").split("$");
  if(algorithm !== "scrypt" || !saltEncoded || !hashEncoded) return false;
  try{
    const salt = Buffer.from(saltEncoded,"base64url");
    const expected = Buffer.from(hashEncoded,"base64url");
    if(!salt.length || expected.length < 32 || expected.length > 128) return false;
    const actual = scryptSync(String(password || ""),salt,expected.length);
    return timingSafeEqual(actual,expected);
  }catch{
    return false;
  }
}

export function authConfiguration(){
  const username = configuredUsername();
  const password = cleanEnvironmentValue(process.env.ADMIN_PASSWORD);
  const passwordHash = cleanEnvironmentValue(process.env.ADMIN_PASSWORD_HASH);
  const sessionSecret = configuredSessionSecret();
  const missing = [];
  if(!username) missing.push("ADMIN_USERNAME");
  if(!password && !passwordHash) missing.push("ADMIN_PASSWORD");
  if(sessionSecret.length < 32) missing.push("SESSION_SECRET");
  return {
    ready:missing.length === 0,
    missing,
    username,
    password,
    passwordHash,
    sessionSecret
  };
}

export function verifyCredentials(username, password){
  const config = authConfiguration();
  if(!config.ready) return {ok:false,configurationError:true};
  const usernameMatches = safeEqualText(normalizeUsername(username),normalizeUsername(config.username));
  const passwordMatches = config.passwordHash
    ? verifyScryptPassword(password,config.passwordHash)
    : safeEqualText(password,config.password);
  return {ok:Boolean(usernameMatches && passwordMatches),configurationError:false};
}

function sessionSigningKey(config){
  const credentialMaterial = config.passwordHash || config.password;
  const credentialVersion = createHash("sha256")
    .update(normalizeUsername(config.username))
    .update("\0")
    .update(credentialMaterial)
    .digest();
  return createHmac("sha256",config.sessionSecret)
    .update("scir-session-signing-v1")
    .update(credentialVersion)
    .digest();
}

function signPayload(encodedPayload, config){
  return createHmac("sha256",sessionSigningKey(config)).update(encodedPayload).digest("base64url");
}

export function createSessionToken(username, now=Date.now()){
  const config = authConfiguration();
  if(!config.ready) throw new Error(`Autenticação não configurada: ${config.missing.join(", ")}`);
  const issuedAt = Math.floor(now / 1000);
  const payload = Buffer.from(JSON.stringify({
    sub:config.username,
    iat:issuedAt,
    exp:issuedAt + SESSION_MAX_AGE_SECONDS
  })).toString("base64url");
  return `${payload}.${signPayload(payload,config)}`;
}

export function verifySessionToken(token, now=Date.now()){
  const config = authConfiguration();
  if(!config.ready) return null;
  const [payload,signature,...remainder] = String(token || "").split(".");
  if(!payload || !signature || remainder.length) return null;
  const expectedSignature = signPayload(payload,config);
  if(!safeEqualText(signature,expectedSignature)) return null;
  try{
    const session = JSON.parse(Buffer.from(payload,"base64url").toString("utf8"));
    const nowSeconds = Math.floor(now / 1000);
    if(session?.sub !== config.username || !Number.isInteger(session.iat) || !Number.isInteger(session.exp)) return null;
    if(session.iat > nowSeconds + 60 || session.exp <= nowSeconds || session.exp - session.iat > SESSION_MAX_AGE_SECONDS) return null;
    return {username:session.sub,issuedAt:session.iat,expiresAt:session.exp};
  }catch{
    return null;
  }
}

function parseCookies(header){
  return String(header || "").split(";").reduce((cookies,part) => {
    const separator = part.indexOf("=");
    if(separator < 1) return cookies;
    const name = part.slice(0,separator).trim();
    const value = part.slice(separator + 1).trim();
    if(name) cookies[name] = value;
    return cookies;
  },{});
}

export function sessionFromRequest(req){
  const cookieHeader = req?.headers?.cookie || req?.headers?.Cookie || "";
  return verifySessionToken(parseCookies(cookieHeader)[SESSION_COOKIE_NAME]);
}

function secureRequest(req){
  const forwardedProtocol = String(req?.headers?.["x-forwarded-proto"] || "").split(",")[0].trim();
  return forwardedProtocol === "https" || Boolean(process.env.VERCEL);
}

export function sessionCookie(req, token){
  const attributes = [
    `${SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    "HttpOnly",
    "SameSite=Strict"
  ];
  if(secureRequest(req)) attributes.push("Secure");
  return attributes.join("; ");
}

export function expiredSessionCookie(req){
  const attributes = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "HttpOnly",
    "SameSite=Strict"
  ];
  if(secureRequest(req)) attributes.push("Secure");
  return attributes.join("; ");
}

export function requireAuth(req, res){
  const config = authConfiguration();
  if(!config.ready){
    json(res,503,{
      error:"O acesso seguro ainda não foi configurado na Vercel.",
      code:"AUTH_NOT_CONFIGURED"
    });
    return null;
  }
  const session = sessionFromRequest(req);
  if(!session){
    json(res,401,{
      error:"Sua sessão expirou ou não foi autenticada.",
      code:"AUTH_REQUIRED"
    });
    return null;
  }
  return session;
}
