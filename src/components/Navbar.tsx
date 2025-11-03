import Logo from "./Brand";
import LoginButton from "./LoginButton";
import ThemeSwitcher from "./ThemeSwitcher";

export default function Navbar() {
  return (
    <header className="">
      <nav className="screen-container flex items-center justify-between py-4">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LoginButton name="Login" />
        </div>
      </nav>
    </header>
  );
}
