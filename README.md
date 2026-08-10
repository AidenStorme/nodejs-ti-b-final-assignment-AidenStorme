# Node.js Eindwerk — Homelab Beheer API

REST API voor het beheer van een self-hosted homelab (Proxmox): users, servers, services en incidenten, gebouwd met Express, MongoDB en Mongoose.

## Datamodel

De API gebruikt vier gelinkte collecties: **User**, **Server**, **Service** en **Incident**. Voor het volledige ER-diagram en de motivatie van elke embed- vs. reference-keuze, zie [docs/datamodel.md](docs/datamodel.md).