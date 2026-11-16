<!-- SPDX-License-Identifier: GPL-3.0-or-later — KasSigner test tool. See LICENSE; sdk/ is MPL-2.0. -->

# KasSigner test tool

The web page the [KasSigner](https://github.com/InKasWeRust/KasSigner) project
tests its signers with. It runs in a browser, holds only public keys, and
talks to a KasSigner unit through QR codes and the camera.

It is **not a wallet and not a product**. There is no support. It is here so
that an owner can try a unit, and so that a wallet builder can see the
[SDK](https://github.com/InKasWeRust/KasSigner/tree/main/crates/kassigner-sdk)
at work in a real page. Mainnet only.

## Two copies

| Copy | Where | What it does |
| --- | --- | --- |
| The full tool | This repository's `main` branch | Watches a wallet or a multisig, builds a request, reads the unit's reply, broadcasts; makes, funds and claims Time-Locked Savings cards; checks a signed message |
| The hosted copy | [kassigner.org](https://kassigner.org), the `gh-pages` branch | The same page with everything that builds, checks or sends a transaction left out: no Send, no Broadcast, no deposit to a card and no claim from one |

The hosted copy is written from the full one by `make-hosted.sh`. The code it
leaves out is absent there, not hidden.

## Run your own copy

The full tool is yours to run, **at your own risk**. It is plain files: no
build, no install, no account.

1. Download this repository, or clone it:

   ```sh
   git clone https://github.com/InKasWeRust/kassigner-test-tools
   cd kassigner-test-tools
   ```

2. Serve the folder with any local web server. With Python:

   ```sh
   python3 -m http.server 8080
   ```

3. Open `http://localhost:8080` in your browser.

Opening `index.html` straight from the disk does not work: a browser loads
the page's modules only from a web server. Use `localhost`: from any other
address a browser gives the camera only to a page served over HTTPS.

The page keeps nothing in your browser. It reads the chain through a public
REST server and public nodes; Settings takes your own REST server and your
own node.

Always check a transaction on the unit's own screen. This page runs on an
online computer: the unit shows what is in the request, not what the page
says.

## The SDK packages

`sdk/` and `sdk-watch/` are the KasSigner SDK's browser package, full and
watch-only, built in the KasSigner repository and copied here:

| Folder here | Built with | Copied from |
| --- | --- | --- |
| `sdk/` | `sh crates/kassigner-sdk-wasm/build.sh` | its `pkg/` |
| `sdk-watch/` | `sh crates/kassigner-sdk-wasm/build.sh watch` | its `pkg-watch/` |

Each build prints the SHA-256 of what it made, to compare with the files
here.

## Licence

The page and its code are [GPL-3.0-or-later](LICENSE). The SDK in `sdk/` and
`sdk-watch/` is MPL-2.0, each with its `LICENSE` and `THIRD_PARTY_NOTICES`.
The fonts, icons and QR reader in `vendor/` keep their own licences:
[THIRD_PARTY.md](THIRD_PARTY.md).
