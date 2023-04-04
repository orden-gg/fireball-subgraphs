import { BigInt, Address } from '@graphprotocol/graph-ts';
import { Player } from '../../generated/schema';

export function loadOrCreatePlayer(id: Address): Player {
  let player = Player.load(id.toHexString());

  if (player == null) {
    player = new Player(id.toHexString());

    player.portalsAmount = 0;
    player.gotchisOwnedAmount = 0;
    player.gotchisBorrowedAmount = 0;
    player.gotchisLentOutAmount = 0;
    player.itemsAmount = 0;

    player.gotchisLentOut = new Array<BigInt>();
    player.gotchisBorrowed = new Array<BigInt>();
  }

  return player as Player;
}
