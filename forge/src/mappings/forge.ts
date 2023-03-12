import { ItemSmelted as ItemSmeltedEvent } from '../../generated/ForgeDiamond/ForgeDiamond';
import { ForgeItem } from '../../generated/schema';

export function handleItemSmelted(event: ItemSmeltedEvent): void {
  const item = new ForgeItem(event.transaction.hash.toHexString());

  item.gotchiId = event.params.gotchiId.toString();
  item.itemId = event.params.itemId.toString();

  item.save();
}
