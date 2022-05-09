// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;
pragma abicoder v2;

import "./common/SafeMath.sol";

contract PaymentEscow {
	struct Order {
		uint256 orderId;
		uint256 amount;
		address to;
		string memo;
	}

    using SafeMath for uint256;

	uint256 lastOrderId;
	mapping(uint256 => Order) private orders;
	mapping(address => Order[]) private orderToAddrs;

    /**
     * @dev MUST emit when a new pay order is created.
     * The `from` argument MUST be the address of the sender who created the order.
     * The `to` argument MUST be the address of the recipient.
     * The `orderId` argument MUST be the id of the created order.
     */
    event OrderPay(address from, address to, uint256 amount, uint256 orderId);

    /**
     * @dev Settle payment order.
     * @param to address of recipient
     * @param memo jwt token
     */
	function payOrder(address to, string memory memo) external payable {
        require(msg.value > 0, "PaymentEscow: can not transfer less than 0");
        require(to != address(0), "PaymentEscow: invalid receiver address");

        (bool success, ) = payable(to).call{value: msg.value}("");
        require(success, "PaymentEscow: pay order failed");

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

    receive() external payable {}
    fallback() external payable {}
}