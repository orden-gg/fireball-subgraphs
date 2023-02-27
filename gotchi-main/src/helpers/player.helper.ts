import { Address, BigInt } from '@graphprotocol/graph-ts';
import { Player } from '../../generated/schema';

export function loadOrCreatePlayer(id: Address, createIfNotFound: boolean = true): Player {
  let player = Player.load(id.toHexString());

  if (player == null && createIfNotFound) {
    player = new Player(id.toHexString());
    player.gotchisLentOut = new Array<BigInt>();
    player.gotchisBorrowed = new Array<BigInt>();

    player.gotchisAmount = 0;
    player.portalsAmount = 0;
    player.itemsAmount = 0;
  }

  return player as Player;
}
