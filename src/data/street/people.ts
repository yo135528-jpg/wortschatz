import type { StreetTopicInput } from '../../domain/street';
import { check, dialogue, h3, p, phrases, say, table, tip, topic, warn } from './build';

/** Talking with people: small talk, conflict, sympathy, celebrations, dating. */
export const PEOPLE: StreetTopicInput[] = [
  topic({
    id: 'smalltalk',
    group: 'insan',
    icon: '☕',
    titleTr: 'Small talk: havadan sudan konuşmak',
    titleDe: 'Smalltalk',
    intro:
      'Almanlar small talk\'ta Türklerden daha kısa ve daha az kişiseldir. Maaş, kilo, din, „neden evlenmiyorsun" gibi sorular **sorulmaz**. Güvenli konular: hava, hafta sonu, tatil, iş (genel), yemek, spor, ve Almanların en sevdiği konu: **Deutsche Bahn**\'ın gecikmeleri.',
    blocks: [
      h3('1. Konuşmayı açmak'),
      phrases(
        undefined,
        say('Na, wie war dein Wochenende?', 'Eee, hafta sonun nasıl geçti?', 'alltag', {
          note: 'Pazartesi sabahı işyerinin bir numaralı cümlesi. Cevap kısa olur: „Ganz entspannt, und deins?"',
        }),
        say('Schönes Wetter heute, oder?', 'Hava bugün güzel, değil mi?', 'alltag'),
        say('Was für ein Wetter!', 'Ne biçim hava!', 'alltag', { note: 'Tonuna göre hem övgü hem şikâyet.' }),
        say('Viel los heute?', 'Bugün yoğun musun?', 'locker', { standard: 'Ist heute viel los?' }),
        say('Und, schon was vor am Wochenende?', 'E, hafta sonu için bir planın var mı?', 'locker', { standard: 'Hast du am Wochenende schon etwas vor?' }),
        say('Wie läuft\'s so?', 'İşler nasıl gidiyor?', 'locker', { standard: 'Wie läuft es?' }),
        say('Lange nicht gesehen!', 'Görüşmeyeli uzun zaman oldu!', 'alltag'),
      ),
      h3('2. Hava: Almanların ortak dili'),
      p(
        'Hava hakkında konuşmak Almanya\'da gerçek bir sosyal araçtır: kimseyi rahatsız etmez, herkes katılır. Şikâyet etmek de serbesttir; aslında Almanlar hava hakkında **şikâyet etmeyi** sever.',
      ),
      phrases(
        undefined,
        say('Es ist arschkalt.', 'Hava buz gibi / feci soğuk.', 'derb', { note: 'Çok yaygın ama kaba; arkadaş arasında. Nötr: „Es ist eiskalt."' }),
        say('Es schüttet wie aus Eimern.', 'Bardaktan boşanırcasına yağıyor.', 'alltag', { note: 'Kelimesi kelimesine „kovalardan döker gibi".' }),
        say('Es nieselt.', 'Çiseliyor.', 'alltag'),
        say('Was für ein Schmuddelwetter!', 'Ne kasvetli, pis bir hava!', 'locker', { note: 'Gri, yağmurlu, çamurlu kasım havası.' }),
        say('Endlich mal Sonne!', 'Sonunda biraz güneş!', 'alltag'),
        say('Mir ist zu warm.', 'Bana fazla sıcak.', 'alltag', {
          note: 'Dikkat: „Ich bin warm" denmez! Hissettiğin sıcaklık için hep **Mir ist** warm/kalt.',
        }),
      ),
      h3('3. Cevap verip konuşmayı sürdürmek'),
      p(
        'Small talk\'ta kısa cevap verip **soruyu geri atmak** kibarlıktır: „Gut, und dir?" Soruyu geri sormamak ilgisizlik gibi algılanır. Konuşmayı bitirmek için de hazır kalıplar vardır, aniden susup gitmek tuhaf kaçar.',
      ),
      phrases(
        undefined,
        say('Gut, und selbst?', 'İyi, ya sen?', 'locker', { note: '„Und dir?" ile aynı; biraz daha samimi.' }),
        say('Kann nicht klagen.', 'Şikâyet edemem / fena değil.', 'alltag'),
        say('Muss ja.', 'İdare ediyoruz / mecburuz.', 'locker', {
          note: '„Wie geht\'s?" sorusuna yarı şaka, yarı yorgun bir cevap: „Muss ja (gehen)."',
        }),
        say('Ach, echt?', 'Aa, sahi mi?', 'alltag'),
        say('Ich will dich nicht aufhalten.', 'Seni tutmayayım.', 'alltag', { note: 'Konuşmayı kibarca bitirmenin en yaygın yolu.' }),
        say('Ich muss dann mal los.', 'Benim artık gitmem lazım.', 'alltag'),
        say('Schönen Abend noch!', 'İyi akşamlar dilerim (kalan akşamın güzel geçsin)!', 'alltag', {
          note: '„noch" = günün kalanı için. Ayrılırken: „Schönes Wochenende noch!"',
        }),
      ),
      dialogue(
        'Pazartesi sabahı mutfakta',
        ['Lena', 'Morgen! Na, wie war dein Wochenende?', 'Günaydın! Eee, hafta sonun nasıldı?'],
        ['Du', 'Morgen! Ganz entspannt, ich war mit Freunden wandern. Und deins?', 'Günaydın! Gayet rahat, arkadaşlarla yürüyüşe gittim. Seninki?'],
        ['Lena', 'Ach, ich hab nur gefaulenzt. Bei dem Wetter …', 'Ah, sadece tembellik yaptım. Bu havada …'],
        ['Du', 'Ja, es hat ja das ganze Wochenende geschüttet.', 'Evet, bütün hafta sonu bardaktan boşanırcasına yağdı.'],
        ['Lena', 'Typisch November. Na ja, ich muss mal an den Schreibtisch.', 'Tipik kasım. Neyse, masama gideyim.'],
        ['Du', 'Klar, bis später!', 'Tabii, sonra görüşürüz!'],
      ),
      warn(
        'Small talk\'ta sorulmayanlar: maaş („Wie viel verdienst du?"), yaş (özellikle kadınlara), kilo, din, siyaset (iyi tanımıyorsan), „Wann heiratet ihr endlich?". Bunlar Almanya\'da **çok** kişisel sayılır.',
      ),
      check(
        '„Sıcakladım" nasıl denir?',
        ['Ich bin warm.', 'Mir ist warm.', 'Ich habe warm.'],
        'Mir ist warm.',
        'Bedensel his = **mir ist** + sıfat (warm, kalt, schlecht, schwindelig). „Ich bin warm" garip, hatta müstehcen anlaşılabilir.',
      ),
      check(
        'Bir tanıdık „Wie geht\'s?" diye sordu. En doğal cevap hangisi?',
        ['Gut, danke. Und dir?', 'Mir geht es gut. Auf Wiedersehen.', 'Ich bin gut.'],
        'Gut, danke. Und dir?',
        'Kısa cevap + soruyu geri atmak. „Ich bin gut" İngilizceden çeviri, Almancada „iyi biriyim" gibi anlaşılır.',
      ),
    ],
    related: ['begruessung', 'reaktionen', 'arbeit'],
  }),

  topic({
    id: 'streiten',
    group: 'insan',
    icon: '😤',
    titleTr: 'Şikâyet etmek, tartışmak, sakinleştirmek',
    titleDe: 'Beschweren, streiten, schlichten',
    intro:
      'Almanlar sorunları **doğrudan** söyler. Bu kabalık değil, netliktir: komşu „Die Musik ist zu laut" der ve bitti. Sen de şikâyetini açık ama sakin söyleyebilmelisin. Bu konuda üç seviye var: kibar şikâyet, net itiraz ve tartışma. Sonunda da ortamı yumuşatmak gelir.',
    blocks: [
      h3('1. Kibar şikâyet (komşu, garson, müşteri hizmetleri)'),
      p(
        'Formül: **yumuşatıcı + sorun + istek**. Yumuşatıcı olarak „Entschuldigung, aber …", „Ich glaube, …" ya da Konjunktiv II („Könnten Sie …?") kullanılır.',
      ),
      phrases(
        undefined,
        say('Entschuldigung, aber ich glaube, hier stimmt was nicht.', 'Pardon, ama sanırım burada bir yanlışlık var.', 'alltag', {
          ex: ['Entschuldigung, aber ich glaube, die Rechnung stimmt nicht.', 'Pardon ama sanırım hesap yanlış.'],
        }),
        say('Könnten Sie die Musik bitte etwas leiser machen?', 'Müziği biraz kısabilir misiniz lütfen?', 'alltag'),
        say('Ich möchte mich beschweren.', 'Şikâyette bulunmak istiyorum.', 'alltag', { note: 'Resmî; müşteri hizmetleri, otel resepsiyonu.' }),
        say('Das ist nicht das, was ich bestellt habe.', 'Bu benim sipariş ettiğim şey değil.', 'alltag'),
        say('Das kann doch nicht sein!', 'Bu olamaz ki!', 'alltag', { note: '„doch" şaşkınlık ve sitem katar.' }),
        say('Ich warte jetzt schon seit einer Stunde.', 'Bir saattir bekliyorum.', 'alltag'),
      ),
      h3('2. Net itiraz'),
      phrases(
        undefined,
        say('Das sehe ich anders.', 'Ben farklı düşünüyorum.', 'alltag', { note: 'En kibar itiraz. İş toplantısında bile rahatça kullanılır.' }),
        say('Da muss ich widersprechen.', 'Burada itiraz etmem lazım.', 'alltag'),
        say('Moment mal!', 'Bir dakika!', 'alltag', { note: 'Birinin sözünü kesmek ya da haksızlığa itiraz için.' }),
        say('So geht das nicht.', 'Bu böyle olmaz.', 'alltag'),
        say('Das ist nicht fair.', 'Bu haksızlık.', 'alltag'),
        say('Jetzt reicht\'s aber!', 'Artık yeter ama!', 'alltag', { note: 'Sabrın tükendiğinde. Sesi yükseltir.' }),
        say('Lass mich mal ausreden!', 'Bırak da sözümü bitireyim!', 'locker', { note: 'Sözü kesilince. Sie ile: „Lassen Sie mich bitte ausreden."' }),
      ),
      h3('3. Kızgın tartışma (anlaman için)'),
      p(
        'Aşağıdakileri gerçek bir kavgada duyarsın. Hepsini kullanmak zorunda değilsin; ama ne kadar sert olduklarını bilmek önemli.',
      ),
      phrases(
        undefined,
        say('Spinnst du?', 'Kafayı mı yedin?', 'locker', { note: 'Arkadaşa şakayla da söylenir; yabancıya çok sert.' }),
        say('Was soll das denn?', 'Bu da ne demek oluyor?', 'locker'),
        say('Das geht dich nichts an!', 'Bu seni ilgilendirmez!', 'locker'),
        say('Mach doch, was du willst!', 'Ne istiyorsan yap!', 'locker', { note: 'Tartışmayı küsüp bitirme cümlesi.' }),
        say('Halt die Klappe!', 'Kapa çeneni!', 'derb'),
        say('Du gehst mir auf die Nerven!', 'Sinirimi bozuyorsun!', 'locker'),
      ),
      h3('4. Sakinleştirmek ve barışmak'),
      phrases(
        undefined,
        say('Jetzt beruhig dich erst mal.', 'Önce bir sakinleş.', 'locker', { standard: 'Beruhige dich erst einmal.' }),
        say('Lass uns in Ruhe darüber reden.', 'Bunu sakin sakin konuşalım.', 'alltag'),
        say('Das war nicht so gemeint.', 'Öyle demek istemedim.', 'alltag'),
        say('Schwamm drüber!', 'Unutalım gitsin! / Geçti gitti.', 'alltag', {
          note: 'Kelimesi kelimesine „üstünden sünger": tahtayı silmek gibi. Tartışma sonrası barışma cümlesi.',
        }),
        say('Wir sind quitt.', 'Ödeştik.', 'alltag'),
        say('Ist schon gut.', 'Tamam, önemli değil.', 'alltag'),
      ),
      dialogue(
        'Komşuyla gürültü meselesi',
        ['Du', 'Hallo, entschuldigen Sie die Störung. Ich wohne unter Ihnen.', 'Merhaba, rahatsız ettiğim için kusura bakmayın. Alt katınızda oturuyorum.'],
        ['Nachbar', 'Ja, und?', 'Evet, ne olmuş?'],
        ['Du', 'Es ist schon nach zehn, und die Musik ist ziemlich laut. Könnten Sie sie etwas leiser machen?', 'Saat ondan sonra ve müzik epey yüksek. Biraz kısabilir misiniz?'],
        ['Nachbar', 'Oh, sorry, das hab ich gar nicht gemerkt. Klar, mach ich.', 'Ah, pardon, hiç fark etmemişim. Tabii, kısarım.'],
        ['Du', 'Danke, sehr nett. Schönen Abend noch!', 'Teşekkürler, çok naziksiniz. İyi akşamlar!'],
      ),
      tip(
        'Almanya\'da **Ruhezeiten** (sessizlik saatleri) vardır: genelde akşam 22.00 – sabah 6.00 (bazı evlerde öğle 13–15) ve pazar günü bütün gün. Bu saatlerde gürültü şikâyeti tamamen haklı sayılır.',
      ),
      check(
        'Toplantıda bir meslektaşına kibarca itiraz etmek istiyorsun. Hangisi?',
        ['Spinnst du?', 'Das sehe ich anders.', 'Halt die Klappe!'],
        'Das sehe ich anders.',
        '„Das sehe ich anders" net ama saygılı. Diğer ikisi kavga cümlesi.',
      ),
      check(
        'Tartışma bitti, barışmak istiyorsun. Ne dersin?',
        ['Schwamm drüber!', 'Jetzt reicht\'s!', 'Mach doch, was du willst!'],
        'Schwamm drüber!',
        '„Schwamm drüber" = olanı silip geçelim.',
      ),
    ],
    related: ['reaktionen', 'wohnen', 'gefuehle'],
  }),

  topic({
    id: 'anteilnahme',
    group: 'insan',
    icon: '💐',
    titleTr: 'Tebrik, özür, teselli, başsağlığı',
    titleDe: 'Glückwünsche, Entschuldigung, Trost',
    intro:
      'Hayatın önemli anlarında ne söyleneceğini bilmek insanları birbirine bağlar. Almancada bu anlar için kalıplaşmış ifadeler vardır, tıpkı Türkçedeki „Geçmiş olsun", „Başın sağ olsun", „Allah analı babalı büyütsün" gibi. Ama Almanca kalıplar daha az dini ve daha kısadır.',
    blocks: [
      h3('1. Tebrik ve iyi dilekler'),
      phrases(
        undefined,
        say('Herzlichen Glückwunsch!', 'Tebrikler! / Kutlu olsun!', 'alltag', { ex: ['Herzlichen Glückwunsch zum Geburtstag!', 'Doğum günün kutlu olsun!'] }),
        say('Alles Gute!', 'Her şey gönlünce olsun!', 'alltag'),
        say('Glückwunsch zur bestandenen Prüfung!', 'Sınavı geçtiğin için tebrikler!', 'alltag'),
        say('Ich freu mich für dich!', 'Senin adına sevindim!', 'alltag', { standard: 'Ich freue mich für dich.' }),
        say('Das hast du dir verdient!', 'Bunu hak ettin!', 'alltag'),
        say('Viel Erfolg!', 'Başarılar!', 'alltag'),
        say('Ich drück dir die Daumen!', 'Senin için parmaklarımı çaprazlıyorum! / Şans dilerim!', 'alltag', {
          note: 'Almanlar şans dilerken başparmağını avucunda sıkar („Daumen drücken"). Sınav, mülakat öncesi.',
        }),
        say('Toi, toi, toi!', 'Nazar değmesin! / Bol şans!', 'alltag', { note: 'Sahneye çıkmadan, sınavdan önce. Batıl inanç: „Danke" denmez!' }),
        say('Hals- und Beinbruch!', 'Bol şans! (kelimesi kelimesine: boyun ve bacak kırığı)', 'locker', {
          note: 'Tiyatro ve kayak geleneğinden: kötü dilemek nazarı kovar. Şaka değil, gerçekten „bol şans" demek.',
        }),
      ),
      warn(
        'Doğum günü **önceden kutlanmaz**! Almanlar bunu uğursuz sayar. Bir gün önce görüşüyorsanız „Feier schön morgen!" dersin, „Herzlichen Glückwunsch" ise ancak o gün ya da sonra.',
      ),
      h3('2. Özür dilemek'),
      table(
        ['İfade', 'Ne zaman', 'Ağırlık'],
        [
          ['**Sorry!** / **Pardon!**', 'birine çarptın, yolunu kestin', 'çok hafif'],
          ['**Entschuldigung!**', 'genel; dikkat çekmek için de', 'hafif'],
          ['**Tut mir leid.**', 'bir şey yanlış gitti, üzgünsün', 'orta'],
          ['**Es tut mir wirklich leid.**', 'gerçek bir hata yaptın', 'ciddi'],
          ['**Ich muss mich bei dir entschuldigen.**', 'kırdığın birine', 'çok ciddi'],
          ['**Das war mein Fehler.**', 'suçu üstlenmek', 'net'],
        ],
      ),
      phrases(
        'Özüre cevap',
        say('Kein Problem.', 'Sorun değil.', 'alltag'),
        say('Macht nichts.', 'Önemli değil.', 'alltag'),
        say('Schon okay.', 'Tamam, olur böyle şeyler.', 'locker'),
        say('Halb so wild.', 'O kadar da büyütülecek bir şey değil.', 'locker', { note: 'Kelimesi kelimesine „yarısı kadar vahşi".' }),
      ),
      h3('3. Teselli ve geçmiş olsun'),
      phrases(
        undefined,
        say('Gute Besserung!', 'Geçmiş olsun!', 'alltag', { note: 'Sadece hastalık için. Kaza, hırsızlık gibi olaylar için: „Oh nein, das tut mir leid!"' }),
        say('Das tut mir echt leid für dich.', 'Senin adına gerçekten üzüldüm.', 'alltag'),
        say('Kopf hoch!', 'Moralini bozma! / Başını dik tut!', 'alltag'),
        say('Das wird schon wieder.', 'Düzelir, merak etme.', 'alltag', { note: 'Türkçedeki „Geçer, geçer" hissi.' }),
        say('Wenn du reden willst, bin ich da.', 'Konuşmak istersen buradayım.', 'alltag'),
        say('Kann ich irgendwas für dich tun?', 'Senin için yapabileceğim bir şey var mı?', 'alltag'),
      ),
      h3('4. Başsağlığı'),
      p(
        'Ölüm durumunda Almanlar çok kısa ve sade konuşur. Uzun teselli cümleleri yerine kısa bir kalıp ve sessizlik tercih edilir. Yazılı taziye kartında (**Trauerkarte, Beileidskarte**) daha uzun yazılır.',
      ),
      phrases(
        undefined,
        say('Herzliches Beileid.', 'Başınız sağ olsun.', 'alltag', { note: 'Yüz yüze en yaygın ve en güvenli ifade.' }),
        say('Mein herzliches Beileid.', 'Başınız sağ olsun (benden).', 'alltag'),
        say('Es tut mir so leid.', 'Çok üzgünüm.', 'alltag'),
        say('Ich bin in Gedanken bei dir.', 'Aklım ve kalbim seninle.', 'alltag'),
        say('Unsere aufrichtige Anteilnahme.', 'Acınızı içtenlikle paylaşıyoruz.', 'alltag', { note: 'Yazılı, resmî (kart, e-posta).' }),
      ),
      check(
        'Arkadaşının yarın doğum günü, bugün onu görüyorsun. Ne dersin?',
        ['Herzlichen Glückwunsch zum Geburtstag!', 'Feier morgen schön!', 'Gute Besserung!'],
        'Feier morgen schön!',
        'Almanlar doğum gününü **önceden** kutlamayı uğursuz sayar.',
      ),
      check(
        'İş arkadaşın yarın önemli bir mülakata giriyor. En doğal dilek?',
        ['Ich drück dir die Daumen!', 'Herzliches Beileid!', 'Halb so wild!'],
        'Ich drück dir die Daumen!',
        '„Daumen drücken" = şans dilemek.',
      ),
      check(
        'Bir tanıdığın babası vefat etti. Yüz yüze ne dersin?',
        ['Gute Besserung.', 'Herzliches Beileid.', 'Kopf hoch!'],
        'Herzliches Beileid.',
        '„Gute Besserung" sadece hastalık için; „Kopf hoch" bu durumda fazla hafif kaçar.',
      ),
    ],
    related: ['gefuehle', 'feiern', 'hoeflichkeit'],
  }),

  topic({
    id: 'feiern',
    group: 'insan',
    icon: '🎉',
    titleTr: 'Davet, parti ve kutlama',
    titleDe: 'Einladungen und Partys',
    intro:
      'Alman partilerinin yazılı olmayan kuralları vardır: zamanında gelinir (ama ev partisinde 15 dakika geç kalmak normal), eli boş gidilmez, kadeh kaldırırken göz göze bakılır. Bu kuralları bilmek seni hemen „içeriden biri" yapar.',
    blocks: [
      h3('1. Davet etmek ve daveti cevaplamak'),
      phrases(
        undefined,
        say('Ich mach am Samstag \'ne kleine Party. Hast du Lust zu kommen?', 'Cumartesi küçük bir parti veriyorum. Gelmek ister misin?', 'locker'),
        say('Ich würde mich freuen, wenn du kommst.', 'Gelirsen sevinirim.', 'alltag'),
        say('Ich bin dabei!', 'Ben varım!', 'locker'),
        say('Da bin ich leider schon verplant.', 'Maalesef o gün başka planım var.', 'alltag', {
          note: '„verplant" = takvimi dolu. Kibar bir ret.',
        }),
        say('Soll ich was mitbringen?', 'Bir şey getireyim mi?', 'alltag', {
          note: 'Mutlaka sor. Cevap genelde „Nur gute Laune!" (Sadece iyi bir ruh hali!) ama yine de bir şişe veya tatlı götürülür.',
        }),
        say('Bring einfach was zu trinken mit.', 'İçecek bir şey getir yeter.', 'locker'),
      ),
      p(
        'Almanya\'da sık görülen bir parti tipi: **Mitbringparty** (herkes bir yemek getirir) ve doğum günü sahibinin **kendisinin** ikram ettiği partiler. Türkiye\'den farklı olarak doğum günü olan kişi işe pasta götürür, iş arkadaşları ona ısmarlamaz.',
      ),
      h3('2. Partide'),
      phrases(
        undefined,
        say('Prost!', 'Şerefe!', 'alltag', { note: 'Bira, şarap. Daha resmî: „Zum Wohl!"' }),
        say('Auf dich!', 'Senin şerefine!', 'alltag'),
        say('Lass es dir schmecken!', 'Afiyet olsun!', 'alltag', { note: 'Kısa hâli: „Guten Appetit!" ya da gündelikte „Mahlzeit!" (özellikle iş yerinde öğlen).' }),
        say('Bedien dich!', 'Buyur, kendin al!', 'locker', { note: 'Ev sahibi masadaki yiyecekleri gösterirken.' }),
        say('Fühl dich wie zu Hause!', 'Kendini evinde hisset!', 'alltag'),
        say('Die Party ist voll im Gange.', 'Parti tam kıvamında.', 'locker'),
        say('Wer ist denn der Typ da drüben?', 'Şuradaki tip kim?', 'locker'),
      ),
      warn(
        'Kadeh kaldırırken **göz göze bak**! Almanlar buna çok dikkat eder; batıl inanca göre bakmazsan „7 yıl kötü seks" gelir. Şaka gibi ama herkes bilir ve uyar.',
      ),
      h3('3. Ayrılmak'),
      phrases(
        undefined,
        say('Ich mach mich dann mal auf den Weg.', 'Ben artık yola koyulayım.', 'alltag'),
        say('Danke für die Einladung, war richtig schön!', 'Davet için teşekkürler, gerçekten güzeldi!', 'alltag'),
        say('Komm gut nach Hause!', 'Eve sağ salim git!', 'alltag', { note: 'Gece ayrılan misafire hep söylenir.' }),
        say('Ich glaub, ich hab einen sitzen.', 'Sanırım biraz çakırkeyif oldum.', 'locker', { note: '„einen sitzen haben" = biraz sarhoş olmak.' }),
        say('Morgen hab ich bestimmt \'nen Kater.', 'Yarın kesin akşamdan kalma olurum.', 'locker', { note: '„der Kater" = erkek kedi, ama burada akşamdan kalmalık.' }),
      ),
      dialogue(
        'Kapıda',
        ['Jonas', 'Hey, schön, dass du da bist! Komm rein!', 'Hey, gelmene sevindim! Gel içeri!'],
        ['Du', 'Hi! Danke für die Einladung. Hier, ich hab Wein mitgebracht.', 'Selam! Davet için teşekkürler. Al, şarap getirdim.'],
        ['Jonas', 'Oh, super, danke! Jacke kannst du da hinten aufhängen. Getränke sind in der Küche, bedien dich!', 'Aa süper, teşekkürler! Ceketini arkaya asabilirsin. İçecekler mutfakta, kendin al!'],
        ['Du', 'Mach ich. Kenn ich hier eigentlich jemanden?', 'Tamam. Burada tanıdığım biri var mı acaba?'],
        ['Jonas', 'Klar, Mia aus der Uni ist auch da. Komm, ich stell dich ein paar Leuten vor.', 'Tabii, üniversiteden Mia da burada. Gel, seni birkaç kişiyle tanıştırayım.'],
      ),
      check(
        'Bir arkadaşın seni yemeğe davet etti. Kibarlık gereği ne sorarsın?',
        ['Was kostet das?', 'Soll ich was mitbringen?', 'Wann muss ich gehen?'],
        'Soll ich was mitbringen?',
        'Eli boş gitmemek Almanya\'da da önemli.',
      ),
      check(
        '„Prost!" derken neye dikkat edersin?',
        ['Bardağı masaya vurmaya', 'Karşındakinin gözüne bakmaya', 'Önce ev sahibinin içmesine'],
        'Karşındakinin gözüne bakmaya',
        'Göz teması Almanya\'da kadeh tokuşturmanın kuralı.',
      ),
    ],
    related: ['freunde', 'anteilnahme', 'smalltalk'],
  }),

  topic({
    id: 'flirten',
    group: 'insan',
    icon: '💘',
    titleTr: 'Flört, ilişki, ayrılık',
    titleDe: 'Flirten und Beziehungen',
    intro:
      'Almanya\'da flört genelde yavaş ilerler ve doğrudandır: biri ilgileniyorsa bunu açıkça söyler, „naz" daha azdır. İlişki dili de kendine özgü kalıplarla doludur: „zusammen sein", „Schluss machen", „einen Korb geben". Kitapta bulamayacağın ama her dizide duyacağın ifadeler.',
    blocks: [
      h3('1. İlgi göstermek ve buluşma teklif etmek'),
      phrases(
        undefined,
        say('Hast du Lust, mal was trinken zu gehen?', 'Bir ara bir şeyler içmeye gitmek ister misin?', 'alltag', {
          note: 'Almanya\'da klasik ilk buluşma teklifi. „Kaffee trinken" daha masum, „was trinken" akşam ve daha flörtöz.',
        }),
        say('Kann ich deine Nummer haben?', 'Numaranı alabilir miyim?', 'alltag'),
        say('Darf ich dich zu einem Kaffee einladen?', 'Seni bir kahveye davet edebilir miyim?', 'alltag', {
          note: '„einladen" = ısmarlamak da demek. Davet eden öder; ama Almanya\'da hesabı bölmek („getrennt") çok yaygın.',
        }),
        say('Du gefällst mir.', 'Senden hoşlanıyorum.', 'alltag'),
        say('Ich steh auf dich.', 'Sana yanığım / Senden çok hoşlanıyorum.', 'locker', { note: '„auf jemanden stehen" = birinden hoşlanmak, ondan etkilenmek.' }),
        say('Ich bin in dich verknallt.', 'Sana abayı yaktım.', 'locker', { note: '„verknallt" = ilk aşamadaki heyecanlı âşıklık. „verliebt" daha derin.' }),
        say('Sie flirtet mit dir!', 'Seninle flört ediyor!', 'locker'),
      ),
      h3('2. İlişkinin evreleri'),
      table(
        ['İfade', 'Anlamı'],
        [
          ['sich **kennenlernen**', 'tanışmak'],
          ['**ein Date** haben', 'buluşması olmak'],
          ['sich **verlieben** (in + Akk)', 'âşık olmak'],
          ['**zusammenkommen**', 'sevgili olmak (ilişki başlamak)'],
          ['**zusammen sein** / **eine Beziehung haben**', 'sevgili olmak / ilişkisi olmak'],
          ['**mein Freund / meine Freundin**', 'erkek/kız arkadaşım (sevgilim!)'],
          ['**sich verloben**', 'nişanlanmak'],
          ['**Schluss machen** (mit + Dat)', 'ayrılmak (birini terk etmek)'],
          ['**sich trennen**', 'ayrılmak (karşılıklı, resmî)'],
          ['**der/die Ex**', 'eski sevgili'],
        ],
      ),
      warn(
        '„**meine Freundin**" Almancada genelde **sevgilim** anlamına gelir! Arkadaşını kastediyorsan: „**eine Freundin von mir**" ya da „**eine gute Freundin**". Bu küçük fark çok yanlış anlaşılmaya yol açar.',
      ),
      h3('3. Reddetmek ve ayrılmak'),
      phrases(
        undefined,
        say('Sorry, ich bin vergeben.', 'Kusura bakma, birisi var / ilişkim var.', 'locker', { note: '„vergeben" = kapılmış, boşta değil.' }),
        say('Ich bin nicht interessiert.', 'İlgilenmiyorum.', 'alltag'),
        say('Sie hat ihm einen Korb gegeben.', 'Kız onu reddetti.', 'alltag', { note: '„einen Korb geben/bekommen" = reddetmek / reddedilmek. Kelimesi kelimesine „sepet vermek".' }),
        say('Er hat mit ihr Schluss gemacht.', 'Ondan ayrıldı (ilişkiyi bitirdi).', 'alltag'),
        say('Wir haben uns getrennt.', 'Ayrıldık.', 'alltag'),
        say('Sie hat ihn sitzen lassen.', 'Kız onu ekti / yüzüstü bıraktı.', 'alltag'),
        say('Er hat sie geghostet.', 'Ondan aniden tamamen haber kesti.', 'jugend', { note: 'İngilizceden: ghosten. Gençler arasında çok yaygın.' }),
        say('Ich hab Liebeskummer.', 'Aşk acısı çekiyorum.', 'alltag'),
      ),
      dialogue(
        'Kafede cesaret',
        ['Du', 'Du, ich wollte dich schon länger was fragen …', 'Bak, sana bir süredir bir şey sormak istiyordum …'],
        ['Sara', 'Ja? Was denn?', 'Evet? Neymiş?'],
        ['Du', 'Hast du Lust, am Freitag mal was mit mir trinken zu gehen? Nur wir zwei?', 'Cuma günü benimle bir şeyler içmeye gelmek ister misin? Sadece ikimiz?'],
        ['Sara', 'Oh … ja, gern! Ich hab schon gedacht, du fragst nie.', 'Aa … evet, seve seve! Hiç sormayacaksın sandım.'],
        ['Du', 'Echt? Super! Dann schreib ich dir wegen der Uhrzeit.', 'Sahi mi? Süper! O zaman saat için sana yazarım.'],
      ),
      check(
        '„Ich habe heute meine Freundin getroffen." Almanlar bunu ilk duyduğunda ne anlar?',
        ['Bir kız arkadaşınla (arkadaş olarak) buluştun', 'Sevgilinle buluştun', 'Annenle buluştun'],
        'Sevgilinle buluştun',
        'Arkadaşı kastediyorsan: „eine Freundin von mir".',
      ),
      check(
        '„Sie hat ihm einen Korb gegeben." Ne oldu?',
        ['Ona hediye verdi', 'Onu reddetti', 'Onunla ayrıldı'],
        'Onu reddetti',
        '„einen Korb geben" = bir teklifi reddetmek, özellikle flörtte.',
      ),
    ],
    related: ['gefuehle', 'freunde', 'chat'],
  }),
];
