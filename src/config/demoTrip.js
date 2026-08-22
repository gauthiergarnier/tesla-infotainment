/**
 * The trip shown in the navigation panel.
 *
 * Modelled on Tesla's own press render of the current Model Y display: a
 * Los Angeles to Phoenix run with two Supercharger stops. Every field here is
 * something the car actually shows - arrival time, state of charge on arrival,
 * charging duration, and the weather at each stop.
 *
 * Swap this out to script a different route for a recording.
 */

export const DEMO_TRIP = {
  tabs: ['Fastest', 'Best Amenities', 'Fewest'],
  activeTab: 'Fastest',
  totalDuration: '6 hr 56 min',
  totalDistance: '372 mi',
  stopCount: 2,
  arrival: '5:30 pm',
  stops: [
    {
      name: 'Indigo, CA',
      kind: 'Supercharger',
      eta: '1:40 pm',
      weather: '68°F',
      icon: 'sun',
      soc: 50,
      charge: '5 min',
    },
    {
      name: 'Quartzsite, AZ – Main Event Lane',
      kind: 'Supercharger',
      eta: '3:22 pm',
      weather: '61°F',
      icon: 'cloud',
      soc: 16,
      charge: '11 min',
    },
    {
      name: 'Phoenix',
      kind: null,
      eta: '5:30 pm',
      weather: '53°F',
      icon: 'cloud',
      soc: 10,
      charge: null,
      destination: true,
    },
  ],
  /** The strip pinned to the bottom of the panel, describing the current leg. */
  currentLeg: {
    eta: '1:40 pm',
    duration: '2 hr 35 min',
    distance: '142 mi',
    target: 'Supercharger Indigo, CA',
    soc: 50,
    progress: 0.22,
  },
};

export default DEMO_TRIP;
