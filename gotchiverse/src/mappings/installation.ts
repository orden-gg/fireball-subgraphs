import { BigInt, log } from '@graphprotocol/graph-ts';
import {
  UpgradeInitiated as UpgradeInitiatedEvent,
  UpgradeFinalized as UpgradeFinalizedEvent
} from '../../generated/InstallationDiamond/InstallationDiamond';
import {
  equipInstallation,
  equipTile,
  increaseCurrentSurvey,
  loadOrCreateGotchi,
  loadOrCreateInstallation,
  loadOrCreateParcel,
  loadOrCreatePlayer,
  loadOrCreateSurvey,
  loadOrCreateTile,
  unequipInstallation,
  unequipTile
} from '../helpers';

export function handleUpgradeInitiated(event: UpgradeInitiatedEvent): void {
  const installation = loadOrCreateInstallation(
    event.params._realmId,
    event.params.installationId,
    event.params._coordinateX,
    event.params._coordinateY
  );

  log.warning('Installation {} is upgrading', [installation.id]);

  installation.upgrading = true;
  installation.lastUpgradeInitiated = event.params.blockInitiated;
  installation.lastUpgradeReady = event.params.readyBlock;

  installation.save();
}

export function handleUpgradeFinalized(event: UpgradeFinalizedEvent): void {
  const currentInstallationId = event.params._newInstallationId.minus(BigInt.fromI32(1));
  const installation = loadOrCreateInstallation(
    event.params._realmId,
    currentInstallationId,
    event.params._coordinateX,
    event.params._coordinateY
  );

  log.warning('Installation {} is READY - _newInstallationId: {}, currentInstallationId: {}', [
    installation.id,
    event.params._newInstallationId.toString(),
    currentInstallationId.toString()
  ]);

  installation.upgrading = false;

  installation.save();
}
