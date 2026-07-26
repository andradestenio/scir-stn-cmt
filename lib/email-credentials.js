import crypto from "node:crypto";

function encryptionKey(){
  const sessionSecret = process.env.SESSION_SECRET;
  if(!sessionSecret || sessionSecret.length < 32){
    throw new Error("SESSION_SECRET não configurado ou muito curto.");
  }
  return crypto
    .createHash("sha256")
    .update(`scir-email-credentials:${sessionSecret}`)
    .digest();
}

export function encryptEmailPassword(password){
  if(!password) throw new Error("Senha do e-mail não informada.");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(password), "utf8"),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url")
  ].join(".");
}

export function decryptEmailPassword(payload){
  const [version, ivValue, tagValue, encryptedValue] = String(payload || "").split(".");
  if(version !== "v1" || !ivValue || !tagValue || !encryptedValue){
    throw new Error("Credencial de e-mail inválida.");
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivValue, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final()
  ]).toString("utf8");
}
