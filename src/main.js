import { deriveKeyFromPin, encryptText, decryptText, hashKey } from './crypto.js'

const byId = (id)=>document.getElementById(id)

byId('create').addEventListener('click', async ()=>{
  const secret = byId('secret').value
  const pin = byId('pin').value
  if(!secret || !pin){ alert('enter both'); return }
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const {ciphertext, iv} = await encryptText(secret, pin, salt)
  const key = await deriveKeyFromPin(pin, salt)
  const keyHash = await hashKey(key)

  const body = {
    ciphertext,
    nonce: iv,
    salt: arrayBufferToBase64(salt),
    key_hash: arrayBufferToBase64(keyHash)
  }

  const res = await fetch('/api/create', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)})
  const json = await res.json()
  byId('createResult').textContent = JSON.stringify(json, null, 2)
})

byId('fetch').addEventListener('click', async ()=>{
  const id = byId('rid').value
  const rtoken = byId('rtoken').value
  const pin = byId('rpin').value
  if(!id||!rtoken||!pin){ alert('enter id, token, pin'); return }
  const res = await fetch('/api/fetch', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id, retrieval_token: rtoken})})
  if(res.status!==200){ byId('fetchResult').textContent = 'Not found or already read'; return }
  const row = await res.json()
  const salt = base64ToArrayBuffer(row.salt)
  const key = await deriveKeyFromPin(pin, salt)
  const keyHash = await hashKey(key)
  if(arrayBufferToBase64(keyHash) !== row.key_hash){ byId('fetchResult').textContent = 'Invalid PIN'; return }
  const plain = await decryptText(row.ciphertext, key, row.nonce)
  byId('fetchResult').textContent = plain
})

function arrayBufferToBase64(buf){
  return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/=/g,'')
}
function base64ToArrayBuffer(str){
  // pad
  while(str.length%4) str+='='
  const bin = atob(str)
  const arr = new Uint8Array(bin.length)
  for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i)
  return arr.buffer
}
