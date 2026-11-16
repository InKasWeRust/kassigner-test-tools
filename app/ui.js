// SPDX-License-Identifier: GPL-3.0-or-later
// KasSigner test tool — screens and state for index.html. No framework: state → HTML strings,
// one delegated click handler (data-act), inputs bound by data-bind without re-rendering.
// Never inside another site's frame: a page that shows this one within its own could put its words
// and buttons around it. GitHub Pages cannot send the header that forbids framing, so the page
// refuses here: framed, it hides itself and loads nothing more (2026-11-16).
if (window.top !== window.self) {
  document.documentElement.style.display = 'none';
  throw new Error('KasSigner: this page does not run inside a frame');
}
// The page's version, from this module's own address (index.html sets it), carried to what it loads.
const W = await import('./wallet.js' + new URL(import.meta.url).search);
// Two copies are made of this site. The full one is this source as it is. The one kassigner.org serves is
// written from it by make-hosted.sh, which leaves out everything between `// #full` and `// #end`, every
// part that builds, checks or sends a transaction, switches on what sits in `/* #hosted` … `#end */`, and
// sets HOSTED to true. HOSTED itself only picks words: no code hides behind it.
const HOSTED = false;
// What a card's pages say, on the hosted copy, where the full one builds a deposit or a claim.
const NO_DEPOSIT = '<div class="warn"><i class="ph ph-warning-circle"></i><span>kassigner.org builds no transaction. Fund the card by sending KAS to this address from any wallet. Whatever is sent is locked until the card opens.</span></div>';
const NO_CLAIM = '<div class="warn"><i class="ph ph-warning-circle"></i><span>Claiming is not available on kassigner.org, which builds no transaction. Claim this card with the full tool, run by yourself, or with any wallet that speaks SilverScript: its backup holds what they need.</span></div>';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hostOf = u => { try { return new URL(u).host; } catch (_) { return u || ''; } };
const fk = (x, min) => W.fmtKas(x, min), sh = (a, n) => W.short(a, n);

const SECS = [
  { id: 'wallet', label: 'Wallet', icon: 'ph-wallet', subs: [['Overview', 'ph-squares-four'], ['Receive', 'ph-arrow-down-left'], ['Change addresses', 'ph-arrows-left-right'], ['UTXOs', 'ph-coins'], ['History', 'ph-clock-counter-clockwise']] },
// #full
  { id: 'send', label: 'Send', icon: 'ph-paper-plane-tilt', subs: [['Compose', 'ph-pencil-simple'], ['Sign on your signer', 'ph-qr-code'], ['Return signature', 'ph-camera'], ['Broadcast', 'ph-broadcast']] },
  { id: 'broadcast', label: 'Broadcast', icon: 'ph-broadcast', subs: [['Signed transaction', 'ph-seal-check'], ['Merge copies', 'ph-git-merge']] },
// #end
  { id: 'vaults', label: 'Multisig vaults', icon: 'ph-vault', subs: [['All vaults', 'ph-list'], ['Add vault', 'ph-plus']] },
  { id: 'covenants', label: 'Covenants', icon: 'ph-scroll', subs: [['Time-Locked Savings', 'ph-hourglass-medium']] },
  { id: 'messages', label: 'Check a message', icon: 'ph-seal-check', subs: [['Signed message', 'ph-shield-check']] },
  { id: 'settings', label: 'Settings', icon: 'ph-gear-six', subs: [['Network & node', 'ph-globe-simple'], ['QR bridge', 'ph-qr-code'], ['Session', 'ph-lock-simple']] },
];
const SCAN = { kpub: 'Scan account or vault QR', desc: 'Scan vault descriptor', myaddr: 'Scan one of your vault addresses', dest: 'Scan destination address', sig: 'Scan signed transaction', signed: 'Scan signed transaction', cardBackup: 'Scan a card’s backup', cardOwner: 'Scan the owner’s address', cardRecovery: 'Scan the recovery wallet’s address', cardTo: 'Scan the destination address', message: 'Scan a signed message' };
const IMPORT_MSG = { cosigner: 'That is a single cosigner key. To watch a vault, import its descriptor (multi_hd45…).', kcc3Address: "That is a script address (kaspa:p…), not a descriptor or a kpub. Scan the vault's descriptor first; a vault address goes in 'One of your vault addresses'.", signedMessage: 'That is a signed message: check it under Check a message, in the side menu.' };
const SPEEDS = [['Slower', 1.5], ['Default', 1], ['Faster', 0.7]], SIZES = ['S', 'M', 'L'], FEES = [['low', 'Low'], ['normal', 'Normal'], ['priority', 'Priority'], ['custom', 'Custom']];
// #full
const FMTS = [['kspt', 'KSPT', 'compact'], ['pskb', 'PSKB', 'Kaspa standard']], FMTN = { kspt: 'KSPT', pskb: 'PSKB' };
const fmtSeg = () => `<div class="field"><span class="flabel">Format</span>${seg(FMTS.map(([k, l, s]) => ({ on: S.fmt === k, arg: k, html: `<span>${l}<small>${s}</small></span>` })), 'fmt')}<div class="hint">KSPT is your signer’s compact format: fewer QR frames. PSKB is the Kaspa standard bundle any rusty-kaspa wallet reads: more frames. Same transaction either way.</div></div>`;
// #end
// Frame speed, milliseconds a frame: the slider under every QR in frames, and Settings' presets of the
// page's default, 550 ms, one value for both, this session only (Kaspian, 2026-11-01: the SDK's 400 ms was
// faster than units read at).
const MS_MIN = 200, MS_MAX = 1400, MS_STEP = 50, MS_DEFAULT = 550;
const atMs = ms => Math.min(MS_MAX, Math.max(MS_MIN, Math.round(ms / MS_STEP) * MS_STEP));
const presetMs = i => atMs(MS_DEFAULT * SPEEDS[i][1]);
const isPskb = b => b.length > 4 && String.fromCharCode(b[0], b[1], b[2], b[3]).toUpperCase() === 'PSKB';
const EXPLORERS = [{ label: 'Kaspa Stream', icon: 'assets/kaspa-stream.png', url: 'https://kaspa.stream/transactions/{txid}' }, { label: 'Kaspa Explorer', icon: 'assets/kaspa-icon.png', url: 'https://explorer.kaspa.org/txs/{txid}' }, { label: 'Custom', icon: '', url: '' }];
// What earlier versions kept in the browser, an account and the settings: deleted at every load.
// Nothing is written in its place; the page keeps nothing between visits (Kaspian, 2026-11-01).
const OLD_LS = 'kassigner.v1', API = 'https://api.kaspa.org';

// Covenants › Time-Locked Savings: the screen on show, the card open and its page (cPane: its backup, or
// funding it once open; cUtx: its UTXOs shown), and the forms' fields. A new card
// (NC0): the step on show and its fields.
const NC0 = { nStep: 0, cOwner: '', cRecovery: '', cNoRec: false, cDay: '', cMonth: '', cYear: '', cHour: '', cMinute: '', cErr: '' };
const CARD0 = { cardView: 'list', cardSel: null, ...NC0, cLine: '', cLineErr: '', cTo: '', cFee: 'normal', cPane: null, cUtx: false, cBuildErr: '' };
const S = {
  boot: 'loading', bootErr: '', sdkVer: '', gated: true, sec: 'wallet', sub: 0, railOpen: false,
  kpubText: '', importErr: '', sync: 'idle', syncMsg: '', syncErr: '', syncAt: 0, recv: [], chg: [], utxos: [], balance: 0n, nextRecv: 0, nextChg: 0, recvIdx: 0,
  to: '', amt: '', max: false, fee: 'normal', fees: null, cc: false, sel: null, buildErr: '', reqInfo: null, frames: [], frame: 0, batch: 0, playing: true, ms: MS_DEFAULT, size: 1,
  scanner: null, scanMsg: '', scanPct: 0, scanDots: null, scanErr: '', sigHex: '', sigErr: '', check: null, sending: false, sent: null, sendErr: '',
  api: API, apiDraft: '', apiOwn: '', nodeOwn: '', nodeDraft: '', nodeEnc: 'auto', node: { state: 'off' }, toast: '', explorer: 0, explorerCustom: '', explorerDraft: '',
  consMode: 'small', consFee: 'low', consNext: false, fmt: 'kspt', feeCustom: '',
  book: null, descText: '', descErr: '', myAddr: '', descNote: '', edit: null, editText: '', part: null, qrMode: 'request',
  bc: null, bcErr: '', bcText: '', bcSent: null, bcSending: false, bcSendErr: '', bcFrames: [],
  msg: null, msgErr: '', msgText: '',
  ...CARD0,
};
// Wallets: single-key wallets (44'), then the vaults (45'), this session only.
// `acct` is the active one; its synced data lives in S while active, in w.data otherwise.
const WF = ['recv', 'chg', 'utxos', 'balance', 'nextRecv', 'nextChg', 'recvIdx', 'sync', 'syncAt', 'syncErr', 'syncMsg', 'sel', 'branches', 'disc', 'via', 'capped'];
const blank = () => ({ recv: [], chg: [], utxos: [], balance: 0n, nextRecv: 0, nextChg: 0, recvIdx: 0, sync: 'idle', syncAt: 0, syncErr: '', syncMsg: '', sel: null, branches: [], disc: null, via: '', capped: false });
const SEND0 = { reqInfo: null, frames: [], check: null, sent: null, sendErr: '', sigErr: '', sigHex: '', part: null, qrMode: 'request', buildErr: '' };
// Broadcast: a transaction signed already, held in memory only (bcBytes, merged so far).
const BC0 = { bc: null, bcErr: '', bcText: '', bcSent: null, bcSending: false, bcSendErr: '', bcFrames: [] };
let bcBytes = null, bcReader = null;
// Check a message: the signed message read last, its parts as the SDK gave them once its signature held.
const MSG0 = { msg: null, msgErr: '', msgText: '' };
// The address KasSigner's releases are signed with, the one `kassigner.kas` names: shown on that page, and
// a checked message says so when this address signed it (docs/INSTALL.md in the KasSigner repository).
const RELEASE = 'kaspa:qqz0xdq9tu92hgraa89rcmae23f8h09zzzsy4f4agvasmsw3958cza0mv7x86';
// The release record: one covenant, held by the release address, carrying the newest release's
// SHA256SUMS hash; its coin moves at every release, its id never. Stated here; the chain is the proof.
const RECORD = { id: '2d4fea63b2b8c755d41afd8bd7b1f549918657de963ec4d98bf86cdca15495cb', genesis: 'ed53be58951a387ba9762720d06dcbdbe353a2800a5f1adf62d401a8aec10b1b',
  version: 'v1.1.0', hash: '89ec8288456eda1782443097106121fbfd79526ef1643ee84ead6004e269b986', address: 'kaspa:pz0d73whvfmzufxe63lf0x88grva4j6cc5d2xarz5clg09uezqjjzelz240j4' };
// Time-Locked Savings cards, this session only, as vaults are (cov++, 2026-11-03), and `fresh`, a new card
// made at its steps' Opens at, before Keep puts it among them; `cardSeq` numbers their default names.
let cards = [], fresh = null, cardSeq = 0;
// The refreshes a broadcast sets for later, 4 s and 30 s on: Lock & forget clears them, so none runs for
// what it forgot, or for a wallet imported after it.
const later = new Set();
const after = (f, ms) => { const t = setTimeout(() => { later.delete(t); f(); }, ms); later.add(t); };
let wallets = [], merged = null, reqFrames = [], impReader = null;
// The wallet a consolidation's "Next round" was asked for: built for it alone, on its own next sync; a
// switch, a removal or Lock & forget drops it.
let consFor = null;
let acct = null, reqBytes = null, reqFmt = 'kspt', reqText = '', reader = null, rest = null, node = null, stopCam = null, syncing = false;
let lastView = '', lastHtml = '', qrFor = '', qrUrl = '', toastT = 0, raf = 0, tickT = 0, scanGen = 0;

const set = p => { Object.assign(S, p); if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); };
// Own REST and node URLs stay in memory only; a reload or Lock & forget goes back to the public ones.
// Your REST API alone when you set one: a failure stops the sync and says so, and api.kaspa.org gets your
// addresses only when you choose it (useApi), never on its own.
const mkRest = () => new W.Rest(S.apiOwn || API);
const useApi = u => { S.apiOwn = u; rest = mkRest(); set({ apiOwn: u, apiDraft: u, api: rest.base }); say(u ? 'Using your REST API' : 'Using api.kaspa.org'); sync(); };
const say = m => { clearTimeout(toastT); set({ toast: m }); toastT = setTimeout(() => set({ toast: '' }), 1800); };
const copy = (t, m) => navigator.clipboard.writeText(t).then(() => say(m || 'Copied'), () => say('Copy failed'));
const can = i => i === 0 || (i < 3 ? !!S.reqInfo : !!S.check);
// The rail starts open wherever the window has room for it beside the page, 760 px, where the layout
// stops laying it over the page; narrower, it starts closed (Kaspian, 2026-11-01: it was open only from
// 1200). It follows the window as it is resized until it is opened or closed by hand, this session.
const RAIL_ROOM = 760, railRoom = () => innerWidth >= RAIL_ROOM;
let railByHand = false;
const goto = (id, i) => { if (id === 'send' && !can(i)) return; set({ sec: id, sub: i, railOpen: railRoom() ? S.railOpen : false }); };
const addrAt = (chain, i) => W.addrOf(acct, acct.me || 0, chain, i);
const branchNext = (br, me, chain) => (br.find(b => b.cosigner === me && b.chain === chain) || { next: 0 }).next;
const dataOf = w => w === acct ? S : w.data;
// Names and address labels: memory only, gone on reload, Lock & forget or removal.
const labelOf = a => (acct && acct.labels && acct.labels.get(a)) || '';
const pen = (act, arg, title) => `<button class="btn btn-ghost btn-icon pen" data-act="${act}" data-arg="${esc(arg)}" title="${title}"><i class="ph ph-pencil-simple"></i></button>`;
const editor = ph => `<span class="edit"><label for="f-edit" class="sr">${esc(ph)}</label><input id="f-edit" class="input" data-bind="editText" value="${esc(S.editText)}" placeholder="${esc(ph)}" maxlength="40" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><button class="btn btn-primary btn-icon" data-act="saveEdit" title="Save"><i class="ph ph-check"></i></button><button class="btn btn-ghost btn-icon" data-act="cancelEdit" title="Cancel"><i class="ph ph-x"></i></button></span>`;
// A rename holds the wallet or card itself (`ref`), not its place in the list, which another's removal moves.
const isEdit = (k, id) => S.edit && S.edit.k === k && (S.edit.ref ? S.edit.ref === (k === 'w' ? wallets : cards)[id] : S.edit.id === id);
function nameHtml(w, i) { return isEdit('w', i) ? editor(w.auto) : `<span class="wname"><b>${esc(w.name)}</b>${pen('editName', i, 'Rename')}</span>`; }
function addrCell(a, n) {
  if (isEdit('a', a)) return editor('Label for this address');
  const l = labelOf(a);
  return `<button class="alab" data-act="editLabel" data-arg="${esc(a)}" title="${l ? 'Edit label' : 'Add a label'}"><span class="mono">${esc(sh(a, n))}</span>${l ? `<span class="tag tag-neutral">${esc(l)}</span>` : ''}<i class="ph ph-pencil-simple"></i></button>`;
}
function saveEdit() {
  const e = S.edit; if (!e) return; const v = S.editText.trim().slice(0, 40);
  if (e.k === 'w') { const w = e.ref; if (wallets.includes(w)) w.name = v || w.auto; }
  else if (e.k === 'c') { const c = e.ref; if (cards.includes(c)) c.name = v || c.auto; }
  else if (acct && acct.labels) { v ? acct.labels.set(e.id, v) : acct.labels.delete(e.id); }
  set({ edit: null, editText: '' });
}
const startEdit = (k, id, cur, ref) => { set({ edit: { k, id, ref }, editText: cur }); setTimeout(() => { const f = $('f-edit'); if (f) { f.focus(); f.select(); } }, 30); };
const balLine = w => { const D = dataOf(w); return D.sync === 'done' ? fk(D.balance) + ' KAS' : D.sync === 'running' ? 'syncing…' : D.sync === 'error' ? 'not synced' : '—'; };
const exTpl = () => S.explorer === 2 ? S.explorerCustom : EXPLORERS[S.explorer].url;
// #full
// A fee level's rate in sompi a gram, or null when the estimate gave none; a build without one uses the
// minimum, and the screen says so once a sync has finished without one.
// Custom is a rate typed like the other levels', for whoever wants to be taken first whatever it costs
// (Kaspian, 2026-11-01): a whole number of sompi a gram, never below the lowest rate the network is
// taking now, the estimate's lowest level, which rises with congestion; without an estimate, never
// below the minimum relay rate every node keeps (W.MIN_RATE). The fee is that rate times the transaction's weight, so the screen
// shows what both come to for the transaction on it. A build refuses anything below.
const lowest = () => { const r = ['low', 'normal', 'priority'].map(k => rateAt(k)).filter(x => x != null); return r.length ? Math.min(...r) : null; };
const customMin = () => lowest() ?? W.MIN_RATE;
const customRate = () => { const t = S.feeCustom.trim(); return /^\d{1,9}$/.test(t) && Number(t) >= customMin() ? Number(t) : null; };
const rateAt = k => k === 'custom' ? customRate() : S.fees && S.fees[k] != null ? Math.ceil(S.fees[k]) : null;
const rateUsed = k => {
  if (k !== 'custom') return rateAt(k) ?? W.MIN_RATE;
  const r = customRate();
  if (r == null) throw new Error('Enter a custom fee rate: a whole number of sompi a gram, at least ' + customMin().toLocaleString('en-US') + (lowest() != null ? ', the lowest rate the network is taking now.' : ', the lowest rate nodes relay.'));
  return r;
};
// The coins a send or a consolidation would spend, as the buttons choose them.
const sendCoins = () => S.sel && S.sel.size ? S.utxos.filter(u => S.sel.has(u.txId + ':' + u.index)) : S.utxos;
const consCoins = () => S.consMode === 'sel' && S.sel && S.sel.size ? S.utxos.filter(u => S.sel.has(u.txId + ':' + u.index)) : [...S.utxos].sort((a, b) => a.amount < b.amount ? -1 : a.amount > b.amount ? 1 : 0);
// #end
// What a rate comes to for the transaction on screen, in sompi: the build the button makes, thrown
// away. Null while the screen does not hold one yet, or holds one that would not build.
const previews = new Map();
// #full
function feeAt(act, rate) {
  if (act !== 'cFee' && (!acct || !S.utxos.length)) return null;
  const ca = act === 'cFee' ? cardAt() : null;
  const key = [act, rate, S.to, S.amt, S.max, S.fmt, S.nextChg, S.consMode, S.sel ? [...S.sel].sort().join(',') : '', S.utxos.map(u => u.txId + ':' + u.index).join(','), ca ? ca.address + ':' + claimTo() + ':' + ca.utxos.map(u => u.txId + ':' + u.index).join(',') : ''].join('|');
  if (previews.has(key)) return previews.get(key);
  let fee = null;
  try {
    if (act === 'fee') {
      const to = S.to.trim(), amount = S.max ? 0n : W.parseKas(S.amt);
      if (to && (S.max || amount > 0n)) fee = W.build({ w: acct, coins: sendCoins(), to, amount, max: S.max, feerate: rate, changeIndex: S.nextChg, fmt: S.fmt, own: ownRecv(to) }).req.fee;
    } else if (act === 'cFee') {
      const to = claimTo();
      if (ca && to && ca.utxos.length) fee = W.claimCard({ card: ca.card, coins: ca.utxos, to, feerate: rate, fmt: S.fmt, signer: ca.signer, w: acct, own: ownRecv(to) }).req.fee;
    } else fee = W.consolidate({ w: acct, coins: consCoins(), feerate: rate, changeIndex: S.nextChg, fmt: S.fmt }).req.fee;
  } catch (_) {}
  if (previews.size > 32) previews.clear();
  previews.set(key, fee); return fee;
}
function customHint(act) {
  const min = customMin(), est = lowest() != null, mine = customRate(), typed = S.feeCustom.trim(), fMin = feeAt(act, min), fMine = mine != null ? feeAt(act, mine) : null;
  const r = n => n.toLocaleString('en-US') + ' sompi/gram', kas = f => fk(f, 0) + ' KAS';
  const lines = [(est ? 'Minimum now: ' + r(min) + ', the lowest rate the network is taking' : 'Minimum: ' + r(min) + ', the lowest rate nodes relay (no fee estimate)') + (fMin != null ? ' · ' + kas(fMin) + ' for this transaction' : '') + '.'];
  if (mine != null) lines.push('Your rate: ' + r(mine) + (fMine != null ? ' · ' + kas(fMine) + ' for this transaction' : '') + '.');
  else if (typed) lines.push('Your rate: below the minimum, or not a whole number. It won’t build.');
  if (rateAt('priority') != null) lines.push('Priority now: ' + r(rateAt('priority')) + '. A higher rate is taken first and costs more.');
  if (fMin == null && act === 'fee') lines.push('Fill in the destination and amount to see the fee in KAS.');
  return `<div class="hint">${lines.map(esc).join('<br>')}</div>`;
}
const feeSeg = (cur, act) => `<div class="field"><span class="flabel">Fee</span>${seg(FEES.map(([k, l]) => ({ on: cur === k, arg: k, html: `<span>${l}<small>${rateAt(k) != null ? rateAt(k).toLocaleString('en-US') + ' sompi/g' : k === 'custom' ? 'your rate' : '—'}</small></span>` })), act)}${cur === 'custom'
  ? `<div class="row"><label for="f-rate-${act}" class="sr">Custom fee rate, in sompi a gram</label><input id="f-rate-${act}" class="input mono rate" inputmode="numeric" maxlength="9" data-bind="feeCustom" value="${esc(S.feeCustom)}" placeholder="${customMin()}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><span class="small muted">sompi/gram</span></div>${customHint(act)}`
  : rateAt(cur) == null && acct && (S.sync === 'done' || S.sync === 'error') ? `<div class="hint">No fee estimate${S.fees ? ' for this level' : ''}: the minimum rate, ${W.MIN_RATE} sompi/gram, is used, and the transaction may take longer to confirm.</div>` : ''}</div>`;
const pickFee = (key, k) => { set({ [key]: k, buildErr: '' }); if (k === 'custom') setTimeout(() => { const f = $('f-rate-' + key); if (f) f.focus(); }, 30); };
// #end
const txLink = id => { const t = exTpl(); return !t ? '' : t.includes('{txid}') ? t.split('{txid}').join(id) : t.replace(/\/?$/, '/') + id; };
const recordBox = () => { const url = txLink(RECORD.genesis), row = (label, value, act) => `<div class="recrow"><span class="lab">${label}</span><div class="row"><span class="mono break">${value}</span><button class="btn btn-ghost" data-act="recCopy" data-arg="${act}"><i class="ph ph-copy"></i>Copy</button></div></div>`;
  return `<div class="box relbox"><div class="hint">And recorded on chain, in a covenant held by <b>kassigner.kas</b></div>
