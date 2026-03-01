## STEP 0 — Analisi del progetto

```
Analizza il progetto Figmatelia. È una web app costruita con Figma Make per il Figma Makeathon 2025. L'app permette agli utenti di creare francobolli digitali da foto usando una metafora di punzonatrice.

Fammi una mappa completa di:
1. Struttura dei file e architettura del progetto
2. Come è configurato Supabase (client, auth, tabelle)
3. Dove avviene il flusso di autenticazione (magic link)
4. Come vengono salvati i francobolli (stamps) — localStorage o Supabase?
5. Se esiste già una route o pagina per la collezione pubblica
6. Eventuali variabili d'ambiente (.env) e configurazione del redirect URL

Non modificare nulla, solo analizza e riporta.
```

---

## STEP 1 — Fix autenticazione: rilevamento sessione dopo magic link

```
PROBLEMA: Quando l'utente clicca il magic link dalla mail, viene reindirizzato al sito ma l'app non riconosce che è autenticato. Il bottone continua a mostrare il modal di registrazione invece dell'interfaccia utente loggato.

COSA FARE:
1. Verifica che supabase.auth.onAuthStateChange() sia chiamato al mount dell'app (non solo getSession())
2. Il listener deve gestire gli eventi 'SIGNED_IN', 'TOKEN_REFRESHED' e 'SIGNED_OUT'
3. Dopo il redirect dal magic link, Supabase passa i token nell'URL fragment (#access_token=...). Assicurati che il client Supabase li intercetti correttamente.
4. Aggiungi uno state globale (es. useState o context) che tenga traccia di:
   - isAuthenticated: boolean
   - user: oggetto utente con email e id
   - isLoading: boolean (per evitare flash di UI non autenticata)
5. Mostra un indicatore visivo dello stato di login (es. avatar, email, o icona utente) nella UI

VINCOLI:
- Mantieni il design minimal e pulito esistente
- Non rompere il flusso punch tool che già funziona
- Il Site URL nel dashboard Supabase deve corrispondere all'URL di produzione figma.site
```

---

## STEP 2 — Verifica configurazione Supabase redirect

```
Verifica e sistema la configurazione dei redirect URL per l'autenticazione Supabase:

1. Cerca nel codice dove viene chiamato supabase.auth.signInWithOtp() 
2. Assicurati che il parametro emailRedirectTo punti all'URL di produzione corretto (il figma.site URL), NON a localhost
3. Se ci sono variabili d'ambiente per l'URL, verificale
4. Nel codice del client Supabase, assicurati che detectSessionInUrl sia true (è il default, ma verificalo)

Se trovi che il redirect punta a localhost, correggilo con l'URL di produzione.
Mostrami il codice prima e dopo la modifica.
```

---

## STEP 3 — Database: tabella stamps per utente

```
Verifica se esiste già una tabella per salvare i francobolli su Supabase. Se non esiste, crea lo schema necessario.

SCHEMA NECESSARIO:
- Tabella "stamps":
  - id: uuid (primary key, default gen_random_uuid())
  - user_id: uuid (references auth.users, NOT NULL)
  - image_url: text (URL dell'immagine del francobollo)
  - image_data: text (alternativa: base64 dell'immagine se non usiamo storage)
  - shape: text (circle, rectangle, stamp-edge)
  - label: text (nullable, testo personalizzato)
  - border_color: text (nullable, colore bordo)
  - created_at: timestamptz (default now())

- RLS (Row Level Security):
  - SELECT: tutti possono leggere (per la condivisione pubblica)
  - INSERT: solo utenti autenticati, solo i propri (auth.uid() = user_id)
  - UPDATE: solo il proprietario
  - DELETE: solo il proprietario

Genera anche le SQL migration da eseguire nel Supabase SQL Editor.
Mostrami le query SQL complete da copiare.
```

---

## STEP 4 — Salvataggio francobolli su Supabase

```
Ora collega il flusso di creazione francobollo al salvataggio su Supabase.

COSA FARE:
1. Trova dove viene generato il francobollo dopo l'animazione di punch
2. Dopo la creazione del francobollo:
   - Se l'utente è autenticato → salva su Supabase (tabella stamps)
   - Se l'utente è guest → salva in localStorage come prima (fallback)
3. Per il salvataggio immagine, usa una di queste strategie (in ordine di preferenza):
   a. Supabase Storage: upload dell'immagine in un bucket "stamps", salva l'URL pubblico
   b. Base64: salva l'immagine come stringa base64 nel campo image_data (più semplice, ma più pesante)
4. Quando l'utente si logga dopo aver creato stamps come guest, migra gli stamps da localStorage a Supabase

VINCOLI:
- Non bloccare l'animazione di punch per il salvataggio (salva in background)
- Gestisci errori silenziosamente con retry
- Mantieni il funzionamento offline/guest
```

