import type { RedemittelGroupInput } from '../domain/redemittel';

/**
 * Redemittel for B2 speaking and writing, grouped by function.
 * Standard German as used in class and in the exam; "…" marks the learner's own content.
 * Validated by `npm run validate`.
 */
export const REDEMITTEL: RedemittelGroupInput[] = [
  {
    id: 'meinung-aeussern',
    icon: '💭',
    titleDe: 'Meinung äußern',
    titleTr: 'Fikrini söylemek',
    summaryTr: 'Bir konuda ne düşündüğünü söylerken. Sınavda tartışma ve yazı bölümlerinin temeli.',
    skill: 'beide',
    items: [
      {
        de: 'Meiner Meinung nach …',
        tr: 'Bence …',
        example: { de: 'Meiner Meinung nach ist Teamarbeit wichtiger als Erfahrung.', tr: 'Bence ekip çalışması deneyimden daha önemli.' },
        note: 'Hemen ardından fiil gelir: Meiner Meinung nach ist … („Meiner Meinung nach, ich …“ ✗)',
      },
      {
        de: 'Ich bin der Ansicht, dass …',
        tr: '… görüşündeyim',
        example: { de: 'Ich bin der Ansicht, dass man im Beruf flexibel sein muss.', tr: 'İş hayatında esnek olmak gerektiği görüşündeyim.' },
        note: 'der Ansicht: Genitiv. dass cümlesinde fiil sonda.',
      },
      {
        de: 'Ich bin davon überzeugt, dass …',
        tr: '… olduğundan eminim',
        example: { de: 'Ich bin davon überzeugt, dass sich die Mühe lohnt.', tr: 'Bu zahmete değeceğinden eminim.' },
      },
      {
        de: 'Ich finde es wichtig, dass …',
        tr: '… olmasını önemli buluyorum',
        example: { de: 'Ich finde es wichtig, dass man sofort Feedback bekommt.', tr: 'İnsanın hemen geri bildirim almasını önemli buluyorum.' },
      },
      {
        de: 'Aus meiner Sicht …',
        tr: 'Benim açımdan …',
        example: { de: 'Aus meiner Sicht spricht nichts dagegen.', tr: 'Benim açımdan buna engel bir şey yok.' },
      },
      {
        de: 'Ich halte … für …',
        tr: '…-i … buluyorum',
        example: { de: 'Ich halte diese Idee für sehr sinnvoll.', tr: 'Bu fikri çok mantıklı buluyorum.' },
        note: 'halten für + Akk: Ich halte ihn für einen guten Chef.',
      },
    ],
  },
  {
    id: 'zustimmen',
    icon: '👍',
    titleDe: 'Zustimmen',
    titleTr: 'Katılmak',
    summaryTr: 'Karşındakinin fikrine katıldığını söylerken.',
    skill: 'sprechen',
    items: [
      {
        de: 'Da stimme ich Ihnen völlig zu.',
        tr: 'Bu konuda size tamamen katılıyorum.',
        example: { de: 'Da stimme ich Ihnen völlig zu, das sehe ich genauso.', tr: 'Bu konuda size tamamen katılıyorum, ben de aynı şekilde görüyorum.' },
        note: 'zustimmen + Dat: Ich stimme dir zu.',
      },
      {
        de: 'Das sehe ich genauso.',
        tr: 'Ben de aynen böyle görüyorum.',
        example: { de: 'Das sehe ich genauso: Ohne Pausen kann man nicht gut arbeiten.', tr: 'Ben de aynen böyle görüyorum: Mola vermeden iyi çalışılmaz.' },
      },
      {
        de: 'Da haben Sie recht.',
        tr: 'Bu konuda haklısınız.',
        example: { de: 'Da haben Sie recht, daran habe ich nicht gedacht.', tr: 'Bu konuda haklısınız, bunu düşünmemiştim.' },
      },
      {
        de: 'Das ist ein gutes Argument.',
        tr: 'Bu iyi bir argüman.',
        example: { de: 'Das ist ein gutes Argument, das überzeugt mich.', tr: 'Bu iyi bir argüman, beni ikna ediyor.' },
      },
      {
        de: 'Genau das wollte ich auch sagen.',
        tr: 'Ben de tam bunu söyleyecektim.',
        example: { de: 'Genau das wollte ich auch sagen: Die Kosten sind zu hoch.', tr: 'Ben de tam bunu söyleyecektim: Masraflar çok yüksek.' },
      },
    ],
  },
  {
    id: 'widersprechen',
    icon: '🤔',
    titleDe: 'Höflich widersprechen',
    titleTr: 'Kibarca karşı çıkmak',
    summaryTr: 'Katılmadığını kırmadan söylerken. Önce kabul et, sonra itirazını söyle.',
    skill: 'sprechen',
    items: [
      {
        de: 'Da bin ich anderer Meinung.',
        tr: 'Bu konuda farklı düşünüyorum.',
        example: { de: 'Da bin ich anderer Meinung, denn nicht jeder kann zu Hause arbeiten.', tr: 'Bu konuda farklı düşünüyorum, çünkü herkes evden çalışamaz.' },
        note: 'anderer Meinung: Genitiv, artikelsiz → -er.',
      },
      {
        de: 'Das sehe ich etwas anders.',
        tr: 'Ben bunu biraz farklı görüyorum.',
        example: { de: 'Das sehe ich etwas anders: Geld ist nicht alles.', tr: 'Ben bunu biraz farklı görüyorum: Para her şey değil.' },
      },
      {
        de: 'Das stimmt zwar, aber …',
        tr: 'Bu doğru ama …',
        example: { de: 'Das stimmt zwar, aber man darf die Nachteile nicht vergessen.', tr: 'Bu doğru ama dezavantajları da unutmamak lazım.' },
        note: 'zwar … aber: „gerçi … ama“.',
      },
      {
        de: 'Da muss ich Ihnen leider widersprechen.',
        tr: 'Bu konuda maalesef size katılamayacağım.',
        example: { de: 'Da muss ich Ihnen leider widersprechen, die Zahlen zeigen etwas anderes.', tr: 'Bu konuda maalesef size katılamayacağım, rakamlar başka bir şey gösteriyor.' },
        note: 'widersprechen + Dat.',
      },
      {
        de: 'Ich verstehe Ihren Standpunkt, aber …',
        tr: 'Bakış açınızı anlıyorum ama …',
        example: { de: 'Ich verstehe Ihren Standpunkt, aber ich sehe auch Risiken.', tr: 'Bakış açınızı anlıyorum ama ben riskler de görüyorum.' },
      },
      {
        de: 'Das überzeugt mich nicht ganz.',
        tr: 'Bu beni tam ikna etmiyor.',
        example: { de: 'Das überzeugt mich nicht ganz, weil es zu teuer wäre.', tr: 'Bu beni tam ikna etmiyor, çünkü fazla pahalı olurdu.' },
      },
    ],
  },
  {
    id: 'vermutungen',
    icon: '🔮',
    titleDe: 'Vermutungen äußern',
    titleTr: 'Tahmin yürütmek',
    summaryTr: 'Emin olmadığın bir şeyi tahmin ederken: resim anlatma, „Wer macht was?“ soruları.',
    skill: 'beide',
    items: [
      {
        de: 'Ich vermute, dass …',
        tr: '… olduğunu tahmin ediyorum',
        example: { de: 'Ich vermute, dass die Frau auf Bild B die Assistentin ist.', tr: 'B resmindeki kadının asistan olduğunu tahmin ediyorum.' },
      },
      {
        de: 'Wahrscheinlich …',
        tr: 'Muhtemelen …',
        example: { de: 'Wahrscheinlich ist er der Auszubildende.', tr: 'Muhtemelen o stajyer.' },
        note: 'Başta olunca hemen ardından fiil gelir.',
      },
      {
        de: 'Es könnte sein, dass …',
        tr: '… olabilir',
        example: { de: 'Es könnte sein, dass sie gerade mit einem Kunden telefoniert.', tr: 'Şu an bir müşteriyle telefonda konuşuyor olabilir.' },
      },
      {
        de: 'Daran erkennt man, dass …',
        tr: '… olduğu buradan anlaşılıyor',
        example: { de: 'Er hat ein großes Büro. Daran erkennt man, dass er eine hohe Position hat.', tr: 'Büyük bir ofisi var. Üst düzey bir pozisyonda olduğu buradan anlaşılıyor.' },
      },
      {
        de: 'Er/Sie wird wohl …',
        tr: 'Herhalde …-dır',
        example: { de: 'Sie wird wohl die Projektleiterin sein.', tr: 'Herhalde proje yöneticisidir.' },
        note: 'werden + wohl + mastar: gelecek değil, şimdiki zamana dair tahmin.',
      },
      {
        de: 'Ich nehme an, dass …',
        tr: '… olduğunu varsayıyorum',
        example: { de: 'Ich nehme an, dass die Besprechung länger dauert.', tr: 'Toplantının daha uzun süreceğini varsayıyorum.' },
        note: 'annehmen ayrılabilir: Ich nehme an, …',
      },
    ],
  },
  {
    id: 'vergleichen',
    icon: '⚖️',
    titleDe: 'Vergleichen und abwägen',
    titleTr: 'Karşılaştırmak, tartmak',
    summaryTr: 'İki seçeneği karşılaştırırken ve artı/eksileri sayarken.',
    skill: 'beide',
    items: [
      {
        de: 'Im Vergleich zu …',
        tr: '…-e kıyasla',
        example: { de: 'Im Vergleich zu früher arbeiten heute mehr Menschen im Homeoffice.', tr: 'Eskiye kıyasla bugün daha çok insan evden çalışıyor.' },
        note: 'zu + Dat.',
      },
      {
        de: 'Im Gegensatz zu …',
        tr: '…-in aksine',
        example: { de: 'Im Gegensatz zu meinem Kollegen arbeite ich lieber allein.', tr: 'İş arkadaşımın aksine ben yalnız çalışmayı tercih ederim.' },
      },
      {
        de: 'Einerseits …, andererseits …',
        tr: 'Bir yandan …, öte yandan …',
        example: { de: 'Einerseits verdient man gut, andererseits hat man kaum Freizeit.', tr: 'Bir yandan iyi kazanıyorsun, öte yandan neredeyse hiç boş vaktin olmuyor.' },
        note: 'İkisinden sonra da fiil hemen gelir.',
      },
      {
        de: 'Ein Vorteil ist, dass …',
        tr: 'Bir avantajı şu: …',
        example: { de: 'Ein Vorteil ist, dass man seine Arbeitszeit flexibel einteilen kann.', tr: 'Bir avantajı şu: Çalışma saatlerini esnek ayarlayabiliyorsun.' },
      },
      {
        de: 'Dagegen spricht, dass …',
        tr: 'Buna karşı olan nokta şu: …',
        example: { de: 'Dagegen spricht, dass man ständig unter Druck steht.', tr: 'Buna karşı olan nokta şu: İnsan sürekli baskı altında oluyor.' },
        note: 'Tersi: Dafür spricht, dass …',
      },
      {
        de: 'Ich würde lieber …',
        tr: '…-i tercih ederdim',
        example: { de: 'Ich würde lieber als Blogger arbeiten.', tr: 'Blogger olarak çalışmayı tercih ederdim.' },
      },
      {
        de: 'Während …, …',
        tr: '… iken, …',
        example: { de: 'Während Anna sofort Feedback bekommt, muss Nils lange warten.', tr: 'Anna hemen geri bildirim alırken Nils uzun süre beklemek zorunda.' },
        note: 'während yan cümlesinde fiil sonda; ana cümle fiille başlar.',
      },
    ],
  },
  {
    id: 'vorschlaege',
    icon: '💡',
    titleDe: 'Vorschläge machen',
    titleTr: 'Öneride bulunmak',
    summaryTr: 'Birlikte bir şey planlarken: sınavdaki „gemeinsam etwas planen“ bölümü.',
    skill: 'sprechen',
    items: [
      {
        de: 'Wie wäre es, wenn …?',
        tr: '… olsa nasıl olur?',
        example: { de: 'Wie wäre es, wenn wir uns am Freitag treffen?', tr: 'Cuma günü buluşsak nasıl olur?' },
      },
      {
        de: 'Ich schlage vor, dass …',
        tr: '… öneriyorum',
        example: { de: 'Ich schlage vor, dass wir zuerst die Aufgaben verteilen.', tr: 'Önce görevleri dağıtmamızı öneriyorum.' },
        note: 'vorschlagen ayrılabilir.',
      },
      {
        de: 'Wir könnten doch …',
        tr: '… yapabiliriz aslında',
        example: { de: 'Wir könnten doch eine kleine Feier organisieren.', tr: 'Küçük bir kutlama düzenleyebiliriz aslında.' },
      },
      {
        de: 'Was halten Sie davon, … zu …?',
        tr: '… yapmaya ne dersiniz?',
        example: { de: 'Was halten Sie davon, die Besprechung zu verschieben?', tr: 'Toplantıyı ertelemeye ne dersiniz?' },
      },
      {
        de: 'Das ist eine gute Idee, aber …',
        tr: 'İyi fikir ama …',
        example: { de: 'Das ist eine gute Idee, aber am Montag habe ich leider keine Zeit.', tr: 'İyi fikir ama pazartesi maalesef vaktim yok.' },
      },
      {
        de: 'Dann sind wir uns also einig.',
        tr: 'O hâlde anlaştık.',
        example: { de: 'Dann sind wir uns also einig: Du kümmerst dich um das Essen.', tr: 'O hâlde anlaştık: Yemekle sen ilgileniyorsun.' },
      },
    ],
  },
  {
    id: 'beruf-erfahrungen',
    icon: '💼',
    titleDe: 'Über Beruf und Erfahrungen sprechen',
    titleTr: 'İş ve deneyimden bahsetmek',
    summaryTr: 'Kendini tanıtırken, işini ve hedeflerini anlatırken (Kursbuch, Kapitel 2).',
    skill: 'sprechen',
    items: [
      {
        de: 'Ich bin als … tätig.',
        tr: '… olarak çalışıyorum.',
        example: { de: 'Ich bin als Softwaretester bei einer kleinen Firma tätig.', tr: 'Küçük bir firmada yazılım test uzmanı olarak çalışıyorum.' },
        note: 'Meslek adı artikelsiz.',
      },
      {
        de: 'Zu meinen Aufgaben gehört es, … zu …',
        tr: 'Görevlerim arasında … var.',
        example: { de: 'Zu meinen Aufgaben gehört es, Fehler zu finden und zu dokumentieren.', tr: 'Görevlerim arasında hataları bulmak ve belgelemek var.' },
      },
      {
        de: 'Ich bin für … zuständig.',
        tr: '…-den ben sorumluyum.',
        example: { de: 'Ich bin für die Qualitätskontrolle zuständig.', tr: 'Kalite kontrolden ben sorumluyum.' },
        note: 'zuständig für + Akk.',
      },
      {
        de: 'Meine Ausbildung habe ich in … gemacht.',
        tr: 'Eğitimimi …-de aldım.',
        example: { de: 'Meine Ausbildung habe ich in der Türkei gemacht.', tr: 'Eğitimimi Türkiye’de aldım.' },
      },
      {
        de: 'Vorher habe ich als … gearbeitet.',
        tr: 'Daha önce … olarak çalıştım.',
        example: { de: 'Vorher habe ich als Verkäufer gearbeitet.', tr: 'Daha önce satış elemanı olarak çalıştım.' },
      },
      {
        de: 'In Zukunft möchte ich gern …',
        tr: 'İleride … istiyorum.',
        example: { de: 'In Zukunft möchte ich gern ein eigenes Team leiten.', tr: 'İleride kendi ekibimi yönetmek istiyorum.' },
      },
      {
        de: 'Wenn ich es mir aussuchen könnte, würde ich …',
        tr: 'Seçme şansım olsaydı …-rdim.',
        example: { de: 'Wenn ich es mir aussuchen könnte, würde ich im Ausland arbeiten.', tr: 'Seçme şansım olsaydı yurt dışında çalışırdım.' },
        note: 'Konjunktiv II: könnte … würde.',
      },
    ],
  },
  {
    id: 'gespraech-steuern',
    icon: '🗣️',
    titleDe: 'Das Gespräch steuern',
    titleTr: 'Konuşmayı yönetmek',
    summaryTr: 'Anlamadığında, söz almak istediğinde ya da kelime aklına gelmediğinde.',
    skill: 'sprechen',
    items: [
      {
        de: 'Könnten Sie das bitte wiederholen?',
        tr: 'Tekrar edebilir misiniz lütfen?',
        example: { de: 'Entschuldigung, könnten Sie das bitte wiederholen?', tr: 'Affedersiniz, tekrar edebilir misiniz lütfen?' },
      },
      {
        de: 'Habe ich Sie richtig verstanden, dass …?',
        tr: 'Sizi doğru mu anladım, … mı?',
        example: { de: 'Habe ich Sie richtig verstanden, dass der Termin ausfällt?', tr: 'Sizi doğru mu anladım, randevu iptal mi oluyor?' },
      },
      {
        de: 'Was meinen Sie mit …?',
        tr: '… derken neyi kastediyorsunuz?',
        example: { de: 'Was meinen Sie mit „flexibel“?', tr: '„Esnek“ derken neyi kastediyorsunuz?' },
      },
      {
        de: 'Darf ich kurz etwas dazu sagen?',
        tr: 'Bu konuda kısaca bir şey söyleyebilir miyim?',
        example: { de: 'Entschuldigung, darf ich kurz etwas dazu sagen?', tr: 'Affedersiniz, bu konuda kısaca bir şey söyleyebilir miyim?' },
      },
      {
        de: 'Mir fällt das Wort gerade nicht ein.',
        tr: 'Kelime şu an aklıma gelmiyor.',
        example: { de: 'Mir fällt das Wort gerade nicht ein, ich meine so etwas wie „Chef“.', tr: 'Kelime şu an aklıma gelmiyor, „şef“ gibi bir şeyi kastediyorum.' },
        note: 'einfallen + Dat: Mir fällt nichts ein.',
      },
      {
        de: 'Lassen Sie mich das bitte noch zu Ende führen.',
        tr: 'Lütfen sözümü bitirmeme izin verin.',
        example: { de: 'Einen Moment, lassen Sie mich das bitte noch zu Ende führen.', tr: 'Bir dakika, lütfen sözümü bitirmeme izin verin.' },
      },
    ],
  },
  {
    id: 'praesentation',
    icon: '🎤',
    titleDe: 'Eine Präsentation halten',
    titleTr: 'Sunum yapmak',
    summaryTr: 'Kısa sunumun iskeleti: giriş, geçiş, bitiş. Sınavın sunum bölümü için ezberle.',
    skill: 'sprechen',
    items: [
      {
        de: 'In meiner Präsentation geht es um …',
        tr: 'Sunumumun konusu …',
        example: { de: 'In meiner Präsentation geht es um das Thema „Arbeiten im Homeoffice“.', tr: 'Sunumumun konusu „evden çalışmak“.' },
        note: 'es geht um + Akk.',
      },
      {
        de: 'Zuerst spreche ich über …, danach über …',
        tr: 'Önce …-den, sonra …-den bahsedeceğim.',
        example: { de: 'Zuerst spreche ich über meine Erfahrungen, danach über die Situation in meinem Heimatland.', tr: 'Önce kendi deneyimlerimden, sonra ülkemdeki durumdan bahsedeceğim.' },
      },
      {
        de: 'Damit komme ich zum nächsten Punkt.',
        tr: 'Böylece bir sonraki noktaya geçiyorum.',
        example: { de: 'Damit komme ich zum nächsten Punkt: den Vor- und Nachteilen.', tr: 'Böylece bir sonraki noktaya geçiyorum: artılar ve eksiler.' },
      },
      {
        de: 'In meinem Heimatland ist es üblich, dass …',
        tr: 'Benim ülkemde … yaygındır.',
        example: { de: 'In meinem Heimatland ist es üblich, dass man lange bei den Eltern wohnt.', tr: 'Benim ülkemde insanların uzun süre ailesiyle yaşaması yaygındır.' },
      },
      {
        de: 'Zusammenfassend lässt sich sagen, dass …',
        tr: 'Özetle şu söylenebilir: …',
        example: { de: 'Zusammenfassend lässt sich sagen, dass die Vorteile überwiegen.', tr: 'Özetle şu söylenebilir: Avantajlar ağır basıyor.' },
        note: 'sich lassen + mastar = „-ilebilir“ (pasif anlam).',
      },
      {
        de: 'Vielen Dank für Ihre Aufmerksamkeit.',
        tr: 'Dinlediğiniz için teşekkür ederim.',
        example: { de: 'Vielen Dank für Ihre Aufmerksamkeit. Haben Sie noch Fragen?', tr: 'Dinlediğiniz için teşekkür ederim. Sorunuz var mı?' },
      },
    ],
  },
  {
    id: 'formelle-email',
    icon: '✉️',
    titleDe: 'Formelle E-Mail',
    titleTr: 'Resmî e-posta',
    summaryTr: 'Resmî yazışmanın sabit cümleleri: hitap, giriş, rica, kapanış.',
    skill: 'schreiben',
    items: [
      {
        de: 'Sehr geehrte Damen und Herren,',
        tr: 'Sayın yetkili,',
        example: { de: 'Sehr geehrte Damen und Herren, ich schreibe Ihnen wegen Ihrer Anzeige.', tr: 'Sayın yetkili, ilanınız nedeniyle size yazıyorum.' },
        note: 'İsmi biliyorsan: Sehr geehrte Frau Weber, / Sehr geehrter Herr Weber, Sonra küçük harfle devam.',
      },
      {
        de: 'Ich wende mich an Sie, weil …',
        tr: 'Size … nedeniyle başvuruyorum.',
        example: { de: 'Ich wende mich an Sie, weil ich eine Frage zu meinem Vertrag habe.', tr: 'Sözleşmemle ilgili bir sorum olduğu için size başvuruyorum.' },
        note: 'sich wenden an + Akk.',
      },
      {
        de: 'Hiermit möchte ich mich über … beschweren.',
        tr: '… konusunda şikâyette bulunmak istiyorum.',
        example: { de: 'Hiermit möchte ich mich über den schlechten Service beschweren.', tr: 'Kötü hizmet konusunda şikâyette bulunmak istiyorum.' },
        note: 'sich beschweren über + Akk.',
      },
      {
        de: 'Könnten Sie mir bitte mitteilen, ob …?',
        tr: '… olup olmadığını bildirebilir misiniz?',
        example: { de: 'Könnten Sie mir bitte mitteilen, ob der Kurs noch freie Plätze hat?', tr: 'Kursta hâlâ boş yer olup olmadığını bildirebilir misiniz?' },
      },
      {
        de: 'Ich wäre Ihnen dankbar, wenn …',
        tr: '… yaparsanız minnettar olurum.',
        example: { de: 'Ich wäre Ihnen dankbar, wenn Sie mir bald antworten könnten.', tr: 'Bana yakında cevap verebilirseniz minnettar olurum.' },
      },
      {
        de: 'Für Ihre Bemühungen bedanke ich mich im Voraus.',
        tr: 'Zahmetiniz için şimdiden teşekkür ederim.',
        example: { de: 'Für Ihre Bemühungen bedanke ich mich im Voraus und warte auf Ihre Antwort.', tr: 'Zahmetiniz için şimdiden teşekkür eder, cevabınızı beklerim.' },
      },
      {
        de: 'Mit freundlichen Grüßen',
        tr: 'Saygılarımla',
        example: { de: 'Ich freue mich auf Ihre Antwort. Mit freundlichen Grüßen', tr: 'Cevabınızı bekliyorum. Saygılarımla' },
        note: 'Sonunda virgül ya da nokta yok; altına ad soyad.',
      },
    ],
  },
  {
    id: 'argumentieren',
    icon: '🧱',
    titleDe: 'Argumentieren und begründen',
    titleTr: 'Gerekçe göstermek',
    summaryTr: 'Fikrini gerekçeyle desteklerken ve yazıda cümleleri birbirine bağlarken.',
    skill: 'beide',
    items: [
      {
        de: 'Ein wichtiger Grund dafür ist, dass …',
        tr: 'Bunun önemli bir sebebi şu: …',
        example: { de: 'Ein wichtiger Grund dafür ist, dass viele Firmen Fachkräfte suchen.', tr: 'Bunun önemli bir sebebi şu: Birçok firma nitelikli eleman arıyor.' },
      },
      {
        de: 'Das liegt daran, dass …',
        tr: 'Bunun nedeni …',
        example: { de: 'Das liegt daran, dass die Mieten in der Stadt so hoch sind.', tr: 'Bunun nedeni şehirde kiraların çok yüksek olması.' },
        note: 'liegen an + Dat.',
      },
      {
        de: 'Hinzu kommt, dass …',
        tr: 'Buna ek olarak …',
        example: { de: 'Hinzu kommt, dass man im Team mehr lernt.', tr: 'Buna ek olarak ekip içinde daha çok şey öğreniliyor.' },
      },
      {
        de: 'Man darf nicht vergessen, dass …',
        tr: '… unutulmamalı',
        example: { de: 'Man darf nicht vergessen, dass nicht jeder diese Möglichkeit hat.', tr: 'Herkesin bu imkâna sahip olmadığı unutulmamalı.' },
      },
      {
        de: 'Deshalb bin ich dafür, dass …',
        tr: 'Bu yüzden …-den yanayım.',
        example: { de: 'Deshalb bin ich dafür, dass Überstunden bezahlt werden.', tr: 'Bu yüzden fazla mesainin ödenmesinden yanayım.' },
        note: 'Tersi: Ich bin dagegen, dass …',
      },
      {
        de: 'Das zeigt sich zum Beispiel daran, dass …',
        tr: 'Bu, örneğin …-den anlaşılıyor.',
        example: { de: 'Das zeigt sich zum Beispiel daran, dass immer mehr Menschen online einkaufen.', tr: 'Bu, örneğin giderek daha çok insanın internetten alışveriş yapmasından anlaşılıyor.' },
      },
    ],
  },
  {
    id: 'grafik-beschreiben',
    icon: '📊',
    titleDe: 'Eine Grafik beschreiben',
    titleTr: 'Grafik anlatmak',
    summaryTr: 'İstatistik ve grafik yorumlarken: konu, rakamlar, değişim.',
    skill: 'beide',
    items: [
      {
        de: 'Die Grafik zeigt, …',
        tr: 'Grafik …-i gösteriyor.',
        example: { de: 'Die Grafik zeigt, wie viele Stunden die Deutschen pro Woche arbeiten.', tr: 'Grafik, Almanların haftada kaç saat çalıştığını gösteriyor.' },
      },
      {
        de: 'Die Zahl der … ist gestiegen.',
        tr: '… sayısı arttı.',
        example: { de: 'Die Zahl der Studierenden ist in den letzten Jahren gestiegen.', tr: 'Üniversite öğrencilerinin sayısı son yıllarda arttı.' },
        note: 'steigen – stieg – ist gestiegen. Tersi: ist gesunken.',
      },
      {
        de: 'Der Anteil der … liegt bei … Prozent.',
        tr: '… oranı yüzde …',
        example: { de: 'Der Anteil der Frauen liegt bei 40 Prozent.', tr: 'Kadınların oranı yüzde 40.' },
        note: 'liegen bei + Dat.',
      },
      {
        de: 'Im Vergleich zum Vorjahr …',
        tr: 'Geçen yıla kıyasla …',
        example: { de: 'Im Vergleich zum Vorjahr ist der Umsatz um fast hundert Prozent gestiegen.', tr: 'Geçen yıla kıyasla ciro neredeyse yüzde yüz arttı.' },
        note: 'um … Prozent steigen: artış miktarı; auf … steigen: ulaşılan değer.',
      },
      {
        de: 'Auffällig ist, dass …',
        tr: 'Dikkat çeken nokta şu: …',
        example: { de: 'Auffällig ist, dass junge Leute seltener fernsehen.', tr: 'Dikkat çeken nokta şu: Gençler daha az televizyon izliyor.' },
      },
      {
        de: 'Das hat mich überrascht, weil …',
        tr: 'Bu beni şaşırttı, çünkü …',
        example: { de: 'Das hat mich überrascht, weil es in meinem Land ganz anders ist.', tr: 'Bu beni şaşırttı, çünkü benim ülkemde durum çok farklı.' },
      },
    ],
  },
];
