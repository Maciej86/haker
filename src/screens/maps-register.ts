// Ekrany map i wyjazdu: osobne paczki ładowane przy pierwszym wejściu.
import { lazy } from 'react';
import { registerScreen } from './registry';

registerScreen('mapPoland', lazy(() => import('./map-poland/MapPoland')));