${row('Covenant id', esc(RECORD.id), 'id')}${row('Latest release · ' + RECORD.version, esc(RECORD.hash), 'hash')}
<div class="recrow"><span class="lab">The record sits at</span><div class="row">${kad(RECORD.address)}<button class="btn btn-ghost" data-act="recCopy" data-arg="address"><i class="ph ph-copy"></i>Copy</button></div></div>
<div class="hint">The hash is the SHA-256 of the release’s SHA256SUMS. This page only states these values: the proof is on the chain, where the coin at that address carries this covenant id.${url ? ` <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">See where it began<i class="ph ph-arrow-up-right"></i></a>` : ''}</div></div>`; };

// ── wallet flow ─────────────────────────────────────────────────────────────
function clearSend() { reqBytes = null; reqFmt = 'kspt'; reqText = ''; reader = null; merged = null; reqFrames = []; }
// #full
// The format is fixed per transaction from here to broadcast.
function takeReq(req, fmt) { reqBytes = req.bytes; reqFmt = fmt; reqText = fmt === 'pskb' ? req.text : ''; reader = W.newReader(); reqFrames = W.requestCodes(req.bytes, fmt); }
// #end
function activate(w) {
  if (acct) for (const k of WF) acct.data[k] = S[k];
  clearSend(); acct = w; consFor = null;
  set({ ...SEND0, ...(w ? w.data : blank()), consNext: false, edit: null, histOpen: null, editText: '', gated: false, sec: 'wallet', sub: 0, to: '', amt: '', max: false });
  if (w && w.data.sync === 'idle') sync(w);
}
// Adds (or re-opens) what an import holds; returns an error message, or '' when it took.
function addWallet(im, hex, me) {
  // Several single-key wallets, each kpub its own, named Wallet, Wallet 2… until renamed, after the ones
  // already there and before the vaults; the same account again (its first address) opens the one there
  // (Kaspian, 2026-11-07).
  if (im.kind === 'account') {
    const w = { kind: 'account', name: '', auto: '', account: im.account, hex, labels: new Map(), data: blank() };
    const first = W.addrOf(w, 0, 0, 0), dup = wallets.find(x => x.kind === 'account' && W.addrOf(x, 0, 0, 0) === first);
    if (dup === acct) { set({ gated: false }); say('Wallet already open'); return ''; }
    if (dup) { activate(dup); say('Wallet already added'); return ''; }
    let name = 'Wallet', n = 2, at = 0; while (wallets.some(x => x.name === name)) name = 'Wallet ' + n++;
    w.name = w.auto = name; wallets.forEach((x, i) => { if (x.kind === 'account') at = i + 1; });
    wallets.splice(at, 0, w); activate(w); return '';
  }
  if (im.kind === 'descriptor' && im.group) {
    if (im.group.total > 5) return 'Vaults have at most 5 cosigners (Cosigner 0 to 4). This descriptor has ' + im.group.total + '.';
    const d = im.descriptor || im.group.descriptor(), dup = wallets.find(w => w.desc === d && w.me === me);
    if (dup === acct) { set({ gated: false }); say('Vault already open'); return ''; }
    if (dup) { activate(dup); say('Vault already added'); return ''; }
    const g = im.group, base = g.required + '-of-' + g.total + ' Vault · Cosigner ' + me;
    let name = base, n = 2; while (wallets.some(w => w.name === name)) name = base + ' (' + n++ + ')';
    const w = { kind: 'vault', name, auto: name, group: g, desc: d, me, labels: new Map(), data: blank() }; wallets.push(w); activate(w); return '';
  }
  return IMPORT_MSG[im.kind] || 'Unsupported import';
}
function stageDesc(im) {
  const g = im.group;
  if (g.total > 5) return 'Vaults have at most 5 cosigners (Cosigner 0 to 4). This descriptor has ' + g.total + '.';
  set({ gated: false, sec: 'vaults', sub: 1, descText: im.descriptor || g.descriptor(), descErr: '', myAddr: '',
    descNote: 'Descriptor loaded (' + g.required + '-of-' + g.total + '). Scan one of your vault addresses from your signer (or paste it) to set which cosigner you are.' });
  setTimeout(() => { const f = $('f-my'); if (f) f.focus(); }, 60);
  return '';
}
function useImport(im, hex) {
  const e = im.kind === 'descriptor' && im.group ? stageDesc(im) : addWallet(im, hex);
  if (e) { set({ importErr: e }); return; }
  $('kpubText').value = ''; set({ importErr: '', kpubText: '' });
}
function importDesc() {
  const t = S.descText.trim(); if (!t) { set({ descErr: 'Paste a descriptor, or scan it' }); return; }
  try {
    const im = W.readImport(W.textBytes(t));
    if (im.kind !== 'descriptor') { set({ descErr: im.kind === 'account' ? 'That is an account kpub: scan it with Add wallet, in the side menu.' : IMPORT_MSG[im.kind] || 'Not a vault descriptor' }); return; }
    let me;
    const a = S.myAddr.trim().replace(/\?.*$/, '');
    if (!a) { set({ descErr: 'Scan one of your vault addresses from your signer.' }); return; }
    {
      if (!/^kaspa:p/i.test(a)) { set({ descErr: 'Use one of this vault’s addresses, kaspa:p…' }); return; }
      me = W.cosignerOf(im.group, a); if (me < 0) { set({ descErr: 'That address isn’t one of this vault’s (checked the first 200 receive and change addresses of each cosigner).' }); return; }
    }
    const err = addWallet(im, undefined, me); if (err) { set({ descErr: err }); return; }
    set({ descText: '', descErr: '', myAddr: '', descNote: '' });
  } catch (e) { set({ descErr: W.errMsg(e) }); }
}
function removeWallet(i) {
  const w = wallets[i]; if (!w) return; wallets.splice(i, 1);
  if (w.abort) w.abort.aborted = true; if (w.hist) w.hist.stop.aborted = true; if (w === consFor) { consFor = null; S.consNext = false; }
  if (w === acct) { acct = null; activate(wallets[0] || null); set({ sec: 'vaults', sub: 0 }); } else set({});
  say(w.name + ' removed');
}
// Pasting is for the first wallet only; any after it is scanned, Add wallet (Kaspian, 2026-11-07).
function importPaste() {
  const t = S.kpubText.trim();
  if (!t) { if (acct) set({ gated: false, importErr: '' }); else activate(null); return; }
  if (wallets.length) { set({ importErr: 'Add more wallets by scanning them: Add wallet, in the side menu.' }); return; }
  try { const b = W.textBytes(t); useImport(W.readImport(b), W.toHex(b)); } catch (e) { set({ importErr: W.errMsg(e) }); }
}
// A sync uses the REST API it started with for every step, the history it starts included, and stops at
// once when cancelled (Lock & forget, the wallet removed): after every wait, nothing more is sent.
async function sync(w = acct, auto = false) {
  if (!w || w.syncing) return; w.syncing = true; w.lastTry = Date.now(); const stop = w.abort = { aborted: false }, r = rest;
  const upd = p => { Object.assign(w.data, p); if (w === acct) set(p); };
  const lu = n => n < 0 ? 'none' : '#' + n;
  const live = () => { if (stop.aborted) throw new Error('Cancelled'); };
  upd({ sync: 'running', syncErr: '', syncMsg: 'Discovering addresses…' });
  try {
    const d = await W.discover(r, w, p => upd({ syncMsg: 'Checked ' + p.checked + ' addresses · last used: receive ' + lu(p.recv) + ', change ' + lu(p.chg) }), dataOf(w).disc, stop);
    live();
    const map = new Map(); for (const b of d) for (const a of b.list) map.set(a.address, { cosigner: b.cosigner, chain: b.chain, index: a.index });
    upd({ syncMsg: 'Reading coins…' });
    const { list: utxos, via } = await W.fetchUtxos(r, map, node, stop);
    live();
// #full
    const fees = await W.feeRates(r, node, stop).catch(() => null);
    live();
// #end
    const per = new Map(); utxos.forEach(u => per.set(u.address, (per.get(u.address) || 0n) + u.amount));
    const deco = l => l.map(a => ({ ...a, bal: per.get(a.address) || 0n }));
    const keep = new Set(utxos.map(u => u.txId + ':' + u.index)), D = dataOf(w), me = w.me || 0;
    const sig = l => l.map(u => u.txId + ':' + u.index).sort().join(','), lastUsed = x => (x || []).map(b => b.last).join(',');
    const same = sig(D.utxos) === sig(utxos) && lastUsed(D.disc) === lastUsed(d);
    const branches = d.map(b => ({ cosigner: b.cosigner, chain: b.chain, next: b.next })), r0 = branchNext(branches, me, 0);
    upd({ sync: 'done', syncAt: Date.now(), via, branches, disc: d, capped: d.some(b => b.capped), recv: deco(d.filter(b => !b.chain).flatMap(b => b.list)), chg: deco(d.filter(b => b.chain).flatMap(b => b.list)), utxos, balance: utxos.reduce((s, u) => s + u.amount, 0n), nextRecv: r0, nextChg: Math.max(D.nextChg, branchNext(branches, me, 1)), recvIdx: Math.max(D.recvIdx, r0), sel: D.sel ? new Set([...D.sel].filter(k => keep.has(k))) : null });
// #full
    if (fees) set({ fees });
// #end
    w.autoFail = 0;
    // An automatic round re-reads history only when coins or used addresses changed.
    if (!auto || !same || !w.hist) loadHist(w, true, r);
// #full
    if (w === acct && S.consNext && consFor === w) buildCons();
// #end
  } catch (e) { if (auto) w.autoFail = (w.autoFail || 0) + 1; if (w === consFor) { consFor = null; S.consNext = false; } upd({ sync: 'error', syncErr: stop.aborted ? 'Sync cancelled.' : 'Sync failed: ' + W.errMsg(e) }); }
  w.syncing = false; if (w.abort === stop) w.abort = null;
}
// History: memory only, read again after every sync, gone on reload, Lock & forget or removal.
// `r`: the REST API a new history reads from, the sync's; its later pages read from the same one.
async function loadHist(w, reset, r = rest) {
  if (!w) return; const D = dataOf(w); if (D.sync !== 'done' || !D.disc) return;
  if (reset || !w.hist) {
    if (w.hist) w.hist.stop.aborted = true;
    const map = new Map(), used = [];
    for (const b of D.disc) for (const a of b.list) { map.set(a.address, { cosigner: b.cosigner, chain: b.chain, index: a.index }); if (a.used) used.push(a.address); }
    w.hist = { h: W.newHistory(map, used), loading: false, err: '', stop: { aborted: false }, rest: r };
  }
  const H = w.hist; if (H.loading) return; H.loading = true; H.err = ''; set({});
  // The coins' transactions first, in one request; a failure there leaves them to the addresses.
  if (!H.first) { H.first = true; try { await W.historyFirst(H.rest, H.h, D.utxos.map(u => u.txId), H.stop); } catch (_) {} set({}); }
  try { await W.historyPage(H.rest, H.h, H.stop, () => set({})); const n = W.histFailed(H.h); if (n) H.err = 'History incomplete: ' + n + (n === 1 ? ' address' : ' addresses') + ' couldn’t be read from the REST API.'; }
  catch (e) { if (!H.stop.aborted) H.err = 'History: ' + W.errMsg(e); }
  H.loading = false; set({});
}
const KIND = { in: ['Received', 'ph-arrow-down-left'], out: ['Sent', 'ph-paper-plane-tilt'], self: ['Self', 'ph-arrows-left-right'] };
const when = t => new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
const signed = n => (n > 0n ? '+' : n < 0n ? '−' : '') + fk(n < 0n ? -n : n);
const side = x => x.mine ? 'yours · ' + (x.mine.chain ? 'change' : 'receive') + ' address #' + x.mine.index + ' on your device' + (labelOf(x.addr) ? ' · ' + labelOf(x.addr) : '') : 'external';
function histTable(list, empty, open) {
  const body = list.length ? list.map(t => {
    const [k, ic] = KIND[t.kind], url = txLink(t.id);
    let r = `<tr data-act="histOpen" data-arg="${esc(t.id)}"><td><span class="row"><i class="ph ${ic}"></i>${k}</span></td><td>${t.accepted ? esc(when(t.time)) : '<span class="tag tag-neutral">Pending</span>'}</td><td class="mono">${esc(sh(t.id, 6))}</td><td class="r mono">${esc(signed(t.net))}</td></tr>`;
    if (open && S.histOpen === t.id) r += `<tr><td colspan="4"><div class="stack">
<div class="row"><span class="mono break">${esc(t.id)}</span><button class="btn btn-ghost btn-icon" data-act="copyTx" data-arg="${esc(t.id)}" title="Copy transaction ID"><i class="ph ph-copy"></i></button>${url ? `<a class="btn btn-ghost" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><i class="ph ph-arrow-square-out"></i>Explorer</a>` : ''}</div>
<table class="table"><tbody>${rows([['When', t.accepted ? when(t.time) : 'Pending'], ['Net', signed(t.net) + ' KAS']].concat(t.kind !== 'in' && t.fee != null ? [['Fee', fk(t.fee) + ' KAS']] : []))}</tbody></table>
<table class="table"><thead><tr><th>Inputs</th><th class="r">KAS</th></tr></thead><tbody>${t.ins.map(x => `<tr><td class="${x.mine ? '' : 'dim'}">${esc(side(x))}</td><td class="r mono">${x.amount == null ? '—' : esc(fk(x.amount))}</td></tr>`).join('')}</tbody></table>
<table class="table"><thead><tr><th>Outputs</th><th class="r">KAS</th></tr></thead><tbody>${t.outs.map(x => `<tr><td class="${x.mine ? '' : 'dim'}">${esc(side(x))}</td><td class="r mono">${esc(fk(x.amount))}</td></tr>`).join('')}</tbody></table></div></td></tr>`;
    return r;
  }).join('') : `<tr class="empty-row"><td colspan="4">${esc(empty)}</td></tr>`;
  return `<table class="table hist"><thead><tr><th>Type</th><th>Date</th><th>Transaction</th><th class="r">KAS</th></tr></thead><tbody>${body}</tbody></table>`;
}
// While the addresses are first read: how far, under the list growing above it.
const histNote = H => { if (!H || !H.loading) return ''; const p = W.histRead(H.h); return p.read < p.total ? `<div class="hint">Reading history… ${p.read} of ${p.total} addresses.</div>` : ''; };
const histEmpty = H => !acct || S.sync !== 'done' ? emptyMsg() : !H || H.loading ? 'Reading history…' : H.err ? 'No transactions to show yet.' : 'No transactions yet.';
// #full
function buildTx() {
  try {
    const to = S.to.trim(); if (!to) throw new Error('Enter a destination address');
    try { W.checkAddress(to); } catch (_) { throw new Error('That is not a valid Kaspa address'); }
    const amount = S.max ? 0n : W.parseKas(S.amt); if (!S.max && amount <= 0n) throw new Error('Enter an amount above zero');
    const coins = sendCoins();
    const fmt = S.fmt, rate = rateUsed(S.fee), { req, used } = W.build({ w: acct, coins, to, amount, max: S.max, feerate: rate, changeIndex: S.nextChg, fmt, own: ownRecv(to) });
    clearSend(); takeReq(req, fmt);
    const sentAmt = S.max ? used.reduce((a, c) => a + c.amount, 0n) - req.fee : amount;
    // Change: what the coins hold beyond amount and fee (the build may not report it for every format).
    const left = used.reduce((a, c) => a + c.amount, 0n) - sentAmt - req.fee, change = S.max ? null : req.change != null ? req.change : left > 0n ? left : null;
    const changeTo = change != null ? addrAt(1, S.nextChg) : '';
    const outs = [{ address: to, value: sentAmt }].concat(changeTo ? [{ address: changeTo, value: change }] : []);
    set({ ...SEND0, reqInfo: { to, amount: sentAmt, fee: req.fee, change, changeTo, changeIdx: S.nextChg, inputs: used.length, fmt, outs, rate, custom: S.fee === 'custom', spends: used.map(c => c.txId + ':' + c.index) }, frames: reqFrames, frame: 0, batch: 0, playing: true, sub: 1, part: acct.group ? { present: 0, required: acct.group.required } : null });
  } catch (e) { set({ buildErr: W.errMsg(e) }); }
}
// One consolidation round: smallest coins first, or the coin-control selection.
function buildCons() {
  try {
    const sel = S.consMode === 'sel' && S.sel && S.sel.size;
    const coins = consCoins();
    const fmt = S.fmt, rate = rateUsed(S.consFee), { req, used, to } = W.consolidate({ w: acct, coins, feerate: rate, changeIndex: S.nextChg, fmt });
    clearSend(); takeReq(req, fmt); consFor = null;
    const total = used.reduce((a, c) => a + c.amount, 0n), before = S.utxos.length;
    set({ ...SEND0, consNext: false, reqInfo: { to, amount: total - req.fee, fee: req.fee, change: null, changeTo: to, changeIdx: S.nextChg, inputs: used.length, fmt, outs: [{ address: to, value: total - req.fee }], rate, custom: S.consFee === 'custom', spends: used.map(c => c.txId + ':' + c.index), cons: { index: S.nextChg, before, after: before - used.length + 1, small: !sel, warn: req.fee * 100n > total } }, frames: reqFrames, frame: 0, batch: 0, playing: true, sec: 'send', sub: 1, part: acct.group ? { present: 0, required: acct.group.required } : null });
  } catch (e) { consFor = null; set({ consNext: false, buildErr: W.errMsg(e) }); say(W.errMsg(e)); }
}
function takeReply(reply) {
  const got = isPskb(reply) ? 'pskb' : 'kspt';
  if (got !== reqFmt) { set({ sigErr: 'This reply is ' + FMTN[got] + '; this transaction was sent as ' + FMTN[reqFmt] + '. Scan the reply to this request.' }); return; }
  const outs = S.reqInfo && S.reqInfo.outs;
  // A card's claim is a single key's, whichever wallet is open.
  if (!acct || !acct.group || (S.reqInfo && S.reqInfo.card)) {
    try {
      const check = W.checkReply(reqFmt, reqBytes, reply, outs);
      if (!check.complete) { set({ sigErr: 'The reply carries ' + check.signatures + ' signature(s) but is not complete yet.' }); return; }
      set({ check, sigErr: '', sub: 3, sent: null, sendErr: '' });
    } catch (e) { set({ sigErr: 'Signature check failed: ' + W.errMsg(e) }); }
    return;
  }
  // Vault: merge each cosigner's reply into what came before. A reply passed along
  // cosigner to cosigner already carries the earlier signatures; it then stands alone.
  try {
    const had = merged ? W.progress(reqFmt, reqBytes, merged).present : 0, mine = W.progress(reqFmt, reqBytes, reply);
    let next = reply;
    if (merged) { try { next = W.mergeReplies(reqFmt, reqBytes, [merged, reply]); } catch (e) { if (mine.present < had) throw e; } }
    const pr = W.progress(reqFmt, reqBytes, next);
    if (merged && pr.present <= had) { set({ sigErr: 'No new signature in that reply. This cosigner has already signed.' }); return; }
    merged = next;
    if (pr.complete) { set({ check: W.checkReply(reqFmt, reqBytes, merged, outs), part: { present: pr.present, required: pr.required }, sigErr: '', sigHex: '', sub: 3, sent: null, sendErr: '' }); return; }
    set({ part: { present: pr.present, required: pr.required }, sigErr: '', sigHex: '' });
    say('Signature added · ' + pr.present + ' of ' + pr.required);
  } catch (e) { set({ sigErr: 'Signature check failed: ' + W.errMsg(e) }); }
}
async function doBroadcast() {
  const fin = S.check && S.check.fin; if (!fin || S.sending) return;
  const again = !!S.sent;
  set({ sending: true, sendErr: '' });
  // A change output used its address: the next transaction takes the next one, even before the re-sync
  // sees it. Once: broadcasting the same transaction again uses no new address.
  try {
    const r = await W.broadcast(fin, rest, node), bump = !again && S.reqInfo && (S.reqInfo.change != null || S.reqInfo.cons);
    set({ sending: false, sent: { ...r, at: Date.now() }, nextChg: bump ? S.nextChg + 1 : S.nextChg }); after(sync, 4000); after(sync, 30000);
    const c = S.reqInfo && S.reqInfo.card && S.reqInfo.card.c; if (c) { after(() => cardSync(c), 4000); after(() => cardSync(c), 30000); }
  } catch (e) { set({ sending: false, sendErr: 'Broadcast failed: ' + W.errMsg(e) }); }
}
// Sent, and a sync at least 25 s later still holds a coin the transaction spends: whatever answered
// "accepted", the network has not taken it. Offered again then, and only then.
function unseen() {
  const s = S.sent, ri = S.reqInfo, sp = ri && ri.spends;
  // A card's claim is seen on the card's own UTXOs, read again after the broadcast.
  const src = ri && ri.card ? ri.card.c : S;
  if (!s || !sp || src.sync !== 'done' || src.syncAt < s.at + 25000) return false;
  const have = new Set(src.utxos.map(u => u.txId + ':' + u.index));
  return sp.some(k => have.has(k));
}
// Edit, Done and New transaction go back to where the transaction was set up: a consolidation to
// Wallet › UTXOs, its coins, fee and format as they were; a send to Send › Compose (Kaspian,
// 2026-11-01: a consolidation's Edit opened Compose).
function restart() { const cons = !!(S.reqInfo && S.reqInfo.cons), card = !!(S.reqInfo && S.reqInfo.card); clearSend(); set({ ...SEND0, ...(cons ? { sec: 'wallet', sub: 3 } : card ? { sec: 'covenants', sub: 0, cardView: 'card', cPane: null } : { sub: 0 }) }); }
// #end
function lock() {
  closeScan(); for (const w of wallets) { if (w.abort) w.abort.aborted = true; if (w.hist) w.hist.stop.aborted = true; } acct = null; wallets = []; clearSend(); bcBytes = null;
  for (const t of later) clearTimeout(t); later.clear(); for (const c of cards) if (c.stop) c.stop.aborted = true; cards = []; fresh = null; cardSeq = 0;
  netClock = null; netTried = -Infinity; netFailed = false; lastStates = '';
  consFor = null; previews.clear(); qrFor = ''; qrUrl = ''; impReader = null; bcReader = null;
  lastHtml = ''; lastView = ''; $('view').innerHTML = '';
  railByHand = false;
  set({ ...SEND0, ...BC0, ...MSG0, ...CARD0, ...blank(), fmt: 'kspt', gated: true, railOpen: railRoom(), book: null, descText: '', descErr: '', sec: 'wallet', sub: 0, to: '', amt: '', max: false, api: API, apiDraft: '', apiOwn: '', nodeOwn: '', nodeDraft: '', nodeEnc: 'auto', ms: MS_DEFAULT, size: 1, explorer: 0, explorerCustom: '', explorerDraft: '',
    fee: 'normal', feeCustom: '', fees: null, cc: false, consMode: 'small', consFee: 'low', consNext: false, edit: null, editText: '', histOpen: null, myAddr: '', descNote: '' });
  rest = mkRest(); if (S.node.state !== 'on' || S.node.own) node.connect('');
  /* #hosted
  showWarn();
  #end */
}

// ── check a message ─────────────────────────────────────────────────────────
// A signed message as a signer's Sign Message writes it: the text, the address and the signature between
// their markers. Scanned from the unit's MESSAGE QR, opened as the file it saved, or pasted; checked by
// the SDK as a unit checks one from its card, in this page alone. It says the address signed the text,
// not whose the address is. Held in memory only; Lock & forget, or leaving the page, forgets it
// (Kaspian, 2026-11-13).
const MSG_BEGIN = '-----BEGIN KASPA SIGNED MESSAGE-----', MSG_FILE_MAX = 65536;
const isRecord = b => new TextDecoder().decode(b.subarray(0, MSG_BEGIN.length + 2)).trimStart().startsWith(MSG_BEGIN);
function msgMsg(e) {
  const m = W.errMsg(e);
  if (/NotARecord/.test(m)) return 'Not a signed message: it holds the text, the address and the signature between their markers, as a signer writes them.';
  if (/NotAKeyAddress/.test(m)) return 'Its address carries no key a message signature is checked against: a script address (kaspa:p…) or an ECDSA one.';
  if (/NotMainnet/.test(m)) return 'Its address is not a mainnet one.';
  if (/Fails/.test(m)) return 'The signature does not check out: this address did not sign this text, or one of them was changed after signing.';
  return 'It could not be checked: ' + m;
}
function msgTake(bytes) {
  try { set({ ...MSG0, msg: W.verifyMessage(bytes) }); } catch (e) { set({ msg: null, msgErr: msgMsg(e) }); }
}
function msgPasted() {
  const t = S.msgText.trim(); if (!t) { set({ msgErr: 'Paste a signed message, scan it, or open its file.' }); return; }
  msgTake(W.textBytes(t));
}
// The file a signer saved to its card, its bytes as they are. The browser's own file picker, opened from
// the click; nothing is uploaded.
let msgInput = null;
function msgFile() {
  if (msgInput) msgInput.remove();
  const inp = msgInput = document.createElement('input'); inp.type = 'file'; inp.accept = '.txt,text/plain'; inp.hidden = true;
  document.body.appendChild(inp); // in the page: an older Safari opens no picker for one outside it
  inp.addEventListener('change', async () => {
    const f = inp.files && inp.files[0]; inp.remove(); if (!f) return;
    if (f.size > MSG_FILE_MAX) { set({ msg: null, msgErr: 'That file is too large to be a signed message.' }); return; }
    try { msgTake(new Uint8Array(await f.arrayBuffer())); } catch (e) { set({ msg: null, msgErr: 'That file could not be read: ' + W.errMsg(e) }); }
  });
  inp.click();
}
// To this page from wherever a signed message was scanned, the page's own scanner or another's.
function msgOpen(bytes) { if (S.gated) activate(null); msgTake(bytes); goto('messages', 0); }
function msgView() {
  const m = S.msg, off = S.boot !== 'ready' ? ' disabled' : '';
  if (m) return `<div class="stack"><div class="verified"><i class="ph ph-shield-check"></i>Signature verified: this address signed this text</div>${m.address === RELEASE ? '<div class="verified"><i class="ph ph-seal-check"></i>It is the KasSigner release address</div>' : ''}
