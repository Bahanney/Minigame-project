# 🐍 VENOM — AI Snake Game

> *"It learns. It hunts. It wins."*

A classic Snake game reimagined with an **adaptive AI hunter** that tracks your movement patterns and uses pathfinding to cut you off. Built with vanilla HTML, CSS and JavaScript — no frameworks, no libraries.

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
- Avoid **Poison ✕** — it appears on the grid and fades after 5 seconds
- Hit **score 10** and the **AI Hunter wakes up**
- The hunter tracks your last 20 moves and predicts where you're heading
- Every 5 food you eat, the hunter gets faster

---

## 🤖 How the AI Works

The AI hunter uses two algorithms working together:

**BFS Pathfinding (Breadth-First Search)**
Finds the shortest route through the grid to reach the player in real time, navigating around walls and obstacles.

**Pattern Recognition**
Records the player's last 20 directional inputs, identifies the dominant movement habit, and predicts 2–3 steps ahead — intercepting rather than just chasing.

**Adaptive Speed**
The hunter's speed increases as your score grows. The better you play, the harder it hunts.

---

## ⚙️ Difficulty Scaling

| Score | Event |
|-------|-------|
| 0 – 9 | Classic snake, no hunter |
| 10 | AI Hunter activates |
| 15+ | Poison appears more frequently |
| Every 5 food | Hunter speed increases |
| Every 5 score | Player level increases |

---

## 📁 Project Structure

```
venom/
├── index.html       ← Game layout and UI
├── style.css        ← Elegant styling and layout
├── game.js          ← Game engine, AI logic, BFS pathfinding
├── assets/
│   └── icons/       ← Reserved for future assets
└── README.md
```

---

## 🚀 Run Locally

```bash
git clone https://github.com/bahanney/venom.git
cd venom
```

Open `index.html` in your browser, or use the **Live Server** extension in VSCode for auto-reload.

---

## 🛠️ Built With

- **HTML5 Canvas** — game rendering
- **CSS3** — elegant UI, gold and lavender palette, refined typography
- **Vanilla JavaScript** — game loop, BFS pathfinding, AI pattern tracking

No frameworks. No libraries. Pure front-end.

---

## 🔮 Planned Features

- [ ] High score leaderboard
- [ ] Sound effects
- [ ] Power-ups (shield, speed boost)
- [ ] Additional AI difficulty modes

---

## 👩🏾‍💻 Author

**Ibinabo Collins** — Junior DevOps Engineer  
[GitHub](https://github.com/bahanney) · [LinkedIn](https://www.linkedin.com/in/ibinabo-collins-)