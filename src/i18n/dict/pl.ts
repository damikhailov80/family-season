import type { Dict } from '../types'

/**
 * Польский словарь. Форма выводится из русского (`Dict`), поэтому забытый
 * ключ — ошибка `npm run typecheck`, а не дырка в интерфейсе.
 *
 * Домашний словарь продукта переведён осознанно и одинаково во всех трёх
 * языках: сезон — sezon, постер — plakat, недели — tygodnie, сюжетные линии —
 * własne projekty, финал — podsumowanie, анонс — na przyszły miesiąc
 * (см. «Языки» в CLAUDE.md).
 */
export const pl: Dict = {
  poster: {
    labels: {
      theme: '1. Temat miesiąca',
      themeSummary: 'Podsumowanie',
      weeks: '2. Tygodnie miesiąca',
      goal: 'Nasz cel na miesiąc',
      projects: '3. Własne projekty',
      mood: '4. Nastroje naszej rodziny',
      nextIdeas: 'Pomysły na przyszły miesiąc',
      fieldProject: 'Projekt:',
      fieldProgress: 'Postęp',
      fieldGoal: 'Mój cel na miesiąc:',
      moodWho: 'Kto',
      moodCaption: 'Nastrój każdego z nas w kolejne dni miesiąca',
    },
    mood: {
      good: 'Dobrze',
      ok: 'Znośnie',
      bad: 'Źle',
    },
    placeholders: {
      title: 'Sezon rodzinny',
      ribbon: 'Nasze życie. Nasze przygody. Nasze miesiące.',
      subtitle: 'Nasz wspólny miesiąc',
      question: 'Co zapamiętaliśmy najbardziej?',
      weeksNote: '4 tygodnie – 4 pomysły – 4 wspomnienia',
      weekTitle: 'Tydzień',
      weekText: 'Co robimy w tym tygodniu',
      goal: 'Co chcemy zdążyć razem',
      projectsNote: 'Nasze własne cele i postępy',
      name: 'Imię',
      project: 'Mój projekt',
      description: 'Co to za projekt',
      personGoal: 'Co chcę osiągnąć',
    },
    faces: {
      dad: 'dorosły',
      mom: 'dorosła',
      son: 'chłopiec',
      daughter: 'dziewczynka',
    },
    months: [
      'Styczeń',
      'Luty',
      'Marzec',
      'Kwiecień',
      'Maj',
      'Czerwiec',
      'Lipiec',
      'Sierpień',
      'Wrzesień',
      'Październik',
      'Listopad',
      'Grudzień',
    ],
    // Родительный падеж: «27 sierpnia», а не «27 sierpień».
    monthsOf: [
      'stycznia',
      'lutego',
      'marca',
      'kwietnia',
      'maja',
      'czerwca',
      'lipca',
      'sierpnia',
      'września',
      'października',
      'listopada',
      'grudnia',
    ],
    anonNames: [
      'Ala',
      'Bartek',
      'Celina',
      'Darek',
      'Ewa',
      'Filip',
      'Gosia',
      'Hania',
      'Igor',
      'Jurek',
      'Kasia',
      'Marek',
    ],
    monthLowercaseInText: true,
    untitled: 'Sezon',
  },

  dialogs: {
    cancel: 'Anuluj',
    close: 'Zamknij',
    save: 'Zapisz',
    done: 'Gotowe',
    titleLabel: 'Nazwa',

    newSeason: 'Nowy sezon',
    creating: 'Tworzymy…',
    draftWillBeLost:
      'Bez logowania można prowadzić tylko jeden sezon. Szkic „{title}” zostanie zastąpiony.',

    login: 'Potrzebne logowanie',
    notNow: 'Nie teraz',

    rename: 'Nowa nazwa',
    renameHint: 'Wpisz nową nazwę sezonu.',

    fork: 'Skopiuj sezon',
    forkAction: 'Skopiuj',

    publish: 'Wystaw na witrynę',
    publishHint: 'Kopia sezonu pojawi się w „Pomysłach społeczności”.',
    publishing: 'Wystawiamy…',
    publishChecking: 'Sprawdzamy…',
    publishAction: 'Wystaw',
    publishAnonymize: 'Zamień imiona na losowe',
    publishLangLabel: 'Język sezonu',
    publishSeeIt: 'Zobacz na witrynie',

    withdraw: 'Zdejmij z witryny',
    withdrawAction: 'Zdejmij',
    withdrawing: 'Zdejmujemy…',
    withdrawAsk: 'Czy na pewno chcesz zdjąć sezon z „Pomysłów społeczności”?',
    withdrawNote:
      'Osobom, które dodały sezon do ulubionych, zostanie on i nadal będzie otwierał się z linku.',

    report: 'Zgłoś sezon',
    reportAgain: 'Uzupełnij zgłoszenie',
    reportHint: 'Napisz, co jest nie tak z tym sezonem.',
    reportAgainHint: 'Nowy tekst zastąpi poprzedni.',
    reportLabel: 'Co jest nie tak',
    reportPlaceholder: 'Na przykład: reklama w opisie tygodnia',
    reportSend: 'Wyślij',
    reportSending: 'Wysyłamy…',

    share: 'Udostępnij linkiem',
    shareHave: 'Wyślij link temu, komu chcesz pokazać sezon.',
    shareNone: 'Utwórz link, żeby udostępnić sezon.',
    shareLabel: 'Link',
    shareCreate: 'Utwórz link',
    shareRevoke: 'Unieważnij',
    shareCopy: 'Kopiuj',

    familySwap: 'Wstaw swoją rodzinę',
    familyAsk: 'Zamienić bohaterów na twoją rodzinę?',
    familyApply: 'Zamień',
    familyNow: 'Teraz na plakacie',
    familyNext: 'Będzie',
    familyNote: 'Zmienią się tylko rysunki i imiona.',
    familyDropOne: 'Dolna karta zostanie usunięta.',
    familyDropMany: 'Dolne karty ({n}) zostaną usunięte.',
  },

  landing: {
    title: 'Sezon rodzinny — plakat przyszłego miesiąca twojej rodziny',
    description:
      'Co czeka was w przyszłym miesiącu: złóżcie plakat nowego sezonu rodzinnego, wydrukujcie na dwóch kartkach A4 i powieście na lodówce.',

    heroTitle: 'Sezon rodzinny',
    heroRibbon: 'Nowy sezon co miesiąc',
    heroLead:
      'Plakat przyszłego miesiąca waszej rodziny: czym się zajmiecie, czego spróbujecie, dokąd pójdziecie i kto się czego podjął. Złóżcie go wcześniej, wydrukujcie i powieście na lodówce.',
    heroHand: 'Nie lista zadań, a afisz: miesiąc, który chce się przeżyć.',
    heroJump: 'Zobacz przykłady ↓',

    stepsLabel: 'Jak złożyć sezon',
    stepsNote: 'cztery kroki',
    steps: [
      {
        title: 'Wymyślcie sezon',
        text: 'Nazwa miesiąca, kto gra główne role i czym zajmie się każdy. Wszystko poprawia się wprost na plakacie.',
      },
      {
        title: 'Wydrukujcie afisz',
        text: 'Dokładnie dwie strony A3 — układ sprawdzony na rodzinie pięcioosobowej i miesiącu o 31 dniach.',
      },
      {
        title: 'Powieście na lodówce',
        text: 'Na magnes, w widocznym miejscu: plakat działa tylko wtedy, gdy wpada w oko.',
      },
      {
        title: 'Przeżyjcie miesiąc',
        text: 'Nastroje dzień po dniu, postępy projektów, zdjęcia tygodni, podsumowanie — długopisem, całą rodziną.',
      },
    ],

    insideLabel: 'Co jest na plakacie',
    insideNote: 'dwie strony A4',
    parts: [
      {
        title: 'Nazwa sezonu',
        text: 'Temat miesiąca i pytanie, na które rodzina odpowie na koniec.',
      },
      {
        title: 'Cztery tygodnie',
        text: 'Cztery odcinki miesiąca: każdy ma swój pomysł i pustą ramkę polaroida na zdjęcie.',
      },
      {
        title: 'Własne projekty',
        text: 'Wątek każdego z osobna: swoja sprawa, opis, cel i skala na dziesięć działek.',
      },
      {
        title: 'Kronika nastrojów',
        text: 'Kratka na każdy dzień miesiąca dla każdego — zamalowywana ręcznie.',
      },
      {
        title: 'Podsumowanie i zapowiedź',
        text: 'Czym zapamiętał się sezon i co wymyśliliście na następny — duże pola na notatki.',
      },
    ],
    palettesTitle: 'Sto motywów kolorystycznych',
    palettesText:
      'W trybie edycji przycisk rzuca plakat w losowy motyw, aż któryś się spodoba; motyw jedzie w linku razem z sezonem i u bliskich plakat otworzy się w tych samych barwach. Każdy motyw zadają cztery farby — resztę arkusz wyprowadza z nich sam.',
    insideFootnote:
      'Drukuje się zawsze czysty plakat: skale na zerze, kratki nastrojów puste, pola na notatki wolne. Resztę wpisze sam miesiąc, odręcznie.',

    examplesLabel: 'Przykłady',
    examplesNote: 'trzy sezony, każdy inny',
    exampleOpen: 'Otwórz przykład →',
    examplesAsideTitle: 'Weźcie za podstawę',
    examplesAsideText:
      'Każdy przykład można skopiować wprost na plakacie i przepisać pod siebie — bohaterów, projekty, nazwę sezonu. Albo złożyć sezon od zera, jeśli własne pomysły przychodzą szybciej.',
    examplesAsideHand:
      'Swoim sezonem można podzielić się prywatnym linkiem: otwiera się u każdego i bez logowania.',
    examplesAction: 'Złóż swój sezon',

    communityLabel: 'Pomysły społeczności',
    communityNote: 'cudze sezony w całości',
    communityText:
      'Nie trzeba wymyślać miesiąca od zera. Rodziny wystawiają swoje sezony na wspólną witrynę: czyjś „Miesiąc wody”, czyjeś projekty na czworo, czyjeś podsumowanie z pytaniem, na które odpowiadała cała rodzina. Każdy sezon stamtąd otwiera się w całości — można go przymierzyć w swoim motywie i skopiować pod swoich bohaterów, zostawiając sobie tylko to, co się spodobało.',
    communityHand:
      'Pokazujemy za każdym razem losowe — zaglądajcie, gdy własne pomysły się skończą.',
    communityAction: 'Zobacz pomysły społeczności',
  },

  seasons: {
    title: 'Moje sezony — Sezon rodzinny',
    description: 'Twoje konto: zapisane sezony i to, co odłożyłeś do ulubionych.',
    heading: 'Moje sezony',

    tabsAria: 'Co pokazać',
    tabSeasons: 'Moje',
    tabFavorites: 'Ulubione',
    tabPublished: 'Opublikowane',

    searchPlaceholder: 'Szukaj po nazwie',
    searchAction: 'Znajdź',
    sortByDate: 'po dacie',
    sortByName: 'po nazwie',

    savedAt: 'zapisany',
    favoritedAt: 'odłożony',
    publishedAt: 'wystawiony',
    offStage: 'zdjęty z witryny',
    blocked: 'zamknięty po zgłoszeniach',
    statLikes: 'polubienia: {n}',
    statFavorites: 'w ulubionych: {n}',
    statForks: 'kopie: {n}',

    nothingFound: 'Nic nie pasuje do tego zapytania.',
    emptyFavorites: 'W ulubionych na razie pusto. Naciśnij ☆ na dowolnym sezonie z witryny.',
    emptyPublished:
      'Nic jeszcze nie wystawiłeś. Otwórz swój sezon i naciśnij przycisk z megafonem.',
    newSeason: 'Utwórz nowy sezon',

    staleNote:
      'Logowanie nastąpiło, zanim pojawiło się konto, i nie ma do czego przypiąć sezonów. Naprawia to jedno ponowne logowanie.',
    listError: 'Nie udało się wczytać listy — błąd serwera.',
    addLimit: 'Nie przechowujemy więcej niż {n} sezonów na konto — usuń zbędne.',
    addError: 'Nie udało się utworzyć sezonu — błąd serwera.',

    renameOne: 'Zmień nazwę „{title}”',
    removeOne: 'Usuń „{title}”',
    removeAskOne: 'Czy na pewno chcesz usunąć sezon „{title}”?',
    removeDraftAsk: 'Czy na pewno chcesz usunąć szkic „{title}”?',
    removeHeading: 'Potwierdzenie usunięcia',
    removeAction: 'Usuń',
    unfavoriteOne: 'Usuń „{title}” z ulubionych',
    showcaseOnOne: 'Zdejmij „{title}” z witryny',
    showcaseOffOne: 'Przywróć „{title}” na witrynę',
    withdrawAskOne: 'Czy na pewno chcesz zdjąć sezon „{title}” z „Pomysłów społeczności”?',
  },

  account: {
    title: 'Konto — Sezon rodzinny',
    description: 'Ustawienia: język strony i rodzina do nowych plakatów.',
    heading: 'Konto',
    saved: 'Zapisano ✓',

    signedOutTitle: 'Ustawienia są dla zalogowanych',
    signedOutText:
      'Tu mieszkają język i rodzina, z którą otwierają się nowe plakaty. Żeby było do czego przypiąć ustawienia, trzeba się zalogować.',
    newSeason: 'Złóż swój sezon',
    familyHint:
      'Kliknięcie w rysunek zmienia bohatera. Od {min} do {max} osób, imion można nie wpisywać.',
    error: 'Nie udało się wczytać ustawień — błąd serwera.',
    logoutHead: 'Wylogowanie',
    logout: 'Wyloguj się',
    langHead: 'Język',
    langText: 'W nim strona otwiera się u ciebie. Już utworzonych sezonów ustawienie nie rusza.',
    langLabel: 'Język strony',

    familyHead: 'Rodzina do nowych plakatów',
    familyText:
      'Z tymi bohaterami będzie otwierać się „Nowy sezon”. Już utworzonych sezonów ustawienie nie rusza.',

    staleNote:
      'Logowanie nastąpiło, zanim pojawiły się ustawienia, więc nie ma do czego ich przypiąć. Wystarczy zalogować się ponownie — to potrzebne raz.',

    addPerson: '+ Dodaj',
    saveFamily: 'Zapisz rodzinę',
    saving: 'Zapisujemy…',
    saveLanguage: 'Zapisz język',
    saveFailedError: 'Nie udało się zapisać ustawień — błąd serwera. Spróbuj jeszcze raz.',
    saveFailedStale: 'Nie udało się zapisać. Odśwież stronę i zaloguj się ponownie.',
    saveFailedAnonymous: 'Nie udało się zapisać. Odśwież stronę i zaloguj się ponownie.',
    changeFace: 'Zmień rysunek',
    removeTitle: 'Usuń z rodziny',
    namePlaceholder: 'Imię',
    faceAria: 'Rysunek: {face}. Zmień',
    nameAria: 'Imię: {face}',
    removeAria: 'Usuń: {name}',
  },

  ideas: {
    title: 'Pomysły społeczności — Sezon rodzinny',
    description:
      'Witryna sezonów, którymi podzieliły się rodziny: cudze miesiące, pomysły i wątki.',
    heading: 'Pomysły społeczności',
    lead: 'Najtrudniejsze w plakacie jest wymyślić, czym zająć miesiąc. Łatwiej, gdy widzisz, jak zrobili to inni: czyjś „Miesiąc wody”, czyjś „Miesiąc bez ekranów”, czyjeś projekty na czworo. Każdy sezon stąd można otworzyć i skopiować pod swoją rodzinę.',
    note: 'Sezony wystawiają same rodziny — przyciskiem z megafonem na swoim sezonie. Pokazujemy za każdym razem losowe: tak nowy ma szansę wpaść w oko, a nie utonąć pod tymi, które już widać. Zobaczyłeś reklamę, grubiaństwo albo cudze dane osobowe — naciśnij flagę: takie sezony zdejmujemy z witryny.',
    emptyHand:
      'Na razie witryna jest pusta — nikt jeszcze nie wystawił swojego sezonu. Będziecie pierwsi?',
    emptyNote:
      'Utwórz sezon w „Moich”, otwórz go i naciśnij przycisk z megafonem — pojawi się tutaj.',
    seeExamples: 'Zobacz przykłady',
    reportOne: 'Zgłoś „{title}”',
    reportSent: 'Zgłoszenie wysłane',
    another: 'Pokaż inne',
    error: 'Nie udało się wczytać witryny — błąd serwera.',
    likesAria: 'Polubienia: {n}',
    newSeason: 'Złóż swój sezon',
  },

  bars: {
    toolbarAria: 'Co zrobić z sezonem',
    toolbarDraftAria: 'Co zrobić ze szkicem',
    edit: 'Popraw',
    ready: 'Gotowe',
    printTitle: 'Drukuj / PDF',
    fork: 'Skopiuj',
    rename: 'Zmień nazwę sezonu',

    favoriteOn: 'Dodaj do ulubionych',
    favoriteOff: 'Usuń z ulubionych',
    likeOn: 'Polub',
    likeOff: 'Cofnij polubienie',
    likeAriaCount: '{action}, polubień na teraz: {n}',
    reportOpen: 'Zgłoś',
    reportDone: 'Zgłoszenie wysłane',
    likesOnShowcase: 'Polubień na witrynie: {n}',
    copyLink: 'Skopiuj link do sezonu',
    copyLinkShort: 'Skopiuj link',
    linkPrompt: 'Link do sezonu:',
    linkIssued: 'Prywatny link został wydany',
    linkNone: 'Pokaż prywatnym linkiem',
    linkCopied: 'Link skopiowany',
    linkCopyByHand: 'Skopiuj link z pola',

    publish: 'Wystaw na witrynę społeczności',
    withdraw: 'Zdejmij z witryny',
    republish: 'Przywróć na witrynę',
    published: 'Sezon jest na witrynie',
    publishedAgain: 'Taki sezon już był na witrynie',

    likesAria: 'Polubienia: {n}',

    save: 'Zapisz w moich sezonach',
    saving: 'Zapisujemy…',

    placeDraft: 'Szkic w tej przeglądarce',
    placeShared: 'Sezon z linku',
    placeExample: 'Nasz przykład',
    placePublic: 'Sezon społeczności',
    placeOwn: 'Twój sezon',
    withTitle: '{place}: {title}',
  },

  pages: {
    seasonGoneTitle: 'Nie ma takiego sezonu',
    seasonGoneText:
      'Takiego sezonu u nas nie ma. Autor mógł zdjąć go z witryny albo usunąć całkiem, a link mógł zostać przepisany z błędem.',
    seasonGoneIdeas: 'Zobacz pomysły społeczności',
    notFoundTitle: 'Nie znaleziono strony',
    notFoundText:
      'Takiego adresu na stronie nie ma. Może link został przepisany z błędem albo sezon usunięto.',
    notFoundHome: 'Na stronę główną',
    sheetTitle: 'Plakat sezonu — Sezon rodzinny',
    sheetDescription: 'Złóż sezon pod swoją rodzinę i wydrukuj na dwóch kartkach A4.',
    sheetEditTitle: 'Edycja sezonu — Sezon rodzinny',
    sheetEditDescription:
      'Przepisz sezon pod swoją rodzinę: bohaterowie, tygodnie, projekty i cel miesiąca.',
    publicTitle: 'Sezon — Sezon rodzinny',
    publicDescription: 'Wystawiony sezon: cudzy miesiąc w całości, z wątkami i celem.',
    publicError: 'Nie udało się otworzyć sezonu — błąd serwera.',
    sharedTitle: 'Sezon z linku — Sezon rodzinny',
    sharedDescription: 'Sezon rodzinny, którym się z tobą podzielono: obejrzyj i weź dla siebie.',
    sharedError: 'Nie udało się otworzyć sezonu — błąd serwera.',
    ownTitle: '{title} — Sezon rodzinny',
    ownError: 'Nie udało się otworzyć sezonu — błąd serwera.',
    autosaveFailed: 'Nie udało się zapisać poprawek — błąd serwera.',
  },

  privacy: {
    title: 'Prywatność — Sezon rodzinny',
    description:
      'Co strona przechowuje o tobie: ustawienia konta, twoje sezony i to, co pokazałeś innym.',
    heading: 'Prywatność',
    lead1: 'Przechowujemy tylko to, co zapisałeś sam',
    lead2:
      'Język strony, rodzinę do nowych plakatów, twoje sezony i to, co sam pokazałeś innym. Nie mamy ani twojego imienia z Google, ani adresu e-mail.',

    loginHead: 'Co dzieje się, gdy się logujesz',
    loginText:
      'Google przekazuje stronie twoje imię, adres e-mail i wewnętrzny numer twojego konta. Imię i adres od razu jadą do zaszyfrowanego ciasteczka w twojej własnej przeglądarce — i zostają tylko tam: na serwerze nie ma ich ani w bazie, ani w dziennikach. Nikomu ich nie przekazujemy i nie wysyłamy listów.',

    anonHead: 'Zanim się zalogujesz',
    anonText:
      'Plakat można złożyć i wydrukować zupełnie bez logowania. Taki szkic żyje **tylko w twojej przeglądarce** — my go nie mamy: ani wiersza w bazie, ani adresu, pod którym dałoby się go otworzyć. Jest jeden na przeglądarkę i zniknie, jeśli wyczyścisz dane strony; dlatego pasek nad plakatem proponuje zapisać go do swoich sezonów.',

    dbHead: 'Co leży w bazie',
    dbIntro:
      'Wszystko, co tam jest, oznaczone jest nieprzejrzystym numerem twojego konta Google — w rodzaju „google:1234567890”. Ani twojego imienia z Google, ani adresu e-mail nie ma w bazie nigdzie. Rodzajów wierszy jest kilka i wszystkie pojawiają się tylko wtedy, gdy sam coś zrobiłeś.',
    dbSettings:
      '**Ustawienia konta** — język strony i rodzina do nowych plakatów: do pięciu par „rysunek i imię”, na przykład „dorosły — Denis”. Imiona wpisujesz sam i wpisywać ich nie trzeba: bez nich ustawienie działa dokładnie tak samo. Leży tam też twoja odpowiedź o analityce, data odpowiedzi i to, o co dokładnie wtedy pytaliśmy — inaczej nie moglibyśmy pokazać, na co się zgodziłeś.',
    dbSeasons:
      '**Twoje sezony** — sam plakat: wszystko, co na nim wydrukowane, plus nazwa, którą mu nadałeś, motyw kolorystyczny, zestaw rysunków i język, w którym podpisany jest arkusz. Do stu sztuk. Imiona członków rodziny przechowywane są osobno od reszty — dzięki temu można je zamienić przy publikacji, nie ruszając samego sezonu. Obok leży data ostatniej poprawki, według niej sortuje się lista.',
    dbPublic:
      '**Wystawione sezony** — **kopia** sezonu wysłana na witrynę, z własnym stałym adresem i własnym językiem. Kopia żyje sama: poprawki w twoim sezonie jej nie zmieniają, a usunięcie sezonu jej nie zabiera. **Polubienia** i **ulubione** to znaczniki „to konto polubiło (odłożyło) ten sezon”; my je tylko liczymy. **Kopie** to taki sam znacznik „to konto wzięło sezon dla siebie”: autor widzi liczbę, a nie kto dokładnie. **Zgłoszenia** to twój tekst zgłoszenia wraz z tym, czyjej publikacji dotyczy; widzimy go my, a nie autor plakatu. Publikację, na którą wpłynęło zgłoszenie, autor może zdjąć z witryny, ale nie usunąć całkiem: zgłoszenie musi wskazywać na to, czego dotyczy, dopóki go nie rozpatrzymy.',

    whereHead: 'Gdzie mieszka twój sezon',
    whereText:
      'W naszej bazie, wierszem, i otwiera się pod krótkim adresem w rodzaju „/pl/season/ab12cd” — w samym adresie plakatu nie ma, jest tylko język strony i wskaźnik na wiersz. Otworzyć go możesz tylko ty: cudzy adres odpowiada tak samo jak wymyślony.',
    whereNote:
      'Ważny wniosek: **wszystko, co wydrukowane na plakacie, leży u nas** — nazwa miesiąca, imiona i projekty członków rodziny, cele, plany na tygodnie. Imion wpisywać nie trzeba. Tego, co wpisujesz długopisem na wydruku, nie mamy w ogóle. Zdjęć strona nie wgrywa i nie przechowuje: na plakacie jest dla nich pusta ramka do wklejenia na papierze.',

    othersHead: 'Co widzą inni',
    othersIntro: 'Nic — dopóki sam kogoś nie zaprosisz. Sposoby są dwa i różnią się.',
    othersLink:
      '**Udostępnij linkiem** — wydajesz go sam i sezon otwiera się u każdego, komu go wyślesz, bez logowania i bez konta. Poprawić niczego nie będzie mógł. Link można unieważnić albo zastąpić nowym: poprzedni przestaje działać w tej samej chwili.',
    othersShowcase:
      '**Witryna „Pomysły społeczności”** jest otwarta dla wszystkich, także dla tych, którzy nigdy się nie logowali. Każdy widzi na niej sezony w swoim języku, ale bezpośredni link otwiera dowolny. Zgłoszenia na wystawione rozpatrujemy my, ręcznie: jeśli sezon narusza przyzwoitość, zamykamy go — przestaje wtedy otwierać się i na witrynie, i z bezpośredniego linku, a wystawić taki sam ponownie nie można. Jedzie tam kopia sezonu i pokazywana jest w całości: **wszystko, co wydrukowane na plakacie — imiona, projekty, plany — widzi każdy**. Przy publikacji można zaznaczyć pole i zamienić imiona rodziny na losowe — wtedy na witrynie będą te, a w twoim sezonie zostaną prawdziwe. Ani twojego imienia, ani adresu obok nie widać: kto jest autorem, witryna nie pokazuje.',

    cookiesHead: 'Ciasteczka',
    cookiesText:
      'Ciasteczko z twoją sesją — to jest całe logowanie — ciasteczko z wybranym językiem, żeby strona otwierała się w nim, i ciasteczko z twoją odpowiedzią o analityce. Plus kilka tymczasowych, technicznych, które żyją parę sekund na czas samego logowania. Wszystko to jest potrzebne samej stronie i bez tego ona nie działa. Reklamowych trackerów na stronie nie ma.',

    analyticsHead: 'Analityka',
    analyticsText:
      'Liczymy odwiedziny przez Google Analytics — żeby widzieć, z których stron się korzysta, a które można usunąć. To jedyna rzecz, którą strona zbiera **nie dla twojego plakatu**, i dlatego pytamy o zgodę: dopóki nie odpowiesz „Akceptuję”, Google nie dostaje ani jednego zapytania i nie stawia ani jednego ciasteczka. Odpowiesz „Akceptuję” — pojawią się ciasteczka **_ga** i **_ga_…**: odróżniają one wejścia od siebie i żyją do dwóch lat. Nie trafia tam ani imię, ani adres poczty, ani to, co napisane na twoich plakatach. Decyzję zmieniasz w każdej chwili — linkiem „Ciasteczka” na dole każdej strony, a po zalogowaniu także na koncie; nie zapytamy ponownie wcześniej niż za pół roku.',

    deleteHead: 'Jak wszystko usunąć',
    deleteText:
      'Sezony i zakładki usuwa się pojedynczo wprost w „Moich sezonach” — krzyżykiem w wierszu. Publikację zdejmuje się tam samo albo na samej witrynie: jeśli nikt jej sobie nie odłożył, znika całkiem; jeśli odłożył, wypada z „Pomysłów”, ale nadal otwiera się z bezpośredniego linku — nie będziemy ludziom zabierać odłożonego. Imiona można wymazać w koncie: wyczyść pola i zapisz. Naciśnij „Wyloguj się” — ciasteczko zostanie usunięte i po logowaniu nie zostanie śladu. Żeby usunąć wszystko naraz, razem z wierszem ustawień, napisz do nas — wymażemy. Cofnąć dostęp strony do konta Google można tam, gdzie go udzieliłeś: w ustawieniach konta Google, w sekcji „Aplikacje innych firm”.',

    nextHead: 'Co zmieni się dalej',
    nextText:
      'Obiecaliśmy miejsce na sezony — i zrobiliśmy je. Obiecaliśmy, że witryna „Pomysły społeczności” nie pojawi się po cichu — i nie pojawiła się. Gdy sezony przeniosły się z adresu do bazy, ten tekst przepisaliśmy tą samą zmianą; gdy strona dostała trzy języki — również. Tak będzie i dalej.',

    contact: 'Pytania — na adres',
    updated: 'Zaktualizowano 4 września 2026',
    newSeason: 'Złóż swój sezon',
  },

  site: {
    brand: 'Sezon rodzinny',
    description:
      'Plakat rodzinnego miesiąca: drukuje się na dwóch kartkach A4 i żyje w twojej kolekcji.',
    navAria: 'Sekcje strony',
    home: 'Główna',
    ideas: 'Pomysły społeczności',
    seasons: 'Moje sezony',
    newSeason: 'Nowy sezon',
    accountTitle: '{who} — konto i ustawienia',
    footerNote: 'Bardzo czekamy na uwagi i pomysły — napiszcie do nas',
    privacy: 'Prywatność',
    cookies: 'Ciasteczka',
    langsAria: 'Język strony',
    login: 'Zaloguj się',
    loginProvider: '\u00a0przez Google',
    loginFull: 'Zaloguj się przez Google',
    loginAgain: 'Zaloguj się ponownie',
    toastClose: 'Zamknij komunikat',
    draftClaimed: 'Szkic „{title}” został zapisany w twojej kolekcji.',
  },

  consent: {
    bannerTitle: 'Analityka',
    bannerText:
      'Chcemy liczyć odwiedziny przez Google Analytics, żeby widzieć, z czego się na stronie korzysta. Dopóki nie pozwolisz, licznik nie działa.',
    accept: 'Akceptuję',
    decline: 'Odrzucam',
    more: 'Szczegóły',
    bannerAria: 'Zgoda na analitykę',

    head: 'Analityka',
    text: 'Czy liczyć twoje odwiedziny. Decyzję możesz zmienić w każdej chwili.',
    label: 'Analityka',
    on: 'Dozwolona',
    off: 'Zabroniona',
    save: 'Zapisz wybór',
  },

  editor: {
    prevMonth: 'Poprzedni miesiąc',
    nextMonth: 'Następny miesiąc',
    changeFace: 'Zmień rysunek',
    faceAria: 'Rysunek: {face}. Zmień',
    removePerson: 'Usuń: {name}',
    removePersonTitle: 'Usuń z arkusza',
    addPerson: '+ Dodaj osobę',
    progressAria: '{label}: postęp {percent}%',
    paletteAria: 'Motyw plakatu: {label}. Zmień na losowy',
    iconsAria: 'Rysunki plakatu: {label}. Zmień na losowe',
    paletteTitle: 'Inny motyw plakatu — losowy ze stu',
    iconsTitle: 'Inne rysunki plakatu — losowy zestaw z dwudziestu',
  },

  status: {
    emptyList: 'Na razie nie ma sezonów. Utwórz nowy.',
    library: {
      limit: 'Nie przechowujemy więcej niż {n} sezonów — usuń zbędne w „Moich sezonach”.',
      stale: 'Nie udało się zapisać. Odśwież stronę i zaloguj się ponownie.',
      error: 'Nie udało się zapisać — błąd serwera. Spróbuj jeszcze raz.',
    },
    publish: {
      duplicate: 'Taki sezon jest już wystawiony.',
      blocked: 'Ten sezon został zamknięty po zgłoszeniach.',
      limit: 'Wystawić można nie więcej niż {n} sezonów — zdejmij zbędne z witryny.',
      stale: 'Odśwież stronę i zaloguj się ponownie.',
      error: 'Nie wyszło — błąd serwera. Spróbuj jeszcze raz.',
    },
    reaction: {
      own: 'To twój własny sezon.',
      blocked: 'Ten sezon jest zamknięty.',
      limit: 'Nie przechowujemy więcej niż {n} takich wpisów — usuń zbędne.',
      stale: 'Odśwież stronę i zaloguj się ponownie.',
      error: 'Nie wyszło — błąd serwera. Spróbuj jeszcze raz.',
    },
    login: {
      favorite: 'Żeby dodać sezon do ulubionych, trzeba się zalogować.',
      like: 'Żeby polubić sezon, trzeba się zalogować.',
      report: 'Żeby zgłosić sezon, trzeba się zalogować.',
    },
  },
}
