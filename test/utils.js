const getEvent = async (tx) => {
  const rc = await tx.wait();
  const event = rc.events.find((event) => event.event === "OrderPay");
  const [from, to, amount, orderId] = event.args;
  return { from, to, amount, orderId };
};

module.exports = {
  getEvent,
};
