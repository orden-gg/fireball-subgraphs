import { Address, BigInt, log } from '@graphprotocol/graph-ts';
import { ForgeTypes } from '../enums';
import { getCategoryName, loadOrCreateItem } from './item.helper';
import { loadOrCreatePlayer } from './player.helper';
import {
  COMMON_SCORE,
  COMMON_RARITY,
  GODLIKE_SCORE,
  GODLIKE_RARITY,
  LEGENDARY_SCORE,
  LEGENDARY_RARITY,
  MAIN_CONTRACT,
  MYTHICAL_SCORE,
  MYTHICAL_RARITY,
  RARE_SCORE,
  RARE_RARITY,
  UNCOMMON_SCORE,
  UNCOMMON_RARITY,
  WEARABLE_SLOTS
} from '../constants';
import { MainDiamond } from '../../generated/ForgeDiamond/MainDiamond';

// @ts-ignore
export function updateSchematicTransfer(id: i32, amount: BigInt, from: Address, to: Address): void {
  const category = getCategoryName(ForgeTypes.Schematic);
  const contract = MainDiamond.bind(MAIN_CONTRACT);
  const _response = contract.try_getItemType(BigInt.fromI32(id));

  let rarity: string | null = null;
  let slot: string | null = null;

  // log.error('SCHEMATIC ITEM ID: {}', [id.toString()]);

  if (!_response.reverted) {
    const _itemType = _response.value;

    rarity = getSchematicRarity(_itemType.rarityScoreModifier);

    slot = getSchematicSlots(_itemType.slotPositions);

    if (!slot) {
      log.error('slot positons: [{},{},{},{},{},{},{},{},{},{},{},{}]', [
        _itemType.slotPositions[0] ? 'true' : 'false',
        _itemType.slotPositions[1] ? 'true' : 'false',
        _itemType.slotPositions[2] ? 'true' : 'false',
        _itemType.slotPositions[3] ? 'true' : 'false',
        _itemType.slotPositions[4] ? 'true' : 'false',
        _itemType.slotPositions[5] ? 'true' : 'false',
        _itemType.slotPositions[6] ? 'true' : 'false',
        _itemType.slotPositions[7] ? 'true' : 'false',
        _itemType.slotPositions[8] ? 'true' : 'false',
        _itemType.slotPositions[9] ? 'true' : 'false',
        _itemType.slotPositions[10] ? 'true' : 'false',
        _itemType.slotPositions[11] ? 'true' : 'false'
      ]);
    }

    setOwnersSchematicAmount(from, to, rarity, amount);

    const itemFrom = loadOrCreateItem(id, ForgeTypes.Schematic, from);
    itemFrom.category = category;
    itemFrom.amount = itemFrom.amount.minus(amount);
    itemFrom.owner = from;
    itemFrom.rarity = rarity;
    itemFrom.slot = slot;
    itemFrom.save();

    const itemTo = loadOrCreateItem(id, ForgeTypes.Schematic, to);
    itemTo.category = category;
    itemTo.amount = itemTo.amount.plus(amount);
    itemTo.owner = to;
    itemTo.rarity = rarity;
    itemFrom.slot = slot;
    itemTo.save();
  } else {
    log.error('response reverted! ID:{}', [id.toString()]);
  }
}

// @ts-ignore
function getSchematicRarity(rarityScoreModifier: i32): string {
  if (rarityScoreModifier == COMMON_SCORE) {
    return COMMON_RARITY;
  } else if (rarityScoreModifier == UNCOMMON_SCORE) {
    return UNCOMMON_RARITY;
  } else if (rarityScoreModifier == RARE_SCORE) {
    return RARE_RARITY;
  } else if (rarityScoreModifier == LEGENDARY_SCORE) {
    return LEGENDARY_RARITY;
  } else if (rarityScoreModifier == MYTHICAL_SCORE) {
    return MYTHICAL_RARITY;
  } else if (rarityScoreModifier == GODLIKE_SCORE) {
    return GODLIKE_RARITY;
  } else {
    return 'unknown';
  }
}

// @ts-ignore
function getSchematicSlots(rarityScoreModifier: boolean[]): string {
  let result = '';

  for (let index = 0; index < WEARABLE_SLOTS.length; ++index) {
    if (rarityScoreModifier[index]) {
      result = result.length > 0 ? result + ', ' + WEARABLE_SLOTS[index] : WEARABLE_SLOTS[index];
    }
  }

  return result;
}

function setOwnersSchematicAmount(from: Address, to: Address, rarity: string, amount: BigInt): void {
  const oldOwner = loadOrCreatePlayer(from);
  const newOwner = loadOrCreatePlayer(to);

  if (rarity == COMMON_RARITY) {
    oldOwner.commonSchematicAmount = oldOwner.commonSchematicAmount.minus(amount);
    newOwner.commonSchematicAmount = newOwner.commonSchematicAmount.plus(amount);
  } else if (rarity == UNCOMMON_RARITY) {
    oldOwner.uncommonSchematicAmount = oldOwner.uncommonSchematicAmount.minus(amount);
    newOwner.uncommonSchematicAmount = newOwner.uncommonSchematicAmount.plus(amount);
  } else if (rarity == RARE_RARITY) {
    oldOwner.rareSchematicAmount = oldOwner.rareSchematicAmount.minus(amount);
    newOwner.rareSchematicAmount = newOwner.rareSchematicAmount.plus(amount);
  } else if (rarity == LEGENDARY_RARITY) {
    oldOwner.legendarySchematicAmount = oldOwner.legendarySchematicAmount.minus(amount);
    newOwner.legendarySchematicAmount = newOwner.legendarySchematicAmount.plus(amount);
  } else if (rarity == MYTHICAL_RARITY) {
    oldOwner.mythicalSchematicAmount = oldOwner.mythicalSchematicAmount.minus(amount);
    newOwner.mythicalSchematicAmount = newOwner.mythicalSchematicAmount.plus(amount);
  } else if (rarity == GODLIKE_RARITY) {
    oldOwner.godlikeSchematicAmount = oldOwner.godlikeSchematicAmount.minus(amount);
    newOwner.godlikeSchematicAmount = newOwner.godlikeSchematicAmount.plus(amount);
  }

  oldOwner.save();
  newOwner.save();
}