<div class="box"><pre class="msgtext mono">${esc(m.text)}</pre></div>
<table class="table"><tbody>${rowsH([['Signed by', `<div class="outv">${kad(m.address)}</div>`], ['Signature', `<span class="mono break">${esc(m.signature)}</span>`]])}</tbody></table>
<div class="hint">A signature says which address signed, not whose address it is. Compare the address with the one you expect, taken from somewhere other than this message.</div>
<div class="row"><button class="btn btn-secondary" data-act="msgCopy"><i class="ph ph-copy"></i>Copy address</button><button class="btn btn-ghost" data-act="msgClear">Check another</button></div></div>`;
  return `<div class="stack"><p class="lead">A message signed on a signer, with the address that signed it and its signature. It is checked here, in this page: nothing is sent anywhere, and nothing is kept.</p>
<button class="cta" data-act="scan" data-arg="message"${off}><span class="ic"><i class="ph ph-camera"></i></span><span><b>Scan a signed message</b><small>Its MESSAGE QR on your signer</small></span><i class="ph ph-arrow-right"></i></button>
<button class="cta" data-act="msgFile"${off}><span class="ic"><i class="ph ph-scroll"></i></span><span><b>Open a signed message file</b><small>The .TXT a signer saved to its card, or one that came with a release</small></span><i class="ph ph-arrow-right"></i></button>
<div class="field"><label for="f-msg">or paste a signed message</label><textarea id="f-msg" class="input mono" rows="6" placeholder="${MSG_BEGIN}…" data-bind="msgText" ${OFF}>${esc(S.msgText)}</textarea></div>
${S.msgErr ? `<div class="err">${esc(S.msgErr)}</div>` : ''}
<div class="row"><button class="btn btn-primary" data-act="msgRead"${off}>Check<i class="ph ph-arrow-right"></i></button></div>
<div class="box relbox"><div class="hint">KasSigner releases are signed by <b>kassigner.kas</b></div><div class="row">${kad(RELEASE)}<button class="btn btn-ghost" data-act="relCopy"><i class="ph ph-copy"></i>Copy</button></div></div>
${recordBox()}</div>`;
}

// #full
// ── broadcast ───────────────────────────────────────────────────────────────
// A transaction signed already, brought back with no request: a unit's SIGNED TX QR, a copy saved to its
// card and opened again, or a cosigner's partly signed copy (Kaspian, 2026-11-01: a send saved after
// signing could not be broadcast later). Read by itself, every signature verified over its own
// transaction; copies of one transaction merged, a cosigner in two copies held once; passed to the next
// cosigner, or broadcast once complete. What it pays is for whoever broadcasts it to read: each signer
// reviewed it on their own unit. Held in memory only; leaving the page forgets it.
const NOTHING_SIGNED = 'Nothing is signed on that transaction yet. Sign it on your signer first.';
function bcMsg(e) {
  const m = W.errMsg(e), n = /NotOneTransaction \{ count: (\d+)/.exec(m);
  if (/Unverified\(Nothing\)/.test(m)) return NOTHING_SIGNED;
  if (n) return 'That bundle holds ' + n[1] + ' transactions. One is read here at a time.';
  if (/NotTheRequest/.test(m)) return 'That copy is of another transaction.';
  if (/BadSignature|Unverified|ForeignSigner/.test(m)) return 'A signature on it does not check out: ' + m;
  return 'Not a signed transaction a signer wrote: ' + m;
}
// Same coins, same outputs, same fee: a copy of the transaction held. The SDK's merge holds every copy to
// the first's transaction whatever this says; this is what lets the screen say so by name.
const sameTx = (a, b) => a.fee === b.fee && a.outpoints.join() === b.outpoints.join() && a.outputs.length === b.outputs.length && a.outputs.every((o, i) => o.address === b.outputs[i].address && o.value === b.outputs[i].value);
function bcTake(bytes) {
  const fmt = isPskb(bytes) ? 'pskb' : 'kspt'; let info;
  try { info = W.readSigned(fmt, bytes); } catch (e) { set({ bcErr: bcMsg(e) }); return; }
  if (!info.signatures) { set({ bcErr: NOTHING_SIGNED }); return; }
  if (!bcBytes) { bcBytes = bytes; set({ ...BC0, bc: info }); return; }
  const held = S.bc;
  if (fmt !== held.fmt) { set({ bcErr: 'This copy is ' + FMTN[fmt] + '; the one held is ' + FMTN[held.fmt] + '. Scan its ' + FMTN[held.fmt] + ' copy.' }); return; }
  if (!sameTx(held, info)) { set({ bcErr: 'That copy is of another transaction: its coins, outputs or fee are not the ones held.' }); return; }
  let next, now;
  try { next = W.mergeSigned(fmt, [bcBytes, bytes]); now = W.readSigned(fmt, next); } catch (e) { set({ bcErr: bcMsg(e) }); return; }
  if (now.signatures <= held.signatures) { set({ bcErr: 'No new signature in that copy: every one it carries is held already.' }); return; }
  bcBytes = next; set({ bc: now, bcErr: '', bcText: '', bcFrames: [] });
  say(now.required ? 'Signature added · ' + now.present + ' of ' + now.required : 'Signature added');
}
function bcPasted() {
  const t = S.bcText.trim(); if (!t) return;
  let bytes; try { bytes = /^pskb/i.test(t) ? W.textBytes(t) : W.fromHex(t); } catch (e) { set({ bcErr: 'Not a signed transaction: paste its hex, or its PSKB text.' }); return; }
  bcTake(bytes);
}
const bcText = () => S.bc.fmt === 'pskb' ? new TextDecoder().decode(bcBytes) : W.toHex(bcBytes);
function bcShow() { if (!bcBytes) return; try { set({ bcFrames: W.requestCodes(bcBytes, S.bc.fmt), frame: 0, batch: 0, playing: true, sub: 1, bcErr: '' }); } catch (e) { set({ bcErr: W.errMsg(e) }); } }
function bcClear() { bcBytes = null; set({ ...BC0 }); }
async function bcBroadcast() {
  const fin = S.bc && S.bc.fin; if (!fin || S.bcSending) return;
  set({ bcSending: true, bcSendErr: '' });
  try { const r = await W.broadcast(fin, rest, node); set({ bcSending: false, bcSent: { ...r, at: Date.now() } }); if (acct) { after(sync, 4000); after(sync, 30000); } }
  catch (e) { set({ bcSending: false, bcSendErr: 'Broadcast failed: ' + W.errMsg(e) }); }
}
// #end

// ── covenant cards ──────────────────────────────────────────────────────────
// Time-Locked Savings (cov++, 2026-11-03): UTXOs locked until a minute, UTC (whole days until 2026-11-04),
// then claimed by the card's owner or recovered by its recovery wallet. A card is its address and its
// backup line; what is read of it here, its UTXOs and the wallet's key for it, is memory only, gone on
// reload or Lock & forget.
const MIN_MS = 60000, HOUR_MS = 60 * MIN_MS, DAY_MS = 24 * HOUR_MS, two = n => String(n).padStart(2, '0');
const cardAt = () => (S.cardSel != null && cards[S.cardSel]) || null;
// When it opens, as the unit and the backup line write it: DD/MM/YYYY HH:MM, UTC.
const cardDate = c => two(c.card.unlockDay) + '/' + two(c.card.unlockMonth) + '/' + c.card.unlockYear + ' ' + two(c.card.unlockHour) + ':' + two(c.card.unlockMinute);
// The page's clock for cards is the network's own: its past median time, the clock consensus holds a card's
// time to, read from the REST API's blockdag info, which names no address. Read while Covenants is on screen,
// every minute, and every 15 s while a card is within a minute of its time or past it and not open yet.
// Between readings the computer only counts the time passed since the last one (performance.now(), which no
// change to the computer's date moves): its own date is never used, so a computer set to another day or year
// neither locks a card to the wrong time nor shows one locked or open wrongly (Kaspian, 2026-11-07: a clock
// at 2050 made "+1 week" lock a card for 24 years). A card opens only on a reading past its time, never on
// that count. With no reading to be had, the computer's clock stands in, and the page says so where it matters.
let netClock = null, netReading = false, netTried = -Infinity, netFailed = false, lastStates = '';
const NET_EVERY = 60000, NET_NEAR = 15000, NET_SKEW = 10 * MIN_MS;
async function readNetClock() {
  if (!rest || netReading) return; netReading = true; netTried = performance.now();
  try { const pmt = await W.networkTime(rest); netClock = { pmt, at: performance.now() }; netFailed = false; } catch (_) { netFailed = true; }
  netReading = false; set({});
}
const netAge = () => netClock ? performance.now() - netClock.at : Infinity;
// Now, in ms since 1970, UTC: the network's last reading and the time counted since; the computer's clock
// when there is none.
const nowMs = () => netClock ? Number(netClock.pmt) + Math.floor(netAge()) : Date.now();
// How far the computer's clock is from the network's, when more than its two minutes' lag explains; else 0.
const skew = () => { if (!netClock) return 0; const d = Date.now() - nowMs(); return Math.abs(d) > NET_SKEW ? d : 0; };
const utcText = ms => { const d = new Date(ms); return two(d.getUTCDate()) + '/' + two(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear() + ' ' + two(d.getUTCHours()) + ':' + two(d.getUTCMinutes()) + ' UTC'; };
const skewWarn = () => skew() ? `<div class="warn"><i class="ph ph-warning-circle"></i><span>${esc('Your computer’s clock says ' + utcText(Date.now()) + ', the network’s ' + utcText(nowMs()) + '. Cards here count from the network’s.')}</span></div>` : '';
const cardState = c => netClock && netClock.pmt > c.card.unlockMs ? 'open' : BigInt(nowMs()) >= c.card.unlockMs ? 'opening' : 'locked';
const isOpen = c => cardState(c) === 'open';
const opening = () => netClock ? 'Its time is here: the claim opens as soon as the network’s clock confirms it, in a few seconds.' : 'Its time has passed on this computer’s clock, but the network’s clock can’t be read right now: the claim opens once it can.';
const plural = (n, one) => n + ' ' + one + (n === 1 ? '' : 's');
// How long until it opens, `ms` from now: days and hours, or hours and minutes under a day, minutes rounded up.
function leftIn(ms) {
  const d = Math.floor(ms / DAY_MS), h = Math.floor(ms % DAY_MS / HOUR_MS);
  if (d) return plural(d, 'day') + (h ? ' ' + h + ' h' : '');
  const m = Math.ceil(ms % HOUR_MS / MIN_MS);
  return h ? h + ' h' + (m ? ' ' + m + ' min' : '') : m + ' min';
}
const timeLeft = c => leftIn(Number(c.card.unlockMs - BigInt(nowMs())));
// The wallet's keys are searched as far as its discovery went, and past the signer's bank at least.
const cardDepth = () => Math.max(200, S.nextRecv + W.GAP);
// Which of the open wallet's receive keys is the card's, found again when another wallet is opened.
function cardKeys(c) {
  if (c.keysFor === acct && c.keysAt === cardDepth()) return;
  c.keysFor = acct; c.keysAt = cardDepth();
  try { c.signer = W.cardSigner(c.card, acct, c.keysAt); } catch (_) { c.signer = null; }
}
// #full
// Where a claim goes: the address typed, or the open single-key wallet's next receive address.
const claimTo = () => S.cTo.trim() || (acct && !acct.group ? addrAt(0, S.nextRecv) : '');
// #end
function cardErr(e) {
  const m = W.errMsg(e), who = /^Owner/.test(m) ? 'The owner’s address' : /^Recovery/.test(m) ? 'The recovery wallet’s address' : '';
  if (who && /NotAKey/.test(m)) return who + ' must be a single key’s, kaspa:q…';
  if (who && /NotMainnet/.test(m)) return who + ' is not on mainnet: cards are mainnet only.';
  if (who) return who + ' is not a Kaspa address.';
  if (/^Date/.test(m)) return 'That is not a day of the calendar and a time of day.';
  if (/NotAKey/.test(m)) return 'An address there holds no usable key.';
  return m;
}
// A card's backup line as a text file on this computer, named for the card: its address's first 5 and the day
// it opens. The line alone, as a signer's Save to SD writes it; a signer lists it from its SD card once named
// CVnnnn.TXT, a number not taken there.
function saveLine(c) {
  const u = URL.createObjectURL(new Blob([c.line], { type: 'text/plain' })), a = document.createElement('a');
  a.href = u; a.download = 'savings-card-' + c.address.slice(6, 11) + '-' + cardDate(c).split(' ')[0].replace(/\//g, '-') + '.txt';
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000);
  say('Backup saved as a file');
}
// A card as the page holds it: its backup line, its keys' addresses and, once read, its UTXOs.
const cardRec = card => ({ card, address: card.address(), line: card.backup(), owner: card.owner(), recovery: card.recovery() || '', utxos: [], total: 0n, sync: 'idle', syncAt: 0, err: '', via: '', signer: null, codes: null, qr: null });
// Into the card list, unless it is there already: where it is in it. Named Savings card 1, 2…, this session's
// count, until renamed.
function keepCard(c) {
  const had = cards.findIndex(x => x.address === c.address); if (had >= 0) return had;
  if (!c.auto) c.name = c.auto = 'Savings card ' + ++cardSeq;
  cards.push(c); cardKeys(c); cardSync(c);
  return cards.length - 1;
}
function addCard(card) {
  const c = cardRec(card), had = cards.some(x => x.address === c.address);
  set({ cardView: 'card', cardSel: keepCard(c), cTo: '', cBuildErr: '', cPane: null, cUtx: false, frame: 0, batch: 0, playing: true });
  if (had) say('That card is open already');
}
// A card's UTXOs read again: only a card still in the session, and nothing more once it is forgotten or
// removed, as a wallet's sync.
async function cardSync(c) {
  if (!c || c.sync === 'running' || !rest || !cards.includes(c)) return;
  const stop = c.stop = { aborted: false }, r = rest;
  c.sync = 'running'; c.err = ''; set({});
  try { const { list, via } = await W.cardUtxos(r, c.card, node, stop); Object.assign(c, { utxos: list, total: list.reduce((a, u) => a + u.amount, 0n), via, sync: 'done', syncAt: Date.now() }); }
  catch (e) { Object.assign(c, { sync: 'error', err: 'Couldn’t read its UTXOs: ' + W.errMsg(e) }); }
  if (stop.aborted) return;
// #full
  if (!S.fees) { try { set({ fees: await W.feeRates(r, node, stop) }); } catch (_) {} }
// #end
  set({});
}
function openCardLine(text) {
  const t = String(text || '').trim();
  if (!t) { set({ cLineErr: 'Paste a card’s backup line, savings_v1(…)' }); return; }
  let card;
  try { card = W.cardOf(t); }
  catch (e) { const m = W.errMsg(e); set({ cLineErr: /NotABackup/.test(m) ? 'That is not a savings card’s backup line.' : 'That backup line doesn’t check out (' + m + '). Copy it again, exactly as written.' }); return; }
  set({ cLine: '', cLineErr: '' }); addCard(card);
}
// #full
function buildClaim() {
  const c = cardAt(); if (!c) return;
  try {
    if (!isOpen(c)) throw new Error(cardState(c) === 'opening' ? 'The network’s clock has not reached ' + cardDate(c) + ' UTC yet: a minute or two.' : 'Locked until ' + cardDate(c) + ' UTC.');
    const to = claimTo(); if (!to) throw new Error('Enter where its UTXOs go');
    try { W.checkAddress(to); } catch (_) { throw new Error('That is not a valid Kaspa address'); }
    cardKeys(c);
    const fmt = S.fmt, rate = rateUsed(S.cFee), { req, used } = W.claimCard({ card: c.card, coins: c.utxos, to, feerate: rate, fmt, signer: c.signer, w: acct, own: ownRecv(to) });
    clearSend(); takeReq(req, fmt);
    const total = used.reduce((a, u) => a + u.amount, 0n), role = c.signer ? (c.signer.recovers ? 'recover' : 'claim') : '';
    set({ ...SEND0, cBuildErr: '', reqInfo: { to, amount: total - req.fee, fee: req.fee, change: null, changeTo: '', changeIdx: 0, inputs: used.length, fmt, outs: [{ address: to, value: total - req.fee }], rate, custom: S.cFee === 'custom', spends: used.map(u => u.txId + ':' + u.index), card: { c, role, date: cardDate(c) + ' UTC', left: c.utxos.length - used.length } }, frames: reqFrames, frame: 0, batch: 0, playing: true, sec: 'send', sub: 1, part: null });
  } catch (e) { set({ cBuildErr: W.errMsg(e) }); }
}
// #end
// The card list (Kaspian, 2026-11-04): a tile a card, as it drops onto the unit at Keep, its name to rename
// in place; then a new card, and one opened from its backup.
function cardListHtml() {
  ncMark('list');
  const ready = S.boot === 'ready', a = d => an(ncT0, d);
  const tile = (c, i) => {
    const st = cardState(c), open = st === 'open', ed = isEdit('c', i), since = nowMs() - Number(c.card.unlockMs);
    return `<div class="tilec${open ? ' open' : ''}"${ed ? '' : ` data-act="cardShow" data-arg="${i}" role="button" tabindex="0"`}${a(80 + Math.min(i, 8) * 90)}>${ed ? '' : `<button class="btn btn-ghost btn-icon tx" data-act="cardRemove" data-arg="${i}" title="Remove from this session"><i class="ph ph-x"></i></button>`}
