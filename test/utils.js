const fs = require("fs");
const path = require("path");

const getEvent = async (tx) => {
  const rc = await tx.wait();
  const event = rc.events.find((event) => event.event === "OrderPay");
  const [from, to, amount, orderId] = event.args;
  return { from, to, amount, orderId };
};

const writeToFile = (fileName, content) =>
  new Promise((resolve, reject) => {
    const route = path.join(path.resolve("./res/"), fileName);
    console.log(route);
    fs.writeFile(route, content, (err) => {
      if (err) {
        console.error(err);
        reject(false);
      }
      resolve(true);
    });
  });

module.exports = {
  getEvent,
  writeToFile,
};
