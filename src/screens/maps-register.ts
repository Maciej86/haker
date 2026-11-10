// Ekrany map i wyjazdu: osobne paczki ładowane przy pierwszym wejściu.
import { lazy } from 'react';
import { registerScreen } from './registry';

registerScreen('mapPoland', lazy(() => import('./map-poland/MapPoland')));
registerScreen('mapCity', lazy(() => import('./map-city/MapCity')));
registerScreen('trip', lazy(() => import('./trip/Trip')));
