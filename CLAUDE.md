# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Juego estilo Asteroids en HTML5 Canvas + JavaScript ES6 puro. Sin dependencias, sin bundler, sin `package.json`, sin tests ni lint configurados. Textos de UI y comentarios en español.

## Ejecutar

- Abrir `index.html` directamente en el navegador, o
- `npx serve .` y visitar `http://localhost:3000`.

No hay paso de build; los cambios se verifican recargando el navegador.

## Arquitectura

Todo el juego vive en `game.js` (script clásico, `'use strict'`, sin módulos), cargado por `index.html` sobre un `<canvas id="canvas">` de 800×600. Las constantes `W`/`H` en `game.js` deben coincidir con el tamaño del canvas en `index.html`.

- **Input**: mapas globales `keys` (tecla mantenida) y `justPressed` (flanco de pulsación). `pressed(code)` consume el flanco; úsalo para acciones de un solo disparo (`Space`, `KeyS`, `KeyF`, doble toque de `ArrowUp`).
- **Entidades**: clases `Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp` (ítem recogible), `NovaWave` (onda de la bomba), todas con `update(dt)` / `draw()` y un flag `dead`. Las listas se purgan con `filter(x => !x.dead)` en cada frame. Dibujan directamente sobre el `ctx` global.
- **Espacio toroidal**: posiciones envueltas con `wrap()` (excepto partículas).
- **Asteroides**: tamaño 3/2/1 indexa los arrays `RADII`, `SPEEDS`, `POINTS`; `split()` genera dos del tamaño inferior.
- **Máquina de estados**: variable global `state` = `'playing' | 'dead' | 'gameover'`. `update(dt)` ramifica según el estado; `killShip()` transiciona a `dead` (con `deadTimer`) o `gameover`; nivel completado cuando no quedan asteroides (`nextLevel()`).
- **Loop**: `requestAnimationFrame` con `dt` en segundos, limitado a 0.05 s.
- **Disparo**: `Ship.tryShoot()` arma el disparo y `Ship.updateBurst(dt)` emite las balas (una por pulsación; tres en abanico si hay disparo triple).

## Power-ups y habilidades

Cada una tiene sus constantes (`TRIPLE_*`, `PICKUP_TTL`, `SHIELD_DURATION`, `SLOW_*`, `HYPER_*`, `NOVA_*`) y su estado en variables globales: un flag "ya usado en el nivel" (`tripleSpawned`, `shieldGiven`, `hyperGiven`, `novaState`) y un temporizador (`tripleTimer`, `shieldTimer`, `slowTimer`, `hyperTimer`) que se decrementa en `update`.

- **Disparo triple**: `PowerUp` que suelta un asteroide destruido con probabilidad `TRIPLE_DROP_CHANCE`; se recoge por colisión.
- **Cámara lenta**: se activa al aparecer el `PowerUp`; los asteroides reciben `dt * SLOW_FACTOR`.
- **Escudo**: tecla `S`; en la colisión nave-asteroide absorbe el golpe, destruye el asteroide y da 1 s de invencibilidad.
- **Hiperpropulsión**: doble toque de `↑` dentro de `DOUBLE_TAP_WINDOW` (`upTapTimer`); multiplica el empuje en `Ship.update`.
- **Bomba nova**: `novaState` = `'locked' | 'ready' | 'used'`; se desbloquea cuando `levelKills` alcanza `NOVA_KILL_RATIO` de `levelTotal` (grandes × `ASTEROIDS_PER_BIG`). Todo asteroide destruido debe incrementar `levelKills`. Lógica en `updateNova(dt)`.

Reglas de ciclo de vida:
- `initGame()` inicializa todo; `nextLevel()` reinicia los flags por nivel (`resetNova()` para la bomba); `killShip()` anula los efectos activos (triple, escudo, hiper).
- El HUD (`drawHUD`) muestra los temporizadores activos a la izquierda y el ícono de la bomba (`drawBombIcon`) a la izquierda de las vidas.
