// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../contracts/CryptoChapWallet.sol";
import "../contracts/MockERC20.sol";

contract CryptoChapWalletTest is Test {
    CryptoChapWallet wallet;
    MockERC20 mockToken;

    address owner = address(1);
    address operator = address(2);
    address user = address(3);

    function setUp() public {
        vm.startPrank(owner);

        // Deploy mock ERC20 token for testing
        mockToken = new MockERC20("Mock Token", "MOCK", 1000 ether);

        // Deploy wallet contract
        wallet = new CryptoChapWallet();

        vm.stopPrank();
    }

    function testDeployment() public {
        assertEq(wallet.owner(), owner);
        assertTrue(wallet.isOperator(owner));
    }

    function testAddOperator() public {
        vm.prank(owner);
        wallet.addOperator(operator);
        assertTrue(wallet.isOperator(operator));
    }

    function testAddOperatorNotOwner() public {
        vm.prank(user);
        vm.expectRevert("Ownable: caller is not the owner");
        wallet.addOperator(operator);
    }

    function testRemoveOperator() public {
        vm.startPrank(owner);
        wallet.addOperator(operator);
        assertTrue(wallet.isOperator(operator));

        wallet.removeOperator(operator);
        assertFalse(wallet.isOperator(operator));
        vm.stopPrank();
    }

    function testRemoveOwnerAsOperator() public {
        vm.prank(owner);
        vm.expectRevert("Cannot remove owner");
        wallet.removeOperator(owner);
    }

    function testExecuteTokenTransfer() public {
        vm.startPrank(owner);
        wallet.addOperator(operator);

        // Transfer tokens to wallet
        mockToken.transfer(address(wallet), 100 ether);

        vm.stopPrank();

        uint256 initialBalance = mockToken.balanceOf(user);

        vm.prank(operator);
        wallet.executeTokenTransfer(address(mockToken), user, 10 ether);

        assertEq(mockToken.balanceOf(user), initialBalance + 10 ether);
    }

    function testExecuteTokenTransferNotOperator() public {
        vm.prank(owner);
        wallet.addOperator(operator);

        vm.prank(user);
        vm.expectRevert("Only operator can call this function");
        wallet.executeTokenTransfer(address(mockToken), user, 10 ether);
    }

    function testExecuteTokenTransferInsufficientBalance() public {
        vm.prank(owner);
        wallet.addOperator(operator);

        vm.prank(operator);
        vm.expectRevert("Insufficient balance");
        wallet.executeTokenTransfer(address(mockToken), user, 1000 ether);
    }

    function testExecuteEtherTransfer() public {
        vm.startPrank(owner);
        wallet.addOperator(operator);

        // Send ether to wallet
        payable(address(wallet)).transfer(10 ether);

        vm.stopPrank();

        uint256 initialBalance = user.balance;

        vm.prank(operator);
        wallet.executeEtherTransfer(user, 1 ether);

        assertGt(user.balance, initialBalance);
    }

    function testExecuteEtherTransferInsufficientBalance() public {
        vm.prank(owner);
        wallet.addOperator(operator);

        vm.prank(operator);
        vm.expectRevert("Insufficient Ether balance");
        wallet.executeEtherTransfer(user, 100 ether);
    }

    function testAddOperatorZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("Invalid address");
        wallet.addOperator(address(0));
    }

    function testExecuteTokenTransferZeroAmount() public {
        vm.startPrank(owner);
        wallet.addOperator(operator);
        mockToken.transfer(address(wallet), 100 ether);
        vm.stopPrank();

        vm.prank(operator);
        vm.expectRevert("Amount must be greater than 0");
        wallet.executeTokenTransfer(address(mockToken), user, 0);
    }

    function testExecuteTokenTransferToSelf() public {
        vm.startPrank(owner);
        wallet.addOperator(operator);
        mockToken.transfer(address(wallet), 100 ether);
        vm.stopPrank();

        vm.prank(operator);
        vm.expectRevert("Cannot send to contract itself");
        wallet.executeTokenTransfer(address(mockToken), address(wallet), 1 ether);
    }

    function testEmergencyWithdraw() public {
        vm.startPrank(owner);

        // Send ether to wallet
        payable(address(wallet)).transfer(5 ether);

        uint256 initialBalance = owner.balance;

        wallet.emergencyWithdraw(address(0), owner, 1 ether);

        assertGt(owner.balance, initialBalance);
        vm.stopPrank();
    }

    function testEmergencyWithdrawNotOwner() public {
        vm.prank(user);
        vm.expectRevert("Ownable: caller is not the owner");
        wallet.emergencyWithdraw(address(0), user, 1 ether);
    }

    receive() external payable {}
}