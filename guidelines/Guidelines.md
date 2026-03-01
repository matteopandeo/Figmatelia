**Add your own guidelines here**

<!--
# Figmatelia — Piano Operativo Completo 

## Lezione appresa
Figma Make interpreta più frame allegati come sezioni di una long-scroll page. **Regola: 1 prompt = 1 schermata.** I frame vanno dati uno alla volta come reference, mai tutti insieme.

---

## Stato Asset

### ✅ Completati
- **Puncher render** — vista bottom, top-down, generato con Nano Banana. Da scontornare e ruotare in verticale.
- **Flusso principale** — schermate disegnate:
  1. Choose your image (puncher vuoto + icona upload)
  2. Cut your stamp (foto sotto puncher + CTA)
  3. Add details / Name your stamp
  4. Last but not least (nome compilato + CTA save)
  5. Stampbook (griglia collezione + Share book link)

### ⬜ Da completare
- Puncher PNG scontornato e ruotato in verticale
- SVG clip-path forma francobollo
- 3-4 foto demo (Unsplash)
- Logo/wordmark "Figmatelia"
- Frame per: Share bottom sheet, Gallery fullscreen, Registration modal
- Audio punch (opzionale)
- Favicon / app icon

---

## Architettura Flusso

```
STAMPBOOK (Home)
  ├── Tap "+" → STEP 1: Choose your image
  │     └── Upload foto → STEP 2: Cut your stamp
  │           └── Tap "Cut" → STEP 3: Add details (name your stamp)
  │                 └── Tap "Save in stamp book" → 
  │                       ├── [PRIMO STAMP] → REGISTRATION MODAL → STAMPBOOK
  │                       └── [STAMP SUCCESSIVI] → STAMPBOOK (con animazione)
  ├── Tap su uno stamp → GALLERY FULLSCREEN (swipeable)
  └── Tap "Share book link" → SHARE BOTTOM SHEET
```

---

## Logica Registrazione e Storage

### Quando si attiva
La registrazione **non è richiesta per usare l'app**. L'utente può caricare la foto, tagliarla e dargli un nome senza alcun account. Il prompt di registrazione appare **solo dopo aver completato il primo stamp**, nel momento in cui preme "Save in stamp book".

### Flusso primo stamp
1. Utente completa Step 3 → preme "Save in stamp book"
2. Appare un modal: "Save your stamps forever" con spiegazione breve
3. Opzioni:
   - **Continue with Google** (OAuth via Supabase)
   - **Continue with email** (magic link via Supabase)
   - **Skip for now** → salva in localStorage, lo stamp appare nella griglia ma con un badge "local only"
4. Se l'utente si registra → lo stamp viene salvato su Supabase + tutti i futuri stamp vanno direttamente su Supabase
5. Se l'utente skippa → tutto resta in localStorage. Al prossimo "Share book link" appare di nuovo il prompt di registrazione (non puoi condividere senza account perché serve un URL persistente)

### Flusso stamp successivi
Se l'utente è già autenticato → lo stamp va direttamente su Supabase, nessun modal.
Se l'utente non è autenticato → salva in localStorage, nessun modal (il prompt riappare solo su "Share").

### Supabase Schema

**Tabella `users`** (gestita da Supabase Auth automaticamente)

**Tabella `stamps`**
| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid | PK, auto |
| user_id | uuid | FK → auth.users |
| image_data | text | Base64 della foto ritagliata |
| name | text | Nome dato dall'utente |
| rotation | float | Rotazione applicata |
| zoom | float | Zoom applicato |
| created_at | timestamp | Auto |

**Tabella `stampbooks`**
| Colonna | Tipo | Note |
|---------|------|------|
| id | uuid | PK, auto |
| user_id | uuid | FK → auth.users |
| slug | text | Unique, per URL pubblico (es. "matteo-123") |
| title | text | Default: "My Figmatelia" |
| created_at | timestamp | Auto |

**Storage bucket `stamp-images`** — per le immagini ritagliate (alternativa a base64 nel DB, più performante per immagini grandi).

### URL pubblico
`figmatelia.figma.site/book/{slug}` — il slug viene generato alla registrazione. La pagina pubblica legge da Supabase senza autenticazione (RLS policy: stamps sono pubblici in lettura se il stampbook ha un slug).

## Stack Tecnico

- **Framework:** React (generato da Figma Make)
- **Animazioni:** Motion (framer-motion) — integrato in Figma Make
- **Gesti:** @use-gesture/react (npm in code layers)
- **Auth + DB:** Supabase (Auth + PostgreSQL + Storage)
- **Persistenza locale:** localStorage (fallback pre-registrazione)
- **Clip-path:** SVG custom per forma francobollo
- **Hosting:** figma.site (Figma Sites publish)
- **Sharing:** Web Share API + Clipboard API

## File/Asset Checklist

1. ✅ Puncher render (generato con Nano Banana)
2. ⬜ Puncher PNG scontornato + ruotato verticale
3. ⬜ SVG clip-path francobollo (generabile nel code layer, Fase 4)
4. ⬜ 3-4 foto demo da Unsplash
5. ⬜ Logo/wordmark "Figmatelia" (già nel mockup)
6. ⬜ Frame Registration modal (da disegnare)
7. ⬜ Frame Share bottom sheet (da disegnare)
8. ⬜ Progetto Supabase creato (URL + anon key)
9. ⬜ Audio punch .mp3 (opzionale)
10. ⬜ Favicon / app icon

## Nome: ✅ Figmatelia
-->