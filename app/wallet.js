// SPDX-License-Identifier: GPL-3.0-or-later
// KasSigner test tool: glue between the page, the KasSigner SDK (MPL-2.0, sdk/),
// the kaspa-rest-server API, a public node's wRPC JSON port and the camera.
// The SDK and its wasm at the page's version, from this module's own address (see index.html).
const V = new URL(import.meta.url).search;
const K = await import('../sdk/kassigner_sdk.js' + V), init = K.default;

// NET is the name a node must give its network. The SDK itself takes no network: every address it
// writes is a mainnet one, KasSigner being mainnet only (2026-11-02).
export const NET = 'mainnet', GAP = 20, BATCH = 100, SPARE = 5, SLOT = 225;
// The most addresses a branch is searched to. A REST server answering "used" for every address made
// discovery run for ever, a request every 250 ms, started again by every auto-sync (audit of 2026-10-31).
export const MAX_INDEX = 10000;
let P = null, R = null;

export async function boot() {
  if (!P) {
    await init({ module_or_path: new URL('../sdk/kassigner_sdk_bg.wasm' + V, import.meta.url) });
    P = K.Profile.esp32s3();
  }
  return { version: K.version(), maxInputs: P.maxInputs };
}
export const errMsg = e => typeof e === 'string' ? e : (e && e.message) || String(e);

// Amounts are bigint sompi end to end; never through a float.
const U = 100000000n;
export function fmtKas(s, min = 2) {
  s = BigInt(s); const neg = s < 0n; if (neg) s = -s;
  const w = (s / U).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  let f = (s % U).toString().padStart(8, '0').replace(/0+$/, '');
  if (f.length < min) f = f.padEnd(min, '0');
  return (neg ? '-' : '') + w + (f ? '.' + f : '');
}
export function parseKas(t) {
  t = String(t).trim().replace(/,/g, '');
  if (!t || t === '.' || !/^\d*(\.\d{0,8})?$/.test(t)) throw new Error('Enter an amount in KAS, up to 8 decimals');
  const [w, f = ''] = t.split('.');
  return BigInt(w || '0') * U + BigInt(f.padEnd(8, '0'));
}
export const short = (a, n = 8) => a && a.length > 2 * n + 9 ? a.slice(0, n + 6) + '…' + a.slice(-n) : a;
export const toHex = b => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
export function fromHex(h) {
  h = h.replace(/\s+/g, '').replace(/^0x/i, '');
  if (!h || !/^([0-9a-f]{2})+$/i.test(h)) throw new Error('Not a hex payload');
  const o = new Uint8Array(h.length / 2);
  for (let i = 0; i < o.length; i++) o[i] = parseInt(h.substr(i * 2, 2), 16);
  return o;
}
const enc = new TextEncoder();
export const textBytes = t => enc.encode(t);

// What a unit handed over.
export function readImport(bytes) { const im = K.readImport(bytes); return { kind: im.kind, account: im.account, group: im.group, descriptor: im.descriptor }; }
export const checkAddress = a => K.scriptOfAddress(a);
// A signed message as a signer writes it, its signature checked over its text against its address's key:
// the SDK's check, the one a unit runs on a file from its card. Throws the SDK's reason when it does not hold.
export function verifyMessage(bytes) { const v = K.verifyMessage(bytes), r = v.record; return { text: r.text, address: r.address, signature: r.signature, key: v.key }; }

