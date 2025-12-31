import { Outlet } from "react-router-dom";
import Footer from "../Common/Footer";
import Header from "../Common/Header";
import PageWrapper from "../../pages/PageWrapper"

const UserLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-grow">
        <PageWrapper className="h-full">
          <Outlet />
        </PageWrapper>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default UserLayout;

