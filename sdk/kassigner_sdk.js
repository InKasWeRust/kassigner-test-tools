let wasm;

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : { encode: () => { throw Error('TextEncoder not available') } } );

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}
/**
 * This package's version: the SDK's release.
 * @returns {string}
 */
export function version() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.version();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_export_0.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(wasm.__wbindgen_export_0.get(mem.getUint32(i, true)));
    }
    wasm.__externref_drop_slice(ptr, len);
    return result;
}

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_export_0.set(idx, obj);
    return idx;
}

function passArrayJsValueToWasm0(array, malloc) {
    const ptr = malloc(array.length * 4, 4) >>> 0;
    for (let i = 0; i < array.length; i++) {
        const add = addToExternrefTable0(array[i]);
        getDataViewMemory0().setUint32(ptr + 4 * i, add, true);
    }
    WASM_VECTOR_LEN = array.length;
    return ptr;
}
/**
 * Merge `copies` of one signed transaction into one, each read as
 * [`read_signed_reply`] reads it; a signature at a position an earlier
 * copy fills is left out.
 *
 * Throws `NotTheRequest` for a copy of another transaction; as
 * [`read_signed_reply`].
 * @param {Uint8Array[]} copies
 * @param {Profile} profile
 * @returns {Uint8Array}
 */
