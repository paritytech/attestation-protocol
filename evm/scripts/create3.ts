/**
 * Deterministic deploys through the shared CREATE3 factory.
 *
 * A CREATE3 address is a function of the factory address and the salt only.
 * Neither the deployer nor the bytecode takes part, so a contract lands on the
 * same address on every network, comes back on the same address after a chain
 * reset, and any funded account can put it there.
 *
 * The salt carries the contract name and a version, so a new version is a new
 * address by construction. A salt can be deployed once; rerunning adopts the
 * contract already at the address, which makes a partial run safe to repeat.
 */
import { Binary } from "polkadot-api";
import {
  encodeFunctionData,
  encodePacked,
  getContractAddress,
  keccak256,
  parseAbi,
} from "viem";

/** Keeps these salts apart from the dotNS and Browse ones on the same factory. */
export const SALT_NAMESPACE = "attestation-protocol.create3.v1";

/**
 * Init code of the Solady CREATE3 proxy. The factory CREATE2s this proxy from
 * the salt, then the proxy CREATEs the contract as its first transaction.
 */
const PROXY_INIT_CODE = "0x67363d3d37363d34f03d5260086018f3" as const;

const FACTORY_ABI = parseAbi([
  "function deploy(bytes32 salt, bytes initCode) payable returns (address)",
]);

const WEIGHT_LIMIT = {
  ref_time: 500_000_000_000n,
  proof_size: 5_000_000n,
} as const;

/** Ceiling on the deposit the deployed code can cost; a few kilobytes cost far less. */
const STORAGE_DEPOSIT_LIMIT = 1_000_000_000_000n;

export type Create3Status = "deployed" | "adopted" | "dry-run";

/** `create3Salt("SchemaRegistry", "1.0.0")` hashes `attestation-protocol.create3.v1:SchemaRegistry:1.0.0`. */
export function create3Salt(name: string, version: string): `0x${string}` {
  return keccak256(
    encodePacked(["string"], [`${SALT_NAMESPACE}:${name}:${version}`]),
  );
}

/** The address a salt resolves to, derived without touching the network. */
export function predictCreate3(
  salt: `0x${string}`,
  factory: `0x${string}`,
): `0x${string}` {
  const proxy = getContractAddress({
    opcode: "CREATE2",
    from: factory,
    salt,
    bytecodeHash: keccak256(PROXY_INIT_CODE),
  });
  return getContractAddress({ opcode: "CREATE", from: proxy, nonce: 1n });
}

/** Runtime code at an address, `0x` when nothing is deployed there. */
export async function codeAt(
  api: any,
  address: `0x${string}`,
): Promise<string> {
  const code = await api.apis.ReviveApi.code(Binary.fromHex(address));
  return typeof code === "string" ? code : code.asHex();
}

/**
 * Submits a transaction and resolves with its dispatch error at finalisation,
 * or null. Deploys are judged by the code at the address, not by this result:
 * a factory call can report `ContractReverted` for a deploy that landed.
 */
function submit(
  tx: any,
  signer: any,
  onStatus?: (status: string) => void,
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    tx.signSubmitAndWatch(signer).subscribe({
      next: (event: any) => {
        onStatus?.(event.type);
        if (event.type !== "finalized") return;
        resolve(event.ok ? null : JSON.stringify(event.dispatchError));
      },
      error: reject,
    });
  });
}

/**
 * Deploy `initCode` (creation bytecode with the ABI-encoded constructor
 * arguments appended) at its deterministic address, or adopt what is there.
 * `DRY_RUN=true` stops after predicting the address.
 */
export async function deployCreate3(
  api: any,
  signer: any,
  options: {
    name: string;
    version: string;
    initCode: string;
    factory: `0x${string}`;
    onStatus?: (status: string) => void;
  },
): Promise<{ address: `0x${string}`; salt: `0x${string}`; status: Create3Status }> {
  const { name, version, initCode, factory, onStatus } = options;
  const salt = create3Salt(name, version);
  const address = predictCreate3(salt, factory);

  if ((await codeAt(api, factory)) === "0x") {
    throw new Error(
      `No CREATE3 factory at ${factory}. It is deployed from the dotns repository.`,
    );
  }
  if ((await codeAt(api, address)) !== "0x") {
    return { address, salt, status: "adopted" };
  }
  if (process.env.DRY_RUN === "true") {
    return { address, salt, status: "dry-run" };
  }

  const tx = api.tx.Revive.call({
    dest: Binary.fromHex(factory),
    value: 0n,
    weight_limit: WEIGHT_LIMIT,
    storage_deposit_limit: STORAGE_DEPOSIT_LIMIT,
    data: Binary.fromHex(
      encodeFunctionData({
        abi: FACTORY_ABI,
        functionName: "deploy",
        args: [salt, initCode as `0x${string}`],
      }),
    ),
  });
  const dispatchError = await submit(tx, signer, onStatus);
  if ((await codeAt(api, address)) === "0x") {
    throw new Error(
      `${name} ${version} did not deploy at ${address}. ${dispatchError ?? ""}`,
    );
  }
  return { address, salt, status: "deployed" };
}
