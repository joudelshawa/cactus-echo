# Cactus Echo

A browser app for an infant vocal-interaction study. A cactus character listens for a baby's sounds and replies with the baby's own sound at a higher pitch, either keeping the baby's tune (**copy**) or changing it (**flip**, **flatten**, **random**). Each session logs timings and acoustic measurements for analysis.

## Files

| File | What it is |
|---|---|
| `index.html` | The app: microphone listening, pitch processing, character, controls, sessions and CSV export |
| `cactus-report.html` | Charts and summaries for one saved session (opened from **View charts** in the app) |
| `cactus-metrics.js` | Shared metric calculations, so the report and the summary CSV always agree |

## Data and privacy

- **No audio is ever saved or uploaded.** Sounds are processed in memory and discarded.
- Session logs (events and timings) are stored only in the browser on the computer that ran the session. Nothing is sent to GitHub or any server.
- Export CSVs regularly: clearing the browser's site data erases saved sessions.

## Running locally

The microphone needs `https://` or `http://localhost`:

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765/.
