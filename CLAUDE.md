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

- **Input**: mapas globales `keys` (tecla mantenida) y `justPressed` (flanco de pulsación). `pressed(code)` consume el flanco; úsalo para acciones de un solo disparo (p. ej. `Space`).
- **Entidades**: clases `Bullet`, `Asteroid`, `Ship`, `Particle`, todas con `update(dt)` / `draw()` y un flag `dead`. Las listas se purgan con `filter(x => !x.dead)` en cada frame. Dibujan directamente sobre el `ctx` global.
- **Espacio toroidal**: posiciones envueltas con `wrap()` (excepto partículas).
- **Asteroides**: tamaño 3/2/1 indexa los arrays `RADII`, `SPEEDS`, `POINTS`; `split()` genera dos del tamaño inferior.
- **Máquina de estados**: variable global `state` = `'playing' | 'dead' | 'gameover'`. `update(dt)` ramifica según el estado; `killShip()` transiciona a `dead` (con `deadTimer`) o `gameover`; nivel completado cuando no quedan asteroides (`nextLevel()`).
- **Loop**: `requestAnimationFrame` con `dt` en segundos, limitado a 0.05 s.

## Notas

- El README todavía menciona power-ups y la "estrella fugaz", pero fueron eliminados del código (commit `13e713f`).
