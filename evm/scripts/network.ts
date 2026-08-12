/**
 * Network configuration registry keyed by chain genesis hash.
 */

export type NetworkConfig = {
  name: string;
  rpcEndpoints: string[];
};

export const GenesisHashToNetworkConfig: Record<string, NetworkConfig> = {
  "0x23e730eb1c6fecae09c917439a5038cb6122d0d48980e8b9bbf0ff56f94a2ca6": {
    name: "paseonextv2",
    rpcEndpoints: ["wss://paseo-asset-hub-next-rpc.polkadot.io"],
  },
  "0x4d11c803cc6921429e3876638977ad006ea1bba8cd3976a0bca2f164e7026210": {
    name: "previewnet",
    rpcEndpoints: ["wss://previewnet.substrate.dev/asset-hub"],
  },
};
