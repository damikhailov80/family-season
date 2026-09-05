import type { Dict } from '../types'

export const en: Dict = {
  poster: {
    labels: {
      theme: '1. Theme of the month',
      themeSummary: 'How it went',
      weeks: '2. Weeks of the month',
      goal: 'Our goal for the month',
      projects: '3. Personal storylines',
      mood: '4. How our family felt',
      nextIdeas: 'Ideas for next month',
      fieldProject: 'Project:',
      fieldProgress: 'Progress',
      fieldGoal: 'My goal this month:',
      moodWho: 'Who',
      moodCaption: 'How each of us felt, day by day',
    },
    mood: {
      good: 'Good',
      ok: 'Okay',
      bad: 'Bad',
    },
    placeholders: {
      title: 'Family Season',
      ribbon: 'Our life. Our adventures. Our months.',
      subtitle: 'Our month together',
      question: 'What has stayed with us the most?',
      weeksNote: '4 weeks – 4 ideas – 4 memories',
      weekTitle: 'Week',
      weekText: 'What we are doing this week',
      goal: 'What we want to do together',
      projectsNote: 'Our own goals and progress',
      name: 'Name',
      project: 'My project',
      description: 'What this project is',
      personGoal: 'What I want to get to',
    },
    faces: {
      dad: 'grown-up',
      mom: 'grown-up',
      son: 'boy',
      daughter: 'girl',
    },
    months: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    monthsOf: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    anonNames: [
      'Alex',
      'Bella',
      'Chris',
      'Dana',
      'Evan',
      'Faye',
      'Grace',
      'Henry',
      'Ivy',
      'Jonah',
      'Kate',
      'Liam',
    ],
    monthLowercaseInText: false,
    untitled: 'Season',
  },

  dialogs: {
    cancel: 'Cancel',
    close: 'Close',
    save: 'Save',
    done: 'Done',
    titleLabel: 'Name',

    newSeason: 'New season',
    creating: 'Creating…',
    draftWillBeLost:
      'Without signing in you can keep only one season. The draft “{title}” will be replaced.',

    login: 'Sign in required',
    notNow: 'Not now',

    rename: 'New name',
    renameHint: 'Enter a new name for the season.',

    fork: 'Fork the season',
    forkAction: 'Fork',

    publish: 'Put on the showcase',
    publishHint: 'A copy of the season will appear in Community Ideas.',
    publishing: 'Publishing…',
    publishChecking: 'Checking…',
    publishAction: 'Publish',
    publishAnonymize: 'Replace the names with random ones',
    publishLangLabel: 'Season language',
    publishSeeIt: 'See it on the showcase',

    withdraw: 'Take off the showcase',
    withdrawAction: 'Take off',
    withdrawing: 'Taking off…',
    withdrawAsk: 'Are you sure you want to take the season out of Community Ideas?',
    withdrawNote:
      'Anyone who saved the season to their favourites keeps it, and the link still opens.',

    report: 'Report the season',
    reportAgain: 'Update the report',
    reportHint: 'Tell us what is wrong with this season.',
    reportAgainHint: 'The new text replaces the old one.',
    reportLabel: 'What is wrong',
    reportPlaceholder: 'For example: an ad in a week description',
    reportSend: 'Send',
    reportSending: 'Sending…',

    share: 'Share a link',
    shareHave: 'Send the link to whoever you want to show the season to.',
    shareNone: 'Create a link to share the season.',
    shareLabel: 'Link',
    shareCreate: 'Create a link',
    shareRevoke: 'Revoke',
    shareCopy: 'Copy',

    familySwap: 'Use my own family',
    familyAsk: 'Replace the characters with your family?',
    familyApply: 'Replace',
    familyNow: 'On the poster now',
    familyNext: 'Will become',
    familyNote: 'Only the drawings and names change.',
    familyDropOne: 'The bottom card will be removed.',
    familyDropMany: 'The bottom cards ({n}) will be removed.',
  },

  landing: {
    title: 'Printable family planner for the month — free | Family Season',
    description:
      'A free printable family planner for the month: what you’ll do together, who takes what, the goal of the month. Build it online, print on A4, put it on the fridge.',

    heroTitle: 'Family Season',
    heroTitleTail: 'a printable family planner for the month',
    heroRibbon: 'A new season every month',
    heroLead:
      'Plan next month together: what you will do, what you will try, where you will go and who has taken on what. Print it on two A4 sheets and put it on the fridge — free, no sign-up.',
    heroHand: 'Not a to-do list but a playbill: a month worth living.',
    heroJump: 'See the examples ↓',

    stepsLabel: 'How to build the plan',
    stepsNote: 'four steps',
    steps: [
      {
        title: 'Think up the season',
        text: 'A name for the month, who is in the leading roles and what each of you will do. All of it is edited right on the poster.',
      },
      {
        title: 'Print the playbill',
        text: 'Exactly two A3 pages — the layout is checked on a family of five and a month of 31 days.',
      },
      {
        title: 'Put it on the fridge',
        text: 'On a magnet, somewhere visible: a poster only works when it catches your eye.',
      },
      {
        title: 'Live the month',
        text: 'Moods day by day, project progress, week photos, the wrap-up — by hand, all together.',
      },
    ],

    insideLabel: 'What is in the planner',
    insideNote: 'two A4 pages',
    parts: [
      {
        title: 'The season name',
        text: 'The theme of the month and a question the family answers at the end.',
      },
      {
        title: 'Four weeks',
        text: 'Four episodes of the month: each has its own idea and an empty polaroid frame for a photo.',
      },
      {
        title: 'Personal projects',
        text: 'Everyone’s storyline: their own thing, a description, a goal and a ten-step scale.',
      },
      {
        title: 'A mood chronicle',
        text: 'A cell for every day of the month for each of you — filled in by hand.',
      },
      {
        title: 'Wrap-up and next up',
        text: 'What the season is remembered for and what you came up with for the next one — large fields for notes.',
      },
    ],
    palettesTitle: 'A hundred colour themes',
    palettesText:
      'In edit mode the button throws the poster into a random theme until you like one; the theme travels with the season, and your family will open the poster in the very same colours. Each theme is set by four paints — the sheet works out the rest from them.',
    insideFootnote:
      'What prints is always a clean poster: scales at zero, mood cells empty, note fields free. The month itself fills in the rest, by hand.',

    examplesLabel: 'Family plan examples',
    examplesNote: 'all different',
    exampleOpen: 'Open the example →',
    examplesAsideTitle: 'Take one as a starting point',
    examplesAsideText:
      'Any example can be forked right on the poster and rewritten for you — the characters, the projects, the name of the season. Or build a season from scratch, if your own idea comes faster.',
    examplesAsideHand:
      'You can share your own season with a private link: it opens for anyone, with no sign-in.',
    examplesAction: 'Build my own season',

    communityLabel: 'Community Ideas',
    communityNote: 'other people’s seasons in full',
    communityText:
      'You do not have to invent a month from scratch. Families put their seasons on a shared showcase: somebody’s “Month of Water”, somebody’s storylines for four, somebody’s wrap-up with a question the whole family answered. Any season there opens in full — you can try it in your own theme and fork it for your own characters, keeping only what you liked.',
    communityHand: 'We show a random set every time — drop by when your own ideas run out.',
    communityAction: 'See Community Ideas',
  },

  seasons: {
    title: 'My seasons — Family Season',
    description: 'Your account: saved seasons and what you put in favourites.',
    heading: 'My seasons',

    tabsAria: 'What to show',
    tabSeasons: 'Mine',
    tabFavorites: 'Favourites',
    tabPublished: 'Published',

    searchPlaceholder: 'Search by name',
    searchAction: 'Find',
    sortByDate: 'by date',
    sortByName: 'by name',

    savedAt: 'saved',
    favoritedAt: 'saved on',
    publishedAt: 'published',
    offStage: 'taken off the showcase',
    blocked: 'closed after reports',
    statLikes: 'likes: {n}',
    statFavorites: 'in favourites: {n}',
    statForks: 'forks: {n}',

    nothingFound: 'Nothing matches this search.',
    emptyFavorites: 'Favourites are empty. Press ☆ on any season from the showcase.',
    emptyPublished:
      'You have not published anything yet. Open one of your seasons and press the megaphone.',
    newSeason: 'Create a new season',

    staleNote:
      'You signed in before the account existed, so there is nothing to attach the seasons to. One more sign-in fixes it.',
    listError: 'Could not load the list — a server error.',
    addLimit: 'We do not keep more than {n} seasons per account — delete some.',
    addError: 'Could not create the season — a server error.',

    renameOne: 'Rename “{title}”',
    removeOne: 'Delete “{title}”',
    removeAskOne: 'Are you sure you want to delete the season “{title}”?',
    removeDraftAsk: 'Are you sure you want to delete the draft “{title}”?',
    removeHeading: 'Confirm deletion',
    removeAction: 'Delete',
    unfavoriteOne: 'Remove “{title}” from favourites',
    showcaseOnOne: 'Take “{title}” off the showcase',
    showcaseOffOne: 'Put “{title}” back on the showcase',
    withdrawAskOne: 'Are you sure you want to take the season “{title}” out of Community Ideas?',
  },

  account: {
    title: 'Account — Family Season',
    description: 'Settings: the site language and the family for new posters.',
    heading: 'Account',
    saved: 'Saved ✓',

    signedOutTitle: 'Settings are for signed-in people',
    signedOutText:
      'This is where the language and the family for new posters live. To have something to attach the settings to, you need to sign in.',
    newSeason: 'Build my own season',
    familyHint:
      'Click a drawing to change the character. From {min} to {max} people; everyone needs a name.',
    error: 'Could not load the settings — a server error.',
    logoutHead: 'Sign out',
    logout: 'Sign out',
    langHead: 'Language',
    langText:
      'The site opens in this language for you. It does not touch seasons you have already created.',
    langLabel: 'Site language',

    familyHead: 'The family for new posters',
    familyText:
      '“New season” will open with these characters. It does not touch seasons you have already created.',

    staleNote:
      'You signed in before the settings existed, so there is nothing to attach them to. Signing in again is enough — you only need to do it once.',

    addPerson: '+ Add',
    saveFamily: 'Save the family',
    saving: 'Saving…',
    saveLanguage: 'Save the language',
    saveFailedError: 'Could not save the settings — a server error. Please try again.',
    saveFailedUnnamed: 'Could not save. Enter a name for everyone.',
    saveFailedStale: 'Could not save. Refresh the page and sign in again.',
    saveFailedAnonymous: 'Could not save. Refresh the page and sign in again.',
    changeFace: 'Change the drawing',
    removeTitle: 'Remove from the family',
    namePlaceholder: 'Name',
    faceAria: 'Drawing: {face}. Change',
    nameAria: 'Name: {face}',
    removeAria: 'Remove: {name}',
  },

  ideas: {
    title: 'Ideas: what to do as a family this month | Family Season',
    description:
      'Ready-made month plans from other families: a “Month of Water”, a “Month with No Screens”, projects for four. Open one, change it for you and print it.',
    heading: 'Community Ideas',
    lead: 'The hardest part of the poster is deciding what to fill the month with. It is easier when you see how others did it: somebody’s “Month of Water”, somebody’s “Month Without Screens”, somebody’s storylines for four. Any season here can be opened and forked for your own family.',
    note: 'Families put the seasons here themselves — with the megaphone button on their own season. We show a random set every time: that way a new one has a chance to catch your eye instead of drowning under the ones already visible. If you see an ad, rudeness or someone else’s personal data, press the flag: we take such seasons off the showcase.',
    emptyHand:
      'The showcase is empty so far — nobody has published a season yet. Want to be first?',
    emptyNote:
      'Create a season in “My seasons”, open it and press the megaphone — it will show up here.',
    seeExamples: 'See the examples',
    reportOne: 'Report “{title}”',
    reportSent: 'Report sent',
    another: 'Show me others',
    error: 'Could not load the showcase — a server error.',
    likesAria: 'Likes: {n}',
    newSeason: 'Build my own season',
  },

  bars: {
    toolbarAria: 'Things to do with the season',
    toolbarDraftAria: 'Things to do with the draft',
    edit: 'Edit',
    ready: 'Done',
    printTitle: 'Print / PDF',
    fork: 'Fork',
    rename: 'Rename the season',

    favoriteOn: 'Save to favourites',
    favoriteOff: 'Remove from favourites',
    likeOn: 'Like',
    likeOff: 'Remove the like',
    likeAriaCount: '{action}, likes so far: {n}',
    reportOpen: 'Report',
    reportDone: 'Report sent',
    likesOnShowcase: 'Likes on the showcase: {n}',
    copyLink: 'Copy the link to the season',
    copyLinkShort: 'Copy the link',
    linkPrompt: 'Link to the season:',
    linkIssued: 'A private link has been issued',
    linkNone: 'Show it with a private link',
    linkCopied: 'Link copied',
    linkCopyByHand: 'Copy the link from the field',

    publish: 'Put it on the community showcase',
    withdraw: 'Take off the showcase',
    republish: 'Put back on the showcase',
    published: 'The season is on the showcase',
    publishedAgain: 'That season was already on the showcase',

    likesAria: 'Likes: {n}',

    save: 'Save to my seasons',
    saving: 'Saving…',

    placeDraft: 'A draft in this browser',
    placeShared: 'A season by link',
    placeExample: 'Our example',
    placePublic: 'A community season',
    placeOwn: 'Your season',
    withTitle: '{place}: {title}',
  },

  pages: {
    seasonGoneTitle: 'No such season',
    seasonGoneText:
      'We do not have this season. Its author may have taken it off the showcase or deleted it, and the link may have been mistyped.',
    seasonGoneIdeas: 'See Community Ideas',
    notFoundTitle: 'Page not found',
    notFoundText:
      'There is no such address on the site. The link may have been mistyped, or the season deleted.',
    notFoundHome: 'Go to the home page',
    sheetTitle: 'Season poster — Family Season',
    sheetDescription: 'Build a season for your family and print it on two A4 sheets.',
    sheetEditTitle: 'Editing the season — Family Season',
    sheetEditDescription:
      'Rewrite the season for your family: characters, weeks, projects and the goal of the month.',
    publicTitle: 'A season — Family Season',
    publicDescription: 'A published season: somebody’s month in full, with storylines and a goal.',
    publicTitleOf: '{title} — a family month plan | Family Season',
    publicDescriptionOf: 'A family plan for the month: {text}',
    publicError: 'Could not open the season — a server error.',
    sharedTitle: 'A season by link — Family Season',
    sharedDescription: 'A family season shared with you: take a look and take it for yourself.',
    sharedError: 'Could not open the season — a server error.',
    ownTitle: '{title} — Family Season',
    ownError: 'Could not open the season — a server error.',
    autosaveFailed: 'Could not save the edits — a server error.',
  },

  privacy: {
    title: 'Privacy — Family Season',
    description:
      'What the site keeps about you: your account settings, your seasons and what you have shown to others.',
    heading: 'Privacy',
    lead1: 'We keep only what you saved yourself',
    lead2:
      'The site language, the family for new posters, your seasons and what you have shown to others yourself. We have neither your name from Google nor your email.',

    loginHead: 'What happens when you sign in',
    loginText:
      'Google tells the site your name, your email address and the internal number of your account. The name and the email go straight into an encrypted cookie in your own browser — and stay only there: they are not on the server, neither in the database nor in the logs. We do not pass them to anyone and we do not send letters.',

    anonHead: 'Before you sign in',
    anonText:
      'You can build and print a poster with no sign-in at all. Such a draft lives **only in your browser** — we do not have it: no row in the database, no address to open it by. There is one per browser, and it disappears if you clear the site data; that is why the bar above the poster offers to save it to your seasons.',

    dbHead: 'What is in the database',
    dbIntro:
      'Everything there is tagged with the opaque number of your Google account — something like “google:1234567890”. Neither your name from Google nor your email is anywhere in the database. There are several kinds of rows, and every one of them appears only if you did something yourself.',
    dbSettings:
      '**Account settings** — the site language and the family for new posters: up to five pairs of “a drawing and a name”, for example “grown-up — Denis”. You type the names yourself, and typing them is not required: the setting works exactly the same without them. Your answer about analytics lives there too, along with the date you gave it and what exactly we asked back then — otherwise we could not show you what you agreed to.',
    dbSeasons:
      '**Your seasons** — the poster itself: everything printed on it, plus the name you gave it, the colour theme, the drawing set and the language the sheet is captioned in. Up to a hundred of them. The family names are kept separately from the rest — that is how they can be replaced on publication without touching the season itself. Next to it lies the date of the last edit; the list is sorted by it.',
    dbPublic:
      '**Published seasons** — a **copy** of a season sent to the showcase, with its own permanent address and its own language. The copy lives on its own: edits in your season do not change it, and deleting the season does not take it away. **Likes** and **favourites** are marks saying “this account liked (saved) this season”; we only count them. **Forks** are the same kind of mark, “this account took the season for itself”: the author sees a number, not who exactly. **Reports** are your report text together with whose publication it is about; we see it, the poster’s author does not. A publication that has been reported can be taken off the showcase by its author but not deleted outright: a report has to point at what it was filed about until we have reviewed it.',

    whereHead: 'Where your season lives',
    whereText:
      'In our database, as a row, and it opens at a short address like “/en/season/ab12cd” — the poster is not in the address itself, only the site language and a pointer to the row. Only you can open it: somebody else’s address answers exactly like a made-up one.',
    whereNote:
      'An important consequence: **everything printed on the poster is with us** — the name of the month, the names and projects of the family, goals, plans for the weeks. Typing the names is not required. What you write by hand on the printout we do not have at all. The site does not upload or store photographs: the poster has an empty frame for gluing one in on paper.',

    othersHead: 'What other people see',
    othersIntro:
      'Nothing — until you invite somebody yourself. There are two ways, and they differ.',
    othersLink:
      '**Share a link** — you issue it yourself, and the season opens for anyone you send it to, with no sign-in and no account. They cannot edit anything. The link can be revoked or replaced by a new one: the previous one stops working that instant.',
    othersShowcase:
      '**The Community Ideas showcase** is open to everyone, including people who never signed in. Everyone sees the seasons of their own language on it, but a direct link opens any of them. We review reports on what is published by hand: if a season breaks decency, we close it — it then stops opening both on the showcase and by a direct link, and the same one cannot be published again. A copy of the season goes there, and it is shown in full: **everything printed on the poster — names, projects, plans — is visible to everyone**. When publishing you can tick a box and replace the family names with random ones — then the showcase gets those, and your own season keeps the real ones. Neither your name nor your email appears next to it: the showcase does not show who the author is.',

    cookiesHead: 'Cookies',
    cookiesText:
      'A cookie with your session — that is the whole of signing in — a cookie with the language you chose, so the site opens in it, and a cookie with your answer about analytics. Plus a few temporary technical ones that live a couple of seconds during the sign-in itself. All of these are needed by the site itself, and without them it does not work. There are no advertising trackers on the site.',

    analyticsHead: 'Analytics',
    analyticsText:
      'We count visits with Google Analytics — to see which pages get used and which ones can go. This is the only thing the site collects **not for the sake of your poster**, which is why we ask permission: until you answer “Accept”, Google receives no requests and sets no cookies at all. Answer “Accept” and the **_ga** and **_ga_…** cookies appear: they tell visits apart and live for up to two years. Neither your name, nor your email, nor anything written on your posters goes there. You can change your mind at any moment — with the “Cookies” link at the bottom of any page, and, once signed in, in your account as well; we will not ask again for at least six months.',

    deleteHead: 'How to delete everything',
    deleteText:
      'Seasons and bookmarks are deleted one by one right in “My seasons” — with the cross in the row. A publication is removed there or on the showcase itself: if nobody saved it, it disappears completely; if somebody did, it drops out of Community Ideas but keeps opening by a direct link — we will not take away from people what they saved. The names can be erased in the account: clear the fields and save. Press “Sign out” and the cookie is deleted, leaving no trace of the sign-in. To remove everything at once, together with the settings row, write to us — we will erase it. You can revoke the site’s access to your Google account in the same place you granted it: your Google account settings, the “Third-party apps” section.',

    nextHead: 'What will change next',
    nextText:
      'We promised a place to keep seasons — and we made it. We promised that the Community Ideas showcase would not appear silently — and it did not. When the seasons moved from the address into the database, this text was rewritten in the same change; when the site got three languages, so was it. That is how it will be from now on.',

    contact: 'Questions — by email:',
    updated: 'Updated 4 September 2026',
    newSeason: 'Build my own season',
  },

  monthsPage: {
    title: 'Ideas month by month — what to do as a family | Family Season',
    description:
      'Every month has things of its own: September is still warm enough for the woods and the harvest is already in. Pick a month and take a ready plan — rewrite it for you and print it.',
    heading: 'Ideas month by month',
    lead: 'Every month has things of its own. Pick a month and you get ready plans inside: the weeks, a project for everybody and the goal of the month. Any of them can be rewritten for your family and printed on two A4 sheets.',
  },

  site: {
    brand: 'Family Season',
    alternateName: 'Family Season — printable family planner',
    ogAlt: 'Family Season poster: the mark and the site name',
    description:
      'A family planner for the month: build it, print it on two A4 sheets and put it on the fridge.',
    navAria: 'Site sections',
    ideas: 'Community Ideas',
    byMonth: 'Ideas month by month',
    months: 'Months',
    seasons: 'My seasons',
    newSeason: 'New season',
    accountTitle: '{who} — account and settings',
    footerNote: 'We would love your ideas and feedback — write to us',
    privacy: 'Privacy',
    cookies: 'Cookies',
    langsAria: 'Site language',
    login: 'Sign in',
    loginProvider: '\u00a0with Google',
    loginFull: 'Sign in with Google',
    loginAgain: 'Sign in again',
    toastClose: 'Close the message',
    draftClaimed: 'The draft “{title}” has been saved to your collection.',
  },

  consent: {
    bannerTitle: 'Analytics',
    bannerText:
      'We would like to count visits with Google Analytics, to see what the site is used for. Until you allow it, the counter does not run.',
    accept: 'Accept',
    decline: 'Decline',
    more: 'Details',
    bannerAria: 'Analytics consent',

    head: 'Analytics',
    text: 'Whether to count your visits. You can change this at any time.',
    label: 'Analytics',
    on: 'Allowed',
    off: 'Not allowed',
    save: 'Save the choice',
  },

  editor: {
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    changeFace: 'Change the drawing',
    faceAria: 'Drawing: {face}. Change',
    removePerson: 'Remove: {name}',
    removePersonTitle: 'Remove from the sheet',
    addPerson: '+ Add a person',
    progressAria: '{label}: progress {percent}%',
    paletteAria: 'Poster theme: {label}. Change to a random one',
    iconsAria: 'Poster drawings: {label}. Change to a random set',
    paletteTitle: 'Another poster theme — a random one out of a hundred',
    iconsTitle: 'Other poster drawings — a random set out of twenty',
  },

  status: {
    library: {
      limit: 'We do not keep more than {n} seasons — delete some in “My seasons”.',
      stale: 'Could not save. Refresh the page and sign in again.',
      error: 'Could not save — a server error. Please try again.',
    },
    publish: {
      duplicate: 'A season like this has already been published.',
      blocked: 'This season was closed after reports.',
      limit: 'You can publish no more than {n} seasons — take some off the showcase.',
      stale: 'Refresh the page and sign in again.',
      error: 'It did not work — a server error. Please try again.',
    },
    reaction: {
      own: 'This is your own season.',
      blocked: 'This season is closed.',
      limit: 'We do not keep more than {n} such records — remove some.',
      stale: 'Refresh the page and sign in again.',
      error: 'It did not work — a server error. Please try again.',
    },
    login: {
      favorite: 'To add the season to favourites you need to sign in.',
      like: 'To like the season you need to sign in.',
      report: 'To report the season you need to sign in.',
    },
    emptyList: 'No seasons yet. Create a new one.',
  },
}
