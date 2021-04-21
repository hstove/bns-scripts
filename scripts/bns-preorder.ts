import { preorderName } from "../src";
import BN from "bn.js";
import { StacksTestnet } from "@stacks/network";
import dotenv from "dotenv";
dotenv.config();

const privateKey = process.env.BNS_NAME_KEY;
const name = process.env.BNS_NAME;

const network = new StacksTestnet();
// network.coreApiUrl = "https://stacks-node-api-bns.testnet.stacks.co";

const run = async () => {
  const res = await preorderName({
    fullyQualifiedName: name,
    privateKey,
    salt: "asdf",
    stxToBurn: new BN(2 * 1000000, 10),
    network,
  });
  console.log(res);
};

run()
  .catch((e) => console.error(e))
  .finally(() => {
    process.exit(0);
  });
