import { TransferBatch, TransferSingle } from '../../generated/ForgeDiamond/ForgeDiamond';
import {
  isCore,
  isGeode,
  updateAlloyTransfer,
  updateCoreTransfer,
  updateEssenceTransfer,
  updateGeodeTransfer,
  updateSchematicTransfer
} from '../helpers';
import { ALLOY, ESSENCE } from '../constants';
import { log } from '@graphprotocol/graph-ts';

export function handleTransferSingle(event: TransferSingle): void {
  const amount = event.params.value;
  const id = event.params.id.toI32();
  const from = event.params.from;
  const to = event.params.to;

  // log.error('Transfer item ID: {}', [id.toString()]);

  if (id == ALLOY) {
    updateAlloyTransfer(id, amount, from, to);
  } else if (id == ESSENCE) {
    updateEssenceTransfer(id, amount, from, to);
  } else if (isGeode(id)) {
    updateGeodeTransfer(id, amount, from, to);
  } else if (isCore(id)) {
    updateCoreTransfer(id, amount, from, to);
  } else if (id < ALLOY) {
    updateSchematicTransfer(id, amount, from, to);
  } else {
    // log.error('some weird ID:{}', [id.toString()]);
  }
}

export function handleTransferBatch(event: TransferBatch): void {
  for (let i = 0; i < event.params.ids.length; i++) {
    const amount = event.params.values[i];

    const id = event.params.ids[i].toI32();
    const from = event.params.from;
    const to = event.params.to;

    if (id == ALLOY) {
      updateAlloyTransfer(id, amount, from, to);
    } else if (id == ESSENCE) {
      updateEssenceTransfer(id, amount, from, to);
    } else if (isGeode(id)) {
      updateGeodeTransfer(id, amount, from, to);
    } else if (isCore(id)) {
      updateCoreTransfer(id, amount, from, to);
    } else if (id < ALLOY) {
      updateSchematicTransfer(id, amount, from, to);
    } else {
      // log.error('some weird ID:{}', [id.toString()]);
    }
  }
}
