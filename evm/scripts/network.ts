/**
 * Network configuration registry keyed by Asset Hub genesis hash.
 *
 * The CREATE3 factory is the one the dotNS contracts are deployed through. It
 * comes back on the same address after a chain reset, and so does everything
 * deployed through it.
 */
export type NetworkConfig = {
  name: string;
  rpcEndpoints: string[];
  create3Factory: `0x${string}`;
};

export const GenesisHashToNetworkConfig: Record<string, NetworkConfig> = {
  "0x4349b00e54897e21196fd331015fc5be0f14e118beb0375ed2bb1793737bb57a": {
    name: "paseonextv2",
    rpcEndpoints: ["wss://paseo-asset-hub-next-rpc.polkadot.io"],
    create3Factory: "0x8533c79E058c5a6489CAFeCA86dc600E029D75f5",
  },
  "0xc27c8bf3f13f96dc2130cd2b0a3debe57618fd02521ecc1902bd7dd4ed83d2fe": {
    name: "previewnet",
    rpcEndpoints: ["wss://previewnet.substrate.dev/asset-hub"],
    create3Factory: "0x8533c79E058c5a6489CAFeCA86dc600E029D75f5",
  },
};

/** The genesis hash a short network id stands for, for the deploy workflow. */
export const NetworkIdToGenesisHash: Record<string, string> = {
  "paseo-next-v2":
    "0x4349b00e54897e21196fd331015fc5be0f14e118beb0375ed2bb1793737bb57a",
  preview:
    "0xc27c8bf3f13f96dc2130cd2b0a3debe57618fd02521ecc1902bd7dd4ed83d2fe",
};
