import { Address, BigInt, log } from '@graphprotocol/graph-ts';
import {
  AavegotchiDiamond,
  AavegotchiDiamond__getItemTypeResultItemType_Struct,
  BuyPortals,
  ClaimAavegotchi,
  EquipWearables,
  GotchiLendingAdded,
  GotchiLendingCanceled,
  GotchiLendingEnded,
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
import { ERC1155Item } from '../../generated/schema';
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
  removeClaimedIdentity,
  isItemCreated,
  switchEquippedItems,
  getEquipedIds,
  removeGotchiId,
  addGotchiId,
  updateTransferBatch,
  updateTransferSingle
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
  PORTAL_STATUS_OPENED,
  PORTAL_VP
} from '../shared';

// PORTAL/GOTCHI HENDLERS
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

  buyer.portalsVP = buyer.portalsVP.minus(PORTAL_VP);
  owner.portalsVP = owner.portalsVP.plus(PORTAL_VP);

  for (let i = 0; i < event.params._numAavegotchisToPurchase.toI32(); i++) {
    const id = baseId.plus(BigInt.fromI32(i));
    const portal = loadOrCreatePortal(id);

    // Add portal hauntId
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

  const owner = loadOrCreatePlayer(Address.fromString(gotchi.owner as string));

  owner.portalsAmount = owner.portalsAmount - 1;
  owner.gotchisOwnedAmount = owner.gotchisOwnedAmount + 1;
  owner.gotchisOriginalOwnedAmount = owner.gotchisOriginalOwnedAmount + 1;
  owner.portalsVP = owner.portalsVP.minus(PORTAL_VP);
  owner.gotchisVP = owner.gotchisVP.plus(gotchi.baseRarityScore);

  owner.save();

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
  let gotchi = loadOrCreateGotchi(event.params._tokenId, false);

  if (gotchi) {
    const contract = AavegotchiDiamond.bind(event.address);
    const _availableSkillPoints = contract.try_availableSkillPoints(event.params._tokenId);
    // const _baseRarityScore = contract.try_baseRarityScore(gotchi.numericTraits);

    if (!_availableSkillPoints.reverted) {
      gotchi.availableSkillPoints = _availableSkillPoints.value;
    }

    // if (!_baseRarityScore.reverted) {
    //   const player = loadOrCreatePlayer(Address.fromString(gotchi.originalOwner as string));
    //   const rarityDifference = _baseRarityScore.value.minus(gotchi.baseRarityScore);

    //   player.gotchisVP = player.gotchisVP.plus(rarityDifference);
    //   player.save();
    // }

    gotchi.save();
  } else {
    log.warning('GOTCHI IS {}', ['NULL']);
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
    const isSucrefied = event.params._to == Address.zero();

    if (isSucrefied) {
      const identity = removeClaimedIdentity(gotchi.id);

      if (identity) {
        identity.save();
      }
    }

    if (!gotchi.modifiedRarityScore) {
      gotchi = updateGotchiInfo(gotchi, event.params._tokenId, event);
    }

    if (!gotchi.lending) {
      const itemsIds = getEquipedIds(gotchi.equippedWearables);
      const itemsAmount = itemsIds.length;

      if (itemsAmount > 0) {
        const vp = switchEquippedItems(
          itemsIds,
          BigInt.fromString(gotchi.id).toI32(),
          event.params._from,
          event.params._to,
          event
        );

        oldOwner.itemsAmount = oldOwner.itemsAmount - itemsAmount;
        newOwner.itemsAmount = newOwner.itemsAmount + itemsAmount;

        oldOwner.itemsVP = oldOwner.itemsVP.minus(vp);
        newOwner.itemsVP = newOwner.itemsVP.plus(vp);
      }

      gotchi.originalOwner = newOwner.id;

      oldOwner.gotchisOriginalOwnedAmount = oldOwner.gotchisOriginalOwnedAmount - 1;
      newOwner.gotchisOriginalOwnedAmount = newOwner.gotchisOriginalOwnedAmount + 1;

      oldOwner.gotchisVP = oldOwner.gotchisVP.minus(gotchi.baseRarityScore);
      newOwner.gotchisVP = newOwner.gotchisVP.plus(gotchi.baseRarityScore);
    }

    oldOwner.gotchisOwnedAmount = oldOwner.gotchisOwnedAmount - 1;
    newOwner.gotchisOwnedAmount = newOwner.gotchisOwnedAmount + 1;

    gotchi.owner = newOwner.id;
    gotchi.save();
  } else {
    portal.owner = newOwner.id;
    portal.save();

    oldOwner.portalsAmount = oldOwner.portalsAmount - 1;
    oldOwner.portalsVP = oldOwner.portalsVP.minus(PORTAL_VP);
    newOwner.portalsAmount = newOwner.portalsAmount + 1;
    newOwner.portalsVP = newOwner.portalsVP.plus(PORTAL_VP);
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
  updateTransferSingle(event.params._from, event.params._to, event.params._id, event.params._value);
}

export function handleTransferBatch(event: TransferBatch): void {
  updateTransferBatch(event.params._from, event.params._to, event.params._ids, event.params._values);
}

export function handleTransferFromParent(event: TransferFromParent): void {
  const gotchi = loadOrCreateGotchi(event.params._fromTokenId);
  let _itemType: AavegotchiDiamond__getItemTypeResultItemType_Struct | null = null;

  if (gotchi != null && gotchi.originalOwner != null) {
    const ownerAddress = Address.fromString(gotchi.originalOwner as string);
    const owner = loadOrCreatePlayer(ownerAddress);
    const isCreated = isItemCreated(event.params._tokenTypeId, ownerAddress);
    let item: ERC1155Item | null = null;

    if (isCreated) {
      item = loadOrCreateItem(event.params._tokenTypeId, ownerAddress, -1);
    } else {
      const contract = AavegotchiDiamond.bind(event.address);
      _itemType = contract.getItemType(event.params._tokenTypeId);
      item = loadOrCreateItem(event.params._tokenTypeId, ownerAddress, _itemType.category);
    }

    const value = event.params._value.toI32();

    item.equipped = item.equipped - value;
    item.amount = item.amount + value;

    if (item.equipped == 0) {
      item.equippedGotchis = removeGotchiId(BigInt.fromString(gotchi.id).toI32(), item.equippedGotchis);
    }

    owner.save();
    item.save();
  }
}

export function handleTransferToParent(event: TransferToParent): void {
  const contract = AavegotchiDiamond.bind(event.address);
  const gotchi = loadOrCreateGotchi(event.params._toTokenId);

  if (gotchi != null) {
    const _itemType = contract.getItemType(event.params._tokenTypeId);

    if (_itemType.category === ERC1155ItemCategoty.Badge) {
      const badges = gotchi.badges;

      badges.push(event.params._tokenTypeId.toI32());

      gotchi.badges = badges;

      gotchi.save();
    } else {
      if (gotchi.originalOwner != null) {
        // const owner = loadOrCreatePlayer(Address.fromString(gotchi.originalOwner as string));
        const item = loadOrCreateItem(
          event.params._tokenTypeId,
          Address.fromString(gotchi.originalOwner as string),
          _itemType.category
        );

        const value = event.params._value.toI32();

        if (item.equipped == 0) {
          item.equippedGotchis = addGotchiId(BigInt.fromString(gotchi.id).toI32(), item.equippedGotchis);
        }

        item.equipped = item.equipped + value;
        item.save();
      }
    }
  }
}

export function handleEquipWearables(event: EquipWearables): void {
  let gotchi = loadOrCreateGotchi(event.params._tokenId)!;

  gotchi = updateGotchiInfo(gotchi, event.params._tokenId, event);

  gotchi.save();
}

// LENDING HENDLERS
export function handleGotchiLendingAdded(event: GotchiLendingAdded): void {
  const gotchi = updateGotchiLending(event.params.listingId, event.params.tokenId, event.params.lender, true);

  gotchi.save();
}

export function handleGotchiLendingExecuted(event: GotchiLendingExecuted): void {
  if (event.block.number.le(BLOCK_DISABLE_OLD_LENDING_EVENTS)) {
    return;
  }

  const gotchi = loadOrCreateGotchi(event.params.tokenId)!;

  const lender = addLetOutGotchi(event.params.lender, event.params.tokenId);
  // lender.gotchisOriginalOwnedAmount = lender.gotchisOriginalOwnedAmount + 1;
  lender.gotchisVP = lender.gotchisVP.plus(gotchi.baseRarityScore);
  lender.save();

  const borrower = addBorrowedGotchi(event.params.borrower, event.params.tokenId);
  // borrower.gotchisOriginalOwnedAmount = borrower.gotchisOriginalOwnedAmount - 1;
  borrower.gotchisVP = borrower.gotchisVP.minus(gotchi.baseRarityScore);
  borrower.save();

  // update originalOwner to lender
  gotchi.originalOwner = lender.id;
  gotchi.lending = event.params.listingId;
  gotchi.save();
}

export function handleGotchiLendingCanceled(event: GotchiLendingCanceled): void {
  const gotchi = updateGotchiLending(event.params.listingId, event.params.tokenId, event.params.lender, false);

  gotchi.save();
}

export function handleGotchiLendingEnded(event: GotchiLendingEnded): void {
  if (event.block.number.le(BLOCK_DISABLE_OLD_LENDING_EVENTS)) {
    return;
  }

  let gotchi = loadOrCreateGotchi(event.params.tokenId)!;

  const lender = removeLentOutGotchi(event.params.lender, event.params.tokenId);
  // lender.gotchisOriginalOwnedAmount = lender.gotchisOriginalOwnedAmount - 1;
  lender.gotchisVP = lender.gotchisVP.minus(gotchi.baseRarityScore);
  lender.save();

  const borrower = removeBorrowedGotchi(event.params.borrower, event.params.tokenId);
  // borrower.gotchisOriginalOwnedAmount = borrower.gotchisOriginalOwnedAmount + 1;
  borrower.gotchisVP = borrower.gotchisVP.plus(gotchi.baseRarityScore);
  borrower.save();

  gotchi.lending = null;
  gotchi.originalOwner = lender.id;
  gotchi.save();
}
