import { preorderName, registerName } from "../src";
import BN from "bn.js";
import { StacksTestnet } from "@stacks/network";
import dotenv from "dotenv";
dotenv.config();

const privateKey = process.env.BNS_NAME_KEY;
const name = process.env.BNS_NAME;

const network = new StacksTestnet();
// network.coreApiUrl = "https://stacks-node-api-bns.testnet.stacks.co";

const run = async () => {
  const res = await registerName({
    salt: "asdf",
    fullyQualifiedName: name,
    privateKey,
    network,
    zonefileHash: "asdf",
    nonce: new BN(4, 10),
  });
  console.log(res);
};

run()
  .catch((e) => console.error(e))
  .finally(() => {
    process.exit(0);
  });
