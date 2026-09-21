> [!WARNING]
> The following is a prototype, reference implementation, and proof-of-concept. This open source code is provided for research, experimentation, and developer education only. This code has not been audited, is actively experimental, and may contain bugs, vulnerabilities, or incomplete features. Use at your own risk.

<div align="center">

# Polkadot Attestation Protocol

</div>

A permissionless protocol for creating, revoking, and verifying attestations. Users register schemas that define data formats, then issue attestations against those schemas, producing verifiable, immutable claims.

## Deploy

Contracts are deployed through the CREATE3 factory the dotNS contracts use, so an address depends on the
factory and a salt only: the same on every network, the same again after a chain reset, and reachable
from any funded account. Deploying is idempotent. A contract already at its address is adopted, so the
command below can be rerun after a testnet wipe, or by [paritytech/autodeployer](https://github.com/paritytech/autodeployer),
and only puts back what is missing.

Pick the network by its Asset Hub genesis hash and sign with a funded mnemonic (see
[evm/.env.example](evm/.env.example)), then:

```bash
$ bun run deploy
```

`DRY_RUN=true` prints the addresses the salts resolve to without deploying. The `Deploy` workflow does the
same from GitHub Actions for a chosen network, signing with the `DEPLOYER_MNEMONIC` secret of the `deploy`
environment.

A contract's salt carries its version from `VERSIONS` in [evm/scripts/deploy.ts](evm/scripts/deploy.ts).
Bump it when a change must land on a fresh address; rebuilding the same version adopts the existing
deployment.

## Deployments

Version 1.0.0, deployed through the CREATE3 factory `0x8533c79E058c5a6489CAFeCA86dc600E029D75f5` on
Paseo AssetHubNextV2 and Previewnet AssetHub alike. Records with the ABI live in [deployments/](deployments/).

- **SchemaRegistry**:
  - Contract: `0x90e2a80f6c59C2e1cbd0Be50f60bA56bae4ADE97`
  - Deployment and ABI: [SchemaRegistry.sol](evm/contracts/SchemaRegistry.sol)
- **AttestationService**:
  - Contract: `0xA722702956694BFF0Ad6689df0505C3e357Bf0F1`
  - Deployment and ABI: [AttestationService.sol](evm/contracts/AttestationService.sol)

## License

Licensed under the [MIT License](LICENSE).
