// Book: the deadline stack. Static content, ordered by urgency.

const DEADLINES = [
  {
    tone: '', clock: 'Tonight', head: 'Where you sleep on Maui',
    body: 'Live Booking rates are in, and South Maui is <b>not</b> sold out — there is ' +
      'inventory from $184 to $769 a night. Your Airbnb at $270 sits mid-range and is priced ' +
      'fairly. <b>Lock it before anything else anyway</b>, because that spread will narrow fast ' +
      'inside a week.'
  },
  {
    tone: 'cool', clock: 'Reconsider', head: 'The Sheraton and the Hyatt',
    body: 'Two earlier picks moved once real rates came in. The <b>Sheraton came back at $581 a ' +
      'night, not the $467 I estimated</b> — and the Moana Surfrider and Outrigger Reef are both ' +
      'cheaper and rated higher. The <b>Hilton is now the cheapest of your four</b>, not the ' +
      'Hyatt. Check Stay before you book.'
  },
  {
    tone: '', clock: 'Today · window open now', head: 'Diamond Head',
    body: 'Out-of-state reservations release 30 days ahead, so your dates are bookable ' +
      '<b>right now</b> at gostateparks.hawaii.gov. The 6 a.m. slots go within hours. $5 a head, ' +
      '$10 a car.'
  },
  {
    tone: '', clock: 'Today', head: 'Molokini boat',
    body: 'Kai Kanani\u2019s sunrise departures are small and go first. Book the <b>earliest slot ' +
      'available</b>, not the convenient one — the crater\u2019s visibility collapses once the ' +
      'trades pick up mid-morning.'
  },
  {
    tone: '', clock: 'Today', head: 'The rental cars',
    body: 'Hawaiʻi fleets are thin and prices climb steeply inside a week. Collect at Kahului, ' +
      'and check whether returning on Oʻahu carries a one-way fee — <b>two separate rentals often ' +
      'price better</b> than one interisland booking.'
  },
  {
    tone: 'done', clock: 'Missed · use the workaround', head: 'Haleakalā sunrise',
    body: 'Vehicle permits release 60 days out and that window closed in July. A small batch drops ' +
      '<b>48 hours before each date at 7 a.m. HST</b> on Recreation.gov. Guided tours hold a ' +
      'separate park allocation, so that is the dependable route — or take sunset, which needs no ' +
      'permit at all.'
  },
  {
    tone: 'cool', clock: 'Wed 23 Sep · 7 a.m. HST', head: 'Hanauma Bay, for Friday',
    body: 'Opens exactly 48 hours ahead. <b>7 a.m. Hawaiʻi time is 1 p.m. in New York</b> — set ' +
      'the alarm. Closed Mondays and Tuesdays, so Friday and Saturday both work for you.'
  },
  {
    tone: 'cool', clock: 'This week', head: 'Tables and the charter',
    body: 'Mama\u2019s Fish House books months out — call for cancellations rather than trying the ' +
      'website. Private sunset charters normally want 2–4 weeks, so phone them. Ferraro\u2019s, ' +
      'Morimoto and Michel\u2019s are all realistic at this notice.'
  },
  {
    tone: '', clock: 'Before you pay', head: 'Refundable rates and insurance',
    body: 'September is the statistical peak of Hawaiʻi\u2019s hurricane season and 2026 was ' +
      'forecast above normal. <b>Hurricane Lowell passed just west of Kauaʻi on 8 September.</b> ' +
      'Nothing is threatening your dates — but at these prices, a refundable rate is cheap insurance.'
  }
];

export function render() {
  return '<p class="lede">You are eight days out, which changes the order of operations. Wailea ' +
    'beds and the good snorkel boats are the constraint — not the flights.</p>' +
    DEADLINES.map((d) =>
      '<div class="dl' + (d.tone ? ' ' + d.tone : '') + '">' +
        '<p class="clock">' + d.clock + '</p>' +
        '<h4>' + d.head + '</h4>' +
        '<p>' + d.body + '</p>' +
      '</div>'
    ).join('');
}
