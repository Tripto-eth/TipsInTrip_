import os

# Contenuto del file Markdown
md_content = """# Roadmap: Clone di Flightlist.io (Search Engine Voli)

Questo documento descrive i passi necessari per costruire da zero un motore di ricerca voli flessibile basato sul modello di business delle affiliazioni.

---

## 1. Setup Infrastruttura Dati (Il Motore)
Il sito non possiede i dati dei voli, ma interroga dei fornitori esterni tramite API.

### Step 1: Travelpayouts (Già fatto)
- **Cosa fare:** Accedere al pannello [Travelpayouts](https://www.travelpayouts.com/).
- **Ottenere i parametri:** Recuperare il proprio **API Token** e il **Marker ID** (necessario per tracciare le vendite e ricevere le commissioni).
- **Abilitare i programmi:** - Unirsi al programma **Aviasales** (per dati generali e prezzi storici/cache).
    - Unirsi al programma **WayAway** (per dati in tempo reale).
    - Cercare il programma **Kiwi.com** (per le ricerche a date flessibili "Everywhere").

### Step 2: Accesso a Kiwi Tequila (Opzionale ma consigliato)
Per avere la stessa flessibilità di Flightlist (es: "Voli da Milano a Sud-est Asiatico nei prossimi 60 giorni"), è necessario l'accesso diretto a **Kiwi Tequila**.
- Registrarsi su [Tequila by Kiwi.com](https://tequila.kiwi.com/).
- Creare una "Soluzione" e ottenere la **API Key**.

---

## 2. Architettura Tecnica
Per un clone di Flightlist, la velocità è tutto.

### Stack Consigliato:
- **Frontend:** Next.js (React) + Tailwind CSS.
- **Backend:** Node.js (Express) o Python (FastAPI).
- **Database/Cache:** Redis (per salvare i risultati delle API per 6-12 ore ed evitare di pagare/esaurire le chiamate API).

### Flusso Dati:
1. L'utente inserisce la rotta (es: "Milano -> Thailandia").
2. Il server controlla se la ricerca è in **Cache (Redis)**.
3. Se non c'è, interroga l'**API di Kiwi o Travelpayouts**.
4. Il server formatta i dati (Prezzo, Compagnia, Link Affiliato).
5. Il frontend mostra i risultati ordinati per prezzo.

---

## 3. Implementazione Ricerca Flessibile (Core Feature)
Flightlist non cerca per "15 Maggio", ma per "Maggio". 

### Logica API (Esempio Kiwi):
Bisogna configurare la chiamata API con questi parametri:
- `fly_from`: Codice IATA (es: MIL)
- `fly_to`: Codice IATA o Regione (es: ASIA)
- `date_from`: Data inizio range
- `date_to`: Data fine range
- `one_for_city`: 1 (per mostrare solo il volo più economico per ogni città)

---

## 4. UI/UX Design (Look & Feel)
Flightlist ha successo perché è **estremamente pulito**.
- **Header:** Input di ricerca (Origine, Destinazione, Range Date).
- **Risultati:** Lista verticale semplice.
- **Call to Action:** Un tasto "Book" o "Select" che rimanda al sito partner con il tuo codice affiliato.

---

## 5. Monetizzazione
1. L'utente clicca su un volo.
2. Il link di destinazione deve essere formattato come **Deep Link Affiliato**.
   *Esempio:* `https://c.tp.st/XXXXXXXX?u=https://www.kiwi.com/it/search/results/...`
3. Se l'utente acquista entro 30 giorni, ricevi una commissione (solitamente tra l'1% e il 1.5% del costo totale del viaggio).

---

## 6. Prossimi Passi Immediati
1. [ ] Definire il dominio (es: *nomadflights.com*).
2. [ ] Sviluppare il prototipo della barra di ricerca.
3. [ ] Testare la prima chiamata API con il Token di Travelpayouts.
4. [ ] Creare il sistema di generazione automatica dei link affiliati.

---
*Nota: Non è necessario gestire i pagamenti. La responsabilità legale e l'assistenza clienti sono a carico di Kiwi/Aviasales.*
"""

# Salva il file
with open("flightlist_clone_roadmap.md", "w", encoding="utf-8") as f:
    f.write(md_content)

print("File .md generato correttamente.")