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

#### Paseo AssetHubNextV2

Genesis `0x4349b00e54897e21196fd331015fc5be0f14e118beb0375ed2bb1793737bb57a`.

Version 1.0.0:

- **SchemaRegistry**:
  - Contract: `0x90e2a80f6c59C2e1cbd0Be50f60bA56bae4ADE97`
  - Deployment and ABI: [SchemaRegistry.sol](evm/contracts/SchemaRegistry.sol)
- **AttestationService**:
  - Contract: `0xA722702956694BFF0Ad6689df0505C3e357Bf0F1`
  - Deployment and ABI: [AttestationService.sol](evm/contracts/AttestationService.sol)

#### Previewnet AssetHub

Genesis `0xc27c8bf3f13f96dc2130cd2b0a3debe57618fd02521ecc1902bd7dd4ed83d2fe`.

Version 1.0.0:

- **SchemaRegistry**:
  - Contract: `0x90e2a80f6c59C2e1cbd0Be50f60bA56bae4ADE97`
  - Deployment and ABI: [SchemaRegistry.sol](evm/contracts/SchemaRegistry.sol)
- **AttestationService**:
  - Contract: `0xA722702956694BFF0Ad6689df0505C3e357Bf0F1`
  - Deployment and ABI: [AttestationService.sol](evm/contracts/AttestationService.sol)

## License

Licensed under the [MIT License](LICENSE).

## Security

This is reference and proof-of-concept code. It has not been independently audited. Please follow
the [Parity security policy](https://github.com/paritytech/.github/blob/main/SECURITY.md) for reporting vulnerabilities.
