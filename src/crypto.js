// Minimal Web Crypto helpers: PBKDF2 -> AES-GCM
const enc = new TextEncoder()

function base64UrlEncode(buf){
  const b = btoa(String.fromCharCode(...new Uint8Array(buf)))
  return b.replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_')
}

function base64UrlDecode(str){
  // convert from base64url to base64
  let s = str.replace(/-/g,'+').replace(/_/g,'/')
  while(s.length % 4) s += '='
  const bin = atob(s)
  const arr = new Uint8Array(bin.length)
  for(let i=0;i<bin.length;i++) arr[i] = bin.charCodeAt(i)
  return arr.buffer
}

function toUint8Array(input){
  if(!input) return new Uint8Array()
  if(typeof input === 'string'){
    // assume base64url
    return new Uint8Array(base64UrlDecode(input))
  }
  if(input instanceof ArrayBuffer) return new Uint8Array(input)
  if(input instanceof Uint8Array) return input
  return new Uint8Array(input)
}
export async function deriveKeyFromPin(pin, salt){
  // `salt` may be Uint8Array, ArrayBuffer, or base64url string
  const saltArr = toUint8Array(salt)
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pin), {name:'PBKDF2'}, false, ['deriveBits','deriveKey'])
  const key = await crypto.subtle.deriveKey({name:'PBKDF2',salt:saltArr,iterations:200000,hash:'SHA-256'}, keyMaterial, {name:'AES-GCM',length:256}, true, ['encrypt','decrypt'])
  return key
}

export async function deriveRawKeyBytes(pin, salt){
  const key = await deriveKeyFromPin(pin, salt)
  return await crypto.subtle.exportKey('raw', key)
}

export async function encryptText(plain, pin, salt){
  // salt may be Uint8Array or base64url string; if not provided, generate one
  const saltArr = salt ? toUint8Array(salt) : crypto.getRandomValues(new Uint8Array(16))
  const key = await deriveKeyFromPin(pin, saltArr)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, enc.encode(plain))
  return {ciphertext: base64UrlEncode(ct), iv: base64UrlEncode(iv), salt: base64UrlEncode(saltArr)}
}

export async function decryptText(ciphertextBase64Url, keyOrDerivedKey, ivBase64Url){
  const ct = base64UrlDecode(ciphertextBase64Url)
  const iv = base64UrlDecode(ivBase64Url)
  // keyOrDerivedKey may be CryptoKey or raw ArrayBuffer
  let key = keyOrDerivedKey
  if(!(key instanceof CryptoKey)){
    key = await crypto.subtle.importKey('raw', keyOrDerivedKey, {name:'AES-GCM'}, false, ['decrypt'])
  }
  const pt = await crypto.subtle.decrypt({name:'AES-GCM', iv}, key, ct)
  return new TextDecoder().decode(pt)
}

export async function hashKey(keyOrRaw){
  // accepts CryptoKey or raw key bytes
  let raw
  if(keyOrRaw instanceof CryptoKey) raw = await crypto.subtle.exportKey('raw', keyOrRaw)
  else raw = keyOrRaw
  const digest = await crypto.subtle.digest('SHA-256', raw)
  return base64UrlEncode(digest)
}

export { base64UrlEncode as encodeBase64Url, base64UrlDecode as decodeBase64Url }

