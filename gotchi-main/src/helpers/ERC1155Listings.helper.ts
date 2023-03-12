import { Address, BigInt, ethereum, log } from '@graphprotocol/graph-ts';
import { AavegotchiDiamond, ERC1155ExecutedListing } from '../../generated/AavegotchiDiamond/AavegotchiDiamond';
import { ERC1155Listing, ERC1155Purchase } from '../../generated/schema';

export function loadOrCreateERC1155Listing(id: string, createIfNotFound: boolean = true): ERC1155Listing {
  let listing = ERC1155Listing.load(id);

  if (listing == null && createIfNotFound) {
    listing = new ERC1155Listing(id);
  }

  return listing as ERC1155Listing;
}

export function updateERC1155ListingInfo(
  listing: ERC1155Listing,
  listingID: BigInt,
  event: ethereum.Event
): ERC1155Listing {
  let contract = AavegotchiDiamond.bind(event.address);
  let response = contract.try_getERC1155Listing(listingID);
  if (!response.reverted) {
    let listingInfo = response.value;
    listing.category = listingInfo.category;
    listing.erc1155TokenAddress = listingInfo.erc1155TokenAddress;
    listing.erc1155TypeId = listingInfo.erc1155TypeId;
    listing.seller = listingInfo.seller;
    listing.timeCreated = listingInfo.timeCreated;
    listing.timeLastPurchased = listingInfo.timeLastPurchased;
    listing.priceInWei = listingInfo.priceInWei;
    listing.sold = listingInfo.sold;
    listing.cancelled = listingInfo.cancelled;
    listing.quantity = listingInfo.quantity;

    //tickets
    if (listing.category.toI32() === 3) {
      let rarityLevel = listing.erc1155TypeId;
      listing.rarityLevel = rarityLevel;

      //items
    } else {
      const contract = AavegotchiDiamond.bind(event.address);
      const _response = contract.try_getItemType(listingInfo.erc1155TypeId);

      if (!_response.reverted) {
        const itemType = _response.value;

        listing.rarityLevel = itemMaxQuantityToRarity(itemType.maxQuantity);

        // brs modifier
        listing.rarityScoreModifier = BigInt.fromI32(itemType.rarityScoreModifier);

        // trait modifier
        listing.nrgTraitModifier = BigInt.fromI32(itemType.traitModifiers[0]);
        listing.aggTraitModifier = BigInt.fromI32(itemType.traitModifiers[1]);
        listing.spkTraitModifier = BigInt.fromI32(itemType.traitModifiers[2]);
        listing.brnTraitModifier = BigInt.fromI32(itemType.traitModifiers[3]);
        listing.eysTraitModifier = BigInt.fromI32(itemType.traitModifiers[4]);
        listing.eycTraitModifier = BigInt.fromI32(itemType.traitModifiers[5]);
      }
    }
  } else {
    log.warning("Listing {} couldn't be updated at block: {} tx_hash: {}", [
      listingID.toString(),
      event.block.number.toString(),
      event.transaction.hash.toHexString()
    ]);
  }

  return listing as ERC1155Listing;
}

export function updateERC1155PurchaseInfo(listing: ERC1155Purchase, event: ERC1155ExecutedListing): ERC1155Purchase {
  let listingInfo = event.params;

  listing.category = listingInfo.category;
  listing.listingID = listingInfo.listingId;
  listing.erc1155TokenAddress = listingInfo.erc1155TokenAddress;
  listing.erc1155TypeId = listingInfo.erc1155TypeId;
  listing.seller = listingInfo.seller;
  listing.timeLastPurchased = listingInfo.time;
  listing.priceInWei = listingInfo.priceInWei;
  listing.quantity = event.params._quantity;
  listing.buyer = event.params.buyer;
  listing.recipient = event.params.buyer;

  //tickets
  if (listing.category.equals(BigInt.fromI32(3))) {
    let rarityLevel = listingInfo.erc1155TypeId;
    listing.rarityLevel = rarityLevel;

    //items
  } else {
    const contract = AavegotchiDiamond.bind(event.address);
    const _response = contract.try_getItemType(listingInfo.erc1155TypeId);

    if (!_response.reverted) {
      const itemType = _response.value;

      listing.rarityLevel = itemMaxQuantityToRarity(itemType.maxQuantity);
    }
  }

  return listing as ERC1155Purchase;
}

//@ts-ignore
function itemMaxQuantityToRarity(bigInt: BigInt): BigInt {
  let quantity = bigInt.toI32();
  if (quantity >= 1000) return BigInt.fromI32(0);
  if (quantity >= 500) return BigInt.fromI32(1);
  if (quantity >= 250) return BigInt.fromI32(2);
  if (quantity >= 100) return BigInt.fromI32(3);
  if (quantity >= 10) return BigInt.fromI32(4);
  if (quantity >= 1) return BigInt.fromI32(5);
  return BigInt.fromI32(0);
}

export function loadOrCreateERC1155Purchase(
  id: string,
  buyer: Address,
  createIfNotFound: boolean = true
): ERC1155Purchase {
  let listing = ERC1155Purchase.load(id);

  if (listing == null && createIfNotFound) {
    listing = new ERC1155Purchase(id);
  }

  return listing as ERC1155Purchase;
}
