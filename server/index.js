require('dotenv').config()
const express = require('express')
const path = require('path')
const {v4: uuidv4} = require('uuid')
const crypto = require('crypto')
const db = require('./db')

const app = express()
app.use(express.json())

app.use(express.static(path.join(__dirname, '..', 'dist')))

app.post('/api/create', async (req, res)=>{
  const {ciphertext, nonce, salt, key_hash} = req.body
  if(!ciphertext||!nonce||!salt||!key_hash) return res.status(400).json({error:'missing'})
  const id = uuidv4()
  const retrieval_token = crypto.randomBytes(24).toString('base64url')
  const creator_token = crypto.randomBytes(24).toString('base64url')
  const expires_at = new Date(Date.now() + 24*3600*1000)
  try{
    await db.query(`INSERT INTO secrets(id,ciphertext,nonce,salt,key_hash,retrieval_token,creator_token,expires_at,created_at,read,revoked) VALUES($1,$2,$3,$4,$5,$6,$7,$8,now(),false,false)`,[id,ciphertext,nonce,salt,key_hash,retrieval_token,creator_token,expires_at])
    res.json({id,retrieval_token,creator_token})
  }catch(e){ console.error(e); res.status(500).json({error:'db'}) }
})

app.post('/api/fetch', async (req,res)=>{
  const {id, retrieval_token} = req.body
  if(!id||!retrieval_token) return res.status(400).json({error:'missing'})
  try{
    const q = await db.query('DELETE FROM secrets WHERE id=$1 AND retrieval_token=$2 AND revoked=false AND expires_at>now() RETURNING ciphertext,nonce,salt,key_hash',[id,retrieval_token])
    if(q.rowCount===0) return res.status(404).json({error:'not found'})
    return res.json(q.rows[0])
  }catch(e){ console.error(e); res.status(500).json({error:'db'}) }
})

app.post('/api/revoke', async (req,res)=>{
  const {creator_token} = req.body
  if(!creator_token) return res.status(400).json({error:'missing'})
  try{
    await db.query('DELETE FROM secrets WHERE creator_token=$1',[creator_token])
    res.json({ok:true})
  }catch(e){ console.error(e); res.status(500).json({error:'db'}) }
})

// SPA fallback
app.get('*', (req,res)=>{
  res.sendFile(path.join(__dirname,'..','dist','index.html'))
})

const port = process.env.PORT || 3000
app.listen(port, ()=>console.log('server listening', port))
