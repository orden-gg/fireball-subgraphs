import { Address, BigInt, log } from '@graphprotocol/graph-ts';
import {
  AavegotchiDiamond,
  BuyPortals,
  ClaimAavegotchi,
  GotchiLendingAdd,
  GotchiLendingAdded,
  GotchiLendingCancel,
  GotchiLendingCanceled,
  GotchiLendingEnd,
  GotchiLendingEnded,
  GotchiLendingExecute,
  GotchiLendingExecuted,
  MintPortals,
  PortalOpened,
  SpendSkillpoints,
  Transfer,
  TransferBatch,
  TransferFromParent,
  TransferSingle,
  TransferToParent,
  Xingyun
} from '../../generated/AavegotchiDiamond/AavegotchiDiamond';
import {
  loadOrCreatePlayer,
  loadOrCreateItem,
  loadOrCreateGotchi,
  loadOrCreateGotchiOption,
  updateGotchiInfo,
  loadOrCreatePortal,
  updateIdentityByGotchi,
  updateIdentityByOptions,
  removeUnclaimedIdentity,
  removeClaimedIdentity
} from '../helpers';
import {
  addBorrowedGotchi,
  addLetOutGotchi,
  removeBorrowedGotchi,
  removeLentOutGotchi,
  updateGotchiLending
} from '../helpers/lending.helper';
import {
  BIGINT_ONE,
  BLOCK_DISABLE_OLD_LENDING_EVENTS,
  ERC1155ItemCategoty,
  PORTAL_STATUS_BOUGHT,
  PORTAL_STATUS_CLAIMED,
  PORTAL_STATUS_OPENED
} from '../shared';

// HENDLE PORTALS
export function handleMintPortals(event: MintPortals): void {
  const buyer = loadOrCreatePlayer(event.params._from);
  const owner = loadOrCreatePlayer(event.params._to);
  let baseId = event.params._tokenId;

  for (let i = 0; i < event.params._numAavegotchisToPurchase.toI32(); i++) {
    const portal = loadOrCreatePortal(baseId);

    portal.hauntId = event.params._hauntId;
    portal.status = PORTAL_STATUS_BOUGHT;
    portal.gotchiId = baseId;
    portal.owner = owner.id;
    portal.buyer = buyer.id;

    portal.save();

    baseId = baseId.plus(BIGINT_ONE);
  }

  buyer.save();
  owner.save();
}

export function handleBuyPortals(event: BuyPortals): void {
  const contract = AavegotchiDiamond.bind(event.address);
  const buyer = loadOrCreatePlayer(event.params._from);
  const owner = loadOrCreatePlayer(event.params._to);

  const baseId = event.params._tokenId;

  buyer.portalsAmount = buyer.portalsAmount - 1;
  owner.portalsAmount = owner.portalsAmount + 1;

  for (let i = 0; i < event.params._numAavegotchisToPurchase.toI32(); i++) {
    const id = baseId.plus(BigInt.fromI32(i));
    const portal = loadOrCreatePortal(id);

    //Add portal hauntId
    const portalResponse = contract.try_getAavegotchi(id);
    if (!portalResponse.reverted) {
      portal.hauntId = portalResponse.value.hauntId;
    }

    portal.status = PORTAL_STATUS_BOUGHT;
    portal.gotchiId = event.params._tokenId;
    portal.owner = owner.id;
    portal.buyer = buyer.id;

    portal.save();
  }

  buyer.save();
  owner.save();
}

export function handlePortalOpened(event: PortalOpened): void {
  const contract = AavegotchiDiamond.bind(event.address);
  const portal = loadOrCreatePortal(event.params.tokenId);

  const _traitsResponse = contract.try_portalAavegotchiTraits(event.params.tokenId);

  if (!_traitsResponse.reverted) {
    const array = _traitsResponse.value;

    for (let i = 0; i < array.length; i++) {
      const possibleAavegotchiTraits = array[i];
      const gotchi = loadOrCreateGotchiOption(portal.id, i);

      gotchi.portal = portal.id;
      gotchi.owner = portal.owner;
      gotchi.randomNumber = possibleAavegotchiTraits.randomNumber;
      gotchi.numericTraits = possibleAavegotchiTraits.numericTraits;
      gotchi.collateralType = possibleAavegotchiTraits.collateralType;
      gotchi.gotchiId = BigInt.fromString(portal.id);
      gotchi.hauntId = portal.hauntId.toI32();

      const identity = updateIdentityByOptions(gotchi);

      gotchi.identity = identity.id;

      identity.save();
      gotchi.save();
    }
  }

  portal.status = PORTAL_STATUS_OPENED;
  portal.save();
}

