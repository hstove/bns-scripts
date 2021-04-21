import BN from "bn.js";
import { StacksNetwork, StacksMainnet } from "@stacks/network";
import {
  hash160,
  broadcastTransaction,
  makeContractCall,
  SignedContractCallOptions,
  TxBroadcastResult,
  bufferCV,
  uintCV,
  TxBroadcastResultRejected,
  ClarityValue,
  bufferCVFromString,
  PostConditionMode,
  standardPrincipalCV,
  noneCV,
} from "@stacks/transactions";

export type Result = {
  success: boolean;
  data: any;
  error?: string;
};

export const BNS_CONTRACT_ADDRESS = "SP000000000000000000002Q6VF78";
export const BNS_CONTRACT_NAME = "bns";

export const uintCVFromBN = (int: BN) => uintCV(int.toString(10));

/**
 * Preorder namespace options
 *
 * @param  {String} namespace - the namespace to preorder
 * @param  {String} salt - salt used to generate the preorder namespace hash
 * @param  {BigNum} stxToBurn - amount of STX to burn for the registration
 * @param  {String} privateKey - the private key to sign the transaction
 * @param  {StacksNetwork} network - the Stacks blockchain network to register on
 */
export interface PreorderNamespaceOptions {
  namespace: string;
  salt: string;
  stxToBurn: BN;
  privateKey: string;
  network?: StacksNetwork;
}

// export async function broadcastTransaction(
//   transaction: StacksTransaction,
//   network: StacksNetwork,
//   attachment?: Buffer
// ): Promise<TxBroadcastResult> {
//   const rawTx = transaction.serialize();
//   const url = network.getBroadcastApiUrl();

//   // return broadcastRawTransaction(rawTx, url, attachment);

//   const options = {
//     method: 'POST',
//     headers: { 'Content-Type': attachment ? 'application/json' : 'application/octet-stream' },
//     body: attachment
//       ? JSON.stringify({
//           tx: rawTx.toString('hex'),
//           attachment: attachment.toString('hex'),
//         })
//       : rawTx,
//   };
//   const res
// }

function getContractAddress(network: StacksNetwork) {
  if (network.isMainnet()) {
    return BNS_CONTRACT_ADDRESS;
  }
  return "ST000000000000000000002AMW42H";
}

interface BNSContractCallOpts extends Partial<SignedContractCallOptions> {
  functionName: string;
  functionArgs: ClarityValue[];
  senderKey: string;
  network: StacksNetwork;
  attachment?: Buffer;
}

async function makeBNSContractCall({
  functionName,
  functionArgs,
  senderKey,
  network,
  attachment,
  ...rest
}: BNSContractCallOpts): Promise<Result> {
  // console.log("network", network);
  console.log(network.isMainnet());
  const txOptions: SignedContractCallOptions = {
    contractAddress: getContractAddress(network),
    contractName: BNS_CONTRACT_NAME,
    functionName,
    functionArgs,
    validateWithAbi: false,
    senderKey,
    network,
    postConditionMode: PostConditionMode.Allow,
    ...rest,
  };

  const tx = await makeContractCall(txOptions);
  console.log(tx.auth.spendingCondition.nonce.toNumber());

  console.log("tx", tx);
  return broadcastTransaction(tx, network, attachment).then(
    (result: TxBroadcastResult) => {
      if (result.hasOwnProperty("error")) {
        const errorResult = result as TxBroadcastResultRejected;
        console.error(result);
        return {
          success: false,
          data: {},
          error: errorResult.error as string,
        };
      } else {
        return {
          success: true,
          data: {
            txid: result as string,
          },
        };
      }
    }
  );
}

export async function nameTransfer({
  fqn,
  recipient,
  privateKey,
  network,
}: {
  fqn: string;
  recipient: string;
  privateKey: string;
  network: StacksNetwork;
}) {
  const { name, namespace } = decodeFQN(fqn);
  const args = [
    bufferCVFromString(namespace),
    bufferCVFromString(name),
    standardPrincipalCV(recipient),
    noneCV(),
  ];
  return makeBNSContractCall({
    functionName: "name-transfer",
    functionArgs: args,
    network,
    senderKey: privateKey,
  });
}

/**
 * Generates and broadcasts a namespace preorder transaction.
 * First step in registering a namespace. This transaction does not reveal the namespace that is
 * about to be registered. And it sets the amount of STX to be burned for the registration.
 *
 * Returns a Result object which will indicate if the transaction was successfully broadcasted
 *
 * @param  {PreorderNamespaceOptions} options - an options object for the preorder
 *
 * @return {Promise<Result>}
 */
export async function preorderNamespace({
  namespace,
  salt,
  stxToBurn,
  privateKey,
  network,
}: PreorderNamespaceOptions): Promise<Result> {
  const bnsFunctionName = "namespace-preorder";
  const saltedNamespaceBuffer = Buffer.from(`0x${namespace}${salt}`);
  const hashedSaltedNamespace = hash160(saltedNamespaceBuffer);
  const txNetwork = network || new StacksMainnet();

  return makeBNSContractCall({
    functionName: bnsFunctionName,
    functionArgs: [bufferCV(hashedSaltedNamespace), uintCVFromBN(stxToBurn)],
    senderKey: privateKey,
    network: txNetwork,
  });
}

