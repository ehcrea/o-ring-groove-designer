/*
 * Translations (English, German, Dutch, Turkish).
 *
 * Keys are the English texts, so untranslated strings fall back to English.
 * t(text, params) fills {name} placeholders; string parameters that are
 * themselves dictionary keys (material names, …) are translated too.
 * Static page text is translated by walking the DOM once and remembering the
 * English originals; dynamic text is produced through t().
 */
(function (root) {
  'use strict';

  const LANGS = {
    en: { name: 'English', locale: 'en-US' },
    de: { name: 'Deutsch', locale: 'de-DE' },
    nl: { name: 'Nederlands', locale: 'nl-NL' },
    tr: { name: 'Türkçe', locale: 'tr-TR' },
  };
  const STORE_KEY = 'oring.lang';

  // [English, German, Dutch, Turkish]
  const ROWS = [
    // ----- Page, toolbar -----
    ['O-Ring Groove Designer', 'O-Ring-Nutauslegung', 'O-ring-groefontwerp', 'O-Ring Kanal Tasarımı'],
    ['Piston, rod & face seals · AS568 & ISO 3601 · v1.1', 'Kolben-, Stangen- & Flanschdichtungen · AS568 & ISO 3601 · v1.1', 'Zuiger-, stang- & vlakafdichtingen · AS568 & ISO 3601 · v1.1', 'Piston, mil ve yüzey sızdırmazlığı · AS568 ve ISO 3601 · v1.1'],
    ['Unit system', 'Einheitensystem', 'Eenhedenstelsel', 'Birim sistemi'],
    ['Metric', 'Metrisch', 'Metrisch', 'Metrik'],
    ['Inch', 'Zoll', 'Inch', 'İnç'],
    ['Language', 'Sprache', 'Taal', 'Dil'],
    ['Open the unit converter', 'Einheitenumrechner öffnen', 'Eenhedenomrekenaar openen', 'Birim dönüştürücüyü aç'],
    ['Unit converter', 'Einheitenumrechner', 'Eenhedenomrekenaar', 'Birim dönüştürücü'],
    ['Copy a link containing this design', 'Link zu diesem Entwurf kopieren', 'Link naar dit ontwerp kopiëren', 'Bu tasarımın bağlantısını kopyala'],
    ['Copy link', 'Link kopieren', 'Link kopiëren', 'Bağlantıyı kopyala'],
    ['Print this page', 'Diese Seite drucken', 'Deze pagina afdrukken', 'Bu sayfayı yazdır'],
    ['Print', 'Drucken', 'Afdrukken', 'Yazdır'],
    ['About this calculator', 'Über diesen Rechner', 'Over deze calculator', 'Bu hesaplayıcı hakkında'],
    ['About', 'Über', 'Over', 'Hakkında'],
    ['Toggle light/dark theme', 'Hell/Dunkel umschalten', 'Licht/donker wisselen', 'Açık/koyu temayı değiştir'],
    ['Toggle theme', 'Design umschalten', 'Thema wisselen', 'Temayı değiştir'],
    ['Close', 'Schließen', 'Sluiten', 'Kapat'],

    // ----- Application -----
    ['Application', 'Anwendung', 'Toepassing', 'Uygulama'],
    ['Seal type', 'Dichtungsart', 'Type afdichting', 'Sızdırmazlık tipi'],
    ['Piston (radial)', 'Kolben (radial)', 'Zuiger (radiaal)', 'Piston (radyal)'],
    ['Rod (radial)', 'Stange (radial)', 'Stang (radiaal)', 'Mil (radyal)'],
    ['Face (axial)', 'Flansch (axial)', 'Vlak (axiaal)', 'Yüzey (eksenel)'],
    ['Motion', 'Bewegung', 'Beweging', 'Hareket'],
    ['Static', 'Statisch', 'Statisch', 'Statik'],
    ['Dynamic', 'Dynamisch', 'Dynamisch', 'Dinamik'],
    ['Pressure from', 'Druck von', 'Druk van', 'Basınç yönü'],
    ['Pressure direction', 'Druckrichtung', 'Drukrichting', 'Basınç yönü'],
    ['Inside', 'Innen', 'Binnen', 'İçeriden'],
    ['Outside', 'Außen', 'Buiten', 'Dışarıdan'],
    ['Groove outline', 'Nutkontur', 'Groefcontour', 'Kanal konturu'],
    ['Circle', 'Kreis', 'Cirkel', 'Daire'],
    ['Rectangle (R)', 'Rechteck (R)', 'Rechthoek (R)', 'Dikdörtgen (R)'],
    ['Design guideline', 'Auslegungsrichtlinie', 'Ontwerprichtlijn', 'Tasarım kılavuzu'],
    ['Auto (Parker for AS568, ERIKS for metric)', 'Auto (Parker für AS568, ERIKS für metrisch)', 'Auto (Parker voor AS568, ERIKS voor metrisch)', 'Otomatik (AS568 için Parker, metrik için ERIKS)'],
    ['Parker (ORD 5700)', 'Parker (ORD 5700)', 'Parker (ORD 5700)', 'Parker (ORD 5700)'],
    ['ERIKS (technical handbook)', 'ERIKS (technisches Handbuch)', 'ERIKS (technisch handboek)', 'ERIKS (teknik el kitabı)'],
    ['Medium', 'Medium', 'Medium', 'Akışkan'],
    ['Liquid', 'Flüssigkeit', 'Vloeistof', 'Sıvı'],
    ['Gas / vacuum', 'Gas / Vakuum', 'Gas / vacuüm', 'Gaz / vakum'],
    ['Back-up rings', 'Stützringe', 'Steunringen', 'Destek halkaları'],
    ['None', 'Keine', 'Geen', 'Yok'],
    ['One', 'Einer', 'Eén', 'Bir'],
    ['Two', 'Zwei', 'Twee', 'İki'],
    ['Groove in the piston (inner part). The O-ring is stretched onto the groove bottom and seals against the bore.',
      'Nut im Kolben (Innenteil). Der O-Ring wird auf den Nutgrund gedehnt und dichtet gegen die Bohrung.',
      'Groef in de zuiger (binnendeel). De O-ring wordt op de groefbodem gerekt en dicht af tegen de boring.',
      'Kanal pistonda (iç parça). O-ring kanal tabanına gerdirilir ve deliğe karşı sızdırmazlık sağlar.'],
    ['Groove in the housing bore. The O-ring seals against the rod or shaft.',
      'Nut in der Gehäusebohrung. Der O-Ring dichtet gegen Stange oder Welle.',
      'Groef in de huisboring. De O-ring dicht af tegen de stang of as.',
      'Kanal gövde deliğinde. O-ring mile veya şafta karşı sızdırmazlık sağlar.'],
    ['Groove in a flat face, pressure from outside: the O-ring ID should seat on the groove inner wall.',
      'Nut in einer Planfläche, Druck von außen: der O-Ring-Innendurchmesser soll an der inneren Nutwand anliegen.',
      'Groef in een vlak, druk van buiten: de binnendiameter van de O-ring moet tegen de binnenwand van de groef liggen.',
      'Düz yüzeyde kanal, basınç dışarıdan: O-ring iç çapı kanalın iç duvarına oturmalıdır.'],
    ['Groove in a flat face, pressure from inside: the O-ring OD should seat on the groove outer wall.',
      'Nut in einer Planfläche, Druck von innen: der O-Ring-Außendurchmesser soll an der äußeren Nutwand anliegen.',
      'Groef in een vlak, druk van binnen: de buitendiameter van de O-ring moet tegen de buitenwand van de groef liggen.',
      'Düz yüzeyde kanal, basınç içeriden: O-ring dış çapı kanalın dış duvarına oturmalıdır.'],
    ['Rounded-rectangle radial gland: the contour is the bore (piston) or the rod / plug (rod); the groove is offset from it by the gland depth.',
      'Radiale Nut als gerundetes Rechteck: die Kontur ist die Bohrung (Kolben) bzw. die Stange / der Zapfen (Stange); die Nut ist um die Einbautiefe versetzt.',
      'Radiale groef als afgeronde rechthoek: de contour is de boring (zuiger) of de stang / plug (stang); de groef ligt de inbouwdiepte daarvan af.',
      'Yuvarlatılmış dikdörtgen radyal yuva: kontur delik (piston) veya mil / tapadır (mil); kanal bundan yuva derinliği kadar içeridedir.'],
    ['Rounded rectangle: enter the outer groove wall; the inner wall is offset by the groove width.',
      'Gerundetes Rechteck: äußere Nutwand eingeben; die innere Wand ist um die Nutbreite versetzt.',
      'Afgeronde rechthoek: voer de buitenwand van de groef in; de binnenwand ligt een groefbreedte naar binnen.',
      'Yuvarlatılmış dikdörtgen: kanalın dış duvarını girin; iç duvar kanal genişliği kadar içeridedir.'],

    // ----- O-ring -----
    ['O-ring', 'O-Ring', 'O-ring', 'O-ring'],
    ['Size standard', 'Größennorm', 'Maatnorm', 'Ölçü standardı'],
    ['AS568 (inch)', 'AS568 (Zoll)', 'AS568 (inch)', 'AS568 (inç)'],
    ['ISO 3601-1 G (metric)', 'ISO 3601-1 G (metrisch)', 'ISO 3601-1 G (metrisch)', 'ISO 3601-1 G (metrik)'],
    ['Custom size', 'Eigene Größe', 'Eigen maat', 'Özel ölçü'],
    ['Cross-section filter', 'Schnurstärken-Filter', 'Filter koorddikte', 'Kesit filtresi'],
    ['All cross-sections', 'Alle Schnurstärken', 'Alle koorddiktes', 'Tüm kesitler'],
    ['Size', 'Größe', 'Maat', 'Ölçü'],
    ['Inner diameter ID', 'Innendurchmesser d1', 'Binnendiameter ID', 'İç çap ID'],
    ['ID tolerance ±', 'Toleranz d1 ±', 'Tolerantie ID ±', 'ID toleransı ±'],
    ['Cross-section CS', 'Schnurstärke d2', 'Koorddikte CS', 'Kesit CS'],
    ['CS tolerance ±', 'Toleranz d2 ±', 'Tolerantie CS ±', 'CS toleransı ±'],
    ['Material', 'Werkstoff', 'Materiaal', 'Malzeme'],
    ['Hardness', 'Härte', 'Hardheid', 'Sertlik'],
    ['Suggest O-ring for this hardware', 'O-Ring für diese Einbaumaße vorschlagen', 'O-ring voor deze inbouwmaten voorstellen', 'Bu parça için O-ring öner'],
    ['Pick the standard O-ring that best fits the main hardware dimension, then size the groove for it',
      'Den Norm-O-Ring wählen, der am besten zum Hauptmaß passt, und die Nut dafür auslegen',
      'De norm-O-ring kiezen die het best bij de hoofdmaat past en de groef daarvoor dimensioneren',
      'Ana ölçüye en uygun standart O-ringi seç ve kanalı ona göre boyutlandır'],
    ['OD {od} · centreline length {cl}', 'Außen-Ø {od} · Mittellinienlänge {cl}', 'Buiten-Ø {od} · lengte hartlijn {cl}', 'Dış çap {od} · merkez hattı uzunluğu {cl}'],
    ['actual {a} × {b} in', 'Istmaß {a} × {b} in', 'werkelijk {a} × {b} in', 'gerçek {a} × {b} in'],
    ['SAE AS568 · ISO 3601-1 series A inch sizes', 'SAE AS568 · ISO 3601-1 Reihe A, Zollgrößen', 'SAE AS568 · ISO 3601-1 serie A, inchmaten', 'SAE AS568 · ISO 3601-1 A serisi inç ölçüleri'],
    ['ISO 3601-1 series G, general industrial', 'ISO 3601-1 Reihe G, allgemeine Industrie', 'ISO 3601-1 serie G, algemene industrie', 'ISO 3601-1 G serisi, genel endüstri'],

    // ----- Hardware -----
    ['Hardware & groove', 'Einbauraum & Nut', 'Inbouwruimte & groef', 'Parça ve kanal'],
    ['Bore Ø', 'Bohrung Ø', 'Boring Ø', 'Delik Ø'],
    ['Groove Ø', 'Nut-Ø', 'Groef-Ø', 'Kanal Ø'],
    ['Piston Ø', 'Kolben-Ø', 'Zuiger-Ø', 'Piston Ø'],
    ['Rod Ø', 'Stangen-Ø', 'Stang-Ø', 'Mil Ø'],
    ['Housing bore Ø', 'Gehäusebohrung Ø', 'Huisboring Ø', 'Gövde deliği Ø'],
    ['Bore length', 'Bohrung Länge', 'Boring lengte', 'Delik uzunluğu'],
    ['Bore width', 'Bohrung Breite', 'Boring breedte', 'Delik genişliği'],
    ['Rod length', 'Stange Länge', 'Stang lengte', 'Mil uzunluğu'],
    ['Rod width', 'Stange Breite', 'Stang breedte', 'Mil genişliği'],
    ['Corner radius', 'Eckenradius', 'Hoekradius', 'Köşe yarıçapı'],
    ['Gland depth', 'Einbautiefe', 'Inbouwdiepte', 'Yuva derinliği'],
    ['Diametral clearance', 'Durchmesserspiel', 'Diametrale speling', 'Çapsal boşluk'],
    ['Groove outer Ø', 'Nut-Außen-Ø', 'Groef buiten-Ø', 'Kanal dış Ø'],
    ['Outer length', 'Außenlänge', 'Buitenlengte', 'Dış uzunluk'],
    ['Outer width', 'Außenbreite', 'Buitenbreedte', 'Dış genişlik'],
    ['Outer corner radius', 'Äußerer Eckenradius', 'Buitenhoekradius', 'Dış köşe yarıçapı'],
    ['Groove depth', 'Nuttiefe', 'Groefdiepte', 'Kanal derinliği'],
    ['Flange gap', 'Flanschspalt', 'Flensspleet', 'Flanş boşluğu'],
    ['Groove width', 'Nutbreite', 'Groefbreedte', 'Kanal genişliği'],
    ['Groove bottom radius', 'Nutgrundradius', 'Groefbodemradius', 'Kanal taban yarıçapı'],
    ['Apply recommended groove', 'Empfohlene Nut übernehmen', 'Aanbevolen groef toepassen', 'Önerilen kanalı uygula'],
    ['Set gland depth, groove width and clearance from the guideline for the selected O-ring',
      'Einbautiefe, Nutbreite und Spiel aus der Richtlinie für den gewählten O-Ring setzen',
      'Inbouwdiepte, groefbreedte en speling uit de richtlijn voor de gekozen O-ring overnemen',
      'Seçilen O-ring için yuva derinliği, kanal genişliği ve boşluğu kılavuzdan ayarla'],
    ['Tolerances', 'Toleranzen', 'Toleranties', 'Toleranslar'],
    ['Diameters ±', 'Durchmesser ±', 'Diameters ±', 'Çaplar ±'],
    ['Depth ±', 'Tiefe ±', 'Diepte ±', 'Derinlik ±'],
    ['Width ±', 'Breite ±', 'Breedte ±', 'Genişlik ±'],
    ['Include full eccentricity (parts offset by the radial clearance)', 'Volle Exzentrizität berücksichtigen (Teile um das Radialspiel versetzt)', 'Volledige excentriciteit meenemen (delen verschoven over de radiale speling)', 'Tam eksen kaçıklığını dahil et (parçalar radyal boşluk kadar kayık)'],
    ['Each diameter of the gland is taken as nominal ± the diameter tolerance; the depth tolerance applies to the face groove depth and to rectangular radial glands.',
      'Jeder Durchmesser des Einbauraums wird mit Nennmaß ± Durchmessertoleranz angesetzt; die Tiefentoleranz gilt für die Nuttiefe von Flanschdichtungen und für rechteckige radiale Nuten.',
      'Elke diameter van de inbouwruimte wordt als nominaal ± diametertolerantie genomen; de dieptetolerantie geldt voor de groefdiepte van vlakafdichtingen en voor rechthoekige radiale groeven.',
      'Yuvanın her çapı nominal ± çap toleransı alınır; derinlik toleransı yüzey kanalı derinliğine ve dikdörtgen radyal yuvalara uygulanır.'],
    ['Gland depth L = (bore − groove Ø) / 2 = {L}. Radial clearance = (bore − piston Ø) / 2 = {c}.',
      'Einbautiefe L = (Bohrung − Nut-Ø) / 2 = {L}. Radialspiel = (Bohrung − Kolben-Ø) / 2 = {c}.',
      'Inbouwdiepte L = (boring − groef-Ø) / 2 = {L}. Radiale speling = (boring − zuiger-Ø) / 2 = {c}.',
      'Yuva derinliği L = (delik − kanal Ø) / 2 = {L}. Radyal boşluk = (delik − piston Ø) / 2 = {c}.'],
    ['Gland depth L = (groove Ø − rod Ø) / 2 = {L}. Radial clearance = (housing bore − rod Ø) / 2 = {c}.',
      'Einbautiefe L = (Nut-Ø − Stangen-Ø) / 2 = {L}. Radialspiel = (Gehäusebohrung − Stangen-Ø) / 2 = {c}.',
      'Inbouwdiepte L = (groef-Ø − stang-Ø) / 2 = {L}. Radiale speling = (huisboring − stang-Ø) / 2 = {c}.',
      'Yuva derinliği L = (kanal Ø − mil Ø) / 2 = {L}. Radyal boşluk = (gövde deliği − mil Ø) / 2 = {c}.'],
    ['Gland depth L = groove depth + flange gap = {L}.', 'Einbautiefe L = Nuttiefe + Flanschspalt = {L}.', 'Inbouwdiepte L = groefdiepte + flensspleet = {L}.', 'Yuva derinliği L = kanal derinliği + flanş boşluğu = {L}.'],

    // ----- Operating conditions -----
    ['Operating conditions', 'Betriebsbedingungen', 'Bedrijfsomstandigheden', 'Çalışma koşulları'],
    ['Pressure', 'Druck', 'Druk', 'Basınç'],
    ['Volume swell', 'Volumenquellung', 'Volumezwelling', 'Hacimsel şişme'],
    ['Min. temperature', 'Min. Temperatur', 'Min. temperatuur', 'Min. sıcaklık'],
    ['Max. temperature', 'Max. Temperatur', 'Max. temperatuur', 'Maks. sıcaklık'],
    ["Volume swell from the fluid (from the compound's fluid-resistance data). Thermal expansion of the O-ring is added at the maximum temperature.",
      'Volumenquellung durch das Medium (aus den Beständigkeitsdaten der Mischung). Die Wärmeausdehnung des O-Rings wird bei der Höchsttemperatur addiert.',
      'Volumezwelling door het medium (uit de bestendigheidsgegevens van de compound). De thermische uitzetting van de O-ring wordt bij de maximumtemperatuur meegenomen.',
      'Akışkandan kaynaklanan hacimsel şişme (karışımın dayanım verilerinden). O-ringin ısıl genleşmesi maksimum sıcaklıkta eklenir.'],
    ['{m}: typically {lo} … {hi}. Good for: {good}. Avoid: {bad}.', '{m}: typisch {lo} … {hi}. Geeignet für: {good}. Vermeiden: {bad}.', '{m}: typisch {lo} … {hi}. Geschikt voor: {good}. Vermijden: {bad}.', '{m}: tipik {lo} … {hi}. Uygun: {good}. Kaçının: {bad}.'],

    // ----- Results -----
    ['Compression (nominal)', 'Verpressung (nominal)', 'Samendrukking (nominaal)', 'Sıkıştırma (nominal)'],
    ['Worst case {min} … {max} · guideline {lo}–{hi} %', 'Grenzfall {min} … {max} · Richtwert {lo}–{hi} %', 'Ongunstigst {min} … {max} · richtlijn {lo}–{hi} %', 'En kötü durum {min} … {max} · kılavuz %{lo}–{hi}'],
    ['Gland fill', 'Nutfüllung', 'Groefvulling', 'Kanal doluluğu'],
    ['ID stretch', 'Dehnung d1', 'Rek ID', 'ID gerilmesi'],
    ['Seat fit', 'Sitz', 'Passing', 'Oturma'],
    ['Radial clearance', 'Radialspiel', 'Radiale speling', 'Radyal boşluk'],
    ['Check inputs', 'Eingaben prüfen', 'Invoer controleren', 'Girdileri kontrol edin'],
    ['OK', 'OK', 'OK', 'UYGUN'],
    ['Check', 'Prüfen', 'Controleren', 'Kontrol'],
    ['Problem', 'Problem', 'Probleem', 'Sorun'],
    ['stretched {v}', 'gedehnt {v}', 'gerekt {v}', 'gerilmiş {v}'],
    ['compressed {v}', 'gestaucht {v}', 'gestuikt {v}', 'sıkışmış {v}'],
    ['loose {v}', 'lose {v}', 'los {v}', 'gevşek {v}'],
    ['Error', 'Fehler', 'Fout', 'Hata'],
    ['Warning', 'Warnung', 'Waarschuwing', 'Uyarı'],
    ['Note', 'Hinweis', 'Opmerking', 'Not'],
    ['Gland cross-section', 'Einbauraum im Schnitt', 'Doorsnede inbouwruimte', 'Yuva kesiti'],
    ['free O-ring', 'O-Ring frei', 'vrije O-ring', 'serbest O-ring'],
    ['pressure', 'Druck', 'druk', 'basınç'],
    ['Piston', 'Kolben', 'Zuiger', 'Piston'],
    ['Bore', 'Bohrung', 'Boring', 'Delik'],
    ['Housing', 'Gehäuse', 'Huis', 'Gövde'],
    ['Rod', 'Stange', 'Stang', 'Mil'],
    ['Flange', 'Flansch', 'Flens', 'Flanş'],
    ['Cover', 'Deckel', 'Deksel', 'Kapak'],
    ['axis ↓', 'Achse ↓', 'as ↓', 'eksen ↓'],
    ['axis ↑', 'Achse ↑', 'as ↑', 'eksen ↑'],
    ['groove', 'Nut', 'groef', 'kanal'],
    ['bore', 'Bohrung', 'boring', 'delik'],
    ['Results', 'Ergebnisse', 'Resultaten', 'Sonuçlar'],
    ['Compression min. / max.', 'Verpressung min. / max.', 'Samendrukking min. / max.', 'Sıkıştırma min. / maks.'],
    ['guideline {lo}–{hi} %', 'Richtwert {lo}–{hi} %', 'richtlijn {lo}–{hi} %', 'kılavuz %{lo}–{hi}'],
    ['Squeeze (nominal)', 'Verpressung absolut (nominal)', 'Indrukking (nominaal)', 'Ezilme (nominal)'],
    ['min. {v}', 'min. {v}', 'min. {v}', 'min. {v}'],
    ['max. {v}', 'max. {v}', 'max. {v}', 'maks. {v}'],
    ['Compression at T min / T max', 'Verpressung bei T min / T max', 'Samendrukking bij T min / T max', 'T min / T maks sıkıştırma'],
    ['worst case, incl. swell', 'Grenzfall, inkl. Quellung', 'ongunstigst, incl. zwelling', 'en kötü durum, şişme dahil'],
    ['Gland fill nominal', 'Nutfüllung nominal', 'Groefvulling nominaal', 'Kanal doluluğu nominal'],
    ['recommended 60–85 %, optimum 75 %', 'empfohlen 60–85 %, optimal 75 %', 'aanbevolen 60–85 %, optimaal 75 %', 'önerilen %60–85, ideal %75'],
    ['Gland fill worst case / hot', 'Nutfüllung Grenzfall / warm', 'Groefvulling ongunstigst / warm', 'Kanal doluluğu en kötü / sıcak'],
    ['at T max with swell', 'bei T max mit Quellung', 'bij T max met zwelling', 'T maks ve şişme ile'],
    ['Gland depth L', 'Einbautiefe L', 'Inbouwdiepte L', 'Yuva derinliği L'],
    ['Groove width G', 'Nutbreite G', 'Groefbreedte G', 'Kanal genişliği G'],
    ['Effective cross-section', 'Wirksame Schnurstärke', 'Effectieve koorddikte', 'Etkin kesit'],
    ['after stretch (Parker fig. 3-3)', 'nach Dehnung (Parker Abb. 3-3)', 'na rek (Parker fig. 3-3)', 'gerilme sonrası (Parker şekil 3-3)'],
    ['Seat fit on primary wall', 'Sitz an der Hauptwand', 'Passing op de primaire wand', 'Ana duvara oturma'],
    ['ring ID vs. groove inner wall', 'Ring-ID zu innerer Nutwand', 'ring-ID t.o.v. groefbinnenwand', 'halka ID / kanal iç duvarı'],
    ['ring OD vs. groove outer wall', 'Ring-AD zu äußerer Nutwand', 'ring-OD t.o.v. groefbuitenwand', 'halka OD / kanal dış duvarı'],
    ['Groove inner outline', 'Innere Nutkontur', 'Binnencontour groef', 'Kanal iç konturu'],
    ['Centreline corner radius', 'Eckenradius Mittellinie', 'Hoekradius hartlijn', 'Merkez hattı köşe yarıçapı'],
    ['Groove inner Ø', 'Nut-Innen-Ø', 'Groef binnen-Ø', 'Kanal iç Ø'],
    ['outer Ø {v}', 'Außen-Ø {v}', 'buiten-Ø {v}', 'dış Ø {v}'],
    ['Groove perimeter (centreline)', 'Nutumfang (Mittellinie)', 'Groefomtrek (hartlijn)', 'Kanal çevresi (merkez hattı)'],
    ['O-ring centreline {v}', 'O-Ring-Mittellinie {v}', 'O-ring-hartlijn {v}', 'O-ring merkez hattı {v}'],
    ['Circumferential compression', 'Umfangsstauchung', 'Omtreksstuiking', 'Çevresel sıkışma'],
    ['Groove depth (radial)', 'Nuttiefe (radial)', 'Groefdiepte (radiaal)', 'Kanal derinliği (radyal)'],
    ['gland depth minus radial clearance', 'Einbautiefe minus Radialspiel', 'inbouwdiepte min radiale speling', 'yuva derinliği eksi radyal boşluk'],
    ['on the piston', 'am Kolben', 'op de zuiger', 'piston üzerinde'],
    ['in the housing', 'im Gehäuse', 'in het huis', 'gövdede'],
    ['O-ring OD', 'O-Ring-Außen-Ø', 'O-ring buiten-Ø', 'O-ring dış çapı'],
    ['O-ring / gland volume', 'Volumen O-Ring / Nut', 'Volume O-ring / groef', 'O-ring / yuva hacmi'],
    ['gland {v}', 'Nut {v}', 'groef {v}', 'yuva {v}'],

    // ----- Recommended groove & libraries -----
    ['Recommended groove for this O-ring', 'Empfohlene Nut für diesen O-Ring', 'Aanbevolen groef voor deze O-ring', 'Bu O-ring için önerilen kanal'],
    ['interpolated', 'interpoliert', 'geïnterpoleerd', 'enterpolasyonlu'],
    ['liquids', 'Flüssigkeiten', 'vloeistoffen', 'sıvılar'],
    ['gas / vacuum', 'Gas / Vakuum', 'gas / vacuüm', 'gaz / vakum'],
    ['{n} back-up', '{n} Stützring(e)', '{n} steunring(en)', '{n} destek halkası'],
    ['Compression', 'Verpressung', 'Samendrukking', 'Sıkıştırma'],
    ['Diametral clearance (max.)', 'Durchmesserspiel (max.)', 'Diametrale speling (max.)', 'Çapsal boşluk (maks.)'],
    ['Groove Ø (for this bore)', 'Nut-Ø (für diese Bohrung)', 'Groef-Ø (voor deze boring)', 'Kanal Ø (bu delik için)'],
    ['Groove Ø (for this rod)', 'Nut-Ø (für diese Stange)', 'Groef-Ø (voor deze stang)', 'Kanal Ø (bu mil için)'],
    ['Groove depth (with flange gap {v})', 'Nuttiefe (mit Flanschspalt {v})', 'Groefdiepte (met flensspleet {v})', 'Kanal derinliği (flanş boşluğu {v} ile)'],
    ['Parameter', 'Parameter', 'Parameter', 'Parametre'],
    ['Guideline', 'Richtwert', 'Richtlijn', 'Kılavuz'],
    ['Your design', 'Ihr Entwurf', 'Uw ontwerp', 'Tasarımınız'],
    ['Clearance halved for silicone / fluorosilicone.', 'Spiel für Silikon / Fluorsilikon halbiert.', 'Speling gehalveerd voor siliconen / fluorsiliconen.', 'Silikon / florosilikon için boşluk yarıya indirildi.'],
    ['Groove guideline library', 'Bibliothek der Nut-Richtwerte', 'Bibliotheek groefrichtlijnen', 'Kanal kılavuz kütüphanesi'],
    ['Parker ORD 5700 (inch tables)', 'Parker ORD 5700 (Zoll-Tabellen)', 'Parker ORD 5700 (inchtabellen)', 'Parker ORD 5700 (inç tabloları)'],
    ['ERIKS (metric tables)', 'ERIKS (metrische Tabellen)', 'ERIKS (metrische tabellen)', 'ERIKS (metrik tablolar)'],
    ['Static radial (piston / rod)', 'Statisch radial (Kolben / Stange)', 'Statisch radiaal (zuiger / stang)', 'Statik radyal (piston / mil)'],
    ['Face seal (axial)', 'Flanschdichtung (axial)', 'Vlakafdichting (axiaal)', 'Yüzey sızdırmazlığı (eksenel)'],
    ['Dynamic reciprocating (piston / rod)', 'Dynamisch hin- und hergehend (Kolben / Stange)', 'Dynamisch heen-en-weer (zuiger / stang)', 'Dinamik doğrusal hareket (piston / mil)'],
    ['{kind} · values in {unit}. The highlighted row matches the selected O-ring cross-section.', '{kind} · Werte in {unit}. Die markierte Zeile entspricht der gewählten Schnurstärke.', '{kind} · waarden in {unit}. De gemarkeerde rij hoort bij de gekozen koorddikte.', '{kind} · değerler {unit} cinsinden. Vurgulanan satır seçilen O-ring kesitine karşılık gelir.'],
    ['Cross-section', 'Schnurstärke', 'Koorddikte', 'Kesit'],
    ['Width (liquids)', 'Breite (Flüssigkeiten)', 'Breedte (vloeistoffen)', 'Genişlik (sıvılar)'],
    ['Width (gas / vacuum)', 'Breite (Gas / Vakuum)', 'Breedte (gas / vacuüm)', 'Genişlik (gaz / vakum)'],
    ['Bottom radius', 'Grundradius', 'Bodemradius', 'Taban yarıçapı'],
    ['Width, no back-up', 'Breite, ohne Stützring', 'Breedte, zonder steunring', 'Genişlik, destek halkasız'],
    ['Width, 1 back-up', 'Breite, 1 Stützring', 'Breedte, 1 steunring', 'Genişlik, 1 destek halkası'],
    ['Width, 2 back-ups', 'Breite, 2 Stützringe', 'Breedte, 2 steunringen', 'Genişlik, 2 destek halkası'],
    ['Max. eccentricity', 'Max. Exzentrizität', 'Max. excentriciteit', 'Maks. eksen kaçıklığı'],
    ['Back-up thickness', 'Stützringdicke', 'Dikte steunring', 'Destek halkası kalınlığı'],
    ['Groove width with standard spiral PTFE back-up rings (ERIKS Table 3.D-2):', 'Nutbreite mit Standard-Spiral-Stützringen aus PTFE (ERIKS Tabelle 3.D-2):', 'Groefbreedte met standaard spiraalvormige PTFE-steunringen (ERIKS tabel 3.D-2):', 'Standart spiral PTFE destek halkalarıyla kanal genişliği (ERIKS Tablo 3.D-2):'],
    ['O-ring size library', 'O-Ring-Größenbibliothek', 'Bibliotheek O-ringmaten', 'O-ring ölçü kütüphanesi'],
    ['Search ID, CS or dash no.', 'Suche d1, d2 oder Dash-Nr.', 'Zoek ID, CS of dash-nr.', 'ID, CS veya dash no. ara'],
    ['Search sizes', 'Größen suchen', 'Maten zoeken', 'Ölçü ara'],
    ['Click a row to use that O-ring.', 'Zeile anklicken, um diesen O-Ring zu verwenden.', 'Klik op een rij om die O-ring te gebruiken.', 'O-ringi kullanmak için bir satıra tıklayın.'],
    ['Material library', 'Werkstoffbibliothek', 'Materiaalbibliotheek', 'Malzeme kütüphanesi'],
    ['Typical values for general-purpose compounds. Always check the data sheet of the actual compound and its fluid compatibility.',
      'Typische Werte für Standardmischungen. Immer das Datenblatt der tatsächlichen Mischung und die Medienbeständigkeit prüfen.',
      'Typische waarden voor standaardcompounds. Controleer altijd het gegevensblad van de werkelijke compound en de bestendigheid tegen het medium.',
      'Genel amaçlı karışımlar için tipik değerler. Her zaman gerçek karışımın veri sayfasını ve akışkan uyumluluğunu kontrol edin.'],
    ['Temperature range', 'Temperaturbereich', 'Temperatuurbereik', 'Sıcaklık aralığı'],
    ['Good for', 'Geeignet für', 'Geschikt voor', 'Uygun'],
    ['Avoid', 'Vermeiden', 'Vermijden', 'Kaçının'],
    ['Method, assumptions & sources', 'Methode, Annahmen & Quellen', 'Methode, aannames & bronnen', 'Yöntem, varsayımlar ve kaynaklar'],

    // ----- Toasts -----
    ['Groove set to the guideline values', 'Nut auf Richtwerte gesetzt', 'Groef op richtlijnwaarden gezet', 'Kanal kılavuz değerlerine ayarlandı'],
    ['No suitable standard O-ring found', 'Kein passender Norm-O-Ring gefunden', 'Geen geschikte norm-O-ring gevonden', 'Uygun standart O-ring bulunamadı'],
    ['Selected {size}', '{size} gewählt', '{size} gekozen', '{size} seçildi'],
    ['Link copied to clipboard', 'Link in die Zwischenablage kopiert', 'Link naar het klembord gekopieerd', 'Bağlantı panoya kopyalandı'],
    ['Link updated in the address bar', 'Link in der Adresszeile aktualisiert', 'Link in de adresbalk bijgewerkt', 'Bağlantı adres çubuğunda güncellendi'],

    // ----- Converter -----
    ['Quantity', 'Größe', 'Grootheid', 'Büyüklük'],
    ['Length', 'Länge', 'Lengte', 'Uzunluk'],
    ['Temperature', 'Temperatur', 'Temperatuur', 'Sıcaklık'],
    ['Force', 'Kraft', 'Kracht', 'Kuvvet'],
    ['Area', 'Fläche', 'Oppervlakte', 'Alan'],
    ['Volume', 'Volumen', 'Volume', 'Hacim'],
    ['Type in any field; the others update.', 'In ein beliebiges Feld tippen; die anderen werden aktualisiert.', 'Typ in een willekeurig veld; de andere worden bijgewerkt.', 'Herhangi bir alana yazın; diğerleri güncellenir.'],
    ['Nearest fraction: {f} in', 'Nächster Bruch: {f} in', 'Dichtstbijzijnde breuk: {f} in', 'En yakın kesir: {f} in'],

    // ----- Design checks (calc.js) -----
    ['Check the inputs: the gland depth, groove width and O-ring size must be positive.', 'Eingaben prüfen: Einbautiefe, Nutbreite und O-Ring-Größe müssen positiv sein.', 'Controleer de invoer: inbouwdiepte, groefbreedte en O-ringmaat moeten positief zijn.', 'Girdileri kontrol edin: yuva derinliği, kanal genişliği ve O-ring ölçüsü pozitif olmalıdır.'],
    ['No compression at the worst-case tolerances: the gland is deeper than the O-ring cross-section. The seal can leak.', 'Keine Verpressung im ungünstigsten Toleranzfall: der Einbauraum ist tiefer als die Schnurstärke. Die Dichtung kann lecken.', 'Geen samendrukking bij de ongunstigste toleranties: de inbouwruimte is dieper dan de koorddikte. De afdichting kan lekken.', 'En kötü toleranslarda sıkıştırma yok: yuva O-ring kesitinden derin. Sızıntı olabilir.'],
    ['Minimum compression {v} % is far below the recommended {lo}–{hi} %.', 'Minimale Verpressung {v} % liegt weit unter den empfohlenen {lo}–{hi} %.', 'Minimale samendrukking {v} % ligt ver onder de aanbevolen {lo}–{hi} %.', 'Minimum sıkıştırma %{v}, önerilen %{lo}–{hi} aralığının çok altında.'],
    ['Minimum compression {v} % is below the recommended {lo}–{hi} %.', 'Minimale Verpressung {v} % liegt unter den empfohlenen {lo}–{hi} %.', 'Minimale samendrukking {v} % ligt onder de aanbevolen {lo}–{hi} %.', 'Minimum sıkıştırma %{v}, önerilen %{lo}–{hi} aralığının altında.'],
    ['Maximum compression {v} % is too high (recommended {lo}–{hi} %): high installation force, compression set and risk of damage.', 'Maximale Verpressung {v} % ist zu hoch (empfohlen {lo}–{hi} %): hohe Montagekraft, Druckverformungsrest und Beschädigungsgefahr.', 'Maximale samendrukking {v} % is te hoog (aanbevolen {lo}–{hi} %): hoge montagekracht, blijvende vervorming en kans op beschadiging.', 'Maksimum sıkıştırma %{v} çok yüksek (önerilen %{lo}–{hi}): yüksek montaj kuvveti, kalıcı deformasyon ve hasar riski.'],
    ['Maximum compression {v} % is above the recommended {lo}–{hi} %.', 'Maximale Verpressung {v} % liegt über den empfohlenen {lo}–{hi} %.', 'Maximale samendrukking {v} % ligt boven de aanbevolen {lo}–{hi} %.', 'Maksimum sıkıştırma %{v}, önerilen %{lo}–{hi} aralığının üstünde.'],
    ['Minimum squeeze is only {v} mm. Keep at least about 0.2 mm (0.007 in), otherwise most elastomers take full compression set.', 'Minimale Verpressung beträgt nur {v} mm. Mindestens etwa 0,2 mm (0,007 in) vorsehen, sonst nehmen die meisten Elastomere vollen Druckverformungsrest an.', 'Minimale indrukking is slechts {v} mm. Houd minstens ca. 0,2 mm (0,007 in) aan, anders krijgen de meeste elastomeren volledige blijvende vervorming.', 'Minimum ezilme yalnızca {v} mm. En az yaklaşık 0,2 mm (0,007 in) bırakın; aksi halde çoğu elastomer tam kalıcı deformasyona uğrar.'],
    ['At the minimum temperature the O-ring shrinks: worst-case compression drops to {v} %.', 'Bei Mindesttemperatur schrumpft der O-Ring: die Verpressung im Grenzfall sinkt auf {v} %.', 'Bij de minimumtemperatuur krimpt de O-ring: de ongunstigste samendrukking daalt tot {v} %.', 'Minimum sıcaklıkta O-ring büzülür: en kötü durum sıkıştırması %{v} değerine düşer.'],
    ['At the maximum temperature (with volume swell) worst-case compression rises to {v} %.', 'Bei Höchsttemperatur (mit Quellung) steigt die Verpressung im Grenzfall auf {v} %.', 'Bij de maximumtemperatuur (met zwelling) stijgt de ongunstigste samendrukking tot {v} %.', 'Maksimum sıcaklıkta (şişme ile) en kötü durum sıkıştırması %{v} değerine çıkar.'],
    ['The O-ring does not fit: worst-case gland fill is {v} %. Make the groove wider or deeper.', 'Der O-Ring passt nicht: Nutfüllung im Grenzfall {v} %. Nut breiter oder tiefer ausführen.', 'De O-ring past niet: ongunstigste groefvulling is {v} %. Maak de groef breder of dieper.', 'O-ring sığmıyor: en kötü durum kanal doluluğu %{v}. Kanalı genişletin veya derinleştirin.'],
    ['Worst-case gland fill {v} % leaves almost no void. Allow room for swell and thermal expansion.', 'Nutfüllung im Grenzfall {v} % lässt kaum Freiraum. Platz für Quellung und Wärmeausdehnung vorsehen.', 'Ongunstigste groefvulling {v} % laat bijna geen vrije ruimte. Houd ruimte voor zwelling en thermische uitzetting.', 'En kötü durum kanal doluluğu %{v} neredeyse hiç boşluk bırakmıyor. Şişme ve ısıl genleşme için yer bırakın.'],
    ['Nominal gland fill {v} % is above the recommended 85 % (optimum 75 %).', 'Nominale Nutfüllung {v} % liegt über den empfohlenen 85 % (optimal 75 %).', 'Nominale groefvulling {v} % ligt boven de aanbevolen 85 % (optimaal 75 %).', 'Nominal kanal doluluğu %{v}, önerilen %85 değerinin üstünde (ideal %75).'],
    ['At {t} with {sw} % volume swell the O-ring overfills the gland ({v} %).', 'Bei {t} und {sw} % Volumenquellung überfüllt der O-Ring die Nut ({v} %).', 'Bij {t} en {sw} % volumezwelling vult de O-ring de groef te veel ({v} %).', '{t} ve %{sw} hacimsel şişmede O-ring kanalı taşırıyor (%{v}).'],
    ['At {t} with {sw} % volume swell the gland fill reaches {v} %.', 'Bei {t} und {sw} % Volumenquellung erreicht die Nutfüllung {v} %.', 'Bij {t} en {sw} % volumezwelling bereikt de groefvulling {v} %.', '{t} ve %{sw} hacimsel şişmede kanal doluluğu %{v} olur.'],
    ['Gland fill {v} % is low (typical 60–85 %, optimum 75 %). The O-ring can move and roll in the groove; check if a narrower groove is possible.', 'Nutfüllung {v} % ist gering (typisch 60–85 %, optimal 75 %). Der O-Ring kann sich in der Nut bewegen und verdrehen; eine schmalere Nut prüfen.', 'Groefvulling {v} % is laag (typisch 60–85 %, optimaal 75 %). De O-ring kan in de groef bewegen en rollen; controleer of een smallere groef mogelijk is.', 'Kanal doluluğu %{v} düşük (tipik %60–85, ideal %75). O-ring kanalda hareket edip yuvarlanabilir; daha dar bir kanal olup olmadığını kontrol edin.'],
    ['Groove width is smaller than the O-ring cross-section: the ring is squeezed sideways during installation.', 'Die Nutbreite ist kleiner als die Schnurstärke: der Ring wird bei der Montage seitlich gequetscht.', 'De groefbreedte is kleiner dan de koorddikte: de ring wordt bij montage zijdelings samengedrukt.', 'Kanal genişliği O-ring kesitinden küçük: halka montajda yanlardan sıkışır.'],
    ['O-ring ID is {v} % larger than the groove inner wall. With external pressure the ID should seat on the inner wall (choose a smaller O-ring).', 'Der O-Ring-Innendurchmesser ist {v} % größer als die innere Nutwand. Bei Druck von außen soll er an der Innenwand anliegen (kleineren O-Ring wählen).', 'De binnendiameter van de O-ring is {v} % groter dan de binnenwand van de groef. Bij druk van buiten moet hij tegen de binnenwand liggen (kies een kleinere O-ring).', 'O-ring iç çapı kanal iç duvarından %{v} büyük. Dış basınçta iç çap iç duvara oturmalıdır (daha küçük bir O-ring seçin).'],
    ['Installed stretch up to {v} % exceeds 5 %: faster ageing and loss of cross-section.', 'Einbaudehnung bis {v} % überschreitet 5 %: schnellere Alterung und Verlust an Schnurstärke.', 'Inbouwrek tot {v} % is meer dan 5 %: snellere veroudering en verlies van koorddikte.', '%{v} değerine kadar montaj gerilmesi %5 sınırını aşıyor: hızlı yaşlanma ve kesit kaybı.'],
    ['Installed stretch up to {v} %. For face seals keep the initial stretch below 3 %.', 'Einbaudehnung bis {v} %. Bei Flanschdichtungen die Anfangsdehnung unter 3 % halten.', 'Inbouwrek tot {v} %. Houd bij vlakafdichtingen de beginrek onder 3 %.', '%{v} değerine kadar montaj gerilmesi. Yüzey sızdırmazlığında başlangıç gerilmesini %3 altında tutun.'],
    ['The O-ring OD is smaller than the groove outer wall: it has to be stretched by up to {v} % to seat there. With internal pressure the OD should seat on the outer wall.', 'Der O-Ring-Außendurchmesser ist kleiner als die äußere Nutwand: er muss um bis zu {v} % gedehnt werden, um dort anzuliegen. Bei Druck von innen soll der Außendurchmesser an der Außenwand anliegen.', 'De buitendiameter van de O-ring is kleiner dan de buitenwand van de groef: hij moet tot {v} % gerekt worden om daar te liggen. Bij druk van binnen moet de buitendiameter tegen de buitenwand liggen.', 'O-ring dış çapı kanal dış duvarından küçük: oraya oturması için %{v} değerine kadar gerilmesi gerekir. İç basınçta dış çap dış duvara oturmalıdır.'],
    ['The O-ring OD is {v} % larger than the groove outer wall: risk of buckling or lifting out of the groove during assembly.', 'Der O-Ring-Außendurchmesser ist {v} % größer als die äußere Nutwand: Gefahr von Ausknicken oder Herausheben bei der Montage.', 'De buitendiameter van de O-ring is {v} % groter dan de buitenwand van de groef: kans op knikken of uit de groef komen bij montage.', 'O-ring dış çapı kanal dış duvarından %{v} büyük: montaj sırasında bükülme veya kanaldan çıkma riski.'],
    ['Installed stretch up to {v} % exceeds 5 % (Parker): faster ageing, the cross-section flattens. Consider the next larger O-ring ID.', 'Einbaudehnung bis {v} % überschreitet 5 % (Parker): schnellere Alterung, die Schnurstärke flacht ab. Nächstgrößeren Innendurchmesser erwägen.', 'Inbouwrek tot {v} % is meer dan 5 % (Parker): snellere veroudering, de koorddikte wordt platter. Overweeg de volgende grotere binnendiameter.', '%{v} değerine kadar montaj gerilmesi %5 sınırını aşıyor (Parker): hızlı yaşlanma, kesit yassılaşır. Bir büyük iç çapı düşünün.'],
    ['The O-ring ID is larger than the groove diameter (stretch {v} %): the ring sits loose and can be pinched when the piston enters the bore.', 'Der O-Ring-Innendurchmesser ist größer als der Nutdurchmesser (Dehnung {v} %): der Ring sitzt lose und kann beim Einführen des Kolbens gequetscht werden.', 'De binnendiameter van de O-ring is groter dan de groefdiameter (rek {v} %): de ring zit los en kan bekneld raken als de zuiger de boring in gaat.', 'O-ring iç çapı kanal çapından büyük (gerilme %{v}): halka gevşek oturur ve piston deliğe girerken sıkışabilir.'],
    ['The O-ring is stretched up to {v} % on the rod. Choose a larger ID.', 'Der O-Ring wird auf der Stange um bis zu {v} % gedehnt. Größeren Innendurchmesser wählen.', 'De O-ring wordt op de stang tot {v} % gerekt. Kies een grotere binnendiameter.', 'O-ring mil üzerinde %{v} değerine kadar geriliyor. Daha büyük bir iç çap seçin.'],
    ['The O-ring centreline is up to {v} % longer than the gland circumference: circumferential compression can cause buckling. Choose a smaller ID.', 'Der O-Ring ist am Umfang bis zu {v} % zu lang für die Nut: Umfangsstauchung kann zum Ausknicken führen. Kleineren Innendurchmesser wählen.', 'De O-ring is tot {v} % te lang voor de groefomtrek: omtreksstuiking kan knikken veroorzaken. Kies een kleinere binnendiameter.', 'O-ring çevresi kanal için %{v} değerine kadar fazla: çevresel sıkışma bükülmeye yol açabilir. Daha küçük bir iç çap seçin.'],
    ['Corner radius at the groove centreline is {v}; at least {min} (3 × cross-section) is recommended so the O-ring does not kink or lift in the corners.', 'Eckenradius an der Nut-Mittellinie beträgt {v}; mindestens {min} (3 × Schnurstärke) wird empfohlen, damit der O-Ring in den Ecken nicht knickt oder abhebt.', 'De hoekradius op de hartlijn van de groef is {v}; minstens {min} (3 × koorddikte) wordt aanbevolen zodat de O-ring in de hoeken niet knikt of oplicht.', 'Kanal merkez hattındaki köşe yarıçapı {v}; O-ringin köşelerde bükülmemesi veya kalkmaması için en az {min} (3 × kesit) önerilir.'],
    ['Diametral clearance up to {v} exceeds the guideline maximum {max} for this cross-section{sil}. Extrusion risk.', 'Durchmesserspiel bis {v} überschreitet den Richtwert von max. {max} für diese Schnurstärke{sil}. Extrusionsgefahr.', 'Diametrale speling tot {v} overschrijdt het richtlijnmaximum {max} voor deze koorddikte{sil}. Kans op extrusie.', '{v} değerine kadar çapsal boşluk bu kesit için kılavuz maksimumu {max} değerini aşıyor{sil}. Ekstrüzyon riski.'],
    [' (halved for silicone)', ' (für Silikon halbiert)', ' (gehalveerd voor siliconen)', ' (silikon için yarıya indirildi)'],
    ['The clearance is negative: the parts interfere.', 'Das Spiel ist negativ: die Teile überschneiden sich.', 'De speling is negatief: de delen overlappen.', 'Boşluk negatif: parçalar çakışıyor.'],
    ['Flange gap {v} is large; keep metal-to-metal contact or a very small gap to avoid extrusion.', 'Der Flanschspalt {v} ist groß; Metall-auf-Metall-Kontakt oder einen sehr kleinen Spalt vorsehen, um Extrusion zu vermeiden.', 'De flensspleet {v} is groot; houd metaal-op-metaalcontact of een zeer kleine spleet aan om extrusie te voorkomen.', 'Flanş boşluğu {v} büyük; ekstrüzyonu önlemek için metal-metal temas veya çok küçük bir boşluk bırakın.'],
    ['Pressure {p} is above {lim} without back-up rings ({mode}). Use back-up rings or a 90 Shore A compound.', 'Druck {p} liegt über {lim} ohne Stützringe ({mode}). Stützringe oder eine 90-Shore-A-Mischung verwenden.', 'Druk {p} ligt boven {lim} zonder steunringen ({mode}). Gebruik steunringen of een compound van 90 Shore A.', 'Basınç {p}, destek halkası olmadan {lim} değerinin üstünde ({mode}). Destek halkası veya 90 Shore A karışım kullanın.'],
    ['static', 'statisch', 'statisch', 'statik'],
    ['dynamic', 'dynamisch', 'dynamisch', 'dinamik'],
    ['Pressure above 70 bar (1000 psi): ERIKS recommends back-up rings for static seals at this level.', 'Druck über 70 bar (1000 psi): ERIKS empfiehlt in diesem Bereich Stützringe für statische Dichtungen.', 'Druk boven 70 bar (1000 psi): ERIKS adviseert bij dit niveau steunringen voor statische afdichtingen.', '70 bar (1000 psi) üzerinde basınç: ERIKS bu seviyede statik sızdırmazlık için destek halkası önerir.'],
    ['With a 70 Shore A compound above about 80 bar, 90 Shore A or back-up rings reduce the extrusion risk.', 'Mit einer 70-Shore-A-Mischung über etwa 80 bar verringern 90 Shore A oder Stützringe die Extrusionsgefahr.', 'Met een compound van 70 Shore A boven ca. 80 bar verminderen 90 Shore A of steunringen de kans op extrusie.', '70 Shore A karışımla yaklaşık 80 bar üzerinde, 90 Shore A veya destek halkaları ekstrüzyon riskini azaltır.'],
    ['Very high pressure for a face seal: check flange deflection (gap opening) under pressure.', 'Sehr hoher Druck für eine Flanschdichtung: Flanschverformung (Spaltöffnung) unter Druck prüfen.', 'Zeer hoge druk voor een vlakafdichting: controleer de doorbuiging van de flens (spleetopening) onder druk.', 'Yüzey sızdırmazlığı için çok yüksek basınç: basınç altında flanş sehimini (boşluk açılması) kontrol edin.'],
    ['{m} is typically rated down to {t}: minimum temperature {v} is below that.', '{m} ist typisch bis {t} einsetzbar: die Mindesttemperatur {v} liegt darunter.', '{m} is typisch bruikbaar tot {t}: de minimumtemperatuur {v} ligt daaronder.', '{m} tipik olarak {t} değerine kadar kullanılır: minimum sıcaklık {v} bunun altında.'],
    ['{m} is typically rated up to {t}: maximum temperature {v} is above that.', '{m} ist typisch bis {t} einsetzbar: die Höchsttemperatur {v} liegt darüber.', '{m} is typisch bruikbaar tot {t}: de maximumtemperatuur {v} ligt daarboven.', '{m} tipik olarak {t} değerine kadar kullanılır: maksimum sıcaklık {v} bunun üstünde.'],
    ['Silicone and fluorosilicone have low tear strength and are not recommended for dynamic seals.', 'Silikon und Fluorsilikon haben eine geringe Weiterreißfestigkeit und werden für dynamische Dichtungen nicht empfohlen.', 'Siliconen en fluorsiliconen hebben een lage scheursterkte en worden niet aanbevolen voor dynamische afdichtingen.', 'Silikon ve florosilikonun yırtılma dayanımı düşüktür; dinamik sızdırmazlık için önerilmez.'],
    ['Volume swell above 20 % causes high friction in dynamic seals (ERIKS).', 'Volumenquellung über 20 % führt bei dynamischen Dichtungen zu hoher Reibung (ERIKS).', 'Volumezwelling boven 20 % geeft hoge wrijving bij dynamische afdichtingen (ERIKS).', '%20 üzerindeki hacimsel şişme dinamik sızdırmazlıkta yüksek sürtünmeye yol açar (ERIKS).'],
    ['Shrinkage of more than 4 % can cause leakage in dynamic seals (ERIKS).', 'Schrumpfung von mehr als 4 % kann bei dynamischen Dichtungen zu Leckage führen (ERIKS).', 'Krimp van meer dan 4 % kan lekkage geven bij dynamische afdichtingen (ERIKS).', '%4 üzerindeki büzülme dinamik sızdırmazlıkta kaçağa yol açabilir (ERIKS).'],
    ['Small cross-sections are sensitive to tolerances and wear in dynamic service.', 'Kleine Schnurstärken sind im dynamischen Einsatz empfindlich gegen Toleranzen und Verschleiß.', 'Kleine koorddiktes zijn bij dynamisch gebruik gevoelig voor toleranties en slijtage.', 'Küçük kesitler dinamik kullanımda toleranslara ve aşınmaya duyarlıdır.'],
    ['Gland depth {v} is outside the guideline {lo}–{hi} for this cross-section.', 'Einbautiefe {v} liegt außerhalb des Richtwerts {lo}–{hi} für diese Schnurstärke.', 'Inbouwdiepte {v} ligt buiten de richtlijn {lo}–{hi} voor deze koorddikte.', 'Yuva derinliği {v}, bu kesit için kılavuz aralığı {lo}–{hi} dışında.'],
    ['Groove width {v} is outside the guideline {lo}–{hi}.', 'Nutbreite {v} liegt außerhalb des Richtwerts {lo}–{hi}.', 'Groefbreedte {v} ligt buiten de richtlijn {lo}–{hi}.', 'Kanal genişliği {v}, kılavuz aralığı {lo}–{hi} dışında.'],
    ['The O-ring size is far from this groove outline. Use “Suggest O-ring” to pick a standard size that fits.', 'Die O-Ring-Größe passt bei weitem nicht zu dieser Nutkontur. Mit „O-Ring vorschlagen“ eine passende Normgröße wählen.', 'De O-ringmaat past lang niet bij deze groefcontour. Gebruik „O-ring voorstellen” om een passende normmaat te kiezen.', 'O-ring ölçüsü bu kanal konturuna hiç uymuyor. Uygun bir standart ölçü seçmek için “O-ring öner” düğmesini kullanın.'],
    ['No table row for this cross-section: guideline values are interpolated.', 'Keine Tabellenzeile für diese Schnurstärke: Richtwerte sind interpoliert.', 'Geen tabelrij voor deze koorddikte: richtlijnwaarden zijn geïnterpoleerd.', 'Bu kesit için tablo satırı yok: kılavuz değerleri enterpolasyonla bulundu.'],

    // ----- Materials (data.js) -----
    ['NBR (nitrile)', 'NBR (Nitril)', 'NBR (nitril)', 'NBR (nitril)'],
    ['HNBR (hydrogenated nitrile)', 'HNBR (hydriertes Nitril)', 'HNBR (gehydrogeneerd nitril)', 'HNBR (hidrojene nitril)'],
    ['FKM (fluorocarbon, Viton™ type)', 'FKM (Fluorkautschuk, Viton™-Typ)', 'FKM (fluorrubber, Viton™-type)', 'FKM (florokarbon, Viton™ tipi)'],
    ['FFKM (perfluoroelastomer)', 'FFKM (Perfluorkautschuk)', 'FFKM (perfluorelastomeer)', 'FFKM (perfloroelastomer)'],
    ['EPDM (ethylene propylene)', 'EPDM (Ethylen-Propylen)', 'EPDM (ethyleen-propyleen)', 'EPDM (etilen propilen)'],
    ['VMQ (silicone)', 'VMQ (Silikon)', 'VMQ (siliconen)', 'VMQ (silikon)'],
    ['FVMQ (fluorosilicone)', 'FVMQ (Fluorsilikon)', 'FVMQ (fluorsiliconen)', 'FVMQ (florosilikon)'],
    ['CR (chloroprene, Neoprene™ type)', 'CR (Chloropren, Neopren™-Typ)', 'CR (chloropreen, Neopreen™-type)', 'CR (kloropren, Neopren™ tipi)'],
    ['ACM (polyacrylate)', 'ACM (Polyacrylat)', 'ACM (polyacrylaat)', 'ACM (poliakrilat)'],
    ['AU/EU (polyurethane)', 'AU/EU (Polyurethan)', 'AU/EU (polyurethaan)', 'AU/EU (poliüretan)'],
    ['FEPM (TFE/P, Aflas™ type)', 'FEPM (TFE/P, Aflas™-Typ)', 'FEPM (TFE/P, Aflas™-type)', 'FEPM (TFE/P, Aflas™ tipi)'],
    ['IIR (butyl)', 'IIR (Butyl)', 'IIR (butyl)', 'IIR (bütil)'],
    ['Mineral oils & greases, hydraulic oil (HL/HLP), fuels, water up to 80 °C', 'Mineralöle & -fette, Hydrauliköl (HL/HLP), Kraftstoffe, Wasser bis 80 °C', 'Minerale oliën & vetten, hydraulische olie (HL/HLP), brandstoffen, water tot 80 °C', 'Mineral yağlar ve gresler, hidrolik yağ (HL/HLP), yakıtlar, 80 °C\'ye kadar su'],
    ['Ozone/weathering, brake fluid (glycol), ketones, strong acids', 'Ozon/Witterung, Bremsflüssigkeit (Glykol), Ketone, starke Säuren', 'Ozon/weersinvloeden, remvloeistof (glycol), ketonen, sterke zuren', 'Ozon/hava koşulları, fren hidroliği (glikol), ketonlar, kuvvetli asitler'],
    ['Oils, fuels, hot water & steam (limited), ozone', 'Öle, Kraftstoffe, Heißwasser & Dampf (begrenzt), Ozon', 'Oliën, brandstoffen, heet water & stoom (beperkt), ozon', 'Yağlar, yakıtlar, sıcak su ve buhar (sınırlı), ozon'],
    ['Aromatics, ketones, esters, strong acids', 'Aromaten, Ketone, Ester, starke Säuren', 'Aromaten, ketonen, esters, sterke zuren', 'Aromatikler, ketonlar, esterler, kuvvetli asitler'],
    ['Oils, fuels, aromatics, many acids & solvents, ozone, high temperature', 'Öle, Kraftstoffe, Aromaten, viele Säuren & Lösemittel, Ozon, hohe Temperatur', 'Oliën, brandstoffen, aromaten, veel zuren & oplosmiddelen, ozon, hoge temperatuur', 'Yağlar, yakıtlar, aromatikler, birçok asit ve çözücü, ozon, yüksek sıcaklık'],
    ['Ketones, esters, amines, hot water/steam, Skydrol', 'Ketone, Ester, Amine, Heißwasser/Dampf, Skydrol', 'Ketonen, esters, aminen, heet water/stoom, Skydrol', 'Ketonlar, esterler, aminler, sıcak su/buhar, Skydrol'],
    ['Almost all chemicals and solvents, very high temperature', 'Nahezu alle Chemikalien und Lösemittel, sehr hohe Temperatur', 'Vrijwel alle chemicaliën en oplosmiddelen, zeer hoge temperatuur', 'Neredeyse tüm kimyasallar ve çözücüler, çok yüksek sıcaklık'],
    ['Molten alkali metals, some fluorinated fluids; high cost', 'Alkalimetallschmelzen, einige fluorierte Medien; hohe Kosten', 'Gesmolten alkalimetalen, sommige gefluoreerde media; hoge kosten', 'Erimiş alkali metaller, bazı florlu akışkanlar; yüksek maliyet'],
    ['Water, steam, glycol coolants, brake fluid, ketones, ozone/weather', 'Wasser, Dampf, Glykol-Kühlmittel, Bremsflüssigkeit, Ketone, Ozon/Witterung', 'Water, stoom, glycolkoelmiddelen, remvloeistof, ketonen, ozon/weer', 'Su, buhar, glikollü soğutucular, fren hidroliği, ketonlar, ozon/hava koşulları'],
    ['Mineral oils, greases and fuels', 'Mineralöle, -fette und Kraftstoffe', 'Minerale oliën, vetten en brandstoffen', 'Mineral yağlar, gresler ve yakıtlar'],
    ['Dry heat, air, ozone, food & medical grades, very low temperature', 'Trockene Hitze, Luft, Ozon, Lebensmittel- & Medizinqualitäten, sehr tiefe Temperatur', 'Droge hitte, lucht, ozon, levensmiddelen- & medische kwaliteiten, zeer lage temperatuur', 'Kuru ısı, hava, ozon, gıda ve tıbbi sınıflar, çok düşük sıcaklık'],
    ['Dynamic use (low tear strength), fuels, steam, concentrated acids', 'Dynamischer Einsatz (geringe Weiterreißfestigkeit), Kraftstoffe, Dampf, konzentrierte Säuren', 'Dynamisch gebruik (lage scheursterkte), brandstoffen, stoom, geconcentreerde zuren', 'Dinamik kullanım (düşük yırtılma dayanımı), yakıtlar, buhar, derişik asitler'],
    ['Fuels and oils at very low temperature, ozone', 'Kraftstoffe und Öle bei sehr tiefer Temperatur, Ozon', 'Brandstoffen en oliën bij zeer lage temperatuur, ozon', 'Çok düşük sıcaklıkta yakıtlar ve yağlar, ozon'],
    ['Dynamic use, ketones, brake fluid', 'Dynamischer Einsatz, Ketone, Bremsflüssigkeit', 'Dynamisch gebruik, ketonen, remvloeistof', 'Dinamik kullanım, ketonlar, fren hidroliği'],
    ['Refrigerants, ozone/weather, mild chemicals, silicate greases', 'Kältemittel, Ozon/Witterung, milde Chemikalien, Silikatfette', 'Koudemiddelen, ozon/weer, milde chemicaliën, silicaatvetten', 'Soğutucu akışkanlar, ozon/hava koşulları, hafif kimyasallar, silikat gresler'],
    ['Aromatics, fuels, ketones, strong acids', 'Aromaten, Kraftstoffe, Ketone, starke Säuren', 'Aromaten, brandstoffen, ketonen, sterke zuren', 'Aromatikler, yakıtlar, ketonlar, kuvvetli asitler'],
    ['Hot engine and transmission oils (incl. sulphur additives), ozone', 'Heiße Motor- und Getriebeöle (inkl. Schwefeladditive), Ozon', 'Hete motor- en transmissieoliën (incl. zwaveladditieven), ozon', 'Sıcak motor ve şanzıman yağları (kükürt katkılı dahil), ozon'],
    ['Water, steam, glycols, low temperature', 'Wasser, Dampf, Glykole, tiefe Temperatur', 'Water, stoom, glycolen, lage temperatuur', 'Su, buhar, glikoller, düşük sıcaklık'],
    ['Mineral hydraulic oil; very high wear and extrusion resistance', 'Mineralisches Hydrauliköl; sehr hohe Verschleiß- und Extrusionsbeständigkeit', 'Minerale hydraulische olie; zeer hoge slijtage- en extrusiebestendigheid', 'Mineral hidrolik yağ; çok yüksek aşınma ve ekstrüzyon direnci'],
    ['Hot water/steam (hydrolysis), acids, ketones', 'Heißwasser/Dampf (Hydrolyse), Säuren, Ketone', 'Heet water/stoom (hydrolyse), zuren, ketonen', 'Sıcak su/buhar (hidroliz), asitler, ketonlar'],
    ['Steam, amines, bases, sour gas, hydraulic oils', 'Dampf, Amine, Laugen, Sauergas, Hydrauliköle', 'Stoom, aminen, logen, zuur gas, hydraulische oliën', 'Buhar, aminler, bazlar, ekşi gaz, hidrolik yağlar'],
    ['Aromatics, ketones, chlorinated solvents; poor at low temperature', 'Aromaten, Ketone, chlorierte Lösemittel; schlecht bei tiefer Temperatur', 'Aromaten, ketonen, gechloreerde oplosmiddelen; slecht bij lage temperatuur', 'Aromatikler, ketonlar, klorlu çözücüler; düşük sıcaklıkta zayıf'],
    ['Mineral oils and fuels', 'Mineralöle und Kraftstoffe', 'Minerale oliën en brandstoffen', 'Mineral yağlar ve yakıtlar'],
    ['Vacuum and low gas permeability, ketones, phosphate esters', 'Vakuum und geringe Gasdurchlässigkeit, Ketone, Phosphatester', 'Vacuüm en lage gasdoorlaatbaarheid, ketonen, fosfaatesters', 'Vakum ve düşük gaz geçirgenliği, ketonlar, fosfat esterler'],

    // ----- v1.1: dovetail, boss, presets, help -----
    ['Application example', 'Anwendungsbeispiel', 'Toepassingsvoorbeeld', 'Uygulama örneği'],
    ['Load application example…', 'Anwendungsbeispiel laden…', 'Toepassingsvoorbeeld laden…', 'Uygulama örneği yükle…'],
    ['Loaded example: {name}', 'Beispiel geladen: {name}', 'Voorbeeld geladen: {name}', 'Örnek yüklendi: {name}'],
    ['How to use this calculator', 'So verwenden Sie diesen Rechner', 'Zo gebruikt u deze calculator', 'Bu hesaplayıcı nasıl kullanılır'],
    ['Help', 'Hilfe', 'Help', 'Yardım'],
    ['Piston', 'Kolben', 'Zuiger', 'Piston'],
    ['Face', 'Flansch', 'Vlak', 'Yüzey'],
    ['Dovetail', 'Schwalbenschw.', 'Zwaluwstaart', 'Kırlangıç'],
    ['Boss port', 'Einschraub-Port', 'Inschroefpoort', 'Boss port'],
    ['Auto uses Parker\'s inch tables for AS568 cross-sections and ERIKS\' metric tables for other cross-sections.', 'Auto verwendet die Zoll-Tabellen von Parker für AS568-Schnurstärken und die metrischen Tabellen von ERIKS für andere Schnurstärken.', 'Auto gebruikt de inchtabellen van Parker voor AS568-koorddiktes en de metrische tabellen van ERIKS voor andere koorddiktes.', 'Otomatik, AS568 kesitleri için Parker inç tablolarını, diğer kesitler için ERIKS metrik tablolarını kullanır.'],
    ['Hard rings (PTFE or 90 Shore A) beside the O-ring that close the extrusion gap. Needed at high pressure; they make the groove wider.', 'Harte Ringe (PTFE oder 90 Shore A) neben dem O-Ring, die den Extrusionsspalt schließen. Bei hohem Druck nötig; die Nut wird breiter.', 'Harde ringen (PTFE of 90 Shore A) naast de O-ring die de extrusiespleet afsluiten. Nodig bij hoge druk; de groef wordt breder.', 'O-ringin yanında ekstrüzyon boşluğunu kapatan sert halkalar (PTFE veya 90 Shore A). Yüksek basınçta gerekir; kanalı genişletir.'],
    ['Side wall angle measured from the vertical. Parker uses 24° (walls at 66° to the groove bottom); ERIKS lists 23–32° depending on the cross-section.', 'Seitenwandwinkel, gemessen von der Senkrechten. Parker verwendet 24° (Wände 66° zum Nutgrund); ERIKS nennt je nach Schnurstärke 23–32°.', 'Zijwandhoek gemeten vanaf de verticaal. Parker gebruikt 24° (wanden onder 66° met de groefbodem); ERIKS noemt 23–32° afhankelijk van de koorddikte.', 'Dikeyden ölçülen yan duvar açısı. Parker 24° kullanır (duvarlar kanal tabanına 66°); ERIKS kesite göre 23–32° verir.'],
    ['Gap between the flange faces after assembly. Keep 0 (metal-to-metal contact) where possible; any gap adds to the gland depth and is an extrusion path.', 'Spalt zwischen den Flanschflächen nach der Montage. Möglichst 0 (Metall-auf-Metall-Kontakt); jeder Spalt vergrößert die Einbautiefe und ist ein Extrusionsweg.', 'Spleet tussen de flensvlakken na montage. Houd waar mogelijk 0 aan (metaal-op-metaalcontact); elke spleet vergroot de inbouwdiepte en is een extrusiepad.', 'Montajdan sonra flanş yüzeyleri arasındaki boşluk. Mümkünse 0 tutun (metal-metal temas); her boşluk yuva derinliğine eklenir ve bir ekstrüzyon yoludur.'],
    ['Without guide rings the inner part can shift to one side. Then the gland is deeper by the radial clearance on that side, which lowers the minimum compression.', 'Ohne Führungsringe kann sich das Innenteil zur Seite verschieben. Dann ist der Einbauraum dort um das Radialspiel tiefer, und die minimale Verpressung sinkt.', 'Zonder geleideringen kan het binnendeel naar één kant verschuiven. De inbouwruimte is daar dan een radiale speling dieper, wat de minimale samendrukking verlaagt.', 'Kılavuz halkası yoksa iç parça bir tarafa kayabilir. O tarafta yuva radyal boşluk kadar derinleşir ve minimum sıkıştırma düşer.'],
    ['Change in O-ring volume from the fluid, from the compound\'s fluid-resistance data (e.g. +5 % in mineral oil). Negative values are shrinkage.', 'Volumenänderung des O-Rings durch das Medium, aus den Beständigkeitsdaten der Mischung (z. B. +5 % in Mineralöl). Negative Werte bedeuten Schrumpfung.', 'Volumeverandering van de O-ring door het medium, uit de bestendigheidsgegevens van de compound (bijv. +5 % in minerale olie). Negatieve waarden zijn krimp.', 'Akışkandan kaynaklanan O-ring hacim değişimi, karışımın dayanım verilerinden (ör. mineral yağda +%5). Negatif değerler büzülmedir.'],
    ['AS568 boss seals (-9xx)', 'AS568-Einschraubdichtungen (-9xx)', 'AS568-inschroefafdichtingen (-9xx)', 'AS568 boss sızdırmazlıkları (-9xx)'],
    ['AS568 -9xx for straight-thread tube fittings', 'AS568 -9xx für Rohrverschraubungen mit zylindrischem Gewinde', 'AS568 -9xx voor buisfittingen met cilindrische schroefdraad', 'Düz dişli boru bağlantıları için AS568 -9xx'],
    ['Groove mean Ø', 'Mittlerer Nut-Ø', 'Gemiddelde groef-Ø', 'Kanal ortalama Ø'],
    ['Centreline length', 'Länge Mittellinie', 'Lengte hartlijn', 'Merkez hattı uzunluğu'],
    ['Centreline width', 'Breite Mittellinie', 'Breedte hartlijn', 'Merkez hattı genişliği'],
    ['Centreline corner radius', 'Eckenradius Mittellinie', 'Hoekradius hartlijn', 'Merkez hattı köşe yarıçapı'],
    ['Undercut angle', 'Hinterschnittwinkel', 'Ondersnijdingshoek', 'Alttan kesme açısı'],
    ['Fitting undercut Ø F', 'Einstich-Ø F der Verschraubung', 'Insteek-Ø F van de fitting', 'Bağlantı boyun Ø F'],
    ['The O-ring sits on the undercut of the fitting and is squeezed into the conical seat of the port. Select the size by tube OD in the O-ring section; the port and fitting dimensions are listed in the results.', 'Der O-Ring sitzt im Einstich der Verschraubung und wird in den Kegelsitz des Ports gepresst. Die Größe im Abschnitt O-Ring nach Rohraußendurchmesser wählen; die Port- und Verschraubungsmaße stehen in den Ergebnissen.', 'De O-ring zit in de insteek van de fitting en wordt in de conische zitting van de poort gedrukt. Kies de maat op buisdiameter in het O-ringdeel; de poort- en fittingmaten staan bij de resultaten.', 'O-ring bağlantının boynuna oturur ve portun konik yuvasına sıkıştırılır. Ölçüyü O-ring bölümünde boru dış çapına göre seçin; port ve bağlantı ölçüleri sonuçlarda listelenir.'],
    ['Width at the opening', 'Breite an der Öffnung', 'Breedte bij de opening', 'Ağız genişliği'],
    ['Apply standard fitting dimensions', 'Normmaße der Verschraubung übernehmen', 'Normmaten van de fitting toepassen', 'Standart bağlantı ölçülerini uygula'],
    ['Installed stretch (nominal)', 'Einbaudehnung (nominal)', 'Inbouwrek (nominaal)', 'Montaj gerilmesi (nominal)'],
    ['Worst case {min} … {max} · on the fitting undercut', 'Grenzfall {min} … {max} · auf dem Einstich der Verschraubung', 'Ongunstigst {min} … {max} · op de insteek van de fitting', 'En kötü durum {min} … {max} · bağlantı boynunda'],
    ['Tube OD', 'Rohr-Außen-Ø', 'Buis-buiten-Ø', 'Boru dış çapı'],
    ['Thread', 'Gewinde', 'Schroefdraad', 'Diş'],
    ['Cone angle', 'Kegelwinkel', 'Kegelhoek', 'Koni açısı'],
    ['Port (boss)', 'Port (Gehäuse)', 'Poort (huis)', 'Port (gövde)'],
    ['Fitting', 'Verschraubung', 'Fitting', 'Bağlantı'],
    ['cone {z}°', 'Kegel {z}°', 'kegel {z}°', 'koni {z}°'],
    ['Mean diameter fit', 'Passung mittlerer Durchmesser', 'Passing gemiddelde diameter', 'Ortalama çap uyumu'],
    ['O-ring mean Ø vs. groove mean Ø', 'mittlerer O-Ring-Ø zu mittlerem Nut-Ø', 'gemiddelde O-ring-Ø t.o.v. gemiddelde groef-Ø', 'O-ring ortalama Ø / kanal ortalama Ø'],
    ['Width at the bottom', 'Breite am Nutgrund', 'Breedte bij de bodem', 'Taban genişliği'],
    ['undercut {v} per side', 'Hinterschnitt {v} je Seite', 'ondersnijding {v} per zijde', 'her tarafta {v} alttan kesme'],
    ['Retention', 'Halt', 'Vasthouden', 'Tutma'],
    ['O-ring CS minus opening width', 'Schnurstärke minus Öffnungsbreite', 'koorddikte min openingsbreedte', 'O-ring kesiti eksi ağız genişliği'],
    ['Installed stretch', 'Einbaudehnung', 'Inbouwrek', 'Montaj gerilmesi'],
    ['standard {v}', 'Norm {v}', 'norm {v}', 'standart {v}'],
    ['Port cone Ø U', 'Kegel-Ø U des Ports', 'Kegel-Ø U van de poort', 'Port koni Ø U'],
    ['depth K {v}', 'Tiefe K {v}', 'diepte K {v}', 'derinlik K {v}'],
    ['tube OD {v} in', 'Rohr-AD {v} in', 'buis-OD {v} in', 'boru OD {v} in'],
    ['Port and fitting dimensions', 'Port- und Verschraubungsmaße', 'Poort- en fittingmaten', 'Port ve bağlantı ölçüleri'],
    ['Radius at the opening edges', 'Radius an den Öffnungskanten', 'Radius aan de openingsranden', 'Ağız kenarı yarıçapı'],
    ['Standard', 'Norm', 'Norm', 'Standart'],
    ['Port: min. full-thread depth J', 'Port: min. Gewindetiefe J', 'Poort: min. volle draaddiepte J', 'Port: min. tam diş derinliği J'],
    ['Port: cone Ø U (+0.005 in)', 'Port: Kegel-Ø U (+0,005 in)', 'Poort: kegel-Ø U (+0,005 in)', 'Port: koni Ø U (+0,005 in)'],
    ['Port: cone depth K (+0.015 in)', 'Port: Kegeltiefe K (+0,015 in)', 'Poort: kegeldiepte K (+0,015 in)', 'Port: koni derinliği K (+0,015 in)'],
    ['Port: cone angle Z', 'Port: Kegelwinkel Z', 'Poort: kegelhoek Z', 'Port: koni açısı Z'],
    ['Port: D (min.)', 'Port: D (min.)', 'Poort: D (min.)', 'Port: D (min.)'],
    ['Port: Y (min.)', 'Port: Y (min.)', 'Poort: Y (min.)', 'Port: Y (min.)'],
    ['Port: P (min.)', 'Port: P (min.)', 'Poort: P (min.)', 'Port: P (min.)'],
    ['Port: O (min.)', 'Port: O (min.)', 'Poort: O (min.)', 'Port: O (min.)'],
    ['Fitting: undercut Ø F (+0.002 / −0.003 in)', 'Verschraubung: Einstich-Ø F (+0,002 / −0,003 in)', 'Fitting: insteek-Ø F (+0,002 / −0,003 in)', 'Bağlantı: boyun Ø F (+0,002 / −0,003 in)'],
    ['Fitting: D (max.)', 'Verschraubung: D (max.)', 'Fitting: D (max.)', 'Bağlantı: D (maks.)'],
    ['Fitting: U (+0.010 in)', 'Verschraubung: U (+0,010 in)', 'Fitting: U (+0,010 in)', 'Bağlantı: U (+0,010 in)'],
    ['Fitting: K (+0.015 in)', 'Verschraubung: K (+0,015 in)', 'Fitting: K (+0,015 in)', 'Bağlantı: K (+0,015 in)'],
    ['Letters as in the port and fitting-end drawings of the standard (ERIKS O-ring handbook, MS33656 fitting end). Check the current standard (SAE J1926 / AS5202) for your fitting.', 'Buchstaben wie in den Port- und Verschraubungszeichnungen der Norm (ERIKS O-Ring-Handbuch, Verschraubungsende MS33656). Für Ihre Verschraubung die aktuelle Norm (SAE J1926 / AS5202) prüfen.', 'Letters zoals in de poort- en fittingtekeningen van de norm (ERIKS O-ringhandboek, fittingeinde MS33656). Controleer de actuele norm (SAE J1926 / AS5202) voor uw fitting.', 'Harfler standardın port ve bağlantı ucu çizimlerindeki gibidir (ERIKS O-ring el kitabı, MS33656 bağlantı ucu). Bağlantınız için güncel standardı (SAE J1926 / AS5202) kontrol edin.'],
    ['Dovetail groove', 'Schwalbenschwanznut', 'Zwaluwstaartgroef', 'Kırlangıç kuyruğu kanal'],
    ['AS568 -9xx boss seals and port / fitting dimensions · values in {unit}. Click a row to use that size.', 'AS568-Einschraubdichtungen -9xx mit Port- / Verschraubungsmaßen · Werte in {unit}. Zeile anklicken, um diese Größe zu verwenden.', 'AS568-inschroefafdichtingen -9xx met poort- / fittingmaten · waarden in {unit}. Klik op een rij om die maat te gebruiken.', 'AS568 -9xx boss sızdırmazlıkları ve port / bağlantı ölçüleri · değerler {unit} cinsinden. Ölçüyü kullanmak için bir satıra tıklayın.'],
    ['Undercut groove in a flat face that holds the O-ring during assembly (doors, lids, vacuum chambers). The mean groove diameter should match the mean O-ring diameter.', 'Hinterschnittene Nut in einer Planfläche, die den O-Ring bei der Montage hält (Türen, Deckel, Vakuumkammern). Der mittlere Nutdurchmesser soll dem mittleren O-Ring-Durchmesser entsprechen.', 'Ondersneden groef in een vlak die de O-ring tijdens montage vasthoudt (deuren, deksels, vacuümkamers). De gemiddelde groefdiameter moet gelijk zijn aan de gemiddelde O-ringdiameter.', 'Montaj sırasında O-ringi tutan, düz yüzeyde alttan kesilmiş kanal (kapılar, kapaklar, vakum hazneleri). Kanal ortalama çapı O-ring ortalama çapına eşit olmalıdır.'],
    ['AS568 -9xx O-ring of a straight-thread tube fitting. It is squeezed between the fitting undercut and the conical seat of the port, so the gland comes from the port standard.', 'AS568-O-Ring -9xx einer Rohrverschraubung mit zylindrischem Gewinde. Er wird zwischen Einstich der Verschraubung und Kegelsitz des Ports verpresst, der Einbauraum ergibt sich also aus der Port-Norm.', 'AS568-O-ring -9xx van een buisfitting met cilindrische schroefdraad. Hij wordt tussen de insteek van de fitting en de conische zitting van de poort samengedrukt, dus de inbouwruimte volgt uit de poortnorm.', 'Düz dişli boru bağlantısının AS568 -9xx O-ringi. Bağlantı boynu ile portun konik yuvası arasında sıkışır; yuva port standardından gelir.'],
    ['Rounded rectangle: enter the groove centreline; the walls are offset by half the opening width.', 'Gerundetes Rechteck: Nut-Mittellinie eingeben; die Wände liegen um die halbe Öffnungsbreite versetzt.', 'Afgeronde rechthoek: voer de hartlijn van de groef in; de wanden liggen een halve openingsbreedte verschoven.', 'Yuvarlatılmış dikdörtgen: kanal merkez hattını girin; duvarlar ağız genişliğinin yarısı kadar kaydırılır.'],
    ['Hydraulics', 'Hydraulik', 'Hydrauliek', 'Hidrolik'],
    ['Covers & housings', 'Deckel & Gehäuse', 'Deksels & huizen', 'Kapaklar ve gövdeler'],
    ['Process, vacuum & fuel', 'Prozess, Vakuum & Kraftstoff', 'Proces, vacuüm & brandstof', 'Proses, vakum ve yakıt'],
    ['Dovetail grooves', 'Schwalbenschwanznuten', 'Zwaluwstaartgroeven', 'Kırlangıç kuyruğu kanallar'],
    ['Hydraulic cylinder piston (dynamic, 160 bar)', 'Hydraulikzylinder, Kolben (dynamisch, 160 bar)', 'Hydraulische cilinder, zuiger (dynamisch, 160 bar)', 'Hidrolik silindir pistonu (dinamik, 160 bar)'],
    ['Hydraulic cylinder rod (dynamic, 160 bar)', 'Hydraulikzylinder, Stange (dynamisch, 160 bar)', 'Hydraulische cilinder, stang (dynamisch, 160 bar)', 'Hidrolik silindir mili (dinamik, 160 bar)'],
    ['Valve plug, static, 250 bar, two back-up rings', 'Ventilstopfen, statisch, 250 bar, zwei Stützringe', 'Klepplug, statisch, 250 bar, twee steunringen', 'Valf tapası, statik, 250 bar, iki destek halkası'],
    ['Straight-thread port, 3/8 in tube (-906)', 'Einschraub-Port, 3/8-Zoll-Rohr (-906)', 'Inschroefpoort, 3/8 inch buis (-906)', 'Düz dişli port, 3/8 inç boru (-906)'],
    ['Round cover, face seal (6 bar)', 'Runder Deckel, Flanschdichtung (6 bar)', 'Rond deksel, vlakafdichting (6 bar)', 'Yuvarlak kapak, yüzey sızdırmazlığı (6 bar)'],
    ['Rectangular enclosure lid (rounded rectangle)', 'Rechteckiger Gehäusedeckel (gerundetes Rechteck)', 'Rechthoekig behuizingsdeksel (afgeronde rechthoek)', 'Dikdörtgen muhafaza kapağı (yuvarlatılmış dikdörtgen)'],
    ['Bearing cap on a shaft (static rod gland)', 'Lagerdeckel auf einer Welle (statische Stangennut)', 'Lagerdeksel op een as (statische stanggroef)', 'Mil üzerinde yatak kapağı (statik mil yuvası)'],
    ['AS568 piston seal in a 2 in bore', 'AS568-Kolbendichtung in einer 2-Zoll-Bohrung', 'AS568-zuigerafdichting in een boring van 2 inch', '2 inç delikte AS568 piston sızdırmazlığı'],
    ['Vacuum flange (pressure from outside)', 'Vakuumflansch (Druck von außen)', 'Vacuümflens (druk van buiten)', 'Vakum flanşı (basınç dışarıdan)'],
    ['Hot water / steam cover, EPDM (150 °C)', 'Deckel für Heißwasser / Dampf, EPDM (150 °C)', 'Deksel voor heet water / stoom, EPDM (150 °C)', 'Sıcak su / buhar kapağı, EPDM (150 °C)'],
    ['Fuel system face seal, fluorosilicone (−55 °C)', 'Flanschdichtung im Kraftstoffsystem, Fluorsilikon (−55 °C)', 'Vlakafdichting in brandstofsysteem, fluorsiliconen (−55 °C)', 'Yakıt sistemi yüzey sızdırmazlığı, florosilikon (−55 °C)'],
    ['Vacuum chamber door (rectangular dovetail)', 'Vakuumkammertür (rechteckige Schwalbenschwanznut)', 'Vacuümkamerdeur (rechthoekige zwaluwstaart)', 'Vakum hazne kapısı (dikdörtgen kırlangıç kuyruğu)'],
    ['Valve seat, O-ring retained in a dovetail', 'Ventilsitz, O-Ring in Schwalbenschwanznut gehalten', 'Klepzitting, O-ring vastgehouden in zwaluwstaart', 'Valf yuvası, O-ring kırlangıç kuyruğunda tutulur'],
    ['The O-ring mean diameter differs by {v} % from the groove mean diameter; in dovetail grooves they should coincide.', 'Der mittlere O-Ring-Durchmesser weicht um {v} % vom mittleren Nutdurchmesser ab; bei Schwalbenschwanznuten sollen sie übereinstimmen.', 'De gemiddelde O-ringdiameter wijkt {v} % af van de gemiddelde groefdiameter; bij zwaluwstaartgroeven moeten ze samenvallen.', 'O-ring ortalama çapı kanal ortalama çapından %{v} farklı; kırlangıç kuyruğu kanallarda eşit olmalıdır.'],
    ['The groove opening is not narrower than the O-ring cross-section, so the ring is not retained.', 'Die Nutöffnung ist nicht schmaler als die Schnurstärke, der Ring wird also nicht gehalten.', 'De groefopening is niet smaller dan de koorddikte, dus de ring wordt niet vastgehouden.', 'Kanal ağzı O-ring kesitinden dar değil, bu nedenle halka tutulmaz.'],
    ['ERIKS recommends dovetail grooves only for cross-sections of 3.53 mm (.139 in) and larger.', 'ERIKS empfiehlt Schwalbenschwanznuten nur für Schnurstärken ab 3,53 mm (.139 in).', 'ERIKS adviseert zwaluwstaartgroeven alleen voor koorddiktes van 3,53 mm (.139 in) en groter.', 'ERIKS kırlangıç kuyruğu kanalları yalnızca 3,53 mm (.139 in) ve üzeri kesitler için önerir.'],
    ['Enter the side wall (undercut) angle of the dovetail.', 'Seitenwandwinkel (Hinterschnitt) der Schwalbenschwanznut eingeben.', 'Voer de zijwandhoek (ondersnijding) van de zwaluwstaart in.', 'Kırlangıç kuyruğunun yan duvar (alttan kesme) açısını girin.'],
    ['Dovetail grooves are expensive to machine; the radius at the opening edges is critical (too small damages the O-ring, too large lets it extrude).', 'Schwalbenschwanznuten sind teuer in der Fertigung; der Radius an den Öffnungskanten ist kritisch (zu klein beschädigt den O-Ring, zu groß lässt ihn extrudieren).', 'Zwaluwstaartgroeven zijn duur om te bewerken; de radius aan de openingsranden is kritisch (te klein beschadigt de O-ring, te groot laat hem extruderen).', 'Kırlangıç kuyruğu kanalların işlenmesi pahalıdır; ağız kenarı yarıçapı kritiktir (çok küçük O-ringe zarar verir, çok büyük ekstrüzyona izin verir).'],
    ['Side wall angle {v}° differs from the guideline {g}°.', 'Seitenwandwinkel {v}° weicht vom Richtwert {g}° ab.', 'Zijwandhoek {v}° wijkt af van de richtlijn {g}°.', 'Yan duvar açısı {v}°, kılavuz değeri {g}° ile farklı.'],
    ['Select an AS568 -9xx boss seal size.', 'Eine AS568-Einschraubdichtung -9xx wählen.', 'Kies een AS568-inschroefafdichting -9xx.', 'Bir AS568 -9xx boss sızdırmazlık ölçüsü seçin.'],
    ['Fitting undercut Ø differs from the MS33656 value {v}.', 'Einstich-Ø der Verschraubung weicht vom MS33656-Wert {v} ab.', 'Insteek-Ø van de fitting wijkt af van de MS33656-waarde {v}.', 'Bağlantı boyun çapı MS33656 değeri {v} ile farklı.'],
    ['The O-ring can sit loose on the fitting undercut (stretch {v} %).', 'Der O-Ring kann lose im Einstich sitzen (Dehnung {v} %).', 'De O-ring kan los op de insteek zitten (rek {v} %).', 'O-ring bağlantı boynunda gevşek oturabilir (gerilme %{v}).'],
    ['Silicone and fluorosilicone are not recommended for boss seals: low strength and extrusion resistance.', 'Silikon und Fluorsilikon werden für Einschraubdichtungen nicht empfohlen: geringe Festigkeit und Extrusionsbeständigkeit.', 'Siliconen en fluorsiliconen worden niet aanbevolen voor inschroefafdichtingen: lage sterkte en extrusiebestendigheid.', 'Silikon ve florosilikon boss sızdırmazlığı için önerilmez: düşük dayanım ve ekstrüzyon direnci.'],
    ['Boss seals in high-pressure hydraulics usually use 90 Shore A compounds.', 'Einschraubdichtungen in der Hochdruckhydraulik verwenden meist 90-Shore-A-Mischungen.', 'Inschroefafdichtingen in hogedrukhydrauliek gebruiken meestal compounds van 90 Shore A.', 'Yüksek basınçlı hidrolikte boss sızdırmazlıkları genellikle 90 Shore A karışım kullanır.'],
    ['The gland is defined by the port (boss) and fitting-end standards: check the port dimensions below rather than a groove.', 'Der Einbauraum ist durch die Port- und Verschraubungsnormen festgelegt: statt einer Nut die Portmaße unten prüfen.', 'De inbouwruimte ligt vast in de poort- en fittingnormen: controleer de poortmaten hieronder in plaats van een groef.', 'Yuva port ve bağlantı ucu standartlarıyla belirlenir: kanal yerine aşağıdaki port ölçülerini kontrol edin.'],
  ];

  // Blocks with inline markup, translated as a whole (static, trusted content).
  const REPO = 'https://github.com/ehcrea/o-ring-groove-designer';
  const HTML = {
    about: {
      en: `<div class="about-head"><img src="icons/favicon.svg" alt=""><div><h2 id="about-title">O-Ring Groove Designer</h2><p>Version 1.1 · by Eren Tozlu</p></div></div>
<p>A free, browser-based tool for designing and checking O-ring grooves (glands): piston and rod seals, static or dynamic, and face seals with circular or rounded-rectangle grooves. It checks compression with worst-case tolerances, gland fill, stretch, extrusion gap, temperature and material limits. All calculations run in your browser.</p>
<p>Includes the AS568 and ISO 3601-1 size series, an elastomer library and groove guideline tables based on the public design guides of Parker (O-Ring Handbook ORD 5700) and ERIKS (O-ring Technical Handbook). Not affiliated with or endorsed by these companies.</p>
<p>Made by Eren Tozlu. More engineering tools and projects at <a href="https://ehcrea.com" target="_blank" rel="noopener">ehcrea.com</a>.</p>
<p>Open source under the <a href="${REPO}/blob/main/LICENSE" target="_blank" rel="noopener">MIT License</a>; the source code is on <a href="${REPO}" target="_blank" rel="noopener">GitHub</a>.</p>
<p class="about-meta">Results are design guidance. Confirm critical seals with the seal supplier and by testing.</p>`,
      de: `<div class="about-head"><img src="icons/favicon.svg" alt=""><div><h2 id="about-title">O-Ring-Nutauslegung</h2><p>Version 1.1 · von Eren Tozlu</p></div></div>
<p>Ein kostenloses Browser-Werkzeug zum Auslegen und Prüfen von O-Ring-Nuten (Einbauräumen): Kolben- und Stangendichtungen, statisch oder dynamisch, sowie Flanschdichtungen mit kreisförmiger oder gerundet-rechteckiger Nut. Es prüft die Verpressung mit ungünstigsten Toleranzen, Nutfüllung, Dehnung, Extrusionsspalt, Temperatur- und Werkstoffgrenzen. Alle Berechnungen laufen in Ihrem Browser.</p>
<p>Enthält die Größenreihen AS568 und ISO 3601-1, eine Elastomer-Bibliothek und Nut-Richtwerttabellen auf Basis der öffentlichen Auslegungsrichtlinien von Parker (O-Ring Handbook ORD 5700) und ERIKS (O-ring Technical Handbook). Keine Verbindung zu oder Empfehlung durch diese Unternehmen.</p>
<p>Erstellt von Eren Tozlu. Weitere Engineering-Werkzeuge und Projekte auf <a href="https://ehcrea.com" target="_blank" rel="noopener">ehcrea.com</a>.</p>
<p>Open Source unter der <a href="${REPO}/blob/main/LICENSE" target="_blank" rel="noopener">MIT-Lizenz</a>; der Quellcode liegt auf <a href="${REPO}" target="_blank" rel="noopener">GitHub</a>.</p>
<p class="about-meta">Die Ergebnisse sind Auslegungshilfen. Kritische Dichtstellen mit dem Dichtungshersteller und durch Versuche bestätigen.</p>`,
      nl: `<div class="about-head"><img src="icons/favicon.svg" alt=""><div><h2 id="about-title">O-ring-groefontwerp</h2><p>Versie 1.1 · door Eren Tozlu</p></div></div>
<p>Een gratis browsertool voor het ontwerpen en controleren van O-ringgroeven (inbouwruimtes): zuiger- en stangafdichtingen, statisch of dynamisch, en vlakafdichtingen met ronde of afgerond-rechthoekige groef. De tool controleert samendrukking met de ongunstigste toleranties, groefvulling, rek, extrusiespleet, temperatuur- en materiaalgrenzen. Alle berekeningen draaien in uw browser.</p>
<p>Bevat de maatreeksen AS568 en ISO 3601-1, een elastomeerbibliotheek en groefrichtlijntabellen op basis van de openbare ontwerprichtlijnen van Parker (O-Ring Handbook ORD 5700) en ERIKS (O-ring Technical Handbook). Niet gelieerd aan of goedgekeurd door deze bedrijven.</p>
<p>Gemaakt door Eren Tozlu. Meer engineeringtools en projecten op <a href="https://ehcrea.com" target="_blank" rel="noopener">ehcrea.com</a>.</p>
<p>Open source onder de <a href="${REPO}/blob/main/LICENSE" target="_blank" rel="noopener">MIT-licentie</a>; de broncode staat op <a href="${REPO}" target="_blank" rel="noopener">GitHub</a>.</p>
<p class="about-meta">De resultaten zijn ontwerprichtlijnen. Bevestig kritische afdichtingen met de leverancier en door testen.</p>`,
      tr: `<div class="about-head"><img src="icons/favicon.svg" alt=""><div><h2 id="about-title">O-Ring Kanal Tasarımı</h2><p>Sürüm 1.1 · Eren Tozlu</p></div></div>
<p>O-ring kanallarını (yuvalarını) tasarlamak ve kontrol etmek için ücretsiz, tarayıcı tabanlı bir araç: statik veya dinamik piston ve mil sızdırmazlıkları ile dairesel veya yuvarlatılmış dikdörtgen kanallı yüzey sızdırmazlıkları. En kötü durum toleranslarıyla sıkıştırmayı, kanal doluluğunu, gerilmeyi, ekstrüzyon boşluğunu, sıcaklık ve malzeme sınırlarını kontrol eder. Tüm hesaplamalar tarayıcınızda çalışır.</p>
<p>AS568 ve ISO 3601-1 ölçü serilerini, bir elastomer kütüphanesini ve Parker (O-Ring Handbook ORD 5700) ile ERIKS (O-ring Technical Handbook) firmalarının herkese açık tasarım kılavuzlarına dayanan kanal tablolarını içerir. Bu firmalarla bağlantılı değildir ve onlar tarafından onaylanmamıştır.</p>
<p>Eren Tozlu tarafından yapılmıştır. Daha fazla mühendislik aracı ve proje için <a href="https://ehcrea.com" target="_blank" rel="noopener">ehcrea.com</a>.</p>
<p><a href="${REPO}/blob/main/LICENSE" target="_blank" rel="noopener">MIT Lisansı</a> ile açık kaynaklıdır; kaynak kodu <a href="${REPO}" target="_blank" rel="noopener">GitHub</a> üzerindedir.</p>
<p class="about-meta">Sonuçlar tasarım rehberidir. Kritik sızdırmazlıkları tedarikçiyle ve testle doğrulayın.</p>`,
    },
    help: {
      en: `<h2 id="help-title">How to use the O-Ring Groove Designer</h2>
<p>New here? Pick an example from <b>Load application example…</b> in the toolbar, then change one value at a time and watch the results.</p>
<h3>Four steps</h3>
<ol>
<li><b>Application</b>: choose the seal type. <i>Piston</i>: groove in the inner part, sealing against a bore. <i>Rod</i>: groove in the housing, sealing against a rod or shaft. <i>Face</i>: groove in a flat face under a cover. <i>Dovetail</i>: undercut face groove that holds the O-ring. <i>Boss port</i>: O-ring of a straight-thread tube fitting. Then set static or dynamic motion, the pressure direction (face seals) and the groove outline: circle or rounded rectangle.</li>
<li><b>O-ring</b>: pick a standard size (AS568, ISO 3601-1 or boss seals) or enter a custom one, then the material and hardness. <b>Suggest O-ring</b> picks the standard size that fits your hardware best.</li>
<li><b>Hardware &amp; groove</b>: enter the main dimension (bore, rod, groove wall or centreline) and press <b>Apply recommended groove</b> to size the groove from the Parker or ERIKS guideline. Adjust the dimensions and tolerances to match your drawing.</li>
<li><b>Operating conditions</b>: pressure, temperature range and the volume swell of the O-ring in your fluid.</li>
</ol>
<h3>The gland</h3>
<svg viewBox="0 0 420 170" aria-hidden="true"><path class="metal" d="M10 20H410V52H10Z"/><path class="metal" d="M10 66H150V140H270V66H410V160H10Z"/><rect class="oring" x="168" y="52" width="70" height="88" rx="35"/><path class="dim" d="M150 150H270M150 145V155M270 145V155"/><text x="210" y="166" text-anchor="middle">G</text><path class="dim" d="M290 52V140M285 52H295M285 140H295"/><text x="298" y="100">L</text><path class="dim" d="M370 52V66M365 52H375M365 66H375"/><text x="380" y="63">E/2</text><path class="dim" d="M120 52V140" stroke-dasharray="3 3"/><text x="40" y="100">CS &gt; L</text></svg>
<dl>
<dt>Gland depth L</dt><dd>Distance from the groove bottom to the mating surface; for radial seals it includes the radial clearance, for face seals the flange gap.</dd>
<dt>Groove width G</dt><dd>Room for the O-ring to deform sideways, for swell and for back-up rings.</dd>
<dt>Clearance E</dt><dd>Diametral gap between the moving or mating parts (E/2 per side): the extrusion path under pressure.</dd>
<dt>Compression (squeeze)</dt><dd>(CS − L) / CS: how much the cross-section is squeezed. Too little leaks, too much causes high friction, compression set and damage. Static 12–30 %, dynamic 8–16 %.</dd>
<dt>Gland fill</dt><dd>O-ring cross-section area / gland area. Aim for about 75 % and stay below 85 %, so there is room for swell and thermal expansion.</dd>
<dt>Stretch</dt><dd>How much the O-ring ID is stretched at installation. Keep below 5 % (3 % for face seals); stretch also flattens the cross-section.</dd>
<dt>Worst case</dt><dd>All tolerances at their least favourable limits: the smallest ring in the deepest gland, and the other way round.</dd>
</dl>
<h3>Reading the results</h3>
<ul>
<li>The badge shows <b>OK</b>, <b>Check</b> (warnings) or <b>Problem</b> (errors). Each warning says what to change.</li>
<li><b>Recommended groove</b> compares your design with the guideline values; ✓ is within the guideline, ! is outside.</li>
<li>The libraries at the bottom list all O-ring sizes, the groove guideline tables and the materials. Click a row to use it.</li>
<li>The ⓘ icons explain individual inputs. <b>Copy link</b> saves the whole design in a link; <b>Unit converter</b> converts lengths, pressures and temperatures.</li>
</ul>
<p class="about-meta">The tool follows the public design guides of Parker and ERIKS. Always confirm critical seals with the seal supplier and by testing.</p>`,
      de: `<h2 id="help-title">So verwenden Sie die O-Ring-Nutauslegung</h2>
<p>Neu hier? Wählen Sie in der Werkzeugleiste unter <b>Anwendungsbeispiel laden…</b> ein Beispiel, ändern Sie dann einen Wert nach dem anderen und beobachten Sie die Ergebnisse.</p>
<h3>Vier Schritte</h3>
<ol>
<li><b>Anwendung</b>: Dichtungsart wählen. <i>Kolben</i>: Nut im Innenteil, dichtet gegen eine Bohrung. <i>Stange</i>: Nut im Gehäuse, dichtet gegen Stange oder Welle. <i>Flansch</i>: Nut in einer Planfläche unter einem Deckel. <i>Schwalbenschwanz</i>: hinterschnittene Flanschnut, die den O-Ring hält. <i>Einschraub-Port</i>: O-Ring einer Rohrverschraubung mit zylindrischem Gewinde. Dann statische oder dynamische Bewegung, die Druckrichtung (Flanschdichtungen) und die Nutkontur wählen: Kreis oder gerundetes Rechteck.</li>
<li><b>O-Ring</b>: Normgröße wählen (AS568, ISO 3601-1 oder Einschraubdichtungen) oder eigene Maße eingeben, dann Werkstoff und Härte. <b>O-Ring vorschlagen</b> wählt die Normgröße, die am besten zu Ihren Einbaumaßen passt.</li>
<li><b>Einbauraum &amp; Nut</b>: Hauptmaß eingeben (Bohrung, Stange, Nutwand oder Mittellinie) und <b>Empfohlene Nut übernehmen</b> drücken, um die Nut nach der Parker- oder ERIKS-Richtlinie auszulegen. Maße und Toleranzen an Ihre Zeichnung anpassen.</li>
<li><b>Betriebsbedingungen</b>: Druck, Temperaturbereich und die Volumenquellung des O-Rings in Ihrem Medium.</li>
</ol>
<h3>Der Einbauraum</h3>
<svg viewBox="0 0 420 170" aria-hidden="true"><path class="metal" d="M10 20H410V52H10Z"/><path class="metal" d="M10 66H150V140H270V66H410V160H10Z"/><rect class="oring" x="168" y="52" width="70" height="88" rx="35"/><path class="dim" d="M150 150H270M150 145V155M270 145V155"/><text x="210" y="166" text-anchor="middle">G</text><path class="dim" d="M290 52V140M285 52H295M285 140H295"/><text x="298" y="100">L</text><path class="dim" d="M370 52V66M365 52H375M365 66H375"/><text x="380" y="63">E/2</text><path class="dim" d="M120 52V140" stroke-dasharray="3 3"/><text x="40" y="100">CS &gt; L</text></svg>
<dl>
<dt>Einbautiefe L</dt><dd>Abstand vom Nutgrund zur Gegenfläche; bei radialen Dichtungen einschließlich Radialspiel, bei Flanschdichtungen einschließlich Flanschspalt.</dd>
<dt>Nutbreite G</dt><dd>Platz für die seitliche Verformung des O-Rings, für Quellung und für Stützringe.</dd>
<dt>Spiel E</dt><dd>Durchmesserspiel zwischen den bewegten oder gefügten Teilen (E/2 je Seite): der Extrusionsweg unter Druck.</dd>
<dt>Verpressung</dt><dd>(d2 − L) / d2: wie stark die Schnur gequetscht wird. Zu wenig leckt, zu viel führt zu hoher Reibung, Druckverformungsrest und Beschädigung. Statisch 12–30 %, dynamisch 8–16 %.</dd>
<dt>Nutfüllung</dt><dd>Querschnittsfläche des O-Rings / Nutfläche. Etwa 75 % anstreben und unter 85 % bleiben, damit Platz für Quellung und Wärmeausdehnung bleibt.</dd>
<dt>Dehnung</dt><dd>Wie stark der Innendurchmesser bei der Montage gedehnt wird. Unter 5 % halten (3 % bei Flanschdichtungen); Dehnung flacht auch die Schnurstärke ab.</dd>
<dt>Grenzfall</dt><dd>Alle Toleranzen an ihrer ungünstigsten Grenze: der kleinste Ring im tiefsten Einbauraum und umgekehrt.</dd>
</dl>
<h3>Ergebnisse lesen</h3>
<ul>
<li>Das Kennzeichen zeigt <b>OK</b>, <b>Prüfen</b> (Warnungen) oder <b>Problem</b> (Fehler). Jede Warnung sagt, was zu ändern ist.</li>
<li><b>Empfohlene Nut</b> vergleicht Ihren Entwurf mit den Richtwerten; ✓ liegt innerhalb, ! außerhalb.</li>
<li>Die Bibliotheken unten enthalten alle O-Ring-Größen, die Nut-Richtwerttabellen und die Werkstoffe. Zeile anklicken, um sie zu verwenden.</li>
<li>Die ⓘ-Symbole erklären einzelne Eingaben. <b>Link kopieren</b> speichert den ganzen Entwurf in einem Link; der <b>Einheitenumrechner</b> rechnet Längen, Drücke und Temperaturen um.</li>
</ul>
<p class="about-meta">Das Werkzeug folgt den öffentlichen Auslegungsrichtlinien von Parker und ERIKS. Kritische Dichtstellen immer mit dem Dichtungshersteller und durch Versuche bestätigen.</p>`,
      nl: `<h2 id="help-title">Zo gebruikt u het O-ring-groefontwerp</h2>
<p>Nieuw hier? Kies in de werkbalk een voorbeeld via <b>Toepassingsvoorbeeld laden…</b>, verander dan telkens één waarde en kijk naar de resultaten.</p>
<h3>Vier stappen</h3>
<ol>
<li><b>Toepassing</b>: kies het type afdichting. <i>Zuiger</i>: groef in het binnendeel, dicht af tegen een boring. <i>Stang</i>: groef in het huis, dicht af tegen een stang of as. <i>Vlak</i>: groef in een vlak onder een deksel. <i>Zwaluwstaart</i>: ondersneden vlakgroef die de O-ring vasthoudt. <i>Inschroefpoort</i>: O-ring van een buisfitting met cilindrische schroefdraad. Kies daarna statische of dynamische beweging, de drukrichting (vlakafdichtingen) en de groefcontour: cirkel of afgeronde rechthoek.</li>
<li><b>O-ring</b>: kies een normmaat (AS568, ISO 3601-1 of inschroefafdichtingen) of voer een eigen maat in, daarna materiaal en hardheid. <b>O-ring voorstellen</b> kiest de normmaat die het best bij uw inbouwmaten past.</li>
<li><b>Inbouwruimte &amp; groef</b>: voer de hoofdmaat in (boring, stang, groefwand of hartlijn) en druk op <b>Aanbevolen groef toepassen</b> om de groef volgens de richtlijn van Parker of ERIKS te dimensioneren. Pas maten en toleranties aan uw tekening aan.</li>
<li><b>Bedrijfsomstandigheden</b>: druk, temperatuurbereik en de volumezwelling van de O-ring in uw medium.</li>
</ol>
<h3>De inbouwruimte</h3>
<svg viewBox="0 0 420 170" aria-hidden="true"><path class="metal" d="M10 20H410V52H10Z"/><path class="metal" d="M10 66H150V140H270V66H410V160H10Z"/><rect class="oring" x="168" y="52" width="70" height="88" rx="35"/><path class="dim" d="M150 150H270M150 145V155M270 145V155"/><text x="210" y="166" text-anchor="middle">G</text><path class="dim" d="M290 52V140M285 52H295M285 140H295"/><text x="298" y="100">L</text><path class="dim" d="M370 52V66M365 52H375M365 66H375"/><text x="380" y="63">E/2</text><path class="dim" d="M120 52V140" stroke-dasharray="3 3"/><text x="40" y="100">CS &gt; L</text></svg>
<dl>
<dt>Inbouwdiepte L</dt><dd>Afstand van de groefbodem tot het tegenvlak; bij radiale afdichtingen inclusief radiale speling, bij vlakafdichtingen inclusief flensspleet.</dd>
<dt>Groefbreedte G</dt><dd>Ruimte voor zijdelingse vervorming van de O-ring, voor zwelling en voor steunringen.</dd>
<dt>Speling E</dt><dd>Diametrale speling tussen de bewegende of samengevoegde delen (E/2 per zijde): de extrusieweg onder druk.</dd>
<dt>Samendrukking</dt><dd>(CS − L) / CS: hoeveel de koord wordt ingedrukt. Te weinig lekt, te veel geeft hoge wrijving, blijvende vervorming en beschadiging. Statisch 12–30 %, dynamisch 8–16 %.</dd>
<dt>Groefvulling</dt><dd>Doorsnede-oppervlak van de O-ring / groefoppervlak. Streef naar ongeveer 75 % en blijf onder 85 %, zodat er ruimte is voor zwelling en thermische uitzetting.</dd>
<dt>Rek</dt><dd>Hoeveel de binnendiameter bij montage wordt gerekt. Houd onder 5 % (3 % bij vlakafdichtingen); rek maakt de koorddikte ook platter.</dd>
<dt>Ongunstigste geval</dt><dd>Alle toleranties op hun ongunstigste grens: de kleinste ring in de diepste inbouwruimte en omgekeerd.</dd>
</dl>
<h3>De resultaten lezen</h3>
<ul>
<li>Het label toont <b>OK</b>, <b>Controleren</b> (waarschuwingen) of <b>Probleem</b> (fouten). Elke waarschuwing zegt wat u moet veranderen.</li>
<li><b>Aanbevolen groef</b> vergelijkt uw ontwerp met de richtlijnwaarden; ✓ valt binnen de richtlijn, ! erbuiten.</li>
<li>De bibliotheken onderaan bevatten alle O-ringmaten, de groefrichtlijntabellen en de materialen. Klik op een rij om die te gebruiken.</li>
<li>De ⓘ-pictogrammen lichten afzonderlijke invoer toe. <b>Link kopiëren</b> bewaart het hele ontwerp in een link; de <b>eenhedenomrekenaar</b> rekent lengtes, drukken en temperaturen om.</li>
</ul>
<p class="about-meta">De tool volgt de openbare ontwerprichtlijnen van Parker en ERIKS. Bevestig kritische afdichtingen altijd met de leverancier en door testen.</p>`,
      tr: `<h2 id="help-title">O-Ring Kanal Tasarımı nasıl kullanılır</h2>
<p>Yeni misiniz? Araç çubuğundaki <b>Uygulama örneği yükle…</b> menüsünden bir örnek seçin, sonra değerleri tek tek değiştirip sonuçları izleyin.</p>
<h3>Dört adım</h3>
<ol>
<li><b>Uygulama</b>: sızdırmazlık tipini seçin. <i>Piston</i>: kanal iç parçada, deliğe karşı sızdırmazlık. <i>Mil</i>: kanal gövdede, mile veya şafta karşı sızdırmazlık. <i>Yüzey</i>: kapak altında düz yüzeydeki kanal. <i>Kırlangıç</i>: O-ringi tutan, alttan kesilmiş yüzey kanalı. <i>Boss port</i>: düz dişli boru bağlantısının O-ringi. Sonra statik veya dinamik hareketi, basınç yönünü (yüzey sızdırmazlığı) ve kanal konturunu seçin: daire veya yuvarlatılmış dikdörtgen.</li>
<li><b>O-ring</b>: standart bir ölçü seçin (AS568, ISO 3601-1 veya boss sızdırmazlıkları) ya da özel ölçü girin, ardından malzeme ve sertlik. <b>O-ring öner</b> parçanıza en uygun standart ölçüyü seçer.</li>
<li><b>Parça ve kanal</b>: ana ölçüyü girin (delik, mil, kanal duvarı veya merkez hattı) ve kanalı Parker veya ERIKS kılavuzuna göre boyutlandırmak için <b>Önerilen kanalı uygula</b>'ya basın. Ölçüleri ve toleransları çiziminize göre düzeltin.</li>
<li><b>Çalışma koşulları</b>: basınç, sıcaklık aralığı ve O-ringin akışkanınızdaki hacimsel şişmesi.</li>
</ol>
<h3>Yuva</h3>
<svg viewBox="0 0 420 170" aria-hidden="true"><path class="metal" d="M10 20H410V52H10Z"/><path class="metal" d="M10 66H150V140H270V66H410V160H10Z"/><rect class="oring" x="168" y="52" width="70" height="88" rx="35"/><path class="dim" d="M150 150H270M150 145V155M270 145V155"/><text x="210" y="166" text-anchor="middle">G</text><path class="dim" d="M290 52V140M285 52H295M285 140H295"/><text x="298" y="100">L</text><path class="dim" d="M370 52V66M365 52H375M365 66H375"/><text x="380" y="63">E/2</text><path class="dim" d="M120 52V140" stroke-dasharray="3 3"/><text x="40" y="100">CS &gt; L</text></svg>
<dl>
<dt>Yuva derinliği L</dt><dd>Kanal tabanından karşı yüzeye mesafe; radyal sızdırmazlıkta radyal boşluk, yüzey sızdırmazlığında flanş boşluğu dahildir.</dd>
<dt>Kanal genişliği G</dt><dd>O-ringin yana şekil değiştirmesi, şişme ve destek halkaları için yer.</dd>
<dt>Boşluk E</dt><dd>Hareketli veya birleşen parçalar arasındaki çapsal boşluk (her tarafta E/2): basınç altında ekstrüzyon yolu.</dd>
<dt>Sıkıştırma</dt><dd>(CS − L) / CS: kesitin ne kadar ezildiği. Az olursa kaçırır, fazla olursa yüksek sürtünme, kalıcı deformasyon ve hasar olur. Statik %12–30, dinamik %8–16.</dd>
<dt>Kanal doluluğu</dt><dd>O-ring kesit alanı / yuva alanı. Yaklaşık %75 hedefleyin ve %85'in altında kalın; şişme ve ısıl genleşme için yer kalsın.</dd>
<dt>Gerilme</dt><dd>Montajda O-ring iç çapının ne kadar gerildiği. %5'in altında tutun (yüzey sızdırmazlığında %3); gerilme kesiti de yassılaştırır.</dd>
<dt>En kötü durum</dt><dd>Tüm toleranslar en olumsuz sınırda: en derin yuvada en küçük halka ve tersi.</dd>
</dl>
<h3>Sonuçları okumak</h3>
<ul>
<li>Etiket <b>UYGUN</b>, <b>Kontrol</b> (uyarılar) veya <b>Sorun</b> (hatalar) gösterir. Her uyarı neyin değişmesi gerektiğini söyler.</li>
<li><b>Önerilen kanal</b> tasarımınızı kılavuz değerleriyle karşılaştırır; ✓ kılavuz içinde, ! dışında demektir.</li>
<li>Alttaki kütüphanelerde tüm O-ring ölçüleri, kanal kılavuz tabloları ve malzemeler bulunur. Kullanmak için bir satıra tıklayın.</li>
<li>ⓘ simgeleri tek tek girdileri açıklar. <b>Bağlantıyı kopyala</b> tüm tasarımı bir bağlantıda saklar; <b>Birim dönüştürücü</b> uzunluk, basınç ve sıcaklık dönüştürür.</li>
</ul>
<p class="about-meta">Araç, Parker ve ERIKS'in herkese açık tasarım kılavuzlarını izler. Kritik sızdırmazlıkları her zaman tedarikçiyle ve testle doğrulayın.</p>`,
    },
    notes: {
      en: `<ul>
<li><b>Compression</b> = (cross-section − gland depth) / cross-section. The worst case combines the O-ring cross-section tolerance, the gland tolerances and the installed stretch. Optionally the parts are fully offset by the radial clearance (eccentricity).</li>
<li><b>Stretch</b> flattens the cross-section; the reduction follows Parker's empirical curve (ORD 5700, fig. 3-3). Piston grooves: stretch on the groove bottom. Rod grooves: stretch on the rod, or circumferential compression of the centreline. Face grooves: the O-ring should seat on the outer wall for internal pressure and on the inner wall for external pressure.</li>
<li><b>Gland fill</b> = installed cross-section area / gland area (bottom radii removed); volume is conserved when the ring is stretched. Hot fill adds the O-ring's volumetric thermal expansion and the volume swell; the metal is assumed not to expand (conservative).</li>
<li><b>Rounded rectangles</b>: perimeter = 2(L + W) − (8 − 2π)R. Stretch and fit compare O-ring and groove perimeters. A centreline corner radius of at least 3 × cross-section is a common rule of thumb.</li>
<li><b>Dovetail grooves</b>: gland area = depth × opening width + depth² · tan(undercut angle); the O-ring mean diameter should match the groove mean diameter (Parker Design Chart 4-4, ERIKS Table 3.C-3). <b>Boss seals</b>: AS568 -9xx rings with port and MS33656 fitting-end dimensions from the ERIKS handbook; the check covers the stretch on the fitting undercut and the material limits.</li>
<li><b>Guidelines</b>: Parker ORD 5700 Design Tables 4-2 (industrial static), 4-3 (face seals), 5-2 and 5-2-b (industrial reciprocating, inch and metric); ERIKS O-ring Technical Handbook section 12 Tables 3.C-1 (face, metric), 3.C-2 (static radial, metric), 3.D-1 (dynamic, metric), 3.D-2 (back-up rings) and 3.B-1a (clearance). Other cross-sections are interpolated from these tables.</li>
<li><b>Limits used</b>: static compression 12–30 % (max. 30 %, Parker), dynamic 8–16 %; minimum squeeze ≈ 0.2 mm; gland fill 60–85 % nominal, optimum 75 %, at least 10 % void; installed stretch ≤ 5 % (Parker), ≤ 3 % for face seals (ERIKS); clearances halved for silicone and fluorosilicone; back-up rings above 103.5 bar static (Parker) or 50 bar dynamic (ERIKS).</li>
<li><b>Sizes</b>: AS568 dimensions per AS568A as listed in Parker ORD 5700 Table 9-1; ISO 3601-1 series G per Parker Table 9-6. Material temperature ranges and expansion coefficients are typical values (Parker Table 2-5).</li>
<li>Not covered: rotary seals, pneumatic floating rings, crush seals, friction and assembly force, extrusion charts versus pressure and hardness, thermal expansion of the housing. Design guides are guidelines; confirm with the seal supplier.</li>
</ul>`,
      de: `<ul>
<li><b>Verpressung</b> = (Schnurstärke − Einbautiefe) / Schnurstärke. Der ungünstigste Fall kombiniert die Toleranz der Schnurstärke, die Einbauraumtoleranzen und die Einbaudehnung. Optional werden die Teile um das volle Radialspiel versetzt (Exzentrizität).</li>
<li><b>Dehnung</b> flacht die Schnurstärke ab; die Abnahme folgt der empirischen Kurve von Parker (ORD 5700, Abb. 3-3). Kolbennut: Dehnung auf dem Nutgrund. Stangennut: Dehnung auf der Stange oder Umfangsstauchung der Mittellinie. Flanschnut: der O-Ring soll bei Innendruck an der Außenwand und bei Außendruck an der Innenwand anliegen.</li>
<li><b>Nutfüllung</b> = eingebaute Querschnittsfläche / Nutfläche (ohne Grundradien); bei Dehnung bleibt das Volumen erhalten. Die warme Füllung berücksichtigt die volumetrische Wärmeausdehnung des O-Rings und die Quellung; die Metallteile dehnen sich annahmegemäß nicht aus (konservativ).</li>
<li><b>Gerundete Rechtecke</b>: Umfang = 2(L + W) − (8 − 2π)R. Dehnung und Sitz vergleichen die Umfänge von O-Ring und Nut. Ein Eckenradius an der Mittellinie von mindestens 3 × Schnurstärke ist eine übliche Faustregel.</li>
<li><b>Schwalbenschwanznuten</b>: Nutfläche = Tiefe × Öffnungsbreite + Tiefe² · tan(Hinterschnittwinkel); der mittlere O-Ring-Durchmesser soll dem mittleren Nutdurchmesser entsprechen (Parker Design Chart 4-4, ERIKS Tabelle 3.C-3). <b>Einschraubdichtungen</b>: AS568-Ringe -9xx mit Port- und MS33656-Verschraubungsmaßen aus dem ERIKS-Handbuch; geprüft werden die Dehnung auf dem Einstich und die Werkstoffgrenzen.</li>
<li><b>Richtlinien</b>: Parker ORD 5700 Design Tables 4-2 (industriell statisch), 4-3 (Flanschdichtungen), 5-2 und 5-2-b (industriell hin- und hergehend, Zoll und metrisch); ERIKS O-ring Technical Handbook Abschnitt 12 Tabellen 3.C-1 (Flansch, metrisch), 3.C-2 (statisch radial, metrisch), 3.D-1 (dynamisch, metrisch), 3.D-2 (Stützringe) und 3.B-1a (Spiel). Andere Schnurstärken werden aus diesen Tabellen interpoliert.</li>
<li><b>Verwendete Grenzen</b>: statische Verpressung 12–30 % (max. 30 %, Parker), dynamisch 8–16 %; Mindestverpressung ≈ 0,2 mm; Nutfüllung nominal 60–85 %, optimal 75 %, mindestens 10 % Freiraum; Einbaudehnung ≤ 5 % (Parker), ≤ 3 % bei Flanschdichtungen (ERIKS); Spiele für Silikon und Fluorsilikon halbiert; Stützringe über 103,5 bar statisch (Parker) bzw. 50 bar dynamisch (ERIKS).</li>
<li><b>Größen</b>: AS568-Maße nach AS568A aus Parker ORD 5700 Tabelle 9-1; ISO 3601-1 Reihe G nach Parker Tabelle 9-6. Temperaturbereiche und Ausdehnungskoeffizienten der Werkstoffe sind typische Werte (Parker Tabelle 2-5).</li>
<li>Nicht abgedeckt: rotierende Dichtungen, pneumatische schwimmende Ringe, Quetschdichtungen, Reibung und Montagekraft, Extrusionsdiagramme über Druck und Härte, Wärmeausdehnung des Gehäuses. Auslegungsrichtlinien sind Richtwerte; mit dem Dichtungshersteller bestätigen.</li>
</ul>`,
      nl: `<ul>
<li><b>Samendrukking</b> = (koorddikte − inbouwdiepte) / koorddikte. Het ongunstigste geval combineert de tolerantie van de koorddikte, de toleranties van de inbouwruimte en de inbouwrek. Optioneel worden de delen over de volle radiale speling verschoven (excentriciteit).</li>
<li><b>Rek</b> maakt de doorsnede platter; de afname volgt de empirische curve van Parker (ORD 5700, fig. 3-3). Zuigergroef: rek op de groefbodem. Stanggroef: rek op de stang of omtreksstuiking van de hartlijn. Vlakgroef: de O-ring moet bij inwendige druk tegen de buitenwand en bij uitwendige druk tegen de binnenwand liggen.</li>
<li><b>Groefvulling</b> = ingebouwd doorsnede-oppervlak / groefoppervlak (zonder bodemradii); bij rek blijft het volume gelijk. De warme vulling telt de volumetrische thermische uitzetting van de O-ring en de zwelling op; het metaal zet volgens de aanname niet uit (conservatief).</li>
<li><b>Afgeronde rechthoeken</b>: omtrek = 2(L + W) − (8 − 2π)R. Rek en passing vergelijken de omtrekken van O-ring en groef. Een hoekradius op de hartlijn van minstens 3 × koorddikte is een gangbare vuistregel.</li>
<li><b>Zwaluwstaartgroeven</b>: groefoppervlak = diepte × openingsbreedte + diepte² · tan(ondersnijdingshoek); de gemiddelde O-ringdiameter moet gelijk zijn aan de gemiddelde groefdiameter (Parker Design Chart 4-4, ERIKS tabel 3.C-3). <b>Inschroefafdichtingen</b>: AS568-ringen -9xx met poort- en MS33656-fittingmaten uit het ERIKS-handboek; gecontroleerd worden de rek op de insteek en de materiaalgrenzen.</li>
<li><b>Richtlijnen</b>: Parker ORD 5700 Design Tables 4-2 (industrieel statisch), 4-3 (vlakafdichtingen), 5-2 en 5-2-b (industrieel heen-en-weer, inch en metrisch); ERIKS O-ring Technical Handbook hoofdstuk 12 tabellen 3.C-1 (vlak, metrisch), 3.C-2 (statisch radiaal, metrisch), 3.D-1 (dynamisch, metrisch), 3.D-2 (steunringen) en 3.B-1a (speling). Andere koorddiktes worden uit deze tabellen geïnterpoleerd.</li>
<li><b>Gebruikte grenzen</b>: statische samendrukking 12–30 % (max. 30 %, Parker), dynamisch 8–16 %; minimale indrukking ≈ 0,2 mm; groefvulling nominaal 60–85 %, optimaal 75 %, minstens 10 % vrije ruimte; inbouwrek ≤ 5 % (Parker), ≤ 3 % bij vlakafdichtingen (ERIKS); spelingen gehalveerd voor siliconen en fluorsiliconen; steunringen boven 103,5 bar statisch (Parker) of 50 bar dynamisch (ERIKS).</li>
<li><b>Maten</b>: AS568-maten volgens AS568A uit Parker ORD 5700 tabel 9-1; ISO 3601-1 serie G volgens Parker tabel 9-6. Temperatuurbereiken en uitzettingscoëfficiënten van de materialen zijn typische waarden (Parker tabel 2-5).</li>
<li>Niet behandeld: roterende afdichtingen, pneumatische zwevende ringen, knelafdichtingen, wrijving en montagekracht, extrusiediagrammen tegen druk en hardheid, thermische uitzetting van het huis. Ontwerprichtlijnen zijn richtwaarden; bevestig met de leverancier.</li>
</ul>`,
      tr: `<ul>
<li><b>Sıkıştırma</b> = (kesit − yuva derinliği) / kesit. En kötü durum, O-ring kesit toleransını, yuva toleranslarını ve montaj gerilmesini birleştirir. İsteğe bağlı olarak parçalar radyal boşluk kadar tamamen kaydırılır (eksen kaçıklığı).</li>
<li><b>Gerilme</b> kesiti yassılaştırır; azalma Parker'ın deneysel eğrisini izler (ORD 5700, şekil 3-3). Piston kanalı: kanal tabanında gerilme. Mil kanalı: mil üzerinde gerilme veya merkez hattının çevresel sıkışması. Yüzey kanalı: O-ring iç basınçta dış duvara, dış basınçta iç duvara oturmalıdır.</li>
<li><b>Kanal doluluğu</b> = montajlı kesit alanı / yuva alanı (taban yarıçapları hariç); halka gerildiğinde hacim korunur. Sıcak doluluk, O-ringin hacimsel ısıl genleşmesini ve şişmeyi ekler; metalin genleşmediği varsayılır (güvenli tarafta).</li>
<li><b>Yuvarlatılmış dikdörtgenler</b>: çevre = 2(L + W) − (8 − 2π)R. Gerilme ve oturma, O-ring ile kanal çevrelerini karşılaştırır. Merkez hattında en az 3 × kesit köşe yarıçapı yaygın bir pratik kuraldır.</li>
<li><b>Kırlangıç kuyruğu kanallar</b>: yuva alanı = derinlik × ağız genişliği + derinlik² · tan(alttan kesme açısı); O-ring ortalama çapı kanal ortalama çapına eşit olmalıdır (Parker Design Chart 4-4, ERIKS Tablo 3.C-3). <b>Boss sızdırmazlıkları</b>: ERIKS el kitabından port ve MS33656 bağlantı ucu ölçüleriyle AS568 -9xx halkalar; bağlantı boynundaki gerilme ve malzeme sınırları kontrol edilir.</li>
<li><b>Kılavuzlar</b>: Parker ORD 5700 Design Tables 4-2 (endüstriyel statik), 4-3 (yüzey sızdırmazlığı), 5-2 ve 5-2-b (endüstriyel doğrusal hareket, inç ve metrik); ERIKS O-ring Technical Handbook bölüm 12 Tablo 3.C-1 (yüzey, metrik), 3.C-2 (statik radyal, metrik), 3.D-1 (dinamik, metrik), 3.D-2 (destek halkaları) ve 3.B-1a (boşluk). Diğer kesitler bu tablolardan enterpolasyonla bulunur.</li>
<li><b>Kullanılan sınırlar</b>: statik sıkıştırma %12–30 (maks. %30, Parker), dinamik %8–16; minimum ezilme ≈ 0,2 mm; nominal kanal doluluğu %60–85, ideal %75, en az %10 boşluk; montaj gerilmesi ≤ %5 (Parker), yüzey sızdırmazlığında ≤ %3 (ERIKS); silikon ve florosilikon için boşluklar yarıya indirilir; statikte 103,5 bar (Parker), dinamikte 50 bar (ERIKS) üzerinde destek halkası.</li>
<li><b>Ölçüler</b>: AS568 ölçüleri AS568A'ya göre Parker ORD 5700 Tablo 9-1'den; ISO 3601-1 G serisi Parker Tablo 9-6'dan. Malzemelerin sıcaklık aralıkları ve genleşme katsayıları tipik değerlerdir (Parker Tablo 2-5).</li>
<li>Kapsam dışı: döner sızdırmazlıklar, pnömatik yüzer halkalar, ezme sızdırmazlıkları, sürtünme ve montaj kuvveti, basınç ve sertliğe göre ekstrüzyon diyagramları, gövdenin ısıl genleşmesi. Tasarım kılavuzları rehber niteliğindedir; tedarikçiyle doğrulayın.</li>
</ul>`,
    },
  };

  const DICT = { de: {}, nl: {}, tr: {} };
  for (const [en, de, nl, tr] of ROWS) { DICT.de[en] = de; DICT.nl[en] = nl; DICT.tr[en] = tr; }

  let lang = 'en';
  const fill = (tpl, p) => (p ? tpl.replace(/\{(\w+)\}/g, (m, k) => (k in p ? String(p[k]) : m)) : tpl);

  /** Translate a text (English key) and fill {placeholders}; string parameters are translated too. */
  function t(text, params) {
    if (text === undefined || text === null) return '';
    const tr = lang === 'en' ? text : (DICT[lang][text] !== undefined ? DICT[lang][text] : text);
    if (!params) return tr;
    const p = {};
    for (const k in params) p[k] = typeof params[k] === 'string' && lang !== 'en' && DICT[lang][params[k]] !== undefined ? DICT[lang][params[k]] : params[k];
    return fill(tr, p);
  }

  // ----- Static page translation -----
  let staticNodes = null; // [{ node, en, lead, trail }] and [{ el, attr, en }]
  function collectStatic() {
    const texts = [], attrs = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement.closest('script,style,[data-i18n-html],[data-i18n-skip]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const raw = n.nodeValue, en = raw.trim();
      if (en && DICT.de[en] !== undefined) texts.push({ node: n, en, lead: raw.match(/^\s*/)[0], trail: raw.match(/\s*$/)[0] });
    }
    for (const el of document.querySelectorAll('[title],[aria-label],[placeholder]')) {
      for (const attr of ['title', 'aria-label', 'placeholder']) {
        const en = el.getAttribute(attr);
        if (en && DICT.de[en] !== undefined) attrs.push({ el, attr, en });
      }
    }
    staticNodes = { texts, attrs };
  }

  function applyStatic() {
    if (!staticNodes) collectStatic();
    for (const s of staticNodes.texts) s.node.nodeValue = s.lead + t(s.en) + s.trail;
    for (const a of staticNodes.attrs) a.el.setAttribute(a.attr, t(a.en));
    for (const el of document.querySelectorAll('[data-i18n-html]')) {
      const block = HTML[el.dataset.i18nHtml];
      if (block) el.innerHTML = block[lang] || block.en; // trusted static content defined above
    }
    document.documentElement.lang = lang;
    document.title = t('O-Ring Groove Designer');
  }

  const I18N = {
    LANGS, t, fill,
    /** Percentage in the local style ("18 %", Turkish "%18"). */
    pct: (v) => (lang === 'tr' ? `%${v}` : `${v} %`),
    get lang() { return lang; },
    get locale() { return LANGS[lang].locale; },
    /** Initial language: saved choice, else the browser language if supported, else English. */
    init() {
      let saved = null;
      try { saved = localStorage.getItem(STORE_KEY); } catch (e) { /* storage unavailable */ }
      const nav = (typeof navigator !== 'undefined' && navigator.language || 'en').slice(0, 2).toLowerCase();
      lang = LANGS[saved] ? saved : LANGS[nav] ? nav : 'en';
      applyStatic();
    },
    setLang(l) {
      if (!LANGS[l]) return;
      lang = l;
      try { localStorage.setItem(STORE_KEY, l); } catch (e) { /* storage unavailable */ }
      applyStatic();
    },
    /** All English keys (used by the test that checks every t('…') call has translations). */
    keys: () => ROWS.map((r) => r[0]),
    rows: () => ROWS,
    html: () => HTML,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = I18N;
  else root.I18N = I18N;
})(typeof window !== 'undefined' ? window : globalThis);
