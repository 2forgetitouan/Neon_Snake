# Neon_Snake

![Screenshot](pictures/screenshot.png)

### [Français](#fr) | [English](#en)

<a id="fr"></a>

## 🇫🇷 Fonctionnement et Explications

Neon Snake est un jeu de serpent moderne avec des effets visuels néon et une gestion avancée des collisions.

### Fonctionnalités principales

- Contrôlez le serpent avec les flèches ou ZQSD
- Plusieurs niveaux de difficulté (Easy, Medium, Hard, Extreme)
- Système de "grace" :
  - **Mur** : Si vous touchez un mur, vous avez un court délai pour corriger votre trajectoire avant le game over
  - **Queue** : Si vous touchez votre propre queue, même principe
- Effets visuels : particules, néons, secousses d'écran
- Musique et sons activables/désactivables
- Meilleur score sauvegardés (peut être un classement en temps réel dans une prochaine version)

### Démarrage

1. Ouvrez `index.html` dans votre navigateur, ou rendez vous sur [cette page](https://2forgetitouan.github.io/Neon_Snake/)
2. Cliquez sur "Start" pour jouer
3. Utilisez les touches pour diriger le serpent

### Structure du projet

- `game.js` : logique principale du jeu
- `index.html` : interface utilisateur
- `style.css` : styles visuels
- `assets/` : sons et images

### Personnalisation

- Modifiez les paramètres dans `game.js` (vitesse, couleurs, etc.)
- Changez la musique ou les sons dans le dossier `assets`

---

<a id="en"></a>

## 🇬🇧 How it works & Overview

Neon Snake is a modern snake game with neon visual effects and advanced collision management.

### Main Features

- Control the snake with arrow keys or AWSD
- Multiple difficulty levels (Easy, Medium, Hard, Extreme)
- "Grace" system:
  - **Wall**: If you hit a wall, you have a short delay to correct your direction before game over
  - **Tail**: Same principle if you hit your own tail
- Visual effects: particles, neon, screen shake
- Music and sounds (can be toggled)
- High score saved (real-time rankings may be included in a future version)

### Getting Started

1. Open `index.html` in your browser
2. Click "Start" to play
3. Use the keys to control the snake

### Project Structure

- `game.js`: main game logic
- `index.html`: user interface
- `style.css`: visual styles
- `assets/`: sounds and images

### Customization

- Edit settings in `game.js` (speed, colors, etc.)
- Change music or sounds in the `assets` folder
