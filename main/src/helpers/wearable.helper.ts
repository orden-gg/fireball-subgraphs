import { ERC1155Item, Escrow } from '../../generated/schema';
import { Address, BigInt, ethereum, log } from '@graphprotocol/graph-ts';
import { AavegotchiDiamond } from '../../generated/AavegotchiDiamond/AavegotchiDiamond';
import { loadOrCreatePlayer } from './player.helper';
import { CORE_DIAMOND, ERC1155ItemCategoty } from '../shared';

export function loadOrCreateItem(
  tokenId: BigInt,
  owner: Address,
  // @ts-ignore
  category: i32
): ERC1155Item {
  let item = ERC1155Item.load(tokenId.toString() + '-' + owner.toHexString());

  if (!item) {
    item = new ERC1155Item(tokenId.toString() + '-' + owner.toHexString());
    item.tokenId = tokenId.toI32();
    item.amount = 0;
    item.owner = owner.toHexString();
    item.equipped = 0;
    item.equippedGotchis = [];

    if (category !== -1) {
      item.category = category;
    }
  }

  return item;
}

export function isItemCreated(tokenId: BigInt, owner: Address): boolean {
  let item = ERC1155Item.load(tokenId.toString() + '-' + owner.toHexString());

  if (item) {
    return true;
  } else {
    return false;
  }
}

export function switchEquippedItems(
  // @ts-ignore
  equippedItems: i32[],
  // @ts-ignore
  gotchiId: i32,
  oldOwnerAddress: Address,
  newOwnerAddress: Address,
  event: ethereum.Event
): BigInt {
  let vp = BigInt.zero();

  const itemsAmount = equippedItems.length;

  for (let index = 0; index < itemsAmount; index++) {
    const tokenId = BigInt.fromI32(equippedItems[index]);

    let oldOwnerItem: ERC1155Item | null = null;
    let newOwnerItem: ERC1155Item | null = null;

    const contract = AavegotchiDiamond.bind(event.address);
    const _itemType = contract.getItemType(tokenId);

    oldOwnerItem = loadOrCreateItem(tokenId, oldOwnerAddress, _itemType.category);
    newOwnerItem = loadOrCreateItem(tokenId, newOwnerAddress, _itemType.category);

    oldOwnerItem.equipped = oldOwnerItem.equipped - 1;

    vp = vp.plus(_itemType.ghstPrice);

    if (oldOwnerItem.equipped == 0) {
      oldOwnerItem.equippedGotchis = removeGotchiId(gotchiId, oldOwnerItem.equippedGotchis);
    }

    if (newOwnerItem.equipped == 0) {
      newOwnerItem.equippedGotchis = addGotchiId(gotchiId, newOwnerItem.equippedGotchis);
    }

    newOwnerItem.equipped = newOwnerItem.equipped + 1;

    oldOwnerItem.save();
    newOwnerItem.save();
  }

  return vp;
}

// @ts-ignore
export function removeGotchiId(gotchiId: i32, gotchisIds: i32[]): i32[] {
  // @ts-ignore
  const result: i32[] = [];

  for (let index = 0; index < gotchisIds.length; index++) {
    const id = gotchisIds[index];
    if (id != gotchiId) {
      result.push(id);
    }
  }

  return result;
}

// @ts-ignore
export function addGotchiId(gotchiId: i32, gotchisIds: i32[]): i32[] {
  // @ts-ignore
  const result: i32[] = gotchisIds;

  result.push(gotchiId);

  return result;
}

// @ts-ignore
export function getEquipedIds(equippedWearables: i32[]): i32[] {
  // @ts-ignore
  const result: i32[] = [];

  for (let index = 0; index < equippedWearables.length; index++) {
    // @ts-ignore
    const itemId: i32 = equippedWearables[index];

    if (itemId != 0) {
      result.push(itemId);
    }
  }

  return result;
}