---

## STEP 5 — Pagina collezione personale (Stampbook)

```
Crea o sistema la pagina della collezione personale dell'utente (Stampbook).

REQUISITI:
1. Route: la pagina deve essere accessibile dopo il login
2. Carica tutti i francobolli dell'utente da Supabase (ordinati per created_at DESC)
3. Layout: griglia responsive di francobolli, design minimal
4. Ogni francobollo mostra: immagine, label (se presente), data di creazione
5. Header della pagina con:
   - Nome/email dell'utente
   - Numero totale di francobolli
   - Bottone "Condividi collezione" (per Step 6)
   - Bottone "Scarica collezione" (per Step 7)
6. Stato vuoto: messaggio friendly se non ci sono ancora francobolli, con CTA per crearne uno

VINCOLI:
- Stile coerente con il design esistente dell'app
- Loading skeleton mentre carica i dati
- La pagina deve essere navigabile senza ricaricare l'app (SPA)
```

---

## STEP 6 — Flusso di condivisione pubblica

```
Implementa la condivisione della collezione di francobolli tramite link pubblico.

COSA FARE:
1. Crea una route pubblica: /collection/:user_id (o simile, adatta al routing esistente)
2. Questa pagina NON richiede autenticazione
3. Carica i francobolli dell'utente tramite user_id dalla tabella stamps (le RLS permettono SELECT pubblico)
4. Layout simile alla pagina personale ma in modalità "sola lettura":
   - Nessun bottone di modifica/eliminazione
   - Header con "Collezione di [nome/email utente]"
   - Conteggio francobolli
5. Bottone "Copia link" nella pagina personale che copia l'URL pubblico negli appunti
6. Feedback visivo dopo la copia ("Link copiato! ✓")

VINCOLI:
- L'URL deve funzionare anche per utenti non registrati che lo ricevono
- Design pulito, minimal, che faccia bella figura se condiviso
- Aggiungi meta tag Open Graph basici per preview quando condiviso sui social
```

---

## STEP 7 — Download collezione

```
Aggiungi la possibilità di scaricare la collezione come immagine.

COSA FARE:
1. Nella pagina Stampbook, aggiungi un bottone "Scarica collezione"
2. Al click, genera un'immagine della griglia di francobolli usando html2canvas o una soluzione simile
3. Scarica come PNG con nome "figmatelia-collection.png"
4. In alternativa più semplice: scarica un singolo francobollo al click su di esso

VINCOLI:
- Se html2canvas non è disponibile nell'ambiente Figma Make, usa canvas API nativa
- Mostra un loading indicator durante la generazione
- L'immagine generata deve avere sfondo bianco e buona risoluzione
```

---

## STEP 8 — Test finale e polish

```
Fai un check finale di tutto il flusso end-to-end:

1. TEST AUTH:
   - Inserisci email → ricevi magic link → click → torna nell'app autenticato
   - Verifica che lo stato di login persista al refresh della pagina
   - Verifica logout funzionante

2. TEST STAMPS:
   - Crea un francobollo → verifica salvataggio su Supabase
   - Verifica che appaia nella collezione personale

3. TEST CONDIVISIONE:
   - Copia il link della collezione
   - Aprilo in una finestra in incognito → deve mostrare i francobolli senza login

4. TEST EDGE CASES:
   - Sessione scaduta → redirect al login
   - Nessun francobollo → stato vuoto corretto
   - Errore di rete → fallback graceful

5. POLISH:
   - Rimuovi console.log di debug
   - Verifica che non ci siano errori nella console del browser
   - Controlla responsive su mobile

Riporta i risultati di ogni test e proponi fix per eventuali problemi trovati.
```

---

## Note importanti

- **Supabase Dashboard**: ricordati di verificare manualmente nel dashboard Supabase che:
  - Site URL = URL di produzione figma.site
  - Redirect URLs includa l'URL di produzione
  - RLS sia abilitato sulla tabella stamps
  - Il bucket Storage (se usato) sia pubblico per le immagini

- **Variabili d'ambiente**: assicurati che `SUPABASE_URL` e `SUPABASE_ANON_KEY` siano configurati correttamente sia in locale che in produzione.

- **Figma Make**: alcune soluzioni potrebbero non funzionare nell'ambiente Figma Make. Testa ogni step direttamente nell'ambiente di produzione.