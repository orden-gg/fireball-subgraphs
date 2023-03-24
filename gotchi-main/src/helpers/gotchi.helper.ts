import { Address, BigInt, ethereum, log } from '@graphprotocol/graph-ts';
import { AavegotchiDiamond } from '../../generated/AavegotchiDiamond/AavegotchiDiamond';
import { AavegotchiOption, Gotchi } from '../../generated/schema';
import { loadOrCreatePlayer } from './player.helper';

export const loadOrCreateGotchi = (id: BigInt, createIfNotFound: boolean = true): Gotchi | null => {
  let gotchi = Gotchi.load(id.toString());

  if (gotchi == null && createIfNotFound) {
    gotchi = new Gotchi(id.toString());
    gotchi.gotchiId = id;
    gotchi.badges = [];
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
  const contract = AavegotchiDiamond.bind(event.address);
  const _response = contract.try_getAavegotchi(id);

  log.warning('handleClaimAavegotchi {}', [id.toString()]);

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
    gotchi.modifiedRarityScore = gotchiInfo.modifiedRarityScore;
  } else {
    log.warning("Aavegotchi {} couldn't be updated at block: {} tx_hash: {}", [
      id.toString(),
      event.block.number.toString(),
      event.transaction.hash.toHexString()
    ]);
  }

  return gotchi as Gotchi;
}
