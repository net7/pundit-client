import { CommunicationSettings } from 'src/communication';
import { listen } from './listener';

// webpack build env variables
declare const API_BASE_URL: string;
declare const AUTH_BASE_URL: string;

// The worker sends requests only to the API it was built for: a page cannot change them.
CommunicationSettings.apiBaseUrl = API_BASE_URL;
CommunicationSettings.authBaseUrl = AUTH_BASE_URL;

// init
listen();
