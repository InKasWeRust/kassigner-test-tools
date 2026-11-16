#!/bin/sh
# SPDX-License-Identifier: GPL-3.0-or-later
# KasSigner test tool: the copy kassigner.org serves, written from this source.
#
#   sh make-hosted.sh <output folder>
#
# This folder is the full tool: watch a wallet, build a request, read the
# signer's reply, broadcast. The hosted copy is the same site with every
# part that builds, checks or sends a transaction left out: no Send, no
# Broadcast, no consolidation, no deposit to a card and no claim from one.
# The code is not hidden there, it is absent: a page cannot be made to run
# what it was never sent.
#
# The SDK goes the same way. `sdk/` here is the full package; `sdk-watch/`
# is the watch-only one (`sh crates/kassigner-sdk-wasm/build.sh watch` in
# the KasSigner repository, its `pkg-watch/` copied here), with no request
# builder, no reply reader and no submit in it. The hosted copy gets that
# one as its `sdk/`, and no `sdk-watch/`.
#
# In `app/ui.js` and `app/wallet.js`:
#
#   // #full          from this line
#   // #end           to this one: left out of the hosted copy
#
#   /* #hosted        from this line
#   #end */           to this one: a comment here, code in the hosted copy
#
#   const HOSTED = false;   set to true there; it only picks words
#
# In `index.html` the same two, as HTML comments: `<!-- #full -->` to
# `<!-- #end -->` is left out, `<!-- #hosted` to `#end -->` is switched on.
# The landing's warning and its words are there.
#
# Every other file is copied as it is. The output folder is made new each
# time and must be outside this one. Nothing is written unless every check
# below passes: the markers pair up, both files parse (Node.js is needed),
# and none of the names a transaction is built, finished or sent with is
# left in the two files or in the SDK package beside them.

set -eu

HERE="$(cd "$(dirname "$0")" && pwd)"
if [ $# -ne 1 ]; then
    echo "usage: sh make-hosted.sh <output folder>" >&2
    exit 2
fi
mkdir -p "$1"
OUT="$(cd "$1" && pwd)"
case "$OUT/" in
"$HERE"/*)
    echo "the output folder must be outside $HERE" >&2
    exit 2
    ;;
esac
if ! command -v node >/dev/null 2>&1; then
    echo "node is needed, to check that the hosted copy parses (https://nodejs.org)" >&2
    exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Every file but this script and what git and editors leave behind.
(cd "$HERE" && find . -type f \
    ! -path './.git/*' ! -name 'make-hosted.sh' ! -name '.DS_Store' \
    ! -name '*.bak' ! -name '*.log') | while IFS= read -r f; do
    mkdir -p "$TMP/$(dirname "$f")"
    cp "$HERE/$f" "$TMP/$f"
done

# The watch-only SDK package in the full one's place.
for f in kassigner_sdk.js kassigner_sdk_bg.wasm; do
    if [ ! -f "$TMP/sdk-watch/$f" ]; then
        echo "sdk-watch/$f is missing: build the watch-only package in the KasSigner repository" >&2
        echo "    sh crates/kassigner-sdk-wasm/build.sh watch" >&2
        echo "and copy its pkg-watch/ here as sdk-watch/" >&2
        exit 1
    fi
done
rm -rf "$TMP/sdk"
mv "$TMP/sdk-watch" "$TMP/sdk"

# One file, its marked parts taken out or switched on: `cut <file>` for the
# two scripts' markers, `cut <file> html` for the page's.
cut() {
    awk -v kind="${2:-js}" '
        function fail(m) { print FILENAME ":" NR ": " m > "/dev/stderr"; bad = 1; exit 1 }
        BEGIN {
            if (kind == "html") {
                a = "^[ \t]*<!-- #full -->$"; b = "^[ \t]*<!-- #end -->$"
                c = "^[ \t]*<!-- #hosted$"; d = "^[ \t]*#end -->$"
            } else {
                a = "^[ \t]*// #full$"; b = "^[ \t]*// #end$"
                c = "^[ \t]*/[*] #hosted$"; d = "^[ \t]*#end [*]/$"
            }
        }
        $0 ~ a { if (state) fail("a marker inside another"); state = 1; full++; next }
        $0 ~ b { if (state != 1) fail("an end of a full part with no start before it"); state = 0; next }
        $0 ~ c { if (state) fail("a marker inside another"); state = 2; hosted++; next }
        $0 ~ d { if (state != 2) fail("an end of a hosted part with no start before it"); state = 0; next }
        state == 1 { next }
        { print }
        END {
            if (bad) exit 1
            if (state) { print FILENAME ": a marker left open" > "/dev/stderr"; exit 1 }
            if (!full) { print FILENAME ": no full part found" > "/dev/stderr"; exit 1 }
        }
    ' "$HERE/$1" > "$TMP/$1"
}
cut app/ui.js
cut app/wallet.js
cut index.html html

