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

#### PaseoNextV2 AssetHub

Genesis `0x23e730eb1c6fecae09c917439a5038cb6122d0d48980e8b9bbf0ff56f94a2ca6`.

Version 0.1.0:

- **SchemaRegistry**:
  - Contract: `0x46fe8c29dece5a882be37a459c6e8ba1b73d3f20`
  - Deployment and ABI: [SchemaRegistry.sol](evm/contracts/SchemaRegistry.sol)
- **AttestationService**:
  - Contract: `0x36e63233695675fd5b1f957da746602bd234fe19`
  - Deployment and ABI: [AttestationService.sol](evm/contracts/AttestationService.sol)

#### Previewnet AssetHub

Genesis `0x4d11c803cc6921429e3876638977ad006ea1bba8cd3976a0bca2f164e7026210`.

Version 0.1.0:

- **SchemaRegistry**:
  - Contract: `0x46fe8c29dece5a882be37a459c6e8ba1b73d3f20`
  - Deployment and ABI: [SchemaRegistry.sol](evm/contracts/SchemaRegistry.sol)
- **AttestationService**:
  - Contract: `0x36e63233695675fd5b1f957da746602bd234fe19`
  - Deployment and ABI: [AttestationService.sol](evm/contracts/AttestationService.sol)

## License

Licensed under the [MIT License](LICENSE).

## Security

This is reference and proof-of-concept code. It has not been independently audited. Please follow
the [Parity security policy](https://github.com/paritytech/.github/blob/main/SECURITY.md) for reporting vulnerabilities.
