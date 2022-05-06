// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract PaymentEscow {
	struct Order {
		uint256 orderId;
		uint256 amount;
		address to;
		string memo;
	}

    using SafeMath for uint256;
    using SafeERC20 for IERC20; 

    IERC20 private immutable _token;
	uint256 lastOrderId;
	mapping(uint256 => Order) private orders;
	mapping(address => Order[]) private orderToAddrs;

    /**
     * @dev Creates a PaymentEscow contract.
     * @param token_ address of the ERC20 token contract
     */
    constructor(address token_) {
        require(token_ != address(0), "PaymentEscow: invalid base token address");
        _token = IERC20(token_);
    }

    /**
     * @dev Settle payment order.
     * @param amount amount of trading token
     * @param to address of receiver
     * @param memo jwt token
     * @return the generated order id
     */
	function payOrder(uint256 amount, address to, string memory memo) external returns (uint256) {
        require(amount > 0, "PaymentEscow: can not transfer less than 0");
        require(to != address(0), "PaymentEscow: invalid receiver address");
        _token.safeTransferFrom(msg.sender, to, amount);
        Order memory newOrder;
        newOrder.orderId = lastOrderId;
        newOrder.amount = amount;
        newOrder.to = to;
        newOrder.memo = memo;
        orderToAddrs[msg.sender].push(newOrder);
        uint256 currentOrderId = lastOrderId;
        lastOrderId = lastOrderId.add(1);
        return currentOrderId;
    }

    /**
     * @dev Get the payment order by given order id
     * @param orderId order id to retrieve
     * @return the payment order
     */
	function getOrder(uint256 orderId) view external returns (Order memory) {
        require(orderId >= 0 && orderId < lastOrderId, "PaymentEscow: invalid orderId");
        return orders[orderId];
    }

    /**
     * @dev Get the payment orders by given address
     * @param addr addr to retrieve payment orders
     * @return the list of payment orders
     */
	function getOrders(address addr) view external returns (Order[] memory) {
        require(addr != address(0), "PaymentEscow: invalid address");
        return orderToAddrs[addr];
    }

    /**
     * @dev Get the payment order by given address
     * @param addr addr to retrieve payment orders
     * @param index index of payment orders of given address
     * @return the payment order
     */
    function getOrderByAddress(address addr, uint256 index) view external returns (Order memory) {
        require(addr != address(0), "PaymentEscow: invalid address");
        require(index >= 0 && index < orderToAddrs[addr].length, "PaymentEscow: invalid orderId");
        return orderToAddrs[addr][index];
    }

    /**
     * @dev Get the count of payment orders by given address
     * @param addr addr to retrieve count of payment orders
     * @return the count of payment order
     */
    function getOrderCountByAddress(address addr) view external returns (uint256) {
        require(addr != address(0), "PaymentEscow: invalid address");
        return orderToAddrs[addr].length;
    }
}