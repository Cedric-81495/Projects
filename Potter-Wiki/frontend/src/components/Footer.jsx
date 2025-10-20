// frontend/src/components/Footer.jsx
const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-[#1a1a1a] via-[#0B0B0B] to-[#000000] text-amber-100 py-8 shadow-inner font-serif">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
        <p className="text-sm">
          © {new Date().getFullYear()} <span className="text-amber-300 font-semibold">Potter Wiki</span>. All rights reserved.
        </p>
        <p className="text-xs max-w-xl leading-relaxed text-amber-200">
          The Potter Wiki is an unofficial Harry Potter fansite. HARRY POTTER, characters, names, and all related indicia are trademarks of Warner Bros. This site is not affiliated with J.K. Rowling or Warner Bros.
        </p>
      </div>
    </footer>
  );
};

export default Footer;