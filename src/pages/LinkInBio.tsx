import React, { useState } from 'react';

interface Translation {
  title: string;
  link1: string;
  link2: string;
  link3: string;
  link4: string;
  link5: string;
  link6: string;
  contact: string;
}

const translations: { [key: string]: Translation } = {
  en: {
    title: 'UpvoteThat.com Links',
    link1: '🔥 Access Traffic Platform',
    link2: '💬 Send Us A Message On Telegram',
    link3: '📕 Grab The Ebook: Be The Best Shill & Stop Losing Accounts',
    link4: '🛡️ Best Proxy Provider',
    link5: '🧑‍💻 AdsPower Browser',
    link6: '🤖 Reddit Strategy GPT (Custom Trained)',
    contact: 'Contact & Support',
  },
  zh: {
    title: 'UpvoteThat.com 传送门',
    link1: '🔥 访问流量平台',
    link2: '💬 给我们发消息（Telegram）',
    link3: '📕 获取电子书：成为最佳水军，避免账号被封',
    link4: '🛡️ 最佳代理服务商',
    link5: '🧑‍💻 AdsPower 浏览器',
    link6: '🤖 Reddit 策略 GPT（独家训练）',
    contact: '联系与支持',
  },
  ru: {
    title: 'UpvoteThat.com Ссылки',
    link1: '🔥 Доступ к платформе трафика',
    link2: '💬 Написать нам в Telegram',
    link3: '📕 Получить книгу: Как стать лучшим шиллером и не терять аккаунты',
    link4: '🛡️ Лучший прокси-провайдер',
    link5: '🧑‍💻 Браузер AdsPower',
    link6: '🤖 Reddit Strategy GPT (Спец. обучение)',
    contact: 'Контакты и поддержка',
  },
  vi: {
    title: 'UpvoteThat.com Liên kết',
    link1: '🔥 Truy cập Nền tảng Traffic',
    link2: '💬 Nhắn tin cho chúng tôi trên Telegram',
    link3: '📕 Nhận Ebook: Trở thành Shill đỉnh & Giữ tài khoản an toàn',
    link4: '🛡️ Nhà cung cấp Proxy tốt nhất',
    link5: '🧑‍💻 Trình duyệt AdsPower',
    link6: '🤖 Reddit Strategy GPT (Huấn luyện riêng)',
    contact: 'Liên hệ & Hỗ trợ',
  },
  th: {
    title: 'UpvoteThat.com ลิงก์',
    link1: '🔥 เข้าถึงแพลตฟอร์มทราฟฟิก',
    link2: '💬 ส่งข้อความหาเราทาง Telegram',
    link3: '📕 รับ Ebook: เป็น Shill ขั้นเทพ & ไม่โดนแบนบัญชี',
    link4: '🛡️ ผู้ให้บริการ Proxy ที่ดีที่สุด',
    link5: '🧑‍💻 เบราว์เซอร์ AdsPower',
    link6: '🤖 Reddit Strategy GPT (ฝึกเฉพาะทาง)',
    contact: 'ติดต่อ & ซัพพอร์ต',
  },
  es: {
    title: 'UpvoteThat.com Enlaces',
    link1: '🔥 Acceder a la Plataforma de Tráfico',
    link2: '💬 Envíanos un mensaje en Telegram',
    link3: '📕 Consigue el Ebook: Sé el mejor Shill y no pierdas cuentas',
    link4: '🛡️ Mejor proveedor de proxy',
    link5: '🧑‍💻 Navegador AdsPower',
    link6: '🤖 Reddit Strategy GPT (Entrenado)',
    contact: 'Contacto y Soporte',
  },
  ar: {
    title: 'روابط UpvoteThat.com',
    link1: '🔥 الوصول إلى منصة الترافيك',
    link2: '💬 أرسل لنا رسالة على تيليجرام',
    link3: '📕 احصل على الكتاب الإلكتروني: كن أفضل شيل ولا تخسر الحسابات',
    link4: '🛡️ أفضل مزود بروكسي',
    link5: '🧑‍💻 متصفح AdsPower',
    link6: '🤖 Reddit Strategy GPT (مخصص)',
    contact: 'الدعم والتواصل',
  },
  fa: {
    title: 'لینک‌های UpvoteThat.com',
    link1: '🔥 دسترسی به پلتفرم ترافیک',
    link2: '💬 ارسال پیام در تلگرام',
    link3: '📕 دریافت کتاب الکترونیکی: بهترین شیل باش و اکانت از دست نده',
    link4: '🛡️ بهترین ارائه‌دهنده پراکسی',
    link5: '🧑‍💻 مرورگر AdsPower',
    link6: '🤖 Reddit Strategy GPT (سفارشی)',
    contact: 'تماس و پشتیبانی',
  },
  tr: {
    title: 'UpvoteThat.com Bağlantılar',
    link1: '🔥 Trafik Platformuna Erişim',
    link2: "💬 Telegram'da bize mesaj gönderin",
    link3: '📕 E-Kitabı Al: En İyi Shill Ol & Hesap Kaybetmeyi Durdur',
    link4: '🛡️ En İyi Proxy Sağlayıcı',
    link5: '🧑‍💻 AdsPower Tarayıcı',
    link6: '🤖 Reddit Strategy GPT (Özel Eğitilmiş)',
    contact: 'İletişim & Destek',
  },
  fr: {
    title: 'Liens UpvoteThat.com',
    link1: '🔥 Accéder à la plateforme de trafic',
    link2: '💬 Envoyez-nous un message sur Telegram',
    link3: "📕 Obtenez l'Ebook : Soyez le meilleur Shill & ne perdez plus de comptes",
    link4: '🛡️ Meilleur fournisseur de proxy',
    link5: '🧑‍💻 Navigateur AdsPower',
    link6: '🤖 Reddit Strategy GPT (Entraîné)',
    contact: 'Contact & Support',
  }
};

