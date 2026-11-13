import { boot } from '@flightflow/shared';
import './styles/index.css';
import './styles/themes.css';
import './messages';

void boot(() => import('./App'));
