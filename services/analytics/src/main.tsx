import { boot } from '@flightflow/shared'
import './index.css'
import './messages'

void boot(() => import('./App'))
