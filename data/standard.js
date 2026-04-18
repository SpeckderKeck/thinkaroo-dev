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


  const vocabItems = [
    ["Haus", "house"],
    ["Baum", "tree"],
    ["Wasser", "water"],
    ["Feuer", "fire"],
    ["Erde", "earth"],
    ["Luft", "air"],
    ["Sonne", "sun"],
    ["Mond", "moon"],
    ["Stern", "star"],
    ["Himmel", "sky"],
    ["Meer", "sea"],
    ["Fluss", "river"],
    ["Berg", "mountain"],
    ["Tal", "valley"],
    ["Straße", "street"],
    ["Stadt", "city"],
    ["Dorf", "village"],
    ["Schule", "school"],
    ["Lehrer", "teacher"],
    ["Schüler", "student"],
    ["Buch", "book"],
    ["Heft", "notebook"],
    ["Stift", "pen"],
    ["Tisch", "table"],
    ["Stuhl", "chair"],
    ["Fenster", "window"],
    ["Tür", "door"],
    ["Boden", "floor"],
    ["Dach", "roof"],
    ["Garten", "garden"],
    ["Blume", "flower"],
    ["Gras", "grass"],
    ["Blatt", "leaf"],
    ["Wurzel", "root"],
    ["Frucht", "fruit"],
    ["Apfel", "apple"],
    ["Birne", "pear"],
    ["Banane", "banana"],
    ["Brot", "bread"],
    ["Milch", "milk"],
    ["Käse", "cheese"],
    ["Butter", "butter"],
    ["Ei", "egg"],
    ["Fisch", "fish"],
    ["Fleisch", "meat"],
    ["Gemüse", "vegetables"],
    ["Kartoffel", "potato"],
    ["Zwiebel", "onion"],
    ["Tomate", "tomato"],
    ["Salz", "salt"],
    ["Zucker", "sugar"],
    ["Tasse", "cup"],
    ["Glas", "glass"],
    ["Teller", "plate"],
    ["Messer", "knife"],
    ["Gabel", "fork"],
    ["Löffel", "spoon"],
    ["Küche", "kitchen"],
    ["Zimmer", "room"],
    ["Badezimmer", "bathroom"],
    ["Schlafzimmer", "bedroom"],
    ["Familie", "family"],
    ["Mutter", "mother"],
    ["Vater", "father"],
    ["Bruder", "brother"],
    ["Schwester", "sister"],
    ["Kind", "child"],
    ["Freund", "friend"],
    ["Nachbar", "neighbor"],
    ["Hund", "dog"],
    ["Katze", "cat"],
    ["Vogel", "bird"],
    ["Pferd", "horse"],
    ["Kuh", "cow"],
    ["Schaf", "sheep"],
    ["Auto", "car"],
    ["Fahrrad", "bicycle"],
    ["Bus", "bus"],
    ["Zug", "train"],
    ["Flugzeug", "airplane"],
    ["Schiff", "ship"],
    ["Bahnhof", "train station"],
    ["Flughafen", "airport"],
    ["Uhr", "clock"],
    ["Zeit", "time"],
    ["Tag", "day"],
    ["Nacht", "night"],
    ["Morgen", "morning"],
    ["Abend", "evening"],
    ["heute", "today"],
    ["morgen", "tomorrow"],
    ["gestern", "yesterday"],
    ["schnell", "fast"],
    ["langsam", "slow"],
    ["groß", "big"],
    ["klein", "small"],
    ["warm", "warm"],
    ["kalt", "cold"],
    ["glücklich", "happy"],
    ["traurig", "sad"],
  ].map(([german, english]) => ({
    prompt: `Übersetze ins Englische: ${german}`,
    answer: english,
  }));

  const singleChoiceItems = quizItems.slice(0, 100).map((item, index, allItems) => {
    const wrongAnswers = [];
    let offset = 1;
    while (wrongAnswers.length < 3) {
      const candidate = allItems[(index + offset) % allItems.length].answer;
      if (candidate && candidate !== item.answer && !wrongAnswers.includes(candidate)) {
        wrongAnswers.push(candidate);
      }
      offset += 1;
    }

    return {
      question: item.question,
      answer: item.answer,
      wrongAnswers,
    };
  });


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
      ...vocabItems.map(({ prompt, answer }) => ({
        category: "Vokabel",
        term: prompt,
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
