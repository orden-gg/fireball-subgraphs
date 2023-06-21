import { Address, BigInt } from '@graphprotocol/graph-ts';
import { ForgeTypes, RartyTypes, SlotTypes } from '../enums';
import { getCategoryName, loadOrCreateItem } from './item.helper';
import { loadOrCreatePlayer } from './player.helper';
import {
  BODY_SLOT,
  COMMON_RARITY,
  CORE_BODY_COMMON,
  CORE_INDEX_END,
  CORE_INDEX_START,
  EYES_SLOT,
  FACE_SLOT,
  GEODE_INDEX_END,
  GODLIKE_RARITY,
  HANDS_SLOT,
  HEAD_SLOT,
  LEGENDARY_RARITY,
  MYTHICAL_RARITY,
  PET_SLOT,
  RARE_RARITY,
  UNCOMMON_RARITY
} from '../constants';

// @ts-ignore
export function updateCoreTransfer(id: i32, amount: BigInt, from: Address, to: Address): void {
  const category = getCategoryName(ForgeTypes.Core);
  const rarity = getCoreRarity(id);
  const slot = getCoreSlot(id);

  setOwnersCoreAmount(from, to, rarity, amount);

  const itemFrom = loadOrCreateItem(id, ForgeTypes.Core, from);
  itemFrom.category = category;
  itemFrom.rarity = rarity;
  itemFrom.slot = slot;
  itemFrom.amount = itemFrom.amount.minus(amount);
  itemFrom.owner = from;
  itemFrom.save();

  const itemTo = loadOrCreateItem(id, ForgeTypes.Core, to);
  itemTo.category = category;
  itemTo.rarity = rarity;
  itemTo.slot = slot;
  itemTo.amount = itemTo.amount.plus(amount);
  itemTo.owner = to;
  itemTo.save();
}

// @ts-ignore
function getCoreRarity(id: i32): string {
  let rarityId = (id - CORE_BODY_COMMON) % 6;

  switch (rarityId) {
    case RartyTypes.Common:
      return COMMON_RARITY;
    case RartyTypes.Uncommon:
      return UNCOMMON_RARITY;
    case RartyTypes.Rare:
      return RARE_RARITY;
    case RartyTypes.Legendary:
      return LEGENDARY_RARITY;
    case RartyTypes.Mythical:
      return MYTHICAL_RARITY;
    case RartyTypes.Godlike:
      return GODLIKE_RARITY;
    default:
      return 'unknown';
  }
}

// @ts-ignore
export function getCoreSlot(id: i32): string {
  const slotId = Math.floor((id - GEODE_INDEX_END) / 6);

  // @ts-ignore
  switch (slotId as i32) {
    case SlotTypes.Body:
      return BODY_SLOT;
    case SlotTypes.Face:
      return FACE_SLOT;
    case SlotTypes.Eyes:
      return EYES_SLOT;
    case SlotTypes.Head:
      return HEAD_SLOT;
    case SlotTypes.Hands:
      return HANDS_SLOT;
    case SlotTypes.Pet:
      return PET_SLOT;
    default:
      return 'unknown';
  }
}

function setOwnersCoreAmount(from: Address, to: Address, rarity: string, amount: BigInt): void {
  const oldOwner = loadOrCreatePlayer(from);
  const newOwner = loadOrCreatePlayer(to);

  if (rarity == COMMON_RARITY) {
    oldOwner.commonCoreAmount = oldOwner.commonCoreAmount.minus(amount);
    newOwner.commonCoreAmount = newOwner.commonCoreAmount.plus(amount);
  } else if (rarity == UNCOMMON_RARITY) {
    oldOwner.uncommonCoreAmount = oldOwner.uncommonCoreAmount.minus(amount);
    newOwner.uncommonCoreAmount = newOwner.uncommonCoreAmount.plus(amount);
  } else if (rarity == RARE_RARITY) {
    oldOwner.rareCoreAmount = oldOwner.rareCoreAmount.minus(amount);
    newOwner.rareCoreAmount = newOwner.rareCoreAmount.plus(amount);
  } else if (rarity == LEGENDARY_RARITY) {
    oldOwner.legendaryCoreAmount = oldOwner.legendaryCoreAmount.minus(amount);
    newOwner.legendaryCoreAmount = newOwner.legendaryCoreAmount.plus(amount);
  } else if (rarity == MYTHICAL_RARITY) {
    oldOwner.mythicalCoreAmount = oldOwner.mythicalCoreAmount.minus(amount);
    newOwner.mythicalCoreAmount = newOwner.mythicalCoreAmount.plus(amount);
  } else if (rarity == GODLIKE_RARITY) {
    oldOwner.godlikeCoreAmount = oldOwner.godlikeCoreAmount.minus(amount);
    newOwner.godlikeCoreAmount = newOwner.godlikeCoreAmount.plus(amount);
  }

  oldOwner.save();
  newOwner.save();
}

// @ts-ignore
export function isCore(id: i32): boolean {
  let isCore = false;

  for (let index = CORE_INDEX_START; index <= CORE_INDEX_END; ++index) {
    if (id == index) {
      isCore = true;
    }
  }

  return isCore;
}
