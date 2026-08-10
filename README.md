# Node.js Eindwerk — Homelab Beheer API

REST API voor het beheer van een self-hosted homelab (Proxmox), gebouwd met Express, MongoDB en Mongoose. Via de API beheer je alles wat op je homelab draait: wie er toegang heeft, op welke servers services draaien en welke storingen er (geweest) zijn.

## Projectbeschrijving

De API is een volledig CRUD-systeem rond vier gelinkte resources (geen enkele staat los van de anderen):

| Resource      | Wat het is                                                                               |
| ------------- | ---------------------------------------------------------------------------------------- |
| **Users**     | Accounts met rol (guest/user/admin) en bcrypt-gehashte wachtwoorden, JWT-authenticatie   |
| **Servers**   | De VM's/LXC-containers op je Proxmox, met specs, status, eigenaar en geïnstalleerde apps |
| **Services**  | De applicaties (bv. Docker-containers) die op één of meerdere servers draaien            |
| **Incidents** | Storingen/tickets gelinkt aan een service en de melder, met status-timeline              |

Zie het [ER-diagram en de embed/reference-motivatie](docs/datamodel.md) voor de relaties tussen deze vier collecties.

## Live URL

`[LIVE URL HIER — wordt ingevuld na deployment, zie taak 46]`

Op dit moment draai je de API lokaal: `http://localhost:3000` (`GET /api/health` als rooktest).

## API-documentatie

De `http/`-map bevat [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)-bestanden die de hele API documenteren — één bestand per resource: [auth.http](http/auth.http), [users.http](http/users.http), [servers.http](http/servers.http), [services.http](http/services.http), [incidents.http](http/incidents.http).

**Hoe gebruik je REST Client** (VS Code-extensie "REST Client"):

1. Installeer de extensie in VS Code.
2. Start de API lokaal met `npm run dev`.
3. Open eender welk bestand uit `http/` en klik op **"Send Request"** dat boven elk request staat (of `Ctrl+Alt+R`).
4. Draai de requests van boven naar beneden: eerst register en login (via `# @name login` wordt het JWT-token automatisch doorgegeven aan alle volgende beveiligde requests via `{{login.response.body.$.token}}`), dan de CRUD-requests.
5. Vervang `@baseUrl = http://localhost:3000` door je live URL zodra die bestaat.

## Lokale setup

1. Clone de repo:
   ```bash
   git clone https://github.com/VIVES-Zuid/nodejs-ti-b-final-assignment-AidenStorme.git
   cd nodejs-ti-b-final-assignment-AidenStorme
   ```
2. Installeer de dependencies: `npm install`
3. Maak `.env` aan op basis van [`.env.example`](.env.example) (kopieer het bestand en vul de waarden in — zie de tabel hieronder): `cp .env.example .env`
4. Start de dev-server (herstart automatisch bij wijzigingen): `npm run dev`
5. Check dat alles draait: `GET http://localhost:3000/api/health` → `{"status":"ok"}`

**Test-data aanmaken:** registreer een account via de API, bv. met curl:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Aiden", "email": "aiden@example.com", "password": "test123"}'
```

Log daarna in (`POST /api/auth/login` met dezelfde email/wachtwoord) om een JWT-token te krijgen en gebruik dat in de `Authorization: Bearer <token>`-header voor de beveiligde endpoints.

## Environment variables

| Variabele    | Uitleg                                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| `MONGO_URI`  | Verbindingsstring naar je MongoDB (Atlas). **Nooit committen** — enkel in `.env` lokaal of in het deploy-dashboard    |
| `JWT_SECRET` | Geheime sleutel waarmee JSON Web Tokens ondertekend worden. Lange willekeurige string, bv. via `openssl rand -hex 32` |
| `PORT`       | Poort waar de server op luistert. Lokaal optioneel (fallback: 3000); op Render injecteert de host deze zelf           |

De vereiste variabelen staan ook in [`.env.example`](.env.example). Zie [DEPLOYMENT.md](DEPLOYMENT.md) voor de volledige deployment-stappen en hoe de variabelen daar in het dashboard komen.

## Tests

```bash
npm test
```

Draait de test-suite met de ingebouwde Node.js-testrunner (`node --test`): unit-tests (IPv4-validator, admin- en ObjectId-middleware) + integratietests (auth, users, servers, services, incidents). De integratietests gebruiken een **in-memory MongoDB** (`mongodb-memory-server`), je echte database blijft onaangeroerd.

## Rolgebaseerde toegang

Elke endpoint valt in één van drie niveaus: **gast** (geen token), **user** (ingelogd) en **admin**. Dezelfde matrix staat als commentaar bovenaan elk routerbestand in `routes/`.

| Endpoint                                             | Gast | User                             | Admin |
| ---------------------------------------------------- | ---- | -------------------------------- | ----- |
| `POST /api/auth/register`, `POST /api/auth/login`    | ✓    | ✓                                | ✓     |
| `GET /api/auth/me`                                   | –    | ✓                                | ✓     |
| `GET /`, `GET /:id` (servers/services/incidents)     | –    | ✓                                | ✓     |
| `POST /` (servers/services/incidents)                | –    | ✓                                | ✓     |
| `GET /api/servers/:id/services`                      | –    | ✓                                | ✓     |
| `PUT /:id` (users)                                   | –    | eigen profiel                    | ✓     |
| `PUT /:id` (servers)                                 | –    | eigenaar                         | ✓     |
| `PUT /:id` (services)                                | –    | eigenaar van een gelinkte server | ✓     |
| `PUT /:id` (incidents)                               | –    | reportedBy                       | ✓     |
| `GET /`, `GET /:id`, `POST /`, `DELETE /:id` (users) | –    | –                                | ✓     |
| `DELETE /:id` (servers/services/incidents)           | –    | –                                | ✓     |

Beveiligingsdetails: wachtwoorden worden bcrypt-gehasht (10 rounds), tokens vervallen na 1 uur, een gewone user kan zijn eigen rechten niet verhogen (`role` wordt stil genegeerd bij eigen profiel-updates) en een niet-bestaan/bestaand email + fout wachtwoord geven bewust dezelfde 401-melding.

