import type { StreetTopicInput } from '../../domain/street';
import { check, dialogue, h3, p, phrases, say, table, tip, topic, warn } from './build';

/** Cars: driving, fuel, workshop, TÜV and the slang around it. */
export const CARS: StreetTopicInput[] = [
  topic({
    id: 'auto',
    group: 'gunluk',
    icon: '🚗',
    titleTr: 'Araba, trafik ve tamirhane',
    titleDe: 'Rund ums Auto',
    intro:
      'Almanya bir otomobil ülkesi: hız sınırı olmayan otoyol bölümleri, **TÜV** muayenesi, her mahallede bir **Werkstatt**. Araba dili de kendi argosuyla zengin: „Karre", „heizen", „geblitzt werden", „Knöllchen". Bu konu hem günlük hayatta hem de araba videolarını (JP Performance, GRIP) anlamak için.',
    blocks: [
      h3('1. Arabanın kendisi: gündelik ve argo isimler'),
      table(
        ['Kelime', 'Anlamı', 'Üslup'],
        [
          ['das **Auto**, der **Wagen**', 'araba', 'nötr'],
          ['die **Karre**', 'araba (eski ya da sevgiyle)', 'samimi'],
          ['die **Kiste**', 'araba (çoğunlukla eski)', 'samimi'],
          ['die **Schüssel** / die **Rostlaube**', 'hurda, külüstür', 'samimi, alaycı'],
          ['der **Schlitten**', 'şık, pahalı araba', 'samimi'],
          ['der **Kombi**', 'station wagon', 'nötr'],
          ['der **Verbrenner** / das **E-Auto**', 'benzinli-dizel / elektrikli araba', 'nötr'],
          ['die **PS** (Pferdestärke)', 'beygir gücü', 'nötr: „Wie viel PS hat der?"'],
        ],
      ),
      phrases(
        undefined,
        say('Was fährst du für ein Auto?', 'Ne arabası kullanıyorsun?', 'alltag', {
          note: '„Was für ein …" = ne tür bir. Cevap: „Ich fahr einen Golf." (Akkusativ, der Golf → einen Golf)',
        }),
        say('Geile Karre!', 'Ne araba ama! / Harika araba!', 'locker', { note: '„geil" burada „harika" demek; gençler ve araba meraklıları arasında çok yaygın.' }),
        say('Die Kiste macht\'s nicht mehr lange.', 'Bu araba daha fazla dayanmaz.', 'locker'),
        say('Der zieht ordentlich!', 'Bu araba iyi çekiyor!', 'locker', { note: '„ziehen" = hızlanma gücü.' }),
        say('Der säuft ganz schön.', 'Bu araba epey yakıyor.', 'locker', { note: '„saufen" = (hayvan gibi) içmek; yakıt tüketimi için mizahi.' }),
      ),

      h3('2. Sürmek ve trafik'),
      phrases(
        undefined,
        say('Ich steh im Stau.', 'Trafikteyim / Trafiğe takıldım.', 'alltag', { note: 'Gecikirken en sık yazılan mesaj.' }),
        say('Auf der A7 ist Vollsperrung.', 'A7 otoyolu tamamen kapalı.', 'alltag'),
        say('Er ist viel zu schnell gefahren.', 'Çok hızlı sürdü.', 'alltag'),
        say('Der heizt wie ein Irrer.', 'Deli gibi basıyor (hızlı sürüyor).', 'locker', { note: '„heizen" / „rasen" = çok hızlı sürmek. Hız delisi: der Raser.' }),
        say('Mach mal langsam!', 'Yavaş ol biraz!', 'locker'),
        say('Ich bin geblitzt worden.', 'Radara yakalandım.', 'alltag', {
          note: '„der Blitzer" = hız kamerası (flaş patladığı için). „Mich hat\'s geblitzt" da denir.',
        }),
        say('Der Drängler hinter mir nervt.', 'Arkamdaki sıkıştıran sürücü sinir bozuyor.', 'alltag', { note: '„drängeln" = arkadan yapışmak. Almanya\'da cezası ağırdır.' }),
        say('Der hat mir die Lichthupe gegeben.', 'Bana selektör yaptı.', 'alltag', { note: 'die Lichthupe = farlarla uyarı (selektör).' }),
        say('Ich hab ein Knöllchen bekommen.', 'Park cezası yedim.', 'locker', { standard: 'Ich habe einen Strafzettel bekommen.' }),
        say('Hier ist Parken verboten, du wirst abgeschleppt.', 'Burada park yasak, araban çekilir.', 'alltag'),
      ),
      p(
        'Otoyolun adı **Autobahn**, şehirlerarası normal yol **Landstraße**. Otoyolda sağdan geçmek yasaktır; sol şerit sadece sollamak içindir. Kaza ya da trafik sıkışmasında araçlar **Rettungsgasse** (ambulans koridoru) açmak zorundadır: sol şerit sola, diğerleri sağa.',
      ),

      h3('3. Benzinlikte'),
      phrases(
        undefined,
        say('Ich muss noch tanken.', 'Benzin almam lazım.', 'alltag'),
        say('Volltanken, bitte.', 'Fulleyin lütfen.', 'alltag', { note: 'Almanya\'da genelde self servis; kasada „Säule drei, bitte" (3 numaralı pompa) dersin.' }),
        say('Säule vier, bitte.', '4 numaralı pompa, lütfen.', 'alltag'),
        say('Super oder Diesel?', 'Benzin mi dizel mi?', 'alltag', { note: '„Super" = kurşunsuz benzin (E5), „Super E10" = %10 etanollü.' }),
        say('Der Tank ist fast leer.', 'Depo neredeyse boş.', 'alltag'),
        say('Ich fahr auf Reserve.', 'Yedek yakıtla gidiyorum.', 'alltag'),
      ),

      h3('4. Tamirhane ve TÜV'),
      p(
        '**TÜV** (resmî adıyla **Hauptuntersuchung, HU**) her iki yılda bir yapılan zorunlu araç muayenesidir; arka plakadaki renkli yuvarlak çıkartma bir sonraki muayene tarihini gösterir. Gündelik dilde „**Ich muss zum TÜV**" ya da „**Der Wagen hat keinen TÜV mehr**" denir.',
      ),
      phrases(
        undefined,
        say('Mein Auto muss in die Werkstatt.', 'Arabamın tamirhaneye gitmesi lazım.', 'alltag'),
        say('Da leuchtet so ein Lämpchen.', 'Bir ışık yanıyor (göstergede).', 'alltag'),
        say('Der Motor macht komische Geräusche.', 'Motor tuhaf sesler çıkarıyor.', 'alltag'),
        say('Die Bremsen quietschen.', 'Frenler gıcırdıyor.', 'alltag'),
        say('Was würde die Reparatur ungefähr kosten?', 'Tamir yaklaşık ne tutar?', 'alltag'),
        say('Können Sie mir einen Kostenvoranschlag machen?', 'Bana bir fiyat teklifi (ön tahmin) verebilir misiniz?', 'alltag', {
          note: 'Tamire başlamadan önce mutlaka iste; sürpriz faturayı önler.',
        }),
        say('Ich muss Winterreifen aufziehen lassen.', 'Kış lastiği taktırmam lazım.', 'alltag', {
          note: 'Kural: „von O bis O" = Ekim\'den (Oktober) Paskalya\'ya (Ostern) kış lastiği.',
        }),
        say('Ist der Wagen durch den TÜV gekommen?', 'Araba muayeneden geçti mi?', 'alltag'),
        say('Die Karre ist durchgefallen.', 'Araba muayeneden kaldı.', 'locker'),
      ),
      dialogue(
        'Tamirhanede',
        ['Mechaniker', 'Morgen! Was kann ich für Sie tun?', 'Günaydın! Sizin için ne yapabilirim?'],
        ['Du', 'Morgen. Seit gestern leuchtet die Motorkontrollleuchte, und der Wagen zieht nicht mehr richtig.', 'Günaydın. Dünden beri motor arıza lambası yanıyor ve araba eskisi gibi çekmiyor.'],
        ['Mechaniker', 'Hm. Da müssen wir mal den Fehlerspeicher auslesen.', 'Hmm. Arıza hafızasını okumamız lazım.'],
        ['Du', 'Wie lange dauert das ungefähr?', 'Bu yaklaşık ne kadar sürer?'],
        ['Mechaniker', 'Eine halbe Stunde. Wenn\'s was Größeres ist, ruf ich Sie an und mach Ihnen einen Kostenvoranschlag.', 'Yarım saat. Daha büyük bir şeyse sizi arar, fiyat teklifi veririm.'],
        ['Du', 'Super, danke. Meine Nummer steht im Auftrag.', 'Süper, teşekkürler. Numaram iş emrinde yazıyor.'],
      ),
      tip(
        'Araba videolarında sık duyacağın kelimeler: **Leistung** (güç), **Drehmoment** (tork), **Beschleunigung** (hızlanma), **Verbrauch** (tüketim), **Fahrwerk** (süspansiyon), **Getriebe** (şanzıman), **tunen** (modifiye etmek), **Vollgas geben** (gaza sonuna kadar basmak).',
      ),
      warn(
        'Almanya\'da trafikte el hareketleri (orta parmak, „Vogel zeigen" = parmakla şakağa dokunmak) ve hakaret **suçtur** ve yüzlerce euro para cezası getirebilir. „Idiot!" diye bağırmak bile şikâyet konusu olabilir.',
      ),
      check(
        '„Ich bin geblitzt worden." Ne oldu?',
        ['Arabaya yıldırım düştü', 'Hız kamerasına yakalandım', 'Park cezası yedim'],
        'Hız kamerasına yakalandım',
        'der Blitzer = hız kamerası. Park cezası = Knöllchen / Strafzettel.',
      ),
      check(
        'Tamirhanede tamire başlamadan önce ne istersin?',
        ['einen Kostenvoranschlag', 'einen Strafzettel', 'eine Überweisung'],
        'einen Kostenvoranschlag',
        'Kostenvoranschlag = fiyat teklifi / maliyet tahmini.',
      ),
      check(
        '„Geile Karre!" Kim, nerede söyler?',
        ['Resmî bir yazıda', 'Arkadaşlar arasında, bir arabayı överken', 'Polise'],
        'Arkadaşlar arasında, bir arabayı överken',
        '„geil" ve „Karre" ikisi de samimi dil.',
      ),
    ],
    related: ['unterwegs', 'arbeit', 'geld'],
  }),
];
