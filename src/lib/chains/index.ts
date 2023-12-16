type SpecApiConfig = {
  specApiType: string
  specApiUrl: string
}

export type ChainConfig = {
  chainId: number
  networkId: number
  jsonRpcUrl: string
  specApiConfigs: SpecApiConfig[]
}

export const supportedChains = new Map<number, ChainConfig>([
  [
    56,
    {
      chainId: 56,
      networkId: 56,
      jsonRpcUrl: 'https://bsc-dataseed.binance.org',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://api.bscscan.com',
        },
      ],
    },
  ],
  [
    1,
    {
      chainId: 1,
      networkId: 1,
      jsonRpcUrl: 'https://eth.llamarpc.com',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://api.etherscan.io',
        },
      ],
    },
  ],
  [
    250,
    {
      chainId: 250,
      networkId: 250,
      jsonRpcUrl: 'https://rpcapi.fantom.network',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://api.ftmscan.com',
        },
      ],
    },
  ],
  [
    10,
    {
      chainId: 10,
      networkId: 10,
      jsonRpcUrl: 'https://mainnet.optimism.io',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://api-optimistic.etherscan.io',
        },
      ],
    },
  ],
  [
    42161,
    {
      chainId: 42161,
      networkId: 42161,
      jsonRpcUrl: 'https://arb1.arbitrum.io/rpc',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://api.arbiscan.io',
        },
      ],
    },
  ],
  [
    43114,
    {
      chainId: 43114,
      networkId: 43114,
      jsonRpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://api.snowtrace.io',
        },
      ],
    },
  ],
  [
    137,
    {
      chainId: 137,
      networkId: 137,
      jsonRpcUrl: 'https://polygon.llamarpc.com',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://api.polygonscan.com',
        },
      ],
    },
  ],
  [
    42220,
    {
      chainId: 42220,
      networkId: 42220,
      jsonRpcUrl: 'https://forno.celo.org',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://api.celoscan.io',
        },
      ],
    },
  ],
  [
    100,
    {
      chainId: 100,
      networkId: 100,
      jsonRpcUrl: 'https://rpc.gnosischain.com',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://api.gnosisscan.io/',
        },
      ],
    },
  ],
  [
    5,
    {
      chainId: 5,
      networkId: 5,
      jsonRpcUrl: 'https://rpc.ankr.com/eth_goerli',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://api-goerli.etherscan.io',
        },
      ],
    },
  ],
  [
    97,
    {
      chainId: 97,
      networkId: 97,
      jsonRpcUrl: 'https://bsc-testnet.publicnode.com',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://api-testnet.bscscan.com',
        },
      ],
    },
  ],
  [
    199,
    {
      chainId: 199,
      networkId: 199,
      jsonRpcUrl: 'https://rpc.bittorrentchain.io',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://api.bttcscan.com',
        },
      ],
    },
  ],
  [
    1101,
    {
      chainId: 1101,
      networkId: 1101,
      jsonRpcUrl: 'https://rpc.ankr.com/polygon_zkevm',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://api-zkevm.polygonscan.com',
        },
      ],
    },
  ],
  [
    4002,
    {
      chainId: 4002,
      networkId: 4002,
      jsonRpcUrl: 'https://rpc.testnet.fantom.network',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://api-testnet.ftmscan.com',
        },
      ],
    },
  ],
  [
    43113,
    {
      chainId: 43113,
      networkId: 1,
      jsonRpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://api-testnet.snowtrace.io',
        },
      ],
    },
  ],
  [
    44787,
    {
      chainId: 44787,
      networkId: 44787,
      jsonRpcUrl: 'https://alfajores-forno.celo-testnet.org',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://api-alfajores.celoscan.io',
        },
      ],
    },
  ],
  [
    80001,
    {
      chainId: 80001,
      networkId: 80001,
      jsonRpcUrl: 'https://polygon-mumbai-bor.publicnode.com',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://api-testnet.polygonscan.com',
        },
      ],
    },
  ],
  [
    421613,
    {
      chainId: 421613,
      networkId: 421613,
      jsonRpcUrl: 'https://arbitrum-goerli.publicnode.com',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://api-goerli.arbiscan.io',
        },
      ],
    },
  ],
  [
    11155111,
    {
      chainId: 11155111,
      networkId: 11155111,
      jsonRpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/demo',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://api-sepolia.etherscan.io',
        },
      ],
    },
  ],
  [
    8453,
    {
      chainId: 8453,
      networkId: 8453,
      jsonRpcUrl: 'https://base.publicnode.com',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://api.basescan.org',
        },
      ],
    },
  ],
  [
    1284,
    {
      chainId: 1284,
      networkId: 1284,
      jsonRpcUrl: 'https://rpc.api.moonbeam.network',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://api-moonbeam.moonscan.io',
        },
      ],
    },
  ],
  [
    1285,
    {
      chainId: 1285,
      networkId: 1285,
      jsonRpcUrl: 'https://rpc.api.moonriver.moonbeam.network',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://api-moonriver.moonscan.io',
        },
      ],
    },
  ],
  [
    1313161554,
    {
      chainId: 1313161554,
      networkId: 1313161554,
      jsonRpcUrl: 'https://mainnet.aurora.dev',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://aurorascan.dev',
        },
      ],
    },
  ],
  [
    9001,
    {
      chainId: 9001,
      networkId: 9001,
      jsonRpcUrl: 'https://evmos.lava.build',
      specApiConfigs: [],
    },
  ],
  [
    1666600000,
    {
      chainId: 1666600000,
      networkId: 1666600000,
      jsonRpcUrl: 'https://api.harmony.one',
      specApiConfigs: [],
    },
  ],
  [
    288,
    {
      chainId: 288,
      networkId: 288,
      jsonRpcUrl: 'https://mainnet.boba.network',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl:
            'https://api.routescan.io/v2/network/mainnet/evm/288/etherscan',
        },
      ],
    },
  ],
  [
    2000,
    {
      chainId: 2000,
      networkId: 2000,
      jsonRpcUrl: 'https://rpc.dogechain.dog',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://explorer.dogechain.dog',
        },
      ],
    },
  ],
  [
    324,
    {
      chainId: 324,
      networkId: 324,
      jsonRpcUrl: 'https://mainnet.era.zksync.io',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://block-explorer-api.mainnet.zksync.io',
        },
      ],
    },
  ],
  [
    59144,
    {
      chainId: 59144,
      networkId: 59144,
      jsonRpcUrl: 'https://rpc.linea.build',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://api.lineascan.build',
        },
      ],
    },
  ],
  [
    204,
    {
      chainId: 204,
      networkId: 204,
      jsonRpcUrl: 'https://opbnb.publicnode.com',
      specApiConfigs: [],
    },
  ],
  [
    1088,
    {
      chainId: 1088,
      networkId: 1088,
      jsonRpcUrl: 'https://andromeda.metis.io/?owner=1088',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://andromeda-explorer.metis.io',
        },
      ],
    },
  ],
  [
    2222,
    {
      chainId: 2222,
      networkId: 2222,
      jsonRpcUrl: 'https://evm.kava.io',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://kavascan.com',
        },
      ],
    },
  ],
  [
    42170,
    {
      chainId: 42170,
      networkId: 42170,
      jsonRpcUrl: 'https://nova.arbitrum.io/rpc',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://nova-explorer.arbitrum.io',
        },
      ],
    },
  ],
  [
    43288,
    {
      chainId: 43288,
      networkId: 43288,
      jsonRpcUrl: 'https://avax.boba.network',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://blockexplorer.avax.boba.network',
        },
      ],
    },
  ],
  [
    56288,
    {
      chainId: 56288,
      networkId: 56288,
      jsonRpcUrl: 'https://bnb.boba.network',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://blockexplorer.bnb.boba.network',
        },
      ],
    },
  ],
  [
    122,
    {
      chainId: 122,
      networkId: 122,
      jsonRpcUrl: 'https://rpc.fuse.io',
      specApiConfigs: [
        {
          specApiType: 'etherscan',
          specApiUrl: 'https://explorer.fuse.io',
        },
      ],
    },
  ],
  [
    128,
    {
      chainId: 128,
      networkId: 128,
      jsonRpcUrl: 'https://http-mainnet.hecochain.com',
      specApiConfigs: [],
    },
  ],
])