export function handleClaimAavegotchi(event: ClaimAavegotchi): void {
  const portal = loadOrCreatePortal(event.params._tokenId);
  let gotchi = loadOrCreateGotchi(event.params._tokenId)!;
  gotchi = updateGotchiInfo(gotchi, event.params._tokenId, event);
  gotchi.gotchiId = event.params._tokenId;

  if (gotchi.originalOwner != null) {
    const owner = loadOrCreatePlayer(Address.fromString(gotchi.originalOwner as string));

    owner.portalsAmount = owner.portalsAmount - 1;
    owner.gotchisAmount = owner.gotchisAmount + 1;

    owner.save();
  }

  portal.gotchi = gotchi.id;
  const zeroUser = loadOrCreatePlayer(Address.zero());
  portal.owner = zeroUser.id;
  portal.status = PORTAL_STATUS_CLAIMED;

  const identity = updateIdentityByGotchi(gotchi);
  identity.save();

  gotchi.identity = identity.id;

  for (let i = 0; i < 10; i++) {
    const unclaimedIdentity = removeUnclaimedIdentity(portal.id, i);

    unclaimedIdentity.save();
  }

  portal.status = PORTAL_STATUS_OPENED;
  portal.save();

  gotchi.save();
  zeroUser.save();
}

export function handleSpendSkillpoints(event: SpendSkillpoints): void {
  const contract = AavegotchiDiamond.bind(event.address);
  let gotchi = loadOrCreateGotchi(event.params._tokenId, false)!;

  if (gotchi) {
    const _response = contract.try_availableSkillPoints(event.params._tokenId);

    if (!_response.reverted) {
      gotchi.availableSkillPoints = _response.value;

      gotchi.save();
    }
  } else {
  }
}

export function handleTransfer(event: Transfer): void {
  const id = event.params._tokenId;
  const oldOwner = loadOrCreatePlayer(event.params._from);
  const newOwner = loadOrCreatePlayer(event.params._to);
  const portal = loadOrCreatePortal(id, false);
  let gotchi = loadOrCreateGotchi(id, false);

  // ERC721 transfer can be portal or gotchi based, so we have to check it.
  if (gotchi != null) {
    const isSucrefied = event.params._to === Address.zero();

    if (isSucrefied) {
      log.warning('Sucrefied gotchi {}', [gotchi.id]);
      const identity = removeClaimedIdentity(gotchi.id, event);

      if (identity) {
        identity.save();
      }
    }
    if (!gotchi.modifiedRarityScore) {
      gotchi = updateGotchiInfo(gotchi, event.params._tokenId, event);
    }
    gotchi.owner = newOwner.id;
    gotchi.save();

    oldOwner.gotchisAmount = oldOwner.gotchisAmount - 1;
    newOwner.gotchisAmount = newOwner.gotchisAmount + 1;
  } else {
    portal.owner = newOwner.id;
    portal.save();

    oldOwner.portalsAmount = oldOwner.portalsAmount - 1;
    newOwner.portalsAmount = newOwner.portalsAmount + 1;
  }

  oldOwner.save();
  newOwner.save();
}

export function handleXingyun(event: Xingyun): void {
  const buyer = loadOrCreatePlayer(event.params._from);
  const owner = loadOrCreatePlayer(event.params._to);

  let baseId = event.params._tokenId;

  for (let i = 0; i < event.params._numAavegotchisToPurchase.toI32(); i++) {
    const portal = loadOrCreatePortal(baseId);

    portal.hauntId = BIGINT_ONE;
    portal.status = PORTAL_STATUS_BOUGHT;
    portal.gotchiId = baseId;
    portal.owner = owner.id;
    portal.buyer = buyer.id;

    portal.save();

    baseId = baseId.plus(BIGINT_ONE);
  }

  buyer.save();
  owner.save();
}

// ITEM HENDLERS
export function handleTransferSingle(event: TransferSingle): void {
  const contract = AavegotchiDiamond.bind(event.address);
  const _itemType = contract.getItemType(event.params._id);

  const oldOwner = loadOrCreatePlayer(event.params._from);
  const newOwner = loadOrCreatePlayer(event.params._to);

  oldOwner.itemsAmount = oldOwner.itemsAmount - 1;
  newOwner.itemsAmount = newOwner.itemsAmount + 1;

  if (_itemType.category == ERC1155ItemCategoty.Badge) {
    log.warning('BADGE {}', [event.params._id.toString()]);
  } else {
    const wearableFrom = loadOrCreateItem(event.params._id, event.params._from, _itemType);
    const wearableTo = loadOrCreateItem(event.params._id, event.params._to, _itemType);

    const amount = event.params._value.toI32();

    wearableFrom.amount = wearableFrom.amount - amount;
    wearableTo.amount = wearableTo.amount + amount;

    wearableFrom.save();
    wearableTo.save();
  }

  oldOwner.save();
  newOwner.save();
}