export function mergeSignedReplies(copies, profile) {
    const ptr0 = passArrayJsValueToWasm0(copies, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    _assertClass(profile, Profile);
    const ret = wasm.mergeSignedReplies(ptr0, len0, profile.__wbg_ptr);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v2;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}
/**
 * Read `reply` against `request`: the same transaction, every signature
 * verified over it.
 *
 * Throws `NotTheRequest`, `Unverified(...)`, `Reply(...)` for bytes that
 * are not a KSPT.
 * @param {Uint8Array} request
 * @param {Uint8Array} reply
 * @param {Profile} profile
 * @returns {Checked}
 */
export function readReply(request, reply, profile) {
    const ptr0 = passArray8ToWasm0(request, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(reply, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    _assertClass(profile, Profile);
    const ret = wasm.readReply(ptr0, len0, ptr1, len1, profile.__wbg_ptr);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Checked.__wrap(ret[0]);
}

/**
 * Finish `reply`, a complete reply to `request`: checked as by
 * [`read_reply`], unlocking scripts written, masses computed, the fee
 * checked against the minimum relay fee.
 *
 * Throws `NotTheRequest`, `Unverified(...)` as [`read_reply`];
 * `Signatures { input, have, need }` for an input short of its threshold,
 * `FeeTooLow { fee, minimum }`, `Dust { output }`, `Redeem`,
 * `Unspendable`.
 * @param {Uint8Array} request
 * @param {Uint8Array} reply
 * @param {boolean} allow_orphan
 * @param {Rates} rates
 * @param {Profile} profile
 * @returns {Finalized}
 */
export function finalizeReply(request, reply, allow_orphan, rates, profile) {
    const ptr0 = passArray8ToWasm0(request, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(reply, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    _assertClass(rates, Rates);
    _assertClass(profile, Profile);
    const ret = wasm.finalizeReply(ptr0, len0, ptr1, len1, allow_orphan, rates.__wbg_ptr, profile.__wbg_ptr);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Finalized.__wrap(ret[0]);
}

/**
 * Finish `signed`, a wallet's signed WASM SDK safe JSON, against
 * `request`, the one it was handed (`RequestBuilder.buildSafeJson`): the
 * same transaction but for unlocking scripts, every input carrying one,
 * the id it states correct; masses computed, fee checked. A node verifies
 * the signatures on arrival.
 *
 * Throws `RequestJson(...)`, `ReplyJson(...)`, `NotTheRequest`,
 * `Unsigned { input }`, `WrongId`, `Mass`, `FeeTooLow { fee, minimum }`,
 * `Dust { output }`.
 * @param {string} request
 * @param {string} signed
 * @param {boolean} allow_orphan
 * @param {Rates} rates
 * @param {Profile} profile
 * @returns {Finalized}
 */
export function finalizeSafeJson(request, signed, allow_orphan, rates, profile) {
    const ptr0 = passStringToWasm0(request, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(signed, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    _assertClass(rates, Rates);
    _assertClass(profile, Profile);
    const ret = wasm.finalizeSafeJson(ptr0, len0, ptr1, len1, allow_orphan, rates.__wbg_ptr, profile.__wbg_ptr);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Finalized.__wrap(ret[0]);
}

/**
 * Merge `replies`, cosigners' answers to `request`, each read as
 * [`read_reply`] reads it, into one reply.
 *
 * Throws as [`read_reply`]; `Merge(...)` for two signatures at one
 * position.
 * @param {Uint8Array} request
 * @param {Uint8Array[]} replies
 * @param {Profile} profile
 * @returns {Uint8Array}
 */
export function mergeReplies(request, replies, profile) {
    const ptr0 = passArray8ToWasm0(request, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayJsValueToWasm0(replies, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    _assertClass(profile, Profile);
    const ret = wasm.mergeReplies(ptr0, len0, ptr1, len1, profile.__wbg_ptr);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v3 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v3;
}

/**
 * Read `signed`, a signed transaction with no request: every signature
 * verified over its own transaction. [`crate::request::summary`] gives
 * what it pays.
 *
 * Throws `Reply(...)` for bytes that are not a KSPT,
 * `Unverified(Nothing)` for none signed, `Unverified(...)`.
 * @param {Uint8Array} signed
 * @param {Profile} profile
 * @returns {Checked}
 */
export function readSignedReply(signed, profile) {
    const ptr0 = passArray8ToWasm0(signed, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    _assertClass(profile, Profile);
    const ret = wasm.readSignedReply(ptr0, len0, profile.__wbg_ptr);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Checked.__wrap(ret[0]);
}

/**
 * Finish `signed`, a complete signed transaction, with no request: as
 * [`finalize_reply`].
 *
 * Throws as [`read_signed_reply`]; then as [`finalize_reply`].
 * @param {Uint8Array} signed
 * @param {boolean} allow_orphan
 * @param {Rates} rates
 * @param {Profile} profile
 * @returns {Finalized}
 */
export function finalizeSignedReply(signed, allow_orphan, rates, profile) {
    const ptr0 = passArray8ToWasm0(signed, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    _assertClass(rates, Rates);
    _assertClass(profile, Profile);
    const ret = wasm.finalizeSignedReply(ptr0, len0, allow_orphan, rates.__wbg_ptr, profile.__wbg_ptr);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Finalized.__wrap(ret[0]);
}

/**
 * The locking script a mainnet address pays to.
 * @param {string} address
 * @returns {Uint8Array}
 */
export function scriptOfAddress(address) {
    const ptr0 = passStringToWasm0(address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.scriptOfAddress(ptr0, len0);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v2;
}

/**
 * What `bytes` are, of the five things a unit hands over: one code, file
 * or pasted text, as it came.
 *
 * Throws `NotRecognised` for anything else, and that thing's own error for
 * bytes that begin as one of the five and do not read as it.
 * @param {Uint8Array} bytes
 * @returns {Imported}
 */
export function readImport(bytes) {
    const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.readImport(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Imported.__wrap(ret[0]);
}

/**
 * The mainnet address a locking script pays.
 * @param {Uint8Array} script
 * @returns {string}
 */
export function addressOfScript(script) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passArray8ToWasm0(script, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.addressOfScript(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Prepare `bundle`, a wallet's `PSKB` envelope, for the unit: checked
 * against the unit's rules and written again with `hints` in its inputs.
 *
 * Throws as the SDK's `BundleError` says: `NotOneTransaction`,
 * `Check(...)`, `Multisig(...)`, `Hint { input }`...
 * @param {Uint8Array} bundle
 * @param {Hints} hints
 * @param {Profile} profile
 * @returns {Prepared}
 */
export function prepareBundle(bundle, hints, profile) {
    const ptr0 = passArray8ToWasm0(bundle, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    _assertClass(hints, Hints);
    _assertClass(profile, Profile);
    const ret = wasm.prepareBundle(ptr0, len0, hints.__wbg_ptr, profile.__wbg_ptr);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Prepared.__wrap(ret[0]);
}

/**
 * Finish `signed`, a complete signed bundle, with no request: as
 * [`finalize_bundle`].
 *
 * Throws as [`finalize_bundle`] but `NotTheRequest`.
 * @param {Uint8Array} signed
 * @param {boolean} allow_orphan
 * @param {Rates} rates
 * @param {Profile} profile
 * @returns {Finalized}
 */
export function finalizeSignedBundle(signed, allow_orphan, rates, profile) {
    const ptr0 = passArray8ToWasm0(signed, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    _assertClass(rates, Rates);
    _assertClass(profile, Profile);
    const ret = wasm.finalizeSignedBundle(ptr0, len0, allow_orphan, rates.__wbg_ptr, profile.__wbg_ptr);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Finalized.__wrap(ret[0]);
}

/**
 * What `envelope`, a bundle, carries, as [`crate::request::summary`]
 * reads a KSPT. Nothing is verified.
 *
 * Throws for what is not a bundle of one transaction.
 * @param {Uint8Array} envelope
 * @param {Profile} profile
 * @returns {Summary}
 */
export function bundleSummary(envelope, profile) {
    const ptr0 = passArray8ToWasm0(envelope, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    _assertClass(profile, Profile);
    const ret = wasm.bundleSummary(ptr0, len0, profile.__wbg_ptr);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Summary.__wrap(ret[0]);
}

/**
 * Read `reply` against `request`, both envelopes: every signature
 * verified over the request's transaction.
 *
 * Throws `NotTheRequest`, `Check(BadSignature { input })`...
 * @param {Uint8Array} request
 * @param {Uint8Array} reply
 * @param {Profile} profile
 * @returns {Checked}
 */
export function readBundle(request, reply, profile) {
    const ptr0 = passArray8ToWasm0(request, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(reply, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    _assertClass(profile, Profile);
    const ret = wasm.readBundle(ptr0, len0, ptr1, len1, profile.__wbg_ptr);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Checked.__wrap(ret[0]);
}

/**
 * Merge `replies`, cosigners' answers to `request`, into one envelope.
 *
 * Throws as [`read_bundle`]; `Edit(SameKeyTwice)` for one key signing
 * twice.
 * @param {Uint8Array} request
 * @param {Uint8Array[]} replies
 * @param {Profile} profile
 * @returns {Uint8Array}
 */
export function mergeBundles(request, replies, profile) {
    const ptr0 = passArray8ToWasm0(request, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayJsValueToWasm0(replies, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    _assertClass(profile, Profile);
    const ret = wasm.mergeBundles(ptr0, len0, ptr1, len1, profile.__wbg_ptr);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v3 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v3;
}

/**
 * Read `signed`, a signed bundle with no request: every signature
 * verified over its own transaction. [`bundle_summary`] gives what it pays.
 *
 * Throws as [`read_bundle`] but `NotTheRequest`.
 * @param {Uint8Array} signed
 * @param {Profile} profile
 * @returns {Checked}
 */
export function readSignedBundle(signed, profile) {
    const ptr0 = passArray8ToWasm0(signed, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    _assertClass(profile, Profile);
    const ret = wasm.readSignedBundle(ptr0, len0, profile.__wbg_ptr);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Checked.__wrap(ret[0]);
}

/**
 * Finish `reply`, a complete bundle reply to `request`: as
 * [`crate::reply::finalize_reply`] over a bundle.
 *
 * Throws `NotTheRequest`, `Check(BadSignature { input })`,
 * `Finish(Signatures { .. })`, `Finish(FeeTooLow { .. })`...
 * @param {Uint8Array} request
 * @param {Uint8Array} reply
 * @param {boolean} allow_orphan
 * @param {Rates} rates
 * @param {Profile} profile
 * @returns {Finalized}
 */
export function finalizeBundle(request, reply, allow_orphan, rates, profile) {
    const ptr0 = passArray8ToWasm0(request, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(reply, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    _assertClass(rates, Rates);
    _assertClass(profile, Profile);
    const ret = wasm.finalizeBundle(ptr0, len0, ptr1, len1, allow_orphan, rates.__wbg_ptr, profile.__wbg_ptr);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Finalized.__wrap(ret[0]);
}

/**
 * Merge `copies` of one signed bundle into one envelope, every signature
 * verified over the first copy's transaction; a key's signature in two
 * copies is kept once.
 *
 * Throws `Check(BadSignature { input })` for a copy of another
 * transaction; as [`read_signed_bundle`].
 * @param {Uint8Array[]} copies
 * @param {Profile} profile
 * @returns {Uint8Array}
 */
export function mergeSignedBundles(copies, profile) {
    const ptr0 = passArrayJsValueToWasm0(copies, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    _assertClass(profile, Profile);
    const ret = wasm.mergeSignedBundles(ptr0, len0, profile.__wbg_ptr);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v2;
}

/**
 * The codes that show `text` to a unit of `profile`, for its Sign
 * Message.
 *
 * Throws `NotText` for a text the unit refuses, `TrailingWhitespace` for
 * one it refuses to sign, `Transport` for one past its frames.
 * @param {string} text
 * @param {Profile} profile
 * @returns {Codes}
 */
export function messageCodes(text, profile) {
    const ptr0 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    _assertClass(profile, Profile);
    const ret = wasm.messageCodes(ptr0, len0, profile.__wbg_ptr);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Codes.__wrap(ret[0]);
}

/**
 * Whether a unit signs `text`: not empty, every character one its screen
 * shows, and no trailing space on a line or trailing line break, which
 * the screen would not show.
 * @param {string} text
 * @returns {boolean}
 */
export function isText(text) {
    const ptr0 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.isText(ptr0, len0);
    return ret !== 0;
}

/**
 * [`verify_message`], and the record's text is `text` and its address
 * `address`, as a login or a proof of ownership checks.
 *
 * Throws as [`verify_message`]; `OtherText`, `OtherAddress`.
 * @param {Uint8Array} bytes
 * @param {string} text
 * @param {string} address
 * @returns {Verified}
 */
export function verifyMessageAgainst(bytes, text, address) {
    const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.verifyMessageAgainst(ptr0, len0, ptr1, len1, ptr2, len2);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Verified.__wrap(ret[0]);
}

/**
 * Read `bytes` as a signed message record and verify its signature over
 * its text against its address's key.
 *
 * Throws `NotARecord`, `NotAKeyAddress`, `NotMainnet(...)`, `Fails`.
 * @param {Uint8Array} bytes
 * @returns {Verified}
 */
export function verifyMessage(bytes) {
    const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.verifyMessage(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Verified.__wrap(ret[0]);
}

/**
 * What `kspt`, a request or a reply, carries. Nothing is verified;
 * [`crate::reply::read_reply`] does that.
 *
 * Throws for bytes that do not parse as a KSPT within `profile`.
 * @param {Uint8Array} kspt
 * @param {Profile} profile
 * @returns {Summary}
 */
export function summary(kspt, profile) {
    const ptr0 = passArray8ToWasm0(kspt, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    _assertClass(profile, Profile);
    const ret = wasm.summary(ptr0, len0, profile.__wbg_ptr);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Summary.__wrap(ret[0]);
}

/**
 * How `payload`, marked `format` (`kspt` for a request, `pskb` for a
 * bundle, `opaque` for a text), is shown to a unit of `profile`.
 *
 * Throws `Empty`, `TooManyFrames`; `no format named "..."` for an
 * unknown `format`.
 * @param {Uint8Array} payload
 * @param {string} format
 * @param {Profile} profile
 * @returns {Codes}
 */
export function codes(payload, format, profile) {
    const ptr0 = passArray8ToWasm0(payload, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(format, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    _assertClass(profile, Profile);
    const ret = wasm.codes(ptr0, len0, ptr1, len1, profile.__wbg_ptr);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Codes.__wrap(ret[0]);
}

/**
 * Decode the first readable QR code in a grayscale frame, `width` by
 * `height`, a byte a pixel, with the unit's own decoder; `undefined` when
 * none reads. `denom` is the adaptive threshold's window divisor: the
 * units use 8 for dense codes and 3 to rescue versions 1 and 2; try one,
 * then the other.
 *
 * Throws for a side of zero or over 1024, or fewer pixels than the sides
 * say.
 * @param {Uint8Array} pixels
 * @param {number} width
 * @param {number} height
 * @param {number} denom
 * @returns {Uint8Array | undefined}
 */
export function decodeQr(pixels, width, height, denom) {
    const ptr0 = passArray8ToWasm0(pixels, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.decodeQr(ptr0, len0, width, height, denom);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    let v2;
    if (ret[0] !== 0) {
        v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    }
    return v2;
}

const AccountFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_account_free(ptr >>> 0, 1));
/**
 * A `44'` account, watched through its kpub.
 */
export class Account {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Account.prototype);
        obj.__wbg_ptr = ptr;
        AccountFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AccountFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_account_free(ptr, 0);
    }
    /**
     * The key at `chain`/`index`, x only, as hex. `chain` is 0 for
     * receive, 1 for change.
     * @param {number} chain
     * @param {number} index
     * @returns {string}
     */
    publicKey(chain, index) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.account_publicKey(this.__wbg_ptr, chain, index);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * The locking script of `chain`/`index`, to match UTXOs against.
     * @param {number} chain
     * @param {number} index
     * @returns {Uint8Array}
     */
    script(chain, index) {
        const ret = wasm.account_script(this.__wbg_ptr, chain, index);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * The mainnet address of `chain`/`index`.
     * @param {number} chain
     * @param {number} index
     * @returns {string}
     */
    address(chain, index) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.account_address(this.__wbg_ptr, chain, index);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * The account behind a kpub, text (`kpub...`) or a unit's raw form.
     * @param {string} kpub_text
     * @returns {Account}
     */
    static fromKpub(kpub_text) {
        const ptr0 = passStringToWasm0(kpub_text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.account_fromKpub(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Account.__wrap(ret[0]);
    }
}

const AnswerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_answer_free(ptr >>> 0, 1));
/**
 * A node's message, read.
 */
export class Answer {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Answer.prototype);
        obj.__wbg_ptr = ptr;
        AnswerFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AnswerFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_answer_free(ptr, 0);
    }
    /**
     * On a `getServerInfo` reply.
     * @returns {ServerInfo | undefined}
     */
    get serverInfo() {
        const ret = wasm.answer_serverInfo(this.__wbg_ptr);
        return ret === 0 ? undefined : ServerInfo.__wrap(ret);
    }
    /**
     * On a `getFeeEstimate` reply.
     * @returns {FeeEstimate | undefined}
     */
    get feeEstimate() {
        const ret = wasm.answer_feeEstimate(this.__wbg_ptr);
        return ret === 0 ? undefined : FeeEstimate.__wrap(ret);
    }
    /**
     * On a `submitTransaction` reply, the accepted transaction's id, hex.
     * @returns {string | undefined}
     */
    get transactionId() {
        const ret = wasm.answer_transactionId(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * The id of the request it answers; none on a notification.
     * @returns {number | undefined}
     */
    get id() {
        const ret = wasm.answer_id(this.__wbg_ptr);
        return ret === 0x100000001 ? undefined : ret;
    }
    /**
     * The call it answers (`"getUtxosByAddresses"` and the like), if the
     * node names one the SDK makes; a Borsh node names none on
     * `RPC method not found`.
     * @returns {string | undefined}
     */
    get call() {
        const ret = wasm.answer_call(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * `"reply"`, `"error"` or `"notification"`.
     * @returns {string}
     */
    get kind() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.answer_kind(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * On an error, the node's words: a refused transaction says why.
     * @returns {string | undefined}
     */
    get error() {
        const ret = wasm.answer_error(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * On a `getUtxosByAddresses` reply, every coin, in the node's order.
     * @returns {Utxo[] | undefined}
     */
    get utxos() {
        const ret = wasm.answer_utxos(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        }
        return v1;
    }
}

const BucketFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bucket_free(ptr >>> 0, 1));
/**
 * A fee rate the node expects to see confirmed within some seconds.
 */
export class Bucket {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Bucket.prototype);
        obj.__wbg_ptr = ptr;
        BucketFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BucketFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bucket_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get estimatedSeconds() {
        const ret = wasm.bucket_estimatedSeconds(this.__wbg_ptr);
        return ret;
    }
    /**
     * Sompi a gram of mass, as the node estimates it.
     * @returns {number}
     */
    get feerate() {
        const ret = wasm.bucket_feerate(this.__wbg_ptr);
        return ret;
    }
    /**
     * The rate as `RequestBuilder.build` takes it: whole sompi a gram,
     * rounded up, at least 1. The minimum relay fee still applies.
     * @returns {bigint}
     */
    get feeRate() {
        const ret = wasm.bucket_feeRate(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
}

const CardFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_card_free(ptr >>> 0, 1));
/**
 * A Time-Locked Savings card: UTXOs locked until its unlock time, then
 * claimed by its owner or recovered by its recovery wallet, if it has one.
 */
export class Card {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Card.prototype);
        obj.__wbg_ptr = ptr;
        CardFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CardFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_card_free(ptr, 0);
    }
    /**
     * The day it unlocks on, 1 to 31.
     * @returns {number}
     */
    get unlockDay() {
        const ret = wasm.card_unlockDay(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * The card `line` is the backup of.
     * @param {string} line
     * @returns {Card}
     */
    static fromBackup(line) {
        const ptr0 = passStringToWasm0(line, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.card_fromBackup(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Card.__wrap(ret[0]);
    }
    /**
     * The hour it unlocks at, UTC, 0 to 23.
     * @returns {number}
     */
    get unlockHour() {
        const ret = wasm.card_unlockHour(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * The year it unlocks in.
     * @returns {number}
     */
    get unlockYear() {
        const ret = wasm.card_unlockYear(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * The month it unlocks in, 1 to 12.
     * @returns {number}
     */
    get unlockMonth() {
        const ret = wasm.card_unlockMonth(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * The minute of that hour, 0 to 59.
     * @returns {number}
     */
    get unlockMinute() {
        const ret = wasm.card_unlockMinute(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * The owner's key, as its `kaspa:q` address.
     * @returns {string}
     */
    owner() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.card_owner(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Its backup line, `savings_v1(...)`, to show as a QR code and keep.
     * @returns {string}
     */
    backup() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.card_backup(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Its locking script, to match UTXOs against.
     * @returns {Uint8Array}
     */
    script() {
        const ret = wasm.card_script(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * Which of `account`'s first `depth` receive keys is this card's, the
     * owner's if the account holds both, and whether it recovers; none if
     * it holds neither, leaving the search to the unit.
     * @param {Account} account
     * @param {number} depth
     * @returns {CardSigner | undefined}
     */
    signer(account, depth) {
        _assertClass(account, Account);
        const ret = wasm.card_signer(this.__wbg_ptr, account.__wbg_ptr, depth);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] === 0 ? undefined : CardSigner.__wrap(ret[0]);
    }
    /**
     * Its own address, `kaspa:p…`, where UTXOs are sent to be locked.
     * @returns {string}
     */
    address() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.card_address(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * The card of `owner`, the claiming key's `kaspa:q` address, and
     * `recovery`, the recovery key's, or none, unlocking on
     * `day`/`month`/`year` at `hour`:`minute` UTC (24-hour clock).
     * @param {string} owner
     * @param {string | null | undefined} recovery
     * @param {number} day
     * @param {number} month
     * @param {number} year
     * @param {number} hour
     * @param {number} minute
     * @returns {Card}
     */
    static savings(owner, recovery, day, month, year, hour, minute) {
        const ptr0 = passStringToWasm0(owner, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(recovery) ? 0 : passStringToWasm0(recovery, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        const ret = wasm.card_savings(ptr0, len0, ptr1, len1, day, month, year, hour, minute);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Card.__wrap(ret[0]);
    }
    /**
     * The recovery wallet's key, as its `kaspa:q` address, or none.
     * @returns {string | undefined}
     */
    recovery() {
        const ret = wasm.card_recovery(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * Its unlock time, Unix milliseconds: the least lock time a claim or
     * recovery is built under (`lockUntil`).
     * @returns {bigint}
     */
    get unlockMs() {
        const ret = wasm.card_unlockMs(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
}

const CardSignerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_cardsigner_free(ptr >>> 0, 1));
/**
 * Which of an account's receive keys is a card's, and which entry it
 * spends by.
 */
export class CardSigner {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(CardSigner.prototype);
        obj.__wbg_ptr = ptr;
        CardSignerFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CardSignerFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_cardsigner_free(ptr, 0);
    }
    /**
     * The receive index.
     * @returns {number}
     */
    get index() {
        const ret = wasm.cardsigner_index(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Whether the key is the recovery wallet's; otherwise the owner's.
     * @returns {boolean}
     */
    get recovers() {
        const ret = wasm.cardsigner_recovers(this.__wbg_ptr);
        return ret !== 0;
    }
}

const CheckedFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_checked_free(ptr >>> 0, 1));
/**
 * What a checked reply holds.
 */
export class Checked {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Checked.prototype);
        obj.__wbg_ptr = ptr;
        CheckedFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CheckedFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_checked_free(ptr, 0);
    }
    /**
     * Signatures on the reply, every one verified.
     * @returns {number}
     */
    get signatures() {
        const ret = wasm.checked_signatures(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * For a multisig, the signatures that count; none when no input is
     * one.
     * @returns {number | undefined}
     */
    get present() {
        const ret = wasm.checked_present(this.__wbg_ptr);
        return ret === 0x100000001 ? undefined : ret;
    }
    /**
     * Whether every input has what its script needs, so the reply can be
     * finalized.
     * @returns {boolean}
     */
    get complete() {
        const ret = wasm.checked_complete(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * For a multisig, the signatures needed.
     * @returns {number | undefined}
     */
    get required() {
        const ret = wasm.checked_required(this.__wbg_ptr);
        return ret === 0x100000001 ? undefined : ret;
    }
}

const CodesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_codes_free(ptr >>> 0, 1));
/**
 * A payload as the codes a unit reads: one bare code when it fits one,
 * the unit's frames past that.
 */
export class Codes {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Codes.prototype);
        obj.__wbg_ptr = ptr;
        CodesFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CodesFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_codes_free(ptr, 0);
    }
    /**
     * Code `index` as an SVG document: `module` pixels a module, a quiet
     * zone of four modules, dark on light.
     * @param {number} index
     * @param {number} module
     * @returns {string}
     */
    svg(index, module) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.codes_svg(this.__wbg_ptr, index, module);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Whether the one code is the bare payload, with no frame header.
     * @returns {boolean}
     */
    get bare() {
        const ret = wasm.codes_bare(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * The bytes of code `index`: the frame, or the bare payload.
     * @param {number} index
     * @returns {Uint8Array}
     */
    bytes(index) {
        const ret = wasm.codes_bytes(this.__wbg_ptr, index);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * How many codes: one for a bare code.
     * @returns {number}
     */
    get frames() {
        const ret = wasm.codes_frames(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Code `index` as its module matrix, from the unit's own encoder.
     * @param {number} index
     * @returns {Matrix}
     */
    matrix(index) {
        const ret = wasm.codes_matrix(this.__wbg_ptr, index);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Matrix.__wrap(ret[0]);
    }
    /**
     * The largest code version any of them takes.
     * @returns {number}
     */
    get version() {
        const ret = wasm.codes_version(this.__wbg_ptr);
        return ret;
    }
    /**
     * How long each code stays on screen, in milliseconds: 600 up to
     * version 7, 850 above.
     * @returns {number}
     */
    get periodMs() {
        const ret = wasm.codes_periodMs(this.__wbg_ptr);
        return ret >>> 0;
    }
}

const CoinFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_coin_free(ptr >>> 0, 1));
/**
 * A coin to spend: its output and sompi, for a bundle its entry, and any
 * covenant it is bound to (`boundTo`).
 */
export class Coin {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Coin.prototype);
        obj.__wbg_ptr = ptr;
        CoinFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CoinFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_coin_free(ptr, 0);
    }
    /**
     * As `new Coin`, plus the DAA score of the block that accepted it and
     * whether a coinbase made it, which a bundle carries.
     * @param {string} tx_id
     * @param {number} index
     * @param {bigint} amount
     * @param {bigint} block_daa_score
     * @param {boolean} is_coinbase
     * @returns {Coin}
     */
    static withEntry(tx_id, index, amount, block_daa_score, is_coinbase) {
        const ptr0 = passStringToWasm0(tx_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.coin_withEntry(ptr0, len0, index, amount, block_daa_score, is_coinbase);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Coin.__wrap(ret[0]);
    }
    /**
     * The covenant it is bound to, hex, when it is.
     * @returns {string | undefined}
     */
    get covenantId() {
        const ret = wasm.coin_covenantId(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * Whether a coinbase made it, when given.
     * @returns {boolean | undefined}
     */
    get isCoinbase() {
        const ret = wasm.coin_isCoinbase(this.__wbg_ptr);
        return ret === 0xFFFFFF ? undefined : ret !== 0;
    }
    /**
     * Whether it can be spent at the network's DAA score `daa_score` (a
     * node's `virtualDaaScore`): a coinbase's coin once `daa_score` is
     * 1,000 past its block's (rusty-kaspa's rule on mainnet), any other at
     * once; `undefined` without its entry.
     * @param {bigint} daa_score
     * @returns {boolean | undefined}
     */
    spendableAt(daa_score) {
        const ret = wasm.coin_spendableAt(this.__wbg_ptr, daa_score);
        return ret === 0xFFFFFF ? undefined : ret !== 0;
    }
    /**
     * The DAA score of the block that accepted it, when given.
     * @returns {bigint | undefined}
     */
    get blockDaaScore() {
        const ret = wasm.coin_blockDaaScore(this.__wbg_ptr);
        return ret[0] === 0 ? undefined : BigInt.asUintN(64, ret[1]);
    }
    /**
     * The output `tx_id` (hex) : `index`, holding `amount` sompi.
     * @param {string} tx_id
     * @param {number} index
     * @param {bigint} amount
     */
    constructor(tx_id, index, amount) {
        const ptr0 = passStringToWasm0(tx_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.coin_new(ptr0, len0, index, amount);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        CoinFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * The output's index.
     * @returns {number}
     */
    get index() {
        const ret = wasm.coin_index(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * The transaction id, hex.
     * @returns {string}
     */
    get txId() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.coin_txId(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Sompi.
     * @returns {bigint}
     */
    get amount() {
        const ret = wasm.coin_amount(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * The same coin, bound to the covenant `covenant_id` (hex), as
     * `Utxo.coin()` binds it. A build throws `CovenantBound { coin }` for
     * it unless an output continues its covenant (`continueCovenant`) or
     * the request may end one (`endCovenants`).
     * @param {string} covenant_id
     * @returns {Coin}
     */
    boundTo(covenant_id) {
        const ptr0 = passStringToWasm0(covenant_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.coin_boundTo(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Coin.__wrap(ret[0]);
    }
}

const FeeEstimateFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_feeestimate_free(ptr >>> 0, 1));
/**
 * The node's fee estimate, fastest first.
 */
export class FeeEstimate {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(FeeEstimate.prototype);
        obj.__wbg_ptr = ptr;
        FeeEstimateFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FeeEstimateFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_feeestimate_free(ptr, 0);
    }
    /**
     * @returns {Bucket[]}
     */
    get low() {
        const ret = wasm.feeestimate_low(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {Bucket[]}
     */
    get normal() {
        const ret = wasm.feeestimate_normal(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {Bucket}
     */
    get priority() {
        const ret = wasm.feeestimate_priority(this.__wbg_ptr);
        return Bucket.__wrap(ret);
    }
}

const FinalizedFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_finalized_free(ptr >>> 0, 1));
/**
 * A finished transaction: its id, fee and masses, and the requests that
 * submit it.
 */
export class Finalized {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Finalized.prototype);
        obj.__wbg_ptr = ptr;
        FinalizedFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FinalizedFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_finalized_free(ptr, 0);
    }
    /**
     * The `submitTransaction` call's `params` for a wRPC JSON port. Send
     * it as it is: parsing it in JavaScript would round the amounts.
     * @returns {string}
     */
    get submitJson() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.finalized_submitJson(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Its compute mass as signed.
     * @returns {bigint}
     */
    get computeMass() {
        const ret = wasm.finalized_computeMass(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * The storage mass it commits.
     * @returns {bigint}
     */
    get storageMass() {
        const ret = wasm.finalized_storageMass(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * The same in Borsh: the payload `Node.submitTransaction` sends.
     * @returns {Uint8Array}
     */
    get submitBorsh() {
        const ret = wasm.finalized_submitBorsh(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * The transaction id, hex, as a node names it.
     * @returns {string}
     */
    get id() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.finalized_id(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * The fee it pays, sompi.
     * @returns {bigint}
     */
    get fee() {
        const ret = wasm.finalized_fee(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * Each input's unlocking script, hex.
     * @returns {string[]}
     */
    get unlocks() {
        const ret = wasm.finalized_unlocks(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * The same for kaspa-rest-server: the body of `POST /transactions`
     * (api.kaspa.org or any instance), sent as it is.
     * @returns {string}
     */
    get restJson() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.finalized_restJson(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const GroupFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_group_free(ptr >>> 0, 1));
/**
 * A `45'` multisig group: the cosigners' kpubs and the threshold, from a
 * descriptor.
 */
export class Group {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Group.prototype);
        obj.__wbg_ptr = ptr;
        GroupFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GroupFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_group_free(ptr, 0);
    }
    /**
     * The descriptor line of the group, as the SDK writes it.
     * @returns {string}
     */
    descriptor() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.group_descriptor(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * The group a descriptor line describes, `multi_hd45(M,kpub...,...)`,
     * with or without its `#` header line.
     * @param {string} descriptor
     * @returns {Group}
     */
    static fromDescriptor(descriptor) {
        const ptr0 = passStringToWasm0(descriptor, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.group_fromDescriptor(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Group.__wrap(ret[0]);
    }
    /**
     * Keys in the group.
     * @returns {number}
     */
    get total() {
        const ret = wasm.group_total(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * The redeem script at `cosigner`/`chain`/`index`.
     * @param {number} cosigner
     * @param {number} chain
     * @param {number} index
     * @returns {Uint8Array}
     */
    redeem(cosigner, chain, index) {
        const ret = wasm.group_redeem(this.__wbg_ptr, cosigner, chain, index);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * The locking script at `cosigner`/`chain`/`index`.
     * @param {number} cosigner
     * @param {number} chain
     * @param {number} index
     * @returns {Uint8Array}
     */
    script(cosigner, chain, index) {
        const ret = wasm.group_script(this.__wbg_ptr, cosigner, chain, index);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * The mainnet address at `cosigner`/`chain`/`index`.
     * @param {number} cosigner
     * @param {number} chain
     * @param {number} index
     * @returns {string}
     */
    address(cosigner, chain, index) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.group_address(this.__wbg_ptr, cosigner, chain, index);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Signatures the group needs.
     * @returns {number}
     */
    get required() {
        const ret = wasm.group_required(this.__wbg_ptr);
        return ret >>> 0;
    }
}

const HintsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_hints_free(ptr >>> 0, 1));
/**
 * The derivation hints a bundle's inputs get, one call an input.
 */
export class Hints {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        HintsFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_hints_free(ptr, 0);
    }
    /**
     * No hints yet.
     */
    constructor() {
        const ret = wasm.hints_new();
        this.__wbg_ptr = ret >>> 0;
        HintsFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Input `input` is a `45'` group's `cosigner`/`chain`/`index`;
     * `fingerprints` are the cosigners' seed fingerprints, hex, in key
     * order, as many as the app knows; an empty string for one it does not.
     * @param {number} input
     * @param {Group} group
     * @param {number} cosigner
     * @param {number} chain
     * @param {number} index
     * @param {string[]} fingerprints
     */
    group(input, group, cosigner, chain, index, fingerprints) {
        _assertClass(group, Group);
        const ptr0 = passArrayJsValueToWasm0(fingerprints, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.hints_group(this.__wbg_ptr, input, group.__wbg_ptr, cosigner, chain, index, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Input `input` is a `44'` account's `chain`/`index`; `fingerprint`
     * is the seed's master fingerprint, hex, when the app knows it.
     * @param {number} input
     * @param {Account} account
     * @param {number} chain
     * @param {number} index
     * @param {string | null} [fingerprint]
     */
    account(input, account, chain, index, fingerprint) {
        _assertClass(account, Account);
        var ptr0 = isLikeNone(fingerprint) ? 0 : passStringToWasm0(fingerprint, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.hints_account(this.__wbg_ptr, input, account.__wbg_ptr, chain, index, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}

const ImportedFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_imported_free(ptr >>> 0, 1));
/**
 * What [`read_import`] read: `kind` says which of the five things it is,
 * and the matching field holds it.
 */
export class Imported {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Imported.prototype);
        obj.__wbg_ptr = ptr;
        ImportedFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ImportedFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_imported_free(ptr, 0);
    }
    /**
     * A `descriptor` import's line, header stripped: what to keep.
     * @returns {string | undefined}
     */
    get descriptor() {
        const ret = wasm.imported_descriptor(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * A `cosigner` import's seed fingerprint, hex.
     * @returns {string | undefined}
     */
    get fingerprint() {
        const ret = wasm.imported_fingerprint(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * A `kcc3Address` import's address.
     * @returns {Kcc3Address | undefined}
     */
    get kcc3Address() {
        const ret = wasm.imported_kcc3Address(this.__wbg_ptr);
        return ret === 0 ? undefined : Kcc3Address.__wrap(ret);
    }
    /**
     * A `signedMessage` import's record, not yet verified
     * ([`crate::message::verify_message`]).
     * @returns {Record | undefined}
     */
    get signedMessage() {
        const ret = wasm.imported_signedMessage(this.__wbg_ptr);
        return ret === 0 ? undefined : Record.__wrap(ret);
    }
    /**
     * `account`, `cosigner`, `descriptor`, `kcc3Address` or
     * `signedMessage`.
     * @returns {string}
     */
    get kind() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.imported_kind(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * A `descriptor` import's group.
     * @returns {Group | undefined}
     */
    get group() {
        const ret = wasm.imported_group(this.__wbg_ptr);
        return ret === 0 ? undefined : Group.__wrap(ret);
    }
    /**
     * The `44'` account of an `account` import, or the cosigner's key held
     * as an account of a `cosigner` import.
     * @returns {Account | undefined}
     */
    get account() {
        const ret = wasm.imported_account(this.__wbg_ptr);
        return ret === 0 ? undefined : Account.__wrap(ret);
    }
}

const Kcc3AddressFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_kcc3address_free(ptr >>> 0, 1));
/**
 * A `22'` address a unit made, held as text: the one thing an app knows of
 * a `22'` account.
 */
export class Kcc3Address {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Kcc3Address.prototype);
        obj.__wbg_ptr = ptr;
        Kcc3AddressFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Kcc3AddressFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_kcc3address_free(ptr, 0);
    }
    /**
     * `address` as a `22'` address: a script-hash address on mainnet.
     * @param {string} address
     * @returns {Kcc3Address}
     */
    static read(address) {
        const ptr0 = passStringToWasm0(address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.kcc3address_read(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Kcc3Address.__wrap(ret[0]);
    }
    /**
     * The address as text.
     * @returns {string}
     */
    get text() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.kcc3address_text(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * The locking script an output paying it carries.
     * @returns {Uint8Array}
     */
    script() {
        const ret = wasm.kcc3address_script(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
}

const MatrixFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_matrix_free(ptr >>> 0, 1));
/**
 * A code's modules: `size` a side, dark modules `1`, row by row.
 */
export class Matrix {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Matrix.prototype);
        obj.__wbg_ptr = ptr;
        MatrixFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MatrixFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_matrix_free(ptr, 0);
    }
    /**
     * The matrix as an SVG document, drawn as [`Codes::svg`] draws it.
     * @param {number} module
     * @returns {string}
     */
    svg(module) {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.matrix_svg(this.__wbg_ptr, module);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Whether the module at column `x`, row `y` is dark; light outside.
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    dark(x, y) {
        const ret = wasm.matrix_dark(this.__wbg_ptr, x, y);
        return ret !== 0;
    }
    /**
     * Modules a side.
     * @returns {number}
     */
    get size() {
        const ret = wasm.matrix_size(this.__wbg_ptr);
        return ret;
    }
    /**
     * The modules, `size * size` of them, row by row, `1` for dark.
     * @returns {Uint8Array}
     */
    get modules() {
        const ret = wasm.matrix_modules(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
}

const NodeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_node_free(ptr >>> 0, 1));
/**
 * A node's wRPC port, by the encoding it speaks.
 */
export class Node {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NodeFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_node_free(ptr, 0);
    }
    /**
     * A mainnet node's default port for this encoding: 17110 for Borsh,
     * 18110 for JSON.
     * @returns {number}
     */
    defaultPort() {
        const ret = wasm.node_defaultPort(this.__wbg_ptr);
        return ret;
    }
    /**
     * Request `id`, `getServerInfo`: the node's network, sync state, UTXO
     * index and version.
     * @param {number} id
     * @returns {Uint8Array | string}
     */
    getServerInfo(id) {
        const ret = wasm.node_getServerInfo(this.__wbg_ptr, id);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Request `id`, `getFeeEstimate`: fee rates and how fast each
     * confirms.
     * @param {number} id
     * @returns {Uint8Array | string}
     */
    getFeeEstimate(id) {
        const ret = wasm.node_getFeeEstimate(this.__wbg_ptr, id);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Request `id`, `submitTransaction` of `finalized`.
     * @param {number} id
     * @param {Finalized} finalized
     * @returns {Uint8Array | string}
     */
    submitTransaction(id, finalized) {
        _assertClass(finalized, Finalized);
        const ret = wasm.node_submitTransaction(this.__wbg_ptr, id, finalized.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Request `id`, `getUtxosByAddresses`: every coin `addresses` hold
     * (the node needs `--utxoindex`).
     *
     * Throws `Address { index, error }` for an address that does not
     * decode.
     * @param {number} id
     * @param {string[]} addresses
     * @returns {Uint8Array | string}
     */
    getUtxosByAddresses(id, addresses) {
        const ptr0 = passArrayJsValueToWasm0(addresses, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.node_getUtxosByAddresses(this.__wbg_ptr, id, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * For a port speaking `encoding`: `"borsh"` or `"json"`.
     * @param {string} encoding
     */
    constructor(encoding) {
        const ptr0 = passStringToWasm0(encoding, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.node_new(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        NodeFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Read `message` from the node: a string, an `ArrayBuffer` or a
     * `Uint8Array`.
     *
     * Throws `Malformed { at }` at the first wrong byte of a message no
     * node writes; `Id(n)` for an id past a `u32`.
     * @param {string | ArrayBuffer | Uint8Array} message
     * @returns {Answer}
     */
    read(message) {
        const ret = wasm.node_read(this.__wbg_ptr, message);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Answer.__wrap(ret[0]);
    }
    /**
     * `"borsh"` or `"json"`.
     * @returns {string}
     */
    get encoding() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.node_encoding(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const OutputSummaryFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_outputsummary_free(ptr >>> 0, 1));
/**
 * One output of a request, as [`summary`] reads it.
 */
export class OutputSummary {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(OutputSummary.prototype);
        obj.__wbg_ptr = ptr;
        OutputSummaryFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        OutputSummaryFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_outputsummary_free(ptr, 0);
    }
    /**
     * The covenant the output is bound to, hex: a continued covenant's,
     * or the new one's the output starts; none for an output not bound.
     * @returns {string | undefined}
     */
    get covenantId() {
        const ret = wasm.outputsummary_covenantId(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * The input that authorizes the binding, by its place.
     * @returns {number | undefined}
     */
    get authorizingInput() {
        const ret = wasm.outputsummary_authorizingInput(this.__wbg_ptr);
        return ret === 0x100000001 ? undefined : ret;
    }
    /**
     * Sompi.
     * @returns {bigint}
     */
    get value() {
        const ret = wasm.outputsummary_value(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * The locking script.
     * @returns {Uint8Array}
     */
    get script() {
        const ret = wasm.outputsummary_script(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * The mainnet address the output pays; none for a script that pays
     * no address.
     * @returns {string | undefined}
     */
    get address() {
        const ret = wasm.outputsummary_address(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
}

const PreparedFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_prepared_free(ptr >>> 0, 1));
/**
 * What [`prepare_bundle`] made.
 */
export class Prepared {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Prepared.prototype);
        obj.__wbg_ptr = ptr;
        PreparedFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PreparedFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_prepared_free(ptr, 0);
    }
    /**
     * Signatures the unit's reply must carry in all.
     * @returns {number}
     */
    get signatures() {
        const ret = wasm.prepared_signatures(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * The envelope as text.
     * @returns {string}
     */
    get text() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.prepared_text(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * The envelope, `PSKB` and hex, as bytes: what
     * [`crate::transport::codes`] shows the unit as format `pskb`.
     * @returns {Uint8Array}
     */
    get bytes() {
        const ret = wasm.prepared_bytes(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * Inputs of the transaction.
     * @returns {number}
     */
    get inputs() {
        const ret = wasm.prepared_inputs(this.__wbg_ptr);
        return ret >>> 0;
    }
}

const ProfileFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_profile_free(ptr >>> 0, 1));
/**
 * What a unit accepts: the bounds every buffer is sized by and every
 * request is built within.
 */
export class Profile {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Profile.prototype);
        obj.__wbg_ptr = ptr;
        ProfileFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ProfileFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_profile_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get maxFrames() {
        const ret = wasm.profile_maxFrames(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get maxInputs() {
        const ret = wasm.profile_maxInputs(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get maxRedeem() {
        const ret = wasm.profile_maxRedeem(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get maxOutputs() {
        const ret = wasm.profile_maxOutputs(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get maxReassembled() {
        const ret = wasm.profile_maxReassembled(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get maxSigsPerInput() {
        const ret = wasm.profile_maxSigsPerInput(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * The ESP32-S3 units' profile, which the P4 units share: the bounds
     * their firmware declares.
     * @returns {Profile}
     */
    static esp32s3() {
        const ret = wasm.profile_esp32s3();
        return Profile.__wrap(ret);
    }
}

const RatesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_rates_free(ptr >>> 0, 1));
/**
 * A network's mass rates, which the fee is paid over.
 */
export class Rates {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Rates.prototype);
        obj.__wbg_ptr = ptr;
        RatesFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RatesFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_rates_free(ptr, 0);
    }
    /**
     * Mainnet's rates.
     * @returns {Rates}
     */
    static mainnet() {
        const ret = wasm.rates_mainnet();
        return Rates.__wrap(ret);
    }
}

const ReaderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_reader_free(ptr >>> 0, 1));
/**
 * Reads a reply off a unit's screen, one decoded code at a time.
 */
export class Reader {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ReaderFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_reader_free(ptr, 0);
    }
    /**
     * A reader for a unit of `profile` whose screen shows `slot` bytes a
     * frame past the header: 225 on every unit (`display_bytes_per_frame`).
     * @param {Profile} profile
     * @param {number} slot
     */
    constructor(profile, slot) {
        _assertClass(profile, Profile);
        const ret = wasm.reader_new(profile.__wbg_ptr, slot);
        this.__wbg_ptr = ret >>> 0;
        ReaderFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Take one decoded code, as the camera gave it.
     *
     * Throws `Frame(...)` for a frame the unit's reassembler refuses: an
     * unknown format, too many frames, a mixed set, a wrong digest. After
     * either of the last two the reader resets, as the unit does.
     * @param {Uint8Array} code
     * @returns {Taken}
     */
    take(code) {
        const ptr0 = passArray8ToWasm0(code, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.reader_take(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Taken.__wrap(ret[0]);
    }
    /**
     * Forget everything taken so far.
     */
    reset() {
        wasm.reader_reset(this.__wbg_ptr);
    }
    /**
     * The name of the format the codes taken announce, or none yet.
     * @returns {string | undefined}
     */
    format() {
        const ret = wasm.reader_format(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * The whole reply, once a take said `whole`.
     *
     * Throws before the reply is whole.
     * @returns {Uint8Array}
     */
    collect() {
        const ret = wasm.reader_collect(this.__wbg_ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * Which frames are in, as a `BigInt`: bit `i` for frame `i`, over the
     * first 64. Zero after a bare reply, a reset, or a set dropped for
     * another.
     * @returns {bigint}
     */
    received() {
        const ret = wasm.reader_received(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
}

const RecordFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_record_free(ptr >>> 0, 1));
/**
 * A signed message record's three parts, as text.
 */
export class Record {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Record.prototype);
        obj.__wbg_ptr = ptr;
        RecordFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RecordFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_record_free(ptr, 0);
    }
    /**
     * The text signed.
     * @returns {string}
     */
    get text() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.record_text(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * The address that signed.
     * @returns {string}
     */
    get address() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.record_address(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * The signature, hex.
     * @returns {string}
     */
    get signature() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.record_signature(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const RequestFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_request_free(ptr >>> 0, 1));
/**
 * A built request: its bytes and what it pays.
 */
export class Request {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Request.prototype);
        obj.__wbg_ptr = ptr;
        RequestFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RequestFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_request_free(ptr, 0);
    }
    /**
     * Signatures the unit's reply must carry in all.
     * @returns {number}
     */
    get signatures() {
        const ret = wasm.request_signatures(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * The fee the transaction pays, sompi.
     * @returns {bigint}
     */
    get fee() {
        const ret = wasm.request_fee(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * The mass the fee was computed over, grams.
     * @returns {bigint}
     */
    get mass() {
        const ret = wasm.request_mass(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * The bytes as text: the bundle's envelope, or the safe JSON.
     * @returns {string}
     */
    get text() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.request_text(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * The KSPT, bundle envelope or safe JSON: what
     * [`crate::transport::codes`] shows the unit or a wallet is handed,
     * and what the reply is read against.
     * @returns {Uint8Array}
     */
    get bytes() {
        const ret = wasm.request_bytes(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * The change output's value, when there is one.
     * @returns {bigint | undefined}
     */
    get change() {
        const ret = wasm.request_change(this.__wbg_ptr);
        return ret[0] === 0 ? undefined : BigInt.asUintN(64, ret[1]);
    }
}

const RequestBuilderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_requestbuilder_free(ptr >>> 0, 1));
/**
 * Gathers a request's coins, outputs and change, then builds it.
 */
export class RequestBuilder {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RequestBuilderFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_requestbuilder_free(ptr, 0);
    }
    /**
     * The lock time, `lock_time`: a DAA score below rusty-kaspa's
     * threshold, 500,000,000,000, else milliseconds; zero, the default,
     * for none. No block takes the transaction until it is past; the unit
     * shows it on its LOCK TIME page.
     * @param {bigint} lock_time
     */
    lockUntil(lock_time) {
        wasm.requestbuilder_lockUntil(this.__wbg_ptr, lock_time);
    }
    /**
     * Pay `amount` sompi to a locking script.
     * @param {Uint8Array} script
     * @param {bigint} amount
     */
    payScript(script, amount) {
        const ptr0 = passArray8ToWasm0(script, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.requestbuilder_payScript(this.__wbg_ptr, ptr0, len0, amount);
    }
    /**
     * Spend `coin`, a UTXO of `card`, leaving the unit to find its key. A
     * build throws `CardLocked { coin }` under a lock time before the
     * card's; `buildSafeJson` throws `CardInSafeJson { coin }`.
     * @param {Card} card
     * @param {Coin} coin
     */
    spendCard(card, coin) {
        _assertClass(card, Card);
        _assertClass(coin, Coin);
        const ret = wasm.requestbuilder_spendCard(this.__wbg_ptr, card.__wbg_ptr, coin.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Spend `coin`, of a `22'` address, with its `chain`/`index` below the
     * `22'` account when the app knows it (both or neither).
     * @param {Kcc3Address} address
     * @param {Coin} coin
     * @param {number | null} [chain]
     * @param {number | null} [index]
     */
    spendKcc3(address, coin, chain, index) {
        _assertClass(address, Kcc3Address);
        _assertClass(coin, Coin);
        const ret = wasm.requestbuilder_spendKcc3(this.__wbg_ptr, address.__wbg_ptr, coin.__wbg_ptr, isLikeNone(chain) ? 0x100000001 : (chain) >>> 0, isLikeNone(index) ? 0x100000001 : (index) >>> 0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Pay `amount` sompi to a `44'` account's own receive address
     * `index`, which the unit checks and shows as YOURS, `Receive #index`.
     *
     * Throws for an index the receive chain has no address at.
     * @param {Account} account
     * @param {number} index
     * @param {bigint} amount
     */
    payAccount(account, index, amount) {
        _assertClass(account, Account);
        const ret = wasm.requestbuilder_payAccount(this.__wbg_ptr, account.__wbg_ptr, index, amount);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Spend `coin`, of a `45'` group's `cosigner`/`chain`/`index`.
     * @param {Group} group
     * @param {number} cosigner
     * @param {number} chain
     * @param {number} index
     * @param {Coin} coin
     */
    spendGroup(group, cosigner, chain, index, coin) {
        _assertClass(group, Group);
        _assertClass(coin, Coin);
        wasm.requestbuilder_spendGroup(this.__wbg_ptr, group.__wbg_ptr, cosigner, chain, index, coin.__wbg_ptr);
    }
    /**
     * The network's DAA score now, `daa_score` (a node's
     * `virtualDaaScore`): builds then throw `ImmatureCoinbase { coin }` for
     * an immature coinbase coin with its entry.
     * @param {bigint} daa_score
     */
    atDaaScore(daa_score) {
        wasm.requestbuilder_atDaaScore(this.__wbg_ptr, daa_score);
    }
    /**
     * Build the request as rusty-kaspa's PSKB bundle, every coin with its
     * entry (`Coin.withEntry`): shown to the unit as format `pskb`, its
     * replies read with `readBundle`.
     *
     * Throws `NoEntry { coin }` for a coin without its entry, otherwise as
     * `build` but never `Kspt(...)` or `TooLong`.
     * @param {bigint} fee_rate
     * @param {Rates} rates
     * @param {Profile} profile
     * @returns {Request}
     */
    buildBundle(fee_rate, rates, profile) {
        _assertClass(rates, Rates);
        _assertClass(profile, Profile);
        const ret = wasm.requestbuilder_buildBundle(this.__wbg_ptr, fee_rate, rates.__wbg_ptr, profile.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Request.__wrap(ret[0]);
    }
    /**
     * Let the request end a covenant: spend a coin bound to one
     * (`Coin.boundTo`) with no output continuing it, so what the coin held
     * leaves as plain KAS. Without it a build throws
     * `CovenantBound { coin }` for such a coin. The unit shows the
     * covenant ending, `No output continues it`.
     */
    endCovenants() {
        wasm.requestbuilder_endCovenants(this.__wbg_ptr);
    }
    /**
     * Spend `coin`, of a `44'` account's `chain`/`index`.
     * @param {Account} account
     * @param {number} chain
     * @param {number} index
     * @param {Coin} coin
     */
    spendAccount(account, chain, index, coin) {
        _assertClass(account, Account);
        _assertClass(coin, Coin);
        wasm.requestbuilder_spendAccount(this.__wbg_ptr, account.__wbg_ptr, chain, index, coin.__wbg_ptr);
    }
    /**
     * As `spendCard`, signed by `account`'s receive `index`
     * (`Card.signer`); a build throws `NotTheCardsKey { coin }` if that is
     * neither of the card's keys.
     * @param {Card} card
     * @param {Coin} coin
     * @param {Account} account
     * @param {number} index
     */
    spendCardAs(card, coin, account, index) {
        _assertClass(card, Card);
        _assertClass(coin, Coin);
        _assertClass(account, Account);
        const ret = wasm.requestbuilder_spendCardAs(this.__wbg_ptr, card.__wbg_ptr, coin.__wbg_ptr, account.__wbg_ptr, index);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Bind output `output`, by its place among the outputs paid so far,
     * to a new covenant that coin `coin`'s input authorizes, by its place
     * among the coins. Every output started from the same coin is of that
     * one covenant; `summary` reads its id from the built request
     * (`OutputSummary.covenantId`). The transaction is then version 1,
     * which `buildBundle` cannot carry (`CovenantInBundle`).
     *
     * Throws `BadBinding { output }` for an output not paid yet; a build
     * throws it for a coin the request does not spend.
     * @param {number} output
     * @param {number} coin
     */
    startCovenant(output, coin) {
        const ret = wasm.requestbuilder_startCovenant(this.__wbg_ptr, output, coin);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * As `sweepTo`, to a `45'` group's own `cosigner`/`chain`/`index`,
     * which the unit checks and shows as CHANGE.
     *
     * Throws for a place the group has no address at.
     * @param {Group} group
     * @param {number} cosigner
     * @param {number} chain
     * @param {number} index
     */
    sweepToGroup(group, cosigner, chain, index) {
        _assertClass(group, Group);
        const ret = wasm.requestbuilder_sweepToGroup(this.__wbg_ptr, group.__wbg_ptr, cosigner, chain, index);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Build the request, unsigned, as `Transaction.serializeToSafeJSON`
     * writes it, for a wallet that signs that JSON; `text` is the JSON and
     * `finalizeSafeJson` reads it back signed.
     *
     * Throws as `buildBundle`; `CardInSafeJson { coin }` for a card's UTXO.
     * @param {bigint} fee_rate
     * @param {Rates} rates
     * @param {Profile} profile
     * @returns {Request}
     */
    buildSafeJson(fee_rate, rates, profile) {
        _assertClass(rates, Rates);
        _assertClass(profile, Profile);
        const ret = wasm.requestbuilder_buildSafeJson(this.__wbg_ptr, fee_rate, rates.__wbg_ptr, profile.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Request.__wrap(ret[0]);
    }
    /**
     * Send the change to a `45'` group's `cosigner`/`chain`/`index`,
     * marked for the unit to show as CHANGE.
     * @param {Group} group
     * @param {number} cosigner
     * @param {number} chain
     * @param {number} index
     */
    changeToGroup(group, cosigner, chain, index) {
        _assertClass(group, Group);
        wasm.requestbuilder_changeToGroup(this.__wbg_ptr, group.__wbg_ptr, cosigner, chain, index);
    }
    /**
     * As `sweepTo`, to a `44'` account's own `chain`/`index`, which the
     * unit checks and shows as YOURS or CHANGE.
     *
     * Throws for a place the account has no address at.
     * @param {Account} account
     * @param {number} chain
     * @param {number} index
     */
    sweepToAccount(account, chain, index) {
        _assertClass(account, Account);
        const ret = wasm.requestbuilder_sweepToAccount(this.__wbg_ptr, account.__wbg_ptr, chain, index);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Send the change to a `44'` account's `chain`/`index`.
     * @param {Account} account
     * @param {number} chain
     * @param {number} index
     */
    changeToAccount(account, chain, index) {
        _assertClass(account, Account);
        wasm.requestbuilder_changeToAccount(this.__wbg_ptr, account.__wbg_ptr, chain, index);
    }
    /**
     * Bind output `output`, by its place among the outputs paid so far,
     * to the covenant coin `coin` is bound to, by its place among the
     * coins: the output continues that covenant, under the coin's id, and
     * the coin's input authorizes it. The transaction is then version 1,
     * which `buildBundle` cannot carry (`CovenantInBundle`).
     *
     * Throws `BadBinding { output }` for an output not paid yet; a build
     * throws it for a coin the request does not spend, or one bound to no
     * covenant.
     * @param {number} output
     * @param {number} coin
     */
    continueCovenant(output, coin) {
        const ret = wasm.requestbuilder_continueCovenant(this.__wbg_ptr, output, coin);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * An empty request.
     */
    constructor() {
        const ret = wasm.requestbuilder_new();
        this.__wbg_ptr = ret >>> 0;
        RequestBuilderFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Pay `amount` sompi to `address`, a mainnet address.
     * @param {string} address
     * @param {bigint} amount
     */
    pay(address, amount) {
        const ptr0 = passStringToWasm0(address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.requestbuilder_pay(this.__wbg_ptr, ptr0, len0, amount);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Build the KSPT the unit reads, at `fee_rate` sompi a gram (never
     * under the minimum relay fee), over `rates`, within `profile`.
     *
     * Throws `ImmatureCoinbase { coin }` first (`atDaaScore`), then as the
     * SDK's `RequestError` says: `Empty`, `TooMany`,
     * `Insufficient { have, need }`, `Dust { output }`, `SweepDust`,
     * `Multisig(...)`, `TooLong { len, limit }`...
     * @param {bigint} fee_rate
     * @param {Rates} rates
     * @param {Profile} profile
     * @returns {Request}
     */
    build(fee_rate, rates, profile) {
        _assertClass(rates, Rates);
        _assertClass(profile, Profile);
        const ret = wasm.requestbuilder_build(this.__wbg_ptr, fee_rate, rates.__wbg_ptr, profile.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Request.__wrap(ret[0]);
    }
    /**
     * Everything the coins hold, less the fee, to `address`, a mainnet
     * address: a `22'` spend, or emptying an account. Instead of `pay` and
     * a change.
     * @param {string} address
     */
    sweepTo(address) {
        const ptr0 = passStringToWasm0(address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.requestbuilder_sweepTo(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}

const ServerInfoFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_serverinfo_free(ptr >>> 0, 1));
/**
 * The node's state.
 */
export class ServerInfo {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ServerInfo.prototype);
        obj.__wbg_ptr = ptr;
        ServerInfoFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ServerInfoFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_serverinfo_free(ptr, 0);
    }
    /**
     * Whether it keeps the UTXO index `getUtxosByAddresses` needs.
     * @returns {boolean}
     */
    get hasUtxoIndex() {
        const ret = wasm.serverinfo_hasUtxoIndex(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * The node's version, `2.1.0` and the like.
     * @returns {string}
     */
    get serverVersion() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.serverinfo_serverVersion(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * 1 on every known node; by upstream's rule a client refuses a node
     * reporting another.
     * @returns {number}
     */
    get rpcApiVersion() {
        const ret = wasm.serverinfo_rpcApiVersion(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get rpcApiRevision() {
        const ret = wasm.serverinfo_rpcApiRevision(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {bigint}
     */
    get virtualDaaScore() {
        const ret = wasm.serverinfo_virtualDaaScore(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * Its network, `mainnet`, `testnet-10` and the like. KasSigner is
     * mainnet only: an app refuses any other.
     * @returns {string}
     */
    get network() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.serverinfo_network(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Whether it has caught up with the network; until then the coins it
     * lists may be stale.
     * @returns {boolean}
     */
    get isSynced() {
        const ret = wasm.serverinfo_isSynced(this.__wbg_ptr);
        return ret !== 0;
    }
}

const SummaryFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_summary_free(ptr >>> 0, 1));
/**
 * What a request or a reply carries, read back.
 */
export class Summary {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Summary.prototype);
        obj.__wbg_ptr = ptr;
        SummaryFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SummaryFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_summary_free(ptr, 0);
    }
    /**
     * Signatures the bytes carry: none on a request.
     * @returns {number}
     */
    get signatures() {
        const ret = wasm.summary_signatures(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * The fee: in less out.
     * @returns {bigint}
     */
    get fee() {
        const ret = wasm.summary_fee(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * Inputs.
     * @returns {number}
     */
    get inputs() {
        const ret = wasm.summary_inputs(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * The outputs.
     * @returns {OutputSummary[]}
     */
    get outputs() {
        const ret = wasm.summary_outputs(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * The transaction's version: 1 with an output bound to a covenant.
     * @returns {number}
     */
    get version() {
        const ret = wasm.summary_version(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Sompi the inputs hold.
     * @returns {bigint}
     */
    get totalIn() {
        const ret = wasm.summary_totalIn(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * The lock time, zero for none: what the unit's LOCK TIME page shows.
     * @returns {bigint}
     */
    get lockTime() {
        const ret = wasm.summary_lockTime(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * Each input's outpoint, `txId:index`.
     * @returns {string[]}
     */
    get outpoints() {
        const ret = wasm.summary_outpoints(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Sompi the outputs pay.
     * @returns {bigint}
     */
    get totalOut() {
        const ret = wasm.summary_totalOut(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
}

const TakenFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_taken_free(ptr >>> 0, 1));
/**
 * What a code the reader took did.
 */
export class Taken {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Taken.prototype);
        obj.__wbg_ptr = ptr;
        TakenFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TakenFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_taken_free(ptr, 0);
    }
    /**
     * Frames in, when `partial`.
     * @returns {number}
     */
    get have() {
        const ret = wasm.taken_have(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Frames expected, when `partial`.
     * @returns {number}
     */
    get need() {
        const ret = wasm.taken_need(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Whether the reply is whole.
     * @returns {boolean}
     */
    get whole() {
        const ret = wasm.taken_whole(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * The reply's length, when `whole`.
     * @returns {number}
     */
    get length() {
        const ret = wasm.taken_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * `whole` (the reply is in, [`Reader::collect`] gives it), `partial`
     * (`have` of `need` frames in), `nothing` (a frame already held, or of
     * a dropped transmission) or `notAReply` (something else was in view).
     * @returns {string}
     */
    get status() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.taken_status(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const UtxoFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_utxo_free(ptr >>> 0, 1));
/**
 * A coin an address holds.
 */
export class Utxo {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Utxo.prototype);
        obj.__wbg_ptr = ptr;
        UtxoFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        UtxoFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_utxo_free(ptr, 0);
    }
    /**
     * The covenant it is bound to, hex; the SDK's requests bind none.
     * @returns {string | undefined}
     */
    get covenantId() {
        const ret = wasm.utxo_covenantId(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * A block reward, which matures before it can be spent.
     * @returns {boolean}
     */
    get isCoinbase() {
        const ret = wasm.utxo_isCoinbase(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {number}
     */
    get scriptVersion() {
        const ret = wasm.utxo_scriptVersion(this.__wbg_ptr);
        return ret;
    }
    /**
     * Its transaction's id, hex.
     * @returns {string}
     */
    get transactionId() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.utxo_transactionId(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * When it was accepted, in DAA score.
     * @returns {bigint}
     */
    get blockDaaScore() {
        const ret = wasm.utxo_blockDaaScore(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * This UTXO as a `Coin`, with its entry and any covenant it is bound
     * to.
     * @returns {Coin}
     */
    coin() {
        const ret = wasm.utxo_coin(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Coin.__wrap(ret[0]);
    }
    /**
     * @returns {number}
     */
    get index() {
        const ret = wasm.utxo_index(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Sompi.
     * @returns {bigint}
     */
    get amount() {
        const ret = wasm.utxo_amount(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * The locking script.
     * @returns {Uint8Array}
     */
    get script() {
        const ret = wasm.utxo_script(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * The address asked about that holds it; a node may leave it out.
     * @returns {string | undefined}
     */
    get address() {
        const ret = wasm.utxo_address(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
}

const VerifiedFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_verified_free(ptr >>> 0, 1));
/**
 * A verified record: its parts, and the key of the mainnet address that
 * signed.
 */
export class Verified {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Verified.prototype);
        obj.__wbg_ptr = ptr;
        VerifiedFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        VerifiedFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_verified_free(ptr, 0);
    }
    /**
     * The x-only key the address carries, hex, which the signature
     * verified against.
     * @returns {string}
     */
    get key() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.verified_key(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * The record.
     * @returns {Record}
     */
    get record() {
        const ret = wasm.verified_record(this.__wbg_ptr);
        return Record.__wrap(ret);
    }
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_bucket_new = function(arg0) {
        const ret = Bucket.__wrap(arg0);
        return ret;
    };
    imports.wbg.__wbg_buffer_609cc3eee51ed158 = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_length_a446193dc22c12f8 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_new_a12002a7f91c75be = function(arg0) {
        const ret = new Uint8Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_d97e637ebe145a9a = function(arg0, arg1, arg2) {
        const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_outputsummary_new = function(arg0) {
        const ret = OutputSummary.__wrap(arg0);
        return ret;
    };
    imports.wbg.__wbg_set_65595bdd868b3009 = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_utxo_new = function(arg0) {
        const ret = Utxo.__wrap(arg0);
        return ret;
    };
    imports.wbg.__wbindgen_error_new = function(arg0, arg1) {
        const ret = new Error(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_export_0;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
        ;
    };
    imports.wbg.__wbindgen_memory = function() {
        const ret = wasm.memory;
        return ret;
    };
    imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
        const obj = arg1;
        const ret = typeof(obj) === 'string' ? obj : undefined;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        const ret = getStringFromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };

    return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('kassigner_sdk_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
