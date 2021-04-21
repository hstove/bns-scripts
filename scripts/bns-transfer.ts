import { nameTransfer, nameUpdate } from "../src";
import BN from "bn.js";
import { StacksTestnet, StacksMainnet } from "@stacks/network";
import dotenv from "dotenv";
dotenv.config();

const privateKey = process.env.BNS_NAME_KEY;
const name = process.env.BNS_NAME;
// const privateKey = process.env.TRANSFER_OWNER;
const recipient = process.env.TRANSFER_ADDR;

const network = new StacksMainnet();
// network.coreApiUrl = "https://stacks-node-api-bns.testnet.stacks.co";

const run = async () => {
  const res = await nameTransfer({
    fqn: name,
    privateKey,
    network,
    recipient,
  });
  console.log(res);
};

run()
  .catch((e) => console.error(e))
  .finally(() => {
    process.exit(0);
  });
