import { Address } from '@graphprotocol/graph-ts';
import { Epoch } from '../../generated/schema';

export function loadOrCreateEpoch(contract: Address): Epoch {
  let epoch = Epoch.load(contract.toHexString());

  if (!epoch) {
    epoch = new Epoch(contract.toHexString());
    epoch.zonesCount = 0;
  }

  return epoch;
}
