import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const NAV_LINKS = [
  { label: "Главная", href: "#hero" },
  { label: "О базе", href: "#about" },
  { label: "Услуги", href: "#services" },
  { label: "Галерея", href: "#gallery" },
  { label: "Бронирование", href: "#booking" },
  { label: "Контакты", href: "#contacts" },
];

const SERVICES = [
  {
    icon: "Home",
    title: "Уютные домики",
    desc: "12 благоустроенных деревянных домиков с видом на озеро. Полное оснащение, бельё, отопление.",
    price: "от 3 500 ₽/ночь",
  },
  {
    icon: "Fish",
    title: "Рыбалка",
    desc: "Аренда лодок, снастей и профессиональные рыбацкие гиды. Карась, щука, окунь — круглый год.",
    price: "от 800 ₽/день",
  },
  {
    icon: "Flame",
    title: "Русская баня",
    desc: "Настоящая дровяная баня на берегу с купелью и зоной отдыха. Берёзовые и дубовые веники.",
    price: "от 2 000 ₽/час",
  },
  {
    icon: "TreePine",
    title: "Экскурсии",
    desc: "Пешие маршруты, конные прогулки и экотуры по заповедному лесу с опытными проводниками.",
    price: "от 1 200 ₽/чел",
  },
  {
    icon: "Utensils",
    title: "Полевая кухня",
    desc: "Уха на костре, шашлыки, грибной суп. Готовим из свежих местных продуктов каждый день.",
    price: "от 500 ₽/блюдо",
  },
  {
    icon: "Bike",
    title: "Активный отдых",
    desc: "Велосипеды, байдарки, волейбол, настольный теннис и детская площадка для всей семьи.",
    price: "от 400 ₽/час",
  },
];

const GALLERY_ITEMS = [
  {
    url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
    label: "Лесное озеро",
    span: "col-span-2 row-span-2",
  },
  {
    url: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=600&q=80",
    label: "Деревянные домики",
    span: "",
  },
  {
    url: "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=600&q=80",
    label: "Русская баня",
    span: "",
  },
  {
    url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&q=80",
    label: "Отдых у костра",
    span: "",
  },
  {
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80",
    label: "Лесные тропы",
    span: "",
  },
  {
    url: "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=600&q=80",
    label: "Дикая природа",
    span: "",
  },
];

const MARQUEE_ITEMS = [
  "🌲 Дикий лес",
  "🎣 Рыбалка",
  "🔥 Баня",
  "🏕️ Кемпинг",
  "🛶 Байдарки",
  "🌄 Рассветы",
  "🍄 Тихая охота",
  "⛺ Природа",
];

const STATS = [
  { value: "12", label: "домиков" },
  { value: "8+", label: "лет работы" },
  { value: "4.9★", label: "рейтинг" },
  { value: "2000+", label: "гостей в год" },
];

