import { Address, log } from '@graphprotocol/graph-ts';
import { TransferBatch, TransferSingle } from '../../generated/WearablesDiamond/WearablesDiamond';
import { loadOrCreateItem, loadOrCreatePlayer } from '../helpers';
import { CORE_DIAMOND, ERC1155ItemCategoty } from '../shared';
import { AavegotchiDiamond } from '../../generated/WearablesDiamond/AavegotchiDiamond';

// ITEM HENDLERS
export function handleTransferSingle(event: TransferSingle): void {
  const contract = AavegotchiDiamond.bind(Address.fromString(CORE_DIAMOND));
  const _response = contract.try_getItemType(event.params._id);

  if (!_response.reverted) {
    const _itemType = _response.value;

    if (_itemType.category == ERC1155ItemCategoty.Badge) {
      log.error('BADGE {}', [event.params._id.toString()]);
    } else {
      const oldOwner = loadOrCreatePlayer(event.params._from);
      const newOwner = loadOrCreatePlayer(event.params._to);

      const itemsVP = event.params._value.times(_itemType.ghstPrice);

      oldOwner.itemsVP = oldOwner.itemsVP.minus(itemsVP);
      newOwner.itemsVP = newOwner.itemsVP.plus(itemsVP);

      const wearableFrom = loadOrCreateItem(event.params._id, event.params._from, _itemType.category);
      const wearableTo = loadOrCreateItem(event.params._id, event.params._to, _itemType.category);

      const amount = event.params._value.toI32();

      wearableFrom.amount = wearableFrom.amount - amount;
      wearableTo.amount = wearableTo.amount + amount;
      wearableFrom.save();
      wearableTo.save();

      log.error(
        `
        From Event: {},
        Category: {}, 
        itemID: {}, 
        amount: {}, 
        from was/has: {},
        to was/has: {}
      `,
        [
          'handleTransferSingle (WEARABLES)',
          _itemType.category.toString(),
          event.params._id.toString(),
          amount.toString(),
          `${oldOwner.itemsAmount}/${oldOwner.itemsAmount - amount}`,
          `${newOwner.itemsAmount}/${newOwner.itemsAmount + amount}`
        ]
      );

      oldOwner.itemsAmount = oldOwner.itemsAmount - amount;
      newOwner.itemsAmount = newOwner.itemsAmount + amount;
      oldOwner.save();
      newOwner.save();
    }
  }
}

export function handleTransferBatch(event: TransferBatch): void {
  const contract = AavegotchiDiamond.bind(Address.fromString(CORE_DIAMOND));
  const oldOwner = loadOrCreatePlayer(event.params._from);
  const newOwner = loadOrCreatePlayer(event.params._to);
  let transferedAmount = 0;

  for (let i = 0; i < event.params._ids.length; i++) {
    const _response = contract.try_getItemType(event.params._ids[i]);

    if (!_response.reverted) {
      const _itemType = _response.value;

      if (_itemType.category == ERC1155ItemCategoty.Badge) {
        log.warning('BADGE {}', [event.params._ids[i].toString()]);
      } else {
        const wearableFrom = loadOrCreateItem(event.params._ids[i], event.params._from, _itemType.category);
        const wearableTo = loadOrCreateItem(event.params._ids[i], event.params._to, _itemType.category);

        const itemsVP = event.params._values[i].times(_itemType.ghstPrice);

        oldOwner.itemsVP = oldOwner.itemsVP.minus(itemsVP);
        newOwner.itemsVP = newOwner.itemsVP.plus(itemsVP);

        const amount = event.params._values[i].toI32();

        log.error(
          `
          From Event: {},
          Category: {}, 
          itemID: {}, 
          amount: {}, 
          from was/has: {},
          to was/has: {},
          from address: {}
        `,
          [
            'handleTransferBatch (WEARABLES)',
            _itemType.category.toString(),
            event.params._ids[i].toString(),
            amount.toString(),
            `${oldOwner.itemsAmount}/${oldOwner.itemsAmount - amount}`,
            `${newOwner.itemsAmount}/${newOwner.itemsAmount + amount}`,
            event.params._from.toHexString()
          ]
        );

        wearableFrom.amount = wearableFrom.amount - amount;
        wearableTo.amount = wearableTo.amount + amount;

        transferedAmount = transferedAmount + amount;

        wearableFrom.save();
        wearableTo.save();
      }
    }
  }

  oldOwner.itemsAmount = oldOwner.itemsAmount - transferedAmount;
  newOwner.itemsAmount = newOwner.itemsAmount + transferedAmount;

  oldOwner.save();
  newOwner.save();
}