const languageFlags: { [key: string]: { flag: string; title: string } } = {
  en: { flag: '🇺🇸', title: 'English' },
  zh: { flag: '🇨🇳', title: '中文' },
  ru: { flag: '🇷🇺', title: 'Русский' },
  vi: { flag: '🇻🇳', title: 'Tiếng Việt' },
  th: { flag: '🇹🇭', title: 'ไทย' },
  es: { flag: '🇪🇸', title: 'Español' },
  ar: { flag: '🇸🇦', title: 'العربية' },
  fa: { flag: '🇮🇷', title: 'فارسی' },
  tr: { flag: '🇹🇷', title: 'Türkçe' },
  fr: { flag: '🇫🇷', title: 'Français' },
};

export default function LinkInBio() {
  const [currentLang, setCurrentLang] = useState('en');
  
  const currentTranslation = translations[currentLang];

  const pillLinkClass = `
    flex items-center justify-center w-full max-w-md mx-auto my-3 px-8 py-5 rounded-full 
    text-xl font-bold text-white shadow-lg transition-all duration-200 
    hover:scale-105 hover:shadow-xl active:scale-95
  `;

  const primaryGradient = "bg-gradient-to-r from-orange-500 to-orange-400";
  const blueGradient = "bg-gradient-to-r from-blue-600 to-blue-400";

  // BunnyCDN Stream URLs - using embed format for better sizing
  const bunnyStreamUrl = "https://iframe.mediadelivery.net/play/460187/ee0ee4a7-2921-49b1-bdd1-f130099c91e9"; 
  const bunnyPosterUrl = "https://vz-5083a139-4ff.b-cdn.net/ee0ee4a7-2921-49b1-bdd1-f130099c91e9/thumbnail.jpg"; 
  
  // Direct video URL for fallback (if needed)
  const directVideoUrl = "https://vz-5083a139-4ff.b-cdn.net/ee0ee4a7-2921-49b1-bdd1-f130099c91e9/play_720p.mp4";
  
  const posterUrl = bunnyPosterUrl;
  const videoUrl = bunnyStreamUrl;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-start py-10 px-4" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Language Selector */}
      <div className="flex gap-2 justify-center items-center mb-6 flex-wrap">
        {Object.entries(languageFlags).map(([lang, { flag, title }]) => (
          <button
            key={lang}
            onClick={() => setCurrentLang(lang)}
            title={title}
            className={`text-3xl transition-transform duration-150 hover:scale-110 ${
              currentLang === lang 
                ? 'scale-125 filter drop-shadow-lg' 
                : 'hover:scale-110'
            }`}
            style={currentLang === lang ? { filter: 'drop-shadow(0 0 6px #FF4500)' } : {}}
          >
            {flag}
          </button>
        ))}
      </div>

      {/* Logo */}
      <img 
        src="/black-bg-logo.png" 
        alt="UpvoteThat.com Logo" 
        className="h-24 mb-6"
      />

      {/* Title */}
      <h1 className="text-3xl font-extrabold mb-4 text-center tracking-tight text-orange-500">
        {currentTranslation.title}
      </h1>

      {/* Video Section - BunnyCDN Stream */}
      <div className="w-full max-w-2xl mx-auto mb-6 rounded-3xl overflow-hidden shadow-2xl">
        {/* Primary: HTML5 video for full size control */}
        <div className="relative aspect-video bg-black">
          <video
            controls
            poster={posterUrl}
            className="w-full h-full object-cover"
            style={{ backgroundColor: 'black' }}
            preload="metadata"
          >
            <source src={directVideoUrl} type="video/mp4" />
            {/* Fallback to iframe if video fails */}
            <iframe
              src={videoUrl}
              className="absolute inset-0 w-full h-full"
              style={{
                border: 'none',
                backgroundColor: 'black'
              }}
              allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
              allowFullScreen
            />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      {/* Main Links */}
      <div className="w-full flex flex-col items-center space-y-1">
        <a 
          href="https://www.UpvoteThat.com/auth" 
          className={`${pillLinkClass} ${primaryGradient}`}
        >
          {currentTranslation.link1}
        </a>
        
        <a 
          href="#" 
          className={`${pillLinkClass} ${primaryGradient}`}
        >
          {currentTranslation.link3}
        </a>
        
        <a 
          href="https://thesocialproxy.com/?ref=ben@rootaccess.design&campaign=linkinbio" 
          className={`${pillLinkClass} ${primaryGradient}`}
        >
          {currentTranslation.link4}
        </a>
        
        <a 
          href="#" 
          className={`${pillLinkClass} ${primaryGradient}`}
        >
          {currentTranslation.link5}
        </a>
        
        <a 
          href="#" 
          className={`${pillLinkClass} ${primaryGradient}`}
        >
          {currentTranslation.link6}
        </a>
      </div>

      {/* Contact Section */}
      <div className="w-full flex flex-col items-center mt-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-400">
          {currentTranslation.contact}
        </h2>
        
        <a 
          href="https://t.me/upvotethat" 
          className={`${pillLinkClass} ${blueGradient}`}
        >
          {currentTranslation.link2}
        </a>
      </div>

      {/* Footer */}
      <footer className="mt-10 text-gray-400 text-sm text-center">
        &copy; 2025 UpvoteThat.com. All rights reserved.
      </footer>
    </div>
  );
} 