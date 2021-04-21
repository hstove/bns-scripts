import {
  getAddressFromPrivateKey,
  TransactionVersion,
} from "@stacks/transactions";
import * as c32check from "c32check";
import dotenv from "dotenv";
dotenv.config();

// const ownerKey = process.argv[2];
const ownerKey = process.env.BNS_NAME_KEY;

const ownerAddress = getAddressFromPrivateKey(
  ownerKey,
  TransactionVersion.Mainnet
);

console.log(ownerAddress);