export default function Index() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    date: "",
    guests: "2",
    service: "домик",
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen font-golos" style={{ background: "var(--dark-bg)", color: "#eeeee4" }}>
      {/* ═══════════════ NAVBAR ═══════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "glass-card py-3 shadow-2xl" : "py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-2">
            <span className="font-oswald text-xl font-bold neon-text tracking-wider">ДИКИЙ</span>
            <span className="font-oswald text-xl font-bold text-white tracking-wider">БЕРЕГ</span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="nav-link text-sm font-medium">
                {l.label}
              </a>
            ))}
          </div>

          <a href="#booking" className="hidden md:inline-flex btn-primary px-5 py-2 rounded-full text-sm font-bold">
            Забронировать
          </a>

          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            <Icon name={menuOpen ? "X" : "Menu"} size={24} />
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden glass-card mt-2 mx-4 rounded-2xl p-6 flex flex-col gap-4">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="nav-link text-base" onClick={() => setMenuOpen(false)}>
                {l.label}
              </a>
            ))}
            <a href="#booking" className="btn-primary text-center px-5 py-2 rounded-full text-sm font-bold mt-2">
              Забронировать
            </a>
          </div>
        )}
      </nav>

      {/* ═══════════════ HERO ═══════════════ */}
      <section id="hero" className="relative min-h-screen flex items-center overflow-hidden noise-bg">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80"
            alt="Лес"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(10,15,13,0.93) 0%, rgba(10,15,13,0.72) 60%, rgba(10,15,13,0.5) 100%)",
            }}
          />
        </div>

        <div className="absolute inset-0 pointer-events-none">
          <div className="orb orb-green absolute w-96 h-96 top-20 left-20 opacity-60" />
          <div className="orb orb-amber absolute w-72 h-72 bottom-32 right-32 opacity-50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-16">
          <div className="max-w-3xl">
            <div className="section-tag reveal mb-6">Туристическая база</div>

            <h1
              className="font-oswald font-bold leading-none mb-6 reveal reveal-delay-1"
              style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}
            >
              <span className="text-white">ДИКИЙ</span>{" "}
              <span className="neon-text">БЕРЕГ</span>
            </h1>

            <p className="text-lg md:text-xl text-white/70 mb-10 max-w-xl leading-relaxed reveal reveal-delay-2">
              Затерянный в таёжном лесу на берегу чистейшего озера. Рыбалка, баня, свежий воздух и настоящий отдых от городской суеты.
            </p>

            <div className="flex flex-wrap gap-4 reveal reveal-delay-3">
              <a
                href="#booking"
                className="btn-primary px-8 py-4 rounded-full text-base font-bold inline-flex items-center gap-2"
              >
                <Icon name="Calendar" size={18} />
                Забронировать
              </a>
              <a
                href="#about"
                className="px-8 py-4 rounded-full text-base font-semibold border inline-flex items-center gap-2 transition-colors hover:text-green-400"
                style={{ borderColor: "rgba(255,255,255,0.15)", color: "white" }}
              >
                <Icon name="PlayCircle" size={18} />
                Узнать больше
              </a>
            </div>

            <div className="flex flex-wrap gap-8 mt-16 reveal reveal-delay-4">
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="font-oswald text-3xl font-bold neon-text">{s.value}</div>
                  <div className="text-white/50 text-sm mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-white/30 text-xs tracking-widest uppercase">Скролл</span>
          <Icon name="ChevronDown" size={20} className="text-green-400" />
        </div>
      </section>

      {/* ═══════════════ MARQUEE ═══════════════ */}
      <div
        className="overflow-hidden py-4 border-y"
        style={{ borderColor: "var(--glass-border)", background: "rgba(61,220,132,0.03)" }}
      >
        <div className="marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="font-oswald text-sm tracking-widest uppercase px-8 text-white/40">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════ ABOUT ═══════════════ */}
      <section id="about" className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="rounded-3xl overflow-hidden aspect-[4/3]">
              <img
                src="https://images.unsplash.com/photo-1501854140801-50d01698950b?w=900&q=80"
                alt="База"
                className="w-full h-full object-cover"
              />
            </div>
            <div
              className="absolute -bottom-6 -right-6 w-48 h-48 rounded-2xl overflow-hidden border-4"
              style={{ borderColor: "var(--dark-bg)" }}
            >
              <img
                src="https://images.unsplash.com/photo-1471623320832-752e8bbf8413?w=400&q=80"
                alt="Природа"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute top-6 -left-6 glass-card rounded-2xl p-4 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(61,220,132,0.2)" }}
              >
                <Icon name="Star" size={18} className="text-green-400" />
              </div>
              <div>
                <div className="font-bold text-white text-sm">4.9 / 5.0</div>
                <div className="text-white/50 text-xs">2000+ отзывов</div>
              </div>
            </div>
          </div>

          <div>
            <div className="section-tag mb-4">О нас</div>
            <h2 className="font-oswald text-4xl md:text-5xl font-bold text-white mb-6">
              Настоящий отдых <span className="neon-text">на природе</span>
            </h2>
            <p className="text-white/60 text-lg leading-relaxed mb-6">
              «Дикий Берег» — семейная туристическая база в 120 км от города, затерявшаяся в первозданном таёжном лесу на берегу лесного озера.
            </p>
            <p className="text-white/55 leading-relaxed mb-8">
              Мы открылись 8 лет назад с одной целью — дать людям возможность по-настоящему отдохнуть от городского шума. Никаких аниматоров, никакого форс-мажора — только лес, вода и тишина.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "MapPin", label: "120 км от города" },
                { icon: "Droplets", label: "Озеро с чистой водой" },
                { icon: "Wind", label: "Чистый лесной воздух" },
                { icon: "Shield", label: "Безопасная территория" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(61,220,132,0.15)" }}
                  >
                    <Icon name={item.icon as "MapPin"} size={16} className="text-green-400" />
                  </div>
                  <span className="text-white/80 text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ SERVICES ═══════════════ */}
      <section id="services" className="py-24 px-6" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="section-tag mb-4 justify-center">Что мы предлагаем</div>
            <h2 className="font-oswald text-4xl md:text-5xl font-bold text-white">
              Наши <span className="neon-text">услуги</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s) => (
              <div key={s.title} className="service-card glass-card gradient-border rounded-2xl p-6 cursor-default">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(61,220,132,0.15)" }}
                >
                  <Icon name={s.icon as "Home"} size={24} className="text-green-400" />
                </div>
                <h3 className="font-oswald text-xl font-bold text-white mb-2">{s.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed mb-4">{s.desc}</p>
                <div className="font-oswald text-base font-bold amber-text">{s.price}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ GALLERY ═══════════════ */}
      <section id="gallery" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="section-tag mb-4 justify-center">Наша территория</div>
            <h2 className="font-oswald text-4xl md:text-5xl font-bold text-white">
              <span className="neon-text">Галерея</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[200px]">
            {GALLERY_ITEMS.map((item, i) => (
              <div key={i} className={`gallery-item relative ${item.span} rounded-2xl overflow-hidden group`}>
                <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                <div
                  className="absolute inset-0 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}
                >
                  <span className="text-white font-oswald text-sm tracking-wider uppercase">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ BOOKING ═══════════════ */}
      <section id="booking" className="py-24 px-6" style={{ background: "rgba(61,220,132,0.03)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="section-tag mb-4 justify-center">Онлайн-бронирование</div>
            <h2 className="font-oswald text-4xl md:text-5xl font-bold text-white">
              Забронировать <span className="neon-text">место</span>
            </h2>
            <p className="text-white/50 mt-4">Заполните форму — мы перезвоним в течение 15 минут</p>
          </div>

          <div className="glass-card rounded-3xl p-8 md:p-12">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-white/60 text-sm font-medium">Ваше имя</label>
                  <input
                    type="text"
                    required
                    placeholder="Иван Петров"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-neon rounded-xl px-4 py-3 text-white placeholder:text-white/25 font-golos text-sm"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)" }}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-white/60 text-sm font-medium">Телефон</label>
                  <input
                    type="tel"
                    required
                    placeholder="+7 (999) 000-00-00"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="input-neon rounded-xl px-4 py-3 text-white placeholder:text-white/25 font-golos text-sm"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)" }}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-white/60 text-sm font-medium">Дата заезда</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="input-neon rounded-xl px-4 py-3 text-white font-golos text-sm"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--glass-border)",
                      colorScheme: "dark",
                    }}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-white/60 text-sm font-medium">Количество гостей</label>
                  <select
                    value={form.guests}
                    onChange={(e) => setForm({ ...form, guests: e.target.value })}
                    className="input-neon rounded-xl px-4 py-3 text-white font-golos text-sm"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)" }}
                  >
                    {["1", "2", "3", "4", "5", "6+"].map((n) => (
                      <option key={n} value={n} style={{ background: "#111a14" }}>
                        {n} {n === "1" ? "гость" : "гостя"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-white/60 text-sm font-medium">Интересующая услуга</label>
                  <div className="flex flex-wrap gap-3">
                    {["домик", "баня", "рыбалка", "экскурсия"].map((svc) => (
                      <button
                        key={svc}
                        type="button"
                        onClick={() => setForm({ ...form, service: svc })}
                        className="px-4 py-2 rounded-full text-sm font-medium capitalize transition-all"
                        style={{
                          background: form.service === svc ? "var(--neon-green)" : "rgba(255,255,255,0.05)",
                          color: form.service === svc ? "var(--dark-bg)" : "rgba(255,255,255,0.6)",
                          border: `1px solid ${form.service === svc ? "var(--neon-green)" : "var(--glass-border)"}`,
                        }}
                      >
                        {svc}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="btn-primary w-full py-4 rounded-xl font-oswald text-lg tracking-wide flex items-center justify-center gap-2"
                  >
                    <Icon name="Send" size={18} />
                    Отправить заявку
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-12">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: "rgba(61,220,132,0.15)" }}
                >
                  <Icon name="CheckCircle" size={40} className="text-green-400" />
                </div>
                <h3 className="font-oswald text-2xl font-bold text-white mb-3">Заявка отправлена!</h3>
                <p className="text-white/50">Мы перезвоним вам в течение 15 минут. Ждём вас на «Диком Берегу»!</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 text-green-400 text-sm hover:underline"
                >
                  Отправить ещё одну заявку
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════ CONTACTS ═══════════════ */}
      <section id="contacts" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="section-tag mb-4 justify-center">Будем рады видеть вас</div>
            <h2 className="font-oswald text-4xl md:text-5xl font-bold text-white">
              <span className="neon-text">Контакты</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "Phone", title: "Телефон", value: "+7 (912) 345-67-89", sub: "Ежедневно 8:00–22:00" },
              { icon: "MapPin", title: "Адрес", value: "Ленинградская обл.", sub: "с. Лесное, база «Дикий Берег»" },
              { icon: "Mail", title: "Email", value: "info@dikiy-bereg.ru", sub: "Ответим в течение часа" },
            ].map((c) => (
              <div key={c.title} className="glass-card gradient-border rounded-2xl p-8 text-center service-card">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(61,220,132,0.12)" }}
                >
                  <Icon name={c.icon as "Phone"} size={26} className="text-green-400" />
                </div>
                <div className="font-oswald text-lg font-bold text-white mb-1">{c.title}</div>
                <div className="text-white/80 text-sm mb-1">{c.value}</div>
                <div className="text-white/40 text-xs">{c.sub}</div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-6 mt-12">
            {[
              { icon: "MessageCircle", label: "ВКонтакте" },
              { icon: "Send", label: "Telegram" },
              { icon: "Phone", label: "WhatsApp" },
            ].map((s) => (
              <button
                key={s.label}
                className="flex items-center gap-2 px-5 py-3 rounded-full glass-card text-sm text-white/70 hover:text-green-400 transition-colors"
              >
                <Icon name={s.icon as "Send"} size={16} />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="py-8 px-6 border-t text-center" style={{ borderColor: "var(--glass-border)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-oswald font-bold neon-text tracking-wider">ДИКИЙ</span>
            <span className="font-oswald font-bold text-white tracking-wider">БЕРЕГ</span>
          </div>
          <p className="text-white/30 text-sm">© 2024 Туристическая база «Дикий Берег». Все права защищены.</p>
          <div className="flex gap-4">
            {NAV_LINKS.slice(1, 4).map((l) => (
              <a key={l.href} href={l.href} className="text-white/30 text-sm hover:text-white/60 transition-colors">
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
