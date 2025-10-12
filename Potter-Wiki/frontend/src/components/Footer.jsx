const Footer = () => {
  return (
    <footer className="bg-navbar text-gray-300 py-6 mt-12 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-center md:text-left">
          © {new Date().getFullYear()} Potter Wiki. All rights reserved.
        </p>
        <div className="flex gap-4 text-sm">
          <p>The Potter Wiki is an unofficial Harry Potter fansite. HARRY POTTER, characters, names, and all related indicia are trademarks of Warner Bros.</p>
        </div>
      </div>
    </footer>
  
  );
};

export default Footer;