<div class="th">${ed ? editor(c.auto) : `<div class="tb"><i class="ph ph-hourglass-medium"></i><span>${esc(c.name)}</span>${pen('editCard', i, 'Rename')}</div>`}<span class="tag ${open ? 'openg' : 'lock'}">${open ? 'Open' : st === 'opening' ? 'Opening' : 'Locked'}</span></div>
<div class="td"><i class="ph ${open ? 'ph-check-circle' : 'ph-lock-simple'}"></i><b>${esc(cardDate(c).split(' ')[0])}</b><span>${esc(cardDate(c).split(' ')[1])} UTC</span></div><div class="tl2">${esc(open ? 'opened ' + leftIn(since) + ' ago' : st === 'opening' ? 'opening…' : 'in ' + timeLeft(c))}</div>
${kshort(c.address)}<div class="tf2"><span class="muted">Holds</span><b>${c.sync === 'done' ? (c.utxos.length ? esc(fk(c.total) + ' KAS · ' + plural(c.utxos.length, 'UTXO')) : '<span class="muted">nothing yet</span>') : `<span class="muted">${c.sync === 'running' ? 'reading…' : c.sync === 'error' ? 'not read' : '—'}</span>`}</b></div></div>`;
  };
  return `<div class="stack"><p class="lead">${cards.length ? (HOSTED ? 'Your cards in this session. Tap one to see what it holds.' : 'Your cards in this session. Tap one to see it, fund it, or claim it once it opens.') : 'A Time-Locked Savings card locks UTXOs until a time you choose, to the minute, UTC. From then on its owner can claim them, or its recovery wallet, if it has one, recover them, each signing on their own signer, which shows the card before it signs.'}</p>
<div class="tiles">${cards.map(tile).join('')}<button class="tilec new" data-act="cardNew"${ready ? '' : ' disabled'}${a(80 + Math.min(cards.length, 8) * 90)}><span class="ic"><i class="ph ph-plus"></i></span><b>New card</b><small>An owner, an optional recovery wallet and when it opens</small></button></div>
<button class="cta" data-act="scan" data-arg="cardBackup"${ready ? '' : ' disabled'}><span class="ic"><i class="ph ph-scan"></i></span><span><b>Open a card from its backup</b><small>Scan the backup QR you kept, or your signer’s</small></span><i class="ph ph-arrow-right"></i></button>
<div class="field"><label for="f-c-line">or paste its backup</label><textarea id="f-c-line" class="input mono" rows="3" placeholder="savings_v1(kaspa:q…,kaspa:q… or none,DD/MM/YYYY HH:MM,kaspa:p…)" data-bind="cLine" ${OFF}>${esc(S.cLine)}</textarea></div>
${S.cLineErr ? `<div class="err">${esc(S.cLineErr)}</div>` : ''}<div class="row"><button class="btn btn-primary" data-act="cardLine"${ready ? '' : ' disabled'}>Open card<i class="ph ph-arrow-right"></i></button></div>
<div class="hint">Cards are kept for this session only: lock, reload or close the page and they are gone. Their backups bring them back.</div></div>`;
}
// A card's page (Kaspian, 2026-11-04): the card on the unit, as the new card's steps built it, and beside it
// what it holds, whose keys this wallet has, then funding it while it is locked, claiming it once it opens;
// its backup and funding an open card each a page of their own (cPane).
// On the unit, the whole card by its name, as renamed (Kaspian, 2026-11-04).
function cardFace(c) {
  const st = cardState(c), open = st === 'open', a = d => an(ncT0, d);
  const slot = (label, v) => `<div class="slot"><small>${label}</small><div class="v"${a('0')}>${v}</div></div>`;
  return `<div class="card"${a('0,600')}><div class="head"><div class="brand"><i class="ph ph-hourglass-medium"></i><span>${esc(c.name.toUpperCase())}</span></div><span class="tag ${open ? 'openg' : 'lock'}">${open ? 'OPEN' : st === 'opening' ? 'OPENING' : 'LOCKED'}</span></div>
<div class="time${open ? ' open' : ''}"${a('0')}><i class="ph ${open ? 'ph-check-circle' : 'ph-lock-simple'}"></i><b>${esc(cardDate(c))}</b><span>UTC</span></div>
<div class="pair">${slot('Owner', esc(sh(c.owner, 5)))}${slot('Recovery wallet', c.recovery ? esc(sh(c.recovery, 5)) : 'none')}</div>
<div class="pair">${slot('Card address', esc(sh(c.address, 5)))}${slot('Holds', esc(c.sync === 'done' ? fk(c.total) + ' KAS' : c.sync === 'running' ? 'reading…' : '—'))}</div></div>`;
}
function cardHtml(c) {
  cardKeys(c);
  if (!c.codes) { try { c.codes = W.textCodes(c.line); } catch (_) { c.codes = []; } }
  const i = cards.indexOf(c), st = cardState(c), open = st === 'open', sg = c.signer, ready = S.boot === 'ready', pane = S.cPane;
  ncMark('c' + i + (pane || ''));
  const a = d => an(ncT0, d), single = acct && !acct.group;
  const left = `<div class="left" aria-hidden="true"><div class="devbox"><div class="devsize"><div class="devscale">${devHtml(`<div class="inscreen">${cardFace(c)}</div>`, false)}</div></div></div></div>`;
  const name = `<div class="eyebrow">${isEdit('c', i) ? editor(c.auto) : `<span>${esc(c.name)}</span>${pen('editCard', i, 'Rename')}`}</div>`;
  const back = to => `<button class="btn btn-secondary tall" data-act="${to ? 'cardPane' : 'cardList'}"><i class="ph ph-arrow-left"></i>${to ? 'Back' : 'All cards'}</button>`;
  const page = (title, lead, body, foot) => `<div class="nc"><div class="nc-in">${left}<section class="right"><div class="body"${a('0')}>${name}<h2>${title}</h2><p class="lead">${lead}</p>${body}</div><div class="foot">${foot}</div></section></div></div>`;
  if (pane === 'backup') return page(NC[5][1], NC[5][2], backupBody(c, 'cardCopyLine', 'cardSaveLine'), back(true));
  if (pane === 'fund') return page(NC[7][1], NC[7][2], fundTiles(c, 'cardDeposit', 'cardCopy'), back(true));
  const since = nowMs() - Number(c.card.unlockMs);
  const holds = `<div class="holds"><i class="ph ph-coins"></i><div class="grow"><b>${esc(c.sync === 'done' ? fk(c.total) + ' KAS' : c.sync === 'running' ? 'Reading…' : '—')}</b><small>${esc(c.sync === 'done' ? plural(c.utxos.length, 'UTXO') + ' · read ' + new Date(c.syncAt).toLocaleTimeString() + (c.via ? ' · ' + c.via : '') : c.sync === 'error' ? 'Not read' : '')}</small></div>${c.utxos.length ? `<button class="btn btn-ghost${S.cUtx ? ' on' : ''}" data-act="cardUtx">UTXOs<i class="ph ph-caret-down"></i></button>` : ''}<button class="btn btn-secondary btn-icon" data-act="cardSync" title="Refresh"${c.sync === 'running' || !ready ? ' disabled' : ''}><i class="ph ph-arrows-clockwise"></i></button></div>
${c.err ? `<div class="err">${esc(c.err)}</div>` : ''}${S.cUtx && c.utxos.length ? `<table class="table"><thead><tr><th>Outpoint</th><th class="r">KAS</th></tr></thead><tbody>${c.utxos.map(u => `<tr><td class="mono">${esc(sh(u.txId, 6) + ':' + u.index)}</td><td class="r mono">${fk(u.amount)}</td></tr>`).join('')}</tbody></table>` : ''}`;
  // Whose of its keys the open wallet holds: its receive index when it does, so the right signer is used.
  const key = (who, mine) => mine ? `<span class="tag tag-neutral">${who} · yours · receive #${sg.index}</span>` : single ? `<span class="tag tag-neutral">${who} · not this wallet</span>` : '';
  const keys = `<div class="keys">${key('Owner', sg && !sg.recovers)}${c.recovery ? key('Recovery wallet', sg && sg.recovers) : ''}</div>`;
  const foot = `${back(false)}<div class="row">${open ? '<button class="btn btn-secondary tall" data-act="cardPane" data-arg="fund"><i class="ph ph-arrow-down-left"></i>Fund</button>' : ''}<button class="btn btn-secondary tall" data-act="cardPane" data-arg="backup"><i class="ph ph-qr-code"></i>Backup</button></div>`;
  if (st === 'opening') return page('Opening', esc(cardDate(c)) + ' UTC. ' + esc(opening()), skewWarn() + holds + keys + fundTiles(c, 'cardDeposit', 'cardCopy'), foot);
  if (!open) return page('Locked', 'Opens ' + esc(cardDate(c)) + ' UTC, in ' + esc(timeLeft(c)) + '.', skewWarn() + holds + keys + fundTiles(c, 'cardDeposit', 'cardCopy'), foot);
// #full
  const dflt = single ? addrAt(0, S.nextRecv) : '', mi = W.maxInputs();
  const claim = `<div class="tile"><h3><i class="ph ph-key"></i>${sg ? (sg.recovers ? 'Recover, as its recovery wallet' : 'Claim, as its owner') : 'Claim or recover'}</h3>
<label class="lab" for="f-c-to">To</label><div class="row nowrap"><input id="f-c-to" class="input mono" placeholder="${esc(dflt || 'kaspa:q…')}" data-bind="cTo" value="${esc(S.cTo)}" ${OFF}><button class="btn btn-secondary tall" data-act="scan" data-arg="cardTo"><i class="ph ph-scan"></i><span class="bt">Scan</span></button>${acct ? bookBtn('cTo') : ''}</div>
<div class="hint">${dflt ? 'Empty: your next receive address, #' + S.nextRecv + '.' : 'Where its UTXOs go.'} The fee is taken from what it holds.</div>
${feeSeg(S.cFee, 'cFee')}${fmtSeg()}
${sg ? '' : `<div class="hint">${single ? 'Neither of the card’s keys is among this wallet’s first ' + cardDepth() + ' receive addresses' : 'No single-key wallet is open here'}: your signer finds which key is its own, the owner’s to claim, the recovery wallet’s to recover.</div>`}
${c.utxos.length > mi ? `<div class="hint">Your signer takes ${mi} inputs a transaction: the largest ${mi} UTXOs go first; claim again for the rest.</div>` : ''}
${S.cBuildErr ? `<div class="err">${esc(S.cBuildErr)}</div>` : ''}
<button class="btn btn-fill tall" data-act="cardClaim"${!ready || !c.utxos.length || c.sync === 'running' ? ' disabled' : ''}>Build ${sg && sg.recovers ? 'recovery' : 'claim'}<i class="ph ph-arrow-right"></i></button></div>`;
  return page('Open', 'Open since ' + esc(cardDate(c)) + ' UTC, ' + esc(leftIn(since)) + ' ago. Claim it all at once, or bit by bit.', skewWarn() + holds + keys + claim, foot);
