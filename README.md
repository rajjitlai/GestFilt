# Live Comic Overlay

A Python webcam prototype that applies comic-print overlays in real time and uses hand gestures to control the look.

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Run

```powershell
python main.py
```

## Controls

- Hold up `1` to `5` fingers to switch visual modes.
- Pinch thumb and index finger to reduce/minimize overlay intensity.
- Show an open palm to restore/maximize overlay intensity.
- Press `1`-`5` for keyboard mode fallback.
- Press `+` or `-` to adjust intensity.
- Press `q` or `Esc` to quit.

## Modes

1. Black-and-white ink
2. Spider-Verse-inspired comic print
3. Riso/cyanotype stipple
4. Hybrid print
5. Clean camera
