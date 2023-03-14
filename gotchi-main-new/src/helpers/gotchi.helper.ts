import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { AavegotchiDiamond } from '../../generated/AavegotchiDiamond/AavegotchiDiamond';
import { AavegotchiOption, Gotchi } from '../../generated/schema';
import { STATUS_AAVEGOTCHI } from '../shared/constants/common.constants';
import { loadOrCreatePlayer } from './player.helper';

export const loadOrCreateGotchi = (
  id: BigInt,
  event: ethereum.Event,
  createIfNotFound: boolean = true
): Gotchi | null => {
  let gotchi = Gotchi.load(id.toString());

  if (gotchi == null && createIfNotFound) {
    gotchi = new Gotchi(id.toString());
    gotchi.gotchiId = id;
    gotchi.badges = [];
    gotchi.originalOwner = Address.zero().toHexString();
    gotchi.availableSkillPoints = BigInt.zero();
    gotchi.usedSkillPoints = BigInt.zero();
  } else if (gotchi == null && !createIfNotFound) {
    return null;
  }

  return gotchi as Gotchi;
};

export function loadOrCreateGotchiOption(
  portalId: string,
  // @ts-ignore
  i: i32,
  createIfNotFound: boolean = true
): AavegotchiOption {
  const id = portalId.concat('-').concat(BigInt.fromI32(i).toString());
  let option = AavegotchiOption.load(id);

  if (option == null && createIfNotFound) {
    option = new AavegotchiOption(id);
    option.portalOptionId = i;
  }

  return option as AavegotchiOption;
}

export function updateGotchiInfo(gotchi: Gotchi, id: BigInt, event: ethereum.Event): Gotchi {
  const _contract = AavegotchiDiamond.bind(event.address);
  const _response = _contract.try_getAavegotchi(id);

  if (!_response.reverted) {
    const gotchiInfo = _response.value;

    const owner = loadOrCreatePlayer(gotchiInfo.owner);
    owner.save();
    gotchi.owner = owner.id;
    if (!gotchi.originalOwner) {
      gotchi.originalOwner = owner.id;
    }

    gotchi.collateral = gotchiInfo.collateral;
    gotchi.hauntId = gotchiInfo.hauntId;
    gotchi.numericTraits = gotchiInfo.numericTraits;
  } else {
  }

  return gotchi as Gotchi;
}