// #end
/* #hosted
  return page('Open', 'Open since ' + esc(cardDate(c)) + ' UTC, ' + esc(leftIn(since)) + ' ago.', skewWarn() + holds + keys + NO_CLAIM, foot);
#end */
}
// ── a new card ──────────────────────────────────────────────────────────────
// Its eight steps, a page each, the card built on the landing's unit as they go (Kaspian, 2026-11-04, the
// design he chose): what a card is, its owner, its recovery wallet, when it opens; then the card itself, made
// at Opens at, its backup, Keep, which puts it in the session's card list, and Fund.
const NC = [
  ['Start', 'Time-Locked Savings', 'Lock KAS until a time you choose. Nobody can move them before then, not even you.'],
  ['Owner', 'Who claims it?', 'Whoever holds this address’s key claims the card from the minute it opens: all at once, or bit by bit.'],
  ['Recovery', 'A recovery wallet?', 'A second wallet, from another seed, may recover the card from the same time. Leave it out for owner only.'],
  ['Opens at', 'When does it open?', 'To the minute, in UTC, on a 24-hour clock.'],
  ['The card', 'Your card', 'This address is the card. Whatever is sent to it is locked until it opens.'],
  ['Backup', 'Keep its backup safe', 'This backup rebuilds the card, here or on any signer.'],
  ['Keep', '', ''],
  ['Fund', 'Fund it', HOSTED ? 'Send KAS to the card’s address, as often as you like, from any wallet.' : 'Send KAS to the card, as often as you like, from this wallet or any other.'],
];
const OFF = 'autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"';
// The time typed, once every field is a number, and as a card writes it.
const ncTime = () => { const v = [S.cDay, S.cMonth, S.cYear, S.cHour, S.cMinute].map(x => String(x).trim()); if (!v.every(x => /^\d{1,4}$/.test(x))) return null; const [d, m, y, h, mi] = v.map(Number); return { d, m, y, h, mi }; };
const ncWhen = () => { const t = ncTime(); return t ? two(t.d) + '/' + two(t.m) + '/' + t.y + ' ' + two(t.h) + ':' + two(t.mi) : ''; };
// The quick picks and "Opens in" count from the network's clock only (Kaspian, 2026-11-07); without it a
// typed time is still taken, as typed, with a word to check it.
function ncLeft() {
  const t = ncTime();
  if (!netClock) return !netFailed ? 'Reading the network’s clock…' : t ? 'This time couldn’t be checked against the network’s clock: check the date and the year.' : 'Type the day and the time it opens. The quick picks wait for the network’s clock, which can’t be read right now.';
  if (!t) return 'Type the day and the time it opens, or take one of these.';
  const ms = Date.UTC(t.y, t.m - 1, t.d, t.h, t.mi) - nowMs();
  return ms > 0 ? 'Opens in ' + leftIn(ms) + ', by the network’s clock.' : 'That time has passed: pick one after now.';
}
// From now, to the minute: a week, a month, six months, a year.
function ncPreset(k) {
  if (!netClock) return;
  const n = new Date(nowMs()), t = k === 'w' ? new Date(n.getTime() + 7 * DAY_MS) : new Date(Date.UTC(n.getUTCFullYear() + (k === 'y' ? 1 : 0), n.getUTCMonth() + (k === 'm' ? 1 : k === 'h' ? 6 : 0), n.getUTCDate(), n.getUTCHours(), n.getUTCMinutes()));
  set({ cDay: two(t.getUTCDate()), cMonth: two(t.getUTCMonth() + 1), cYear: String(t.getUTCFullYear()), cHour: two(t.getUTCHours()), cMinute: two(t.getUTCMinutes()), cErr: '' });
}
// Owner and Recovery's Next: the address checked by the SDK's own rules, on a card of its own thrown away
// at once, so the step says what is wrong with its own field.
function ncTry(rec) {
  const owner = S.cOwner.trim(); if (!owner) throw new Error('Enter the owner’s address');
  if (rec && !S.cNoRec && !S.cRecovery.trim()) throw new Error('Enter the recovery wallet’s address, or tick No recovery wallet');
  try { const t = W.makeCard(owner, rec && !S.cNoRec ? S.cRecovery.trim() : '', 1, 1, 2100, 0, 0); if (t.free) t.free(); } catch (e) { throw new Error(cardErr(e)); }
}
// Opens at's Next: the card, and its backup's codes.
function ncMake() {
  const num = (t, what) => { t = String(t).trim(); if (!/^\d{1,4}$/.test(t)) throw new Error('Enter the ' + what + ' as a number'); return Number(t); };
  const d = num(S.cDay, 'day'), m = num(S.cMonth, 'month'), y = num(S.cYear, 'year'), h = num(S.cHour, 'hour'), mi = num(S.cMinute, 'minute');
  let card; try { card = W.makeCard(S.cOwner.trim(), S.cNoRec ? '' : S.cRecovery.trim(), d, m, y, h, mi); } catch (e) { throw new Error(cardErr(e)); }
  if (card.unlockMs <= BigInt(nowMs())) throw new Error('Pick a time after now: a card whose time has passed is open from the start.');
  fresh = cardRec(card);
  try { fresh.codes = W.textCodes(fresh.line); } catch (_) { fresh.codes = []; }
}
const ncGo = k => set({ nStep: k, cErr: '', ...(k === 5 ? { frame: 0, batch: 0, playing: true } : {}) });
function ncNext() {
  const k = S.nStep; if (S.cardView !== 'new' || k >= NC.length - 1) return;
  if (k === 5) { ncKeep(); return; }
  try { if (k === 1) ncTry(false); else if (k === 2) ncTry(true); else if (k === 3) ncMake(); }
  catch (e) { set({ cErr: W.errMsg(e) }); return; }
  ncGo(k + 1);
}
const ncBack = () => { if (S.nStep === 0) set({ cardView: 'list', cErr: '' }); else ncGo(S.nStep - 1); };
// Keep: the card into the card list, and read there from then on; on the unit, the card as its steps built
// it, LOCKED, with no animation of its own (Kaspian, 2026-11-07).
function ncKeep() {
  if (!fresh) return;
  keepCard(fresh); ncGo(6);
}
// Done: the card list, the new card among the rest (Kaspian, 2026-11-04).
function ncDone() {
  fresh = null;
  set({ ...NC0, cardView: 'list', cardSel: null, cTo: '', cBuildErr: '', cPane: null, cUtx: false });
}
// #full
// Fund › Build deposit: Send's Compose with the card's address filled in, the amount to type there, built as
// Send builds any (Kaspian, 2026-11-07).
function depositTo(c) {
  if (!c || !acct || S.boot !== 'ready') return;
  set({ to: c.address, amt: '', max: false, buildErr: '' }); goto('send', 0);
  setTimeout(() => { const f = $('f-amt'); if (f) f.focus(); }, 60);
}
const ncDeposit = () => depositTo(fresh);
// #end
// The unit, the landing's: `inner` on its screen, its light flashing once with `flash`.
const devHtml = (inner, flash) => `<div class="dev" data-loop="19000">${'<div class="slab"></div>'.repeat(22)}<div class="front"><div class="screen">${inner}</div></div>${flash ? `<div class="led flash"${an(ncT0, '0,1200')}></div>` : '<div class="led" data-loop="6000"></div>'}</div>`;
// A new card's motion, carried on when the view is drawn again (a frame of its backup's code, a toast, a
// field typed), so a redraw neither replays nor jumps: each entrance from where it had got to since it began
// (data-anim, the moment and its animations' delays, ms), the unit's float and light where the page's clock
// has them (data-loop, a cycle, ms).
let ncKey = '', ncT0 = 0;
// A screen's entrances start over when another comes on (`key`), not when the same one is drawn again.
const ncMark = key => { if (key !== ncKey) { ncKey = key; ncT0 = performance.now(); } };
const an = (t0, delays) => ` data-anim="${t0.toFixed(1)}:${delays}"`;
function motion(el) {
  const t = performance.now();
  for (const n of el.querySelectorAll('[data-loop]')) n.style.animationDelay = -(t % +n.dataset.loop) + 'ms';
  for (const n of el.querySelectorAll('[data-anim]')) { const [t0, ds] = n.dataset.anim.split(':'); n.style.animationDelay = ds.split(',').map(d => (+d - (t - +t0)) + 'ms').join(','); }
}
// The card on the unit's screen: what the steps so far filled in, the step's own field lit.
function ncCard(k) {
  const c = k >= 4 ? fresh : null, when = c ? cardDate(c) : ncWhen(), a = an(ncT0, '0');
  const owner = c ? c.owner : S.cOwner.trim(), rec = c ? c.recovery : S.cNoRec ? '' : S.cRecovery.trim(), none = c ? !c.recovery : S.cNoRec;
  const slot = (on, live, label, v) => `<div class="slot${on ? '' : ' empty'}${live ? ' live' : ''}"><small>${label}</small>${on ? `<div class="v"${a}>${v}</div>` : '<div class="none">—</div>'}</div>`;
  const head = `<div class="head"><div class="brand"><i class="ph ph-hourglass-medium"></i>TIME-LOCKED SAVINGS</div>${c ? `<span class="marks"><span class="cov"${a}>cov++</span>${k === 6 ? '<span class="tag lock">LOCKED</span>' : ''}</span>` : ''}</div>`;
  const time = k >= 3 && when ? `<div class="time"${a}><i class="ph ph-lock-simple"></i><b>${esc(when)}</b><span>UTC</span></div>` : slot(false, k === 3, 'Opens', '');
  const own = slot(k >= 2 || (k === 1 && !!owner), k === 1, 'Owner', esc(sh(owner, 5)));
  const recv = slot(k >= 3 || (k === 2 && (!!rec || none)), k === 2, 'Recovery wallet', none ? 'none' : esc(sh(rec, 5)));
  const addr = slot(!!c, k === 4, 'Card address', c ? kad(c.address) : '');
  return `<div class="card"${an(ncT0, '0,600')}>${head}${time}<div class="pair">${own}${recv}</div>${addr}</div>`;
}
function ncBody(k) {
  const c = fresh, a = d => an(ncT0, d);
  if (k === 0) return `<div class="pts">${[['ph-lock-simple', 'Locked to the minute', 'Until the time you set, the network keeps every UTXO in the card.'], ['ph-key', 'Your key claims it', 'From that minute on, your signer can claim it, all at once or bit by bit.'], ['ph-shield-check', 'An optional recovery wallet', 'A second wallet may recover it from the same time.']].map(([i, b, s], j) => `<div class="pt"${a(100 + j * 120)}><i class="ph ${i}"></i><div><b>${b}</b><span>${s}</span></div></div>`).join('')}</div><div class="hint">Watch the card build on the unit as you go.</div>`;
  if (k === 1) {
    // Filled in with the first unused receive address when a single-key wallet is open: a card apart from
    // the wallet's past payments.
    const mine = acct && !acct.group ? addrAt(0, S.nextRecv) : '';
    const chip = mine ? `<button class="chip${S.cOwner.trim() === mine ? ' on' : ''}" data-act="cardMine"><i class="ph ph-wallet"></i>My address #${S.nextRecv}</button><span class="hint">First unused index</span>` : '<span class="hint">Any receive address of your signer’s account: your signer finds which one it is.</span>';
    // Whether the address in the field is one of the wallet's own, and its history: known once synced.
    const a = S.cOwner.trim(), r = mine && S.sync === 'done' && a ? S.recv.find(x => x.address === a) : null;
    const tag = r ? histOf(r) : mine && S.sync === 'done' && a && Array.from({ length: W.SPARE }, (_, k) => addrAt(0, S.nextRecv + k)).includes(a) ? 'unused' : '';
    return `<div><label class="lab" for="f-nc-owner">Owner’s address${tag ? ` <span class="tag ${tag}">${tag}</span>` : ''}</label><div class="row nowrap"><input id="f-nc-owner" class="input mono" data-bind="cOwner" value="${esc(S.cOwner)}" placeholder="kaspa:q…" ${OFF}><button class="btn btn-secondary tall" data-act="scan" data-arg="cardOwner"><i class="ph ph-scan"></i><span class="bt">Scan</span></button>${mine ? bookBtn('cOwner') : ''}</div>
<div class="row chips">${chip}</div></div>`;
  }
  if (k === 2) return `<div><label class="lab" for="f-nc-rec">Recovery wallet’s address <span class="faint">· optional</span></label><div class="row nowrap"><input id="f-nc-rec" class="input mono" data-bind="cRecovery" value="${S.cNoRec ? '' : esc(S.cRecovery)}" placeholder="${S.cNoRec ? 'none' : 'kaspa:q…'}"${S.cNoRec ? ' disabled' : ''} ${OFF}><button class="btn btn-secondary tall" data-act="scan" data-arg="cardRecovery"${S.cNoRec ? ' disabled' : ''}><i class="ph ph-scan"></i><span class="bt">Scan</span></button></div>
<label class="check"><input type="checkbox" data-act="ncNoRec"${S.cNoRec ? ' checked' : ''}>No recovery wallet: only the owner can claim it</label></div>`;
  if (k === 3) {
    const f = (id, bind, label, ph, max) => `<div><label class="lab" for="${id}">${label}</label><input id="${id}" class="input num" inputmode="numeric" maxlength="${max}" placeholder="${ph}" data-bind="${bind}" value="${esc(S[bind])}" ${OFF}></div>`, when = ncWhen();
    return `<div><div class="tf">${f('f-nc-d', 'cDay', 'Day', 'DD', 2)}${f('f-nc-m', 'cMonth', 'Month', 'MM', 2)}${f('f-nc-y', 'cYear', 'Year', 'YYYY', 4)}<div class="gap"></div>${f('f-nc-h', 'cHour', 'Hour · UTC', 'HH', 2)}${f('f-nc-mi', 'cMinute', 'Minute', 'MM', 2)}</div>
<div class="row chips">${[['w', '+1 week'], ['m', '+1 month'], ['h', '+6 months'], ['y', '+1 year']].map(([p, l]) => `<button class="chip" data-act="ncPreset" data-arg="${p}"${netClock ? '' : ' disabled'}>${l}</button>`).join('')}</div>
<div class="tl"><div class="bar"><i${a('0')}></i></div><div class="m a"><b>Now</b></div><div class="m z"><b class="orange">${when ? esc(when) + ' UTC' : '—'}</b></div></div>
<div class="hint">${esc(ncLeft())}</div>${skewWarn()}</div>`;
  }
  if (k === 4) return `<div class="big"${a('0')}>${kad(c.address)}</div><div class="hint">Where KAS are sent to be locked. Its program is Time-Locked Savings, in SilverScript; your signer shows it as SAVINGS CARD before it ever signs.</div>`;
  if (k === 5) return backupBody(c, 'ncCopyLine', 'ncSaveLine');
  if (k === 6) return `<div class="kept"><div class="ring"><i class="ph ph-check"${a('250')}></i></div><h2>Card kept</h2><p class="lead">The card you’ve just created stays in your browser session’s card list until you lock, reload or close the page. After that, only its backup brings it back. You can scan the backup from your signer’s Home to see it as SAVINGS CARD.</p><div class="warn"${a('350')}><i class="ph ph-warning-circle"></i><span>Without its backup the card’s address gives nothing back. It holds no secret, but says whose card it is: keep it private.</span></div></div>`;
  return fundTiles(c, 'ncDeposit', 'ncCopy');
}
// A card's backup as a page shows it, on a new card's Backup step and a card's own: its code, by the page's
// speed or frame by frame, then copy it or save it as a file. The card lives in this session only: its backup
// is the card, kept in more than one place (Kaspian, 2026-11-04).
const backupBody = (c, copyAct, saveAct) => `<div class="bwrap s${S.size}">${player(c.codes, 'Card backup QR', true)}<div class="row nowrap pair2"><button class="btn btn-secondary tall" data-act="${copyAct}"><i class="ph ph-copy"></i>Copy</button><button class="btn btn-secondary tall" data-act="${saveAct}"><i class="ph ph-download-simple"></i>Save as file</button></div></div>`;
// Funding a card, one tile (Kaspian, 2026-11-07): its address as a code and as text for any wallet, Copy address,
// and Build deposit, Send with the address filled in, for the wallet in use (none loaded, it is off).
function fundTiles(c, depAct, copyAct) {
  if (c.qr == null) { try { c.qr = W.textQr(c.address); } catch (_) { c.qr = ''; } }
// #full
  const can = acct && S.boot === 'ready';
  return `<div class="fund"><div class="tile"><h3><i class="ph ph-qr-code"></i>Fund card</h3><div class="row aqr"><div class="qr">${c.qr ? `<img src="${esc(c.qr)}" alt="Card address QR">` : ''}</div>${kad(c.address)}</div><div class="frow"><button class="btn btn-secondary tall" data-act="${copyAct}" title="Copy address"><i class="ph ph-copy"></i><span class="bt">Copy address</span></button><button class="btn btn-fill tall" data-act="${depAct}"${can ? '' : ` disabled title="${acct ? 'Loading the signing engine…' : 'Load a wallet to build a deposit from it'}"`}>Build deposit<i class="ph ph-arrow-right"></i></button></div></div></div>`;
// #end
/* #hosted
  return `<div class="fund"><div class="tile"><h3><i class="ph ph-qr-code"></i>Fund card</h3><div class="row aqr"><div class="qr">${c.qr ? `<img src="${esc(c.qr)}" alt="Card address QR">` : ''}</div>${kad(c.address)}</div><div class="frow"><button class="btn btn-secondary tall" data-act="${copyAct}" title="Copy address"><i class="ph ph-copy"></i><span class="bt">Copy address</span></button></div></div>${NO_DEPOSIT}</div>`;
#end */
}
function ncHtml() {
  const k = fresh || S.nStep < 4 ? S.nStep : 0;
  ncMark('n' + k);
  const [eye, title, lead] = NC[k];
  const inner = ncCard(k);
  const bars = NC.map((_, i) => `<i class="${i <= k ? 'on' : ''}"></i>`).join('');
  const next = k === NC.length - 1 ? '<button class="btn btn-fill tall" data-act="ncDone">Done<i class="ph ph-check"></i></button>'
    : `<button class="btn btn-fill tall" data-act="ncNext">${k === 0 ? 'Start' : k === 5 ? 'Keep the card' : 'Next'}<i class="ph ph-arrow-right"></i></button>`;
  return `<div class="nc"><div class="nc-in"><div class="left" aria-hidden="true"><div class="devbox"><div class="devsize"><div class="devscale">${devHtml(`<div class="inscreen">${inner}</div>`, k === 6)}</div></div></div><div class="dots">${bars}</div></div>
<section class="right"><div class="progress">${bars}</div><div class="body"${an(ncT0, '0')}><div class="eyebrow">${eye}</div>${title ? `<h2>${title}</h2><p class="lead">${lead}</p>` : ''}${ncBody(k)}${S.cErr ? `<div class="err">${esc(S.cErr)}</div>` : ''}</div>
<div class="foot"><button class="btn btn-secondary tall" data-act="ncBack"><i class="ph ph-arrow-left"></i>Back</button>${next}</div></section></div></div>`;
}
// ── your addresses ──────────────────────────────────────────────────────────
// The address book (Kaspian, 2026-11-04): beside Scan on the fields your own addresses belong in (Send's
// destination, a claim's To, a new card's owner), the open wallet's receive addresses to pick from, over
// the screen so nothing typed is lost: the unused ones first, then those with history, with their labels
// and what they hold. Not on a recovery wallet's field, which is another seed's, nor on Add vault's address,
// before the vault is here.
const BOOK = { to: 'the destination', cTo: 'where the claim goes', cOwner: 'the owner' };
let bookT0 = 0;
const bookBtn = bind => `<button class="btn btn-secondary btn-icon bookb" data-act="book" data-arg="${bind}" title="Your addresses" aria-label="Your addresses"><i class="ph ph-address-book"></i></button>`;
// An address short, its ends as the signer shows them: kaspa:, then the first and last 5 in teal.
// An address's history, as its tag says it: unused, used and empty, or funded, holding KAS (2026-11-04).
const histOf = a => !a.used ? 'unused' : a.bal ? 'funded' : 'used';
const kshort = a => { const b = String(a).slice(6); return `<span class="kad"><span class="p">kaspa:</span><b>${esc(b.slice(0, 5))}</b>${esc(b.slice(5, 9))}…${esc(b.slice(-9, -5))}<b>${esc(b.slice(-5))}</b></span>`; };
function bookHtml() {
  const g = acct.group, me = g ? acct.me || 0 : 0, done = S.sync === 'done', cur = String(S[S.book] || '').trim();
  const fresh = Array.from({ length: W.SPARE }, (_, k) => S.nextRecv + k).map(i => ({ address: addrAt(0, i), index: i, used: false }));
  const used = done ? S.recv.filter(a => a.used && (!g || a.cosigner === me)).sort((a, b) => b.index - a.index) : [];
  let j = 0;
  const row = a => `<button class="brow${a.address === cur ? ' on' : ''}" data-act="bookPick" data-arg="${esc(a.address)}"${an(bookT0, 80 + Math.min(j++, 8) * 40)}><span class="bi">#${a.index}</span><span class="ba">${kshort(a.address)}${labelOf(a.address) ? `<small>${esc(labelOf(a.address))}</small>` : ''}</span>${a.used && a.bal ? `<span class="bx"><span class="mono small">${esc(fk(a.bal))} KAS</span><span class="tag funded">funded</span></span>` : a.used || done ? `<span class="tag ${histOf(a)}">${histOf(a)}</span>` : ''}</button>`;
  return `<div class="book-back" data-act="bookClose"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Your addresses"${an(bookT0, '0')}>
<div class="sheet-head"><div><b>Your addresses</b><small>${esc(acct.name)} · receive · for ${BOOK[S.book]}</small></div><button class="btn btn-ghost btn-icon" data-act="bookClose" title="Close"><i class="ph ph-x"></i></button></div>
<div class="sheet-list"><div class="sec">${done ? 'Unused' : 'Next'}</div>${fresh.map(row).join('')}${used.length ? `<div class="sec">With history</div>${used.map(row).join('')}` : ''}</div>
${done ? '' : '<div class="hint">Not synced yet: which of them are unused shows once it is.</div>'}</div>`;
}
const cardView = () => S.cardView === 'new' ? ncHtml() : S.cardView === 'card' && cardAt() ? cardHtml(cardAt()) : cardListHtml();

