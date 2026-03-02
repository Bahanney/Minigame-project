# 🐍 VENOM — AI Snake Game

![CI](https://github.com/bahanney/Minigame-project/actions/workflows/ci.yml/badge.svg)

> *"It learns. It hunts. It wins."*

A classic Snake game reimagined with an **adaptive AI hunter** that tracks your movement patterns and uses BFS pathfinding to cut you off. Built with vanilla HTML, CSS and JavaScript — no frameworks, no libraries.

---

## 🎮 Live Demo

👉 **[Play VENOM](https://bahanney.github.io/Minigame-project/Venom/)**

---

## 🕹️ How to Play

| Key | Action |
|-----|--------|
| `↑ ↓ ← →` or `W A S D` | Move the snake |
| `P` or `Escape` | Pause |
| Swipe | Mobile supported |

- Eat **Food ★** to grow and score points
- Avoid **Poison ✕** — fades after 5 seconds
- Hit **score 10** and the **Hunter wakes up**
- The hunter tracks your last 20 moves and predicts where you're heading
- Every 5 food you eat, the hunter gets faster

---

## 🤖 How the AI Works

**BFS Pathfinding (Breadth-First Search)**
Finds the shortest route through the grid to reach the player in real time, navigating around walls and obstacles.

**Pattern Recognition**
Records the player's last 20 directional inputs, identifies the dominant movement habit, and predicts 2–3 steps ahead — intercepting rather than just chasing.

**Adaptive Speed**
The hunter's speed increases as your score grows. The better you play, the harder it hunts.

---

## 🐳 Run with Docker

This game is fully containerised using **nginx:alpine**.

```bash
# Build the image
docker build -t venom-game .

# Run the container
docker run -p 8080:80 venom-game
```

Then open `http://localhost:8080` in your browser.

> This demonstrates containerisation of a static web application — a core DevOps skill. The nginx:alpine image is used for its minimal footprint (~23MB).

---

## ⚙️ CI/CD Pipeline

This project uses **GitHub Actions** for continuous integration. On every push to `main` the pipeline:

1. ✅ Validates all required game files exist
2. ✅ Checks HTML structure and JS syntax
3. ✅ Builds the Docker image
4. ✅ Spins up the container and verifies it serves correctly

---

## ⚙️ Difficulty Scaling

| Score | Event |
|-------|-------|
| 0 – 9 | Classic snake, no hunter |
| 10 | Hunter activates |
| 15+ | Poison appears more frequently |
| Every 5 food | Hunter speed increases |
| Every 5 score | Player level increases |

---

## 📁 Project Structure

```
Minigame-project/
└── Venom/
    ├── index.html              ← Game layout and screens
    ├── style.css               ← Elegant styling and layout
    ├── game.js                 ← Game engine, AI logic, BFS pathfinding
    ├── Dockerfile              ← Containerises the game with nginx
    ├── assets/
    │   └── icons/              ← Reserved for future assets
    └── README.md
.github/
└── workflows/
    └── ci.yml                  ← GitHub Actions CI/CD pipeline
```

---

## 🛠️ Built With

- **HTML5 Canvas** — game rendering
- **CSS3** — elegant UI, gold and lavender palette, horror welcome screen
- **Vanilla JavaScript** — game loop, BFS pathfinding, AI pattern tracking
- **Docker + nginx** — containerisation and local serving
- **GitHub Actions** — CI/CD pipeline

---

## 🔮 Planned Features

- [ ] Power-ups (shield, freeze, speed boost)
- [ ] Local leaderboard with initials
- [ ] Sound effects
- [ ] Additional AI difficulty modes

---

## 👩🏾‍💻 Author

**Ibinabo Collins** — Junior DevOps Engineer
[GitHub](https://github.com/bahanney) · [LinkedIn](https://www.linkedin.com/in/ibinabo-collins-)