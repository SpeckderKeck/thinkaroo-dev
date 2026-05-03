# wissivity

Educational Activity game

## Lokaler Start

### Nur Frontend (wie bisher)
Öffne `index.html` direkt im Browser.

### Mit globalem Kartensatz-Speicher (empfohlen)
Starte den integrierten Server, damit eigene Kartensätze über `/datasets` zentral gespeichert werden und auf allen Clients verfügbar sind:

```bash
node server.js
```

Danach im Browser öffnen:

- `http://localhost:3000`

Die Daten werden serverseitig in `data/custom-datasets.json` abgelegt.
Falls die API nicht erreichbar ist, nutzt die App automatisch den lokalen Browser-Speicher als Fallback.

Für Login-geschützte Kartensätze und Admin-Veröffentlichungen benötigt der Server diese `.env`-Werte:

```env
SUPABASE_URL=https://dein-projekt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=dein-service-role-key
DATASET_ADMIN_USER_IDS=supabase-user-id-1,supabase-user-id-2
```

Admins können Kartensätze als privat oder öffentlich speichern. Öffentliche Kartensätze werden über `/public-datasets` ohne Login ausgeliefert.

### CSV-Storage (Supabase, benutzerbezogen)
CSV-Uploads laufen im Frontend direkt über Supabase Storage in den Bucket `cardsets`.
Die Pfadkonvention ist:

```text
${auth.uid()}/${safeFileName}
```

Die Datei wird beim Upload zusätzlich lokal im Browser geparst, sodass die Karten direkt als Dataset gespeichert werden können (`custom_datasets.cards`).

#### Supabase-Setup
Die SQL für Bucket + Policies liegt in `supabase-user-csv-storage.sql`.

```bash
# in Supabase SQL Editor ausführen
supabase-user-csv-storage.sql
```

Die enthaltenen Policies erlauben lesen/schreiben/updaten/löschen nur im eigenen Prefix.

#### Legacy `/csv-files`
Die alten Server-Endpunkte unter `/csv-files` bleiben vorerst für Legacy-Migrationen bestehen,
werden aber im aktuellen Frontend nicht mehr verwendet.


## Zugriff von anderen Browsern/Geräten
Wenn die Webseite von einem anderen Host/Port geladen wird als der API-Server, setze die API-URL per Query-Parameter:

```text
https://deine-seite.example/?datasetsApi=http://SERVER-IP:3000
```

Die App merkt sich diesen Wert danach im Browser.