// ── camera ──────────────────────────────────────────────────────────────────
// Each opening is numbered, and any stop or later opening makes it stale. A stale one stops its own
// camera when it arrives: two openings across one permission prompt, or a close during it, left a
// camera running that nothing held and nothing could stop (audit of 2026-10-31).
async function openScan(mode) {
  stopCamera(); const gen = scanGen;
  const sp = W.requestCamera(); sp.catch(() => {}); // inside the click: Safari needs the gesture
  if (mode === 'sig' && reader) reader.reset();
  if (mode === 'signed') { bcReader = bcReader || W.newReader(); bcReader.reset(); }
  if (mode === 'kpub' || mode === 'desc' || mode === 'cardBackup' || mode === 'message') { impReader = impReader || W.newReader(); impReader.reset(); }
  set({ scanner: mode, scanMsg: 'Starting camera…', scanPct: 0, scanDots: null, scanErr: '' }); render();
  const live = () => gen === scanGen && S.scanner === mode;
  try {
    const stream = await sp;
    if (!live()) { stream.getTracks().forEach(t => t.stop()); return; }
    const stop = await W.camera($('video'), onCode, stream);
    if (!live()) { stop(); return; }
    stopCam = stop;
    set({ scanMsg: mode === 'sig' || mode === 'signed' ? 'Hold your device’s signed QR inside the frame' : 'Hold the code inside the frame' });
  } catch (e) {
    if (!live()) return;
    set({ scanMsg: '', scanErr: e && e.name === 'NotAllowedError' ? 'Camera permission was denied. Allow it in the browser’s site settings, then try again.' : W.errMsg(e) });
  }
}
function stopCamera() { scanGen++; if (stopCam) { stopCam(); stopCam = null; } }
function closeScan() { stopCamera(); set({ scanner: null }); }
// A frame of several taken: the count, and which frames are in, a dot a frame as the unit's scan screen
// draws them (Kaspian, 2026-11-08: on a long reply the page could not tell which frame it had missed).
const partial = (rd, t) => set({ scanPct: Math.round(t.have / t.need * 100), scanMsg: 'Frame ' + t.have + ' of ' + t.need, scanDots: { need: t.need, got: rd.received() } });
// A frame refused: the message, and the progress gone with the frames when the reader started over (a
// mixed set, a digest that does not match).
const fault = (rd, e) => set({ scanMsg: W.errMsg(e), ...(rd.received() ? {} : { scanPct: 0, scanDots: null }) });
function onCode(c) {
  const m = S.scanner;
  if (m === 'kpub' || m === 'desc') {
    // One code, or one frame of several: a 2-of-3 descriptor doesn't fit a single QR.
    let im = null;
    try { im = W.readImport(c); } catch (_) {
      try {
        const tk = impReader.take(c);
        if (tk.status === 'partial') { partial(impReader, tk); return; }
        if (!tk.whole) { if (tk.status === 'notAReply') set({ scanMsg: m === 'desc' ? 'Not a vault descriptor' : 'Not an account code' }); return; }
        const whole = impReader.collect(); impReader.reset(); c = whole;
      } catch (e) { fault(impReader, e); return; }
    }
    try {
      im = im || W.readImport(c); const ok = m === 'desc' ? im.kind === 'descriptor' : im.kind === 'account' || im.kind === 'descriptor';
      // Descriptor already loaded on Add vault and a vault address scanned: it's the address still missing.
      if (m === 'desc' && im.kind === 'kcc3Address' && S.descText.trim()) {
        const addr = new TextDecoder().decode(c).trim().replace(/\?.*$/, '');
        if (/^kaspa:p/i.test(addr)) { closeScan(); set({ myAddr: addr, descErr: '' }); say('Vault address added'); return; }
      }
      if (im.kind === 'signedMessage') { closeScan(); msgOpen(c); return; }
      if (!ok) { set({ scanMsg: IMPORT_MSG[im.kind] || (m === 'desc' ? 'Not a vault descriptor' : 'Not an account code') }); return; }
      closeScan(); if (m === 'desc') { const e = stageDesc(im); if (e) set({ descErr: e }); } else useImport(im, W.toHex(c));
    } catch (_) { set({ scanMsg: m === 'desc' ? 'Not a vault descriptor' : 'Not an account code' }); }
  } else if (m === 'myaddr') {
    const t = new TextDecoder().decode(c).trim().replace(/\?.*$/, '');
    try { W.checkAddress(t); closeScan(); set({ myAddr: t, descErr: '' }); } catch (_) { set({ scanMsg: 'That code is not a Kaspa address' }); }
  } else if (m === 'dest') {
    let t = new TextDecoder().decode(c).trim(), amt = ''; const q = t.indexOf('?');
    if (q >= 0) { amt = new URLSearchParams(t.slice(q + 1)).get('amount') || ''; t = t.slice(0, q); }
    try { W.checkAddress(t); closeScan(); set(amt ? { to: t, amt, max: false } : { to: t }); } catch (_) { set({ scanMsg: 'That code is not a Kaspa address' }); }
  } else if (m === 'cardBackup') {
    // One code, or the frames a signer's Show QR cycles: a card with a recovery wallet is past one code.
    const notCard = () => set({ scanMsg: 'That code is not a savings card’s backup' }), line = /^savings_v1\(/i;
    let t = new TextDecoder().decode(c).trim();
    if (!line.test(t)) {
      try {
        const tk = impReader.take(c);
        if (tk.status === 'partial') { partial(impReader, tk); return; }
        if (!tk.whole) { if (tk.status === 'notAReply') notCard(); return; }
        t = new TextDecoder().decode(impReader.collect()).trim(); impReader.reset();
      } catch (e) { fault(impReader, e); return; }
      if (!line.test(t)) { notCard(); return; }
    }
    closeScan(); openCardLine(t);
  } else if (m === 'message') {
    // One code, or the frames a signer's MESSAGE QR cycles when the message is past one code.
    const notMsg = () => set({ scanMsg: 'That code is not a signed message' });
    if (!isRecord(c)) {
      try {
        const tk = impReader.take(c);
        if (tk.status === 'partial') { partial(impReader, tk); return; }
        if (!tk.whole) { if (tk.status === 'notAReply') notMsg(); return; }
        c = impReader.collect(); impReader.reset();
      } catch (e) { fault(impReader, e); return; }
      if (!isRecord(c)) { notMsg(); return; }
    }
    closeScan(); msgOpen(c);
  } else if (m === 'cardOwner' || m === 'cardRecovery' || m === 'cardTo') {
    const t = new TextDecoder().decode(c).trim().replace(/\?.*$/, '');
    try { W.checkAddress(t); closeScan(); set(m === 'cardOwner' ? { cOwner: t, cErr: '' } : m === 'cardRecovery' ? { cRecovery: t, cNoRec: false, cErr: '' } : { cTo: t, cBuildErr: '' }); }
    catch (_) { set({ scanMsg: 'That code is not a Kaspa address' }); }
// #full
  } else if (m === 'signed' && bcReader) {
    try {
      const t = bcReader.take(c);
      if (t.whole) { const signed = bcReader.collect(); closeScan(); bcTake(signed); }
      else if (t.status === 'partial') partial(bcReader, t);
      else if (t.status === 'notAReply') set({ scanMsg: 'That code is not a signed transaction from a signer' });
    } catch (e) { fault(bcReader, e); }
  } else if (m === 'sig' && reader) {
    try {
      const t = reader.take(c);
      if (t.whole) { const reply = reader.collect(); closeScan(); takeReply(reply); }
      else if (t.status === 'partial') partial(reader, t);
      else if (t.status === 'notAReply') set({ scanMsg: 'That code is not a signer reply' });
    } catch (e) { fault(reader, e); }
// #end
  }
}

// ── actions ─────────────────────────────────────────────────────────────────
/* #hosted
// The landing's warning (index.html): up at every start, and again after Lock & forget.
function showWarn() { $('warn').hidden = false; $('warnOk').focus(); }
showWarn();
#end */
const ACT = {
  /* #hosted
  warnOk: () => { $('warn').hidden = true; },
  #end */
  import: importPaste, scan: m => openScan(m), closeScan, lock, rail: () => { railByHand = true; set({ railOpen: !S.railOpen }); },
  ws: () => set({ railOpen: true }),
  useWallet: i => { const w = wallets[+i]; if (w && w !== acct) activate(w); },
  editName: i => { const w = wallets[+i]; if (w) startEdit('w', +i, w.name === w.auto ? '' : w.name, w); },
  editLabel: a => startEdit('a', a, labelOf(a)), saveEdit, cancelEdit: () => set({ edit: null, editText: '' }),
  removeWallet: i => removeWallet(+i), importDesc, copyDesc: () => acct && acct.desc && copy(acct.desc, 'Descriptor copied'),
// #full
  showPartial: () => { if (!merged) return; try { set({ frames: W.requestCodes(merged, reqFmt), frame: 0, batch: 0, playing: true, qrMode: 'partial', sub: 1 }); } catch (e) { say(W.errMsg(e)); } },
  showRequest: () => set({ frames: reqFrames, frame: 0, batch: 0, playing: true, qrMode: 'request' }),
// #end
  sec: id => { goto(id, id === S.sec ? S.sub : id === 'send' && S.reqInfo ? (S.check ? 3 : 1) : 0); if (id === 'covenants' && netAge() >= NET_EVERY) readNetClock(); },
  sub: i => { if (S.sec === 'vaults') set({ descNote: '' }); goto(S.sec, +i); }, goto: a => { const [id, i] = a.split(':'); goto(id, +i); },
  toImport: () => set({ gated: true, railOpen: railRoom() && S.railOpen }), resync: () => sync(),
  // Add wallet: the scanner straight over the screen in use, the drawer shut on a phone.
  scanWallet: () => { if (!railRoom()) set({ railOpen: false }); openScan('kpub'); },
  cancelSync: () => { if (acct && acct.abort) { acct.abort.aborted = true; say('Stopping after this batch…'); } },
  recvAt: i => set({ recvIdx: +i }),
  histOpen: id => set({ histOpen: S.histOpen === id ? null : id }), histMore: () => loadHist(acct, false), copyTx: id => copy(id, 'Transaction ID copied'),
  prevRecv: () => set({ recvIdx: Math.max(0, S.recvIdx - 1) }), nextRecv: () => set({ recvIdx: S.recvIdx + 1 }),
  copyRecv: () => acct && copy(addrAt(0, S.recvIdx), 'Address copied'),
// #full
  max: () => set({ max: !S.max, buildErr: '' }), fee: k => pickFee('fee', k), cc: () => set({ cc: !S.cc }),
  coin: k => { const n = new Set(S.sel || []); n.has(k) ? n.delete(k) : n.add(k); set({ sel: n.size ? n : null }); }, clearSel: () => set({ sel: null }),
  build: buildTx, restart, cons: buildCons, consMode: m => set({ consMode: m, buildErr: '' }), consFee: k => pickFee('consFee', k), fmt: k => set({ fmt: k, buildErr: '' }),
  consNext: () => { consFor = acct; set({ consNext: true }); say('Re-syncing, then building the next round…'); sync(); }, copyUnsigned: () => reqBytes && copy(reqFmt === 'pskb' ? reqText : W.toHex(reqBytes), 'Unsigned ' + FMTN[reqFmt] + ' copied'),
// #end
  play: () => set({ playing: !S.playing }), prev: () => { const [a, z] = span(); set({ playing: false, frame: S.frame - 1 < a ? z - 1 : S.frame - 1 }); }, next: () => { const [a, z] = span(); set({ playing: false, frame: S.frame + 1 >= z ? a : S.frame + 1 }); },
  batchPrev: () => toBatch(-1), batchNext: () => toBatch(1),
// #full
  verifyPasted: () => { try { const t = S.sigHex.trim(); takeReply(/^pskb/i.test(t) ? W.textBytes(t) : W.fromHex(t)); } catch (e) { set({ sigErr: W.errMsg(e) }); } },
  broadcast: doBroadcast,
// #end
  msgRead: msgPasted, msgFile, msgClear: () => set({ ...MSG0 }), msgCopy: () => S.msg && copy(S.msg.address, 'Address copied'), relCopy: () => copy(RELEASE, 'Address copied'), recCopy: k => copy(RECORD[k], k === 'id' ? 'Covenant id copied' : k === 'hash' ? 'Hash copied' : 'Address copied'),
// #full
  bcRead: bcPasted, bcShow, bcHide: () => set({ bcFrames: [], bcErr: '' }), bcClear, bcBroadcast, bcCopy: () => bcBytes && copy(bcText(), 'Signed ' + FMTN[S.bc.fmt] + ' copied'),
// #end
  // Only what the page's own rules (index.html, connect-src) let it reach: https for the REST API; wss for a
  // node, or ws to this computer alone. Anything else would fail on every request, with nothing said.
  saveApi: () => { const u = S.apiDraft.trim().replace(/\/+$/, ''); if (u && !/^https:\/\/\S+$/.test(u)) { say('Enter an https:// address: the page can’t reach plain http'); return; } useApi(u); },
  useDefaultApi: () => useApi(''),
  saveNode: () => { const u = S.nodeDraft.trim(); if (u && !/^(wss:\/\/\S+|ws:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/\S*)?)$/.test(u)) { say('Enter a wss:// address, or ws:// on this computer (localhost, 127.0.0.1): the page can’t reach plain ws elsewhere'); return; } set({ nodeOwn: u, nodeDraft: u }); node.connect(u, S.nodeEnc); say(u ? 'Connecting to your node…' : 'Using a public node'); },
  nodeEnc: e => set({ nodeEnc: e }),
  node: () => { const n = S.node.state; if (n === 'on' || n === 'connecting' || n === 'error') { node.close(); set({ node: { state: 'off' } }); } else node.connect(S.nodeOwn, S.nodeEnc); },
  explorer: i => set({ explorer: +i }),
  saveExplorer: () => { const u = S.explorerDraft.trim(); if (!/^https:\/\/\S+$/.test(u)) { say('Enter an https URL'); return; } set({ explorerCustom: u }); say('Explorer set'); },
  speed: i => set({ ms: presetMs(+i) }), size: i => set({ size: +i }),
  cardNew: () => { fresh = null; set({ ...NC0, cardView: 'new', cOwner: acct && !acct.group ? addrAt(0, S.nextRecv) : '' }); }, cardList: () => set({ cardView: 'list', cBuildErr: '' }),
  cardShow: i => { const c = cards[+i]; if (!c) return; set({ cardView: 'card', cardSel: +i, cTo: '', cBuildErr: '', cPane: null, cUtx: false }); cardSync(c); },
  cardRemove: i => { const c = cards[+i]; if (!c) return; if (c.stop) c.stop.aborted = true; cards.splice(+i, 1); set({ cardView: 'list', cardSel: null }); say('Card removed from this session'); },
  cardLine: () => openCardLine(S.cLine), cardMine: () => { if (acct && !acct.group) set({ cOwner: addrAt(0, S.nextRecv), cErr: '' }); },
  cardSync: () => cardSync(cardAt()), cardPane: p => set({ cPane: p || null, frame: 0, batch: 0, playing: true }), cardUtx: () => set({ cUtx: !S.cUtx }),
// #full
  cardClaim: buildClaim, cFee: k => pickFee('cFee', k),
// #end
  editCard: i => { const c = cards[+i]; if (c) startEdit('c', +i, c.name === c.auto ? '' : c.name, c); },
  cardCopy: () => { const c = cardAt(); if (c) copy(c.address, 'Card address copied'); }, cardCopyLine: () => { const c = cardAt(); if (c) copy(c.line, 'Backup copied'); },
// #full
  cardDeposit: () => depositTo(cardAt()),
// #end
  ncNext, ncBack, ncPreset, ncDone, ncNoRec: () => set({ cNoRec: !S.cNoRec, cErr: '' }), ncSaveLine: () => { if (fresh) saveLine(fresh); }, cardSaveLine: () => { const c = cardAt(); if (c) saveLine(c); },
// #full
  ncDeposit,
// #end
  ncCopy: () => { if (fresh) copy(fresh.address, 'Card address copied'); }, ncCopyLine: () => { if (fresh) copy(fresh.line, 'Backup copied'); },
  book: b => { if (!acct || !BOOK[b]) return; bookT0 = performance.now(); set({ book: b }); }, bookClose: () => set({ book: null }),
  bookPick: a => { const b = S.book; if (!b) return; set({ book: null, [b]: a, ...(b === 'to' ? { buildErr: '' } : b === 'cTo' ? { cBuildErr: '' } : { cErr: '' }) }); },
};

// ── rendering ───────────────────────────────────────────────────────────────
const seg = (items, act) => `<div class="seg">${items.map(o => `<button class="${o.on ? 'on' : ''}" data-act="${act}" data-arg="${esc(o.arg)}">${o.html}</button>`).join('')}</div>`;
const rows = r => r.map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td class="r mono">${esc(v)}</td></tr>`).join('');
const rowsH = r => r.map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td class="r">${v}</td></tr>`).join('');
// An address as the signer shows it: the first and last 5 after kaspa: in teal, always in full.
const kad = a => { a = String(a || ''); if (!/^kaspa:/i.test(a) || a.length < 17) return `<span class="kad">${esc(a)}</span>`; const b = a.slice(6), k = Math.ceil(a.length / 2) - 6; return `<span class="kad"><span class="l"><span class="p">kaspa:</span><b>${esc(b.slice(0, 5))}</b>${esc(b.slice(5, k))}</span><span class="l">${esc(b.slice(k, -5))}<b>${esc(b.slice(-5))}</b></span></span>`; };
// #full
function ownOf(a) {
  const ri = S.reqInfo;
  if (ri && ri.changeTo === a) return { chain: 1, index: ri.changeIdx, cosigner: acct && acct.me || 0 };
  return S.chg.find(x => x.address === a) || S.recv.find(x => x.address === a) || null;
}
// The receive index of `a` when it is one of a single-key wallet's own receive addresses found here: a
// payment the device shows as YOURS (W.build's `own`).
const ownRecv = a => { if (!acct || acct.group) return null; const m = S.recv.find(x => x.address === a); return m ? m.index : null; };
const whoTag = a => { const m = ownOf(a), g = acct && acct.group; if (m) return `<span class="tag tag-neutral">yours · ${m.chain ? 'change' : 'receive'} #${m.index}${g && m.cosigner !== (acct.me || 0) ? ' · Cosigner ' + m.cosigner : ''}</span>`; return `<span class="tag tag-neutral">${S.reqInfo && S.reqInfo.to === a && !S.reqInfo.cons ? 'destination' : 'external'}</span>`; };
const outCell = (a, extra) => `<div class="outv">${kad(a)}<span class="row">${whoTag(a)}${extra ? `<span class="mono">${esc(extra)}</span>` : ''}</span></div>`;
// #end
// A QR in frames, with its player: the request on Send, a partly signed copy on Broadcast, a card's backup.
// Past BATCH frames they cycle a batch at a time, the unit's dots saying which are still missing, and the
// batch buttons move on or back, round from the last to the first (Kaspian, 2026-11-01: on 46 frames a
// single missed one took a long wait to come round again). `still`: no speed slider, the page's own speed
// and frame by frame only (a card's backup, new or kept, a frame or two, 2026-11-04).
const player = (frames, alt, still) => {
  const n = frames.length, [a, z] = span(n), many = n > BATCH;
  return `<div class="qrw s${S.size}"><div class="qr pulse"><img id="qrImg" src="${esc(frames[S.frame] || '')}" alt="${esc(alt)}"></div>
${n > 1 ? `<div class="player"><button class="btn btn-secondary btn-icon" data-act="prev" title="Previous frame"><i class="ph ph-skip-back"></i></button><button class="btn btn-secondary btn-icon" data-act="play" title="Play / pause"><i class="ph ${S.playing ? 'ph-pause' : 'ph-play'}"></i></button><button class="btn btn-secondary btn-icon" data-act="next" title="Next frame"><i class="ph ph-skip-forward"></i></button><label for="qrRange" class="sr">QR frame</label><input id="qrRange" type="range" min="${a}" max="${z - 1}" value="${S.frame}"><span id="qrNum" class="mono small muted">${S.frame + 1}/${n}</span></div>
${still ? '' : `<div class="speed"><label for="qrSpeed" class="sr">Frame speed</label><input id="qrSpeed" type="range" min="${MS_MIN}" max="${MS_MAX}" step="${MS_STEP}" value="${MS_MIN + MS_MAX - S.ms}" title="Frame speed"></div>`}` : ''}
${many ? `<div class="batch"><span class="mono small">${z - a > 1 ? `Frames ${a + 1}–${z}` : `Frame ${z}`} of ${n}</span><button class="btn btn-secondary tall" data-act="batchPrev"><i class="ph ph-skip-back"></i>Previous batch</button><button class="btn btn-secondary tall" data-act="batchNext">Next batch<i class="ph ph-skip-forward"></i></button></div>` : ''}</div>`;
};
const head = (sec, sub) => `<div><div class="crumb">${esc(sec)}</div><h2>${esc(sub)}</h2></div>`;
const syncLine = () => !acct ? 'No wallet imported' : S.sync === 'running' ? S.syncMsg : S.sync === 'done' ? 'Synced ' + new Date(S.syncAt).toLocaleTimeString() + ' · ' + hostOf(S.api) + (S.via ? ' · coins from ' + S.via : '') : S.sync === 'error' ? 'Not synced' : 'Waiting';
const emptyMsg = () => !acct ? 'Import a kpub or add a vault to see this.' : S.sync === 'running' ? S.syncMsg : S.sync === 'done' ? 'Nothing here yet.' : 'Not synced yet.';
function nodeInfo() {
  const n = S.node;
  return {
    dot: n.state === 'on' ? 'on' : n.state === 'connecting' ? 'wait' : n.state === 'error' ? 'bad' : '',
    label: n.state === 'on' ? (n.own ? 'your node' : hostOf(n.url)) : n.state === 'connecting' ? 'connecting…' : 'REST only',
    detail: n.state === 'on' ? (n.own ? 'Your node · ' : 'Public · ') + hostOf(n.url) + (n.enc ? ' · ' + (n.enc === 'borsh' ? 'Borsh' : 'JSON') : '') + (n.version ? ' · v' + n.version : '') + (n.own ? (n.utxoIndex ? ' · UTXO index on' : ' · no UTXO index') : '') : n.state === 'connecting' ? (n.own ? 'Trying your node…' : 'Finding a public node…') : n.state === 'error' ? 'Unavailable — ' + n.error + ' · retrying' : 'Off — using the REST API only',
    btn: n.state === 'off' ? 'Connect' : 'Disconnect',
  };
}

// #full
// Broadcast's two screens over the one transaction held: Signed transaction reads it and broadcasts it once
// complete; Merge copies adds cosigners' copies to it and shows it to the next cosigner.
const bcTag = a => { const m = acct && (S.chg.find(x => x.address === a) || S.recv.find(x => x.address === a)); return m ? `<span class="tag tag-neutral">yours · ${m.chain ? 'change' : 'receive'} #${m.index}</span>` : ''; };
const bcVerified = b => `<div class="verified"><i class="ph ph-shield-check"></i>${b.required ? b.present + ' of ' + b.required + ' cosigner signatures' : b.signatures + ' signature' + (b.signatures === 1 ? '' : 's')} verified over the transaction itself</div>`;
const bcTable = b => `<table class="table"><tbody>${rowsH(b.outputs.map((o, i) => ['Output ' + (i + 1), `<div class="outv">${kad(o.address)}<span class="row">${bcTag(o.address)}<span class="mono">${esc(fk(o.value) + ' KAS')}</span></span></div>`])
  .concat([['Fee', esc(fk(b.fin ? b.fin.fee : b.fee, 0) + ' KAS')], ['Inputs', b.inputs], ['Format', FMTN[b.fmt]]]).concat(b.required ? [['Signatures', b.present + ' of ' + b.required]] : [])
  .concat([['Transaction id', b.fin ? `<span class="mono break">${esc(b.fin.id)}</span>` : '—']]))}</tbody></table>`;
const bcIntake = more => `<button class="cta" data-act="scan" data-arg="signed"${S.boot !== 'ready' ? ' disabled' : ''}><span class="ic"><i class="ph ph-camera"></i></span><span><b>${more ? 'Scan another copy' : 'Scan signed transaction'}</b><small>${more ? 'A cosigner’s copy of this transaction, merged with the one held' : 'Its SIGNED TX QR on your signer, or a copy opened from its card'}</small></span><i class="ph ph-arrow-right"></i></button>
<div class="field"><label for="f-bc">${more ? 'or paste another copy' : 'or paste a signed transaction'}</label><textarea id="f-bc" class="input mono" rows="3" placeholder="signed hex, or PSKB…" data-bind="bcText" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">${esc(S.bcText)}</textarea></div>
${S.bcErr ? `<div class="err">${esc(S.bcErr)}</div>` : ''}
<div class="row"><button class="btn btn-primary" data-act="bcRead"${S.boot !== 'ready' ? ' disabled' : ''}>${more ? 'Merge' : 'Read'}<i class="ph ph-arrow-right"></i></button></div>`;
function bcView(sub) {
  const b = S.bc;
  if (!b) return `<div class="stack"><p class="lead">${sub ? 'Scan or paste the first copy of a vault’s transaction; each other cosigner’s copy is then merged with it, however many each one carries.' : 'A transaction signed already, to broadcast now or later: a single-key send, or a vault’s with every signature it needs.'} Nothing is kept: leaving the page forgets it.</p>${bcIntake(false)}</div>`;
  if (sub === 0) {
    if (S.bcSent) { const url = txLink(S.bcSent.txid); return `<div class="done"><div class="done-ring"><i class="ph ph-check"></i></div><b>Transaction broadcast</b><div class="small muted">Submitted through ${esc(S.bcSent.via)}.</div>${url ? `<a class="mono small break" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(S.bcSent.txid)}</a>` : `<span class="mono small break">${esc(S.bcSent.txid)}</span>`}<button class="btn btn-primary" data-act="bcClear">Broadcast another</button></div>`; }
    let h = `<div class="stack">${bcVerified(b)}${bcTable(b)}`;
    if (!b.complete) h += `<div class="banner"><i class="ph ph-warning-circle"></i><span>${b.required ? 'Partly signed: ' + b.present + ' of ' + b.required + '. It can be broadcast once ' + b.required + ' have signed.' : 'Not every input is signed yet: it can’t be broadcast.'}</span></div>
<div class="row">${b.required ? '<button class="btn btn-primary" data-act="goto" data-arg="broadcast:1"><i class="ph ph-git-merge"></i>Merge another copy</button><button class="btn btn-secondary" data-act="bcShow"><i class="ph ph-qr-code"></i>Pass to next cosigner</button>' : ''}<button class="btn btn-ghost" data-act="bcClear">Clear</button></div>`;
    else h += `${b.finErr ? `<div class="err">It can’t be broadcast: ${esc(b.finErr)}</div>` : ''}${S.bcSendErr ? `<div class="err">${esc(S.bcSendErr)}</div>` : ''}
<div class="row"><button class="btn btn-secondary" data-act="bcClear">Clear</button><button class="btn btn-primary" data-act="bcBroadcast"${S.bcSending || !b.fin ? ' disabled' : ''}><i class="ph ${S.bcSending ? 'ph-circle-notch spin' : 'ph-broadcast'}"></i>${S.bcSending ? 'Broadcasting…' : 'Broadcast'}</button></div>`;
    return h + '</div>';
  }
  if (!b.required) return `<div class="stack"><div class="banner"><i class="ph ph-check-circle"></i><span>A single-key transaction: there is nothing to merge.</span></div><div class="row"><button class="btn btn-primary" data-act="goto" data-arg="broadcast:0">Review and broadcast<i class="ph ph-arrow-right"></i></button><button class="btn btn-ghost" data-act="bcClear">Clear</button></div></div>`;
  const sigs = `<div class="sigs"><b>${b.present} of ${b.required} signed</b><div class="bar"><div id="bcFill"></div></div><div class="hint">${b.complete ? 'Every signature it needs is here.' : 'Each cosigner signs on their own device. Merge their copies here, or pass the partly signed QR from one cosigner to the next.'}</div></div>`;
  const tools = `<button class="btn btn-secondary" data-act="bcCopy"><i class="ph ph-copy"></i>Copy ${b.complete ? 'signed' : 'partly signed'}</button><button class="btn btn-ghost" data-act="bcClear">Clear</button>`;
  if (b.complete) return `<div class="stack">${sigs}${bcVerified(b)}<div class="row"><button class="btn btn-primary" data-act="goto" data-arg="broadcast:0">Review and broadcast<i class="ph ph-arrow-right"></i></button>${tools}</div></div>`;
  if (S.bcFrames.length) return `<div class="two">${player(S.bcFrames, 'Partly signed transaction QR')}<div class="grow">${sigs}<p class="lead">Partly signed, ${b.present} of ${b.required}. Show this to the next cosigner’s device; its signed QR then carries every signature so far. Scan it here to take it.</p>
${S.bcErr ? `<div class="err">${esc(S.bcErr)}</div>` : ''}<div class="row"><button class="btn btn-primary" data-act="scan" data-arg="signed"><i class="ph ph-camera"></i>Scan their copy</button><button class="btn btn-secondary" data-act="bcHide">Hide QR</button>${tools}</div></div></div>`;
  return `<div class="stack">${sigs}${bcIntake(true)}<div class="row"><button class="btn btn-secondary" data-act="bcShow"><i class="ph ph-qr-code"></i>Pass to next cosigner</button>${tools}</div></div>`;
}
// #end

