// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CryptoChapWallet
 * @dev Secure multi-signature wallet for CryptoChap users
 * @notice This contract manages user funds with proper security controls
 */
contract CryptoChapWallet is Ownable, ReentrancyGuard {
    mapping(address => bool) public operators;
    mapping(bytes32 => bool) public executedTransactions;

    // Events
    event OperatorAdded(address indexed operator);
    event OperatorRemoved(address indexed operator);
    event TransactionExecuted(bytes32 indexed txHash, address indexed to, uint256 value, address token);
    event EtherReceived(address indexed sender, uint256 amount);

    // Modifiers
    modifier onlyOperator() {
        require(operators[msg.sender] || msg.sender == owner(), "Only operator can call this function");
        _;
    }

    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address");
        require(_addr != address(this), "Cannot send to contract itself");
        _;
    }

    modifier validAmount(uint256 _amount) {
        require(_amount > 0, "Amount must be greater than 0");
        _;
    }

    constructor() {
        operators[msg.sender] = true;
    }

    /**
     * @dev Add a new operator
     * @param _operator Address of the new operator
     */
    function addOperator(address _operator) external onlyOwner validAddress(_operator) {
        require(!operators[_operator], "Operator already exists");
        operators[_operator] = true;
        emit OperatorAdded(_operator);
    }

    /**
     * @dev Remove an operator
     * @param _operator Address of the operator to remove
     */
    function removeOperator(address _operator) external onlyOwner {
        require(operators[_operator], "Operator does not exist");
        require(_operator != owner(), "Cannot remove owner");
        operators[_operator] = false;
        emit OperatorRemoved(_operator);
    }

    /**
     * @dev Execute an ERC-20 token transfer
     * @param _token The ERC-20 token contract address
     * @param _to The recipient address
     * @param _amount The amount to transfer
     */
    function executeTokenTransfer(
        address _token,
        address _to,
        uint256 _amount
    ) external onlyOperator validAddress(_token) validAddress(_to) validAmount(_amount) nonReentrant {
        bytes32 txHash = keccak256(abi.encodePacked(_token, _to, _amount, block.number));

        require(!executedTransactions[txHash], "Transaction already executed");

        executedTransactions[txHash] = true;

        // Check balance before transfer
        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(address(this));
        require(balance >= _amount, "Insufficient balance");

        // Perform transfer
        bool success = token.transfer(_to, _amount);
        require(success, "Token transfer failed");

        emit TransactionExecuted(txHash, _to, _amount, _token);
    }

    /**
     * @dev Execute an Ether transfer
     * @param _to The recipient address
     * @param _amount The amount to transfer in wei
     */
    function executeEtherTransfer(
        address payable _to,
        uint256 _amount
    ) external onlyOperator validAddress(_to) validAmount(_amount) nonReentrant {
        bytes32 txHash = keccak256(abi.encodePacked(address(0), _to, _amount, block.number));

        require(!executedTransactions[txHash], "Transaction already executed");

        executedTransactions[txHash] = true;

        // Check balance before transfer
        require(address(this).balance >= _amount, "Insufficient Ether balance");

        // Perform transfer
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Ether transfer failed");

        emit TransactionExecuted(txHash, _to, _amount, address(0));
    }

    /**
     * @dev Get token balance
     * @param _token The token contract address (0x0 for Ether)
     */
    function getBalance(address _token) external view returns (uint256) {
        if (_token == address(0)) {
            return address(this).balance;
        } else {
            return IERC20(_token).balanceOf(address(this));
        }
    }

    /**
     * @dev Check if an address is an operator
     */
    function isOperator(address _addr) external view returns (bool) {
        return operators[_addr] || _addr == owner();
    }

    /**
     * @dev Receive Ether
     */
    receive() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    /**
     * @dev Fallback function
     */
    fallback() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    /**
     * @dev Emergency withdraw function for owner only
     * @param _token Token to withdraw (0x0 for Ether)
     * @param _to Recipient address
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(
        address _token,
        address _to,
        uint256 _amount
    ) external onlyOwner validAddress(_to) nonReentrant {
        if (_token == address(0)) {
            require(address(this).balance >= _amount, "Insufficient Ether balance");
            (bool success, ) = payable(_to).call{value: _amount}("");
            require(success, "Emergency Ether withdraw failed");
        } else {
            IERC20 token = IERC20(_token);
            uint256 balance = token.balanceOf(address(this));
            require(balance >= _amount, "Insufficient token balance");
            bool success = token.transfer(_to, _amount);
            require(success, "Emergency token withdraw failed");
        }
    }
}