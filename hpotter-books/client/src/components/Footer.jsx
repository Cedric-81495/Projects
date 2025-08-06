export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white mt-12 p-6 text-center">
      <p>&copy; {new Date().getFullYear()} Lorey Nexus. All rights reserved.</p>
      <p className="mt-2">
        <a href="mailto:contact@loreynexus.com" className="hover:text-yellow-300">contact@loreynexus.com</a>
      </p>
      <p className="mt-2">Follow us on
        <a href="#" className="ml-2 hover:text-yellow-300">Twitter</a> |
        <a href="#" className="ml-2 hover:text-yellow-300">Facebook</a> |
        <a href="#" className="ml-2 hover:text-yellow-300">Instagram</a>
      </p>
    </footer>
  );
}
