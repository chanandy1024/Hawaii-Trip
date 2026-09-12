// The two rental cars, seeded from the itinerary and then edited in the app.
//
// Only what the trip already fixes is filled in — the islands, the dates, where
// you collect. Everything that comes from an actual booking is left blank for
// whoever books it. Edit these defaults if the shape of the trip changes;
// anything typed into the page lives in state, not here.

export const DEFAULT_VEHICLES = [
  {
    id: 'v_maui',
    label: 'Maui car',
    isle: 'maui',
    company: '',
    kind: '',
    pickup: 'Kahului Airport (OGG)',
    pickupAt: 'Sun 20 Sep',
    dropoff: 'Kahului Airport (OGG)',
    dropoffAt: 'Thu 24 Sep',
    ref: '',
    cost: '',
    driver: '',
    note: 'Essential on Maui — Hāna, Haleakalā and Waiheʻe are unreachable without one.'
  },
  {
    id: 'v_oahu',
    label: 'Oʻahu car',
    isle: 'oahu',
    company: '',
    kind: '',
    pickup: 'Honolulu Airport (HNL)',
    pickupAt: 'Thu 24 Sep',
    dropoff: 'Honolulu Airport (HNL)',
    dropoffAt: 'Sun 27 Sep',
    ref: '',
    cost: '',
    driver: '',
    note: 'Earns its keep for Lanikai, Kualoa and the North Shore, but parking at the ' +
      'Waikīkī hotels runs $55–80 a night. Price two days against the full three.'
  }
];

/** The fields each vehicle card shows, in order. */
export const VEHICLE_FIELDS = [
  { k: 'company', label: 'Company', hint: 'Hertz, Turo…' },
  { k: 'kind', label: 'Vehicle', hint: 'Mid-size SUV' },
  { k: 'ref', label: 'Confirmation', hint: 'Booking code' },
  { k: 'cost', label: 'Cost', hint: '$0' },
  { k: 'pickup', label: 'Pick up at', hint: 'Airport counter' },
  { k: 'pickupAt', label: 'Pick up when', hint: 'Sun 20 Sep, 2:30 pm' },
  { k: 'dropoff', label: 'Drop off at', hint: 'Same counter' },
  { k: 'dropoffAt', label: 'Drop off when', hint: 'Thu 24 Sep, 9:00 am' },
  { k: 'driver', label: 'Driver on the booking', hint: 'Who signs for it' }
];
