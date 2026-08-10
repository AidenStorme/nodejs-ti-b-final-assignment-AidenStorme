# Node.js Eindwerk — Cursusgids

> Referentiedocument voor het bouwen van de Node.js REST API opdracht (VIVES, Toegepaste Informatica).
> Bron: officiële cursusrepo [VIVES-Zuid/node](https://github.com/VIVES-Zuid/node) ([gerenderde site](https://vives-zuid.github.io/node/)) door Dirk Hostens & Milan Dima, aangevuld met de opdrachtomschrijving en de "Node.js Notes for Professionals" PDF als achtergrondreferentie.
> Doelpubliek: iemand die lang geleden voor het laatst Node.js deed — alles wordt stap voor stap uitgelegd, geen kennis wordt als vanzelfsprekend beschouwd.

---

## 0. De opdracht in één oogopslag

Je bouwt een Node.js REST API, dient die op tijd in, en verdedigt ze mondeling. Alle drie (code, indiening, verdediging) moeten in orde zijn.

**Verplichte onderdelen:**

| # | Eis |
|---|---|
| 1 | Express API met **minstens 17 endpoints** |
| 2 | **Minstens 4 datacollecties** die aan elkaar gelinkt zijn (geen losstaande collecties) |
| 3 | **MongoDB** als database, **Mongoose** voor modellering |
| 4 | **Embedded documents by default**, references enkel met sterke reden + uitleg |
| 5 | **JWT-authenticatie** (of gelijkaardig), tokens **niet oneindig geldig** |
| 6 | **Geen hardcoded connection strings** — environment variables |
| 7 | Gebruikers kunnen **hun eigen rechten niet verhogen** (guest → user → admin) |
| 8 | **Input validatie** op alle inkomende data |
| 9 | **ObjectId-validatie** vóór elke MongoDB read/write |
| 10 | **Error handling** die de API nooit laat crashen |
| 11 | **Middleware** waar nodig — niet meer dan nodig |
| 12 | **Unit- en integratietests** (geen minimum coverage, wel zinvol) |
| 13 | REST Client `.http`-bestanden (of Postman-collectie geëxporteerd, zonder tokens) |
| 14 | Stap-voor-stap **deployment guide** |
| 15 | **Live URL** + link naar API-documentatie in `README.md` |
| 16 | Push naar **GitHub Classroom minstens 1 week vóór** je mondeling |
| 17 | Klein, incrementeel commit-gedrag (één grote eerste commit = plagiaatrisico) |
| 18 | Inschrijvingsformulier invullen (link via Toledo) |

**Belangrijkste valkuilen:**
- Eén reuzegrote eerste commit → plagiaatvlag. Commit vanaf dag 1, klein en regelmatig.
- "4 collecties gelinkt" wil zeggen: elk van de 4 staat via een relatie (referentie of embedding) met minstens één andere — niks mag volledig op zichzelf staan.
- Embedding is de **standaard**; je moet in je documentatie/mondeling kunnen uitleggen *waarom* je op een bepaalde plek toch met een reference werkt (bv. many-to-many, document te groot, onafhankelijke levenscyclus).
- "Geen oneindige tokens" ≠ "geen refresh nodig" — een JWT met `expiresIn` volstaat, een refresh-token-flow is een plus maar niet verplicht.
- Privilege-escalatie voorkomen betekent: een gewone user mag zichzelf nooit `role: admin` kunnen geven via een PUT/PATCH op zijn eigen profiel.

---

## 1. Bronnen

- **Officiële cursus (leidend, hier volgen we die):** https://github.com/VIVES-Zuid/node — 13 hoofdstukken, elk met slides en labo's.
- **Gerenderde site:** https://vives-zuid.github.io/node/
- Achtergrond-naslagwerk (algemene Node.js patronen, niet cursusspecifiek, geen JWT-hoofdstuk): *Node.js Notes for Professionals* (GoalKicker), door jou geüpload.
- Officiële docs: [Node.js](https://nodejs.org/docs/), [Express](https://expressjs.com/), [MongoDB](https://docs.mongodb.com/), [Mongoose](https://mongoosejs.com/docs/).

De cursusrepo is opgebouwd als een leerpad: Intro → Modules → NPM → Express → Middleware → Async → MongoDB → Validatie → Modeling → Auth → Error handling → Testing → Deployment. We volgen die volgorde ook in het taskboard.

---

## 2. Node.js basisbegrippen (Hoofdstuk 1-2)

**Wat is Node.js?** Een omgeving om JavaScript *buiten de browser* te draaien — bijvoorbeeld op een server. Het gebruikt de V8-engine (dezelfde als Chrome) en is **single-threaded met een event loop**: er is één "hoofd-draad" die taken afhandelt, maar trage taken (bestand lezen, database-aanvraag, netwerkverzoek) worden op de achtergrond weggezet zodat Node ondertussen andere dingen kan doen. Daarom is zowat alles in Node **asynchroon** (zie sectie 6).

**Modules.** Elk `.js`-bestand is een module. Je deelt code met `module.exports` (CommonJS, wat de cursus gebruikt) of `export`/`import` (ES6, moderner). Je haalt een module binnen met `require('./bestand')` of `require('pakketnaam')` voor een geïnstalleerd npm-pakket.

```js
// wiskunde.js
function optellen(a, b) { return a + b; }
module.exports = { optellen };

// index.js
const { optellen } = require('./wiskunde');
console.log(optellen(2, 3)); // 5
```

**Belangrijke ingebouwde modules:** `http` (webserver zonder framework), `fs` (bestanden), `path`, `events` (EventEmitter — de basis onder heel Node's async-gedrag).

---

## 3. NPM & package.json (Hoofdstuk 3)

`npm` (Node Package Manager) installeert en beheert externe bibliotheken ("packages").

- `npm init -y` → maakt `package.json` aan (het "paspoort" van je project: naam, versie, dependencies, scripts).
- `npm install express` → installeert een package en zet hem in `dependencies`.
- `npm install --save-dev nodemon` → een dev-dependency (enkel nodig tijdens ontwikkelen, niet in productie).
- `npm run <scriptnaam>` → voert een script uit dat je zelf definieert in `"scripts"` in `package.json`, bv. `"dev": "nodemon server.js"`.
- **Semver** (semantic versioning): `MAJOR.MINOR.PATCH`, bv. `4.18.2`. `^4.18.2` in package.json betekent "elke 4.x.x mag geïnstalleerd worden, maar geen 5.0.0".
- `node_modules/` nooit committen naar git — zet hem in `.gitignore`. `package-lock.json` wél committen (legt exacte versies vast).

---

## 4. Express — de basis van je API (Hoofdstuk 4)

Express is een minimalistisch framework bovenop Node's `http`-module dat routing en middleware makkelijk maakt.

```js
const express = require('express');
const app = express();
app.use(express.json()); // laat Express JSON in de request body lezen (req.body)

app.get('/api/students', (req, res) => {
  res.json([{ id: 1, name: 'Aiden' }]);
});

app.listen(3000, () => console.log('Server draait op poort 3000'));
```

**De 4 basis HTTP-methodes voor een REST API (CRUD):**

| HTTP-methode | Betekenis | Voorbeeld endpoint |
|---|---|---|
| `GET` | Lezen | `GET /api/students` (allemaal), `GET /api/students/:id` (één) |
| `POST` | Aanmaken | `POST /api/students` |
| `PUT`/`PATCH` | Bijwerken | `PUT /api/students/:id` |
| `DELETE` | Verwijderen | `DELETE /api/students/:id` |

`:id` is een **route parameter** — je leest hem via `req.params.id`. Query parameters (`?page=2`) lees je via `req.query.page`.

**17 endpoints halen:** met 4 collecties en volledige CRUD (GET-all, GET-one, POST, PUT, DELETE = 5 per collectie) kom je al aan 20. Voeg daar gerichte extra's aan toe zoals `POST /api/auth/register`, `POST /api/auth/login`, of geneste routes zoals `GET /api/students/:id/enrollments`.

**Router-modules:** splits je routes per collectie in een eigen bestand (`routes/students.js`) en koppel ze in `server.js` met `app.use('/api/students', studentsRouter)`. Zo blijft je project overzichtelijk — dit is ook wat de cursus als "modular express application" aanleert.

---

## 5. Middleware (Hoofdstuk 5)

Een middleware is een functie die tussen de binnenkomende request en je route-handler zit: `(req, res, next) => {...}`. Ze kan de request aanpassen, controleren, loggen, of stoppen (bv. bij een ongeldige token).

```js
function logger(req, res, next) {
  console.log(`${req.method} ${req.url}`);
  next(); // ZONDER next() blijft de request hangen!
}
app.use(logger);
```

**Soorten:**
- **Ingebouwd:** `express.json()`, `express.static()`.
- **Third-party:** `helmet` (basisbeveiliging via HTTP-headers), `morgan` (request-logging), `cors` (cross-origin requests toelaten).
- **Eigen middleware:** bv. `auth.js` (JWT controleren), `admin.js` (rol controleren), `validateObjectId.js`.

Regel uit de opdracht: "middleware waar nodig, niet meer dan nodig" — bouw dus geen middleware voor dingen die één `if` in de route ook oplost, maar herbruikbare logica (auth, validatie, logging) hoort wél in middleware.

---

## 6. Asynchrone JavaScript (Hoofdstuk 6)

Omdat Node non-blocking is, moet je met asynchrone code kunnen werken. Er zijn 3 stijlen, van oud naar nieuw:

1. **Callbacks** (ouderwets, leidt tot "callback hell" — geneste functies die onleesbaar worden).
2. **Promises** — een object dat een toekomstige waarde vertegenwoordigt: `.then()` / `.catch()`.
3. **Async/await** (wat je in de praktijk overal gebruikt) — laat asynchrone code er *synchroon* uitzien:

```js
async function haalStudent(id) {
  try {
    const student = await Student.findById(id); // wacht tot de database antwoordt
    return student;
  } catch (err) {
    console.error(err);
  }
}
```

**Cruciaal voor Express-routes:** elke route-handler die met de database praat moet `async` zijn en zijn `await`-calls in een `try/catch` zetten — anders crasht een fout in een async functie je server niet netjes maar hangt de request, of (erger) crasht het hele proces. Zie hoofdstuk 11 (error handling) voor de nette oplossing met een wrapper-functie.

---

## 7. MongoDB & Mongoose — CRUD (Hoofdstuk 7)

**MongoDB** is een document-database: geen tabellen/rijen zoals SQL, maar collecties met JSON-achtige documenten. **Mongoose** is de bibliotheek die je gebruikt om vanuit Node met MongoDB te praten via **schema's** en **modellen**.

```js
const mongoose = require('mongoose');
await mongoose.connect(process.env.MONGO_URI); // NOOIT hardcoded!

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, min: 0 },
});
const Student = mongoose.model('Student', studentSchema);
```

**CRUD met Mongoose:**

```js
await Student.create({ name: 'Aiden', age: 22 });      // Create
await Student.find();                                   // Read — allemaal
await Student.findById(id);                              // Read — één
await Student.findByIdAndUpdate(id, { age: 23 }, { new: true }); // Update
await Student.findByIdAndDelete(id);                     // Delete
```

`{ new: true }` bij een update zorgt dat je het *bijgewerkte* document terugkrijgt in plaats van het oude.

**Querying/filtering:** `Student.find({ age: { $gte: 18 } })`, sorteren met `.sort({ name: 1 })`, pagineren met `.skip()` en `.limit()`.

---

## 8. Data-validatie (Hoofdstuk 8)

Twee soorten validatie die de opdracht apart vermeldt:

### 8.1 Input-validatie (op alle inkomende data)

Mongoose-schema's valideren al veel automatisch:

```js
const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, match: /.+@.+\..+/ },
  age: { type: Number, min: 0, max: 130 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
});
```

Voor extra/eigen regels: **custom validators** in het schema, of een aparte validatielaag vóór je met de database praat (bv. met `joi` of `express-validator` — de cursus behandelt eigen Mongoose-validators; een extra validatiepakket is een prima, veelgebruikte aanvulling zolang je uitlegt waarom).

### 8.2 ObjectId-validatie (vóór elke read/write met een `:id`)

Elk MongoDB-document heeft een `_id` van het type `ObjectId` (een specifiek 24-tekens hexadecimaal formaat). Als iemand een ongeldige waarde in de URL zet (`GET /api/students/hallo`), crasht een naïeve `findById('hallo')` niet, maar geeft hij een verwarrende error. Valideer dus **eerst**:

```js
const mongoose = require('mongoose');

function validateObjectId(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Ongeldig ID formaat' });
  }
  next();
}
```

Dit is een perfect voorbeeld van herbruikbare middleware — zet hem vóór elke route met een `:id`-parameter.

---

## 9. Mongoose Modeling — Embedding vs. Referencing (Hoofdstuk 9)

**Dit hoofdstuk is essentieel voor de opdracht**, want die eist expliciet "embedded by default, references enkel met sterke reden, en leg uit waarom."

### Embedding (documenten in elkaar nesten)

```js
const orderSchema = new mongoose.Schema({
  customer: { name: String, email: String },   // embedded, geen aparte collectie
  items: [{ productName: String, qty: Number }] // array van sub-documenten
});
```

- **Voordeel:** één database-call haalt alles op (snel, geen extra `.populate()` nodig).
- **Gebruik wanneer:** de data hoort *altijd* samen bij het hoofddocument, wordt zelden los opgevraagd, en groeit niet onbeperkt (bv. adres van een klant, items van één bestelling).

### Referencing (linken naar een document in een andere collectie)

```js
const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  course:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
});
// ophalen mét de gelinkte data:
await Enrollment.find().populate('student').populate('course');
```

- **Gebruik wanneer:** de data een **eigen levenscyclus** heeft (een Student bestaat los van zijn inschrijvingen), het een **many-to-many**-relatie is (studenten ↔ cursussen via een Enrollment-collectie), het gelinkte document vaak **apart** wordt opgevraagd/bewerkt, of embedding het document **onbeperkt zou laten groeien** (bv. duizenden reviews in één product-document).

### Praktische aanpak voor "4 gelinkte collecties"

Een veelgebruikt, verdedigbaar patroon:
- **User** (referentie naar…)
- **Post/Order/Project** — hoofdcollectie, met een `owner`-referentie naar User
- **Comment/Item/Task** — gerefereerd óf embedded in de hoofdcollectie (dit is exact het punt waar je moet motiveren)
- **Category/Tag** — gerefereerd vanuit de hoofdcollectie

Zolang elke collectie via `ref` of embedding met minstens één andere verbonden is, voldoe je aan "geen losstaande collecties." Documenteer per relatie kort *waarom* je voor embed of reference koos — dat is letterlijk wat je mondeling gevraagd zal worden.

---

## 10. Authenticatie & Autorisatie (Hoofdstuk 10)

### 10.1 Wachtwoorden hashen

Wachtwoorden **nooit** in platte tekst opslaan. Gebruik `bcrypt`:

```js
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(plainPassword, 10); // 10 = aantal "salt rounds"
const isCorrect = await bcrypt.compare(plainPassword, hash);
```

### 10.2 JWT — JSON Web Token

Een JWT is een ondertekend "bewijsstukje" dat de server aan de gebruiker geeft na een geslaagde login, en dat de gebruiker vervolgens bij elke request meestuurt om te bewijzen wie hij is — zonder dat de server een sessie moet bijhouden ("stateless").

```js
const jwt = require('jsonwebtoken');

// bij login:
const token = jwt.sign(
  { id: user._id, role: user.role },   // payload
  process.env.JWT_SECRET,               // geheime sleutel, NOOIT hardcoded
  { expiresIn: '1h' }                   // VERPLICHT: nooit oneindig geldig
);
```

De client stuurt die token daarna mee in de `Authorization`-header: `Authorization: Bearer <token>`.

### 10.3 Auth-middleware (route beschermen)

```js
function auth(req, res, next) {
  const header = req.header('Authorization');
  const token = header && header.split(' ')[1]; // 'Bearer <token>' → pak het tweede stuk
  if (!token) return res.status(401).json({ error: 'Geen token, toegang geweigerd' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // gooit een error als ongeldig/verlopen
    next();
  } catch {
    res.status(400).json({ error: 'Ongeldige token' });
  }
}
```

### 10.4 Rolgebaseerde autorisatie (guest / user / admin)

```js
function admin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Geen toegang' });
  next();
}
// gebruik: app.delete('/api/students/:id', auth, admin, controller.remove);
```

**Privilege-escalatie voorkomen:** als een gebruiker zijn eigen profiel bewerkt (`PUT /api/users/me`), mag het `role`-veld **nooit** rechtstreeks vanuit `req.body` overschreven worden. Whitelist expliciet welke velden een gewone user mag aanpassen (bv. `name`, `email`) en negeer `role` tenzij de ingelogde gebruiker zelf al admin is.

### 10.5 Uitloggen

Bij JWT is er geen server-side sessie om "te verwijderen" — de gangbare aanpak in de cursus is dat de client de token gewoon weggooit. Server-side blokkeren (token-blacklist) is een plus, niet verplicht.

---

## 11. Error Handling (Hoofdstuk 11)

De opdracht eist: **de API mag in geen enkel scenario crashen.**

### 11.1 Synchrone fouten

Een gewone `try/catch` rond code die direct kan falen (bv. `JSON.parse`).

### 11.2 Asynchrone fouten in Express — de wrapper-truc

Een `throw` binnen een `async`-routehandler wordt normaal NIET automatisch door Express opgevangen (tenzij je een recente Express-versie met ingebouwde async-support gebruikt). De veilige, cursus-conforme aanpak is een wrapper:

```js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next); // stuurt elke fout door naar de error-middleware
};

router.get('/:id', asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ error: 'Niet gevonden' });
  res.json(student);
}));
```

### 11.3 Centrale error-middleware

Een Express error-middleware herken je aan **4 parameters** (`err, req, res, next`) — Express roept die automatisch aan zodra ergens `next(err)` gebeurt. Zet die helemaal onderaan, na al je routes:

```js
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Er ging iets mis op de server' });
});
```

### 11.4 Twee laatste vangnetten (proces-niveau)

```js
process.on('unhandledRejection', (err) => { console.error(err); });
process.on('uncaughtException', (err) => { console.error(err); /* daarna netjes afsluiten */ });
```

Deze vangen fouten op die door de mazen van je eigen error-handling glippen, zodat het hele Node-proces niet crasht.

---

## 12. Testing (Hoofdstuk 12)

De cursus gebruikt de **ingebouwde Node.js testrunner** (`node:test`, geen extra package nodig) samen met `node:assert`.

```js
// students.test.js
const { test } = require('node:test');
const assert = require('node:assert');

test('optellen werkt correct', () => {
  assert.strictEqual(1 + 1, 2);
});
```

Uitvoeren: `node --test`.

**Async testen:**

```js
test('haalt een student op', async () => {
  const student = await Student.findById(bekendId);
  assert.strictEqual(student.name, 'Aiden');
});
```

**Integratietests van je API** (HTTP-requests simuleren zonder een echte server te starten) doe je typisch met **`supertest`** naast de ingebouwde testrunner:

```js
const request = require('supertest');
const app = require('../app');

test('GET /api/students geeft 200', async () => {
  const res = await request(app).get('/api/students');
  assert.strictEqual(res.status, 200);
});
```

**Mocking:** `node:test` heeft ingebouwde `t.mock` om functies te vervangen door nepversies (handig om bv. een database-call te "faken" in een unit test).

**Wat testen?** Geen minimumdekking vereist, maar zorg voor een geloofwaardige mix:
- Unit tests: validatie-logica, helper-functies, misschien een custom validator.
- Integratietests: minstens de belangrijkste endpoints per collectie (happy path + één foutscenario, bv. 404 en 401).

Gebruik een **aparte test-database** (of een in-memory MongoDB zoals `mongodb-memory-server`) zodat tests je echte data niet aanraken.

---

## 13. Deployment (Hoofdstuk 13)

### 13.1 Voorbereiden voor productie

- Alle geheimen (`MONGO_URI`, `JWT_SECRET`, poortnummer) in een `.env`-bestand, geladen via het `dotenv`-pakket, **nooit gecommit** (`.env` in `.gitignore`; wel een `.env.example` met lege/dummy-waarden committen).
- `NODE_ENV=production` zetten op de server.
- `helmet` en `cors` correct configureren.

### 13.2 Waar hosten?

De cursus somt op, van eenvoudig naar geavanceerd:
- **Render / Railway** — gratis/goedkope PaaS, koppel gewoon je GitHub-repo, zet environment variables in hun dashboard. Makkelijkste optie voor een studentenproject.
- **Supabase** — vooral voor Postgres, minder relevant hier met MongoDB, tenzij je Edge Functions gebruikt.
- **Linux VM** (GCP/Azure/Oracle Cloud gratis tier) — meer controle, meer werk: Node installeren, `pm2` gebruiken om het proces "in leven te houden" (herstart automatisch bij crash of reboot), eventueel Nginx als reverse proxy ervoor.
- Andere opties: Fly.io, Koyeb, Vercel (minder geschikt voor een lang-draaiende Express + MongoDB-server, eerder voor serverless).

Voor een studentenproject met een deadline is **Render of Railway** meestal de snelste, meest betrouwbare keuze.

### 13.3 MongoDB zelf hosten

Gebruik **MongoDB Atlas** (gratis tier) in plaats van zelf MongoDB te installeren op je server — geeft je meteen een connection string voor in je `.env`.

---

## 14. Documentatie & testbestanden

- **REST Client `.http`-bestanden** (VS Code-extensie "REST Client"): één bestand per collectie met voorbeeldrequests, bv.:

```http
### Alle studenten ophalen
GET http://localhost:3000/api/students

### Nieuwe student aanmaken
POST http://localhost:3000/api/students
Content-Type: application/json

{
  "name": "Aiden",
  "age": 22
}
```

  Als REST Client geen optie is: exporteer je volledige **Postman-collectie** (JSON) en commit die — zonder auth-tokens erin.
- **Deployment guide**: apart `.md`-bestand of sectie, stap voor stap zoals je het zelf deed (van "clone de repo" tot "de API is live op url X").
- **README.md** moet minstens bevatten: projectbeschrijving, live URL, link naar API-documentatie, hoe lokaal op te zetten, welke environment variables nodig zijn (namen, niet de waarden).

---

## 15. Checklist — koppeling opdracht ↔ cursushoofdstuk

| Opdrachtvereiste | Cursushoofdstuk |
|---|---|
| Express API, 17+ endpoints | H4 Express, H5 Middleware |
| 4 gelinkte collecties, embedding vs reference | H7 MongoDB, H9 Mongoose Modeling |
| Mongoose modellering | H7, H9 |
| JWT auth, geen oneindige tokens | H10 Auth & Auth |
| Geen privilege-escalatie | H10 (rolgebaseerde autorisatie) |
| Env variables, geen hardcoded strings | H13 Deployment (12-Factor-principe) |
| Input- en ObjectId-validatie | H8 Data Validation |
| Error handling, geen crashes | H11 Error Handling |
| Middleware, niet meer dan nodig | H5 Middleware |
| Unit- & integratietests | H12 Testing |
| REST Client / Postman + deployment guide | H13 Deployment |
| Live URL + docs in README | H13 Deployment |
| Kleine, incrementele commits | (algemene git-hygiëne, geen apart hoofdstuk) |

---

## 16. Mini-woordenlijst

- **Endpoint** — een specifieke combinatie van HTTP-methode + URL die je API aanbiedt (bv. `GET /api/students`).
- **Middleware** — een functie die tussen request en antwoord zit.
- **Schema** — de "blauwdruk" van hoe een document eruitziet (Mongoose).
- **Model** — de "fabriek" die op basis van een schema documenten aanmaakt/opvraagt in een collectie.
- **ObjectId** — het unieke ID-formaat van MongoDB-documenten.
- **JWT** — JSON Web Token, een ondertekend token om een gebruiker te identificeren zonder server-side sessie.
- **Populate** — Mongoose-functie om een gerefereerd document automatisch mee op te halen.
- **Embedding** — een (sub)document letterlijk in het hoofddocument opslaan, i.p.v. te linken.
- **Environment variable** — een instelling (zoals een wachtwoord of connection string) die buiten je code, in de omgeving van het besturingssysteem/hostingplatform, staat.
