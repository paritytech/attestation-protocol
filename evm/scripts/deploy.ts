import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { Keccak256 } from "@polkadot-api/substrate-bindings";
import chalk from "chalk";
import ora from "ora";
import { Binary, FixedSizeBinary } from "polkadot-api";
import { encodeAbiParameters, parseAbiParameters } from "viem";

import { connect, getSigner, isAccountMapped, waitBestBlock } from "./lib.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.resolve(__dirname, "../out");
const DEPLOYMENTS_DIR = path.resolve(REPO_ROOT, "deployments");

// CREATE2 salt. Part of the contract address, so changing it moves every
// deployment to a new address.
const SALT_SEED = "attestation-protocol.v1";
const SALT = FixedSizeBinary.fromBytes(
  Keccak256(new TextEncoder().encode(SALT_SEED)),
);

type Artifact = { abi: unknown[]; bytecode: { object: string } };

function loadArtifact(contractName: string): Artifact {
  const artifactPath = path.join(
    OUT_DIR,
    `${contractName}.sol/${contractName}.json`,
  );
  if (!fs.existsSync(artifactPath)) {
    throw new Error(
      `Missing artifact for ${contractName} at ${artifactPath}. Run \`forge build\` first.`,
    );
  }
  return JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
}

type Deployment = {
  address: string;
  abi: unknown[];
  args: string[];
  salt: string;
  transactionHash: string;
};

// One directory per network, one file per contract — plus a `.genesisHash`
// marker, mirroring hardhat-deploy's `deployments/<network>/`.
function writeDeployment(
  networkName: string,
  genesisHash: string,
  contractName: string,
  deployment: Deployment,
): string {
  const dir = path.join(DEPLOYMENTS_DIR, networkName);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, ".genesisHash"), `${genesisHash}\n`);
  fs.writeFileSync(
    path.join(dir, `${contractName}.json`),
    `${JSON.stringify(deployment, null, 2)}\n`,
  );
  return dir;
}

async function deploy(
  api: any,
  signer: any,
  contractName: string,
  bytecodeHex: string,
): Promise<{ address: string; txHash: string }> {
  const spinner = ora(`Deploying ${chalk.bold(contractName)}`).start();
  try {
    const tx = api.tx.Revive.instantiate_with_code({
      value: 0n,
      weight_limit: { ref_time: 10_000_000_000n, proof_size: 1_000_000n },
      storage_deposit_limit: 1_000_000_000_000n,
      code: Binary.fromHex(bytecodeHex),
      data: Binary.fromHex("0x"),
      salt: SALT,
    });

    const event = await waitBestBlock(tx, signer, contractName, (status) => {
      spinner.text = `Deploying ${chalk.bold(contractName)} ${chalk.dim(`(${status})`)}`;
    });

    const instantiated = (event.events ?? []).find(
      (e: any) => e.type === "Revive" && e.value?.type === "Instantiated",
    );
    const contract = instantiated?.value?.value?.contract;
    const address =
      contract && typeof contract === "object" && "asHex" in contract
        ? contract.asHex()
        : String(contract);

    spinner.succeed(
      `${chalk.bold(contractName)} ${chalk.dim("→")} ${chalk.green(address)}`,
    );
    return { address, txHash: event.txHash as string };
  } catch (err) {
    spinner.fail(`${chalk.bold(contractName)} deployment failed`);
    throw err;
  }
}

async function mapAccount(
  api: any,
  signer: any,
  publicKey: Uint8Array,
): Promise<void> {
  const spinner = ora("Checking account mapping").start();
  if (await isAccountMapped(api, publicKey)) {
    spinner.succeed("Account already mapped");
    return;
  }

  spinner.text = "Mapping account to EVM address";
  try {
    const tx = api.tx.Revive.map_account();
    await waitBestBlock(tx, signer, "map_account", (status) => {
      spinner.text = `Mapping account to EVM address ${chalk.dim(`(${status})`)}`;
    });
    spinner.succeed("Account mapped to EVM address");
  } catch (err) {
    spinner.fail("Account mapping failed");
    throw err;
  }
}

async function main() {
  const { signer, address, publicKey } = getSigner();
  const { client, api, network, genesisHash } = connect();

  console.log();
  console.log(
    `  ${chalk.bold.cyan("Attestation Protocol")} ${chalk.dim("· deploy")}`,
  );
  console.log();
  console.log(`  ${chalk.dim("Network ")} ${chalk.bold(network.name)}`);
  console.log(`  ${chalk.dim("RPC     ")} ${network.rpcEndpoints[0]}`);
  console.log(`  ${chalk.dim("Deployer")} ${address}`);
  console.log();

  try {
    await mapAccount(api, signer, publicKey);

    const registryArtifact = loadArtifact("SchemaRegistry");
    const registry = await deploy(
      api,
      signer,
      "SchemaRegistry",
      registryArtifact.bytecode.object,
    );
    writeDeployment(network.name, genesisHash, "SchemaRegistry", {
      address: registry.address,
      abi: registryArtifact.abi,
      args: [],
      salt: SALT.asHex(),
      transactionHash: registry.txHash,
    });

    const serviceArtifact = loadArtifact("AttestationService");
    const constructorArgs = encodeAbiParameters(parseAbiParameters("address"), [
      registry.address as `0x${string}`,
    ]);
    const serviceBytecode =
      serviceArtifact.bytecode.object + constructorArgs.replace(/^0x/, "");
    const service = await deploy(
      api,
      signer,
      "AttestationService",
      serviceBytecode,
    );
    const dir = writeDeployment(
      network.name,
      genesisHash,
      "AttestationService",
      {
        address: service.address,
        abi: serviceArtifact.abi,
        args: [registry.address],
        salt: SALT.asHex(),
        transactionHash: service.txHash,
      },
    );

    console.log();
    console.log(
      `${chalk.green("✔")} ${chalk.bold("Completed")} ${chalk.dim(`· saved to ${path.relative(REPO_ROOT, dir)}`)}`,
    );
    console.log();
  } finally {
    client.destroy();
  }
}

main().catch((err) => {
  console.error(chalk.red("\n  Deploy failed:\n"), err);
  process.exit(1);
});
