import { Address, BigInt, log } from '@graphprotocol/graph-ts';
import { ForgeTypes } from '../enums';
import { getCategoryName, loadOrCreateItem } from './item.helper';
import { loadOrCreatePlayer } from './player.helper';
import {
  COMMON_RARITY,
  GEODE_COMMON,
  GEODE_GODLIKE,
  GEODE_INDEX_END,
  GEODE_INDEX_START,
  GEODE_LEGENDARY,
  GEODE_MYTHICAL,
  GEODE_RARE,
  GEODE_UNCOMMON,
  GODLIKE_RARITY,
  LEGENDARY_RARITY,
  MYTHICAL_RARITY,
  RARE_RARITY,
  UNCOMMON_RARITY
} from '../constants';

// @ts-ignore
export function updateGeodeTransfer(id: i32, amount: BigInt, from: Address, to: Address): void {
  const category = getCategoryName(ForgeTypes.Geode);
  const rarity = getGeodeRarity(id);

  setOwnersGeodeAmount(from, to, rarity, amount);

  const itemFrom = loadOrCreateItem(id, ForgeTypes.Geode, from);
  itemFrom.category = category;
  itemFrom.rarity = rarity;
  itemFrom.amount = itemFrom.amount.minus(amount);
  itemFrom.owner = from;
  itemFrom.save();

  const itemTo = loadOrCreateItem(id, ForgeTypes.Geode, to);
  itemTo.category = category;
  itemTo.rarity = rarity;
  itemTo.amount = itemTo.amount.plus(amount);
  itemTo.owner = to;
  itemTo.save();

  log.error(
    `
    id: {},
    category: {},
    rarity: {},
    amount: {}
  `,
    [id.toString(), category.toString(), rarity ? rarity : 'null', amount.toString()]
  );
}

// @ts-ignore
function getGeodeRarity(id: i32): string {
  if (id == GEODE_COMMON) {
    return COMMON_RARITY;
  } else if (id == GEODE_UNCOMMON) {
    return UNCOMMON_RARITY;
  } else if (id == GEODE_RARE) {
    return RARE_RARITY;
  } else if (id == GEODE_LEGENDARY) {
    return LEGENDARY_RARITY;
  } else if (id == GEODE_MYTHICAL) {
    return MYTHICAL_RARITY;
  } else if (id == GEODE_GODLIKE) {
    return GODLIKE_RARITY;
  } else {
    return 'unknown';
  }
}

function setOwnersGeodeAmount(from: Address, to: Address, rarity: string, amount: BigInt): void {
  const oldOwner = loadOrCreatePlayer(from);
  const newOwner = loadOrCreatePlayer(to);

  if (rarity == COMMON_RARITY) {
    oldOwner.commonGeodeAmount = oldOwner.commonGeodeAmount.minus(amount);
    newOwner.commonGeodeAmount = newOwner.commonGeodeAmount.plus(amount);
  } else if (rarity == UNCOMMON_RARITY) {
    oldOwner.uncommonGeodeAmount = oldOwner.uncommonGeodeAmount.minus(amount);
    newOwner.uncommonGeodeAmount = newOwner.uncommonGeodeAmount.plus(amount);
  } else if (rarity == RARE_RARITY) {
    oldOwner.rareGeodeAmount = oldOwner.rareGeodeAmount.minus(amount);
    newOwner.rareGeodeAmount = newOwner.rareGeodeAmount.plus(amount);
  } else if (rarity == LEGENDARY_RARITY) {
    oldOwner.legendaryGeodeAmount = oldOwner.legendaryGeodeAmount.minus(amount);
    newOwner.legendaryGeodeAmount = newOwner.legendaryGeodeAmount.plus(amount);
  } else if (rarity == MYTHICAL_RARITY) {
    oldOwner.mythicalGeodeAmount = oldOwner.mythicalGeodeAmount.minus(amount);
    newOwner.mythicalGeodeAmount = newOwner.mythicalGeodeAmount.plus(amount);
  } else if (rarity == GODLIKE_RARITY) {
    oldOwner.godlikeGeodeAmount = oldOwner.godlikeGeodeAmount.minus(amount);
    newOwner.godlikeGeodeAmount = newOwner.godlikeGeodeAmount.plus(amount);
  }

  oldOwner.save();
  newOwner.save();
}

// @ts-ignore
export function isGeode(id: i32): boolean {
  let isGeode = false;

  for (let index = GEODE_INDEX_START; index <= GEODE_INDEX_END; ++index) {
    if (id == index) {
      isGeode = true;
    }
  }

  return isGeode;
}
