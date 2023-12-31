type SpecApiConfig = {
  specApiType: string
  specApiUrl: string
}

export type ChainConfig = {
  name: string
  chainId: number
  networkId: number
  jsonRpcUrl: string
  specApiConfigs: SpecApiConfig[]
}

export const supportedChains = new Map<number, ChainConfig>([
  [
    56,
    {
      name: 'Binance Smart Chain',
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
      name: 'Ethereum',
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
      name: 'Fantom',
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
      name: 'Optimism',
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
      name: 'Arbitrum',
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
      name: 'Avalanche',
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
      name: 'Polygon',
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
      name: 'Celo',
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
      name: 'Gnosis',
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
      name: 'Ethereum Goerli',
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
      name: 'Binance Smart Chain Testnet',
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
      name: 'BitTorrent',
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
      name: 'Polygon zkEVM',
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
      name: 'Fantom Testnet',
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
      name: 'Avalanche Testnet',
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
      name: 'Celo Alfajores',
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
      name: 'Polygon Mumbai',
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
      name: 'Arbitrum Goerli',
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
      name: 'Sepolia',
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
      name: 'Base',
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
      name: 'Moonbeam',
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
      name: 'Moonriver',
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
      name: 'Aurora',
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
      name: 'Evmos',
      chainId: 9001,
      networkId: 9001,
      jsonRpcUrl: 'https://evmos.lava.build',
      specApiConfigs: [],
    },
  ],
  [
    1666600000,
    {
      name: 'Harmony',
      chainId: 1666600000,
      networkId: 1666600000,
      jsonRpcUrl: 'https://api.harmony.one',
      specApiConfigs: [],
    },
  ],
  [
    288,
    {
      name: 'Boba',
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
      name: 'Dogechain',
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
      name: 'ZkSync Era',
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
      name: 'Linea',
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
      name: 'Optimism BNB',
      chainId: 204,
      networkId: 204,
      jsonRpcUrl: 'https://opbnb.publicnode.com',
      specApiConfigs: [],
    },
  ],
  [
    1088,
    {
      name: 'Metis',
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
      name: 'Kava',
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
      name: 'Arbitrum Nova',
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
      name: 'Boba Avax',
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
      name: 'Boba BNB',
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
      name: 'Fuse',
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
      name: 'Heco',
      chainId: 128,
      networkId: 128,
      jsonRpcUrl: 'https://http-mainnet.hecochain.com',
      specApiConfigs: [],
    },
  ],
])
