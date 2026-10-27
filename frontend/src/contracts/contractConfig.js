/**
 * SmartManufacturing Ethereum Smart Contract Configuration & ABI
 */

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "eventId",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "string",
        "name": "machineId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "riskLevel",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "dataHash",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "recordedBy",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "name": "EventEvidenceRecorded",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "getRecordedEventCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "getRecordedEventIdAtIndex",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_eventId",
        "type": "string"
      }
    ],
    "name": "getEventEvidence",
    "outputs": [
      {
        "internalType": "string",
        "name": "eventId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "machineId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "riskLevel",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "dataHash",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "recordedBy",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isRecorded",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_eventId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_machineId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_timestamp",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_riskLevel",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_dataHash",
        "type": "string"
      }
    ],
    "name": "recordEvent",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_eventId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_dataHash",
        "type": "string"
      }
    ],
    "name": "verifyEvidence",
    "outputs": [
      {
        "internalType": "bool",
        "name": "isValid",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "riskLevel",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "blockTimestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export const SUPPORTED_NETWORKS = {
  "0x539": {
    chainId: "0x539",
    chainIdNum: 1337,
    chainName: "Localhost Ganache",
    rpcUrls: ["http://127.0.0.1:8545"],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorerUrls: null
  },
  "0x7a69": {
    chainId: "0x7a69",
    chainIdNum: 31337,
    chainName: "Hardhat Local Node",
    rpcUrls: ["http://127.0.0.1:8545"],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorerUrls: null
  },
  "0xaa36a7": {
    chainId: "0xaa36a7",
    chainIdNum: 11155111,
    chainName: "Sepolia Testnet",
    rpcUrls: ["https://rpc.sepolia.org"],
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    blockExplorerUrls: ["https://sepolia.etherscan.io"]
  },
  "0x1": {
    chainId: "0x1",
    chainIdNum: 1,
    chainName: "Ethereum Mainnet",
    rpcUrls: ["https://eth.llamarpc.com"],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    blockExplorerUrls: ["https://etherscan.io"]
  }
};
