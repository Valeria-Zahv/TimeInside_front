import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendar,
  faUserCircle,
  faScrewdriverWrench,
} from "@fortawesome/free-solid-svg-icons";
import { useStores } from "../../stores/useStores";
import "./Header.css";

export const Header = observer(() => {
  const { authStore } = useStores();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  if (!authStore.isAuthenticated) return null;

  return (
    <header className="flex shadow-md py-4 px-4 sm:px-10 bg-white min-h-[70px] tracking-wide relative z-50">
      <div className="flex flex-wrap items-center justify-between gap-5 w-full">
        <Link to="/" className="max-sm:hidden">
          <img src="/logo.png" alt="logo" className="w-15" />
        </Link>
        <Link to="/" className="hidden max-sm:block">
          <img src="/logo.png" alt="logo" className="w-15" />
        </Link>

        <div
          ref={menuRef}
          id="collapseMenu"
          className={`${
            menuOpen ? "block" : "hidden"
          } max-lg:fixed  max-lg:bg-white max-lg:w-1/2 max-lg:min-w-[300px] max-lg:top-0 max-lg:left-0 max-lg:p-6 max-lg:h-full max-lg:shadow-md max-lg:overflow-auto z-50 lg:block`}
        >
          <ul className="lg:flex mt-30 *:gap-x-5 max-lg:space-y-3">
            <li className="mb-6 hidden max-lg:block">
              <Link to="/" onClick={() => setMenuOpen(false)}>
                <img src="/logo.png" alt="logo" className="w-25" />
              </Link>
            </li>
            <li className="max-lg:border-b max-lg:border-gray-300 max-lg:py-3 px-3">
              <Link
                to="/calendar"
                className="hover:text-blue-700 text-blue-700 font-medium text-[15px] block"
                onClick={() => setMenuOpen(false)}
              >
                <FontAwesomeIcon icon={faCalendar} className="mr-3" />
                Календарь
              </Link>
            </li>
            <li className="max-lg:border-b max-lg:border-gray-300 max-lg:py-3 px-3">
              <Link
                to="/profile"
                className="hover:text-blue-700 text-slate-900 block font-medium text-[15px]"
                onClick={() => setMenuOpen(false)}
              >
                <FontAwesomeIcon icon={faUserCircle} className="mr-3" />
                {authStore.user ? authStore.user.username : ""}
              </Link>
            </li>
            {authStore.user && authStore.user.is_superuser && (
              <li className="max-lg:border-b max-lg:border-gray-300 max-lg:py-3 px-3">
                <Link
                  to="/admin"
                  className="hover:text-blue-700 text-slate-900 block font-medium text-[15px]"
                  onClick={() => setMenuOpen(false)}
                >
                  <FontAwesomeIcon
                    icon={faScrewdriverWrench}
                    className="mr-3"
                  />
                  Админ панель
                </Link>
              </li>
            )}
            {authStore.isAuthenticated && authStore.user && (
              <button
                onClick={() => authStore.logout()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 transition transform hover:scale-105"
              >
                <LogOut size={18} />
                Выйти
              </button>
            )}
          </ul>
        </div>

        <div className="flex max-lg:ml-auto items-center space-x-4">
          <button
            id="toggleOpen"
            className="lg:hidden cursor-pointer"
            onClick={() => setMenuOpen(true)}
          >
            <svg
              className="w-7 h-7"
              fill="#000"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
});
