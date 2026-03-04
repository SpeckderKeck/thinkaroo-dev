# wissivity

Educational Activity game

## Lokaler Start

### Nur Frontend (wie bisher)
Öffne `index.html` direkt im Browser.

### Mit globalem Kartensatz-Speicher (empfohlen)
Starte den integrierten Server, damit eigene Kartensätze über `/api/custom-datasets` zentral gespeichert werden und auf allen Clients verfügbar sind:

```bash
node server.js
```

Danach im Browser öffnen:

- `http://localhost:3000`

Die Daten werden serverseitig in `data/custom-datasets.json` abgelegt.
Falls die API nicht erreichbar ist, nutzt die App automatisch den lokalen Browser-Speicher als Fallback.

### CSV-Storage (benutzerbezogen)
CSV-Uploads unter `/csv-files` werden benutzerbezogen gespeichert in:

```text
data/csv-store/<ownerId>/<dateiname>.csv
```

`<ownerId>` wird aus dem Request-Header `x-owner-id` (Fallback: `x-user-id`) gelesen.

#### Übergang von altem globalem CSV-Store
Frühere globale Dateien unter `data/csv-store/*.csv` werden nicht mehr automatisch gelistet.
Für eine Migration müssen vorhandene CSV-Dateien manuell in einen Benutzerordner verschoben werden,
z. B. nach `data/csv-store/<ownerId>/...`.


## Zugriff von anderen Browsern/Geräten
Wenn die Webseite von einem anderen Host/Port geladen wird als der API-Server, setze die API-URL per Query-Parameter:

```text
https://deine-seite.example/?datasetsApi=http://SERVER-IP:3000
```

Die App merkt sich diesen Wert danach im Browser.
