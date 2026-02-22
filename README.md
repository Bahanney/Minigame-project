# Minigame-project 
# 🕵️ Scene Zero — A Noir Detective Game

> *"Find the truth before it finds you."*

A browser-based mystery game that blends **Minesweeper mechanics** with **noir detective storytelling**. Reveal the crime scene grid, collect clues, avoid red herrings, and name your killer.

---

## 🎮 Live Demo

👉 **[Play Scene Zero](https://bahanney.github.io/scene-zero)**

---

## 🖼️ Screenshots

> *(Add screenshots here after deployment)*

---

## 🕹️ How to Play

1. **Click any cell** to investigate that part of the crime scene
2. **Numbers** show how many clues or red herrings are nearby
3. **Right-click** to flag a suspicious cell
4. **🔍** = Real clue found — added to your Evidence Log
5. **✕** = Red herring — a misleading false lead
6. Collect at least **3 clues** to unlock the **"Name Your Killer"** button
7. **Accuse the right suspect** to close the case

---

## 🗂️ Cases

The game includes **3 unique cases** — each with a different victim, suspects, clues, and killer. Cases are selected randomly each playthrough so no two sessions are the same.

| # | Case | Setting |
|---|------|---------|
| 01 | **The Hale Case** | A private investigator shot in his own office |
| 02 | **The Ashford Dinner** | A wealthy industrialist poisoned at his dinner party |
| 03 | **Room 404** | A journalist found hidden behind a hotel wall |

---

## ⚙️ Difficulty Modes

| Mode | Grid Size | Challenge |
|------|-----------|-----------|
| Rookie | 7 × 7 | Smaller grid, easier to find clues |
| Detective | 9 × 9 | Balanced — recommended first play |
| Hard-Boiled | 11 × 11 | Large grid, clues are harder to locate |

---

## 🛠️ Built With

- **HTML5** — Structure
- **CSS3** — Noir styling, animations, rain effect, grain texture
- **Vanilla JavaScript** — Game logic, case engine, flood-fill reveal

No frameworks. No libraries. Pure front-end.

---

## 📁 Project Structure

```
scene-zero/
├── index.html       # Game layout and structure
├── style.css        # All styling — noir theme, animations
├── game.js          # Game logic, cases, state management
├── assets/
│   └── icons/       # Future: case icons, suspect portraits
└── README.md
```

---

## 🚀 Running Locally

```bash
git clone https://github.com/bahanney/scene-zero.git
cd scene-zero
```

Then open `index.html` in your browser — or use the **Live Server** extension in VSCode for auto-reload.

---

## 🔮 Planned Features

- [ ] Sound effects (typewriter, rain ambience, case solved sting)
- [ ] Suspect portrait illustrations
- [ ] More cases (5+)
- [ ] High score leaderboard (localStorage)
- [ ] Mobile touch improvements

---

## 👩🏾‍💻 Author

**Ibinabo Collins** — Junior DevOps Engineer  
[GitHub](https://github.com/bahanney) · [LinkedIn](https://www.linkedin.com/in/ibinabo-collins-)

---

*"You can wash away blood. But not guilt."*