import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, SUPPORTED_NETWORKS } from '../contracts/contractConfig';
import { eventService } from '../services/api';

const Web3Context = createContext(null);

// Safe helper to obtain Ethereum provider
function getEthereumProvider() {
  if (typeof window === 'undefined') return null;
  if (window.ethereum) {
    if (window.ethereum.providers?.length) {
      // Find MetaMask provider if multiple extensions are installed
      const metamaskProvider = window.ethereum.providers.find((p) => p.isMetaMask);
      return metamaskProvider || window.ethereum.providers[0];
    }
    return window.ethereum;
  }
  return null;
}

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [networkName, setNetworkName] = useState('Unknown Network');
  const [balance, setBalance] = useState('0.0000');
  const [isConnecting, setIsConnecting] = useState(false);
  const [contract, setContract] = useState(null);
  const [contractAddress, setContractAddress] = useState(CONTRACT_ADDRESS);
  const [error, setError] = useState(null);
  const [pendingNotice, setPendingNotice] = useState(null);

  const ethProvider = getEthereumProvider();
  const isMetaMaskInstalled = Boolean(ethProvider);

  // Helper to parse network name
  const getReadableNetworkName = (idHex) => {
    if (!idHex) return 'Unknown Network';
    const net = SUPPORTED_NETWORKS[idHex.toLowerCase()];
    if (net) return net.chainName;
    const dec = parseInt(idHex, 16);
    return `Chain ID: ${dec}`;
  };

  // Refresh balance & contract instance
  const refreshAccountData = useCallback(async (selectedAddress, browserProvider) => {
    if (!browserProvider || !selectedAddress) return;
    try {
      const bal = await browserProvider.getBalance(selectedAddress);
      setBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));

      const signer = await browserProvider.getSigner();
      const contractInstance = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
      setContract(contractInstance);
    } catch (err) {
      console.warn('Error fetching account balance/contract:', err);
    }
  }, [contractAddress]);

  // Connect MetaMask Wallet
  const connectWallet = async () => {
    const injected = getEthereumProvider();
    if (!injected) {
      setError('MetaMask extension is not detected. Please install MetaMask in your browser from https://metamask.io');
      if (typeof window !== 'undefined') {
        window.open('https://metamask.io/download/', '_blank');
      }
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      setPendingNotice(null);

      const browserProvider = new ethers.BrowserProvider(injected);
      
      // Request user accounts
      const accounts = await injected.request({ method: 'eth_requestAccounts' });
      
      if (accounts && accounts.length > 0) {
        const activeAccount = accounts[0];
        setAccount(activeAccount);

        const network = await browserProvider.getNetwork();
        const hexChainId = '0x' + network.chainId.toString(16);
        setChainId(hexChainId);
        setNetworkName(getReadableNetworkName(hexChainId));

        await refreshAccountData(activeAccount, browserProvider);
      }
    } catch (err) {
      console.error('MetaMask connection error:', err);
      if (err.code === -32002) {
        setPendingNotice('MetaMask connection prompt is already open! Please click the MetaMask Fox icon in your browser toolbar to approve the request.');
      } else if (err.code === 4001) {
        setError('MetaMask connection request was rejected by user.');
      } else {
        setError(err.message || 'Failed to connect MetaMask wallet.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect local state
  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
    setNetworkName('Disconnected');
    setBalance('0.0000');
    setContract(null);
    setError(null);
    setPendingNotice(null);
  };

  // Switch or Add Network in MetaMask
  const switchNetwork = async (targetChainIdHex) => {
    const injected = getEthereumProvider();
    if (!injected) return;

    try {
      setError(null);
      setPendingNotice(null);
      await injected.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainIdHex }],
      });
    } catch (switchErr) {
      if (switchErr.code === 4902 && SUPPORTED_NETWORKS[targetChainIdHex]) {
        try {
          const config = SUPPORTED_NETWORKS[targetChainIdHex];
          await injected.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: config.chainId,
                chainName: config.chainName,
                rpcUrls: config.rpcUrls,
                nativeCurrency: config.nativeCurrency,
                blockExplorerUrls: config.blockExplorerUrls,
              },
            ],
          });
        } catch (addErr) {
          setError(`Failed to add network to MetaMask: ${addErr.message}`);
        }
      } else if (switchErr.code === -32002) {
        setPendingNotice('Network switch request is pending in MetaMask. Please check your browser extension.');
      } else {
        setError(`Failed to switch network: ${switchErr.message}`);
      }
    }
  };

  // Record an Event Cryptographic Hash to Blockchain via MetaMask
  const recordEventWithMetaMask = async (eventObj) => {
    const injected = getEthereumProvider();
    if (!account) {
      await connectWallet();
    }

    if (!injected) {
      throw new Error('MetaMask is not installed.');
    }

    const browserProvider = new ethers.BrowserProvider(injected);
    const signer = await browserProvider.getSigner();
    const activeContract = contract || new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

    const eventId = eventObj.event_id;
    const machineId = eventObj.machine_id;
    const riskLevel = eventObj.risk_level || 'HIGH';
    const dataHash = eventObj.data_hash;

    if (!dataHash) {
      throw new Error(`Event ${eventId} has no SHA-256 data hash.`);
    }

    let timestampEpoch = Math.floor(Date.now() / 1000);
    if (eventObj.timestamp) {
      const parsed = Date.parse(eventObj.timestamp);
      if (!isNaN(parsed)) {
        timestampEpoch = Math.floor(parsed / 1000);
      }
    }

    console.log(`[MetaMask] Prompting recordEvent transaction:`, { eventId, machineId, timestampEpoch, riskLevel, dataHash });

    // Send on-chain transaction via MetaMask prompt
    const tx = await activeContract.recordEvent(
      eventId,
      machineId,
      timestampEpoch,
      riskLevel,
      dataHash
    );

    console.log(`[MetaMask] Transaction submitted. Hash: ${tx.hash}`);

    // Wait for mining
    const receipt = await tx.wait();
    console.log(`[MetaMask] Transaction mined in block #${receipt.blockNumber}`);

    // Sync receipt with Backend Database
    let syncedEvent = null;
    try {
      const syncRes = await eventService.recordToBlockchain(eventId, {
        blockchain_tx: tx.hash,
        block_number: Number(receipt.blockNumber),
        recorded_by: account,
        data_hash: dataHash,
        machine_id: machineId,
        risk_level: riskLevel,
        event_type: eventObj.event_type || 'METAMASK_INTERACTIVE_NOTARIZATION',
        description: eventObj.description || 'Notarized to Ethereum blockchain via MetaMask'
      });
      syncedEvent = syncRes.data?.event;
    } catch (syncErr) {
      console.warn('Notice: Backend database sync warning (on-chain transaction was successful):', syncErr);
    }

    return {
      success: true,
      txHash: tx.hash,
      blockNumber: Number(receipt.blockNumber),
      receipt,
      event: syncedEvent
    };
  };

  // Direct In-Browser Verification using MetaMask / Web3 provider
  const verifyEventOnChain = async (eventId, dataHash) => {
    try {
      const injected = getEthereumProvider();
      let readContract = contract;
      if (!readContract) {
        let browserProvider;
        if (injected) {
          browserProvider = new ethers.BrowserProvider(injected);
        } else {
          browserProvider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        }
        readContract = new ethers.Contract(contractAddress, CONTRACT_ABI, browserProvider);
      }

      const res = await readContract.verifyEvidence(eventId, dataHash);
      const isValid = res[0];
      const riskLevel = res[1];
      const blockTimestamp = Number(res[2]);

      return {
        verified: isValid,
        status: isValid ? 'VALID_IMMUTABLE' : 'TAMPER_DETECTED_OR_MISSING',
        riskLevel,
        blockTimestamp,
        eventId,
        dataHash
      };
    } catch (err) {
      console.warn('In-browser on-chain verification error:', err);
      throw err;
    }
  };

  // Listen to MetaMask account & network change events
  useEffect(() => {
    const injected = getEthereumProvider();
    if (!injected) return;

    const handleAccountsChanged = async (accounts) => {
      if (!accounts || accounts.length === 0) {
        disconnectWallet();
      } else {
        const newAcc = accounts[0];
        setAccount(newAcc);
        const browserProvider = new ethers.BrowserProvider(injected);
        await refreshAccountData(newAcc, browserProvider);
      }
    };

    const handleChainChanged = (newChainId) => {
      setChainId(newChainId);
      setNetworkName(getReadableNetworkName(newChainId));
      if (account) {
        const browserProvider = new ethers.BrowserProvider(injected);
        refreshAccountData(account, browserProvider);
      }
    };

    if (injected.on) {
      injected.on('accountsChanged', handleAccountsChanged);
      injected.on('chainChanged', handleChainChanged);
    }

    // Auto-detect existing authorization
    const checkInitialConnection = async () => {
      try {
        const browserProvider = new ethers.BrowserProvider(injected);
        const accounts = await browserProvider.listAccounts();
        if (accounts.length > 0) {
          const acc = accounts[0].address;
          setAccount(acc);
          const network = await browserProvider.getNetwork();
          const hexChain = '0x' + network.chainId.toString(16);
          setChainId(hexChain);
          setNetworkName(getReadableNetworkName(hexChain));
          await refreshAccountData(acc, browserProvider);
        }
      } catch (e) {
        console.warn('Auto-reconnect notice:', e);
      }
    };

    checkInitialConnection();

    return () => {
      if (injected.removeListener) {
        injected.removeListener('accountsChanged', handleAccountsChanged);
        injected.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [refreshAccountData, account]);

  const value = {
    account,
    chainId,
    networkName,
    balance,
    isConnecting,
    isConnected: Boolean(account),
    isMetaMaskInstalled,
    contract,
    contractAddress,
    setContractAddress,
    error,
    pendingNotice,
    clearError: () => { setError(null); setPendingNotice(null); },
    connectWallet,
    disconnectWallet,
    switchNetwork,
    recordEventWithMetaMask,
    verifyEventOnChain
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}
