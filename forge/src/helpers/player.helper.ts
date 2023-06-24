import { BigInt, Address } from '@graphprotocol/graph-ts';
import { Player } from '../../generated/schema';

export function loadOrCreatePlayer(id: Address): Player {
  let player = Player.load(id.toHexString());

  if (player == null) {
    player = new Player(id.toHexString());

    player.alloyAmount = BigInt.zero();
    player.essenceAmount = BigInt.zero();

    player.commonGeodeAmount = BigInt.zero();
    player.uncommonGeodeAmount = BigInt.zero();
    player.rareGeodeAmount = BigInt.zero();
    player.legendaryGeodeAmount = BigInt.zero();
    player.mythicalGeodeAmount = BigInt.zero();
    player.godlikeGeodeAmount = BigInt.zero();

    player.commonCoreAmount = BigInt.zero();
    player.uncommonCoreAmount = BigInt.zero();
    player.rareCoreAmount = BigInt.zero();
    player.legendaryCoreAmount = BigInt.zero();
    player.mythicalCoreAmount = BigInt.zero();
    player.godlikeCoreAmount = BigInt.zero();

    player.commonSchematicAmount = BigInt.zero();
    player.uncommonSchematicAmount = BigInt.zero();
    player.rareSchematicAmount = BigInt.zero();
    player.legendarySchematicAmount = BigInt.zero();
    player.mythicalSchematicAmount = BigInt.zero();
    player.godlikeSchematicAmount = BigInt.zero();
  }

  return player as Player;
}
