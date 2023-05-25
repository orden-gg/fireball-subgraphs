import { ERC1155Item } from '../../generated/schema';
import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { AavegotchiDiamond } from '../../generated/AavegotchiDiamond/AavegotchiDiamond';
import { loadOrCreatePlayer } from './player.helper';

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
): void {
  const equippedWearables = getEquipedIds(equippedItems);
  let oldOwner = loadOrCreatePlayer(oldOwnerAddress);
  let newOwner = loadOrCreatePlayer(newOwnerAddress);

  for (let index = 0; index < equippedWearables.length; index++) {
    const tokenId = BigInt.fromI32(equippedItems[index]);
    let oldOwnerItem: ERC1155Item | null = null;
    let newOwnerItem: ERC1155Item | null = null;

    const contract = AavegotchiDiamond.bind(event.address);
    const _itemType = contract.getItemType(tokenId);

    oldOwnerItem = loadOrCreateItem(tokenId, oldOwnerAddress, _itemType.category);
    newOwnerItem = loadOrCreateItem(tokenId, newOwnerAddress, _itemType.category);

    oldOwnerItem.equipped = oldOwnerItem.equipped - 1;

    oldOwner.itemsVP = oldOwner.itemsVP.minus(_itemType.ghstPrice);
    newOwner.itemsVP = newOwner.itemsVP.plus(_itemType.ghstPrice);

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

  oldOwner.save();
  newOwner.save();
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
  // let isAlreadyAdded = false;

  // for (let index = 0; index < gotchisIds.length; index++) {
  //   const id = gotchisIds[index];

  //   if (id == gotchiId) {
  //     isAlreadyAdded = true;
  //   }
  // }

  // if (!isAlreadyAdded) {
  result.push(gotchiId);
  // }

  return result;
}

// @ts-ignore
export function getEquipedIds(equippedWearables: i32[]): i32[] {
  // @ts-ignore
  const result: i32[] = [];

  for (let index = 0; index < equippedWearables.length; index++) {
    const tokenId = equippedWearables[index];
    if (tokenId != 0) {
      result.push(tokenId);
    }
  }

  return result;
}
