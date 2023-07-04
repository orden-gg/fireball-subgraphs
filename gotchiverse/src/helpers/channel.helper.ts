import { ChannelAlchemicaEvent } from '../../generated/schema';
import { ChannelAlchemica } from '../../generated/RealmDiamond/RealmDiamond';

export function createChannelAlchemicaEvent(event: ChannelAlchemica): ChannelAlchemicaEvent {
  const channelEvent = new ChannelAlchemicaEvent(event.transaction.hash.toHexString());

  channelEvent.gotchi = event.params._gotchiId.toString();
  channelEvent.parcel = event.params._realmId.toString();

  channelEvent.realmId = event.params._realmId;
  channelEvent.gotchiId = event.params._gotchiId;

  channelEvent.eventExecuter = event.transaction.from;

  channelEvent.alchemica = event.params._alchemica;
  channelEvent.spilloverRate = event.params._spilloverRate;
  channelEvent.spilloverRadius = event.params._spilloverRadius;

  channelEvent.block = event.block.number;
  channelEvent.transaction = event.transaction.hash;
  channelEvent.timestamp = event.block.timestamp;

  return channelEvent;
}