# No marker is left in the three, and the page has its warning.
if grep -nE '^[[:space:]]*(// #(full|end)|/[*] #hosted|#end [*]/|<!-- #(full|end|hosted)|#end -->)' \
    "$TMP/app/ui.js" "$TMP/app/wallet.js" "$TMP/index.html" >&2; then
    echo "a marker is left in the hosted copy: each goes alone on its line" >&2
    exit 1
fi
if [ "$(grep -c '<div id="warn" ' "$TMP/index.html")" -ne 1 ] \
    || [ "$(grep -c 'data-act="warnOk"' "$TMP/index.html")" -ne 1 ] \
    || ! grep -q 'warnOk: ' "$TMP/app/ui.js"; then
    echo "the hosted copy has no landing warning, or no way to close it" >&2
    exit 1
fi

# The one switch, which must be there exactly once.
if [ "$(grep -c '^const HOSTED = false;$' "$TMP/app/ui.js")" -ne 1 ]; then
    echo "app/ui.js: expected one line \`const HOSTED = false;\`" >&2
    exit 1
fi
sed 's/^const HOSTED = false;$/const HOSTED = true;/' "$TMP/app/ui.js" > "$TMP/app/ui.js.new"
mv "$TMP/app/ui.js.new" "$TMP/app/ui.js"

# Both parse.
node --check "$TMP/app/ui.js"
node --check "$TMP/app/wallet.js"

# Nothing a transaction is built, finished or sent with is left.
found=0
for name in \
    'RequestBuilder' 'buildBundle' 'buildSafeJson' \
    'spendAccount' 'spendGroup' 'spendCard' 'sweepTo' 'changeTo' \
    'finalizeReply' 'finalizeBundle' 'finalizeSigned' 'finalizeSafeJson' \
    'readReply' 'readBundle' 'readSignedReply' 'readSignedBundle' \
    'mergeReplies' 'mergeBundles' 'mergeSigned' \
    'submitTransaction' 'claimCard' \
    'W.build(' 'W.consolidate(' 'W.broadcast(' \
    "rest.call('/transactions',"; do
    if grep -nF -- "$name" "$TMP/app/ui.js" "$TMP/app/wallet.js" >&2; then
        echo "the hosted copy still names \`$name\`" >&2
        found=1
    fi
done
# Nor in the SDK package: its classes and functions by how the module
# declares them, its code by the names it exports.
for name in \
    'class RequestBuilder' 'class Rates' 'class Finalized' \
    'function finalizeReply' 'function finalizeBundle' \
    'function finalizeSignedReply' 'function finalizeSignedBundle' \
    'function finalizeSafeJson' \
    'function readReply' 'function readBundle' \
    'function readSignedReply' 'function readSignedBundle' \
    'function mergeReplies' 'function mergeBundles' \
    'function mergeSignedReplies' 'function mergeSignedBundles' \
    'function prepareBundle' 'submitTransaction('; do
    if grep -nF -- "$name" "$TMP/sdk/kassigner_sdk.js" >&2; then
        echo "the hosted copy's SDK module still has \`$name\`" >&2
        found=1
    fi
done
for name in \
    'requestbuilder_' 'rates_mainnet' 'finalized_' 'node_submitTransaction' \
    'finalizeReply' 'finalizeBundle' 'mergeReplies' 'mergeBundles' \
    'readReply' 'readBundle' 'prepareBundle'; do
    if grep -qaF -- "$name" "$TMP/sdk/kassigner_sdk_bg.wasm"; then
        echo "the hosted copy's SDK code still exports \`$name\`" >&2
        found=1
    fi
done
if [ "$found" -ne 0 ]; then
    exit 1
fi

# Checked: into place, the folder made new.
find "$OUT" -mindepth 1 -maxdepth 1 ! -name '.git' ! -name 'CNAME' ! -name '.nojekyll' \
    -exec rm -rf {} +
cp -R "$TMP"/. "$OUT"/
echo "hosted copy written to $OUT"
(cd "$OUT" && wc -c app/ui.js app/wallet.js sdk/kassigner_sdk.js sdk/kassigner_sdk_bg.wasm)
