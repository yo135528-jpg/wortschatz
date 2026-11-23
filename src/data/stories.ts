/**
 * Graded reading stories. Words in [brackets] are tappable: `[surface|lemma]`.
 * A lemma must exist in cards.json or in the story's glossary (checked by `npm run validate`).
 * Every sentence has a natural Turkish translation.
 */
export const STORIES = [
  {
    id: 'der-lange-weg-zur-arbeit',
    level: 'B2',
    title: 'Der lange Weg zur Arbeit',
    titleTr: 'İşe giden uzun yol',
    summaryTr: 'Martin her sabah trenle işe gidiyor. Bugün yanındaki meslektaşının anlatacakları var.',
    chapter: 'Kapitel 2',
    parts: [
      {
        title: 'Im Zug',
        paragraphs: [
          [
            { de: 'Jeden Morgen [pendelt|pendeln] Martin eine Stunde mit dem Zug nach Köln.', tr: 'Martin her sabah trenle Köln\'e bir saat yol gidip geliyor.' },
            { de: 'Meistens liest er Zeitung, aber heute will ihm ein Kollege unbedingt von seiner [Kündigung] erzählen.', tr: 'Genelde gazete okur ama bugün bir meslektaşı ona işten çıkarılmasını mutlaka anlatmak istiyor.' },
            { de: 'Martin ist [erschöpft], doch aus [Höflichkeit] hört er zu.', tr: 'Martin bitkin, ama nezaketen dinliyor.' },
          ],
          [
            { de: '„Stell dir vor, sie haben mir [fristlos] gekündigt!“, sagt Jens.', tr: '„Düşünsene, beni bir günde kapı dışarı ettiler!“ diyor Jens.' },
            { de: '„Ich habe doch nur mein Handy im Büro [aufgeladen|aufladen].“', tr: '„Oysa sadece telefonumu ofiste şarj ettim.“' },
            { de: 'Martin glaubt ihm kein Wort, denn so etwas wäre doch [lächerlich].', tr: 'Martin ona hiç inanmıyor, çünkü böyle bir şey düpedüz saçma olurdu.' },
          ],
        ],
      },
      {
        title: 'Die ganze Wahrheit',
        paragraphs: [
          [
            { de: 'Erst kurz vor Köln erzählt Jens die ganze Geschichte.', tr: 'Jens bütün hikâyeyi ancak Köln\'e varmadan hemen önce anlatıyor.' },
            { de: 'Er hatte wochenlang private E-Mails geschrieben, obwohl sein Chef das [ausdrücklich] verboten hatte.', tr: 'Şefi açıkça yasaklamasına rağmen haftalarca özel e-postalar yazmıştı.' },
            { de: 'Außerdem kam er oft zu spät und hat nie [um Entschuldigung gebeten|um Entschuldigung bitten].', tr: 'Üstelik sık sık geç kalmış ve bir kez bile özür dilememiş.' },
          ],
          [
            { de: '„Vielleicht war das Handy nur [der Tropfen, der das Fass zum Überlaufen gebracht hat|der Tropfen, der das Fass zum Überlaufen bringt]“, meint Martin vorsichtig.', tr: '„Belki telefon sadece bardağı taşıran son damlaydı“ diyor Martin dikkatlice.' },
            { de: 'Jens schweigt eine Weile, dann lacht er: „Du hast recht. Beim nächsten Job halte ich die [Probezeit] durch – mit guten [Vorsätzen|Vorsatz].“', tr: 'Jens bir süre susuyor, sonra gülüyor: „Haklısın. Bir sonraki işte deneme süresini atlatacağım, iyi niyetlerle.“' },
            { de: 'Als der Zug in Köln hält, hat Martin keine einzige Seite gelesen, aber die Zeit hat er sich gut [vertrieben|sich die Zeit vertreiben].', tr: 'Tren Köln\'de durduğunda Martin tek bir sayfa bile okumamış, ama vakti iyi geçmiş.' },
          ],
        ],
      },
    ],
    glossary: [
      {
        type: 'adjective',
        lemma: 'erschöpft',
        meaningTr: 'bitkin, çok yorgun',
        hintTr: 'sıfat',
        cloze: 'Nach der Nachtschicht war sie völlig [erschöpft].',
        clozeTr: 'Gece vardiyasından sonra tamamen bitkindi.',
        examples: [{ de: 'Martin ist erschöpft, doch aus Höflichkeit hört er zu.', tr: 'Martin bitkin, ama nezaketen dinliyor.', fromBook: false }],
        note: 'İsmi: die Erschöpfung (bitkinlik). müde\'den daha güçlü.',
      },
      {
        type: 'expression',
        lemma: 'der Tropfen, der das Fass zum Überlaufen bringt',
        meaningTr: 'bardağı taşıran son damla',
        hintTr: 'deyim',
        cloze: 'Seine Bemerkung war [der] [Tropfen], [der] [das] [Fass] [zum] [Überlaufen] [brachte].',
        clozeTr: 'Onun sözü bardağı taşıran son damla oldu.',
        examples: [{ de: 'Das war der Tropfen, der das Fass zum Überlaufen gebracht hat.', tr: 'Bu, bardağı taşıran son damla oldu.', fromBook: false }],
      },
      {
        type: 'noun',
        lemma: 'Vorsatz',
        noun: { gender: 'der', plural: '¨-e' },
        meaningTr: 'niyet, karar (yapmaya karar verilen şey)',
        hintTr: 'isim',
        cloze: 'Für das neue Jahr habe ich [gute] [Vorsätze]: mehr Sport und weniger Handy.',
        clozeTr: 'Yeni yıl için iyi kararlarım var: daha çok spor, daha az telefon.',
        examples: [{ de: 'Beim nächsten Job halte ich die Probezeit durch – mit guten Vorsätzen.', tr: 'Bir sonraki işte deneme süresini atlatacağım, iyi niyetlerle.', fromBook: false }],
        note: 'gute Vorsätze fürs neue Jahr = yeni yıl kararları. Absicht\'ten farkı: Vorsatz bilinçli alınmış bir karardır.',
      },
    ],
  },
  {
    id: 'aerger-im-grossraumbuero',
    level: 'B2',
    title: 'Ärger im Großraumbüro',
    titleTr: 'Açık ofiste huzursuzluk',
    summaryTr: 'Lena yeni ofisteki gürültüden bıkmış. Şikâyet mi etsin, yoksa önce ekiple mi konuşsun?',
    chapter: 'Kapitel 2',
    parts: [
      {
        title: 'Zu laut',
        paragraphs: [
          [
            { de: 'Seit dem Umzug arbeitet Lena in einem modernen [Großraumbüro].', tr: 'Taşınmadan beri Lena modern bir açık ofiste çalışıyor.' },
            { de: 'Am Anfang fand sie die offene [Atmosphäre] toll.', tr: 'Başta açık ortamı harika buluyordu.' },
            { de: 'Doch inzwischen [nervt|nerven] sie fast alles: Kollegen telefonieren [ständig] laut, und mittags riecht es aus der [Teeküche] nach Fisch.', tr: 'Ama artık neredeyse her şey sinirini bozuyor: meslektaşları sürekli yüksek sesle telefonla konuşuyor, öğlenleri mutfaktan balık kokusu geliyor.' },
            { de: 'Lena kann sich kaum noch [konzentrieren].', tr: 'Lena artık neredeyse hiç konsantre olamıyor.' },
          ],
          [
            { de: 'Am liebsten würde sie sich sofort beim Chef [beschweren].', tr: 'En çok da hemen şefe şikâyet etmek istiyor.' },
            { de: 'Ihre Freundin rät ihr aber, zuerst im Team [Bedenken zu äußern|Bedenken äußern].', tr: 'Ama arkadaşı ona önce ekipte endişelerini dile getirmesini tavsiye ediyor.' },
            { de: '„Mach einen konkreten [Vorschlag]“, sagt sie, „sonst klingt es nur nach [Meckern|meckern].“', tr: '„Somut bir öneride bulun“ diyor, „yoksa sadece söylenmek gibi görünür.“' },
          ],
        ],
      },
      {
        title: 'Die Lösung',
        paragraphs: [
          [
            { de: 'In der nächsten [Besprechung] spricht Lena das Thema an.', tr: 'Bir sonraki toplantıda Lena konuyu açıyor.' },
            { de: 'Zu ihrer Überraschung geht es vielen Kollegen genauso.', tr: 'Şaşırtıcı bir şekilde birçok meslektaşı da aynı durumda.' },
            { de: 'Gemeinsam finden sie einen [Kompromiss]: Lange Telefonate führt man jetzt in einem kleinen Raum, und die Tür der Teeküche bleibt zu.', tr: 'Birlikte bir orta yol buluyorlar: Uzun telefon görüşmeleri artık küçük bir odada yapılıyor ve mutfağın kapısı kapalı kalıyor.' },
          ],
          [
            { de: 'Seitdem ist die [Stimmung] im Büro viel [entspannter|entspannt].', tr: 'O günden beri ofisteki hava çok daha rahat.' },
            { de: 'Lena hat etwas gelernt: Wer sich nur [ärgert|ärgern], ändert nichts. Wer redet, schon.', tr: 'Lena bir şey öğrendi: Sadece kızan hiçbir şeyi değiştirmez. Konuşan değiştirir.' },
          ],
        ],
      },
    ],
    glossary: [
      {
        type: 'noun',
        lemma: 'Großraumbüro',
        noun: { gender: 'das', plural: '-s' },
        meaningTr: 'açık ofis',
        hintTr: 'isim',
        cloze: 'In [einem] [Großraumbüro] ist es oft laut.',
        clozeTr: 'Açık ofiste ortam çoğu zaman gürültülü olur.',
        examples: [{ de: 'Seit dem Umzug arbeitet Lena in einem modernen Großraumbüro.', tr: 'Taşınmadan beri Lena modern bir açık ofiste çalışıyor.', fromBook: false }],
        note: 'Eş anlamlısı: das Open-Space-Büro. Zıttı: das Einzelbüro.',
      },
      {
        type: 'verb',
        lemma: 'meckern',
        verb: { reflexive: null, separablePrefix: null, praeteritum: 'meckerte', partizip2: 'gemeckert', auxiliary: 'haben' },
        rektion: [{ preposition: 'über', case: 'Akk' }],
        meaningTr: 'söylenmek, dırdır etmek',
        hintTr: 'fiil + edat',
        cloze: 'Er [meckert] ständig über das Essen in der Kantine.',
        clozeTr: 'Kantindeki yemek hakkında durmadan söyleniyor.',
        examples: [{ de: 'Sonst klingt es nur nach Meckern.', tr: 'Yoksa sadece söylenmek gibi görünür.', fromBook: false }],
        note: 'Günlük dil. Asıl anlamı keçinin melemesi.',
      },
      {
        type: 'noun',
        lemma: 'Besprechung',
        noun: { gender: 'die', plural: '-en' },
        meaningTr: 'toplantı, görüşme',
        hintTr: 'isim',
        cloze: 'Frau Klein ist gerade in [einer] [Besprechung].',
        clozeTr: 'Bayan Klein şu an toplantıda.',
        examples: [{ de: 'In der nächsten Besprechung spricht Lena das Thema an.', tr: 'Bir sonraki toplantıda Lena konuyu açıyor.', fromBook: false }],
        note: 'İş yerinde kısa iç toplantı; das Meeting ile aynı anlamda.',
      },
      {
        type: 'noun',
        lemma: 'Kompromiss',
        noun: { gender: 'der', plural: '-e' },
        meaningTr: 'uzlaşma, orta yol',
        hintTr: 'isim',
        cloze: 'Nach langer Diskussion haben wir [einen] [Kompromiss] gefunden.',
        clozeTr: 'Uzun bir tartışmadan sonra bir orta yol bulduk.',
        examples: [{ de: 'Gemeinsam finden sie einen Kompromiss.', tr: 'Birlikte bir orta yol buluyorlar.', fromBook: false }],
        note: 'einen Kompromiss finden / eingehen = uzlaşmaya varmak.',
      },
      {
        type: 'noun',
        lemma: 'Stimmung',
        noun: { gender: 'die', plural: '-en' },
        meaningTr: 'hava, ortam; ruh hâli',
        hintTr: 'isim',
        cloze: 'Auf der Party war [die] [Stimmung] super.',
        clozeTr: 'Partide hava harikaydı.',
        examples: [{ de: 'Seitdem ist die Stimmung im Büro viel entspannter.', tr: 'O günden beri ofisteki hava çok daha rahat.', fromBook: false }],
        note: 'gute Stimmung = iyi hava; in guter Stimmung sein = keyfi yerinde olmak.',
      },
      {
        type: 'verb',
        lemma: 'ärgern',
        verb: { reflexive: 'Akk', separablePrefix: null, praeteritum: 'ärgerte', partizip2: 'geärgert', auxiliary: 'haben' },
        rektion: [{ preposition: 'über', case: 'Akk' }],
        meaningTr: 'kızmak, sinirlenmek',
        hintTr: 'fiil, dönüşlü + edat',
        cloze: 'Ich [ärgere] [mich] über den Lärm.',
        clozeTr: 'Gürültüye sinirleniyorum.',
        examples: [{ de: 'Wer sich nur ärgert, ändert nichts.', tr: 'Sadece kızan hiçbir şeyi değiştirmez.', fromBook: false }],
        grammarTr: 'sich über etw. (Akk) ärgern = bir şeye kızmak; jdn. ärgern (dönüşsüz) = birini kızdırmak.',
      },
    ],
  },
];
