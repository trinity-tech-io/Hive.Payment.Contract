// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;
pragma abicoder v2;

import "./common/SafeMath.sol";
import "./common/ReentrancyGuard.sol";
import "./common/Ownable.sol";

contract HivePaymentV1 is Ownable, ReentrancyGuard {
	struct Order {
		uint256 orderId;
		uint256 amount;
		address to;
		string memo;
	}

    using SafeMath for uint256;

    uint256 private constant _RATE_BASE = 100;
    uint256 private _platformFeeRate;
    address private _platformAddress;
	uint256 private lastOrderId;
	mapping(uint256 => Order) private orders;
	mapping(address => Order[]) private orderToAddrs;

    /**
     * @dev MUST emit when a new pay order is created.
     * The `from` argument MUST be the address of the sender who created the order.
     * The `to` argument MUST be the address of the recipient.
     * The `amount` argument MUST be the amount of paid token.
     * The `orderId` argument MUST be the id of the created order.
     */
    event OrderPay(address from, address to, uint256 amount, uint256 orderId);

    /**
     * @dev MUST emit when platform fee config is updated.
     * The `platformAddress` argument MUST be the address of the platform.
     * The `platformFeeRate` argument MUST be the platform fee rate.
     */
    event PlatformFeeChanged(address platformAddress, uint256 platformFeeRate);
    
    /**
     * @dev Creates a hive payment contract.
     */
    constructor (address platformAddress_, uint256 platformFeeRate_) {
        require(_setPlatformFee(platformAddress_, platformFeeRate_), "HivePaymentV1: create hive payment contract failed");
    }

    /**
     * @dev Pay payment order.
     * @param to address of recipient
     * @param memo jwt token
     */
	function payOrder(address to, string memory memo) external payable nonReentrant {
        require(msg.value > 0, "HivePaymentV1: can not transfer less than 0");
        require(to != address(0), "HivePaymentV1: invalid receiver address");

        uint256 platformFee = msg.value.mul(_platformFeeRate).div(_RATE_BASE);
        uint256 transferAmount = msg.value.sub(platformFee);
        bool success;
        if (platformFee > 0) {
            (success, ) = payable(_platformAddress).call{value: platformFee}("");
            require(success, "HivePaymentV1: platform fee transfer failed");    
        }
        if (transferAmount > 0) {
            (success, ) = payable(to).call{value: transferAmount}("");
            require(success, "HivePaymentV1: pay order failed");
        }

        Order memory newOrder;
        newOrder.orderId = lastOrderId;
        newOrder.amount = msg.value;
        newOrder.to = to;
        newOrder.memo = memo;

        orderToAddrs[msg.sender].push(newOrder);
        orders[lastOrderId] = newOrder;

        uint256 currentOrderId = lastOrderId;
        lastOrderId = lastOrderId.add(1);
        emit OrderPay(msg.sender, to, msg.value, currentOrderId);
    }

    /**
     * @dev Get the payment order by given order id
     * @param orderId order id to retrieve
     * @return order payment order
     */
	function getOrder(uint256 orderId) view external returns (Order memory) {
        require(orderId >= 0 && orderId < lastOrderId, "HivePaymentV1: invalid orderId");
        return orders[orderId];
    }

    /**
     * @dev Get the payment orders by given address
     * @param addr addr to retrieve payment orders
     * @return orders list of payment orders
     */
	function getOrders(address addr) view external returns (Order[] memory) {
        require(addr != address(0), "HivePaymentV1: invalid address");
        return orderToAddrs[addr];
    }

    /**
     * @dev Get the payment order by given address
     * @param addr addr to retrieve payment orders
     * @param index index of payment orders of given address
     * @return order payment order
     */
    function getOrderByAddress(address addr, uint256 index) view external returns (Order memory) {
        require(addr != address(0), "HivePaymentV1: invalid address");
        require(index >= 0 && index < orderToAddrs[addr].length, "PaymentEscow: invalid orderId");
        return orderToAddrs[addr][index];
    }

    /**
     * @dev Get the count of payment orders by given address
     * @param addr addr to retrieve count of payment orders
     * @return orderCount count of payment order
     */
    function getOrderCountByAddress(address addr) view external returns (uint256) {
        require(addr != address(0), "HivePaymentV1: invalid address");
        return orderToAddrs[addr].length;
    }

    /**
     * @dev Set platform fee config.
     * @param platformAddress address of platform
     * @param platformFeeRate platform fee rate
     */
    function setPlatformFee(address platformAddress, uint256 platformFeeRate) external onlyOwner {
        require(_setPlatformFee(platformAddress, platformFeeRate), "HivePaymentV1: set platform fee failed");
    }

    /**
     * @dev Set platform fee config.
     * @param platformAddress address of platform
     * @param platformFeeRate platform fee rate
     * @return success success or failed
     */
    function _setPlatformFee(address platformAddress, uint256 platformFeeRate) internal returns (bool) {
        require(platformAddress != address(0), "HivePaymentV1: invalid platform address");
        require(platformFeeRate <= _RATE_BASE, "HivePaymentV1: invalid platform fee rate");
        _platformAddress = platformAddress;
        _platformFeeRate = platformFeeRate;
        emit PlatformFeeChanged(platformAddress, platformFeeRate);
        return true;
    }

    /**
     * @dev Get platform fee config
     * @return platformAddress address of platform
     * @return platformFeeRate platform fee rate
     */
    function getPlatformFee() view external returns (address platformAddress, uint256 platformFeeRate) {
        platformAddress = _platformAddress;
        platformFeeRate = _platformFeeRate;
    }

    receive() external payable {}
    fallback() external payable {}
}