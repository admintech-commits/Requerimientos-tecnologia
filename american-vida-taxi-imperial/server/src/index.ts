import { createApp } from './app.js';
import { config } from './config.js';
import { seedIfEmpty } from './db/seed.js';

seedIfEmpty();

createApp().listen(config.port, () => {
  console.log(`API de requerimientos escuchando en http://localhost:${config.port}`);
});
