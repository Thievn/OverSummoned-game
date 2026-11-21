function kit(partial) {
  return {
    main: null,
    off: null,
    head: null,
    chest: null,
    legs: null,
    feet: null,
    ring1: null,
    ring2: null,
    trinket1: null,
    trinket2: null,
    anomaly: null,
    belt: [null, null, null, null],
    ...partial,
  };
}

const loadouts = {
  legionary: kit({
    main: 'rusty_gladius',
    off: 'shield_lost_ninth',
    chest: 'hi_vis_vest',
    feet: 'hobnailed_caligae',
    trinket1: 'defib_paddles',
  }),
  gangster: kit({
    main: 'violin_case',
    off: 'trench_lantern',
    trinket1: 'black_ledger',
  }),
  paramedic: kit({
    head: 'beak_mask',
    chest: 'hi_vis_vest',
    trinket1: 'defib_paddles',
  }),
  office_worker: kit({
    main: 'rusty_gladius',
    off: 'trench_lantern',
    feet: 'hobnailed_caligae',
    anomaly: 'group_chat',
  }),
  hunter: kit({
    main: 'pocket_trebuchet',
    off: 'inflatable_tube_man',
    chest: 'hi_vis_vest',
    feet: 'hobnailed_caligae',
  }),
  engineer: kit({
    main: 'duelling_rapier',
    off: 'trench_lantern',
    trinket1: 'defib_paddles',
    anomaly: 'second_moon',
  }),
  plague_doctor: kit({
    head: 'beak_mask',
    off: 'trench_lantern',
    trinket1: 'defib_paddles',
  }),
  delivery_rider: kit({
    off: 'inflatable_tube_man',
    chest: 'hi_vis_vest',
    feet: 'hobnailed_caligae',
    anomaly: 'group_chat',
  }),
};

export default loadouts;

export const SLOT_FAMILY = {
  main: 'Main Hand',
  off: 'Off Hand',
  head: 'Head',
  chest: 'Chest',
  legs: 'Legs',
  feet: 'Feet',
  ring1: 'Ring',
  ring2: 'Ring',
  trinket1: 'Trinket',
  trinket2: 'Trinket',
  anomaly: 'Anomaly',
};