function viewHtml() {
  const sec = SECS.find(x => x.id === S.sec), v = (id, i) => S.sec === id && S.sub === i;
  if (S.sec !== 'covenants') ncKey = ''; // Covenants' screens, come back to, come in again
  let h = head(sec.label, sec.subs[S.sub][0]);
  if (!acct && S.sec !== 'broadcast' && S.sec !== 'messages') h += `<div class="banner"><i class="ph ph-eye"></i><span>Exploring without a wallet. Import a kpub or add a vault ${HOSTED ? 'to see balances and addresses.' : 'to see balances, addresses and send.'}</span><button class="btn btn-primary" data-act="toImport">Import kpub</button>${S.sec === 'vaults' ? '' : '<button class="btn btn-secondary" data-act="goto" data-arg="vaults:1">Add vault</button>'}</div>`;
  const g = acct && acct.group, me = g ? acct.me || 0 : 0, mine = a => !g || a.cosigner === me;
  if (S.syncErr) h += `<div class="alert"><i class="ph ph-warning-circle"></i><span>${esc(S.syncErr)}</span><button class="btn btn-secondary" data-act="resync">Retry</button>${S.apiOwn ? '<button class="btn btn-secondary" data-act="useDefaultApi">Use api.kaspa.org</button>' : ''}</div>`;
  if (acct && S.capped && S.sec === 'wallet') h += `<div class="alert"><i class="ph ph-warning-circle"></i><span>Address discovery stopped at ${W.MAX_INDEX.toLocaleString('en-US')} addresses on one branch, all of them reported as used. Coins on later addresses aren’t shown. If this wallet never used that many, ${esc(hostOf(S.api))} is answering wrongly.</span></div>`;
  const running = S.sync === 'running';

  if (v('wallet', 0)) {
    const first = acct ? addrAt(0, 0) : '';
    let sendBtn = '';
// #full
    sendBtn = '<button class="btn btn-primary" data-act="goto" data-arg="send:0"><i class="ph ph-paper-plane-tilt"></i>Send</button>';
// #end
    if (acct) h += `<div class="namerow">${nameHtml(acct, wallets.indexOf(acct))}</div>`;
    h += `<div class="bal"><b>${fk(S.balance)}</b><span class="muted">KAS</span></div>
<div class="status"><i class="ph ${running ? 'ph-circle-notch spin' : S.sync === 'done' ? 'ph-check-circle' : 'ph-clock'}"></i>${esc(syncLine())}</div>
<div class="row">${sendBtn}<button class="btn btn-secondary" data-act="goto" data-arg="wallet:1"><i class="ph ph-arrow-down-left"></i>Receive</button>${running ? '<button class="btn btn-secondary" data-act="cancelSync"><i class="ph ph-x"></i>Cancel sync</button>' : `<button class="btn btn-secondary btn-icon" data-act="resync" title="Refresh"${acct ? '' : ' disabled'}><i class="ph ph-arrows-clockwise"></i></button>`}${g ? '<button class="btn btn-ghost" data-act="copyDesc"><i class="ph ph-copy"></i>Copy descriptor</button>' : ''}</div>
<table class="table"><tbody>${rows((g ? [['Vault', sh(first, 8)], ['Policy', g.required + ' of ' + g.total + ' cosigners'], ['You', 'Cosigner ' + me], ['Path', "m/45'"]] : [['Account', sh(first, 8) || '—'], ['Path', "m/44'/111111'/0'"]]).concat([['Receive addresses used', S.recv.filter(a => a.used && mine(a)).length], ['Change addresses used', S.chg.filter(a => a.used && mine(a)).length], ['Coins', S.utxos.length]]))}</tbody></table>${g ? '<div class="hint">Set by the vault address from your signer. Your receive and change addresses come from your own branch; balance and coins cover every cosigner’s. To use another cosigner, add the vault again with an address from that signer.</div>' : ''}`;
    if (acct && S.sync === 'done') { const H = acct.hist, l = H ? W.historyList(H.h).slice(0, 5) : []; if (H && H.err) h += `<div class="alert"><i class="ph ph-warning-circle"></i><span>${esc(H.err)}</span><button class="btn btn-secondary" data-act="histMore">Retry</button></div>`; h += `<div class="row"><b>Recent</b><button class="btn btn-ghost" data-act="goto" data-arg="wallet:4">See all</button></div>${histTable(l, histEmpty(H), false)}${histNote(H)}`; }
  }
  if (v('wallet', 4)) {
    const H = acct && acct.hist, list = H ? W.historyList(H.h) : [];
    if (H && H.err) h += `<div class="alert"><i class="ph ph-warning-circle"></i><span>${esc(H.err)}</span><button class="btn btn-secondary" data-act="histMore">Retry</button></div>`;
    h += histTable(list, histEmpty(H), true) + histNote(H);
    if (H && W.histMore(H.h) && list.length) h += `<div class="row"><button class="btn btn-secondary" data-act="histMore"${H.loading ? ' disabled' : ''}>${H.loading ? '<i class="ph ph-circle-notch spin"></i>Loading…' : 'Load more'}</button></div>`;
    h += '<div class="hint">From the REST API: a node keeps no address history. Amounts are what your addresses got minus what they spent. This session only.</div>';
  }
  if (v('wallet', 1)) {
    let addr = '', used = false;
    if (acct) { addr = addrAt(0, S.recvIdx); if (qrFor !== addr) { qrFor = addr; try { qrUrl = W.textQr(addr); } catch (_) { qrUrl = ''; } } const e = S.recv.find(a => mine(a) && a.index === S.recvIdx); used = !!(e && e.used); }
    const isNext = !!acct && S.recvIdx === S.nextRecv && S.sync === 'done';
    const spare = acct && S.sync === 'done' ? Array.from({ length: W.SPARE }, (_, k) => S.nextRecv + k) : [];
    h += `<div class="two"><div class="qrw recv"><div class="qr">${acct && qrUrl ? `<img src="${esc(qrUrl)}" alt="Receive address QR">` : ''}</div></div>
<div class="grow"><div class="row small muted">${g ? 'Cosigner ' + me + ' · receive' : 'Receive'} · index ${S.recvIdx}${used ? ' <span class="tag tag-neutral">used</span>' : ''}${isNext ? ' <span class="tag tag-neutral">next unused</span>' : ''}</div>
<div class="addr">${esc(addr || 'kaspa:… — import a kpub to derive addresses')}</div>
${acct ? (isEdit('a', addr) ? editor('Label for this address') : `<div class="row small">${labelOf(addr) ? `<span class="tag tag-neutral">${esc(labelOf(addr))}</span>` : '<span class="muted">No label</span>'}<button class="btn btn-ghost" data-act="editLabel" data-arg="${esc(addr)}"><i class="ph ph-pencil-simple"></i>${labelOf(addr) ? 'Edit label' : 'Add label'}</button></div>`) : ''}
${spare.length ? `<div class="row small"><span class="muted">Fresh</span>${spare.map(i => `<button class="btn ${i === S.recvIdx ? 'btn-secondary' : 'btn-ghost'}" data-act="recvAt" data-arg="${i}">#${i}</button>`).join('')}</div>` : ''}
<div class="row"><button class="btn btn-primary" data-act="copyRecv"${acct ? '' : ' disabled'}><i class="ph ph-copy"></i>Copy</button><button class="btn btn-secondary" data-act="prevRecv"${!acct || S.recvIdx === 0 ? ' disabled' : ''}>‹ Prev</button><button class="btn btn-secondary" data-act="nextRecv"${acct ? '' : ' disabled'}>Next ›</button></div>
<div class="hint">${g ? 'A vault address: spending it needs ' + g.required + ' of ' + g.total + ' cosigners. Check it on a cosigner’s device before sharing.' : 'Use a fresh address for each payment. Check it against your device screen before sharing.'}</div></div></div>`;
  }
  if (v('wallet', 2)) h += `<table class="table"><thead><tr><th>Index</th><th>Address</th><th class="r">KAS</th></tr></thead><tbody>${S.chg.filter(mine).map(a => `<tr><td class="mono">${a.index}</td><td class="${a.used ? '' : 'dim'}">${addrCell(a.address, 8)}</td><td class="r mono">${a.bal ? fk(a.bal) : '—'}</td></tr>`).join('') || `<tr class="empty-row"><td colspan="3">${esc(emptyMsg())}</td></tr>`}</tbody></table>`;
// #full
  if (v('wallet', 3) && acct && S.utxos.length > 1) {
    const ns = S.sel ? S.sel.size : 0, mi = W.maxInputs(), n = S.consMode === 'sel' ? Math.min(ns, mi) : Math.min(S.utxos.length, mi);
    h += `<div class="box open"><div class="box-head">Consolidate<span>${S.utxos.length} coins</span></div><div class="box-body stack">
${seg([['small', 'Smallest first'], ['sel', 'Selected' + (ns ? ' (' + ns + ')' : '')]].map(([k, l]) => ({ on: S.consMode === k, arg: k, html: l })), 'consMode')}
${feeSeg(S.consFee, 'consFee')}
${fmtSeg()}
${S.buildErr ? `<div class="err">${esc(S.buildErr)}</div>` : ''}
<div class="row"><button class="btn btn-primary" data-act="cons"${running || n < 2 ? ' disabled' : ''}><i class="ph ph-coins"></i>Consolidate ${n} coins</button></div>
<div class="hint">${S.consMode === 'sel' && ns < 2 ? 'Tick at least 2 coins below. ' : ''}Sends them to your next fresh change address (change #${S.nextChg} on your device) in one transaction of up to ${mi} inputs, signed as usual. Larger sets take several rounds.</div></div></div>`;
  }
  // With Selected on, each coin is ticked here: the same selection as Send › Coin control (2026-11-01).
  if (v('wallet', 3)) {
    const pick = !!acct && S.consMode === 'sel' && S.utxos.length > 1, sel = S.sel || new Set();
    const tick = u => { const k = u.txId + ':' + u.index, on = sel.has(k); return `<td class="tick"><button class="tickbtn${on ? ' on' : ''}" data-act="coin" data-arg="${esc(k)}" aria-pressed="${on}" title="${on ? 'Selected: click to leave it out' : 'Select this coin'}"><i class="ph ${on ? 'ph-check-square' : 'ph-square'}"></i></button></td>`; };
    h += `<table class="table"><thead><tr>${pick ? '<th class="tick"><span class="sr">Selected</span></th>' : ''}<th>Outpoint</th><th>Address</th><th class="r">KAS</th></tr></thead><tbody>${S.utxos.map(u => `<tr>${pick ? tick(u) : ''}<td class="mono">${esc(sh(u.txId, 6) + ':' + u.index)}</td><td>${addrCell(u.address, 6)}</td><td class="r mono">${fk(u.amount)}</td></tr>`).join('') || `<tr class="empty-row"><td colspan="3">${esc(emptyMsg())}</td></tr>`}</tbody></table>`;
  }
// #end
/* #hosted
  if (v('wallet', 3)) h += `<table class="table"><thead><tr><th>Outpoint</th><th>Address</th><th class="r">KAS</th></tr></thead><tbody>${S.utxos.map(u => `<tr><td class="mono">${esc(sh(u.txId, 6) + ':' + u.index)}</td><td>${addrCell(u.address, 6)}</td><td class="r mono">${fk(u.amount)}</td></tr>`).join('') || `<tr class="empty-row"><td colspan="3">${esc(emptyMsg())}</td></tr>`}</tbody></table>`;
#end */

// #full
  if (v('send', 0)) {
    const sel = S.sel || new Set(), selSum = S.utxos.filter(u => sel.has(u.txId + ':' + u.index)).reduce((a, u) => a + u.amount, 0n);
    h += `<div class="stack">
<div class="field"><label for="f-to">Destination address</label><div class="row"><input id="f-to" class="input mono" placeholder="kaspa:qr…" data-bind="to" value="${esc(S.to)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><button class="btn btn-secondary" data-act="scan" data-arg="dest"><i class="ph ph-scan"></i>Scan</button>${acct ? bookBtn('to') : ''}</div></div>
<div class="field"><label for="f-amt">Amount (KAS)</label><div class="row"><input id="f-amt" class="input" placeholder="${S.max ? 'Everything available, fee taken from it' : '0.00'}" data-bind="amt" value="${S.max ? '' : esc(S.amt)}"${S.max ? ' disabled' : ''}><button class="btn ${S.max ? 'btn-primary' : 'btn-ghost'}" data-act="max">MAX</button></div><div class="hint">Available ${fk(sel.size ? selSum : S.balance)} KAS</div></div>
${feeSeg(S.fee, 'fee')}
${fmtSeg()}
<div class="box${S.cc ? ' open' : ''}"><button class="box-head" data-act="cc">Coin control<span>${sel.size ? sel.size + ' selected · ' + fk(selSum) + ' KAS' : 'Automatic'}<i class="ph ph-caret-down"></i></span></button>${S.cc ? `<div class="box-body">${S.utxos.map(u => { const k = u.txId + ':' + u.index, on = sel.has(k); return `<button class="coin${on ? ' on' : ''}" data-act="coin" data-arg="${esc(k)}"><i class="ph ${on ? 'ph-check-square' : 'ph-square'}"></i><span class="op mono">${esc(sh(u.txId, 6) + ':' + u.index)}</span><span class="mono">${fk(u.amount)}</span></button>`; }).join('') || '<div class="box-note">No spendable coins for this account.</div>'}${sel.size ? '<button class="btn btn-ghost" data-act="clearSel">Back to automatic</button>' : ''}</div>` : ''}</div>
${S.buildErr ? `<div class="err">${esc(S.buildErr)}</div>` : ''}
<button class="btn btn-primary tall" data-act="build"${S.boot !== 'ready' || running || !S.utxos.length ? ' disabled' : ''}>Build unsigned transaction<i class="ph ph-arrow-right"></i></button></div>`;
  }
  if (v('send', 1) && S.reqInfo) {
    const ri = S.reqInfo, pt = S.part, partial = S.qrMode === 'partial';
    const lead = partial ? `Partially signed, ${pt.present} of ${pt.required}. Show this to the next cosigner’s device; their reply carries every signature so far.`
      : ri.card ? 'Point your device’s camera at this code. Before it signs, your signer shows the SAVINGS CARD page: check the card’s address, when it opens and whether it claims or recovers, then where its UTXOs go.' + (ri.card.left ? ' ' + plural(ri.card.left, 'UTXO') + ' stay in the card for the next claim.' : '')
      : g ? 'Show this to a cosigner’s device and scan their reply. Repeat with each cosigner and the replies are merged, or pass the partly signed QR from one cosigner to the next.'
      : 'Point your device\'s camera at this code. Frames stream in sequence — keep both screens steady until the unit reports a complete read, then check the amounts on its screen.';
    h += `<div class="two">${player(S.frames, (partial ? 'Partially signed' : 'Unsigned') + ' transaction QR')}
<div class="grow">${ri.cons ? `<div class="row"><span class="tag tag-neutral">Consolidation</span><span class="small muted">${ri.cons.before} → ${ri.cons.after} coins</span></div>` : ''}${ri.card ? `<div class="row"><span class="tag tag-neutral">Savings card</span><span class="small muted">${esc(ri.card.role === 'recover' ? 'Recovery' : ri.card.role === 'claim' ? 'Claim' : 'Claim or recovery')} · opened ${esc(ri.card.date)}</span></div>` : ''}<table class="table"><tbody>${rowsH([['To', outCell(ri.to)], ['Amount', esc(fk(ri.amount) + ' KAS')], ['Fee', esc(fk(ri.fee, 0) + ' KAS')], ['Change', ri.change != null ? esc(fk(ri.change) + ' KAS') : 'none']].concat(ri.change != null ? [['Change to', outCell(ri.changeTo)]] : []).concat([['Inputs', ri.inputs], ['Format', esc(FMTN[ri.fmt] + ' · ' + reqFrames.length + ' frame' + (reqFrames.length === 1 ? '' : 's'))]]).concat(pt ? [['Signatures', pt.present + ' of ' + pt.required]] : []))}</tbody></table>
${ri.rate > W.HIGH_RATE ? `<div class="err">The fee rate is unusually high: ${esc(ri.rate.toLocaleString('en-US'))} sompi/gram, ${ri.custom ? 'as you set it' : 'from the fee estimate'}. Check the fee before you sign.</div>` : ''}${ri.cons && ri.cons.warn ? '<div class="err">The fee is over 1% of what is consolidated. A lower fee or larger coins make it cheaper.</div>' : ''}<p class="lead">${lead}</p>
<div class="row"><button class="btn btn-primary" data-act="goto" data-arg="send:2">${pt && pt.present ? 'Scan next reply' : 'Scan the signature'}<i class="ph ph-arrow-right"></i></button><button class="btn btn-secondary" data-act="copyUnsigned"><i class="ph ph-copy"></i>Copy unsigned</button>${g && merged ? `<button class="btn btn-ghost" data-act="${partial ? 'showRequest' : 'showPartial'}">${partial ? 'Show unsigned request' : 'Show partially signed'}</button>` : ''}<button class="btn btn-ghost" data-act="restart">Edit</button></div></div></div>`;
  }
  if (v('send', 2)) {
    const pt = S.part, more = !!(pt && pt.present);
    h += `<div class="stack">${pt ? `<div class="sigs"><b>${pt.present} of ${pt.required} signed</b><div class="bar"><div id="sigFill"></div></div><div class="hint">${more ? 'Scan another cosigner’s reply to merge it, or pass the partly signed QR to the next cosigner.' : 'Each of ' + pt.required + ' cosigners signs on their own device.'}</div></div>` : ''}
<button class="cta" data-act="scan" data-arg="sig"><span class="ic"><i class="ph ph-camera"></i></span><span><b>${more ? 'Scan next cosigner’s reply' : 'Scan signed QR'}</b><small>${more ? 'Merged with the signatures so far' : 'Opens the full-screen camera'}</small></span><i class="ph ph-arrow-right"></i></button>
${more ? '<button class="cta" data-act="showPartial"><span class="ic"><i class="ph ph-qr-code"></i></span><span><b>Pass to next cosigner</b><small>Show the partly signed QR for them to add a signature</small></span><i class="ph ph-arrow-right"></i></button>' : ''}
<div class="field"><label for="f-sig">or paste signed reply</label><textarea id="f-sig" class="input mono" rows="3" placeholder="signed hex, or PSKB…" data-bind="sigHex" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">${esc(S.sigHex)}</textarea></div>
${S.sigErr ? `<div class="err">${esc(S.sigErr)}</div>` : ''}
<div class="row"><button class="btn btn-secondary" data-act="goto" data-arg="send:1">‹ Back to QR</button><button class="btn btn-primary" data-act="verifyPasted">Verify signature<i class="ph ph-arrow-right"></i></button></div></div>`;
  }
  if (v('send', 3) && S.check) {
    const ck = S.check;
    if (!S.sent) h += `<div class="stack"><div class="verified"><i class="ph ph-shield-check"></i>${ck.required ? ck.present + ' of ' + ck.required + ' cosigner signatures' : ck.signatures + ' signature' + (ck.signatures === 1 ? '' : 's')} verified against your request</div>
<table class="table"><tbody>${rowsH(ck.outputs.map((o, i) => ['Output ' + (i + 1), outCell(o.address, fk(o.value) + ' KAS')]).concat([['Fee', esc(fk(ck.fin ? ck.fin.fee : ck.fee, 0) + ' KAS')], ['Transaction id', ck.fin ? `<span class="mono break">${esc(ck.fin.id)}</span>` : '—']]))}</tbody></table>
${S.sendErr ? `<div class="err">${esc(S.sendErr)}</div>` : ''}
<div class="row"><button class="btn btn-secondary" data-act="goto" data-arg="send:2">‹ Back</button><button class="btn btn-primary" data-act="broadcast"${S.sending || !ck.fin ? ' disabled' : ''}><i class="ph ${S.sending ? 'ph-circle-notch spin' : 'ph-broadcast'}"></i>${S.sending ? 'Broadcasting…' : 'Broadcast'}</button></div></div>`;
    else { const url = txLink(S.sent.txid); h += `<div class="done"><div class="done-ring"><i class="ph ph-check"></i></div><b>Transaction broadcast</b><div class="small muted">Submitted through ${esc(S.sent.via)}.</div>${url ? `<a class="mono small break" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(S.sent.txid)}</a>` : `<span class="mono small break">${esc(S.sent.txid)}</span>`}${unseen() ? `<div class="alert"><i class="ph ph-warning-circle"></i><span>Not seen on the network yet: 30 seconds after the broadcast, a coin it spends is still unspent.</span><button class="btn btn-secondary" data-act="broadcast"${S.sending ? ' disabled' : ''}><i class="ph ${S.sending ? 'ph-circle-notch spin' : 'ph-broadcast'}"></i>${S.sending ? 'Broadcasting…' : 'Broadcast again'}</button></div>` : ''}${S.sendErr ? `<div class="err">${esc(S.sendErr)}</div>` : ''}${S.reqInfo && S.reqInfo.cons && S.reqInfo.cons.small && S.reqInfo.cons.after > 1 ? `<div class="small muted">${S.reqInfo.cons.after} coins left.</div><div class="row"><button class="btn btn-primary" data-act="consNext"${S.consNext ? ' disabled' : ''}><i class="ph ${S.consNext ? 'ph-circle-notch spin' : 'ph-coins'}"></i>${S.consNext ? 'Re-syncing…' : 'Next round'}</button><button class="btn btn-secondary" data-act="restart">Done</button></div>` : '<button class="btn btn-primary" data-act="restart">New transaction</button>'}</div>`; }
  }

  if (S.sec === 'broadcast') h += bcView(S.sub);
