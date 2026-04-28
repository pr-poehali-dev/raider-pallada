import { useState, useEffect, useRef } from "react";

export default function Index() {
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", checkin: "", checkout: "", guests: "" });
  const [agreed, setAgreed] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [seaCardModalOpen, setSeaCardModalOpen] = useState(false);
  type GalleryPhoto = {id: number; url: string; media_type: string; thumbnail?: string};
  type GalleryCategory = "sea" | "basic" | "comfort" | "family";
  const [galleries, setGalleries] = useState<Record<GalleryCategory, GalleryPhoto[]>>({ sea: [], basic: [], comfort: [], family: [] });
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [galleryCategory, setGalleryCategory] = useState<GalleryCategory>("sea");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<GalleryCategory>("sea");
  const [uploadPassword, setUploadPassword] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const GALLERY_URL = "https://functions.poehali.dev/2d41df0f-841c-4976-89e7-a1528b2cc77a";

  useEffect(() => {
    const cats: GalleryCategory[] = ["sea", "basic", "comfort", "family"];
    cats.forEach(cat => {
      fetch(`${GALLERY_URL}?category=${cat}`)
        .then(r => r.json())
        .then(d => setGalleries(prev => ({ ...prev, [cat]: d.photos || [] })))
        .catch(() => {});
    });
  }, []);

  const openGallery = (cat: GalleryCategory, idx = 0) => { setGalleryCategory(cat); setGalleryIdx(idx); setGalleryOpen(true); };
  const openUpload = (cat: GalleryCategory) => { setUploadCategory(cat); setUploadOpen(true); };
  const galleryPhotos = galleries[galleryCategory];

  const handleUpload = async () => {
    if (!uploadFile || !uploadPassword) return;
    setUploadLoading(true);
    setUploadError("");
    try {
      const isVideo = uploadFile.type.startsWith("video/");
      if (isVideo) {
        // Видео: чанки по 3MB через бекенд (multipart)
        const CHUNK = 3 * 1024 * 1024;
        const total = uploadFile.size;
        const chunks = Math.ceil(total / CHUNK);

        // 1. Инициируем multipart upload
        const initRes = await fetch(GALLERY_URL + "?action=init", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: uploadPassword, content_type: uploadFile.type }),
        });
        const initData = await initRes.json();
        if (!initRes.ok) { setUploadError(initData.error || "Ошибка"); setUploadLoading(false); return; }
        const { upload_id, key } = initData;

        // 2. Загружаем чанки
        const parts: { ETag: string; PartNumber: number }[] = [];
        for (let i = 0; i < chunks; i++) {
          const slice = uploadFile.slice(i * CHUNK, (i + 1) * CHUNK);
          const b64 = await new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = (e) => resolve((e.target!.result as string).split(",")[1]);
            r.readAsDataURL(slice);
          });
          const partRes = await fetch(GALLERY_URL + "?action=part", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ upload_id, key, part_number: i + 1, data: b64 }),
          });
          const partData = await partRes.json();
          if (!partRes.ok) { setUploadError("Ошибка загрузки части"); setUploadLoading(false); return; }
          parts.push({ ETag: partData.etag, PartNumber: i + 1 });
        }

        // 3. Завершаем upload
        const completeRes = await fetch(GALLERY_URL + "?action=complete", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: uploadPassword, upload_id, key, parts, content_type: uploadFile.type }),
        });
        const completeData = await completeRes.json();
        if (!completeRes.ok) { setUploadError(completeData.error || "Ошибка"); setUploadLoading(false); return; }
        setGalleryPhotos(prev => [{ id: completeData.id, url: completeData.url, media_type: completeData.media_type }, ...prev]);
      } else {
        // Фото — base64
        const b64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target!.result as string).split(",")[1]);
          reader.readAsDataURL(uploadFile);
        });
        const res = await fetch(GALLERY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: uploadPassword, image: b64, content_type: uploadFile.type, category: uploadCategory }),
        });
        const data = await res.json();
        if (!res.ok) { setUploadError(data.error || "Ошибка"); setUploadLoading(false); return; }
        setGalleries(prev => ({ ...prev, [uploadCategory]: [data, ...prev[uploadCategory]] }));
      }
      setUploadOpen(false);
      setUploadFile(null);
      setUploadPassword("");
    } catch (e) { setUploadError("Ошибка загрузки"); }
    setUploadLoading(false);
  };

  const handleDeletePhoto = async (id: number, cat: GalleryCategory) => {
    await fetch(GALLERY_URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: uploadPassword, id }),
    });
    setGalleries(prev => ({ ...prev, [cat]: prev[cat].filter(p => p.id !== id) }));
  };
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in-view"); }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".fade-up").forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("https://functions.poehali.dev/2f1319ca-0801-4868-a8ca-97cd3c00f38d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } catch (err) { console.error(err); }
    setFormSubmitted(true);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo">Рейд <span>Паллада</span></div>
        <div className="nav-links" style={mobileMenuOpen ? {
          display: "flex", flexDirection: "column", position: "fixed",
          top: 64, left: 0, right: 0, background: "var(--color-surface)",
          padding: "var(--space-6)", gap: "var(--space-5)",
          borderBottom: "1px solid var(--color-border)", zIndex: 99
        } : {}}>
          <a href="#place" onClick={(e) => { e.preventDefault(); scrollTo("place"); }}>О месте</a>
          <a href="#services" onClick={(e) => { e.preventDefault(); scrollTo("services"); }}>Услуги</a>
          <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollTo("pricing"); }}>Цены</a>
          <a href="#location" onClick={(e) => { e.preventDefault(); scrollTo("location"); }}>Как добраться</a>
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
          <button className="theme-btn" onClick={toggleTheme} aria-label="Тема">
            {theme === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          <a href="#booking" className="nav-cta" onClick={(e) => { e.preventDefault(); scrollTo("booking"); }}>
            Забронировать
          </a>
          <button className="nav-mobile-menu" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Меню">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <video
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", zIndex: 0,
          }}
        >
          <source src="https://cdn.poehali.dev/projects/d0b8e08e-3e07-463e-9b80-7ee7ed755aa5/bucket/e2b02f6c-a2dc-4eb1-b7be-d03ccbaaf6aa.mp4" type="video/mp4" />
        </video>
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "linear-gradient(160deg, rgba(13,58,68,0.72) 0%, rgba(26,96,112,0.55) 35%, rgba(45,138,110,0.45) 60%, rgba(26,74,56,0.65) 100%), linear-gradient(to bottom, transparent 40%, rgba(13,30,25,0.85) 100%)",
        }} />
        <svg className="hero-waves" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true" style={{ zIndex: 2 }}>
          <path d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z" fill="rgba(245,242,236,0.06)"/>
          <path d="M0,80 C360,40 720,110 1080,70 C1260,50 1380,90 1440,80 L1440,120 L0,120 Z" fill="rgba(245,242,236,0.04)"/>
        </svg>
        <div className="hero-content" style={{ position: "relative", zIndex: 3 }}>
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            Хасанский район · Коса Назимова · Сезон 2026
          </div>
          <h1>Рейд <em>Паллада</em></h1>
          <p className="hero-sub" style={{ fontSize: "clamp(1.4rem, 4vw, 2.2rem)", fontWeight: 700, letterSpacing: "0.02em", lineHeight: 1.3 }}>Два берега, одна Коса, Бесконечное лето.</p>
          <p className="hero-sub" style={{ marginTop: 10 }}>База отдыха «Рейд Паллада» — это не отель со звёздами. Это лучше. Здесь нет wi-fi, зато есть свежий воздух, закаты и полная тишина.</p>
          <div className="hero-actions">
            <a href="#booking" className="btn-hero" onClick={(e) => { e.preventDefault(); scrollTo("booking"); }}>
              🌊 Забронировать место
            </a>
            <a href="#day" className="btn-ghost" onClick={(e) => { e.preventDefault(); scrollTo("day"); }}>
              Как проходит день →
            </a>
          </div>
        </div>
        <div className="hero-stats" style={{ position: "relative", zIndex: 3 }}>
          <div><div className="hero-stat-num">+24°С</div><div className="hero-stat-label">море в июле–августе</div></div>
          <div><div className="hero-stat-num">4 ч</div><div className="hero-stat-label">от Владивостока</div></div>
          <div><div className="hero-stat-num">5★</div><div className="hero-stat-label">средняя оценка гостей</div></div>
          <div><div className="hero-stat-num">Июнь–Сент</div><div className="hero-stat-label">сезон 2026</div></div>
        </div>
      </section>

      {/* PAIN */}
      <section className="section pain">
        <div className="section-inner">
          <div>
            <p className="section-label" style={{ color: "var(--color-gold)" }}>Узнаёте себя?</p>
            <h2 className="pain-title">Устали от отдыха,<br />который <em>не отдыхает?</em></h2>
            <p className="pain-text" style={{ marginTop: "var(--space-4)" }}>
              Толпы на пляже, дорогие отели без души, шум и суета. Мы создали место, где всё по-другому.
            </p>
          </div>
          <div className="pain-items">
            {[
              { icon: "🌊", title: "Переполненные пляжи?", desc: "У нас — собственный берег только для гостей базы" },
              { icon: "🪵", title: "Холодные номера в отеле?", desc: "Тёплые деревянные домики с верандой и видом на море" },
              { icon: "🔥", title: "Ресторанные цены за завтрак?", desc: "Мангальные зоны — готовьте сами, когда хотите" },
              { icon: "🌿", title: "Хочется просто тишины?", desc: "Коса Назимова — звук волн, сосны и звёздное небо" },
            ].map((item) => (
              <div key={item.title} className="pain-item fade-up">
                <div className="pain-icon">{item.icon}</div>
                <div>
                  <div className="pain-item-title">{item.title}</div>
                  <div className="pain-item-desc">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLACE */}
      <section className="section place" id="place">
        <div className="section-inner">
          <p className="section-label fade-up">О месте</p>
          <h2 className="section-title fade-up">Коса Назимова —<br />особенное место Приморья</h2>
          <div className="place-grid">
            <div
              className="place-img-wrap fade-up"
              onClick={() => setVideoModalOpen(true)}
              style={{ cursor: "pointer" }}
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              >
                <source src="https://cdn.poehali.dev/projects/d0b8e08e-3e07-463e-9b80-7ee7ed755aa5/bucket/7b56cf49-4bec-455b-9504-6494ba64f395.mp4" type="video/mp4" />
              </video>
              <div className="place-img-overlay">
                <div className="place-img-tag">📍 Хасанский район, Приморский край</div>
              </div>
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 3, opacity: 0, transition: "opacity 0.2s",
              }}
                className="place-play-btn"
              >
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)",
                  border: "2px solid rgba(255,255,255,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
            </div>
            <div className="place-features fade-up">
              {[
                { icon: "🐋", title: "Японское море", desc: "Самое тёплое море Дальнего Востока. Прогревается до +24–26°С в июле–августе. Чистая вода, живописные берега." },
                { icon: "🏄", title: "Коса Назимова", desc: "Узкая полоска суши между морем и заливом. С одной стороны рассветы, с другой — закаты. Таких мест в России единицы." },
                { icon: "💨", title: "Морской воздух", desc: "Коса Назимова — здесь каждый вдох, как глоток свободы." },
                { icon: "🌅", title: "Тишина и уединение", desc: "Небольшая база — только для своих. Никакой суеты, без лишнего шума. Только море и вы." },
              ].map((f) => (
                <div key={f.title} className="place-feature">
                  <div className="place-feature-icon">{f.icon}</div>
                  <div>
                    <div className="place-feature-title">{f.title}</div>
                    <div className="place-feature-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section services" id="services">
        <div className="section-inner">
          <p className="section-label fade-up">Что включено</p>
          <h2 className="section-title fade-up">Всё для настоящего отдыха</h2>
          <div className="services-grid">
            <div className="service-card featured fade-up">
              <div className="service-emoji">🪴</div>
              <div className="service-title">Уютные домики с верандой</div>
              <div className="service-desc">Деревянные домики с полным комплектом постельного белья, верандой с видом на море. Просыпаетесь — а море прямо перед вами.</div>
            </div>
            {[
              { emoji: "🛁", title: "Баня-бочка у воды", desc: "Классический контраст: раскалённая баня и прохладное Японское море рядом." },
              { emoji: "🚣", title: "SUP и каяки", desc: "Прокат досок и каяков — выходите прямо с берега базы." },
              { emoji: "🍖", title: "Мангальные зоны", desc: "Оборудованные беседки с мангалом — жарьте, когда захочется." },
              { emoji: "🎣", title: "Рыбалка", desc: "Японское море кормит само — кальмар, камбала, краб." },
              { emoji: "🚗", title: "Охраняемая парковка", desc: "Парковка прямо на территории. Привезли велосипеды — рады." },
            ].map((s) => (
              <div key={s.title} className="service-card fade-up">
                <div className="service-emoji">{s.emoji}</div>
                <div className="service-title">{s.title}</div>
                <div className="service-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DAY TIMELINE */}
      <section className="section day" id="day">
        <div className="section-inner">
          <p className="section-label fade-up">Типичный день</p>
          <h2 className="section-title fade-up">Как проходит ваш день<br />на «Рейд Паллада»</h2>
          <p className="section-desc fade-up">Никакого расписания — только то, что хочется вам.</p>
          <div className="timeline fade-up">
            {[
              { time: "07:00", title: "Рассвет над морем", desc: "Открываете дверь домика — море в 50 метрах. Кофе на веранде, звук волн, никаких будильников." },
              { time: "08:30", title: "Первое купание", desc: "Тёплая вода, чистый пляж — только ваши гости." },
              { time: "14:00", title: "Мангал и обед на воздухе", desc: "Свежая рыба или мясо, холодное пиво, тень от сосны. Время замедляется." },
              { time: "19:00", title: "Баня + море", desc: "Выходите из бани — и сразу в море. Один из лучших контрастов в жизни." },
              { time: "21:00", title: "Закат и звёзды", desc: "Красный закат над Японским морем. Затем звёздное небо без засветки городов. Тишина." },
            ].map((item) => (
              <div key={item.time} className="timeline-item">
                <div className="timeline-time">{item.time}</div>
                <div className="timeline-dot" />
                <div className="timeline-text">
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="section reviews">
        <div className="section-inner">
          <p className="section-label fade-up">Отзывы гостей</p>
          <h2 className="section-title fade-up">Те, кто уже был —<br />возвращаются снова</h2>
          <div className="reviews-grid">
            {[
              { initials: "АП", color: "var(--color-primary)", name: "Александр Петров", city: "Владивосток · июль 2025", text: "«Приехали на 3 дня — остались на неделю. Место затягивает. Тишина, море, баня — всё на месте. Уже планируем следующий сезон.»" },
              { initials: "МС", color: "var(--color-accent)", name: "Марина Сергеева", city: "Хабаровск · август 2025", text: "«Лучший семейный отдых за 5 лет. Детям было раздолье на пляже, муж рыбачил, я — на SUP. Хозяева очень приветливые.»" },
              { initials: "ДК", color: "#2d8a6e", name: "Дмитрий Козлов", city: "Уссурийск · август 2025", text: "«Коса Назимова — открытие года. Такого чистого моря в Приморье я не видел. Закаты фантастические. Обязательно вернёмся.»" },
            ].map((r) => (
              <div key={r.name} className="review-card fade-up">
                <div className="review-stars">★★★★★</div>
                <p className="review-text">{r.text}</p>
                <div className="review-author">
                  <div className="review-avatar" style={{ background: r.color }}>{r.initials}</div>
                  <div>
                    <div className="review-name">{r.name}</div>
                    <div className="review-city">{r.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section pricing" id="pricing">
        <div className="section-inner">
          <p className="section-label fade-up">Стоимость</p>
          <h2 className="section-title fade-up">Выберите свой формат</h2>
          <p className="section-desc fade-up">Прозрачные цены без скрытых доплат. Все тарифы включают пляж, парковку и территорию базы.</p>
          <div className="pricing-grid">
            <div className="price-card fade-up">
              <div className="price-name">Базовый</div>
              <div className="price-desc">3–4 человека, включая детей</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "14px 0" }}>
                {[
                  { period: "1 — 15 июля", price: "3 000 ₽" },
                  { period: "15 июля — 25 авг.", price: "4 200 ₽" },
                  { period: "25 авг. — сентябрь", price: "3 000 ₽" },
                ].map(({ period, price }) => (
                  <div key={period} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "6px 10px", background: "rgba(255,255,255,0.07)", borderRadius: 8 }}>
                    <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.3 }}>{period}</span>
                    <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-gold)", whiteSpace: "nowrap" }}>{price}</span>
                  </div>
                ))}
              </div>
              <div className="price-per" style={{ marginBottom: 14 }}>за домик / сутки</div>
              <div className="price-features">
                {["Уютный домик с бельём", "Мангальная зона", "Большая закрытая веранда"].map((f) => (
                  <div key={f} className="price-feature">{f}</div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
                {galleries.basic.slice(0, 4).map((p, i) => (
                  <div key={p.id} onClick={() => openGallery("basic", i)} style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden", cursor: "pointer", border: "2px solid rgba(255,255,255,0.25)", flexShrink: 0, position: "relative", background: "#000" }}>
                    {p.media_type === "video" ? <><img src={p.thumbnail || ""} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}><span style={{ fontSize: "0.9rem" }}>▶</span></div></> : <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    {i === 3 && galleries.basic.length > 4 && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.8rem" }}>+{galleries.basic.length - 4}</div>}
                  </div>
                ))}
                <div onClick={() => openUpload("basic")} style={{ width: 48, height: 48, borderRadius: 8, border: "1.5px dashed rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.7)", fontSize: "1.4rem", flexShrink: 0 }}>+</div>
              </div>
            </div>
            <div
              className="price-card best fade-up"
              style={{ position: "relative", overflow: "hidden", cursor: "default" }}
            >
              {/* Фон — первое фото из галереи или дефолтное */}
              <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${galleries.sea[0]?.url || "https://cdn.poehali.dev/projects/d0b8e08e-3e07-463e-9b80-7ee7ed755aa5/bucket/e29416ee-3932-4c25-af80-2f7234362e42.jpg"})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.78) 100%)" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div className="price-name">Морской</div>
                <div className="price-desc">3–4 человека, включая детей</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "12px 0" }}>
                  {[
                    { period: "1 — 15 июля", price: "3 500 ₽" },
                    { period: "15 июля — 25 авг.", price: "5 000 ₽" },
                    { period: "25 авг. — сентябрь", price: "3 500 ₽" },
                  ].map(({ period, price }) => (
                    <div key={period} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "5px 10px", background: "rgba(255,255,255,0.12)", borderRadius: 8 }}>
                      <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.3 }}>{period}</span>
                      <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--color-gold)", whiteSpace: "nowrap" }}>{price}</span>
                    </div>
                  ))}
                </div>
                <div className="price-per" style={{ marginBottom: 12 }}>за домик / сутки</div>
                <div className="price-features">
                  {["Уютный домик с бельём", "Холодильник, вентилятор", "Вид на море", "Теневой навес", "Мангальная зона"].map((f) => (
                    <div key={f} className="price-feature">{f}</div>
                  ))}
                </div>

                {/* Галерея миниатюр */}
                <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
                  {galleries.sea.slice(0, 4).map((p, i) => (
                    <div key={p.id} onClick={() => openGallery("sea", i)} style={{ width: 52, height: 52, borderRadius: 8, overflow: "hidden", cursor: "pointer", border: "2px solid rgba(255,255,255,0.3)", flexShrink: 0, position: "relative", background: "#000" }}>
                      {p.media_type === "video"
                        ? <>
                            {p.thumbnail
                              ? <img src={p.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", fontSize: "1.4rem" }}>▶</div>
                            }
                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
                              <span style={{ fontSize: "1rem" }}>▶</span>
                            </div>
                          </>
                        : <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      }
                      {i === 3 && galleries.sea.length > 4 && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.85rem" }}>+{galleries.sea.length - 4}</div>
                      )}
                    </div>
                  ))}

                </div>
              </div>
            </div>
            <div className="price-card fade-up" style={{ position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: `url(https://cdn.poehali.dev/projects/d0b8e08e-3e07-463e-9b80-7ee7ed755aa5/bucket/9a4e94da-eccc-4392-9e1d-2b3729159efb.PNG)`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.82) 100%)" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
              <div className="price-name">Мини комфорт<br/><span style={{ fontSize: "0.7em", fontWeight: 400, opacity: 0.7 }}>вторая линия</span></div>
              <div className="price-desc">3–4 человека, включая детей</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "12px 0" }}>
                {[
                  { period: "1 — 15 июля", price: "3 500 ₽" },
                  { period: "15 июля — 25 авг.", price: "5 000 ₽" },
                  { period: "25 авг. — сентябрь", price: "3 500 ₽" },
                ].map(({ period, price }) => (
                  <div key={period} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "5px 10px", background: "rgba(255,255,255,0.07)", borderRadius: 8 }}>
                    <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.3 }}>{period}</span>
                    <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--color-gold)", whiteSpace: "nowrap" }}>{price}</span>
                  </div>
                ))}
              </div>
              <div className="price-per" style={{ marginBottom: 12 }}>за домик / сутки</div>
              <div className="price-features">
                {["Уютный домик с бельём", "Холодильник, вентилятор", "Большая закрытая веранда", "Мангальная зона"].map((f) => (
                  <div key={f} className="price-feature">{f}</div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
                {galleries.comfort.slice(0, 4).map((p, i) => (
                  <div key={p.id} onClick={() => openGallery("comfort", i)} style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden", cursor: "pointer", border: "2px solid rgba(255,255,255,0.25)", flexShrink: 0, position: "relative", background: "#000" }}>
                    {p.media_type === "video" ? <><img src={p.thumbnail || ""} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}><span style={{ fontSize: "0.9rem" }}>▶</span></div></> : <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    {i === 3 && galleries.comfort.length > 4 && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.8rem" }}>+{galleries.comfort.length - 4}</div>}
                  </div>
                ))}
                <div onClick={() => openUpload("comfort")} style={{ width: 48, height: 48, borderRadius: 8, border: "1.5px dashed rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.7)", fontSize: "1.4rem", flexShrink: 0 }}>+</div>
              </div>
              </div>
            </div>
            <div className="price-card fade-up">
              <div className="price-name">Семейный</div>
              <div className="price-desc">3–4 человека, включая детей</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "12px 0" }}>
                {[
                  { period: "1 — 15 июля", price: "3 500 ₽" },
                  { period: "15 июля — 25 авг.", price: "5 000 ₽" },
                  { period: "25 авг. — сентябрь", price: "3 500 ₽" },
                ].map(({ period, price }) => (
                  <div key={period} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "5px 10px", background: "rgba(255,255,255,0.07)", borderRadius: 8 }}>
                    <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.3 }}>{period}</span>
                    <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--color-gold)", whiteSpace: "nowrap" }}>{price}</span>
                  </div>
                ))}
              </div>
              <div className="price-per" style={{ marginBottom: 12 }}>за домик / сутки</div>
              <div className="price-features">
                {["Уютный домик с бельём", "Холодильник, вентилятор", "Большая закрытая веранда", "Мангальная зона"].map((f) => (
                  <div key={f} className="price-feature">{f}</div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
                {galleries.family.slice(0, 4).map((p, i) => (
                  <div key={p.id} onClick={() => openGallery("family", i)} style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden", cursor: "pointer", border: "2px solid rgba(255,255,255,0.25)", flexShrink: 0, position: "relative", background: "#000" }}>
                    {p.media_type === "video" ? <><img src={p.thumbnail || ""} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}><span style={{ fontSize: "0.9rem" }}>▶</span></div></> : <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    {i === 3 && galleries.family.length > 4 && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.8rem" }}>+{galleries.family.length - 4}</div>}
                  </div>
                ))}
                <div onClick={() => openUpload("family")} style={{ width: 48, height: 48, borderRadius: 8, border: "1.5px dashed rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.7)", fontSize: "1.4rem", flexShrink: 0 }}>+</div>
              </div>
            </div>
          </div>
          <div className="pricing-note">
            <span>🎁 Раннее бронирование до 1 мая — скидка 15%</span>
            <span>👨‍👩‍👧‍👦 Дети до 5 лет — бесплатно</span>
          </div>
        </div>
      </section>

      {/* BOOKING */}
      <section className="cta-section" id="booking">
        <div className="cta-inner">
          <p className="cta-label">Бронирование сезон 2026</p>
          <h2 className="cta-title">Лето бронируют уже сейчас</h2>
          <p className="cta-desc">Свободных мест на август осталось мало. Оставьте заявку — перезвоним в течение 15 минут и подтвердим даты.</p>
          <div className="cta-urgency">🔥 Июль и август — почти заняты</div>
          <div className="form-wrap fade-up">
            {!formSubmitted ? (
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Ваше имя</label>
                    <input className="form-input" type="text" placeholder="Иван Иванов" required
                      value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Телефон / Telegram</label>
                    <input className="form-input" type="tel" placeholder="+7 924 000-00-00" required
                      value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Дата заезда</label>
                    <input className="form-input" type="date" min="2026-06-01" max="2026-09-30" required
                      style={{ colorScheme: "dark" }}
                      value={form.checkin} onChange={(e) => setForm({ ...form, checkin: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Дата выезда</label>
                    <input className="form-input" type="date" min="2026-06-03" max="2026-10-01" required
                      style={{ colorScheme: "dark" }}
                      value={form.checkout} onChange={(e) => setForm({ ...form, checkout: e.target.value })} />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Количество гостей и пожелания</label>
                    <input className="form-input" type="text" placeholder="2 взрослых + 1 ребёнок, хотим баню"
                      value={form.guests} onChange={(e) => setForm({ ...form, guests: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="btn-submit" disabled={!agreed}
                  style={{ opacity: agreed ? 1 : 0.4, cursor: agreed ? "pointer" : "not-allowed" }}>
                  Отправить заявку →
                </button>
                <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, cursor: "pointer" }}>
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: "var(--color-gold)", cursor: "pointer" }} />
                  <span className="form-note" style={{ margin: 0 }}>
                    Я согласен на <a href="/privacy" target="_blank" style={{ color: "var(--color-gold)", textDecoration: "underline" }}>обработку персональных данных</a>
                  </span>
                </label>
              </form>
            ) : (
              <div style={{ textAlign: "center", padding: "var(--space-8)" }}>
                <div style={{ fontSize: "3rem", marginBottom: "var(--space-4)" }}>🎉</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", color: "#fff", marginBottom: "var(--space-3)" }}>
                  Заявка принята!
                </h3>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "var(--text-sm)" }}>
                  Спасибо! Мы свяжемся с вами в ближайшее время.
                </p>
                <button onClick={() => setFormSubmitted(false)}
                  style={{ marginTop: "var(--space-5)", color: "var(--color-gold)", fontSize: "var(--text-sm)", textDecoration: "underline" }}>
                  Отправить ещё одну заявку
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* LOCATION */}
      <section className="section location" id="location">
        <div className="section-inner">
          <p className="section-label fade-up">Как добраться</p>
          <h2 className="section-title fade-up">Найти нас просто</h2>
          <div className="location-grid">
            <div className="location-info fade-up">
              {[
                { icon: "📍", title: "Адрес", desc: "Приморский край, Хасанский район, коса Назимова, база отдыха «Рейд Паллада»" },
                { icon: "🚗", title: "На автомобиле", desc: "Из Владивостока по трассе А-189 — около 4 часов. Навигатор ведёт до ворот базы." },
                { icon: "⏰", title: "Сезон работы", desc: "Июнь — сентябрь 2026\nЗаезд с 14:00, выезд до 12:00" },
              ].map((item) => (
                <div key={item.title} className="location-item">
                  <div className="location-icon">{item.icon}</div>
                  <div>
                    <div className="location-item-title">{item.title}</div>
                    <div className="location-item-desc" style={{ whiteSpace: "pre-line" }}>{item.desc}</div>
                  </div>
                </div>
              ))}
              <div className="location-item">
                <div className="location-icon">📞</div>
                <div>
                  <div className="location-item-title">Телефон</div>
                  <div className="location-item-desc">
                    Max: <a href="tel:+79084418382" style={{ color: "var(--color-gold)", textDecoration: "none", fontWeight: 600 }}>+7 (908) 441-83-82</a>
                    <br />WhatsApp / Telegram
                  </div>
                </div>
              </div>
            </div>
            <div className="map-wrap fade-up">
              <iframe
                src="https://yandex.ru/map-widget/v1/?ll=130.77148%2C42.598977&z=15&pt=130.77148%2C42.598977,pm2rdm~%D0%A0%D0%B5%D0%B9%D0%B4%20%D0%9F%D0%B0%D0%BB%D0%BB%D0%B0%D0%B4%D0%B0&mode=whatshere"
                width="100%"
                height="400"
                style={{ border: "none", borderRadius: 12, display: "block" }}
                allowFullScreen
                title="Карта — база отдыха Рейд Паллада"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-logo">Рейд <span>Паллада</span></div>
        <div className="footer-copy">© 2026 База отдыха «Рейд Паллада»<br />Коса Назимова, Хасанский район</div>
        <div className="footer-contacts">
          <div className="footer-contact">☎️ +7 (XXX) XXX-XX-XX</div>
          <div className="footer-contact">✈️ Telegram / WhatsApp</div>
          <div className="footer-contact">✉️ info@reid-pallada.ru</div>
        </div>
      </footer>

      {/* FLOAT BTNS */}
      <div className="float-btns">
        <a
          href="https://t.me/Reid_pallada_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="tg-btn"
          aria-label="Написать в Telegram"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.944 2.338a1.5 1.5 0 0 0-1.536-.207L2.604 9.287a1.5 1.5 0 0 0 .104 2.794l3.994 1.278 1.795 5.54a1.5 1.5 0 0 0 2.495.577l2.24-2.39 3.863 2.898a1.5 1.5 0 0 0 2.348-1.01L22.494 3.82a1.5 1.5 0 0 0-.55-1.482zm-8.38 11.148-1.53 1.634-.42-3.074 7.23-7.713-5.28 9.153z" fill="white"/>
          </svg>
        </a>
        <a
          href="https://wa.me/79084418382"
          target="_blank"
          rel="noopener noreferrer"
          className="wa-btn"
          aria-label="Написать в WhatsApp"
        >
          <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
          </svg>
        </a>
      </div>

      {/* STICKY BTN */}
      <button
        className={`sticky-btn${stickyVisible ? " visible" : ""}`}
        onClick={() => scrollTo("booking")}
      >
        📅 Забронировать
      </button>

      {/* GALLERY LIGHTBOX */}
      {galleryOpen && galleryPhotos.length > 0 && (
        <div onClick={() => setGalleryOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.95)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 20 }}>
          <button onClick={() => setGalleryOpen(false)} style={{ position: "absolute", top: 16, right: 16, color: "#fff", fontSize: 28, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: 600, width: "100%" }}>
            {galleryPhotos[galleryIdx]?.media_type === "video"
              ? <video key={galleryPhotos[galleryIdx]?.url} controls autoPlay playsInline style={{ width: "100%", maxHeight: "70vh", borderRadius: 12, display: "block", background: "#000" }}>
                  <source src={galleryPhotos[galleryIdx]?.url} />
                </video>
              : <img src={galleryPhotos[galleryIdx]?.url} alt="" style={{ width: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 12, display: "block" }} />
            }
            {galleryPhotos.length > 1 && (
              <>
                <button onClick={() => setGalleryIdx(i => (i - 1 + galleryPhotos.length) % galleryPhotos.length)} style={{ position: "absolute", left: -48, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 24, borderRadius: "50%", width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
                <button onClick={() => setGalleryIdx(i => (i + 1) % galleryPhotos.length)} style={{ position: "absolute", right: -48, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 24, borderRadius: "50%", width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap", justifyContent: "center" }}>
            {galleryPhotos.map((p, i) => (
              <div key={p.id} onClick={e => { e.stopPropagation(); setGalleryIdx(i); }} style={{ width: 48, height: 48, borderRadius: 6, overflow: "hidden", cursor: "pointer", border: i === galleryIdx ? "2px solid #fff" : "2px solid transparent", opacity: i === galleryIdx ? 1 : 0.6, background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {p.media_type === "video"
                  ? <div style={{ position: "relative", width: "100%", height: "100%" }}>
                      {p.thumbnail
                        ? <img src={p.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", background: "#111" }} />
                      }
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "#fff", fontSize: "1rem" }}>▶</span>
                      </div>
                    </div>
                  : <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                }
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10 }}>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>{galleryIdx + 1} / {galleryPhotos.length}</div>
            <button
              onClick={e => {
                e.stopPropagation();
                const pwd = prompt("Введите пароль для удаления:");
                if (!pwd) return;
                const photo = galleryPhotos[galleryIdx];
                fetch(GALLERY_URL, {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ password: pwd, id: photo.id }),
                }).then(r => r.json()).then(d => {
                  if (d.ok) {
                    const next = galleries[galleryCategory].filter(p => p.id !== photo.id);
                    setGalleries(prev => ({ ...prev, [galleryCategory]: next }));
                    if (next.length === 0) setGalleryOpen(false);
                    else setGalleryIdx(i => Math.min(i, next.length - 1));
                  } else {
                    alert(d.error || "Неверный пароль");
                  }
                });
              }}
              style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.5)", color: "#fca5a5", borderRadius: 8, padding: "4px 12px", fontSize: "0.8rem", cursor: "pointer" }}
            >
              Удалить
            </button>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {uploadOpen && (
        <div onClick={() => setUploadOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#1a1a2e", borderRadius: 16, padding: 28, maxWidth: 380, width: "100%", position: "relative" }}>
            <button onClick={() => setUploadOpen(false)} style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 18 }}>×</button>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#fff", marginBottom: 4 }}>Добавить фото или видео</div>
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>{{ sea: "Морской", basic: "Базовый", comfort: "Мини комфорт", family: "Семейный" }[uploadCategory]}</div>
            <input type="file" accept="image/*,video/*" onChange={e => setUploadFile(e.target.files?.[0] || null)} style={{ width: "100%", marginBottom: 12, color: "#fff", fontSize: "0.85rem" }} />
            <input type="password" placeholder="Пароль" value={uploadPassword} onChange={e => setUploadPassword(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: "0.9rem", marginBottom: 12, boxSizing: "border-box" }} />
            {uploadError && <div style={{ color: "#f87171", fontSize: "0.82rem", marginBottom: 10 }}>{uploadError}</div>}
            <button onClick={handleUpload} disabled={uploadLoading || !uploadFile || !uploadPassword} style={{ width: "100%", padding: "10px 0", borderRadius: 10, background: "var(--color-gold, #d4a017)", color: "#000", fontWeight: 700, fontSize: "0.95rem", border: "none", cursor: uploadLoading ? "wait" : "pointer", opacity: (!uploadFile || !uploadPassword) ? 0.5 : 1 }}>
              {uploadLoading ? "Загрузка..." : "Загрузить"}
            </button>
          </div>
        </div>
      )}

      {/* SEA CARD PHOTO MODAL */}
      {seaCardModalOpen && (
        <div
          onClick={() => setSeaCardModalOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.9)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: 480, width: "100%" }}>
            <button
              onClick={() => setSeaCardModalOpen(false)}
              style={{
                position: "absolute", top: -44, right: 0, zIndex: 1,
                color: "#fff", fontSize: 28, lineHeight: 1,
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "50%", width: 36, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >×</button>
            <img
              src="https://cdn.poehali.dev/projects/d0b8e08e-3e07-463e-9b80-7ee7ed755aa5/bucket/e29416ee-3932-4c25-af80-2f7234362e42.jpg"
              alt="Вид из домика на море"
              style={{ width: "100%", borderRadius: 16, display: "block" }}
            />
            <div style={{ textAlign: "center", marginTop: 12, color: "rgba(255,255,255,0.7)", fontSize: "0.9rem" }}>Вид из окна домика «Морской»</div>
          </div>
        </div>
      )}

      {/* VIDEO MODAL */}
      {videoModalOpen && (
        <div
          onClick={() => setVideoModalOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "var(--space-8)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative", width: "100%", maxWidth: "60vw", maxHeight: "60vh" }}
          >
            <button
              onClick={() => setVideoModalOpen(false)}
              style={{
                position: "absolute", top: -44, right: 0, zIndex: 1,
                color: "#fff", fontSize: 28, lineHeight: 1,
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "50%", width: 36, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
              aria-label="Закрыть"
            >
              ×
            </button>
            <video
              autoPlay
              controls
              playsInline
              style={{ width: "100%", maxHeight: "60vh", borderRadius: "var(--radius-xl)", display: "block" }}
            >
              <source src="https://cdn.poehali.dev/projects/d0b8e08e-3e07-463e-9b80-7ee7ed755aa5/bucket/7b56cf49-4bec-455b-9504-6494ba64f395.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      )}
    </>
  );
}