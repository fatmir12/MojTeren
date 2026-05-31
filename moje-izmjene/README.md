# MojTeren

MojTeren je full-stack web aplikacija za rezervaciju i upravljanje sportskim terenima. Podržava tri uloge — **korisnik**, **radnik** i **vlasnik** — s pregledom dostupnosti po satima, loyalty programom, obavijestima i izvještajima.

## Tehnologije

| Sloj | Stack |
|------|--------|
| Frontend | React 19, Vite, React Router, Axios, Tailwind CSS 4 |
| Backend | Node.js, Express 5, CORS |
| Podaci | JSON datoteka (`backend/src/data/mockData.json`) |

UI je na **bosanskom** jeziku. Dizajn koristi Plus Jakarta Sans i teal paletu.

---

## Pokretanje

Potrebna su **dva terminala** (frontend i backend).

### Frontend (root projekta)

```bash
npm install
npm run dev
```

Aplikacija: [http://localhost:5173](http://localhost:5173)

### Backend

```bash
cd backend
npm install
npm run dev
```

API: [http://localhost:5000](http://localhost:5000) (port se može promijeniti preko `PORT` u `.env`)

Frontend šalje zahtjeve na `http://localhost:5000/api` (vidi `src/services/api.js`).

### Produkcijski build (frontend)

```bash
npm run build
npm run preview
```

---

## Demo korisnici

| Uloga | Email | Lozinka |
|-------|--------|---------|
| Vlasnik (OWNER) | `Fatmir@test.com` | `123456` |
| Radnik (WORKER) | `Deni@test.com` | `123456` |
| Korisnik (USER) | `Matko@test.com` | `123456` |

---

## Uloge i rute

### Korisnik (USER)

| Stranica | Putanja | Opis |
|----------|---------|------|
| Početna | `/user/home` | Favoriti, brza rezervacija, loyalty, obavijesti |
| Tereni i rezervacije | `/user/courts` | Pregled 7 dana, filteri, modal rezervacije po satima |
| Historija | `/user/history` | Rezervacije, otkazivanje (24h pravilo), recenzije |
| Profil | `/user/profile` | Podaci, podsjetnici, loyalty bodovi |

`/user/reservation` preusmjerava na `/user/courts`.

### Radnik (WORKER)

| Stranica | Putanja | Opis |
|----------|---------|------|
| Dashboard | `/worker/dashboard` | Pregled dana |
| Rezervacije | `/worker/reservations` | Potvrda, otkaz, završetak |
| Raspored | `/worker/schedule` | Dnevni pregled |
| Termini | `/worker/terms` | Sedmični raspored, satnice, zaključavanje |
| Profil | `/worker/profile` | — |

### Vlasnik (OWNER)

| Stranica | Putanja | Opis |
|----------|---------|------|
| Dashboard | `/owner/dashboard` | Statistika |
| Objekti | `/owner/objects` | CRUD terena |
| Radnici | `/owner/workers` | CRUD radnika |
| Izvještaji | `/owner/reports` | Filteri, popunjenost, prihod |

---

## Glavne funkcionalnosti

### Rezervacije (korisnik)

- Pregled dostupnosti **po satima** (Slobodno / Rezervisano / Zaključano) za 7 dana
- Modal rezervacije: odabir datuma, klik na satnicu ili ručni period
- Filteri: sport, favoriti, slobodni danas, pretraga
- **Otkazivanje:** besplatno ako je više od **24h** do početka; inače bez povrata
- **Loyalty:** bodovi pri rezervaciji (10 po satu)
- **Favoriti**, **recenzije** nakon odigranog termina
- **Obavijesti** u aplikaciji (npr. potvrda, otkaz)

### Termini i zaključavanje (radnik)

- **Generisanje sedmice** — više dana odjednom
- Pregled satnica po objektu i datumu
- **Djelimično zaključavanje** — klik na slobodan sat; ponovni klik oslobađa
- **Zaključaj dan** — cijeli dan; aktivne rezervacije se otkazuju, korisnici dobijaju obavijest
- Ako na satu postoji rezervacija → potvrda u modalu prije zaključavanja
- Povrat loyalty bodova pri otkazu ako vrijedi pravilo 24h

### Izvještaji (vlasnik)

- Filter **od–do datuma** i **po objektu**
- Grafik **popunjenosti** (% rezervisanih vs slobodnih sati)
- **Prihod po objektu** i **po mjesecu**
- Pregled potvrđenih i otkazanih rezervacija u periodu

### UX

- **Toast** poruke (uspjeh / greška) umjesto poruka na vrhu stranice
- **Skeleton** loaderi na Terenima i Historiji
- **Mobilni prikaz** satnica — horizontalni scroll, veći tap targeti
- **PWA** — osnovni service worker (`public/sw.js`)

### Šta nije uključeno

- Online plaćanje (status `WAITING_PAYMENT` postoji u modelu, ali nema payment gatewaya)
- JWT / hash lozinki — demo autentifikacija preko JSON-a

---

## API (pregled)

Baza putanja: `http://localhost:5000/api`

### Auth

```
POST /auth/login
POST /auth/register
```

### Objekti

```
GET    /objects
POST   /objects
PUT    /objects/:id
DELETE /objects/:id
```

### Termini

```
GET    /terms
POST   /terms
POST   /terms/week          # generisanje sedmice
PUT    /terms/:id
POST   /terms/:id/lock      # zaključaj cijeli dan
POST   /terms/:id/lock-slots   # djelimično { hourStart } | { slots[] } | { startTime, endTime }
POST   /terms/:id/unlock-slots
DELETE /terms/:id
```

Termin može imati `lockedSlots: ["10:00", "14:00"]` (početak sata). `status: "LOCKED"` = cijeli dan.

### Rezervacije

```
GET    /reservations
POST   /reservations
POST   /reservations/:id/cancel
PUT    /reservations/:id
DELETE /reservations/:id
```

### Radnici

```
GET    /workers
POST   /workers
PUT    /workers/:id
DELETE /workers/:id
```

### Ostalo

```
GET    /notifications
PUT    /notifications/read-all
PUT    /notifications/:id/read

GET    /reviews
POST   /reviews

GET    /favorites?userId=
POST   /favorites/toggle

GET    /loyalty?userName=
PUT    /loyalty/reminders
```

---

## Struktura projekta

```
MojTeren/
├── public/
│   └── sw.js                 # service worker
├── src/
│   ├── components/           # Navbar, Sidebar, BookingModal, Toast, Skeleton…
│   ├── context/              # AuthContext, ToastContext
│   ├── layouts/              # Owner, Worker, User
│   ├── pages/
│   │   ├── auth/
│   │   ├── owner/
│   │   ├── worker/
│   │   └── user/
│   ├── routes/AppRoutes.jsx
│   ├── services/api.js
│   ├── styles/               # variables, global, dashboard, toast, skeleton…
│   └── utils/                # slotUtils, reportUtils, cancellationUtils…
├── backend/
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── services/         # notificationService
│       ├── utils/            # reservationRules, termLockUtils
│       ├── config/fileStorage.js
│       ├── data/mockData.json
│       └── server.js
└── README.md
```

---

## Poslovna pravila (sažetak)

| Pravilo | Ponašanje |
|---------|-----------|
| Otkazivanje | ≥ 24h prije termina → povrat novca i loyalty bodova |
| Zaključan sat/dan | Nema novih rezervacija; postojeće se otkazuju s obavijesti |
| Rezervacija | Ne smije preklapati zaključane sate ni druge aktivne rezervacije |
| Loyalty | 10 bodova po satu rezervacije |

---

## Skripte

| Komanda | Opis |
|---------|------|
| `npm run dev` | Frontend dev server (Vite) |
| `npm run build` | Produkcijski build |
| `npm run lint` | ESLint |
| `cd backend && npm run dev` | Backend s nodemonom |

---

## Autor

Fatmir Kurtisi