// #end

  if (v('vaults', 0)) {
    const vs = wallets.map((w, i) => [w, i]).filter(([w]) => w.group);
    h += vs.length ? `<div class="vlist">${vs.map(([w, i]) => `<div class="vrow${w === acct ? ' on' : ''}"><i class="ph ph-vault"></i><div>${nameHtml(w, i)}<span class="small muted">${w.group.required} of ${w.group.total} · ${esc(balLine(w))}</span></div><div class="row">${w === acct ? '<span class="tag tag-neutral">Active</span>' : `<button class="btn btn-secondary" data-act="useWallet" data-arg="${i}">Open</button>`}<button class="btn btn-ghost btn-icon" data-act="removeWallet" data-arg="${i}" title="Remove ${esc(w.name)}"><i class="ph ph-x"></i></button></div></div>`).join('')}</div>
<div class="row"><button class="btn btn-secondary" data-act="sub" data-arg="1"><i class="ph ph-plus"></i>Add vault</button></div><div class="hint">Vaults are kept for this session only. Reloading the page forgets them.</div>`
      : `<div class="empty"><i class="ph ph-vault"></i><b>No multisig vaults yet</b><p>Import an M-of-N vault's descriptor ${HOSTED ? 'to watch its balance.' : 'to watch its balance and spend from it. Each cosigner signs on their own device.'}</p><button class="btn btn-primary" data-act="sub" data-arg="1"><i class="ph ph-plus"></i>Add vault</button></div>`;
  }
  if (v('vaults', 1)) h += `<div class="stack"><button class="cta" data-act="scan" data-arg="desc"${S.boot !== 'ready' ? ' disabled' : ''}><span class="ic"><i class="ph ph-scan"></i></span><span><b>Scan vault descriptor</b><small>Show the vault's descriptor QR on a cosigner's device</small></span><i class="ph ph-arrow-right"></i></button>
${S.descNote ? `<div class="banner"><i class="ph ph-check-circle"></i><span>${esc(S.descNote)}</span></div>` : ''}
<div class="field"><label for="f-desc">or paste descriptor</label><textarea id="f-desc" class="input mono" rows="4" placeholder="multi_hd45(2,kpub…,kpub…,kpub…)" data-bind="descText" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">${esc(S.descText)}</textarea></div>
<div class="field"><label for="f-my">One of your vault addresses</label><div class="row"><input id="f-my" class="input mono" placeholder="kaspa:p…" data-bind="myAddr" value="${esc(S.myAddr)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><button class="btn btn-secondary" data-act="scan" data-arg="myaddr"><i class="ph ph-scan"></i>Scan</button></div><div class="hint">Scan or paste one of the vault’s addresses from your signer. It sets which cosigner you are.</div></div>
${S.descErr ? `<div class="err">${esc(S.descErr)}</div>` : ''}
<button class="btn btn-primary tall" data-act="importDesc"${S.boot !== 'ready' || !S.myAddr.trim() ? ' disabled' : ''}>Add vault<i class="ph ph-arrow-right"></i></button>
<div class="hint">Watch-only: a descriptor holds the cosigners' kpubs and the threshold, never a private key. Kept for this session only.</div></div>`;
  if (S.sec === 'covenants') h += cardView();
  if (S.sec === 'messages') h += msgView();

  if (v('settings', 0)) {
    const ni = nodeInfo(), t = exTpl(), exName = S.explorer === 2 ? (S.explorerCustom ? hostOf(S.explorerCustom) : 'not set yet') : EXPLORERS[S.explorer].label;
    let home = ''; try { home = t ? new URL(t.replace('{txid}', '')).origin : ''; } catch (_) {}
    h += `<div class="stack">
<div class="field"><div class="row"><span>Network</span><span class="tag tag-neutral">Mainnet only</span></div><div class="hint">KasSigner units and this site work on mainnet only, never testnet. On Kaspa the same keys sign on every network, and a transaction does not say which one it is for: a page or a unit set to testnet could show a real mainnet spend as test money.</div></div>
<div class="field"><label for="f-api">REST API</label><div class="row"><input id="f-api" class="input mono" data-bind="apiDraft" value="${esc(S.apiDraft)}" placeholder="https://api.kaspa.org (default)" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><button class="btn btn-primary" data-act="saveApi">Use</button></div><div class="hint">In use: ${esc(hostOf(S.api))}. Address discovery, balances and coins; any kaspa-rest-server instance works.${S.apiOwn ? ' If yours fails, nothing goes elsewhere: the sync stops and says so.' : ''} Leave empty for the default. This session only.</div></div>
<div class="field"><label for="f-node">Own node (wRPC)</label>${seg([['auto', 'Auto'], ['borsh', 'Borsh'], ['json', 'JSON']].map(([k, l]) => ({ on: S.nodeEnc === k, arg: k, html: l })), 'nodeEnc')}<div class="row"><input id="f-node" class="input mono" data-bind="nodeDraft" value="${esc(S.nodeDraft)}" placeholder="wss://my-node:8443/ws" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><button class="btn btn-primary" data-act="saveNode">Use</button></div><div class="hint">Tried first; Auto tries Borsh, then JSON. The node needs <span class="mono">--rpclisten-borsh</span> (port 17110) or <span class="mono">--rpclisten-json</span> (18110), and <span class="mono">--utxoindex</span> to serve your coins and fees, so those lookups stay off public servers. A public node takes over if yours fails, isn’t on mainnet or is still syncing. From an https page browsers only allow wss:// (or ws://localhost). This session only.</div></div>
<div class="field"><span class="flabel">Node</span><div class="panel"><span class="dot ${ni.dot}"></span><span>${esc(ni.detail)}</span><button class="btn btn-secondary" data-act="node">${ni.btn}</button></div>${S.node.ownErr ? `<div class="err">Your node: ${esc(S.node.ownErr)}. Using a public node.</div>` : ''}<div class="hint">${HOSTED ? '' : 'Broadcasts go to the node first, the REST API if it fails. '}Reconnects by itself after a drop.</div></div>
<div class="field"><span class="flabel">Block explorer</span>${seg(EXPLORERS.map((x, i) => ({ on: S.explorer === i, arg: i, html: (x.icon ? `<img src="${x.icon}" alt="">` : '<i class="ph ph-globe-simple"></i>') + esc(x.label) })), 'explorer')}
${S.explorer === 2 ? `<div class="row"><label for="f-ex" class="sr">Custom explorer address</label><input id="f-ex" class="input mono" data-bind="explorerDraft" value="${esc(S.explorerDraft)}" placeholder="https://my.explorer/tx/" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><button class="btn btn-primary" data-act="saveExplorer">Save</button></div>` : ''}
<div class="hint">Transaction links open ${home ? `<a href="${esc(home)}" target="_blank" rel="noopener noreferrer">${esc(exName)}</a>` : esc(exName)}</div></div></div>`;
  }
  if (v('settings', 1)) h += `<div class="stack"><div class="line"><span>Frame speed <span class="small muted">· ${S.ms} ms a frame</span></span>${seg(SPEEDS.map(([l], i) => ({ on: S.ms === presetMs(i), arg: i, html: l })), 'speed')}</div><div class="line"><span>QR size</span>${seg(SIZES.map((l, i) => ({ on: S.size === i, arg: i, html: l })), 'size')}</div></div>`;
  if (v('settings', 2)) h += `<div class="stack"><div class="small muted">Clears every wallet, vault and card, and the settings, from this page. KasSigner SDK ${esc(S.sdkVer)}.</div><div><button class="btn btn-secondary" data-act="lock"><i class="ph ph-lock-simple"></i>Lock &amp; forget</button></div></div>`;
  return h;
}

// Written only when it changed: rewriting the rail and the menu on every render replayed their fade-in,
// a blink every half second while the history was read (Kaspian, 2026-11-01).
const put = (el, html) => { if (el.__html === html) return false; el.innerHTML = html; el.__html = html; return true; };
// A reply's frames as the unit's scan screen shows them: a dot a frame, teal once in, grey while missing,
// five a row and two rows a block of ten, the dots smaller as the rows grow (Kaspian, 2026-11-08). Beside
// the square the blocks run down one column, as on the unit; under it, on a phone held upright, they go in
// centred lines of up to three: the full blocks first and a short block on the line below, until a line
// of three is full, after which they fill the next line left to right. A block's short row starts at its
// left, as the unit's does.
const dotsClass = need => { const rows = Math.ceil(need / 5); return `scan-dots ${rows <= 4 ? 'd1' : rows <= 8 ? 'd2' : 'd3'} c${Math.min(5, need)}`; };
function dotsHtml({ need, got }) {
  const blk = from => {
    const k = Math.min(10, need - from); let h = `<div class="c${Math.min(5, k)}">`;
    for (let i = from; i < from + k; i++) h += (got >> BigInt(i)) & 1n ? '<i class="on"></i>' : '<i></i>';
    return h + '</div>';
  };
  const starts = Array.from({ length: Math.ceil(need / 10) }, (_, b) => b * 10), full = Math.floor(need / 10), lines = [];
  if (full < 3) { if (full) lines.push(starts.slice(0, full)); if (need % 10) lines.push(starts.slice(full)); }
  else for (let i = 0; i < starts.length; i += 3) lines.push(starts.slice(i, i + 3));
  return lines.map(l => `<div class="ln">${l.map(blk).join('')}</div>`).join('');
}
function render() {
  const ready = S.boot === 'ready';
  $('landing').hidden = !S.gated; $('shell').hidden = S.gated;
  document.body.classList.toggle('rail-open', S.railOpen);
  document.querySelectorAll('[data-needs-sdk]').forEach(b => { b.disabled = !ready; });
  $('openLabel').textContent = S.kpubText.trim() ? 'Open wallet' : 'Explore without a wallet';
  $('importErr').hidden = !S.importErr; $('importErr').textContent = S.importErr;
  const bm = $('bootMsg'); bm.hidden = S.boot === 'ready';
  if (S.boot === 'error') { bm.className = 'err'; bm.textContent = 'Engine failed to load: ' + S.bootErr; }

  if (!S.gated) {
    $('railIcon').className = 'ph ' + (S.railOpen ? 'ph-caret-double-left' : 'ph-caret-double-right');
    const cw = acct, wn = cw ? cw.name : 'No wallet';
    put($('railWallets'), !S.railOpen
      ? `<button class="rail-btn ws on" data-act="ws" title="${esc(wn)}"><i class="ph ${cw && cw.group ? 'ph-vault' : 'ph-wallet'}"></i></button>`
      : `<div class="ws-list">${wallets.map((w, i) => `<button class="ws-item${w === acct ? ' on' : ''}" data-act="useWallet" data-arg="${i}"${w === acct ? ' aria-current="true"' : ''} title="${w === acct ? 'In use' : 'Switch to ' + esc(w.name)}"><i class="ph ${w.group ? 'ph-vault' : 'ph-wallet'}"></i><span><b>${esc(w.name)}</b><small>${esc(balLine(w))}</small></span>${w === acct ? '<i class="ph ph-check ws-check"></i>' : ''}</button>`).join('') || '<div class="ws-none">No wallet loaded</div>'}</div>` +
        `<div class="ws-add"><button class="ws-mini" data-act="scanWallet"${ready ? '' : ' disabled'}><i class="ph ph-plus"></i>Add wallet</button><button class="ws-mini" data-act="goto" data-arg="vaults:1"><i class="ph ph-plus"></i>Add vault</button></div>`);
    put($('railNav'), SECS.map(x => `<button class="rail-btn${x.id === S.sec ? ' on' : ''}" data-act="sec" data-arg="${x.id}" title="${esc(x.label)}"><i class="ph ${x.icon}"></i><span class="rail-label">${esc(x.label)}</span></button>`).join(''));
    const sec = SECS.find(x => x.id === S.sec), isSend = S.sec === 'send', ni = nodeInfo();
    put($('subs'), `<div class="subs-head"><div class="subs-title">${esc(sec.label)}</div><div class="status"><span class="dot ${ni.dot}"></span>Mainnet · ${esc(ni.label)}</div></div>` +
      sec.subs.map(([l, ic], i) => { const ok = !isSend || can(i), done = isSend && ok && i < S.sub; return `<button class="sub${i === S.sub ? ' on' : ''}${ok ? '' : ' off'}${done ? ' done' : ''}" data-act="sub" data-arg="${i}"><span class="ring"><i class="ph ${done ? 'ph-check' : ic}"></i></span><span class="lbl">${esc(l)}</span>${isSend ? `<span class="meta">0${i + 1}</span>` : ''}</button>`; }).join(''));
    const html = viewHtml(), key = S.sec + S.sub, el = $('view');
    if (html !== lastHtml) {
      const f = document.activeElement, fid = f && el.contains(f) ? f.id : '', ss = fid && f.selectionStart, se = fid && f.selectionEnd;
      el.innerHTML = html; lastHtml = html; motion(el);
      if (fid) { const n = $(fid); if (n) { n.focus(); try { n.setSelectionRange(ss, se); } catch (_) {} } }
    }
    if (key !== lastView) { lastView = key; el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter'); }
    const sf = $('sigFill'); if (sf && S.part) sf.style.width = Math.round(S.part.present / S.part.required * 100) + '%';
    const bf = $('bcFill'); if (bf && S.bc && S.bc.required) bf.style.width = Math.min(100, Math.round(S.bc.present / S.bc.required * 100)) + '%';
  }

  $('scanner').hidden = !S.scanner;
  if (S.scanner) {
    $('scanTitle').textContent = SCAN[S.scanner] || '';
    $('scanMsg').textContent = S.scanMsg;
    $('scanErr').hidden = !S.scanErr; $('scanErr').textContent = S.scanErr;
    $('scanBar').hidden = !!S.scanDots || S.scanner !== 'sig' && S.scanner !== 'signed' && !S.scanPct; $('scanFill').style.width = S.scanPct + '%';
    const sd = $('scanDots'); sd.hidden = !S.scanDots;
    if (S.scanDots) { sd.className = dotsClass(S.scanDots.need); put(sd, dotsHtml(S.scanDots)); }
  }
  const bk = $('book'); bk.hidden = S.gated || !S.book || !acct; if (!bk.hidden && put(bk, bookHtml())) motion(bk);
  $('toast').hidden = !S.toast; $('toast').textContent = S.toast;
  const tt = !S.gated && acct ? acct.name + ' · ' + baseTitle : baseTitle; if (document.title !== tt) document.title = tt;
  const rn = $('railName'); if (rn) rn.textContent = !S.gated && acct ? acct.name : '';
}
const baseTitle = document.title;

// QR frames advance without re-rendering the screen.
// A card's backup on Covenants, its codes on its Backup page, or on a new card's Backup step.
const cardFrames = () => { const c = S.sec !== 'covenants' ? null : S.cardView === 'new' ? S.nStep === 5 && fresh : S.cardView === 'card' && S.cPane === 'backup' && cardAt(); return (c && c.codes) || []; };
const shown = () => S.sec === 'broadcast' ? S.bcFrames : S.sec === 'covenants' ? cardFrames() : S.frames;
// Frames a batch cycles, and the one on screen: [first, past the last] of it.
const BATCH = 10;
const span = (n = shown().length) => { if (n <= BATCH) return [0, n]; const a = Math.min(S.batch, Math.ceil(n / BATCH) - 1) * BATCH; return [a, Math.min(n, a + BATCH)]; };
const toBatch = d => { const n = shown().length, k = Math.ceil(n / BATCH); if (k < 2) return; const b = (S.batch + d + k) % k; set({ batch: b, frame: b * BATCH, playing: true }); };
function showFrame(i) {
  S.frame = i; const img = $('qrImg'); if (!img) return;
  img.src = shown()[i] || ''; const r = $('qrRange'), n = $('qrNum');
  if (r) r.value = i; if (n) n.textContent = (i + 1) + '/' + shown().length;
  lastHtml = ''; // the stored HTML no longer matches the DOM
}
function tick() {
  tickT = setTimeout(() => { if (!S.gated && ((S.sec === 'send' || S.sec === 'broadcast') && S.sub === 1 || S.sec === 'covenants') && S.playing && shown().length > 1) { const [a, z] = span(); showFrame(S.frame + 1 >= z || S.frame < a ? a : S.frame + 1); } tick(); }, S.ms);
}

// ── the 3D unit on the landing ──────────────────────────────────────────────
// The new card's unit (devHtml), its screen the signer's Home.
function buildDevice(host) { host.innerHTML = devHtml('<img src="assets/kassigner_screen.png" alt="HW signer home screen" draggable="false">', false); }
const fitDevice = () => { const w = innerWidth; document.documentElement.style.setProperty('--dev', w >= 1280 ? .9 : w >= 980 ? .72 : Math.max(.4, Math.min(.72, (w - 64) / 600))); };

// ── wiring ──────────────────────────────────────────────────────────────────
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  const f = ACT[el.dataset.act]; if (f) f(el.dataset.arg);
});
document.addEventListener('keydown', e => {
  // Escape closes the address book. Enter in a new card's field takes its step's Next. In a name being
  // edited, Enter saves it and Escape leaves it as it was.
  const t = e.target;
  if (e.key === 'Escape' && S.book) { e.preventDefault(); set({ book: null }); return; }
  if (e.key === 'Enter' && t.tagName === 'INPUT' && t.type === 'text' && t.id !== 'f-edit' && t.closest('.nc')) { e.preventDefault(); ncNext(); return; }
  if (t.id !== 'f-edit') return;
  if (e.key === 'Enter') { e.preventDefault(); saveEdit(); } else if (e.key === 'Escape') { e.preventDefault(); ACT.cancelEdit(); }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'kpubText') { S.kpubText = t.value; if (S.importErr) set({ importErr: '' }); else render(); return; }
  if (t.id === 'qrRange') { S.playing = false; showFrame(+t.value); set({}); return; }
  // Dragged without a redraw, which would take the slider from under the finger; the next frame is timed by it.
  if (t.id === 'qrSpeed') { S.ms = atMs(MS_MIN + MS_MAX - +t.value); lastHtml = ''; return; }
  const k = t.dataset.bind; if (!k) return;
  S[k] = t.value;
  // With Custom on, what its rate comes to follows the destination and the amount as they are typed.
  if (k === 'to' || k === 'amt') { if (S.buildErr || S.fee === 'custom') set({ buildErr: '' }); }
  else if (k === 'sigHex' && S.sigErr) set({ sigErr: '' });
  else if (k === 'bcText' && S.bcErr) set({ bcErr: '' });
  else if (k === 'msgText' && S.msgErr) set({ msgErr: '' });
  else if (k === 'feeCustom') set({ buildErr: '' });
  else if (k === 'descText' || k === 'myAddr') set({ descErr: '' });
  // A new card's fields, drawn on the unit's card as they are typed.
  else if (k === 'cOwner' || k === 'cRecovery' || k === 'cDay' || k === 'cMonth' || k === 'cYear' || k === 'cHour' || k === 'cMinute') set({ cErr: '' });
  else if (k === 'cLine') { if (S.cLineErr) set({ cLineErr: '' }); }
  else if (k === 'cTo') { if (S.cBuildErr || S.cFee === 'custom') set({ cBuildErr: '' }); }
});
addEventListener('resize', () => { fitDevice(); if (!railByHand && S.railOpen !== railRoom()) set({ railOpen: railRoom() }); });

// Overview refreshes itself every 60 s while it is on screen and the tab is visible; errors back off
// 2, 4 … up to 5 min. Each round resumes discovery after the last used address, so it stays light.
const AUTO = 60000, AUTO_MAX = 300000;
function autoTick() {
  const w = acct;
  if (S.gated || !w || S.sec !== 'wallet' || S.sub !== 0 || document.visibilityState !== 'visible' || w.syncing || S.sync === 'running' || S.sync === 'idle') return;
  const wait = Math.min(AUTO_MAX, AUTO * 2 ** (w.autoFail || 0)), last = Math.max(S.syncAt || 0, w.lastTry || 0);
  if (Date.now() - last >= wait) sync(w, true);
}
setInterval(autoTick, 5000);
document.addEventListener('visibilitychange', autoTick);
// While Covenants is on screen: the cards drawn again when one moves on, and the network's clock read again,
// every minute, or every 15 s near a card's time; a failed reading is tried again 15 s on.
function clockTick() {
  if (S.gated || S.sec !== 'covenants' || document.visibilityState !== 'visible') return;
  const states = cards.map(cardState).join();
  if (states !== lastStates) { lastStates = states; set({}); }
  const near = cards.some(c => cardState(c) !== 'open' && BigInt(nowMs() + MIN_MS) >= c.card.unlockMs);
  if (netAge() >= (near ? NET_NEAR : NET_EVERY) && performance.now() - netTried >= NET_NEAR) readNetClock();
}
setInterval(clockTick, 5000);

(async function boot() {
  try { localStorage.removeItem(OLD_LS); } catch (_) {}
  S.railOpen = railRoom();
  buildDevice($('device')); fitDevice(); render(); tick();
  try {
    const b = await W.boot();
    rest = mkRest(); node = new W.Node(n => { set({ node: n }); if (n.state === 'on' && n.own && n.utxoIndex && acct && S.sync === 'done' && S.via !== 'your node') sync(); });
    set({ boot: 'ready', sdkVer: b.version });
    node.connect('');
  } catch (e) { set({ boot: 'error', bootErr: W.errMsg(e) }); }
})();
