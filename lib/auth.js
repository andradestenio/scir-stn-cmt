import crypto from "node:crypto";

const COOKIE_NAME = "scir_session";
const MAX_AGE = 60 * 60 * 12;

function secret(){
  if(!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32){
    throw new Error("SESSION_SECRET não configurado ou muito curto.");
  }
  return process.env.SESSION_SECRET;
}

function sign(payload){
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a, b){
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function credentialsAreValid(username, password){
  return safeEqual(username, process.env.ADMIN_USERNAME || "") &&
    safeEqual(password, process.env.ADMIN_PASSWORD || "");
}

export function createSessionCookie(){
  const payload = Buffer.from(JSON.stringify({exp:Date.now() + MAX_AGE * 1000})).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`;
}

export function clearSessionCookie(){
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function isAuthenticated(req){
  const cookies = Object.fromEntries(String(req.headers.cookie || "").split(";").map(v => v.trim().split("=")).filter(v => v.length === 2));
  const [payload, signature] = String(cookies[COOKIE_NAME] || "").split(".");
  if(!payload || !signature || !safeEqual(signature, sign(payload))) return false;
  try { return JSON.parse(Buffer.from(payload, "base64url").toString()).exp > Date.now(); }
  catch { return false; }
}
