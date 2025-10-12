// src/components/Header.jsx
import PotterWikiHeader from "../assets/PotterWikiHeader.png";
import divCover from "../assets/divCover.png";

export default function Header() {
  return (
   <div
    className="pb-10 pt-20 w-full relative flex items-center justify-center py-4 px-4 bg-cover bg-center"
    style={{ backgroundImage: `url(${divCover})` }}
    >
      <img
        src={PotterWikiHeader}
        alt="Potter Wiki Header"
        className="max-w-full h-auto md:max-w-xl lg:max-w-2xl"
      />
    </div>
  );
}
