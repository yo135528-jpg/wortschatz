import type { StreetTopicInput } from '../../domain/street';
import { check, dialogue, h3, p, phrases, say, table, tip, topic, warn } from './build';

/** Phone calls, doctor and pharmacy, offices: the situations where a mistake costs a day. */
export const OFFICIAL: StreetTopicInput[] = [
  topic({
    id: 'telefon',
    group: 'resmi',
    icon: '📞',
    titleTr: 'Telefonda konuşmak',
    titleDe: 'Telefonieren',
    intro:
      'Telefon, yabancı dilde en zor durumdur: yüz yok, el kol hareketi yok, karşı taraf hızlı konuşur. İyi haber şu: Almanlar telefonda hep **aynı kalıpları** kullanır. Bu kalıpları ezberlersen konuşmanın yarısı hazırdır.',
    blocks: [
      h3('1. Açılış: Almanlar telefonu adıyla açar'),
      p(
        'Türkiye\'de telefon „Alo?" ile açılır. Almanya\'da özellikle iş ve resmî aramalarda telefonu açan **soyadını** söyler: „Müller." ya da „Praxis Dr. Weber, Schmidt am Apparat, guten Tag." Arayan da önce **kendini tanıtır**, sonra konuya girer. „Hallo?" diye açmak özel hayatta normal, ama arayan kişinin adını söylememesi kaba sayılır.',
      ),
      phrases(
        'Arayan sensen',
        say('Guten Tag, mein Name ist Yılmaz.', 'İyi günler, adım Yılmaz.', 'alltag', {
          note: 'İlk cümle hep bu. Sadece soyadı yeterli; resmî aramada ad + soyad da olur.',
        }),
        say('Ich rufe an wegen …', '… için arıyorum.', 'alltag', {
          ex: ['Ich rufe an wegen meines Termins am Dienstag.', 'Salı günkü randevum için arıyorum.'],
          note: 'Konuşma dilinde „wegen + Dativ" de duyarsın: wegen meinem Termin. Yazıda Genitiv.',
        }),
        say('Ich hätte eine Frage zu …', '… hakkında bir sorum olacaktı.', 'alltag', {
          note: 'Konjunktiv II („hätte") kibar yapar. „Ich habe eine Frage" de doğru ama daha düz.',
        }),
        say('Könnte ich bitte mit Frau Becker sprechen?', 'Bayan Becker ile görüşebilir miyim lütfen?', 'alltag'),
        say('Ist Herr Wagner zu sprechen?', 'Bay Wagner\'le görüşmek mümkün mü?', 'alltag', {
          note: 'Resmî ve biraz kalıplaşmış: „konuşulabilir durumda mı?"',
        }),
      ),
      phrases(
        'Telefonu açan sensen',
        say('Yılmaz.', '(Telefonu açarken) Yılmaz.', 'alltag', { note: 'Sadece soyadın. Bu kadar.' }),
        say('Ja, bitte?', 'Evet, buyrun?', 'alltag'),
        say('Am Apparat.', 'Benim, konuşan benim.', 'alltag', {
          ex: ['– Kann ich Herrn Demir sprechen? – Am Apparat.', '– Bay Demir\'le görüşebilir miyim? – Benim.'],
        }),
        say('Wer ist da, bitte?', 'Kiminle görüşüyorum?', 'alltag'),
        say('Moment, ich verbinde.', 'Bir dakika, bağlıyorum.', 'alltag'),
      ),

      h3('2. Anlamadığında: en önemli bölüm'),
      p(
        'Telefonda anlamamak normaldir, Almanlar da birbirine sık sık sorar. Önemli olan **susmamak**. Aşağıdaki cümleler seni her konuşmada kurtarır. Özellikle **buchstabieren** (harf harf söyletmek) isimler ve e-postalar için şarttır.',
      ),
      phrases(
        undefined,
        say('Entschuldigung, das habe ich nicht verstanden.', 'Pardon, onu anlamadım.', 'alltag'),
        say('Könnten Sie das bitte wiederholen?', 'Tekrar edebilir misiniz lütfen?', 'alltag'),
        say('Könnten Sie bitte etwas langsamer sprechen?', 'Biraz daha yavaş konuşabilir misiniz?', 'alltag', {
          note: 'Hiç utanma; Almanlar bunu duyunca gerçekten yavaşlar.',
        }),
        say('Die Verbindung ist schlecht.', 'Hat kötü / ses gidip geliyor.', 'alltag'),
        say('Sie sind ganz leise.', 'Sesiniz çok az geliyor.', 'alltag'),
        say('Können Sie das bitte buchstabieren?', 'Harf harf söyleyebilir misiniz?', 'alltag'),
        say('Habe ich Sie richtig verstanden: …?', 'Sizi doğru anladım mı: …?', 'alltag', {
          ex: ['Habe ich Sie richtig verstanden: Donnerstag um zehn?', 'Doğru anladım mı: perşembe saat onda mı?'],
          note: 'Randevu ve saatlerde mutlaka tekrar ettir. Yanlış anlaşılan saat = boşa giden gün.',
        }),
      ),
      table(
        ['Harf', 'Söylenişi', 'Telefonda (Buchstabiertafel)'],
        [
          ['A', 'a', 'A wie **Anton**'],
          ['Ä', 'ä', 'Ä wie **Ärger**'],
          ['E', 'e', 'E wie **Emil**'],
          ['I', 'i', 'I wie **Ida**'],
          ['J', 'jot', 'J wie **Julius**'],
          ['S', 'es', 'S wie **Samuel**'],
          ['V', 'fau', 'V wie **Viktor**'],
          ['W', 'we', 'W wie **Wilhelm**'],
          ['Y', 'üpsilon', 'Y wie **Ypsilon**'],
          ['Z', 'tset', 'Z wie **Zacharias**'],
          ['ß', 'es-tset', '„scharfes S"'],
          ['@', 'ät', '„at" / „Klammeraffe" (gündelik)'],
        ],
        'Geleneksel tablo; 2022\'den beri resmî tabloda şehir adları var (A wie Aachen), ama günlük hayatta hâlâ bu isimler duyulur. Türk isimlerinde en sık karışanlar: J, V, W, Y, Z. Ç, Ş için „C mit Häkchen", „S mit Häkchen" dersin.',
      ),
      tip(
        'Adını telefonda söylerken hep harf harf ver: „Yılmaz: Y wie Ypsilon, I, L, M, A, Z wie Zacharias." Karşı taraf yanlış yazarsa randevun başka bir isme açılır.',
      ),

      h3('3. Telesekreter ve kapanış'),
      phrases(
        undefined,
        say('Hier ist die Mailbox von …', 'Burası …\'nın sesli mesaj kutusu.', 'alltag'),
        say('Bitte hinterlassen Sie eine Nachricht nach dem Signalton.', 'Lütfen sinyal sesinden sonra mesaj bırakın.', 'alltag'),
        say('Rufen Sie mich bitte unter der Nummer … zurück.', 'Lütfen beni … numarasından geri arayın.', 'alltag'),
        say('Ich versuche es später noch mal.', 'Daha sonra tekrar denerim.', 'alltag'),
        say('Vielen Dank, auf Wiederhören!', 'Çok teşekkürler, hoşça kalın!', 'alltag', {
          note: 'Telefonda „Auf Wiedersehen" değil **Auf Wiederhören** (sesini yeniden duymak üzere). Arkadaşla: „Tschüss, bis dann!"',
        }),
        say('Ich meld mich!', 'Ben ararım / haber veririm!', 'locker', { standard: 'Ich melde mich.' }),
      ),
      dialogue(
        'Randevu almak için arama',
        ['Praxis', 'Praxis Dr. Krüger, Sie sprechen mit Frau Lange, guten Tag.', 'Dr. Krüger muayenehanesi, Bayan Lange ile görüşüyorsunuz, iyi günler.'],
        ['Du', 'Guten Tag, mein Name ist Yılmaz. Ich hätte gern einen Termin.', 'İyi günler, adım Yılmaz. Bir randevu almak istiyorum.'],
        ['Praxis', 'Waren Sie schon mal bei uns?', 'Daha önce bize geldiniz mi?'],
        ['Du', 'Nein, ich bin zum ersten Mal da.', 'Hayır, ilk defa geliyorum.'],
        ['Praxis', 'Ich hätte am Donnerstag um 8 Uhr 40 was frei.', 'Perşembe sabah 8.40\'ta bir boşluğum var.'],
        ['Du', 'Entschuldigung, nochmal: Donnerstag, 8 Uhr 40?', 'Pardon, bir daha: perşembe 8.40 mı?'],
        ['Praxis', 'Genau. Bringen Sie bitte Ihre Versichertenkarte mit.', 'Aynen. Sigorta kartınızı lütfen getirin.'],
        ['Du', 'Mach ich. Vielen Dank, auf Wiederhören!', 'Getiririm. Çok teşekkürler, hoşça kalın!'],
      ),
      warn(
        'Telefonda saatleri dikkatli dinle: „halb neun" = **8.30** (dokuzun yarısı), dokuz buçuk değil! „Viertel nach acht" = 8.15, „Viertel vor neun" = 8.45.',
      ),
      check(
        'Bir muayenehaneyi aradın, telefonu açan kişi adını söyledi. İlk cümlen ne olmalı?',
        ['Hallo, ich brauche einen Termin.', 'Guten Tag, mein Name ist Yılmaz. Ich hätte gern einen Termin.', 'Wer ist da?'],
        'Guten Tag, mein Name ist Yılmaz. Ich hätte gern einen Termin.',
        'Almanya\'da arayan önce selam verir ve **adını söyler**, sonra isteğini. Adsız başlamak kaba durur.',
      ),
      check(
        '„Ich hätte am Mittwoch um halb neun was frei." Saat kaç?',
        ['9.30', '8.30', '8.45'],
        '8.30',
        '„halb neun" = dokuza yarım saat kala, yani **8.30**. Türkçedeki „dokuz buçuk" ile karıştırma.',
      ),
      check(
        'Telefon görüşmesini kibarca nasıl bitirirsin?',
        ['Auf Wiedersehen!', 'Auf Wiederhören!', 'Bis gleich!'],
        'Auf Wiederhören!',
        'Telefonda birbirinizi görmediğiniz için „Wieder**hören**" denir.',
      ),
    ],
    related: ['arzt-apotheke', 'amt', 'hoeflichkeit'],
  }),

  topic({
    id: 'arzt-apotheke',
    group: 'resmi',
    icon: '🩺',
    titleTr: 'Doktorda ve eczanede',
    titleDe: 'Beim Arzt und in der Apotheke',
    intro:
      'Almanya\'da önce **Hausarzt**\'a (aile hekimi) gidilir; o gerekirse uzmana sevk eder (**Überweisung**). Randevusuz gidilen yer **Notaufnahme** (acil) ya da hafta sonu **ärztlicher Bereitschaftsdienst**: **116 117**. Hayati acil: **112**.',
    blocks: [
      h3('1. Muayenehanede: kayıt ve bekleme'),
      p(
        'Muayenehaneye girince ilk iş **Anmeldung** (resepsiyon) masasına gitmektir. Sigorta kartını (**Versichertenkarte / Gesundheitskarte**) verirsin, sonra **Wartezimmer**\'da (bekleme odası) adın çağrılana kadar beklersin. İlk gelişte bir **Anamnesebogen** (sağlık geçmişi formu) doldurursun.',
      ),
      phrases(
        undefined,
        say('Ich habe um zehn einen Termin.', 'Saat onda randevum var.', 'alltag'),
        say('Ich bin zum ersten Mal hier.', 'İlk kez geliyorum.', 'alltag'),
        say('Hier ist meine Versichertenkarte.', 'Buyrun, sigorta kartım.', 'alltag'),
        say('Nehmen Sie bitte noch kurz im Wartezimmer Platz.', 'Lütfen biraz bekleme odasında oturun.', 'alltag', {
          note: 'Resepsiyonun söylediği cümle. „Platz nehmen" = oturmak (resmî).',
        }),
        say('Ich brauche eine Krankschreibung.', 'Rapor (iş göremezlik belgesi) lazım.', 'alltag', {
          note: 'Resmî adı **Arbeitsunfähigkeitsbescheinigung (AU)**. Gündelikte „Krankschreibung" ya da „gelber Schein" (eskiden sarıydı).',
        }),
        say('Ich bin krankgeschrieben.', 'Raporluyum.', 'alltag', {
          ex: ['Ich bin bis Freitag krankgeschrieben.', 'Cumaya kadar raporluyum.'],
        }),
        say('Ich bräuchte eine Überweisung zum Orthopäden.', 'Ortopediste sevk lazım.', 'alltag'),
      ),

      h3('2. Şikâyetini anlatmak'),
      p(
        'Doktor genelde „**Was fehlt Ihnen?**" ya da „**Was führt Sie zu mir?**" diye sorar (Neyiniz var?). Ağrıyı anlatmanın iki ana kalıbı var: **Ich habe + -schmerzen** ve **Mir tut … weh**. İkinci kalıpta „mir" Dativ\'dir: „bana acıyor".',
      ),
      table(
        ['Kalıp', 'Örnek', 'Türkçe'],
        [
          ['Ich habe **…schmerzen**', 'Ich habe Kopfschmerzen / Bauchschmerzen / Rückenschmerzen.', 'Başım / karnım / sırtım ağrıyor.'],
          ['**Mir tut … weh**', 'Mir tut der Hals weh. / Mir tun die Füße weh.', 'Boğazım ağrıyor. / Ayaklarım ağrıyor.'],
          ['Ich habe **Fieber / Husten / Schnupfen**', 'Ich habe seit drei Tagen Fieber.', 'Üç gündür ateşim var.'],
          ['Mir ist **schwindelig / übel / schlecht**', 'Mir ist seit heute Morgen übel.', 'Sabahtan beri midem bulanıyor.'],
          ['Ich bin **erkältet**', 'Ich bin total erkältet.', 'Fena soğuk algınlığım var.'],
        ],
        'Dikkat: „Mir tun die Füße weh" (çoğul özne → tun).',
      ),
      phrases(
        'Doktorun sık sorduğu sorular',
        say('Seit wann haben Sie die Beschwerden?', 'Şikâyetleriniz ne zamandan beri var?', 'alltag'),
        say('Wo genau tut es weh?', 'Tam olarak neresi ağrıyor?', 'alltag'),
        say('Nehmen Sie regelmäßig Medikamente?', 'Düzenli ilaç kullanıyor musunuz?', 'alltag'),
        say('Haben Sie Allergien?', 'Alerjiniz var mı?', 'alltag'),
        say('Machen Sie bitte den Oberkörper frei.', 'Lütfen üstünüzü çıkarın.', 'alltag'),
        say('Tief einatmen … und ausatmen.', 'Derin nefes alın … ve verin.', 'alltag'),
      ),
      phrases(
        'Sen ne dersin',
        say('Es tut hier weh, vor allem nachts.', 'Burası ağrıyor, özellikle geceleri.', 'alltag'),
        say('Die Schmerzen sind stechend / dumpf.', 'Ağrı batıcı / künt.', 'alltag', {
          note: 'stechend = batan, dumpf = sızlayan/künt, ziehend = çeken, brennend = yanan.',
        }),
        say('Es ist schlimmer geworden.', 'Daha kötüleşti.', 'alltag'),
        say('Ich bin gegen Penicillin allergisch.', 'Penisiline alerjim var.', 'alltag'),
        say('Ich fühl mich total schlapp.', 'Kendimi bitkin hissediyorum.', 'locker', { standard: 'Ich fühle mich sehr schwach.' }),
        say('Mich hat\'s voll erwischt.', 'Fena yakalandım (hastalık).', 'locker', {
          note: 'Grip, nezle için çok tipik: „Mich hat\'s erwischt" = hastalık beni de buldu.',
        }),
      ),

      h3('3. Eczanede'),
      p(
        'Almanya\'da ağrı kesici bile genelde sadece **Apotheke**\'de satılır, markette değil. Reçeteli ilaç için doktor **Rezept** yazar; yasal sigortada ilaç başına genelde 5–10 € **Zuzahlung** (katkı payı) ödersin. Gece ve pazar günleri nöbetçi eczane: **Notdienstapotheke**.',
      ),
      phrases(
        undefined,
        say('Ich hätte gern etwas gegen Halsschmerzen.', 'Boğaz ağrısına bir şey istiyorum.', 'alltag'),
        say('Ist das rezeptpflichtig?', 'Bu reçeteli mi?', 'alltag'),
        say('Wie oft muss ich das nehmen?', 'Bunu ne sıklıkla almam gerekiyor?', 'alltag'),
        say('Dreimal täglich nach dem Essen.', 'Günde üç kez, yemekten sonra.', 'alltag'),
        say('Haben Sie das auch als Generikum?', 'Bunun muadili (jeneriği) var mı?', 'alltag', { note: 'Daha ucuz alternatif sormanın yolu.' }),
        say('Gute Besserung!', 'Geçmiş olsun!', 'alltag', { note: 'Hasta birine her zaman söylenir: eczacı da, iş arkadaşı da.' }),
      ),
      dialogue(
        'Doktorda',
        ['Ärztin', 'Guten Tag, Herr Yılmaz. Was führt Sie zu mir?', 'İyi günler Bay Yılmaz. Sizi buraya ne getirdi?'],
        ['Du', 'Ich habe seit drei Tagen Halsschmerzen und Fieber.', 'Üç gündür boğazım ağrıyor ve ateşim var.'],
        ['Ärztin', 'Wie hoch war das Fieber?', 'Ateşiniz kaç dereceydi?'],
        ['Du', 'Gestern Abend 38,5.', 'Dün akşam 38,5.'],
        ['Ärztin', 'Machen Sie mal bitte den Mund auf … Ja, der Hals ist ziemlich rot. Das ist eine Mandelentzündung.', 'Ağzınızı açar mısınız lütfen … Evet, boğaz epey kırmızı. Bu bir bademcik iltihabı.'],
        ['Du', 'Muss ich Antibiotika nehmen?', 'Antibiyotik kullanmam gerekiyor mu?'],
        ['Ärztin', 'Ja, ich schreibe Ihnen ein Rezept. Und ich schreibe Sie bis Freitag krank.', 'Evet, size reçete yazıyorum. Ve cumaya kadar rapor veriyorum.'],
        ['Du', 'Vielen Dank.', 'Çok teşekkürler.'],
        ['Ärztin', 'Gute Besserung!', 'Geçmiş olsun!'],
      ),
      warn(
        'Hastalık **3 günden uzun** sürerse en geç 4. gün rapor gerekir; işveren ilk günden de isteyebilir. Rapor 2023\'ten beri doktordan sigortaya elektronik gider (eAU), ama işyerine **sen** haber vermelisin, hem de mesai başlamadan: „Ich bin krank und kann heute leider nicht kommen."',
      ),
      check(
        '„Boğazım ağrıyor" nasıl denir?',
        ['Ich tue den Hals weh.', 'Mir tut der Hals weh.', 'Mich tut der Hals weh.'],
        'Mir tut der Hals weh.',
        '„wehtun" ile ağrıyan kişi **Dativ**: mir, dir, ihm. Özne ağrıyan yer: der Hals.',
      ),
      check(
        'Cumartesi gecesi ateşin çıktı, muayenehaneler kapalı. Hangi numarayı ararsın?',
        ['110', '116 117', '112'],
        '116 117',
        '116 117 = nöbetçi doktor hizmeti (acil olmayan durumlar). 112 hayati acil, 110 polis.',
      ),
      check(
        'İşverenin „Krankschreibung" istiyor. Bu ne?',
        ['Reçete', 'Sevk kâğıdı', 'Doktor raporu (iş göremezlik belgesi)'],
        'Doktor raporu (iş göremezlik belgesi)',
        'Reçete = Rezept, sevk = Überweisung.',
      ),
    ],
    related: ['telefon', 'amt', 'gefuehle'],
  }),

  topic({
    id: 'amt',
    group: 'resmi',
    icon: '🏛️',
    titleTr: 'Resmî dairede (Amt, Behörde)',
    titleDe: 'Auf dem Amt',
    intro:
      'Alman bürokrasisi meşhurdur: her şey **Termin** (randevu), **Formular** (form) ve **Unterlagen** (belgeler) ile döner. Burada kullanılan dil resmîdir ve hep **Sie** konuşulur. Doğru kalıpları bilmek işini hem hızlandırır hem de memuru sana karşı yumuşatır.',
    blocks: [
      h3('1. Temel kelimeler: dairenin dili'),
      table(
        ['Kelime', 'Anlamı', 'Not'],
        [
          ['das **Bürgeramt** / Bürgerbüro', 'nüfus müdürlüğü gibi', 'adres kaydı, kimlik, pasaport'],
          ['die **Ausländerbehörde**', 'yabancılar dairesi', 'oturum izni (Aufenthaltstitel)'],
          ['die **Anmeldung**', 'adres kaydı', 'taşındıktan sonra **14 gün** içinde zorunlu'],
          ['die **Meldebescheinigung**', 'ikametgâh belgesi', 'kayıttan sonra verilir'],
          ['die **Wohnungsgeberbestätigung**', 'ev sahibi onay belgesi', 'kayıt için ev sahibinden alınır'],
          ['der **Antrag**, einen Antrag stellen', 'başvuru, başvuru yapmak', 'her şey için Antrag'],
          ['der **Bescheid**', 'resmî karar yazısı', 'olumlu ya da olumsuz'],
          ['die **Frist**', 'süre, son tarih', 'kaçırırsan para cezası olabilir'],
          ['die **Unterlagen** (Pl.)', 'belgeler', 'yanında getirilecekler'],
          ['das **Aktenzeichen**', 'dosya numarası', 'her yazışmada yaz'],
        ],
      ),
      h3('2. Gişede'),
      phrases(
        undefined,
        say('Ich habe einen Termin um 9 Uhr.', 'Saat 9\'da randevum var.', 'alltag'),
        say('Ich möchte mich anmelden.', 'Adres kaydı yaptırmak istiyorum.', 'alltag', {
          note: 'Bürgeramt\'ta „sich anmelden" = adres kaydı. Taşınınca da „sich ummelden".',
        }),
        say('Welche Unterlagen brauche ich dafür?', 'Bunun için hangi belgeler lazım?', 'alltag'),
        say('Ich habe alle Unterlagen dabei.', 'Bütün belgeler yanımda.', 'alltag'),
        say('Wo muss ich unterschreiben?', 'Nereyi imzalamam gerekiyor?', 'alltag'),
        say('Könnten Sie mir das Formular erklären?', 'Formu bana açıklayabilir misiniz?', 'alltag'),
        say('Bis wann muss ich das abgeben?', 'Bunu en geç ne zaman teslim etmem gerekiyor?', 'alltag'),
        say('Wie lange dauert die Bearbeitung?', 'İşlem ne kadar sürer?', 'alltag'),
        say('Ich habe noch keinen Bescheid bekommen.', 'Henüz bir karar yazısı almadım.', 'alltag'),
      ),
      p(
        'Memurun sık kullandığı cümleler genelde emir kipinde ya da edilgen yapıdadır. Kaba değil, sadece resmîdir: „**Ziehen Sie bitte eine Nummer.**" (Sıra numarası alın.) „**Es fehlt noch eine Unterlage.**" (Bir belge eksik.) „**Das wird Ihnen per Post zugeschickt.**" (Size postayla gönderilecek.)',
      ),
      phrases(
        'Memurdan duyacakların',
        say('Ziehen Sie bitte eine Nummer und warten Sie, bis Sie aufgerufen werden.', 'Lütfen bir numara alın ve çağrılana kadar bekleyin.', 'alltag'),
        say('Da sind Sie hier falsch.', 'Yanlış yere geldiniz.', 'alltag', { note: 'Burası yetkili değil demek. Hemen „Wo bin ich denn richtig?" diye sor.' }),
        say('Dafür bin ich nicht zuständig.', 'Bu benim yetki alanımda değil.', 'alltag', {
          note: '„zuständig" Alman bürokrasisinin anahtar kelimesi: yetkili, sorumlu. „Wer ist dafür zuständig?" = Bundan kim sorumlu?',
        }),
        say('Es fehlt noch ein Nachweis.', 'Bir kanıt belgesi eksik.', 'alltag'),
        say('Das müssen Sie online beantragen.', 'Bunu internetten başvurmanız gerekiyor.', 'alltag'),
      ),
      dialogue(
        'Bürgeramt\'ta adres kaydı',
        ['Beamtin', 'Guten Morgen. Was kann ich für Sie tun?', 'Günaydın. Sizin için ne yapabilirim?'],
        ['Du', 'Guten Morgen. Ich bin umgezogen und möchte mich anmelden.', 'Günaydın. Taşındım ve adres kaydı yaptırmak istiyorum.'],
        ['Beamtin', 'Haben Sie die Wohnungsgeberbestätigung dabei?', 'Ev sahibi onay belgesi yanınızda mı?'],
        ['Du', 'Ja, hier. Und mein Reisepass.', 'Evet, buyrun. Bir de pasaportum.'],
        ['Beamtin', 'Danke. Wann sind Sie eingezogen?', 'Teşekkürler. Ne zaman taşındınız?'],
        ['Du', 'Am ersten November.', 'Bir Kasım\'da.'],
        ['Beamtin', 'Gut, das ist noch innerhalb der Frist. Unterschreiben Sie bitte hier.', 'Tamam, hâlâ süre içinde. Lütfen burayı imzalayın.'],
        ['Du', 'Bekomme ich eine Meldebescheinigung?', 'İkametgâh belgesi alabilir miyim?'],
        ['Beamtin', 'Die drucke ich Ihnen gleich aus.', 'Onu size hemen yazdırıyorum.'],
      ),
      tip(
        'Önemli bir belgeyi teslim ederken mutlaka sor: „**Könnte ich bitte eine Eingangsbestätigung bekommen?**" (Teslim aldığınıza dair bir onay alabilir miyim?) Sonra „belge gelmedi" denirse elinde kanıt olur.',
      ),
      warn(
        'Resmî mektuplarda (Brief vom Amt) süreye dikkat: „**innerhalb von zwei Wochen**" ya da „**bis zum 15.12.**" gibi bir Frist varsa kaçırma. Anlamadığın mektubu görmezden gelmek en pahalı hatadır.',
      ),
      check(
        'Gişedeki memur „Dafür bin ich nicht zuständig." dedi. Ne demek istiyor?',
        ['Bu konu benim yetki alanımda değil.', 'Bugün çalışmıyorum.', 'Belgeleriniz eksik.'],
        'Bu konu benim yetki alanımda değil.',
        '„zuständig" = yetkili, sorumlu. Hemen sor: „Wer ist denn dafür zuständig?"',
      ),
      check(
        'Yeni eve taşındın. Bürgeramt\'ta ne dersin?',
        ['Ich möchte mich anmelden.', 'Ich möchte mich bewerben.', 'Ich möchte mich vorstellen.'],
        'Ich möchte mich anmelden.',
        'sich anmelden = kayıt yaptırmak; sich bewerben = iş başvurusu; sich vorstellen = kendini tanıtmak.',
      ),
    ],
    related: ['telefon', 'arzt-apotheke', 'wohnen'],
  }),
];
