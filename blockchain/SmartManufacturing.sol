// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SmartManufacturing
 * @dev Tamper-evident cryptographic evidence ledger for Smart Manufacturing.
 * Records SHA-256 hashes of critical/high-risk anomaly and data manipulation events.
 * 
 * CORE PRINCIPLE:
 * Sensor telemetry is stored in MySQL.
 * Blockchain ONLY stores cryptographic evidence hashes and audit metadata for critical events.
 */
contract SmartManufacturing {
    
    struct EventEvidence {
        string eventId;
        string machineId;
        uint256 timestamp;
        string riskLevel;
        string dataHash;        // SHA-256 hash of canonical event payload
        address recordedBy;     // Eth address that submitted the transaction
        uint256 blockTimestamp; // Block creation time
        bool isRecorded;
    }

    // Mapping from eventId => EventEvidence
    mapping(string => EventEvidence) private eventRegistry;
    
    // Array of recorded event IDs for iteration
    string[] private recordedEventIds;

    // Contract Owner / Authorized Node
    address public owner;

    // Emitted when a critical event evidence hash is permanently committed on-chain
    event EventEvidenceRecorded(
        string indexed eventId,
        string indexed machineId,
        string riskLevel,
        string dataHash,
        address recordedBy,
        uint256 blockTimestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only authorized owner/node can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Records cryptographic evidence of a critical manufacturing anomaly/manipulation event.
     * @param _eventId Unique event identifier (e.g., 'EVT1024')
     * @param _machineId Machine identifier (e.g., 'M04')
     * @param _timestamp Epoch timestamp of the event occurrence
     * @param _riskLevel Evaluated risk level ('HIGH' or 'CRITICAL')
     * @param _dataHash SHA-256 hex string of canonical event record
     */
    function recordEvent(
        string memory _eventId,
        string memory _machineId,
        uint256 _timestamp,
        string memory _riskLevel,
        string memory _dataHash
    ) external returns (bool) {
        require(bytes(_eventId).length > 0, "Event ID cannot be empty");
        require(bytes(_dataHash).length > 0, "Data hash cannot be empty");
        require(!eventRegistry[_eventId].isRecorded, "Event evidence already permanently recorded on blockchain");

        EventEvidence memory evidence = EventEvidence({
            eventId: _eventId,
            machineId: _machineId,
            timestamp: _timestamp,
            riskLevel: _riskLevel,
            dataHash: _dataHash,
            recordedBy: msg.sender,
            blockTimestamp: block.timestamp,
            isRecorded: true
        });

        eventRegistry[_eventId] = evidence;
        recordedEventIds.push(_eventId);

        emit EventEvidenceRecorded(
            _eventId,
            _machineId,
            _riskLevel,
            _dataHash,
            msg.sender,
            block.timestamp
        );

        return true;
    }

    /**
     * @notice Retrieves the immutable evidence record for an event.
     */
    function getEventEvidence(string memory _eventId)
        external
        view
        returns (
            string memory eventId,
            string memory machineId,
            uint256 timestamp,
            string memory riskLevel,
            string memory dataHash,
            address recordedBy,
            uint256 blockTimestamp,
            bool isRecorded
        )
    {
        EventEvidence memory evidence = eventRegistry[_eventId];
        return (
            evidence.eventId,
            evidence.machineId,
            evidence.timestamp,
            evidence.riskLevel,
            evidence.dataHash,
            evidence.recordedBy,
            evidence.blockTimestamp,
            evidence.isRecorded
        );
    }

    /**
     * @notice Verifies if a given SHA-256 data hash matches the on-chain recorded evidence.
     * @return isValid True if hash matches, False if mismatch or not recorded.
     */
    function verifyEvidence(string memory _eventId, string memory _dataHash)
        external
        view
        returns (bool isValid, string memory riskLevel, uint256 blockTimestamp)
    {
        EventEvidence memory evidence = eventRegistry[_eventId];
        if (!evidence.isRecorded) {
            return (false, "NOT_FOUND", 0);
        }
        
        bool hashesMatch = (keccak256(bytes(evidence.dataHash)) == keccak256(bytes(_dataHash)));
        return (hashesMatch, evidence.riskLevel, evidence.blockTimestamp);
    }

    /**
     * @notice Returns total number of events recorded on blockchain.
     */
    function getRecordedEventCount() external view returns (uint256) {
        return recordedEventIds.length;
    }

    /**
     * @notice Returns event ID by index for pagination and auditing.
     */
    function getRecordedEventIdAtIndex(uint256 index) external view returns (string memory) {
        require(index < recordedEventIds.length, "Index out of bounds");
        return recordedEventIds[index];
    }
}
