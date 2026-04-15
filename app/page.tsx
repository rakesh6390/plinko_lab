import PlinkoBoard from "@/components/Board";
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 text-white p-10">
      <h1 className="text-3xl font-bold text-center mb-6">Plinko Lab</h1>

      <PlinkoBoard />
    </main>
  );
}
