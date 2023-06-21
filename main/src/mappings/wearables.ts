import { TransferBatch, TransferSingle, EquipWearables } from '../../generated/WearablesDiamond/WearablesDiamond';
import { loadOrCreateGotchi, updateGotchiInfo, updateTransferBatch, updateTransferSingle } from '../helpers';

// ITEM HENDLERS
export function handleTransferSingle(event: TransferSingle): void {
  updateTransferSingle(event.params._from, event.params._to, event.params._id, event.params._value);
}

export function handleTransferBatch(event: TransferBatch): void {
  updateTransferBatch(event.params._from, event.params._to, event.params._ids, event.params._values);
}

export function handleEquipWearables(event: EquipWearables): void {
  let gotchi = loadOrCreateGotchi(event.params._tokenId)!;

  gotchi = updateGotchiInfo(gotchi, event.params._tokenId, event);

  gotchi.save();
}