// kaspa-rest-server: one request at a time, 250 ms apart, backing off on 429. One base, api.kaspa.org's or
// yours: a failed request is tried once more.
const sleep = ms => new Promise(r => setTimeout(r, ms));
// A request given up because its sync or refresh was cancelled (Lock & forget, a wallet or card removed):
// final, so nothing tries it again.
const cancelled = () => Object.assign(new Error('Cancelled'), { final: true });
const big = t => t.replace(/"(amount|balance|previous_outpoint_amount|blockDaaScore)"\s*:\s*(\d+)/g, '"$1":"$2"');
export class Rest {
  constructor(base) { this.base = base.replace(/\/+$/, ''); this.q = Promise.resolve(); this.last = 0; }
  // o.pace: ms between requests (default 250). o.patient: a request that gets no response at all (often a
  // 429/5xx from the server's gateway without CORS headers, which the browser hides) waits 2, 4, 8 s and is tried again.
  // o.stop: once it is aborted, nothing more is sent: checked after every wait, before every try.
  async once(path, body, o = {}) {
    for (let a = 0, n = 0; ; a++) {
      const wait = this.last + (o.pace || 250) - Date.now(); if (wait > 0) await sleep(wait);
      if (o.stop && o.stop.aborted) throw cancelled();
      this.last = Date.now();
      const opt = { signal: AbortSignal.timeout(15000) };
      if (body !== undefined) Object.assign(opt, { method: 'POST', headers: { 'content-type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) });
      let r;
      try { r = await fetch(this.base + path, opt); }
      catch (e) { if (o.patient && n < 3) { await sleep(2000 * 2 ** n++); continue; } throw e; }
      if (r.status === 429 && a < 3) { await sleep(1000 * 2 ** a); continue; }
      const t = await r.text();
      if (!r.ok) {
        let m = t; try { const j = JSON.parse(t); m = j.detail ? (typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail)) : (j.error || t); } catch (_) {}
        const e = new Error('REST ' + r.status + ': ' + String(m).slice(0, 240)); e.final = r.status < 500 && r.status !== 429; throw e;
      }
      return JSON.parse(big(t));
    }
  }
  call(path, body, o) {
    const run = async () => {
      let err;
      for (let t = 0; t < 2; t++) { try { return await this.once(path, body, o); } catch (e) { err = e; if (e.final) throw e; } }
      throw err;
    };
    const p = this.q.then(run, run); this.q = p.catch(() => {}); return p;
  }
}

// Gap-limit discovery: every branch (receive and change; per cosigner in a 45' group) is checked
// until GAP unused follow its last used one, all branches sharing requests of up to BATCH addresses.
// `prev` (an earlier result) resumes after each branch's last used address; used stays used.
// Each branch keeps SPARE fresh addresses past its last used one, and stops at MAX_INDEX: a branch
// that reaches it without GAP unused addresses comes back `capped`.
// Addresses derived once are kept on the wallet, this session only: an auto-sync derived the same
// batch again every minute, about 50 ms on the page's thread each time.
export function addrOf(w, cos, chain, i) {
  const c = w.addrs || (w.addrs = new Map()), k = cos + ':' + chain + ':' + i;
  let a = c.get(k);
  if (a === undefined) { a = w.group ? w.group.address(cos, chain, i) : w.account.address(chain, i); c.set(k, a); }
  return a;
}
export async function discover(rest, w, onStep, prev, stop) {
  const cosigners = w.group ? w.group.total : 1, br = [];
  for (let cos = 0; cos < cosigners; cos++) for (const chain of [0, 1]) {
    const p = prev && prev.find(b => b.cosigner === cos && b.chain === chain), last = p ? p.last : -1;
    br.push({ cosigner: cos, chain, last, i: last + 1, list: p ? p.list.filter(a => a.index <= last) : [] });
  }
  const top = ch => Math.max(...br.filter(b => b.chain === ch).map(b => b.last));
  let checked = 0;
  for (;;) {
    const req = [];
    for (const b of br) while (b.i <= b.last + GAP && b.i < MAX_INDEX && req.length < BATCH) req.push({ b, index: b.i, address: addrOf(w, b.cosigner, b.chain, b.i++) });
    if (!req.length) break;
    if (stop && stop.aborted) throw cancelled();
    const res = await rest.call('/addresses/active', { addresses: req.map(r => r.address) }, { stop });
    if (stop && stop.aborted) throw cancelled();
    const act = new Set(res.filter(x => x.active).map(x => x.address));
    for (const r of req) { const used = act.has(r.address); if (used && r.index > r.b.last) r.b.last = r.index; r.b.list.push({ cosigner: r.b.cosigner, chain: r.b.chain, index: r.index, address: r.address, used }); }
    checked += req.length;
    if (onStep) onStep({ checked, recv: top(0), chg: top(1) });
  }
  return br.map(b => ({ cosigner: b.cosigner, chain: b.chain, last: b.last, next: b.last + 1, capped: b.last + GAP >= MAX_INDEX, list: b.list.sort((x, y) => x.index - y.index).slice(0, b.last + 1 + SPARE) }));
}

// Coins: from your own node when it keeps the UTXO index (no lookup leaves for a public server), REST otherwise.
const byAmount = l => l.sort((a, b) => a.amount < b.amount ? 1 : a.amount > b.amount ? -1 : 0);
// Mining rewards wait. A coin a coinbase made is spent only once the network's DAA score has passed its
// block's by rusty-kaspa's coinbase maturity, 1,000 on mainnet; until then it is left out of the coins, and
// so out of the balance and every send, as a node would refuse it once signed (2026-11-02). The rule is
// the SDK's (Coin.spendableAt). The score is asked only when a mining reward is there: from your node with
// the coins, from the REST API's blockdag info with theirs. A reward that came without its block's DAA
// score is left out too: nothing says it has matured.
const ripe = async (coins, now) => {
  if (!coins.some(c => c.cb)) return coins;
  const at = await now();
  return coins.filter(c => !c.cb || (c.daa != null && K.Coin.withEntry(c.txId, c.index, c.amount, c.daa, true).spendableAt(at) === true));
};
// UTXOs bound to a covenant, under the covenant hardfork, are left out of the coins, and so out of the
// balance, every send and every card claim: a plain send that spent one would end its covenant there, and
// the node refuses it (the SDK refuses such a coin too, Coin.boundTo). A node lists each UTXO's covenant id
// with it. The REST API's UTXO listing leaves it out (kaspa-rest-server's /addresses/utxos declares only
// amount, script, DAA score and coinbase); its transaction search has it, output by output, from its
// database: the UTXOs' own transactions are asked for, up to 1,000 a request. A UTXO it does not know yet,
// too new for its database, is taken as unbound until the next sync; a search that fails leaves the coins
// as they came.
const free = coins => coins.filter(c => !c.cov);
async function markBound(rest, coins, stop) {
  const ids = [...new Set(coins.filter(c => !c.cov).map(c => c.txId))];
  for (let j = 0; j < ids.length; j += 1000) {
    let page;
    try { page = await rest.call('/transactions/search?fields=transaction_id,outputs', { transactionIds: ids.slice(j, j + 1000) }, { stop }); }
    catch (e) { if (stop && stop.aborted) throw e; return; }
    if (stop && stop.aborted) throw cancelled();
    const bound = new Map();
    for (const t of Array.isArray(page) ? page : []) for (const o of (t && t.outputs) || []) if (o && o.covenant_id) bound.set(t.transaction_id + ':' + o.index, o.covenant_id);
    for (const c of coins) { const id = bound.get(c.txId + ':' + c.index); if (id) c.cov = id; }
  }
}
// A number of the REST API's blockdag info, `key`, as a bigint; `what` names it when it is missing.
const dagNumber = async (rest, key, what, stop) => {
  const v = (await rest.call('/info/blockdag', undefined, { stop }))[key];
  if (v == null || !/^\d+$/.test(String(v))) throw new Error('no ' + what + ' in the REST API\'s blockdag info');
  return BigInt(v);
};
const restDaa = (rest, stop) => dagNumber(rest, 'virtualDaaScore', 'DAA score', stop);
// The network's own clock, its past median time, in ms since 1970, UTC: the clock consensus holds a time
// lock to. A spend whose lock time is a time is final only once that clock is past it (rusty-kaspa 2.1.0,
// tx_validation_in_header_context.rs), and it trails the time of day by about two minutes.
export const networkTime = rest => dagNumber(rest, 'pastMedianTime', 'past median time');
// `stop`: once aborted, no more addresses are asked for.
export async function fetchUtxos(rest, addrMap, node, stop) {
  const addrs = [...addrMap.keys()], out = [];
  if (node && node.own && node.info.utxoIndex) {
    try {
      for (let j = 0; j < addrs.length; j += 500) {
        if (stop && stop.aborted) break;
        for (const u of await node.utxos(addrs.slice(j, j + 500))) {
          const a = u.address || K.addressOfScript(u.script), m = addrMap.get(a); if (!m) continue;
          out.push({ txId: u.transactionId, index: Number(u.index), amount: BigInt(u.amount), daa: BigInt(u.blockDaaScore), cb: !!u.isCoinbase, cov: u.covenantId || null, address: a, cosigner: m.cosigner || 0, chain: m.chain, addrIndex: m.index });
        }
      }
      if (stop && stop.aborted) throw cancelled();
      return { list: byAmount(await ripe(free(out), () => node.daaScore())), via: 'your node' };
    } catch (e) { if (stop && stop.aborted) throw e; out.length = 0; }
  }
  for (let j = 0; j < addrs.length; j += 100) {
    const res = await rest.call('/addresses/utxos', { addresses: addrs.slice(j, j + 100) }, { stop });
    for (const u of res) {
      const m = addrMap.get(u.address); if (!m) continue;
      const e = u.utxoEntry;
      out.push({ txId: u.outpoint.transactionId, index: Number(u.outpoint.index), amount: BigInt(e.amount), daa: e.blockDaaScore != null ? BigInt(e.blockDaaScore) : null, cb: !!e.isCoinbase, cov: e.covenantId || null, address: u.address, cosigner: m.cosigner || 0, chain: m.chain, addrIndex: m.index });
    }
  }
  await markBound(rest, out, stop);
  return { list: byAmount(await ripe(free(out), () => restDaa(rest, stop))), via: '' };
}



// ── Covenant cards (cov++, 2026-11-03) ────────────────────────────────────────
// A Time-Locked Savings card: UTXOs its owner claims from a minute on, UTC, or its recovery wallet recovers,
// if it has one (to the minute since 2026-11-04). The card is its program, the SDK's (K.Card); its backup is
// one line of text, savings_v1(...), shown as the codes a unit reads (textCodes). Held in memory only, as
// everything here.
export const cardOf = line => K.Card.fromBackup(line);
export const makeCard = (owner, recovery, day, month, year, hour, minute) => K.Card.savings(owner, recovery || undefined, day, month, year, hour, minute);
// Which of a single-key wallet's first `depth` receive keys is the card's: its index, and whether it recovers
// (the owner's key claims). A vault holds none: a card's keys are account 0's.
export function cardSigner(card, w, depth) {
  if (!w || w.group) return null;
  const s = card.signer(w.account, depth);
  return s ? { index: s.index, recovers: s.recovers } : null;
}
// Its UTXOs, read as a wallet's are: your node when it keeps the UTXO index, the REST API otherwise.
export const cardUtxos = (rest, card, node, stop) => fetchUtxos(rest, new Map([[card.address(), { chain: 0, index: 0 }]]), node, stop);

const svgUrl = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
export function requestCodes(bytes, fmt = 'kspt') {
  let c;
  try { c = K.codes(bytes, fmt, P); }
  catch (e) { throw /TooManyFrames/i.test(errMsg(e)) ? new Error('Too large for one ' + fmt.toUpperCase() + ' request on your device' + (fmt === 'pskb' ? '; use KSPT or fewer coins' : '; use fewer coins')) : e; }
  const urls = [];
  for (let i = 0; i < c.frames; i++) urls.push(svgUrl(c.svg(i, 8)));
  return urls;
}
export const textQr = text => svgUrl(K.codes(enc.encode(text), 'opaque', P).svg(0, 8));
// A text as every code a unit reads, by the units' rule: one bare code up to version 6, frames past it, at
// version 6 to 9, the smallest that takes five frames or fewer, then version 9 with more (2026-11-04); a
// card's backup line is two version-6 frames, with a recovery wallet or none.
export const textCodes = text => requestCodes(enc.encode(text), 'opaque');

export const newReader = () => new K.Reader(P, SLOT);
// Which cosigner a vault (kaspa:p…) address belongs to: the branch it sits on.
export function cosignerOf(group, address, depth = 200) {
  for (let i = 0; i < depth; i++) for (let c = 0; c < group.total; c++) for (const ch of [0, 1]) if (group.address(c, ch, i) === address) return c;
  return -1;
}

// Public nodes through the kaspa.stream resolvers, which list Borsh endpoints. Only a wss:// one is
// taken: the resolver is asked for TLS, and an answer naming anything else is not used.
const RESOLVERS = ['https://maxim.kaspa.stream', 'https://troy.kaspa.stream', 'https://sean.kaspa.stream'];
async function resolveNode() {
  for (const r of [...RESOLVERS].sort(() => Math.random() - 0.5)) {
    try {
      const res = await fetch(r + '/v2/kaspa/mainnet/tls/wrpc/borsh', { signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue; const d = await res.json();
      if (typeof d.url === 'string' && /^wss:\/\/\S+$/i.test(d.url)) return d.url;
    } catch (_) {}
  }
  throw new Error('No public node answered');
}
// wRPC, Borsh or JSON: the SDK's Node writes every request and reads every message.
// Your own node first (when given; 'auto' tries Borsh, then JSON), a public one otherwise or when
// yours fails, isn't on mainnet, is still syncing or speaks another RPC API version.
// A dropped connection comes back by itself: 2, 4, 8 … 60 s apart.
const ENC = { borsh: 'Borsh', json: 'JSON' };
export class Node {
  constructor(onState) { this.on = onState; this.ws = null; this.codec = null; this.info = null; this.id = 0; this.wait = new Map(); this.want = null; this.retry = 0; this.rt = 0; }
  get up() { return !!this.ws && this.ws.readyState === 1; }
  get own() { return !!(this.up && this.info && this.info.own); }
  connect(own, enc) { this.want = { own: own || '', enc: enc || 'auto' }; this.retry = 0; return this.open(); }
  async open() {
    clearTimeout(this.rt); this.drop();
    const want = this.want; if (!want) return;
    let ownErr = '';
    if (want.own) {
      this.on({ state: 'connecting', own: true });
      for (const e of want.enc === 'auto' ? ['borsh', 'json'] : [want.enc]) {
        try { const i = await this.dial(want.own, e); if (this.want !== want) return this.drop(); return this.ready({ ...i, own: true }); }
        catch (x) { ownErr = (want.enc === 'auto' ? ENC[e] + ': ' : '') + errMsg(x) + (ownErr ? ' · ' + ownErr : ''); }
        if (this.want !== want) return;
      }
    }
    this.on({ state: 'connecting', own: false, ownErr });
    try { const i = await this.dial(await resolveNode(), 'borsh'); if (this.want !== want) return this.drop(); this.ready({ ...i, own: false, ownErr }); }
    catch (e) { if (this.want !== want) return; this.on({ state: 'error', error: errMsg(e), ownErr }); this.later(); }
  }
  ready(info) { this.retry = 0; this.info = info; this.on({ state: 'on', ...info }); }
  later() { const s = Math.min(60, 2 * 2 ** this.retry++); clearTimeout(this.rt); this.rt = setTimeout(() => this.open(), s * 1000); }
  async dial(url, enc) {
    await this.sock(url, new K.Node(enc));
    try {
      const s = (await this.ask(id => this.codec.getServerInfo(id), 6000)).serverInfo;
      if (!s) throw new Error('no server info in its answer');
      if (s.rpcApiVersion !== 1) throw new Error('it speaks RPC API version ' + s.rpcApiVersion + ', not 1');
      if (s.network !== NET) throw new Error('it is on ' + s.network + ', not mainnet');
      if (!s.isSynced) throw new Error('it is still syncing');
      return { url, enc, version: s.serverVersion, synced: true, utxoIndex: s.hasUtxoIndex };
    } catch (e) {
      this.drop();
      const m = errMsg(e);
      throw /disconnected|timed out/i.test(m) ? new Error('no ' + ENC[enc] + ' answer (' + (/timed/.test(m) ? 'timed out' : 'connection closed') + '): wrong format or port?') : e;
    }
  }
  sock(url, codec) {
    return new Promise((ok, bad) => {
      let ws; try { ws = new WebSocket(url); } catch (e) { bad(e); return; }
      ws.binaryType = 'arraybuffer'; this.ws = ws; this.codec = codec; this.info = null;
      const fail = m => { clearTimeout(t); if (this.ws === ws) this.ws = null; bad(new Error(m)); ws.close(); };
      const t = setTimeout(() => fail('timed out'), 8000);
      ws.onopen = () => { clearTimeout(t); ok(); };
      ws.onerror = () => fail('connection failed (address, certificate or CSP)');
      ws.onmessage = ev => {
        let a; try { a = codec.read(ev.data); } catch (_) { return; }
        if (a.kind === 'notification' || a.id == null) return;
        const w = this.wait.get(a.id); if (!w) return; this.wait.delete(a.id);
        a.kind === 'error' ? w.bad(new Error(a.error || 'node error')) : w.ok(a);
      };
      ws.onclose = () => {
        for (const w of this.wait.values()) w.bad(new Error('Node disconnected')); this.wait.clear();
        if (this.ws !== ws) return; this.ws = null; this.info = null;
        if (this.want) { this.on({ state: 'connecting', own: !!this.want.own }); this.later(); } else this.on({ state: 'off' });
      };
    });
  }
  ask(make, ms = 15000) {
    if (!this.up) return Promise.reject(new Error('Not connected'));
    const id = ++this.id, msg = make(id);
    return new Promise((ok, bad) => {
      this.wait.set(id, { ok, bad }); this.ws.send(msg);
      setTimeout(() => { if (this.wait.delete(id)) bad(new Error('Node timed out')); }, ms);
    });
  }
  async utxos(addrs) { return (await this.ask(id => this.codec.getUtxosByAddresses(id, addrs), 30000)).utxos || []; }
  async daaScore() { const s = (await this.ask(id => this.codec.getServerInfo(id))).serverInfo; if (!s) throw new Error('no server info in its answer'); return s.virtualDaaScore; }
  drop() { if (this.ws) { const w = this.ws; this.ws = null; this.info = null; w.close(); } }
  close() { this.want = null; clearTimeout(this.rt); this.drop(); }
}


// Camera: the unit's own decoder first (two thresholds), jsQR after.
export function requestCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Promise.reject(new Error('The camera needs HTTPS (or localhost)'));
  return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
}
export async function camera(video, onCode, streamP) {
  const stream = await (streamP || requestCamera());
  video.muted = true; video.playsInline = true; video.srcObject = stream; await video.play().catch(() => {});
  const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
  let live = true, last = 0, flip = false;
  const loop = t => {
    if (!live) return; requestAnimationFrame(loop);
    if (t - last < 70 || video.readyState < 2 || !video.videoWidth) return; last = t;
    const s = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
    const w = Math.round(video.videoWidth * s), h = Math.round(video.videoHeight * s);
    cv.width = w; cv.height = h; cx.drawImage(video, 0, 0, w, h);
    const d = cx.getImageData(0, 0, w, h).data, g = new Uint8Array(w * h);
    for (let i = 0, j = 0; j < g.length; i += 4, j++) g[j] = (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8;
    let code; try { code = K.decodeQr(g, w, h, flip ? 3 : 8); } catch (_) {} flip = !flip;
    if (!code && globalThis.jsQR) { const r = globalThis.jsQR(d, w, h, { inversionAttempts: 'dontInvert' }); if (r && r.binaryData && r.binaryData.length) code = new Uint8Array(r.binaryData); }
    if (code) onCode(code);
  };
  requestAnimationFrame(loop);
  // The video is let go only while it still shows this stream: a later opening may have taken it.
  return () => { live = false; stream.getTracks().forEach(t => t.stop()); if (video.srcObject === stream) video.srcObject = null; };
}

// History, REST only (a node keeps no address history, and the REST API gives it one address at a
// time): each used address's transactions, newest first, a page of HPAGE at a time, merged by id.
// Shown as they arrive (2026-11-01: nothing showed until every address had answered once, near a
// minute on a wallet with eighty): first the transactions behind the wallet's coins, all in one
// request by id; then the addresses, newest first. A transaction older than the oldest one read on an
// address read but not to its end waits for Load more, so no gap shows among the addresses read; one
// on an address not read yet takes its place by date when it arrives.
export const HPAGE = 25;
export function newHistory(addrMap, used) {
  // Newest first: each branch from its highest address down, the branches in turn, since a send uses
  // the next change address and a payment in the next receive one.
  const br = new Map();
  for (const a of used) { const m = addrMap.get(a), k = (m.cosigner || 0) + ':' + m.chain; if (!br.has(k)) br.set(k, []); br.get(k).push([m.index, a]); }
  const lists = [...br.values()].map(l => l.sort((x, y) => y[0] - x[0]).map(x => x[1])), order = [];
  for (let i = 0; lists.some(l => i < l.length); i++) for (const l of lists) if (i < l.length) order.push(l[i]);
  return { addrMap, cur: new Map(order.map(a => [a, { before: 0, done: false, read: false }])), txs: new Map() };
}
const histFloor = h => { let f = 0; for (const c of h.cur.values()) if (c.read && !c.done && !c.failed) f = Math.max(f, c.before); return f; };
export const histFailed = h => [...h.cur.values()].filter(c => c.failed).length;
export const histMore = h => [...h.cur.values()].some(c => !c.done);
export const histRead = h => { let read = 0; for (const c of h.cur.values()) if (c.read) read++; return { read, total: h.cur.size }; };
export const historyList = h => { const f = histFloor(h); return [...h.txs.values()].filter(t => t.time >= f).sort((a, b) => b.time - a.time); };
// The transactions that made the wallet's coins, by id, up to the 1,000 the REST API takes in one search.
export async function historyFirst(rest, h, ids, stop) {
  const list = [...new Set(ids)].slice(0, 1000); if (!list.length) return;
  const page = await rest.call('/transactions/search?resolve_previous_outpoints=light', { transactionIds: list }, { pace: 500, patient: true, stop });
  if (stop && stop.aborted) return;
  for (const t of Array.isArray(page) ? page : []) if (t && t.transaction_id) h.txs.set(t.transaction_id, readTx(t, h.addrMap));
}
export async function historyPage(rest, h, stop, onStep) {
  // An address that cannot be read is skipped (c.failed) so the rest still show; the next call tries it again.
  for (const c of h.cur.values()) c.failed = false;
  const f = histFloor(h);
  for (const [a, c] of h.cur) {
    if (c.done || (c.before && c.before < f)) continue;
    if (stop && stop.aborted) throw cancelled();
    let page;
    try { page = await rest.call('/addresses/' + encodeURIComponent(a) + '/full-transactions-page?limit=' + HPAGE + '&resolve_previous_outpoints=light' + (c.before ? '&before=' + c.before : ''), undefined, { pace: 500, patient: true, stop }); }
    catch (e) { if (stop && stop.aborted) throw e; c.failed = true; if (onStep) onStep(); continue; }
    const list = Array.isArray(page) ? page : [];
    for (const t of list) h.txs.set(t.transaction_id, readTx(t, h.addrMap));
    const times = list.map(t => t.block_time).filter(Boolean);
    c.read = true; c.done = list.length < HPAGE || !times.length; if (times.length) c.before = Math.min(...times);
    if (onStep) onStep();
  }
}
function readTx(t, map) {
  let inMine = 0n, outMine = 0n, inAll = 0n, outAll = 0n, known = true;
  const ins = (t.inputs || []).map(i => {
    const v = i.previous_outpoint_amount != null ? BigInt(i.previous_outpoint_amount) : null, a = i.previous_outpoint_address || '', m = map.get(a) || null;
    if (v == null) known = false; else { inAll += v; if (m) inMine += v; }
    return { amount: v, mine: m, addr: m ? a : '' };
  });
  const outs = (t.outputs || []).map(o => {
    const v = BigInt(o.amount), a = o.script_public_key_address || '', m = map.get(a) || null;
    outAll += v; if (m) outMine += v;
    return { amount: v, mine: m, addr: m ? a : '' };
  });
  const kind = inMine === 0n ? 'in' : outs.every(o => o.mine) ? 'self' : 'out';
  return { id: t.transaction_id, time: t.block_time || Date.now(), accepted: !!t.is_accepted, net: outMine - inMine, fee: known && ins.length ? inAll - outAll : null, kind, ins, outs };
}
