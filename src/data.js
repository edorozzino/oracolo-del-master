// Tabelle dell'Oracolo. Ogni tabella è un elenco di voci; i campi {x} vengono
// riempiti con voci casuali dalle sotto-tabelle indicate.
window.ORACOLO_DATA = {
  luoghi: {
    tipi: [
      "una torre di guardia diroccata", "un monastero scavato nella roccia",
      "un porto di contrabbandieri", "una miniera di sale abbandonata",
      "un mercato sotterraneo", "un villaggio su palafitte",
      "un tempio sommerso a metà", "un ponte di pietra lungo un miglio",
      "una biblioteca bruciata", "un accampamento di carovanieri",
      "una fortezza nanica sigillata", "un bosco di alberi pietrificati",
      "un faro senza guardiano", "una locanda all'incrocio di tre strade",
      "un cimitero di navi arenate", "una città costruita dentro un cratere"
    ],
    dettagli: [
      "dove le campane suonano da sole a mezzanotte",
      "invaso da funghi che brillano di luce azzurra",
      "dove nessuno ricorda il proprio nome dopo il tramonto",
      "attraversato da un fiume che scorre all'insù",
      "con statue che cambiano posizione ogni giorno",
      "coperto da una nebbia che sa di cannella",
      "dove gli animali parlano ma mentono sempre",
      "segnato da rune che sanguinano quando piove",
      "in cui il tempo scorre più lento di un'ora",
      "presidiato da corvi che portano messaggi",
      "costruito sopra le ossa di un drago",
      "dove ogni porta si apre su una stanza diversa"
    ],
    biomi: ["Paludi di Morvald", "Steppe di Cenere", "Costa delle Sirene Mute",
      "Picchi Azzurri", "Foresta di Vetroverde", "Deserto dei Mille Specchi",
      "Valle dei Re Caduti", "Isole Spezzate", "Tundra di Hrimgard", "Colline del Vino Nero"]
  },
  atmosfere: {
    meteo: [
      "Pioggia sottile e insistente", "Vento che porta sabbia rossa",
      "Neve fuori stagione", "Afa immobile, nessuna brezza",
      "Temporale con fulmini verdi", "Nebbia fitta fino alle ginocchia",
      "Cielo limpido e due lune visibili", "Grandine grossa come nocciole",
      "Aurora che danza anche di giorno", "Cenere che cade come neve"
    ],
    momenti: ["all'alba", "a mezzogiorno", "al tramonto", "nel cuore della notte",
      "durante un'eclissi", "alla vigilia di una festa", "il giorno dopo un funerale"],
    suoni: [
      "un canto lontano in una lingua morta", "il rintocco di un'unica campana",
      "risate di bambini senza bambini", "il gocciolio costante dell'acqua",
      "un tamburo che segue il battito del cuore", "silenzio totale, innaturale",
      "lo scricchiolio del legno sotto un peso invisibile", "ululati che si avvicinano"
    ]
  },
  png: {
    nomi: ["Ysolde", "Brannoc", "Merida Fiordaglio", "Tobias Corvonero", "Ilvara",
      "Gorrim Pietrascura", "Sefa la Cieca", "Ottavio Malaspina", "Kethra", "Fenwick Tre-Dita",
      "Aurelia Vane", "Dorn", "Nim delle Paludi", "Lysandra", "Barnaba Ferraguti", "Zhaar"],
    razze: ["umano", "umana", "elfo", "elfa", "nano", "nana", "halfling", "tiefling",
      "dragonide", "gnomo", "gnoma", "mezzorco", "aasimar", "goliath"],
    mestieri: ["cartografa decaduta", "oste che sa troppo", "cavaliere senza cavallo",
      "sacerdote che ha perso la fede", "contrabbandiera di reliquie", "cacciatore di taglie in pensione",
      "erborista sospettosa", "bardo indebitato", "becchino filosofo", "spia di un regno caduto",
      "fabbro che forgia solo di notte", "mercante di ricordi", "guardiano di un ponte", "ladra gentiluomo"],
    tratti: ["parla sempre in rima quando mente", "ha un occhio di vetro che a volte si muove",
      "colleziona denti di creature rare", "non si siede mai con le spalle alla porta",
      "ride nei momenti sbagliati", "porta al collo la chiave di una porta che non esiste più",
      "ha paura dei gatti", "chiama tutti con il nome di un fratello morto",
      "offre tè a chiunque, anche ai nemici", "tiene un diario di tutte le bugie che sente"],
    segreti: ["è ricercato in tre regni", "è il vero erede del signore locale",
      "ha venduto l'anima e vuole riaverla", "lavora per il cattivo, controvoglia",
      "è un mutaforma che ha dimenticato la sua forma", "ha nascosto il tesoro di cui tutti parlano",
      "è morto da dieci anni e non lo sa", "sta proteggendo un drago neonato"]
  },
  minacce: {
    creature: ["un branco di lupi d'ombra", "un ogre con una corona di latta",
      "una strega delle paludi e le sue tre figlie", "uno sciame di stirge",
      "un cavaliere non morto che cerca il perdono", "un mimic travestito da altare",
      "una banda di goblin molto organizzata", "un giovane drago verde annoiato",
      "un golem di fango senza padrone", "una setta che venera una stella spenta",
      "un'idra con una testa ferita", "spettri di minatori ancora al lavoro"],
    moventi: ["vuole indietro qualcosa che gli è stato rubato", "difende il proprio territorio",
      "obbedisce a un patto antico", "ha fame, semplicemente", "è stata manipolata da un incantatore",
      "cerca uno degli eroi per nome", "fugge da qualcosa di peggio", "vuole essere notata"],
    sfide: ["Facile", "Media", "Media", "Difficile", "Mortale"]
  },
  tesori: {
    oggetti: ["una lanterna che illumina solo le cose nascoste", "un anello che sussurra il nome del portatore",
      "una mappa che si aggiorna da sola", "una spada spezzata che vibra vicino ai non morti",
      "un mazzo di carte con un volto in più", "una fiala di lacrime di sirena",
      "un mantello che profuma sempre di pioggia", "un dado d'osso che cade sempre sul 6, una volta al giorno",
      "una chiave di cristallo senza serratura", "un diario scritto con la grafia di un eroe del gruppo",
      "una bussola che punta verso ciò che desideri", "uno scudo con lo stemma di una casata estinta"],
    rarita: ["Comune", "Non comune", "Non comune", "Raro", "Molto raro", "Leggendario"],
    prezzi: ["pagato con un ricordo felice", "maledetto finché non viene restituito",
      "ricercato da una gilda di ladri", "legato a un PNG di questa scena",
      "funziona solo di notte", "si sbriciola dopo tre usi", "nessun prezzo, per ora"]
  },
  ganci: [
    "Un bambino consegna agli eroi una lettera sigillata con il loro stemma.",
    "Il PNG offre una ricompensa enorme, ma solo se partono stanotte.",
    "Qualcuno ha rubato l'ombra del capo villaggio.",
    "Una taglia appesa alla bacheca riporta il ritratto di uno degli eroi.",
    "Il luogo sta lentamente sprofondando e restano tre giorni.",
    "Un mercante muore davanti agli eroi pronunciando un nome.",
    "Le campane annunciano un matrimonio che nessuno ha organizzato.",
    "Una porta che era murata da secoli oggi è aperta.",
    "Il tesoro di questa scena è anche la chiave per sconfiggere la minaccia.",
    "Gli eroi si svegliano con un tatuaggio nuovo e identico.",
    "Una profezia locale descrive esattamente il gruppo, ma con un membro in meno.",
    "La minaccia non è il vero nemico: chiede aiuto agli eroi."
  ]
};
