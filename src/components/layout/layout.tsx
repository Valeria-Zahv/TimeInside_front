import React from "react";
import { Header } from "../header/Header";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default Layout;
