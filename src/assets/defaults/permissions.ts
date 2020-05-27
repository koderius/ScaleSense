/** *
 *
 * Default permissions for roles
 *
 */
import {Permissions} from '../../app/models/UserDoc';

export const DefaultManager: Permissions = {
  'canWatch': true,
  'canCreate': true,
  'canEdit': true,
  'canReceive': true,
  'canReceiveEarly': true,
  'canReceiveUnapproved': true,
  'canReceiveNoWeight': true,
  'canChangeProductPrice': true,
  'canReturn': true,
  'canUserScales': true,
  'canSetSuppliers': true,
  'canSetProducts': true,
  'canSetCategories': true,
  'canSetEquipment': true,
  'canSetGeneral': true,
  'canReport': true,
  'canStock': false,
  'canMainOffice': false,
};

export const DefaultWorker: Permissions = {
  'canWatch': false,
  'canCreate': false,
  'canEdit': false,
  'canReceive': true,
  'canReceiveEarly': false,
  'canReceiveUnapproved': false,
  'canReceiveNoWeight': false,
  'canChangeProductPrice': false,
  'canReturn': true,
  'canUserScales': true,
  'canSetSuppliers': false,
  'canSetProducts': false,
  'canSetCategories': false,
  'canSetEquipment': true,
  'canSetGeneral': false,
  'canReport': false,
  'canStock': false,
  'canMainOffice': false,
};
