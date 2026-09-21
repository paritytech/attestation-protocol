import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import chalk from "chalk";
import ora from "ora";
import { encodeAbiParameters, parseAbiParameters } from "viem";

import { deployCreate3 } from "./create3.ts";
import { connect, getSigner, isAccountMapped, waitBestBlock } from "./lib.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.resolve(__dirname, "../out");
const DEPLOYMENTS_DIR = path.resolve(REPO_ROOT, "deployments");

/**
 * Part of each contract's CREATE3 salt, so part of its address. Bump it when a
 * contract changes in a way that must land on a fresh address; a rebuild of the
 * same version adopts the existing deployment instead.
 */
const VERSIONS = {
  SchemaRegistry: "1.0.0",
  AttestationService: "1.0.0",
} as const;

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
  version: string;
  salt: string;
  abi: unknown[];
  args: string[];
};

// One directory per network, one file per contract, plus a `.genesisHash`
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
  factory: `0x${string}`,
  contractName: keyof typeof VERSIONS,
  initCode: string,
) {
  const version = VERSIONS[contractName];
  const spinner = ora(`${chalk.bold(contractName)} ${version}`).start();
  try {
    const result = await deployCreate3(api, signer, {
      name: contractName,
      version,
      initCode,
      factory,
      onStatus: (status) => {
        spinner.text = `${chalk.bold(contractName)} ${version} ${chalk.dim(`(${status})`)}`;
      },
    });
    const note =
      result.status === "adopted"
        ? "already deployed"
        : result.status === "dry-run"
          ? "dry run, not deployed"
          : "deployed";
    spinner.succeed(
      `${chalk.bold(contractName)} ${version} ${chalk.dim("→")} ${chalk.green(result.address)} ${chalk.dim(`(${note})`)}`,
    );
    return result;
  } catch (err) {
    spinner.fail(`${chalk.bold(contractName)} ${version} failed`);
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
  if (process.env.DRY_RUN === "true") {
    spinner.succeed("Account not mapped (dry run, left as is)");
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
  console.log(`  ${chalk.dim("Factory ")} ${network.create3Factory}`);
  console.log(`  ${chalk.dim("Deployer")} ${address}`);
  console.log();

  try {
    await mapAccount(api, signer, publicKey);

    const registryArtifact = loadArtifact("SchemaRegistry");
    const registry = await deploy(
      api,
      signer,
      network.create3Factory,
      "SchemaRegistry",
      registryArtifact.bytecode.object,
    );

    const serviceArtifact = loadArtifact("AttestationService");
    const constructorArgs = encodeAbiParameters(parseAbiParameters("address"), [
      registry.address,
    ]);
    const service = await deploy(
      api,
      signer,
      network.create3Factory,
      "AttestationService",
      serviceArtifact.bytecode.object + constructorArgs.replace(/^0x/, ""),
    );

    // The records hold salt-derived addresses, so a dry run writes them too.
    writeDeployment(network.name, genesisHash, "SchemaRegistry", {
      address: registry.address,
      version: VERSIONS.SchemaRegistry,
      salt: registry.salt,
      abi: registryArtifact.abi,
      args: [],
    });
    const dir = writeDeployment(
      network.name,
      genesisHash,
      "AttestationService",
      {
        address: service.address,
        version: VERSIONS.AttestationService,
        salt: service.salt,
        abi: serviceArtifact.abi,
        args: [registry.address],
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
