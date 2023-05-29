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
  UNCOMMON_RARITY
} from '../constants';
import { MainDiamond } from '../../generated/ForgeDiamond/MainDiamond';

// @ts-ignore
export function updateSchematicTransfer(id: i32, amount: BigInt, from: Address, to: Address): void {
  const category = getCategoryName(ForgeTypes.Schematic);
  const rarity = getSchematicRarity(id);

  setOwnersSchematicAmount(from, to, rarity, amount);

  const itemFrom = loadOrCreateItem(id, ForgeTypes.Schematic, from);
  itemFrom.category = category;
  itemFrom.amount = itemFrom.amount.minus(amount);
  itemFrom.owner = from;
  itemFrom.save();

  const itemTo = loadOrCreateItem(id, ForgeTypes.Schematic, to);
  itemTo.category = category;
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
    [id.toString(), category.toString(), rarity, amount.toString()]
  );
}

// @ts-ignore
function getSchematicRarity(id: i32): string {
  const contract = MainDiamond.bind(MAIN_CONTRACT);
  const _response = contract.try_getItemType(BigInt.fromI32(id));
  let result = '';

  if (!_response.reverted) {
    const _itemType = _response.value;

    if (_itemType.rarityScoreModifier == COMMON_SCORE) {
      result = COMMON_RARITY;
    } else if (_itemType.rarityScoreModifier == UNCOMMON_SCORE) {
      result = UNCOMMON_RARITY;
    } else if (_itemType.rarityScoreModifier == RARE_SCORE) {
      result = RARE_RARITY;
    } else if (_itemType.rarityScoreModifier == LEGENDARY_SCORE) {
      result = LEGENDARY_RARITY;
    } else if (_itemType.rarityScoreModifier == MYTHICAL_SCORE) {
      result = MYTHICAL_RARITY;
    } else if (_itemType.rarityScoreModifier == GODLIKE_SCORE) {
      result = GODLIKE_RARITY;
    } else {
      result = 'unknown';
    }
  } else {
    result = 'unknown';
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
