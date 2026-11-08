# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Demo:

[Asteroids demo](https://klerith.github.io/claude-asteroids/)

## Descripción del juego

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups y habilidades especiales que se renuevan en cada nivel.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción                                   |
| --------- | ---------------------------------------- |
| `←` `→`   | Rotar nave                               |
| `↑`       | Propulsar                                |
| `↑` `↑`   | Hiperpropulsión (doble pulsación rápida) |
| `Espacio` | Disparar (una bala por pulsación)        |
| `S`       | Escudo temporal                          |
| `F`       | Bomba nova                               |

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides

## Power-ups y habilidades

Cada una está disponible **una vez por nivel**. Los efectos activos se muestran en el HUD con su tiempo restante.

| Habilidad       | Cómo se obtiene                                                                                               | Efecto                                                                      | Duración                    |
| --------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------- |
| Disparo triple  | Ítem cian que puede soltar un asteroide destruido (20 % de probabilidad); queda disponible 15 s para recogerlo | Cada disparo sale en abanico de 3 balas                                     | 5 s                         |
| Cámara lenta    | Se activa sola al aparecer el ítem de disparo triple                                                           | Los asteroides se mueven a la mitad de velocidad; la nave no se ve afectada | 6 s                         |
| Escudo temporal | Tecla `S`                                                                                                     | Círculo de energía que absorbe un impacto de asteroide                      | 5 s o hasta recibir un golpe |
| Hiperpropulsión | Doble pulsación rápida de `↑`                                                                                 | Aceleración y velocidad máxima ×2.5                                         | 8 s                         |
| Bomba nova      | Se desbloquea al destruir 1/3 de los asteroides del nivel; se lanza con `F`                                   | Onda expansiva desde la nave que destruye los asteroides que toca           | Instantánea                 |

El indicador de la bomba nova aparece a la izquierda de las vidas: gris mientras está bloqueada, naranja cuando está lista; desaparece una vez usada.

Al morir se pierden los efectos activos (disparo triple, escudo e hiperpropulsión).
