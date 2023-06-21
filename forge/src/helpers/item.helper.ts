import { Address, BigInt, log } from '@graphprotocol/graph-ts';
import { ForgeItem } from '../../generated/schema';
import {
  ALLOY_CATEGORY,
  CORE_CATEGORY,
  ESSENCE_CATEGORY,
  GEODE_CATEGORY,
  SCHEMATIC_CATEGORY,
  WEARABLE_GAP_OFFSET
} from '../constants';
import { ForgeTypes } from '../enums';
import { loadOrCreatePlayer } from './player.helper';

// @ts-ignore
export function loadOrCreateItem(id: i32, category: i32, owner: Address): ForgeItem {
  const shortId = category == ForgeTypes.Schematic ? id : id - WEARABLE_GAP_OFFSET;
  const categoryName = getCategoryName(category);
  const itemId = `${shortId}-${categoryName}-${owner.toHexString()}`;

  let item = ForgeItem.load(itemId);

  if (!item) {
    item = new ForgeItem(itemId);
    item.amount = BigInt.zero();
    item.category = 'unknown';
    item.tokenId = shortId;
  }

  return item;
}

// @ts-ignore
export function updateAlloyTransfer(id: i32, amount: BigInt, from: Address, to: Address): void {
  const category = getCategoryName(ForgeTypes.Alloy);

  const oldOwner = loadOrCreatePlayer(from);
  oldOwner.alloyAmount = oldOwner.alloyAmount.minus(amount);
  oldOwner.save();

  const newOwner = loadOrCreatePlayer(to);
  newOwner.alloyAmount = newOwner.alloyAmount.plus(amount);
  newOwner.save();

  const itemFrom = loadOrCreateItem(id, ForgeTypes.Alloy, from);
  itemFrom.category = category;
  itemFrom.amount = itemFrom.amount.minus(amount);
  itemFrom.owner = from;
  itemFrom.save();

  const itemTo = loadOrCreateItem(id, ForgeTypes.Alloy, to);
  itemTo.category = category;
  itemTo.amount = itemTo.amount.plus(amount);
  itemTo.owner = to;
  itemTo.save();
}

// @ts-ignore
export function updateEssenceTransfer(id: i32, amount: BigInt, from: Address, to: Address): void {
  const category = getCategoryName(ForgeTypes.Essence);

  const oldOwner = loadOrCreatePlayer(from);
  oldOwner.essenceAmount = oldOwner.essenceAmount.minus(amount);
  oldOwner.save();

  const newOwner = loadOrCreatePlayer(to);
  newOwner.essenceAmount = newOwner.essenceAmount.plus(amount);
  newOwner.save();

  const itemFrom = loadOrCreateItem(id, ForgeTypes.Essence, from);
  itemFrom.category = category;
  itemFrom.amount = itemFrom.amount.minus(amount);
  itemFrom.owner = from;
  itemFrom.save();

  const itemTo = loadOrCreateItem(id, ForgeTypes.Essence, to);
  itemTo.category = category;
  itemTo.amount = itemTo.amount.plus(amount);
  itemTo.owner = to;
  itemTo.save();
}

// @ts-ignore
export function getCategoryName(id: i32): string {
  switch (id) {
    case ForgeTypes.Alloy:
      return ALLOY_CATEGORY;
    case ForgeTypes.Core:
      return CORE_CATEGORY;
    case ForgeTypes.Essence:
      return ESSENCE_CATEGORY;
    case ForgeTypes.Geode:
      return GEODE_CATEGORY;
    case ForgeTypes.Schematic:
      return SCHEMATIC_CATEGORY;
    default:
      return 'unknown';
  }
}
