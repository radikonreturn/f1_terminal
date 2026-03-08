# F1 Terminal Dashboard 🏎️🏁

> **English summary:** A dual-implementation Formula 1 CLI that fetches live standings, schedule, race results and driver profiles from the [Jolpi API](https://jolpi.ca) and renders them in your terminal with colors, flags and countdown timers.
>
> Two versions:
> - `f1.py` — Pure Python, no dependencies, interactive REPL + direct CLI
> - `f1-ink/` — React Ink (Node.js) TUI with menu navigation
>
> **Commands:** `standings` · `constructors` · `schedule` · `next` · `last` · `drivers` · `pilot <CODE>` · `help`
>
> ```bash
> # Python
> python f1.py                  # interactive REPL
> python f1.py standings        # driver standings
> python f1.py drivers          # full driver grid
> python f1.py pilot VER        # Verstappen's career profile
>
> # Node
> cd f1-ink && npm install && npm start
> ```

---


Sıradan terminalinizi gerçek bir pit duvarına dönüştürün! Formula 1 verilerini (yarış takvimi, puan durumları, güncel sezon) terminalden şık ve hızlı bir şekilde almanızı sağlayan iki farklı CLI uygulaması: **f1.py** (Saf Python) ve **f1-ink** (React Ink).

Veri kaynağı olarak güvenilir bir Ergast kalıtımı olan [Jolpi API](https://test.jolpi.ca/ergast/f1) (Ergast v1.0.0 uyumlu aynası) kullanılmaktadır.

---

## 🐍 1. Python Versiyonu (`f1.py`)
Bağımlılık yok, indirme yok, hızlı ve hafif! Yalnızca standart kütüphane kullanır. Çökmelere karşı tamamen güvenlidir (API çökerse veya offline kalırsanız düzgün hata verir).

### Kullanım

**İnteraktif Mod:**
Terminali açıp sadece `python f1.py` yazarsanız, F1 interaktif konsolu başlar.

**Direkt Komutlar:**
- `python f1.py standings`  → Sürücü şampiyonası sıralamasını gösterir.
- `python f1.py constructors` → Takım şampiyonası sıralamasını gösterir.
- `python f1.py schedule`   → Mevcut sezonun (2026) tam yarış takvimini gösterir.
- `python f1.py next`       → Sıradaki yarışın nerede olduğunu, başlama tarihini ve **geriye sayımını** gösterir.
- `python f1.py last`       → Son tamamlanan yarışın sonuçlarını gösterir.
- `python f1.py help`       → Komut listesini gösterir.

*(İpucu: Windows ortamında emojiler ve ANSI renkler için UTF-8 kodlama sorunu kodun içerisinde `kernel32` ve `sys.reconfigure` çözümleri ile giderilmiştir.)*

---

## ⚛️ 2. React Ink Versiyonu (`f1-ink`)
Node.js ve React Ink altyapısı ile yazılmış tam renkli, dinamik terminal arayüzü (TUI). Esbuild ile tek bir bundle'a (dist/index.js) derlenip çalıştırılır.

### Kurulum ve Kullanım

Node.js ve npm'in sisteminizde kurulu olduğundan emin olun.

```bash
cd f1-ink
npm install
npm run build
```

**İnteraktif Arayüz (Menü):**
Sadece `npm start` yazın. Yönlendirme tuşlarını (1, 2, 3, 4, 5) kullanarak menüler (Standings, Constructors, Schedule, Next Race, Last Race) arasında geçiş yapabilirsiniz. Çıkmak için `[Q]`, ana menüye dönmek için `[M]` tuşuna basmanız yeterlidir.

**Direkt Komutlar:**
Sadece spesifik bir tabloyu görmek istiyorsanız aynı Python'daki gibi argüman geçebilirsiniz:
- `npm start standings`
- `npm start next`
- `npm start schedule` vb.

---

## 🛠️ Mimari Detaylar & Özellikler

* **`f1.py` İpliklenmesi (Threading):** Python sürümünde `urllib` ile HTTP atarken bir "Spinner" dönmesi için istekler `threading.Thread` içerisine alınmıştır. Ağ kesintisi olursa Timeout (10sn) girer.
* **`f1-ink` ESBuild Entegrasyonu:** React Ink altyapısı gereği JSX içerir, ancak Node bunu saf olarak anlamaz. `package.json` içerisinde ESBuild ile (ve `--packages=external` ile node_modules dahil edilmeyerek hızlıca) anında ESM JavaScript paketi çıkarılıp sunulur.
* **Offline Fallbacks:** İnternetiniz gider veya API DNS olarak kısıtlanmışsa (`getaddrinfo` hatası) terminalin çirkin stack trace'lerle boğulması engellenmiş, kullanıcıya net bir DNS sorunu mesajı verilmektedir.
* **Geri Sayım Modülü (`next` komutu):** 2026 veya geçerli sezon içerisindeki "sıradaki" yarışı anlık `datetime` parse işlemiyle bularak dakika/saat bazlı Countdown yeteneği barındırır.
* **API Fallback Güvenliği:** API'den gelen verilerde `'position'` alanı boş olan sürücüler (henüz puanı olmayan pilotlar) `positionText` ve `-` değerlerine güvenli bir şekilde fallback (yedekleme) yapar.
* **Bağımlılıklar (Node.js):** `f1-ink` versiyonu API istekleri için `node-fetch` paketi kullanır, kurulum adımında projedeki Node modüllerini (`npm install`) mutlaka yükleyin.
