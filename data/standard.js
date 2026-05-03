(() => {
  const databases = (globalThis.CARD_DATABASES = globalThis.CARD_DATABASES || {});

  const explainTerms = [
    "Zeitmaschine",
    "Popcornmaschine",
    "Kopfkino",
    "Schneekugel",
    "Hängematte",
    "Wasserkraftwerk",
    "Schatzkarte",
    "Geheimagent",
    "Traumjob",
    "Sonnencreme",
    "Kaugummiautomat",
    "Wundertüte",
    "Luftschloss",
    "Wolkenkratzer",
    "Lieblingslied",
    "Feuerwerk",
    "Heimweh",
    "Fernweh",
    "Gedächtnis",
    "Achterbahn",
    "Zukunft",
    "Vergangenheit",
    "Superkraft",
    "Pausenglocke",
    "Handschuh",
    "Sturmlaterne",
    "Wunschliste",
    "Roadtrip",
    "Rucksacktour",
    "Pizzalieferung",
    "Zaubertrick",
    "Geheimversteck",
    "Taschenlampe",
    "Kellerabteil",
    "Gipfelkreuz",
    "Skaterpark",
    "Spickzettel",
    "Pausenbrot",
    "Schultüte",
    "Notfallplan",
    "Bauchgefühl",
    "Traumberuf",
    "Lieblingsfarbe",
    "Selbstvertrauen",
    "Kompromiss",
    "Teamgeist",
    "Fairplay",
    "Mutprobe",
    "Ritual",
    "Schnäppchen",
    "Geduldsfaden",
    "Sternschnuppe",
    "Nordlicht",
    "Mikroabenteuer",
    "Wochenende",
    "Feierabend",
    "Mittagstief",
    "Frühlingsgefühle",
    "Sommergewitter",
    "Herbstlaub",
    "Winterblues",
    "Regenbogen",
    "Schattenseite",
    "Lernkurve",
    "Aha-Moment",
    "Konzentration",
    "Lampenfieber",
    "Ausrede",
    "Vorurteil",
    "Erinnerung",
    "Zufall",
    "Plan B",
    "Glücksbringer",
    "Hausordnung",
    "Regelwerk",
    "Schlafrhythmus",
    "Lieblingsplatz",
    "Warteschlange",
    "Streitschlichtung",
    "Kreativpause",
    "To-do-Liste",
    "Zeitdruck",
    "Gruppendruck",
    "Dankbarkeit",
    "Hoffnung",
    "Heimatgefühl",
    "Abenteuerlust",
    "Durchhaltevermögen",
    "Kopfsalat",
    "Morgensport",
    "Abendroutine",
    "Krisenstimmung",
    "Sparfuchs",
    "Doppelgänger",
    "Neuanfang",
    "Stolperfalle",
    "Überraschung",
    "Wortspiel",
    "Gedankenblase",
    "Fremdschämen"
];

  const drawTerms = [
    "Regenschirm",
    "Kaktus",
    "Toaster",
    "Fernbedienung",
    "Wasserflasche",
    "Trommel",
    "Schnecke",
    "Rakete",
    "Mikrofon",
    "Luftballon",
    "Koffer",
    "Sandburg",
    "Fahrradhelm",
    "Zahnbürste",
    "Schneemann",
    "Leuchtturm",
    "Kühlschrank",
    "Pinguin",
    "Giraffe",
    "Sonnenbrille",
    "Ananas",
    "Trampolin",
    "Keksdose",
    "Kerze",
    "Kompass",
    "Wolke",
    "Maus",
    "Schlitten",
    "Kamera",
    "Briefkasten",
    "Bratpfanne",
    "Schaufel",
    "Rucksack",
    "Mütze",
    "Hängeschloss",
    "Banane",
    "Treppe",
    "Brezel",
    "Stoppuhr",
    "Kochtopf",
    "Schmetterling",
    "Besen",
    "Sofa",
    "Kronleuchter",
    "Brücke",
    "Berg",
    "Insel",
    "Palme",
    "Taucherbrille",
    "Füller",
    "Notizbuch",
    "Mülleimer",
    "Wäscheklammer",
    "Kopfhörer",
    "Lautsprecher",
    "Pizza",
    "Eiswaffel",
    "Keks",
    "Torte",
    "Würfel",
    "Spielkarte",
    "Schachfigur",
    "Joystick",
    "Laptop",
    "Tablet",
    "Drachen",
    "Zelt",
    "Campingtisch",
    "Angelrute",
    "Schiff",
    "Anker",
    "U-Boot",
    "Wasserfall",
    "Vulkan",
    "Mond",
    "Stern",
    "Saturn",
    "Roboter",
    "Ampel",
    "Bus",
    "Traktor",
    "Bagger",
    "Feuerwehrauto",
    "Krankenwagen",
    "Polizeiauto",
    "Rollschuh",
    "Skateboard",
    "E-Gitarre",
    "Klavier",
    "Geige",
    "Saxofon",
    "Trompete",
    "Kirsche",
    "Erdbeere",
    "Wassermelone",
    "Brokkoli",
    "Karotte",
    "Maiskolben",
    "Schraubenzieher",
    "Hammer"
];

  const pantomimeTerms = [
    "Zähne putzen",
    "Haare föhnen",
    "Kaffee umrühren",
    "Pizza belegen",
    "Koffer packen",
    "Schnürsenkel binden",
    "Fenster putzen",
    "Staubsaugen",
    "Wäsche aufhängen",
    "Hemden bügeln",
    "Schneeball werfen",
    "Schlitten fahren",
    "Ski fahren",
    "Snowboarden",
    "Schwimmen",
    "Tauchen",
    "Schnorcheln",
    "Fahrrad fahren",
    "Inlineskaten",
    "Skateboard fahren",
    "Basketball dribbeln",
    "Fußball jonglieren",
    "Tennis aufschlagen",
    "Golf abschlagen",
    "Yoga machen",
    "Meditieren",
    "Liegestütze machen",
    "Seilspringen",
    "Tanzen",
    "Walzer tanzen",
    "Breakdance",
    "Singen",
    "Dirigieren",
    "Gitarre spielen",
    "Klavier spielen",
    "Trommeln",
    "Angeln",
    "Zelt aufbauen",
    "Lagerfeuer machen",
    "Marshmallows rösten",
    "Wandern",
    "Klettern",
    "Fotografieren",
    "Selfie machen",
    "Telefonieren",
    "Nachricht tippen",
    "Videospiel spielen",
    "Buch lesen",
    "Hausaufgaben machen",
    "Präsentieren",
    "Winken",
    "Applaudieren",
    "Gähnen",
    "Niesen",
    "Husten",
    "Lachen",
    "Weinen",
    "Staunen",
    "Erschrecken",
    "Schlafen",
    "Aufwachen",
    "Frühstücken",
    "Kaugummi kauen",
    "Eis essen",
    "Suppe löffeln",
    "Wasser trinken",
    "Geschenk auspacken",
    "Kerzen auspusten",
    "Geburtstag feiern",
    "Auto einparken",
    "Tanken",
    "Bus fahren",
    "Zug fahren",
    "Flugzeug starten",
    "Rudern",
    "Segeln",
    "Surfen",
    "Wäsche falten",
    "Pflanzen gießen",
    "Rasen mähen",
    "Unkraut jäten",
    "Schraube eindrehen",
    "Nagel hämmern",
    "Malerrolle benutzen",
    "Treppen steigen",
    "Hampelmann machen",
    "Zeitung austragen",
    "Einkaufen",
    "Anstehen",
    "Rechnung bezahlen",
    "Schlüssel suchen",
    "Brille putzen",
    "Kuchen schneiden",
    "Teig kneten",
    "Kekse ausstechen",
    "Schach spielen",
    "Karten mischen",
    "Würfeln",
    "Puzzle legen",
    "Ballon aufblasen"
];

const quizItems = [
    {
        "question": "Wie heißt die Hauptstadt von Deutschland?",
        "answer": "Berlin"
    },
    {
        "question": "Wie heißt die Hauptstadt von Frankreich?",
        "answer": "Paris"
    },
    {
        "question": "Wie heißt die Hauptstadt von Italien?",
        "answer": "Rom"
    },
    {
        "question": "Wie heißt die Hauptstadt von Spanien?",
        "answer": "Madrid"
    },
    {
        "question": "Wie heißt die Hauptstadt von Portugal?",
        "answer": "Lissabon"
    },
    {
        "question": "Wie heißt die Hauptstadt der Niederlande?",
        "answer": "Amsterdam"
    },
    {
        "question": "Wie heißt die Hauptstadt von Belgien?",
        "answer": "Brüssel"
    },
    {
        "question": "Wie heißt die Hauptstadt von Österreich?",
        "answer": "Wien"
    },
    {
        "question": "Wie heißt die Hauptstadt der Schweiz?",
        "answer": "Bern"
    },
    {
        "question": "Wie heißt die Hauptstadt von Polen?",
        "answer": "Warschau"
    },
    {
        "question": "Wie heißt die Hauptstadt von Tschechien?",
        "answer": "Prag"
    },
    {
        "question": "Wie heißt die Hauptstadt von Schweden?",
        "answer": "Stockholm"
    },
    {
        "question": "Wie heißt die Hauptstadt von Norwegen?",
        "answer": "Oslo"
    },
    {
        "question": "Wie heißt die Hauptstadt von Dänemark?",
        "answer": "Kopenhagen"
    },
    {
        "question": "Wie heißt die Hauptstadt von Finnland?",
        "answer": "Helsinki"
    },
    {
        "question": "Wie heißt die Hauptstadt von Irland?",
        "answer": "Dublin"
    },
    {
        "question": "Wie heißt die Hauptstadt von Griechenland?",
        "answer": "Athen"
    },
    {
        "question": "Wie heißt die Hauptstadt von Ungarn?",
        "answer": "Budapest"
    },
    {
        "question": "Wie heißt die Hauptstadt von Kanada?",
        "answer": "Ottawa"
    },
    {
        "question": "Wie heißt die Hauptstadt von Australien?",
        "answer": "Canberra"
    },
    {
        "question": "Wie viele Tage hat eine Woche?",
        "answer": "7"
    },
    {
        "question": "Wie viele Monate hat ein Jahr?",
        "answer": "12"
    },
    {
        "question": "Wie viele Minuten hat eine Stunde?",
        "answer": "60"
    },
    {
        "question": "Wie viele Sekunden hat eine Minute?",
        "answer": "60"
    },
    {
        "question": "Wie viele Stunden hat ein Tag?",
        "answer": "24"
    },
    {
        "question": "Wie viele Kontinente gibt es?",
        "answer": "7"
    },
    {
        "question": "Wie viele Farben hat ein klassischer Regenbogen?",
        "answer": "7"
    },
    {
        "question": "Wie viele Ecken hat ein Dreieck?",
        "answer": "3"
    },
    {
        "question": "Wie viele Seiten hat ein Quadrat?",
        "answer": "4"
    },
    {
        "question": "Wie viele Seiten hat ein Würfel?",
        "answer": "6"
    },
    {
        "question": "Wie viele Beine hat eine Spinne?",
        "answer": "8"
    },
    {
        "question": "Wie viele Spieler hat eine Fußballmannschaft auf dem Feld?",
        "answer": "11"
    },
    {
        "question": "Wie viele Saiten hat eine klassische Gitarre?",
        "answer": "6"
    },
    {
        "question": "Welche Farbe entsteht aus Blau und Gelb?",
        "answer": "Grün"
    },
    {
        "question": "Welche Farbe entsteht aus Rot und Blau?",
        "answer": "Lila"
    },
    {
        "question": "Welcher Planet ist als Roter Planet bekannt?",
        "answer": "Mars"
    },
    {
        "question": "Welcher Planet ist der größte im Sonnensystem?",
        "answer": "Jupiter"
    },
    {
        "question": "Wie heißt unser Stern?",
        "answer": "Sonne"
    },
    {
        "question": "Wie heißt der natürliche Satellit der Erde?",
        "answer": "Mond"
    },
    {
        "question": "Wie heißt der höchste Berg der Erde?",
        "answer": "Mount Everest"
    },
    {
        "question": "Welches ist das größte Landtier?",
        "answer": "Afrikanischer Elefant"
    },
    {
        "question": "Welches ist das schnellste Landtier?",
        "answer": "Gepard"
    },
    {
        "question": "Welches Organ pumpt Blut durch den Körper?",
        "answer": "Herz"
    },
    {
        "question": "Welches Gas brauchen Menschen zum Atmen?",
        "answer": "Sauerstoff"
    },
    {
        "question": "Welches Gas atmen Pflanzen überwiegend ein?",
        "answer": "Kohlenstoffdioxid"
    },
    {
        "question": "Wie lautet die chemische Formel von Wasser?",
        "answer": "H2O"
    },
    {
        "question": "Wie lautet das chemische Symbol für Gold?",
        "answer": "Au"
    },
    {
        "question": "Wie lautet das chemische Symbol für Silber?",
        "answer": "Ag"
    },
    {
        "question": "Wie lautet das chemische Symbol für Natrium?",
        "answer": "Na"
    },
    {
        "question": "Wie nennt man gefrorenes Wasser?",
        "answer": "Eis"
    },
    {
        "question": "Welches Instrument hat 88 Tasten?",
        "answer": "Klavier"
    },
    {
        "question": "Wer schrieb 'Faust'?",
        "answer": "Johann Wolfgang von Goethe"
    },
    {
        "question": "Wer malte die Mona Lisa?",
        "answer": "Leonardo da Vinci"
    },
    {
        "question": "Wer komponierte die 9. Sinfonie?",
        "answer": "Ludwig van Beethoven"
    },
    {
        "question": "In welchem Land steht das Kolosseum?",
        "answer": "Italien"
    },
    {
        "question": "In welcher Stadt steht der Eiffelturm?",
        "answer": "Paris"
    },
    {
        "question": "In welchem Land liegen die Pyramiden von Gizeh?",
        "answer": "Ägypten"
    },
    {
        "question": "Welche Währung hat die USA?",
        "answer": "US-Dollar"
    },
    {
        "question": "Welche Währung hat Japan?",
        "answer": "Yen"
    },
    {
        "question": "Welche Währung hat Großbritannien?",
        "answer": "Pfund Sterling"
    },
    {
        "question": "Wie heißt die Währung der Schweiz?",
        "answer": "Schweizer Franken"
    },
    {
        "question": "Wie heißt die Währung in der Eurozone?",
        "answer": "Euro"
    },
    {
        "question": "Welches Meer liegt zwischen Europa und Afrika?",
        "answer": "Mittelmeer"
    },
    {
        "question": "Welcher Ozean ist der größte?",
        "answer": "Pazifischer Ozean"
    },
    {
        "question": "Welcher Ozean liegt zwischen Amerika und Europa?",
        "answer": "Atlantischer Ozean"
    },
    {
        "question": "Wie heißt der längste Fluss Europas?",
        "answer": "Wolga"
    },
    {
        "question": "Wie heißt der längste Fluss der Welt (oft genannt)?",
        "answer": "Nil"
    },
    {
        "question": "Welche Sprache spricht man in Brasilien?",
        "answer": "Portugiesisch"
    },
    {
        "question": "Welche Sprache spricht man in Mexiko überwiegend?",
        "answer": "Spanisch"
    },
    {
        "question": "Wie nennt man die Wissenschaft vom Wetter?",
        "answer": "Meteorologie"
    },
    {
        "question": "Wie nennt man die Wissenschaft von Karten und Ländern?",
        "answer": "Geografie"
    },
    {
        "question": "Wie nennt man den Tagesbeginn?",
        "answer": "Morgen"
    },
    {
        "question": "Wie nennt man den Tagesabschluss?",
        "answer": "Abend"
    },
    {
        "question": "Welcher Tag folgt auf Montag?",
        "answer": "Dienstag"
    },
    {
        "question": "Welcher Tag folgt auf Freitag?",
        "answer": "Samstag"
    },
    {
        "question": "Welcher Monat folgt auf März?",
        "answer": "April"
    },
    {
        "question": "Welcher Monat hat normalerweise 28 Tage?",
        "answer": "Februar"
    },
    {
        "question": "Welche Jahreszeit folgt auf den Sommer?",
        "answer": "Herbst"
    },
    {
        "question": "Welche Jahreszeit folgt auf den Winter?",
        "answer": "Frühling"
    },
    {
        "question": "Wie heißt der 25. Dezember?",
        "answer": "Erster Weihnachtstag"
    },
    {
        "question": "Was feiert man an Silvester?",
        "answer": "Den Jahreswechsel"
    },
    {
        "question": "Wie viele Zentimeter sind ein Meter?",
        "answer": "100"
    },
    {
        "question": "Wie viele Meter sind ein Kilometer?",
        "answer": "1000"
    },
    {
        "question": "Wie viele Gramm sind ein Kilogramm?",
        "answer": "1000"
    },
    {
        "question": "Wie viele Milliliter sind ein Liter?",
        "answer": "1000"
    },
    {
        "question": "Wie viele Zähne hat ein Erwachsener meist?",
        "answer": "32"
    },
    {
        "question": "Wie nennt man ein Tier, das Pflanzen frisst?",
        "answer": "Pflanzenfresser"
    },
    {
        "question": "Wie nennt man ein Tier, das Fleisch frisst?",
        "answer": "Fleischfresser"
    },
    {
        "question": "Welches Tier legt Eier und ist ein Säugetier?",
        "answer": "Schnabeltier"
    },
    {
        "question": "Wie nennt man den Nachwuchs des Hundes?",
        "answer": "Welpe"
    },
    {
        "question": "Wie nennt man den Nachwuchs der Katze?",
        "answer": "Kätzchen"
    },
    {
        "question": "Welches Verkehrsmittel fährt auf Schienen?",
        "answer": "Zug"
    },
    {
        "question": "Welches Verkehrsmittel landet auf einer Landebahn?",
        "answer": "Flugzeug"
    },
    {
        "question": "Welches Verkehrsmittel fährt unter Wasser?",
        "answer": "U-Boot"
    },
    {
        "question": "Wie nennt man ein Haus aus Schnee?",
        "answer": "Iglu"
    },
    {
        "question": "Welches Gerät misst die Zeit beim Sport?",
        "answer": "Stoppuhr"
    },
    {
        "question": "Womit misst man Temperatur?",
        "answer": "Thermometer"
    },
    {
        "question": "Womit sieht man weit entfernte Sterne besser?",
        "answer": "Teleskop"
    },
    {
        "question": "Wie nennt man ein Bild aus sehr vielen Fotoselbstporträts?",
        "answer": "Selfie-Collage"
    },
    {
        "question": "Wie heißt das Gegenteil von kalt?",
        "answer": "Warm"
    }
];

  const masterQuizItems = [
    {
      question: "Welcher Mathematiker bewies 1994 den Großen Fermatschen Satz?",
      answer: "Andrew Wiles",
    },
    {
      question: "Wie heißt das Enzym, das DNA anhand einer RNA-Vorlage synthetisiert?",
      answer: "Reverse Transkriptase",
    },
    {
      question: "Welche Stadt war Hauptstadt des Byzantinischen Reiches?",
      answer: "Konstantinopel",
    },
    {
      question: "Welche physikalische Konstante verbindet Energie und Frequenz in E = h · f?",
      answer: "Plancksches Wirkungsquantum",
    },
    {
      question: "Wer schrieb den Roman „Der Mann ohne Eigenschaften“?",
      answer: "Robert Musil",
    },
    {
      question: "Wie nennt man in der Logik einen Schluss vom Allgemeinen auf das Besondere?",
      answer: "Deduktion",
    },
    {
      question: "Welches chemische Element hat das Symbol W?",
      answer: "Wolfram",
    },
    {
      question: "Welche Schlacht beendete 1815 Napoleons Herrschaft endgültig?",
      answer: "Schlacht bei Waterloo",
    },
    {
      question: "Wie heißt die kleinste positive ganze Zahl, die durch alle Zahlen von 1 bis 10 teilbar ist?",
      answer: "2520",
    },
    {
      question: "Welcher Philosoph prägte den Begriff des kategorischen Imperativs?",
      answer: "Immanuel Kant",
    },
    {
      question: "Welche RNA-Art transportiert Aminosäuren zum Ribosom?",
      answer: "tRNA",
    },
    {
      question: "Wie heißt der erste allgemein anerkannte moderne Computerprogramm-Entwurf von Ada Lovelace?",
      answer: "Algorithmus für die Bernoulli-Zahlen",
    },
    {
      question: "Welcher Komponist schrieb die Oper „Der Ring des Nibelungen“?",
      answer: "Richard Wagner",
    },
    {
      question: "Welche Zahl ist die Summe der ersten zehn Primzahlen?",
      answer: "129",
    },
    {
      question: "Wie heißt die Theorie, nach der Kontinente auf tektonischen Platten wandern?",
      answer: "Plattentektonik",
    },
    {
      question: "Welches Organell enthält bei Eukaryoten den Großteil der zellulären DNA?",
      answer: "Zellkern",
    },
    {
      question: "Wer formulierte das nach ihm benannte Gesetz der elektromagnetischen Induktion?",
      answer: "Michael Faraday",
    },
    {
      question: "Welche Sprache verfasste Vergil überwiegend?",
      answer: "Latein",
    },
    {
      question: "Wie heißt der Prozess, bei dem ein Atomkern ein Alphateilchen aussendet?",
      answer: "Alphazerfall",
    },
    {
      question: "Welches Land wurde historisch als Abessinien bezeichnet?",
      answer: "Äthiopien",
    },
    {
      question: "Welche mathematische Struktur besitzt genau eine Verknüpfung mit Assoziativität, neutralem Element und inversen Elementen?",
      answer: "Gruppe",
    },
    {
      question: "Wer schrieb das Drama „Woyzeck“?",
      answer: "Georg Büchner",
    },
    {
      question: "Welche Einheit misst die magnetische Flussdichte im SI-System?",
      answer: "Tesla",
    },
    {
      question: "Wie heißt der größte bekannte Mond des Saturn?",
      answer: "Titan",
    },
    {
      question: "Welche Epoche der europäischen Kunstgeschichte folgt grob auf die Renaissance?",
      answer: "Barock",
    },
    {
      question: "Welches Molekül ist der wichtigste direkte Energieträger in Zellen?",
      answer: "ATP",
    },
    {
      question: "Wie heißt die geometrische Fläche aller Punkte mit gleicher Summe der Abstände zu zwei Brennpunkten?",
      answer: "Ellipse",
    },
    {
      question: "Wer entwickelte die Mengenlehre maßgeblich im 19. Jahrhundert?",
      answer: "Georg Cantor",
    },
    {
      question: "Welche antike Bibliothek war besonders mit der hellenistischen Gelehrsamkeit in Ägypten verbunden?",
      answer: "Bibliothek von Alexandria",
    },
    {
      question: "Wie nennt man den Übergang eines Stoffes vom festen direkt in den gasförmigen Zustand?",
      answer: "Sublimation",
    },
  ];

  const singleChoiceItems = [
    {
      question: "Was ist die Hauptstadt von Kasachstan?",
      answer: "Astana",
      wrongAnswers: ["Almaty", "Taschkent", "Bischkek"],
    },
    {
      question: "Welche Einheit misst elektrische Ladung?",
      answer: "Coulomb",
      wrongAnswers: ["Volt", "Watt", "Tesla"],
    },
    {
      question: "Wer schrieb „Der Steppenwolf“?",
      answer: "Hermann Hesse",
      wrongAnswers: ["Thomas Mann", "Franz Kafka", "Bertolt Brecht"],
    },
    {
      question: "Was beschreibt die Schrödinger-Gleichung?",
      answer: "Wellenfunktion eines Quantensystems",
      wrongAnswers: ["Thermodynamische Zustände", "Relativität von Raum und Zeit", "Elektromagnetische Felder"],
    },
    {
      question: "Welches Element hat die Ordnungszahl 26?",
      answer: "Eisen",
      wrongAnswers: ["Kupfer", "Zink", "Nickel"],
    },
    {
      question: "Was ist die größte Wüste der Welt?",
      answer: "Antarktis",
      wrongAnswers: ["Sahara", "Gobi", "Kalahari"],
    },
    {
      question: "Welche Sprache gehört zur finno-ugrischen Familie?",
      answer: "Ungarisch",
      wrongAnswers: ["Russisch", "Deutsch", "Spanisch"],
    },
    {
      question: "Was misst ein Barometer?",
      answer: "Luftdruck",
      wrongAnswers: ["Temperatur", "Luftfeuchtigkeit", "Windgeschwindigkeit"],
    },
    {
      question: "Wer entdeckte die Penicillin-Wirkung?",
      answer: "Alexander Fleming",
      wrongAnswers: ["Louis Pasteur", "Robert Koch", "Marie Curie"],
    },
    {
      question: "Was ist ein Neutron?",
      answer: "Elektrisch neutrales Teilchen",
      wrongAnswers: ["Positiv geladen", "Negativ geladen", "Photon"],
    },
    {
      question: "Was ist die Ableitung von sin(x)?",
      answer: "cos(x)",
      wrongAnswers: ["-sin(x)", "-cos(x)", "tan(x)"],
    },
    {
      question: "Welches Land hat die meisten Einwohner?",
      answer: "Indien",
      wrongAnswers: ["China", "USA", "Indonesien"],
    },
    {
      question: "Was beschreibt die Entropie?",
      answer: "Maß für Unordnung",
      wrongAnswers: ["Energieinhalt", "Geschwindigkeit", "Temperatur"],
    },
    {
      question: "Wer malte die Mona Lisa?",
      answer: "Leonardo da Vinci",
      wrongAnswers: ["Michelangelo", "Raphael", "Donatello"],
    },
    {
      question: "Was ist ein Isotop?",
      answer: "Gleiches Element, unterschiedliche Neutronenzahl",
      wrongAnswers: ["Unterschiedliche Elemente", "Gleiche Moleküle", "Ionisierte Atome"],
    },
    {
      question: "Was ist die Lichtgeschwindigkeit im Vakuum?",
      answer: "ca. 300.000 km/s",
      wrongAnswers: ["150.000 km/s", "1.000.000 km/s", "30.000 km/s"],
    },
    {
      question: "Was ist ein Vektor?",
      answer: "Größe mit Betrag und Richtung",
      wrongAnswers: ["Nur Betrag", "Nur Richtung", "Nur Zahl"],
    },
    {
      question: "Wer entwickelte die Relativitätstheorie?",
      answer: "Albert Einstein",
      wrongAnswers: ["Isaac Newton", "Galileo Galilei", "Niels Bohr"],
    },
    {
      question: "Was ist ein Algorithmus?",
      answer: "Schritt-für-Schritt-Anweisung",
      wrongAnswers: ["Hardware", "Programmiersprache", "Speicher"],
    },
    {
      question: "Was ist DNA?",
      answer: "Träger genetischer Information",
      wrongAnswers: ["Protein", "Zellmembran", "Enzym"],
    },
    {
      question: "Was ist die Hauptstadt von Kanada?",
      answer: "Ottawa",
      wrongAnswers: ["Toronto", "Vancouver", "Montreal"],
    },
    {
      question: "Was beschreibt die Photosynthese?",
      answer: "Umwandlung von Licht in chemische Energie",
      wrongAnswers: ["Atmung", "Verdauung", "Bewegung"],
    },
    {
      question: "Was ist π ungefähr?",
      answer: "3,1416",
      wrongAnswers: ["2,718", "1,618", "0,577"],
    },
    {
      question: "Wer schrieb „Faust“?",
      answer: "Goethe",
      wrongAnswers: ["Schiller", "Lessing", "Kafka"],
    },
    {
      question: "Was ist ein Schwarzes Loch?",
      answer: "Region mit extremer Gravitation",
      wrongAnswers: ["Stern", "Planet", "Komet"],
    },
    {
      question: "Was ist die SI-Einheit der Energie?",
      answer: "Joule",
      wrongAnswers: ["Watt", "Newton", "Pascal"],
    },
    {
      question: "Was ist ein Polygon?",
      answer: "Vieleck",
      wrongAnswers: ["Kreis", "Linie", "Punkt"],
    },
    {
      question: "Was ist ein Proton?",
      answer: "Positiv geladenes Teilchen",
      wrongAnswers: ["Neutral", "Negativ", "Photon"],
    },
    {
      question: "Was ist die Hauptstadt von Australien?",
      answer: "Canberra",
      wrongAnswers: ["Sydney", "Melbourne", "Perth"],
    },
    {
      question: "Was misst ein Thermometer?",
      answer: "Temperatur",
      wrongAnswers: ["Druck", "Geschwindigkeit", "Energie"],
    },
    {
      question: "Was ist ein Integral?",
      answer: "Flächeninhalt unter Kurve",
      wrongAnswers: ["Ableitung", "Punkt", "Linie"],
    },
    {
      question: "Wer entdeckte Amerika?",
      answer: "Christoph Kolumbus",
      wrongAnswers: ["Magellan", "Cook", "Vespucci"],
    },
    {
      question: "Was ist eine Zelle?",
      answer: "Kleinste lebende Einheit",
      wrongAnswers: ["Molekül", "Atom", "Organ"],
    },
    {
      question: "Was ist ein Quadrat?",
      answer: "Viereck mit gleichen Seiten",
      wrongAnswers: ["Dreieck", "Kreis", "Linie"],
    },
    {
      question: "Was ist Gravitation?",
      answer: "Anziehungskraft",
      wrongAnswers: ["Abstoßung", "Energie", "Licht"],
    },
    {
      question: "Was ist ein Molekül?",
      answer: "Verbundene Atome",
      wrongAnswers: ["Einzelatom", "Ion", "Elektron"],
    },
    {
      question: "Was ist ein Gen?",
      answer: "DNA-Abschnitt",
      wrongAnswers: ["Protein", "Zelle", "Organ"],
    },
    {
      question: "Was ist die Hauptstadt von Japan?",
      answer: "Tokio",
      wrongAnswers: ["Osaka", "Kyoto", "Hiroshima"],
    },
    {
      question: "Was ist ein Stromkreis?",
      answer: "Geschlossener elektrischer Weg",
      wrongAnswers: ["Offener Draht", "Batterie", "Widerstand"],
    },
    {
      question: "Was ist ein Stern?",
      answer: "Leuchtender Himmelskörper",
      wrongAnswers: ["Planet", "Asteroid", "Komet"],
    },
    {
      question: "Was ist ein Bruch?",
      answer: "Teil eines Ganzen",
      wrongAnswers: ["Ganze Zahl", "Variable", "Funktion"],
    },
    {
      question: "Was ist ein Computer?",
      answer: "Maschine zur Datenverarbeitung",
      wrongAnswers: ["Buch", "Tisch", "Werkzeug"],
    },
    {
      question: "Was ist ein Virus?",
      answer: "Infektiöser Partikel",
      wrongAnswers: ["Bakterium", "Pilz", "Pflanze"],
    },
    {
      question: "Was ist ein Ökosystem?",
      answer: "Wechselwirkung von Lebewesen und Umwelt",
      wrongAnswers: ["Einzelorganismus", "Molekül", "Planet"],
    },
    {
      question: "Was ist ein Planet?",
      answer: "Himmelskörper, der einen Stern umkreist",
      wrongAnswers: ["Stern", "Asteroid", "Galaxie"],
    },
    {
      question: "Was ist ein Rechteck?",
      answer: "Viereck mit rechten Winkeln",
      wrongAnswers: ["Dreieck", "Kreis", "Linie"],
    },
    {
      question: "Was ist ein Atom?",
      answer: "Kleinste chemische Einheit",
      wrongAnswers: ["Molekül", "Ion", "Zelle"],
    },
    {
      question: "Was ist ein Kontinent?",
      answer: "Große Landmasse",
      wrongAnswers: ["Insel", "Stadt", "Fluss"],
    },
    {
      question: "Was ist ein Gesetz in der Physik?",
      answer: "Allgemeingültige Regel",
      wrongAnswers: ["Hypothese", "Meinung", "Theorie"],
    },
    {
      question: "Was ist ein Experiment?",
      answer: "Test zur Überprüfung",
      wrongAnswers: ["Theorie", "Gesetz", "Meinung"],
    },
    {
      question: "Was ist ein Datensatz?",
      answer: "Sammlung strukturierter Daten",
      wrongAnswers: ["Einzelwert", "Algorithmus", "Programm"],
    },
    {
      question: "Was ist ein Netzwerk?",
      answer: "Verbund von Knoten",
      wrongAnswers: ["Einzelgerät", "Programm", "Datei"],
    },
    {
      question: "Was ist KI?",
      answer: "Simulation von Intelligenz",
      wrongAnswers: ["Hardware", "Speicher", "Kabel"],
    },
    {
      question: "Was ist ein Sensor?",
      answer: "Messgerät",
      wrongAnswers: ["Computer", "Software", "Kabel"],
    },
    {
      question: "Was ist ein Signal?",
      answer: "Informationsträger",
      wrongAnswers: ["Objekt", "Energie", "Stoff"],
    },
    {
      question: "Was ist ein Bit?",
      answer: "Kleinste Informationseinheit",
      wrongAnswers: ["Byte", "Kilobyte", "Megabyte"],
    },
    {
      question: "Was ist ein Byte?",
      answer: "8 Bit",
      wrongAnswers: ["4 Bit", "16 Bit", "32 Bit"],
    },
    {
      question: "Was ist ein Server?",
      answer: "Dienstanbieter im Netzwerk",
      wrongAnswers: ["Client", "Kabel", "Router"],
    },
    {
      question: "Was ist ein Client?",
      answer: "Dienstnutzer",
      wrongAnswers: ["Server", "Kabel", "Speicher"],
    },
    {
      question: "Was ist ein Protokoll?",
      answer: "Kommunikationsregel",
      wrongAnswers: ["Programm", "Datei", "Gerät"],
    },
    {
      question: "Was ist die Hauptstadt von Neuseeland?",
      answer: "Wellington",
      wrongAnswers: ["Auckland", "Christchurch", "Dunedin"],
    },
    {
      question: "Welche mathematische Konstante ist die Basis des natürlichen Logarithmus?",
      answer: "e",
      wrongAnswers: ["π", "φ", "i"],
    },
    {
      question: "Wer formulierte die drei Newtonschen Gesetze?",
      answer: "Isaac Newton",
      wrongAnswers: ["Johannes Kepler", "Nikolaus Kopernikus", "James Clerk Maxwell"],
    },
    {
      question: "Was ist die kleinste Einheit eines chemischen Elements?",
      answer: "Atom",
      wrongAnswers: ["Molekül", "Proton", "Neutron"],
    },
    {
      question: "Welcher Ozean ist der größte der Erde?",
      answer: "Pazifischer Ozean",
      wrongAnswers: ["Atlantischer Ozean", "Indischer Ozean", "Arktischer Ozean"],
    },
    {
      question: "Was ist die Hauptfunktion der Mitochondrien?",
      answer: "Energiegewinnung der Zelle",
      wrongAnswers: ["Proteinsynthese", "Speicherung von DNA", "Zellteilung"],
    },
    {
      question: "Wer schrieb „1984“?",
      answer: "George Orwell",
      wrongAnswers: ["Aldous Huxley", "Ray Bradbury", "Ernest Hemingway"],
    },
    {
      question: "Was bezeichnet in der Informatik eine rekursive Funktion?",
      answer: "Eine Funktion, die sich selbst aufruft",
      wrongAnswers: [
        "Eine Funktion ohne Rückgabewert",
        "Eine Funktion mit vielen Parametern",
        "Eine Funktion in Maschinensprache",
      ],
    },
    {
      question: "Welche Einheit ist die SI-Einheit der Kraft?",
      answer: "Newton",
      wrongAnswers: ["Joule", "Watt", "Pascal"],
    },
    {
      question: "Was ist ein Archipel?",
      answer: "Inselgruppe",
      wrongAnswers: ["Gebirgskette", "Wüstenregion", "Flussdelta"],
    },
    {
      question: "Welches Organ produziert Insulin?",
      answer: "Bauchspeicheldrüse",
      wrongAnswers: ["Leber", "Niere", "Milz"],
    },
    {
      question: "Was ist die Hauptstadt der Mongolei?",
      answer: "Ulaanbaatar",
      wrongAnswers: ["Astana", "Duschanbe", "Baku"],
    },
    {
      question: "Welche Aussage beschreibt ein Oxid?",
      answer: "Verbindung eines Elements mit Sauerstoff",
      wrongAnswers: ["Verbindung mit Wasserstoff", "Verbindung mit Stickstoff", "Verbindung mit Kohlenstoff"],
    },
    {
      question: "Was ist in der Statistik der Median?",
      answer: "Der mittlere Wert einer sortierten Datenreihe",
      wrongAnswers: ["Der häufigste Wert", "Der Durchschnitt aller Werte", "Die Spannweite"],
    },
    {
      question: "Wer entwickelte das heliozentrische Weltbild maßgeblich?",
      answer: "Nikolaus Kopernikus",
      wrongAnswers: ["Aristoteles", "Ptolemäus", "Archimedes"],
    },
    {
      question: "Was ist ein SQL-Join?",
      answer: "Verknüpfung von Tabellen",
      wrongAnswers: ["Löschung von Datensätzen", "Sortierung eines Arrays", "Komprimierung einer Datenbank"],
    },
    {
      question: "Welches Gas ist in der Erdatmosphäre am häufigsten?",
      answer: "Stickstoff",
      wrongAnswers: ["Sauerstoff", "Kohlenstoffdioxid", "Argon"],
    },
    {
      question: "Was ist die Hauptstadt von Chile?",
      answer: "Santiago de Chile",
      wrongAnswers: ["Valparaíso", "Lima", "Quito"],
    },
    {
      question: "Welcher Teil des Auges reguliert den Lichteinfall?",
      answer: "Iris",
      wrongAnswers: ["Netzhaut", "Linse", "Hornhaut"],
    },
    {
      question: "Was bedeutet „HTTP“?",
      answer: "Hypertext Transfer Protocol",
      wrongAnswers: [
        "High Transmission Text Process",
        "Hyperlink Text Transfer Path",
        "Host Transfer Terminal Protocol",
      ],
    },
    {
      question: "Welche Zahl ist eine Primzahl?",
      answer: "29",
      wrongAnswers: ["21", "35", "39"],
    },
    {
      question: "Was ist die Hauptstadt von Äthiopien?",
      answer: "Addis Abeba",
      wrongAnswers: ["Nairobi", "Kampala", "Dakar"],
    },
    {
      question: "Was beschreibt die Halbwertszeit?",
      answer: "Zeitspanne, in der die Hälfte einer Stoffmenge zerfällt",
      wrongAnswers: ["Dauer einer chemischen Reaktion", "Zeit für Verdopplung eines Signals", "Zeitraum eines Umlaufs"],
    },
    {
      question: "Welcher Komponist schrieb die 9. Sinfonie mit der „Ode an die Freude“?",
      answer: "Ludwig van Beethoven",
      wrongAnswers: ["Wolfgang Amadeus Mozart", "Joseph Haydn", "Franz Schubert"],
    },
    {
      question: "Was ist ein Prädikat in der Logik?",
      answer: "Aussageform mit Variablen",
      wrongAnswers: ["Beweisverfahren", "Mathematische Konstante", "Zahlenmenge"],
    },
    {
      question: "Welcher Planet hat das größte Ringsystem im Sonnensystem?",
      answer: "Saturn",
      wrongAnswers: ["Jupiter", "Uranus", "Neptun"],
    },
    {
      question: "Was ist die Hauptstadt von Marokko?",
      answer: "Rabat",
      wrongAnswers: ["Casablanca", "Marrakesch", "Fès"],
    },
    {
      question: "Wofür steht die Abkürzung „CPU“?",
      answer: "Central Processing Unit",
      wrongAnswers: ["Computer Power Unit", "Central Program Utility", "Core Processing Utility"],
    },
    {
      question: "Welche Struktur speichert bei Pflanzenzellen Wasser und gelöste Stoffe?",
      answer: "Vakuole",
      wrongAnswers: ["Ribosom", "Chloroplast", "Zellkern"],
    },
    {
      question: "Was ist ein konvexes Polygon?",
      answer: "Vieleck ohne nach innen gerichtete Winkel größer als 180°",
      wrongAnswers: ["Vieleck mit genau drei Seiten", "Vieleck mit nur rechten Winkeln", "Vieleck mit gekrümmten Kanten"],
    },
    {
      question: "Was ist die Hauptstadt von Sri Lanka im politischen Sinn?",
      answer: "Sri Jayawardenepura Kotte",
      wrongAnswers: ["Colombo", "Kandy", "Galle"],
    },
    {
      question: "Welche Einheit misst die elektrische Stromstärke?",
      answer: "Ampere",
      wrongAnswers: ["Ohm", "Volt", "Farad"],
    },
    {
      question: "Was ist ein Enzym?",
      answer: "Biokatalysator",
      wrongAnswers: ["Speicherstoff", "Genabschnitt", "Zellorganell"],
    },
    {
      question: "Wer verfasste „Die Kritik der reinen Vernunft“?",
      answer: "Immanuel Kant",
      wrongAnswers: ["Friedrich Nietzsche", "Georg Wilhelm Friedrich Hegel", "Arthur Schopenhauer"],
    },
    {
      question: "Was ist in der Informatik ein Stack?",
      answer: "Datenstruktur nach dem LIFO-Prinzip",
      wrongAnswers: ["Datenstruktur nach dem FIFO-Prinzip", "Relationale Datenbank", "Verschlüsselungsverfahren"],
    },
    {
      question: "Welche Wellenart benötigt kein Medium zur Ausbreitung?",
      answer: "Elektromagnetische Wellen",
      wrongAnswers: ["Schallwellen", "Wasserwellen", "Seismische Wellen"],
    },
    {
      question: "Was ist die Hauptstadt von Bolivien laut Verfassung?",
      answer: "Sucre",
      wrongAnswers: ["La Paz", "Santa Cruz", "Cochabamba"],
    },
    {
      question: "Welche Zahl ist die imaginäre Einheit?",
      answer: "i",
      wrongAnswers: ["e", "π", "a"],
    },
    {
      question: "Was beschreibt die Biodiversität?",
      answer: "Vielfalt des Lebens",
      wrongAnswers: ["Wachstum von Pflanzen", "Klimatische Stabilität", "Chemische Zusammensetzung des Bodens"],
    },
    {
      question: "Was ist ein Hashwert in der Informatik?",
      answer: "Ergebnis einer Hashfunktion",
      wrongAnswers: ["Verschlüsselter Klartext", "Binärer Maschinenbefehl", "Ein Netzwerkprotokoll"],
    },
  ];


  databases.standard = {
    label: "Standard",
    cards: [
      ...explainTerms.map((term) => ({ category: "Erklären", term, taboo: [] })),
      ...drawTerms.map((term) => ({ category: "Zeichnen", term, taboo: [] })),
      ...pantomimeTerms.map((term) => ({ category: "Pantomime", term, taboo: [] })),
      ...quizItems.map(({ question, answer }) => ({
        category: "Quizfrage",
        term: question,
        answer,
        taboo: [],
      })),
      ...masterQuizItems.map(({ question, answer }) => ({
        category: "Masterquizfrage",
        term: question,
        answer,
        taboo: [],
      })),
      ...singleChoiceItems.map(({ question, answer, wrongAnswers }) => ({
        category: "Single-Choice",
        term: question,
        answer,
        wrongAnswers,
        taboo: [],
      })),
    ],
  };
})();
