> [!WARNING]
> The following is a prototype, reference implementation, and proof-of-concept. This open source code is provided for research, experimentation, and developer education only. This code has not been audited, is actively experimental, and may contain bugs, vulnerabilities, or incomplete features. Use at your own risk.

<div align="center">

# Polkadot Attestation Protocol

</div>

A permissionless protocol for creating, revoking, and verifying attestations. Users register schemas that define data formats, then issue attestations against those schemas, producing verifiable, immutable claims.

## Deploy

Using npm

```bash
$ npm run deploy
```

Using yarn

```bash
$ yarn run deploy
```

Using pnpm

```bash
$ pnpm run deploy
```

Using bun

```bash
$ bun run deploy
```

## Deployments

### Testnets

#### Paseo Next Asset Hub V2

* **SchemaRegistry**: [`0xbe92a66b697dc9bd4a35b1b8e3aead484d2010a7`](https://assethub-paseo.subscan.io/account/0xbe92a66b697dc9bd4a35b1b8e3aead484d2010a7)
* **AttestationService**: [`0x24af868f14605460f6385aae166986cee9800514`](https://assethub-paseo.subscan.io/account/0x24af868f14605460f6385aae166986cee9800514)

#### Paseo Next Asset Hub V1

* **SchemaRegistry**: [`0xb50a0be72877a06b90e093a02db6aa659644ddf3`](https://assethub-paseo.subscan.io/account/0xb50a0be72877a06b90e093a02db6aa659644ddf3)
* **AttestationService**: [`0xff35f0da2de747f800baef2a01b03f51af7d111d`](https://assethub-paseo.subscan.io/account/0xff35f0da2de747f800baef2a01b03f51af7d111d)

## License

Licensed under the [MIT License](LICENSE).

## Security

This is reference and proof-of-concept code. It has not been independently audited. Please follow
the [Parity security policy](https://github.com/paritytech/.github/blob/main/SECURITY.md) for reporting vulnerabilities.
