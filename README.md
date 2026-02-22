# Minigame-project 
# 🐍 VENOM — AI Snake Game

> *"It learns. It hunts. It wins."*

A neon cyberpunk Snake game with an **adaptive AI hunter** that tracks your movement patterns and uses BFS pathfinding to cut you off. The longer you survive, the smarter it gets.

---

## 🎮 Live Demo

👉 **[Play VENOM](https://bahanney.github.io/venom)**

---

## 🕹️ How to Play

| Key | Action |
|-----|--------|
| `↑ ↓ ← →` or `W A S D` | Move the snake |
| `P` or `Escape` | Pause |
| Swipe | Mobile support |

- **Eat food (◆)** to grow and score points
- **Avoid poison (✕)** — it appears as you progress
- **Score 10** and the **AI Hunter wakes up**
- The hunter tracks your movement patterns and predicts where you're going
- Every 5 food you eat, the hunter gets faster

---

## 🤖 The AI System

The hunter uses two real computer science algorithms:

**BFS Pathfinding (Breadth-First Search)**
Finds the shortest possible route through the grid to reach the player, avoiding obstacles in real time.

**Pattern Recognition**
Tracks the player's last 20 directional inputs to identify dominant movement habits, then predicts 2–3 steps ahead to intercept rather than just follow.

**Adaptive Speed**
The hunter's tick rate decreases as your score increases — it gets physically faster the better you play.

---

## ⚙️ Difficulty Scaling

| Score | What happens |
|-------|-------------|
| 0–9   | Classic snake — no hunter |
| 10    | AI Hunter activates |
| 15+   | Poison food appears more frequently |
| Every 5 food | Hunter gets faster |
| Every 5 score | Player speed increases (new level) |

---

## 🛠️ Built With

- **HTML5 Canvas** — game rendering
- **CSS3** — cyberpunk neon UI, scanline effect, glow animations
- **Vanilla JavaScript** — BFS pathfinding, pattern tracking, game loop

No frameworks. No libraries. Pure front-end.

---

## 📁 Project Structure

```
venom/
├── index.html       # Game layout and UI
├── style.css        # Neon cyberpunk styling
├── game.js          # Game engine, AI logic, pathfinding
├── assets/
│   └── icons/       # Future assets
└── README.md
```

---

## 🚀 Run Locally

```bash
git clone https://github.com/bahanney/venom.git
cd venom
```

Open `index.html` in your browser or use **Live Server** in VSCode.

---

## 🔮 Planned Features

- [ ] High score leaderboard
- [ ] Multiple AI difficulty modes
- [ ] Power-ups (speed boost, shield)
- [ ] Sound effects and music

---

## 👩🏾‍💻 Author

**Ibinabo Collins** — Junior DevOps Engineer  
[GitHub](https://github.com/bahanney) · [LinkedIn](https://www.linkedin.com/in/ibinabo-collins-)