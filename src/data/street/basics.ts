import type { StreetTopicInput } from '../../domain/street';
import { dialogue, p, phrases, say, table, tip, topic, warn } from './build';

/** Foundations: how spoken German sounds and works, greetings, reactions, particles. */
export const BASICS: StreetTopicInput[] = [
  topic({
    id: 'gesprochene-formen',
    icon: '🗣️',
    titleTr: 'Konuşurken kelimeler nasıl kısalır',
    titleDe: 'Gesprochene Formen',
    intro:
      'Sokakta kimse „Hast du einen Moment Zeit?" demez; „Haste ma\'n Moment?" der. Kitap Almancası ile duyduğun Almanca arasındaki farkın yarısı bu kısaltmalardan gelir. Bunları **anlaman** şart, kullanman serbest.',
    blocks: [
      table(
        ['Yazı dili', 'Konuşmada', 'Ne oluyor?'],
        [
          ['Hast du …?', '**Haste** …?', 'fiil + du birleşir'],
          ['Kannst du / Willst du / Musst du', '**Kannste / Willste / Musste**', 'aynı kural'],
          ['Gehst du / Kommst du', '**Gehste / Kommste**', 'aynı kural'],
          ['ein / eine / einen', "**'n / 'ne / 'nen**", 'ei- düşer'],
          ['nicht', '**nich**', 't düşer'],
          ['ich habe / ich gehe', '**ich hab / ich geh**', 'sondaki -e düşer'],
          ['haben wir', '**ham wa**', 'Kuzey/Berlin'],
          ['ist es / gibt es', '**isses / gibt\'s**', 'es kaynaşır'],
          ['einmal', '**mal / ma**', 'neredeyse her cümlede'],
          ['darauf / darein / herüber / heraus', '**drauf / rein / rüber / raus**', 'da-/her- kısalır'],
          ['so etwas / etwas', '**so was / was**', '„etwas" yerine „was"'],
        ],
      ),
      phrases(
        'En sık duyacakların',
        say('Haste mal \'n Moment?', 'Bir dakikan var mı?', 'locker', { standard: 'Hast du mal einen Moment?' }),
        say('Weißte was?', 'Biliyor musun ne var?', 'locker', {
          standard: 'Weißt du was?',
          note: 'Bir öneri ya da haber vermeden önce dikkat çekmek için.',
          ex: ['Weißte was? Wir bestellen einfach Pizza.', 'Bak ne diyeceğim, pizza söyleyelim gitsin.'],
        }),
        say('Kannste mir mal helfen?', 'Bana bir yardım eder misin?', 'locker', { standard: 'Kannst du mir mal helfen?' }),
        say('Ich hab keine Zeit.', 'Vaktim yok.', 'alltag', { standard: 'Ich habe keine Zeit.', note: '-e düşürmek o kadar yaygın ki resmî konuşmada bile normal.' }),
        say('Das weiß ich nich.', 'Onu bilmiyorum.', 'alltag', { standard: 'Das weiß ich nicht.' }),
        say('Gibt\'s was Neues?', 'Yeni bir şey var mı?', 'alltag', { standard: 'Gibt es etwas Neues?' }),
        say('Ich hab \'ne Frage.', 'Bir sorum var.', 'alltag', { standard: 'Ich habe eine Frage.' }),
        say('Komm mal rüber!', 'Bir buraya gel!', 'locker', { standard: 'Komm mal herüber!' }),
        say('Isses weit?', 'Uzak mı?', 'locker', { standard: 'Ist es weit?' }),
        say('Wie geht\'s?', 'Nasılsın?', 'alltag', { standard: 'Wie geht es dir?' }),
        say('Ham wa noch Milch?', 'Süt kaldı mı?', 'regional', { standard: 'Haben wir noch Milch?', region: 'Kuzey, Berlin' }),
      ),
      tip(
        "Dinlerken takılırsan şunu düşün: anlamadığın tek hece çoğu zaman „du\", „es\" ya da „ein\" kalıntısıdır. **Haste** → hast du, **'s** → es, **'n** → ein.",
      ),
      warn(
        'Bu kısaltmaları e-postada, dilekçede, sınavda **yazma**. Yazıda sadece mesajlaşmada (WhatsApp) normaldir.',
      ),
    ],
    related: ['gesprochene-grammatik', 'fuellwoerter', 'chat'],
  }),

  topic({
    id: 'gesprochene-grammatik',
    icon: '🧩',
    titleTr: 'Konuşma dilinin grameri',
    titleDe: 'Grammatik im Alltag',
    intro:
      'Konuşma dili gramersiz değildir; sadece kitaptakinden farklı kurallara uyar. Aşağıdakileri Almanların çoğu her gün kullanır.',
    blocks: [
      phrases(
        'Zamanlar',
        say('Ich **hab** gestern lange **gearbeitet**.', 'Dün geç saate kadar çalıştım.', 'alltag', {
          note: 'Konuşmada geçmiş zaman neredeyse hep Perfekt. Präteritum sadece war, hatte, konnte, musste, wollte, gab için.',
        }),
        say('Ich bin gerade **am Kochen**.', 'Şu an yemek yapıyorum.', 'alltag', {
          standard: 'Ich koche gerade.',
          note: 'am + büyük harfli fiil + sein = „-yor" (şu an yapılan iş). Konuşmada çok yaygın.',
          ex: ['Kann ich dich später anrufen? Ich bin grad am Arbeiten.', 'Seni sonra arayabilir miyim? Şu an çalışıyorum.'],
        }),
        say('Ich **geh** morgen zum Arzt.', 'Yarın doktora gidiyorum.', 'alltag', {
          note: 'Gelecek için Futur yerine Präsens + zaman zarfı kullanılır. „Ich werde gehen" konuşmada resmî ya da ısrarlı durur.',
        }),
      ),
      phrases(
        'Cümle yapısı',
        say('…, **weil** ich hab keine Zeit.', '…, çünkü vaktim yok.', 'locker', {
          standard: '…, weil ich keine Zeit habe.',
          note: 'Konuşmada weil\'den sonra fiil sık sık 2. sırada kalır. Duyarsın ama yazıda ve sınavda hata sayılır.',
        }),
        say('Ich komm nicht mit. **Hab** keine Lust.', 'Gelmiyorum. Canım istemiyor.', 'locker', {
          standard: 'Ich habe keine Lust.',
          note: 'Bağlamdan belliyse „ich" düşer: (Ich) Hab keine Ahnung. (Ich) Weiß nicht.',
        }),
        say('Kennst du Tim? – Ja, **den** kenn ich.', 'Tim\'i tanıyor musun? – Evet, onu tanıyorum.', 'alltag', {
          standard: 'Ja, ihn kenne ich.',
          note: 'Konuşmada er/sie/es yerine der/die/das kullanılır ve cümlenin başına gelir: Der ist nett. Die wohnt hier.',
        }),
        say('Der Film, der war echt gut.', 'O film var ya, gerçekten iyiydi.', 'locker', {
          note: 'Konuyu öne alıp sonra der/die/das ile tekrarlamak tipik konuşma yapısıdır.',
        }),
      ),
      phrases(
        'Hâl ekleri',
        say('**wegen dem** Wetter', 'hava yüzünden', 'alltag', {
          standard: 'wegen des Wetters',
          note: 'Konuşmada wegen, trotz, während çoğunlukla Dativ alır. Genitiv yazıda ve resmî konuşmada kalır.',
        }),
        say('Das ist **dem Peter sein** Auto.', 'Bu Peter\'in arabası.', 'regional', {
          standard: 'Das ist Peters Auto.',
          region: 'Güney, Batı (yaygın ama „yanlış" sayılır)',
          note: 'Anlaman için. Sen „Peters Auto" ya da „das Auto von Peter" de.',
        }),
        say('das Auto **von** meinem Bruder', 'abimin arabası', 'alltag', {
          standard: 'das Auto meines Bruders',
          note: 'von + Dativ konuşmada Genitiv\'in yerini büyük ölçüde almıştır.',
        }),
      ),
      tip(
        'Kural: **duyduğunu anla, yazarken kitap gramerini kullan**. weil + V2 veya „wegen dem" konuşmada kimseyi rahatsız etmez, ama sınavda puan kaybettirir.',
      ),
    ],
    related: ['gesprochene-formen', 'partikeln'],
  }),

  topic({
    id: 'begruessung',
    icon: '👋',
    titleTr: 'Selamlaşma ve vedalaşma',
    titleDe: 'Begrüßen und verabschieden',
    intro: '„Guten Tag" doğru ama sokakta nadiren duyulur. Gerçekte insanlar nasıl selamlaşıyor, bölgeye ve yakınlığa göre.',
    blocks: [
      phrases(
        'Selam',
        say('Hallo!', 'Merhaba!', 'alltag', { note: 'Her yerde, herkesle. En güvenli seçim.' }),
        say('Hi! / Hey!', 'Selam!', 'locker'),
        say('Na?', 'N\'aber? / Eee?', 'locker', {
          note: 'Tek başına „n\'aber" demek. Cevap da çoğu zaman „Na?" ya da „Na, alles gut?" olur.',
          ex: ['Na, alles klar? – Ja, und bei dir?', 'N\'aber, her şey yolunda mı? – Evet, sende?'],
        }),
        say('Alles klar?', 'Her şey yolunda mı? / Naber?', 'locker', {
          note: 'Gerçek bir soru değil, selam. Cevap: „Ja, alles klar. Und bei dir?"',
        }),
        say('Wie läuft\'s?', 'İşler nasıl gidiyor?', 'locker'),
        say('Was geht?', 'Naber? / Ne var ne yok?', 'jugend', { note: 'Cevabı genelde „Nicht viel." ya da „Chillen."' }),
        say('Moin!', 'Selam! / Günaydın!', 'regional', { region: 'Kuzey Almanya (günün her saati)', note: 'Hamburg\'da akşam da „Moin" denir. „Moin moin" daha samimi.' }),
        say('Servus!', 'Selam! (hem merhaba hem hoşça kal)', 'regional', { region: 'Bayern, Österreich' }),
        say('Grüß Gott!', 'İyi günler!', 'regional', { region: 'Bayern, Österreich', note: 'Dinî bir anlamı yok, sadece kibar selam.' }),
        say('Grüezi!', 'Merhaba!', 'regional', { region: 'Schweiz' }),
        say('Mahlzeit!', 'Afiyet olsun! / Selam (öğle vakti)', 'alltag', {
          note: 'İşyerinde öğle saatlerinde koridorda selam olarak söylenir. Cevap da „Mahlzeit!"',
        }),
      ),
      phrases(
        'Vedalaşma',
        say('Tschüss!', 'Hoşça kal! / Görüşürüz!', 'alltag', { note: 'Kasada, telefonda, herkesle. „Auf Wiedersehen" daha resmî.' }),
        say('Tschau! / Ciao!', 'Görüşürüz!', 'locker'),
        say('Bis dann! / Bis später! / Bis gleich!', 'Görüşürüz! / Sonra görüşürüz! / Birazdan görüşürüz!', 'alltag', {
          note: 'Bis gleich: birkaç dakika içinde; bis später: bugün içinde; bis dann: belirlenmiş bir zamana kadar.',
        }),
        say('Bis morgen!', 'Yarın görüşürüz!', 'alltag'),
        say('Mach\'s gut!', 'Kendine iyi bak!', 'locker', { note: 'Cevabı: „Du auch!"' }),
        say('Man sieht sich!', 'Görüşürüz! (belirsiz zamanda)', 'locker'),
        say('Schönen Feierabend!', 'İyi akşamlar! (iş çıkışı)', 'alltag', { note: 'İşten ayrılan birine söylenir. Feierabend = mesai bitimi.' }),
        say('Schönes Wochenende!', 'İyi hafta sonları!', 'alltag', { note: 'Cevabı: „Danke, gleichfalls!" ya da „Dir auch!"' }),
        say('Ich mach mich mal auf den Weg.', 'Ben artık yola çıkayım.', 'alltag'),
        say('Ich bin dann mal weg!', 'Ben kaçtım!', 'locker'),
      ),
      dialogue(
        'Merdivende komşuyla',
        ['Nachbarin', 'Morgen! Na, auch schon wach?', 'Günaydın! Eee, sen de uyandın mı?'],
        ['Du', 'Morgen! Ja, muss leider früh zur Arbeit.', 'Günaydın! Evet, maalesef erken işe gitmem lazım.'],
        ['Nachbarin', 'Oh je. Na dann, schönen Tag noch!', 'Hay Allah. Neyse, iyi günler!'],
        ['Du', 'Danke, Ihnen auch! Tschüss!', 'Teşekkürler, size de! Hoşça kalın!'],
      ),
      tip('Sabah selamı çoğu zaman sadece **„Morgen!"** olur, „Guten" düşer. Akşam da sadece **„’n Abend!"** duyarsın.'),
    ],
    related: ['hoeflichkeit', 'regional'],
  }),

  topic({
    id: 'hoeflichkeit',
    icon: '🙏',
    titleTr: 'Günlük kibarlık ve küçük sohbet',
    titleDe: 'Höflichkeit und Smalltalk',
    intro: 'Teşekkür, özür, rica ve „du mu Sie mi" meselesi. Almanların gündelik kibarlık kalıpları kitaptakinden daha kısadır.',
    blocks: [
      phrases(
        'Teşekkür ve cevabı',
        say('Danke dir! / Danke Ihnen!', 'Sağ ol! / Teşekkür ederim!', 'alltag'),
        say('Danke, sehr nett!', 'Teşekkürler, çok naziksiniz!', 'alltag'),
        say('Gerne! / Gern geschehen!', 'Rica ederim!', 'alltag', { note: 'En doğal cevap sadece „Gerne!"' }),
        say('Kein Problem! / Kein Ding!', 'Sorun değil! / Lafı mı olur!', 'locker'),
        say('Nicht dafür!', 'Ne demek, teşekküre gerek yok!', 'regional', { region: 'Kuzey Almanya' }),
        say('Passt schon!', 'Önemli değil! / Tamamdır!', 'regional', { region: 'Güney, Österreich (her yerde anlaşılır)' }),
      ),
      phrases(
        'Özür ve dikkat çekme',
        say('Entschuldigung! / \'tschuldigung!', 'Pardon! / Affedersiniz!', 'alltag'),
        say('Sorry!', 'Pardon!', 'locker', { note: 'Almancada çok yaygın; gençler ve orta yaşlılar sürekli kullanır.' }),
        say('Darf ich mal?', 'Bir geçebilir miyim? / Bakabilir miyim?', 'alltag', { note: 'Kalabalıkta geçmek ya da bir şeye uzanmak için. Çok kullanışlı.' }),
        say('Moment mal! / Sekunde!', 'Bir dakika! / Bir saniye!', 'alltag'),
        say('Warte mal!', 'Dur bir dakika!', 'locker'),
        say('Gesundheit!', 'Çok yaşa!', 'alltag', { note: 'Hapşırana söylenir. Cevabı: „Danke!"' }),
      ),
      phrases(
        'Karşılık verme',
        say('Gleichfalls! / Ebenso!', 'Size de! / Sana da!', 'alltag', { ex: ['Schönen Abend noch! – Danke, gleichfalls!', 'İyi akşamlar! – Teşekkürler, size de!'] }),
        say('Dir auch! / Ihnen auch!', 'Sana da! / Size de!', 'alltag'),
        say('Und selbst? / Und dir?', 'Ya sen?', 'locker', { ex: ['Wie geht\'s? – Gut, und selbst?', 'Nasılsın? – İyiyim, ya sen?'] }),
        say('Schönen Tag noch!', 'İyi günler! (ayrılırken)', 'alltag', { note: 'Kasada, dükkândan çıkarken klasik veda.' }),
      ),
      phrases(
        'Küçük sohbet (Smalltalk)',
        say('Ganz schön kalt heute, oder?', 'Bugün epey soğuk, değil mi?', 'alltag'),
        say('Endlich mal Sonne!', 'Nihayet güneş!', 'alltag'),
        say('Viel los heute.', 'Bugün çok kalabalık / yoğun.', 'alltag'),
        say('Und, was machst du so?', 'Eee, neler yapıyorsun? (işin ne?)', 'locker'),
        say('Wo kommst du ursprünglich her?', 'Aslen nerelisin?', 'alltag'),
      ),
      p(
        '**du mu Sie mi?** İşyerinde, spor salonunda, öğrenciler ve 30 yaş altı arasında genelde **du**. Resmî dairede, doktorda, yaşlılara ve müşteriye **Sie**. Emin değilsen Sie ile başla; karşı taraf „Wir können uns gern duzen" der.',
      ),
      phrases(
        'du / Sie geçişi',
        say('Wollen wir uns duzen?', 'Birbirimize „sen" diyelim mi?', 'alltag'),
        say('Sag ruhig du!', 'Bana rahatça „sen" diyebilirsin!', 'alltag'),
        say('Ich bin übrigens Anna.', 'Bu arada ben Anna.', 'alltag', { note: 'Sadece ön adını söylemek de „du\'ya geçelim" demektir.' }),
      ),
    ],
    related: ['begruessung', 'ja-nein'],
  }),

  topic({
    id: 'reaktionen',
    icon: '😮',
    titleTr: 'Tepkiler ve ünlemler',
    titleDe: 'Reaktionen',
    intro: 'Sohbette en çok duyacağın şey kısa tepkilerdir. Doğru tepkiyi doğru tonda vermek seni anında „yerli" gibi gösterir.',
    blocks: [
      phrases(
        'Şaşırma',
        say('Echt?', 'Gerçekten mi?', 'alltag', { note: 'En sık kullanılan şaşırma tepkisi.' }),
        say('Ernsthaft?', 'Ciddi misin?', 'locker'),
        say('Nicht dein Ernst!', 'Şaka yapıyorsun!', 'locker'),
        say('Krass!', 'Vay be! / Olamaz!', 'locker', { note: 'Hem olumlu hem olumsuz şaşkınlık. Gençlerde çok sık.' }),
        say('Wahnsinn!', 'İnanılmaz!', 'alltag'),
        say('Boah!', 'Vay! / Ooff!', 'locker', { note: 'Hayranlık da olabilir, bıkkınlık da: „Boah, ist das heiß!"' }),
        say('Ach was!', 'Yok artık! / Hadi canım!', 'locker'),
        say('Ich glaub\'s nicht!', 'İnanamıyorum!', 'alltag'),
      ),
      phrases(
        'Beğeni',
        say('Super! / Toll!', 'Süper!', 'alltag'),
        say('Mega!', 'Çok iyi!', 'locker'),
        say('Der Hammer!', 'Muhteşem! / Bomba!', 'locker', { ex: ['Das Konzert war der Hammer!', 'Konser bombaydı!'] }),
        say('Geil!', 'Harika! / Süper!', 'locker', { note: 'Aslen „azgın" demekti; bugün „harika" anlamında çok yaygın ama yaşlılar ve resmî ortamda kaba bulunur.' }),
        say('Nicht schlecht!', 'Fena değil! (aslında: iyi!)', 'alltag'),
        say('Lecker!', 'Nefis!', 'alltag', { note: 'Sadece yiyecek-içecek için.' }),
      ),
      phrases(
        'Anlama / onaylama',
        say('Ach so!', 'Haa, öyle mi! / Anladım!', 'alltag', { note: 'Bir şey yeni anlaşılınca. Çok sık.' }),
        say('Stimmt!', 'Doğru!', 'alltag'),
        say('Genau!', 'Aynen! / Kesinlikle!', 'alltag'),
        say('Eben!', 'İşte! / Ben de onu diyorum!', 'locker'),
        say('Na also!', 'Hah, işte! / Gördün mü!', 'alltag'),
        say('Hä?', 'Ha? / Ne?', 'locker', { note: 'Anlamadığında. Yabancıya „Wie bitte?" de.' }),
      ),
      phrases(
        'Hayal kırıklığı ve sinir',
        say('Oh Mann!', 'Off ya! / Hay aksi!', 'locker'),
        say('Mist!', 'Hay aksi! / Kahretsin!', 'locker', { note: 'Hafif; çocuk yanında bile söylenir.' }),
        say('So ein Mist!', 'Ne kötü! / Hay Allah!', 'locker'),
        say('Na toll!', 'Ne güzel(!) (ironik)', 'locker', { note: 'Ironi: bir şey ters gidince „Harika ya!" demek gibi.' }),
        say('Na ja …', 'Eh işte … / Şey …', 'alltag', { note: 'Kararsızlık ya da kibarca olumsuzluk: „Wie war der Film? – Na ja …" = pek iyi değildi.' }),
        say('Schade!', 'Yazık! / Ne kötü!', 'alltag'),
        say('Egal.', 'Fark etmez. / Boş ver.', 'alltag'),
        say('Na und?', 'Ne olmuş yani?', 'locker'),
        say('Ups! / Hoppla!', 'Hop! / Eyvah!', 'alltag'),
      ),
    ],
    related: ['ja-nein', 'gefuehle', 'jugendsprache'],
  }),

  topic({
    id: 'ja-nein',
    icon: '👍',
    titleTr: 'Evet, hayır, belki',
    titleDe: 'Ja, nein, vielleicht',
    intro: 'Almanlar „ja" ve „nein"in onlarca tonunu kullanır. Bunlarla isteksizliğini, coşkunu ya da kararsızlığını anlatabilirsin.',
    blocks: [
      phrases(
        'Evet',
        say('Jo. / Jep.', 'He. / Evet.', 'locker'),
        say('Klar! / Na klar!', 'Tabii! / Elbette!', 'alltag'),
        say('Logisch!', 'Tabii ki! / Belli değil mi!', 'locker'),
        say('Auf jeden Fall!', 'Kesinlikle! / Kesin!', 'alltag'),
        say('Gerne!', 'Memnuniyetle! / Olur!', 'alltag'),
        say('Geht klar!', 'Tamamdır! / Olur!', 'locker'),
        say('Passt!', 'Uyar! / Tamam!', 'alltag', { note: 'Güneyde çok yaygın, her yerde anlaşılır.' }),
        say('Doch!', 'Evet! (olumsuz soruya)', 'alltag', {
          note: 'Olumsuz bir soruya/iddiaya „evet" demek için ja değil doch: „Kommst du nicht? – Doch!"',
          ex: ['Du hast keine Zeit, oder? – Doch, klar!', 'Vaktin yok, değil mi? – Var tabii!'],
        }),
        say('Ja eh.', 'Zaten evet. / Tabii ki.', 'regional', { region: 'Österreich' }),
      ),
      phrases(
        'Hayır',
        say('Nee. / Nö.', 'Yok. / Hayır.', 'locker', { note: '„Nö" biraz umursamaz ve çocuksu tınlar.' }),
        say('Auf keinen Fall!', 'Asla! / Kesinlikle hayır!', 'alltag'),
        say('Kommt nicht in Frage!', 'Söz konusu bile olamaz!', 'alltag'),
        say('Vergiss es!', 'Unut onu! / Hayatta olmaz!', 'locker'),
        say('Lieber nicht.', 'Olmasa daha iyi.', 'alltag'),
        say('Nein, danke.', 'Hayır, teşekkürler.', 'alltag'),
      ),
      phrases(
        'Belki ve kararsızlık',
        say('Mal sehen. / Mal schauen.', 'Bakarız.', 'alltag', { note: 'Çoğu zaman kibar bir „muhtemelen hayır".' }),
        say('Kommt drauf an.', 'Duruma göre.', 'alltag'),
        say('Vielleicht.', 'Belki.', 'alltag'),
        say('Keine Ahnung.', 'Hiçbir fikrim yok.', 'alltag'),
        say('Weiß nicht.', 'Bilmem.', 'locker'),
        say('Von mir aus. / Meinetwegen.', 'Bana uyar. / Bence sakıncası yok.', 'alltag', { note: 'İsteksiz bir onay: „Pek umurumda değil, olur."' }),
        say('Ist mir egal.', 'Bana fark etmez.', 'alltag'),
      ),
      dialogue(
        'Akşam planı',
        ['Lena', 'Kino heute Abend?', 'Bu akşam sinema?'],
        ['Du', 'Hm, kommt drauf an. Welcher Film?', 'Hmm, duruma göre. Hangi film?'],
        ['Lena', 'Der neue Thriller. Hast du keine Lust?', 'Yeni gerilim filmi. Canın istemiyor mu?'],
        ['Du', 'Doch, klar! Geht klar.', 'Yok, istiyor tabii! Tamamdır.'],
      ),
    ],
    related: ['reaktionen', 'freunde'],
  }),

  topic({
    id: 'partikeln',
    icon: '🧂',
    titleTr: 'Modal partiküller: cümlenin tuzu',
    titleDe: 'Modalpartikeln',
    intro:
      'ja, doch, mal, halt, eben, denn, schon… Sözlükte anlamı olmayan ama konuşmada her cümlede geçen kelimeler. Cümlenin tonunu verirler. Türkçedeki „ya, işte, hele, bi, artık" gibi.',
    blocks: [
      phrases(
        undefined,
        say('Komm **mal** her!', 'Bi buraya gel!', 'alltag', {
          note: '**mal** ricayı yumuşatır, Türkçedeki „bi" gibi. Kibar ricalarda neredeyse zorunlu: Kannst du mal …?',
          ex: ['Guck mal!', 'Bi baksana!'],
        }),
        say('Das ist **ja** super!', 'Bu süpermiş ya!', 'alltag', {
          note: '**ja** şaşkınlık ya da „zaten bildiğimiz bir şey": Du bist ja schon da! = Aa, gelmişsin bile!',
        }),
        say('Komm **doch** mit!', 'Hadi sen de gel!', 'alltag', {
          note: '**doch** öneriyi ısrarlı ama samimi yapar. „Mach doch!" = Yapsana!',
        }),
        say('Das ist **halt** so.', 'Ne yapalım, öyle işte.', 'locker', {
          note: '**halt** (Güney) / **eben** (Kuzey): değiştiremeyeceğin bir durum. „Ist halt teuer." = Pahalı işte, ne yapacaksın.',
        }),
        say('Was ist **denn** los?', 'Ne oldu ki?', 'alltag', {
          note: '**denn** soruyu yumuşatır ve ilgi gösterir. „Wie heißt du denn?" çocuğa sıcak bir soru.',
        }),
        say('Das klappt **schon**.', 'Olur merak etme.', 'alltag', {
          note: '**schon** burada „merak etme, nasılsa olur" anlamında rahatlatır.',
        }),
        say('Das ist **eigentlich** ganz einfach.', 'Aslında çok basit.', 'alltag', {
          note: 'Soruda **eigentlich** konuyu değiştirir: Wie alt bist du eigentlich? = Bu arada sen kaç yaşındaydın?',
        }),
        say('Mach **einfach**!', 'Yap gitsin!', 'alltag', { note: '**einfach** = „düşünme, yap". Ruf ihn einfach an! = Ara gitsin onu!' }),
        say('Setz dich **ruhig**!', 'Rahatça otur!', 'alltag', { note: '**ruhig** izin verirken: „çekinme".' }),
        say('Er ist **wohl** krank.', 'Galiba hasta.', 'alltag', { note: '**wohl** = tahmin: galiba, herhalde.' }),
        say('Jetzt komm **schon**!', 'Hadi artık gel!', 'locker', { note: 'Emirde **schon** sabırsızlık: Hadi artık!' }),
      ),
      tip(
        'Partikül olmadan konuşmak gramer olarak doğrudur ama robotik ve sert durur. „Gib mir das Salz" emir gibi; „Gibst du mir **mal** das Salz?" doğal ve kibar.',
      ),
      table(
        ['Sert / robotik', 'Doğal'],
        [
          ['Komm her.', 'Komm **mal** her.'],
          ['Wo bist du?', 'Wo bist du **denn**?'],
          ['Das ist so.', 'Das ist **halt** so.'],
          ['Probier es.', 'Probier\'s **doch mal**.'],
        ],
      ),
    ],
    related: ['fuellwoerter', 'gesprochene-grammatik'],
  }),

  topic({
    id: 'fuellwoerter',
    icon: '💬',
    titleTr: 'Sohbet kelimeleri ve dolgu sözcükleri',
    titleDe: 'Füllwörter und Gesprächssignale',
    intro: 'Düşünürken zaman kazanmak, söz almak, konuyu değiştirmek ya da onay istemek için kullanılan kelimeler. Bunlar konuşmanı akıcı gösterir.',
    blocks: [
      phrases(
        'Düşünürken',
        say('Also …', 'Şimdi … / Yani …', 'alltag', { note: 'Söze başlarken en yaygın kelime.' }),
        say('Ähm … / Äh …', 'Şey … / Ee …', 'alltag'),
        say('Wie soll ich sagen …', 'Nasıl desem …', 'alltag'),
        say('Sozusagen / quasi', 'Bir nevi / sayılır', 'locker', { ex: ['Er ist quasi mein Chef.', 'O bir nevi benim patronum.'] }),
        say('Irgendwie', 'Bir şekilde / Nedense', 'locker', { ex: ['Irgendwie hab ich keine Lust.', 'Nedense canım istemiyor.'] }),
        say('… oder so.', '… falan.', 'locker', { ex: ['Wir treffen uns um acht oder so.', 'Sekiz gibi falan buluşuruz.'] }),
      ),
      phrases(
        'Onay isterken',
        say('…, oder?', '…, değil mi?', 'alltag'),
        say('…, ne?', '…, di mi?', 'regional', { region: 'Kuzey, Batı' }),
        say('…, gell? / gelle?', '…, değil mi?', 'regional', { region: 'Güney, Hessen' }),
        say('…, weißt du? / weißte?', '…, biliyor musun? / anlıyor musun?', 'locker'),
      ),
      phrases(
        'Söz alırken ve konu değiştirirken',
        say('Sag mal, …', 'Baksana, … / Söylesene, …', 'alltag', { ex: ['Sag mal, hast du morgen Zeit?', 'Baksana, yarın vaktin var mı?'] }),
        say('Hör mal, …', 'Bak, … / Dinle, …', 'alltag', { note: 'Ciddi ya da hafif sitemli bir şey söylerken.' }),
        say('Guck mal! / Schau mal!', 'Baksana!', 'alltag', { note: 'Guck mal kuzey, schau mal güney.' }),
        say('Übrigens …', 'Bu arada …', 'alltag'),
        say('Apropos …', 'Lafı açılmışken …', 'alltag'),
        say('Ehrlich gesagt …', 'Açıkçası …', 'alltag'),
        say('Wie gesagt …', 'Dediğim gibi …', 'alltag'),
        say('Jedenfalls …', 'Neyse … / Her neyse …', 'alltag', { note: 'Sözü toparlarken.' }),
        say('Lange Rede, kurzer Sinn: …', 'Uzun lafın kısası: …', 'alltag'),
      ),
      phrases(
        'Dinlediğini göstermek',
        say('Mhm. / Aha.', 'Hı hı. / Anladım.', 'alltag'),
        say('Ja, ja.', 'Evet, evet. (bazen: tamam tamam, anladık)', 'alltag', { note: 'Hızlı söylenen „ja ja" sabırsızlık gibi algılanabilir.' }),
        say('Verstehe.', 'Anlıyorum.', 'alltag'),
        say('Echt jetzt?', 'Hadi ya, cidden mi?', 'locker'),
      ),
    ],
    related: ['partikeln', 'reaktionen'],
  }),
];
