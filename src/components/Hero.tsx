import LoginButton from "./LoginButton";

export default function Hero({ userId }: { userId: string | null }) {
  return (
    <div className="max-w-2xl mx-auto text-center py-20 space-y-6">
      <p className="text-xs font-semibold tracking-wider text-transparent bg-linear-to-r from-cyan-600 via-orange-400 to-violet-800 bg-clip-text">
        BUILT FOR DEVELOPERS
      </p>
      <h1 className="text-5xl font-bold">Your Documentation Knowledge Base</h1>
      <p className="text-lg text-muted-foreground">
        No more time wasted on searching through Docs. Crawl any doc site, ask
        questions, and get instant answers.
      </p>
      <LoginButton name="Try it now" width={100} userId={userId} />
    </div>
  );
}