// ITEM HENDLERS
export function updateTransferSingle(from: Address, to: Address, id: BigInt, value: BigInt): void {
  const isFromEscrow: Escrow | null = Escrow.load(from.toHexString());
  const isToEscrow: Escrow | null = Escrow.load(to.toHexString());

  if (isFromEscrow != null || isToEscrow != null) {
    return log.error('transfer from/to escrow {}', ['SINGLE']);
  }

  const contract = AavegotchiDiamond.bind(Address.fromString(CORE_DIAMOND));
  const _itemType = contract.getItemType(id);

  if (_itemType.category == ERC1155ItemCategoty.Badge) {
    // log.error('BADGE {}', [id.toString()]);
  } else {
    const oldOwner = loadOrCreatePlayer(from);
    const newOwner = loadOrCreatePlayer(to);

    const wearableFrom = loadOrCreateItem(id, from, _itemType.category);
    const wearableTo = loadOrCreateItem(id, to, _itemType.category);

    const itemsVP = _itemType.ghstPrice.times(value);

    oldOwner.itemsVP = oldOwner.itemsVP.minus(itemsVP);
    newOwner.itemsVP = newOwner.itemsVP.plus(itemsVP);

    const amount = value.toI32();

    wearableFrom.amount = wearableFrom.amount - amount;
    wearableTo.amount = wearableTo.amount + amount;
    wearableFrom.save();
    wearableTo.save();

    // log.error(
    //   `
    //   From Event: {},
    //   Category: {},
    //   itemID: {},
    //   amount: {},
    //   from was/has: {},
    //   to was/has: {}
    // `,
    //   [
    //     'handleTransferSingle',
    //     _itemType.category.toString(),
    //     id.toString(),
    //     amount.toString(),
    //     `${oldOwner.itemsAmount}/${oldOwner.itemsAmount - amount}`,
    //     `${newOwner.itemsAmount}/${newOwner.itemsAmount + amount}`
    //   ]
    // );

    oldOwner.itemsAmount = oldOwner.itemsAmount - amount;
    newOwner.itemsAmount = newOwner.itemsAmount + amount;
    oldOwner.save();
    newOwner.save();
  }
}

export function updateTransferBatch(from: Address, to: Address, ids: BigInt[], values: BigInt[]): void {
  const isFromEscrow: Escrow | null = Escrow.load(from.toHexString());
  const isToEscrow: Escrow | null = Escrow.load(to.toHexString());

  if (isFromEscrow != null || isToEscrow != null) {
    return log.error('transfer from/to escrow {}', ['SINGLE']);
  }

  const contract = AavegotchiDiamond.bind(Address.fromString(CORE_DIAMOND));
  const oldOwner = loadOrCreatePlayer(from);
  const newOwner = loadOrCreatePlayer(to);
  let transferedAmount = 0;

  for (let i = 0; i < ids.length; i++) {
    const _itemType = contract.getItemType(ids[i]);

    if (_itemType.category == ERC1155ItemCategoty.Badge) {
      // log.warning('BADGE {}', [ids[i].toString()]);
    } else {
      const wearableFrom = loadOrCreateItem(ids[i], from, _itemType.category);
      const wearableTo = loadOrCreateItem(ids[i], to, _itemType.category);

      const itemsVP = _itemType.ghstPrice.times(values[i]);

      oldOwner.itemsVP = oldOwner.itemsVP.minus(itemsVP);
      newOwner.itemsVP = newOwner.itemsVP.plus(itemsVP);

      const amount = values[i].toI32();

      // log.error(
      //   `
      //     From Event: {},
      //     Category: {},
      //     itemID: {},
      //     amount: {},
      //     from was/has: {},
      //     to was/has: {},
      //     from address: {}
      //   `,
      //   [
      //     'handleTransferBatch',
      //     _itemType.category.toString(),
      //     ids[i].toString(),
      //     amount.toString(),
      //     `${oldOwner.itemsAmount}/${oldOwner.itemsAmount - amount}`,
      //     `${newOwner.itemsAmount}/${newOwner.itemsAmount + amount}`,
      //     from.toHexString()
      //   ]
      // );

      wearableFrom.amount = wearableFrom.amount - amount;
      wearableTo.amount = wearableTo.amount + amount;

      transferedAmount = transferedAmount + amount;

      wearableFrom.save();
      wearableTo.save();
    }
  }

  oldOwner.itemsAmount = oldOwner.itemsAmount - transferedAmount;
  newOwner.itemsAmount = newOwner.itemsAmount + transferedAmount;

  oldOwner.save();
  newOwner.save();
}
