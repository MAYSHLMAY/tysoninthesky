# Flight Recall

Static flashcard site for GitHub Pages. The JSON files are the database.

| File | Role |
|---|---|
| `data/cards.json` | Base deck (default cards) |
| `data/added.json` | Community database: cards added from the app land here |
| `data/config.json` | Your GitHub token, locked with the password (made by `setup.html`) |
| `data/folders.json` | Folder tree: folders and where each card set lives |
| `data/index.json`, `data/packs/` | Optional hand-published packs |
| `setup.html` | One-time tool that makes `config.json` (delete it afterwards if you like) |

## One-time setup
1. GitHub > Settings > Developer settings > Fine-grained tokens > new token: only this repo, Contents = Read and write.
2. Open `setup.html` on your site, enter repo, token, password. Upload the downloaded `config.json` into `data/`.

## Adding folders and cards
Tap the orange + on the main screen > password > New folder or Add cards (pick where) > paste `#2.5 Title` then `question|correct|wrong1|wrong2|wrong3` lines. They are saved to `data/added.json` and show for everyone in about a minute.
