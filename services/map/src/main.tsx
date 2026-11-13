import { boot } from '@flightflow/shared';
import './styles/globals.css';
import './messages';
import { loadAirports } from './data/airports';
import { HOME_AIRPORT, initMapConfig } from './config';

void boot(
  () => import('./App'),
  async () => {
    await loadAirports();
    initMapConfig();
    document.title = HOME_AIRPORT.icao ? `FlightFlow Map · ${HOME_AIRPORT.icao}` : 'FlightFlow Map';
  },
);