/**
 * Preorder name options
 *
 * @param  {String} fullyQualifiedName - the fully qualified name to preorder including the
 *                                        namespace (myName.id)
 * @param  {String} salt - salt used to generate the preorder name hash
 * @param  {BigNum} stxToBurn - amount of STX to burn for the registration
 * @param  {String} privateKey - the private key to sign the transaction
 * @param  {StacksNetwork} network - the Stacks blockchain network to register on
 */
export interface PreorderNameOptions {
  fullyQualifiedName: string;
  salt: string;
  stxToBurn: BN;
  privateKey: string;
  network?: StacksNetwork;
}

/**
 * Generates and broadcasts a name preorder transaction.
 * First step in registering a name. This transaction does not reveal the name that is
 * about to be registered. And it sets the amount of STX to be burned for the registration.
 *
 * Returns a Result object which will indicate if the transaction was successfully broadcasted
 *
 * @param  {PreorderNameOptions} options - an options object for the preorder
 *
 * @return {Promise<Result>}
 */
export async function preorderName({
  fullyQualifiedName,
  salt,
  stxToBurn,
  privateKey,
  network,
}: PreorderNameOptions): Promise<Result> {
  const bnsFunctionName = "name-preorder";
  const { subdomain } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error("Cannot preorder a subdomain using preorderName()");
  }
  const saltedNamesBuffer = Buffer.from(`${fullyQualifiedName}${salt}`);
  const hashedSaltedName = hash160(saltedNamesBuffer);
  // console.log("hashedSaltedName", hashedSaltedName);
  const txNetwork = network || new StacksMainnet();

  return makeBNSContractCall({
    functionName: bnsFunctionName,
    functionArgs: [bufferCV(hashedSaltedName), uintCVFromBN(stxToBurn)],
    senderKey: privateKey,
    network: txNetwork,
  });
}

/**
 * Register name options
 *
 * @param  {String} fullyQualifiedName - the fully qualified name to preorder including the
 *                                        namespace (myName.id)
 * @param  {String} salt - salt used to generate the preorder name hash
 * @param  {String} zonefileHash - the zonefile hash to register with the name
 * @param  {String} privateKey - the private key to sign the transaction
 * @param  {StacksNetwork} network - the Stacks blockchain network to register on
 */
export interface RegisterNameOptions
  extends Partial<SignedContractCallOptions> {
  fullyQualifiedName: string;
  salt: string;
  zonefileHash: string;
  privateKey: string;
  network?: StacksNetwork;
}

/**
 * Generates and broadcasts a name registration transaction.
 * Second and final step in registering a name.
 *
 * Returns a Result object which will indicate if the transaction was successfully broadcasted
 *
 * @param  {RegisterNameOptions} options - an options object for the registration
 *
 * @return {Promise<Result>}
 */
export async function registerName({
  fullyQualifiedName,
  salt,
  zonefileHash,
  privateKey,
  network,
  ...rest
}: RegisterNameOptions): Promise<Result> {
  const bnsFunctionName = "name-register";
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error("Cannot register a subdomain using registerName()");
  }
  const txNetwork = network || new StacksMainnet();

  return makeBNSContractCall({
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
      bufferCVFromString(salt),
      bufferCVFromString(zonefileHash),
    ],
    senderKey: privateKey,
    network: txNetwork,
    ...rest,
  });
}

interface UpdateNameOpts extends Partial<SignedContractCallOptions> {
  fullyQualifiedName: string;
  zonefile: string;
  privateKey: string;
}

export async function nameUpdate({
  network,
  fullyQualifiedName,
  zonefile,
  privateKey,
  ...rest
}: UpdateNameOpts) {
  const bnsFunctionName = "name-update";
  const { subdomain, namespace, name } = decodeFQN(fullyQualifiedName);
  if (subdomain) {
    throw new Error("Cannot update a subdomain");
  }
  const txNetwork = network || new StacksMainnet();

  return makeBNSContractCall({
    functionName: bnsFunctionName,
    functionArgs: [
      bufferCVFromString(namespace),
      bufferCVFromString(name),
      bufferCV(hash160(Buffer.from(zonefile))),
    ],
    senderKey: privateKey,
    network: txNetwork,
    attachment: Buffer.from(zonefile),
    ...rest,
  });
}

export function decodeFQN(
  fqdn: string
): {
  name: string;
  namespace: string;
  subdomain?: string;
} {
  const nameParts = fqdn.split(".");
  if (nameParts.length > 2) {
    const subdomain = nameParts[0];
    const name = nameParts[1];
    const namespace = nameParts[2];
    return {
      subdomain,
      name,
      namespace,
    };
  } else {
    const name = nameParts[0];
    const namespace = nameParts[1];
    return {
      name,
      namespace,
    };
  }
}
