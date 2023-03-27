import { ERC1155Item } from '../../generated/schema';
import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { AavegotchiDiamond } from '../../generated/AavegotchiDiamond/AavegotchiDiamond';

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
  oldOwner: Address,
  newOwner: Address,
  event: ethereum.Event
): void {
  for (let index = 0; index < equippedItems.length; index++) {
    const tokenIdNumber = equippedItems[index];

    if (tokenIdNumber !== 0) {
      const tokenId = BigInt.fromI32(tokenIdNumber);
      const isCreated = isItemCreated(tokenId, oldOwner) && isItemCreated(tokenId, newOwner);
      let oldOwnerItem: ERC1155Item | null = null;
      let newOwnerItem: ERC1155Item | null = null;

      if (isCreated) {
        oldOwnerItem = loadOrCreateItem(tokenId, oldOwner, -1);
        newOwnerItem = loadOrCreateItem(tokenId, oldOwner, -1);
      } else {
        const contract = AavegotchiDiamond.bind(event.address);
        const _itemType = contract.getItemType(tokenId);

        oldOwnerItem = loadOrCreateItem(tokenId, oldOwner, _itemType.category);
        newOwnerItem = loadOrCreateItem(tokenId, oldOwner, _itemType.category);
      }

      oldOwnerItem.equipped = oldOwnerItem.equipped - 1;
      newOwnerItem.equipped = newOwnerItem.equipped + 1;

      oldOwnerItem.save();
      newOwnerItem.save();
    }
  }
}
