# BNS Scripts

Some hacky scripts that can be used to do BNS operations on Stacks 2.0. This is not a proper CLI and will not be maintained. Use at your own risk

These scripts are only helpful for making the actual contract calls. The zonefile contents used are mostly hard-coded - so they don't actually set up your profile.json.

## Setup

First copy `.env.sample` to `.env` and fill in the right info.

Then run `yarn`

## Scripts

All scripts can be invoked with `yarn ts-node scripts/{script-name}.ts`

Scripts are provided for preorder/register/transfer/update.

The network info is hard-coded in each file, and is likely inconsistent. Change them to be what you need.
