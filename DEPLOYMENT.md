# Deployment Guide — Homelab Beheer API op Render

Stap-voor-stap gids om deze Node.js API live te zetten op [Render](https://render.com), een PaaS die je GitHub-repo automatisch bouwt en draait. Je hebt nodig: een GitHub-account (met deze repo), een Render-account en de MongoDB Atlas-cluster uit de voorbereiding.

Test je lokale setup vóór je begint: `npm install`, dan `npm run dev` — als `GET http://localhost:3000/api/health` → `200` geeft, is de code klaar voor deployment.

---

## 1. MongoDB Atlas connection string klaarzetten

De API heeft drie environment variables nodig. Welke benoemd zijn, staat in het bestand `.env.example` (dat wordt gecommit; `.env` zelf niet — daar staan de echte geheimen):

```
MONGO_URI=
JWT_SECRET=
PORT=
```

Haal de connection string uit je MongoDB Atlas-cluster (cloud.mongodb.com → je cluster → Connect → **Drivers**). Een geldige URI ziet er zo uit:

```
mongodb+srv://<user>:<password>@<cluster>.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

Zorg dat:

- er een database-user bestaat (Database Access) met wachtwoord,
- je in de URI **vóór het `?`** een databasenaam plakt, bv. `...mongodb.net/eindwerk?retryWrites=...`, en
- **Network Access** op `0.0.0.0/0` staat (IP-whitelist "allow from anywhere"). Dat is voor een studentenproject aanvaardbaar omdat alleen je connection-string (met user + wachtwoord) toegang geeft; leg dit uit in je mondelinge verdediging.

Diezelfde drie waarden plak je straks letterlijk in het Render-dashboard (stap 4) — Render leest geen lokaal `.env`-bestand uit je repo (dat is ook genegeerd in git).

## 2. Render-account en "New Web Service"

> **Deployment gebeurt vanuit een persoonlijke mirror-repo.** De schoolorganisatie `VIVES-Zuid` staat geen toegang toe aan third-party GitHub-apps zoals Render, waardoor Render de originele repo niet kan zien of verbinden. Daarom wordt er een persoonlijke (mirror-)repo bijgehouden op `AidenStorme/nodejs-ti-b-final-assignment-AidenStorme` en gedeployed vanuit die repo. De mirror wordt bijgewerkt met deze remote/push-commando's:
>
> ```bash
> git remote add mirror https://github.com/AidenStorme/nodejs-ti-b-final-assignment-AidenStorme.git
> git push mirror main
> ```
>
> (Is de remote al toegevoegd, dan volstaat `git push mirror main`.) Render selecteer je dus de repo van je persoonlijke account, niet die van `VIVES-Zuid`.

1. Maak een gratis account op [render.com](https://render.com) (inloggen met GitHub is makkelijkst — Render kan dan direct je repo's zien).
2. Klik in het dashboard op **New +** → **Web Service**.
3. Verbind je GitHub-account als dat nog niet gebeurd is en selecteer de repo `nodejs-ti-b-final-assignment-AidenStorme` van je persoonlijke account (de mirror). Render pikt de branch (`main`) en het pad (repo-root) automatisch op.

[SCREENSHOT: Render dashboard — New Web Service knop]
[SCREENSHOT: Repo-selectie in de "New Web Service"-flow]

## 3. Build- en start-command

Render toont een formulier met velden. Vul in:

| Veld              | Waarde                 | Waarom                                       |
| ----------------- | ---------------------- | -------------------------------------------- |
| **Name**          | bv. `mijn-homelab-api` | bepaalt je live URL                          |
| **Runtime**       | `Node`                 | Render detecteert dit meestal zelf           |
| **Build Command** | `npm install`          | installeert de dependencies uit package.json |
| **Start Command** | `npm start`            | draait het `start`-script = `node index.js`  |

[SCREENSHOT: Formulier met Build Command en Start Command ingevuld]

Het `start`-script staat al in `package.json`:

```json
"start": "node index.js"
```

## 4. Environment variables instellen

Scroll in hetzelfde formulier naar **Environment** → **Add Environment Variable** en voeg drie waarden toe (exact dezelfde namen als in `.env.example`):

| Key          | Value                                                                        |
| ------------ | ---------------------------------------------------------------------------- |
| `MONGO_URI`  | jouw volledige Atlas-connection string (incl. databasenaam)                  |
| `JWT_SECRET` | een lange willekeurige string, lokaal gegenereerd met `openssl rand -hex 32` |
| `NODE_ENV`   | `production` (zie stap 5)                                                    |

**`PORT` zet je NIET zelf.** Render draait je app altijd achter een eigen proxy en injecteert zelf een poortnummer als omgevingsvariabele. Je code moet dus luisteren op `process.env.PORT` met een fallback voor lokaal draaien. Gecontroleerd: `index.js` heeft exact dat:

```js
// index.js
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => ...);
```

Lokaal (zonder `PORT` in `.env`) valt hij terug op 3000; op Render gebruikt hij de geïnjecteerde poort. Verander dit dus **niet** naar een hardcoded 3000 — dan crasht de app op Render (poort bezet) of draait hij onbereikbaar.

[SCREENSHOT: Environment variables-sectie in het Render-formulier]

## 5. NODE_ENV=production

In dezelfde Environment-sectie voeg je ook toe:

```
NODE_ENV=production
```

Render zet dat eigenlijk al automatisch, maar expliciet zetten is goed voor de duidelijkheid: Express gaat hiermee in productiemodus (minder logging, optimalisaties, andere error-formattering dan de dev-stack).

## 6. Deployen en de live status bekijken

1. Klik onderaan het formulier op **Create Web Service**.
2. Render begint meteen: eerst de build (`npm install`), daarna de start (`npm start`). De eerste keer duurt dit enkele minuten.
3. Zodra de status **Live** wordt, vind je je URL bovenaan de servicepagina, in de vorm `https://mijn-homelab-api.onrender.com`.