export function handleTransferBatch(event: TransferBatch): void {
  const contract = AavegotchiDiamond.bind(event.address);
  const oldOwner = loadOrCreatePlayer(event.params._from);
  const newOwner = loadOrCreatePlayer(event.params._to);
  let transferedAmount = 0;

  for (let i = 0; i < event.params._ids.length; i++) {
    const _itemType = contract.getItemType(event.params._ids[i]);

    if (_itemType.category == ERC1155ItemCategoty.Badge) {
      log.warning('BADGE {}', [event.params._ids[i].toString()]);
    } else {
      const wearableFrom = loadOrCreateItem(event.params._ids[i], event.params._from, _itemType);
      const wearableTo = loadOrCreateItem(event.params._ids[i], event.params._to, _itemType);
      const amount = event.params._values[i].toI32();

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

export function handleTransferFromParent(event: TransferFromParent): void {
  const contract = AavegotchiDiamond.bind(event.address);
  const gotchi = loadOrCreateGotchi(event.params._fromTokenId);
  const _itemType = contract.getItemType(event.params._tokenTypeId);

  if (gotchi != null && gotchi.originalOwner != null) {
    const ownerAddress = Address.fromString(gotchi.originalOwner as string);
    const owner = loadOrCreatePlayer(ownerAddress);
    const item = loadOrCreateItem(event.params._tokenTypeId, ownerAddress, _itemType);

    item.equipped = item.equipped - event.params._value.toI32();

    owner.itemsAmount = owner.itemsAmount + 1;

    owner.save();
    item.save();
  }
}

export function handleTransferToParent(event: TransferToParent): void {
  const contract = AavegotchiDiamond.bind(event.address);
  const gotchi = loadOrCreateGotchi(event.params._toTokenId);
  const _itemType = contract.getItemType(event.params._tokenTypeId);

  if (gotchi != null) {
    if (_itemType.category === ERC1155ItemCategoty.Badge) {
      const badges = gotchi.badges;

      badges.push(event.params._tokenTypeId.toI32());

      gotchi.badges = badges;

      gotchi.save();

      log.warning('EQUIP BADGE {}, GOTCHI {}', [
        event.params._tokenTypeId.toString(),
        event.params._toTokenId.toString()
      ]);
    } else if (gotchi.originalOwner != null) {
      const owner = loadOrCreatePlayer(Address.fromString(gotchi.originalOwner as string));
      const item = loadOrCreateItem(
        event.params._tokenTypeId,
        Address.fromString(gotchi.originalOwner as string),
        _itemType
      );

      item.equipped = item.equipped + event.params._value.toI32();

      owner.itemsAmount = owner.itemsAmount + 1;

      item.save();
    }

    log.warning('FROM PARENT id {}, category {}', [
      event.params._tokenTypeId.toString(),
      _itemType.category.toString()
    ]);
  }
}

export function handleGotchiLendingAdded(event: GotchiLendingAdded): void {
  const gotchi = updateGotchiLending(event.params.listingId, event.params.tokenId, event.params.lender, true, event);

  gotchi.save();
}

export function handleGotchiLendingExecuted(event: GotchiLendingExecuted): void {
  if (event.block.number.le(BLOCK_DISABLE_OLD_LENDING_EVENTS)) {
    return;
  }

  const lender = addLetOutGotchi(event.params.lender, event.params.tokenId);
  lender.save();

  const borrower = addBorrowedGotchi(event.params.borrower, event.params.tokenId);
  borrower.save();

  // update originalOwner to lender
  const gotchi = loadOrCreateGotchi(event.params.tokenId)!;
  gotchi.originalOwner = lender.id;
  gotchi.save();
}

export function handleGotchiLendingCanceled(event: GotchiLendingCanceled): void {
  const gotchi = updateGotchiLending(event.params.listingId, event.params.tokenId, event.params.lender, false, event);

  gotchi.save();
}

export function handleGotchiLendingEnded(event: GotchiLendingEnded): void {
  if (event.block.number.le(BLOCK_DISABLE_OLD_LENDING_EVENTS)) {
    return;
  }

  const lender = removeLentOutGotchi(event.params.lender, event.params.tokenId);
  lender.save();

  const borrower = removeBorrowedGotchi(event.params.borrower, event.params.tokenId);
  borrower.save();

  let gotchi = loadOrCreateGotchi(event.params.tokenId)!;
  gotchi.lending = null;
  gotchi.originalOwner = lender.id;
  gotchi.save();
}
