import { BigInt, Address, ethereum, log } from '@graphprotocol/graph-ts';
import { Gotchi, Player } from '../../generated/schema';
import { loadOrCreateGotchi, updateGotchiInfo } from './gotchi.helper';
import { loadOrCreatePlayer } from './player.helper';

export function updateGotchiLending(
  listingId: BigInt,
  tokenId: BigInt,
  lenderAddress: Address,
  isSetLending: boolean
): Gotchi {
  let gotchi = loadOrCreateGotchi(tokenId)!;

  // if (!gotchi.modifiedRarityScore) {
  //   log.warning('modifiedRarityScore {}', ['not found']);
  //   gotchi = updateGotchiInfo(gotchi, tokenId, event);
  // }

  if (isSetLending) {
    gotchi.lending = listingId;
  } else {
    gotchi.lending = null;
  }

  // remove Hotfix for lending
  if (gotchi.originalOwner == null) {
    const lender = loadOrCreatePlayer(lenderAddress);
    lender.save();

    gotchi.originalOwner = lender.id;
  }

  return gotchi;
}

export function addLetOutGotchi(address: Address, tokenId: BigInt): Player {
  const lender = loadOrCreatePlayer(Address.fromBytes(address));
  const gotchisLentOut = lender.gotchisLentOut;
  gotchisLentOut.push(tokenId);
  lender.gotchisLentOut = gotchisLentOut;

  lender.gotchisLentOutAmount = gotchisLentOut.length;

  return lender;
}

export function removeLentOutGotchi(address: Address, tokenId: BigInt): Player {
  const lender = loadOrCreatePlayer(address);

  if (lender.gotchisLentOut.length > 0) {
    let newGotchiLentOut = new Array<BigInt>();

    for (let i = 0; i < lender.gotchisLentOut.length; i++) {
      let gotchiId = lender.gotchisLentOut[i];
      if (!gotchiId.equals(tokenId)) {
        newGotchiLentOut.push(gotchiId);
      }
    }
    lender.gotchisLentOut = newGotchiLentOut;
    lender.gotchisLentOutAmount = newGotchiLentOut.length;
  }

  return lender;
}

export function addBorrowedGotchi(address: Address, tokenId: BigInt): Player {
  const borrower = loadOrCreatePlayer(address);
  const gotchisBorrowed = borrower.gotchisBorrowed;
  gotchisBorrowed.push(tokenId);
  borrower.gotchisBorrowed = gotchisBorrowed;
  borrower.save();

  borrower.gotchisBorrowedAmount = gotchisBorrowed.length;

  return borrower;
}

export function removeBorrowedGotchi(address: Address, tokenId: BigInt): Player {
  const borrower = loadOrCreatePlayer(address);

  if (borrower.gotchisBorrowed.length > 0) {
    let newGotchisBorowed = new Array<BigInt>();

    for (let i = 0; i < borrower.gotchisBorrowed.length; i++) {
      let gotchiId = borrower.gotchisBorrowed[i];
      if (!gotchiId.equals(tokenId)) {
        newGotchisBorowed.push(gotchiId);
      }
    }
    borrower.gotchisBorrowed = newGotchisBorowed;

    borrower.gotchisBorrowedAmount = newGotchisBorowed.length;
  }

  return borrower;
}
