import { ChannelAlchemicaEvent, ClaimAlchemicaEvent } from '../../generated/schema';
import { AlchemicaClaimed } from '../../generated/RealmDiamond/RealmDiamond';

export function createClaimAlchemicaEvent(event: AlchemicaClaimed): ClaimAlchemicaEvent {
  const claimEvent = new ClaimAlchemicaEvent(event.transaction.hash.toHexString());

  claimEvent.gotchi = event.params._gotchiId.toString();
  claimEvent.parcel = event.params._realmId.toString();

  claimEvent.realmId = event.params._realmId;
  claimEvent.gotchiId = event.params._gotchiId;

  claimEvent.eventExecuter = event.transaction.from;

  claimEvent.alchemicaType = event.params._alchemicaType;
  claimEvent.amount = event.params._amount;
  claimEvent.spilloverRate = event.params._spilloverRate;
  claimEvent.spilloverRadius = event.params._spilloverRadius;

  claimEvent.block = event.block.number;
  claimEvent.transaction = event.transaction.hash;
  claimEvent.timestamp = event.block.timestamp;

  return claimEvent;
}
