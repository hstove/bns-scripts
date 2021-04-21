import { nameUpdate } from "../src";
import BN from "bn.js";
import { StacksTestnet, StacksMainnet } from "@stacks/network";
import dotenv from "dotenv";
dotenv.config();

const privateKey = process.env.BNS_NAME_KEY;
// const privateKey = process.env.TRANSFER_KEY;
const name = process.env.BNS_NAME;

const network = new StacksMainnet();
// const network = new StacksTestnet();
// network.coreApiUrl = "https://stacks-node-api-bns.testnet.stacks.co";

const run = async () => {
  const zonefile = `$ORIGIN ${name}\n$TTL 3600\n_http._tcp\tIN\tURI\t10\t1\t\"https://gaia.blockstack.org/hub/1G8XTwZkUzu7DJYDW4oA4JX5shnW8LcpC2/profile.json\"\n\n`;
  const res = await nameUpdate({
    fullyQualifiedName: name,
    privateKey,
    network,
    zonefile,
  });
  console.log(res);
};

run()
  .catch((e) => console.error(e))
  .finally(() => {
    process.exit(0);
  });
