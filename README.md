# LottoAI — PWA open‑source

**LottoAI** è una web app (PWA) che genera, in modo *deterministico e personale*, combinazioni per **Lotto** e **SuperEnalotto** basandosi su: `nome + data di nascita + data del giorno + tipo di gioco`.

> ⚠️ **Disclaimer**: l’app è solo per **intrattenimento**. Non predice né promette vincite. Gioca responsabilmente.

## Come funziona
- Inserisci **nome** (o nickname) e **data di nascita**.
- Scegli il **gioco**:
  - **Lotto**: 5 numeri su 1..90.
  - **SuperEnalotto**: 6 numeri su 1..90 + **Jolly** + **Superstar**.
- Per ogni **data di riferimento** (di default *oggi*), l’app calcola un hash SHA‑256 e ne ricava un seed per un PRNG (*xorshift32*).  
  Con lo stesso input, otterrai **sempre** la stessa combinazione.

## Tech
- 100% client‑side: **nessun server**, **nessun tracciamento**.
- Installabile come **PWA**, funziona **offline** (service worker + cache).
- Stack: HTML, CSS, JS (Web Crypto API per SHA‑256).

## Avvio locale
Apri `index.html` con un server statico (consigliato) oppure pubblica su GitHub Pages.

Esempio con `python`:
```bash
cd LottoAI
python3 -m http.server 8080
# poi visita http://localhost:8080
```

## Deploy su GitHub Pages
1. Crea la repo **LottoAI**.
2. Carica questi file nella root.
3. Attiva **Pages** (branch `main`, folder `/root`) e apri l’URL pubblicato.

## Licenza
MIT © 2025 — Progetto educativo / ludico.
