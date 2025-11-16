import Logo from "./Brand";
import LoginButton from "./LoginButton";
import ThemeSwitcher from "./ThemeSwitcher";

/**
 * Render the application's top navigation bar.
 *
 * Displays a header containing a navigation row with the brand logo, a theme switcher, and a login button; forwards `userId` to the login button.
 *
 * @param userId - The current user's identifier, or `null` when no user is signed in
 * @returns The header element containing the navigation bar JSX
 */
export default function Navbar({ userId }: { userId: string | null }) {
  return (
    <header className="">
      <nav className="screen-container flex items-center justify-between py-4">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LoginButton name="Login" userId={userId} />
        </div>
      </nav>
    </header>
  );
}