[SCREENSHOT: Servicepagina met status Live en de URL]

**Test je deploy** door in de browser of in je `.http`-bestanden te openen:

```
GET https://mijn-homelab-api.onrender.com/api/health
```

Verwacht: `{"status":"ok"}`. Daarna kun je in `http/*.http` de `@baseUrl` vervangen door je live URL en de volledige API doorlopen.

**Logs** vind je op dezelfde servicepagina via het tabblad **Logs** (of **Events** voor build-problemen). Hier zie je onder andere `Verbonden met MongoDB` en `Server draait op poort <nummer>` als alles goed ging.

[SCREENSHOT: Logs-tabblad van de service]

**Live URL + deze link** horen straks in de `README.md` (nodig voor de opdracht). Je kunt je API-documentatie live vastleggen door `http/`-bestanden te committen — beschouw `DEPLOYMENT.md` zelf als onderdeel van de documentatie (vereiste 15 uit de checklist).

## 7. Troubleshooting

Alle fouten zijn terug te vinden in het **Logs**-tabblad. De meest voorkomende problemen:

**A. `MongoServerSelectionError` / `getaddrinfo ENOTFOUND ...`**

- **Mogelijke oorzaak:** de IP-whitelist van Atlas staat niet op `0.0.0.0/0` (Render draait vanuit wisselende IP's).
- **Herken in logs:** `MongooseServerSelectionError: Could not connect to any servers` of een DNS-fout op je cluster-hostname.
- **Oplossing:** Atlas → Network Access → Add IP Address → `0.0.0.0/0` → Save, en opnieuw deployen (Settings → **Manual Deploy** → Deploy latest commit).

**B. `EADDRINUSE` of de app draait maar de URL geeft 404/timeout**

- **Mogelijke oorzaak:** `PORT` staat nog hardcoded op 3000 ergens (of je hebt `PORT` lokaal als omgevingsvariabele gezet).
- **Herken in logs:** `EADDRINUSE: address already in use :::3000` of de app start niet.
- **Oplossing:** staat er ergens `app.listen(3000, ...)`? Vervang door `process.env.PORT || 3000` (zie stap 4). Verwijder een eventueel zelf ingestelde `PORT`-variabele uit het dashboard (Render injected die zelf).

**C. `Command failed with exit code 1` bij de build**

- **Mogelijke oorzaak:** verkeerd build-command, bv. `npm install && npm start` in het build-veld, of een typfout in `package.json`.
- **Herken in logs:** het Build-tabblad toont de NPM-foutmelding.
- **Oplossing:** zet Build Command terug op exact `npm install` en Start Command op exact `npm start`. Controleer met `npm run` lokaal dat het script bestaat.

**D. `Cannot find module 'express'` (of een ander pakket) bij het starten**

- **Mogelijke oorzaak:** `node_modules` is mee gecommit geweest in een oude commit of dependencies ontbreken.
- **Herken in logs:** `Error: Cannot find module 'express'`.
- **Oplossing:** controleer dat `node_modules/` in `.gitignore` staat en in geen enkele (oude) commit zit; de build moet zelf `npm install` draaien.

**E. `UnauthorizedError` / `JWT_SECRET` is undefined bij login**

- **Mogelijke oorzaak:** `JWT_SECRET` ontbreekt in de Render-environment.
- **Herken in logs:** een error die naar `jwt.sign` of `secretOrPrivateKey` verwijst, of login geeft 500.
- **Oplossing:** voeg `JWT_SECRET` toe in Environment (stap 4) en deploy opnieuw.

**F. App start wel maar `/api/health` geeft 404**

- **Mogelijke oorzaak:** verkeerde URL (een andere folder is gedeployed) of de service draait nog een oude build.
- **Herken in logs:** geen `Verbonden met MongoDB` of `Server draait`-regels.
- **Oplossing:** check de Events/logs van de build en doe Settings → Manual Deploy → Deploy latest commit.

---

**Checklist vóór je live gaat:** cluster op Atlas ✓, `0.0.0.0/0` ✓, `.env.example` gecommit met de juiste variabelennamen ✓, `index.js` gebruikt `process.env.PORT || 3000` ✓, `npm start` werkt lokaal ✓.
