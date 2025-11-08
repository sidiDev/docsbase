import Brand from "@/components/Brand";

export default function Onboarding() {
  return (
    <div className="p-4">
      <div className="text-center">
        <Brand noLink={true} />
        <h1 className="text-xl mt-4">Welcome! Let's get you set up.</h1>
      </div>
    </div>
  );
}
