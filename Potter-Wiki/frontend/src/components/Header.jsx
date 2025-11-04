// src/components/Header.jsx
import { Link } from "react-router-dom";
import PotterWikiHeader from "../assets/PotterWikiHeader.png";

export default function Header() {
  return (
    <div className="flex justify-center">
      <Link to="/">
        <img
          src={PotterWikiHeader}
          alt="Potter Wiki Logo"
          className="object-contain mx-auto"
          style={{
          width: "clamp(150px, 30vw, 300px)",
          height: "clamp(80px, 10vw, 60px)",
          filter: "brightness(1.1) contrast(1.3)",
        }}

        />
      </Link>
    </div>
  );
}
