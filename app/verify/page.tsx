"use client";

import { useState } from "react";

type VerifyResult = {
  commitHex: string;
  combinedSeed: string;
  pegMapHash: string;
  binIndex: number;
};

export default function VerifyPage() {
  const [serverSeed, setServerSeed] = useState("");
  const [clientSeed, setClientSeed] = useState("");
  const [nonce, setNonce] = useState("");
  const [dropColumn, setDropColumn] = useState(6);

  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/verify?serverSeed=${serverSeed}&clientSeed=${clientSeed}&nonce=${nonce}&dropColumn=${dropColumn}`,
      );

      const data = await res.json();

      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 flex flex-col gap-4 max-w-xl mx-auto text-white">
      <h1 className="text-2xl font-bold">Verify Round</h1>

      <input
        placeholder="Server Seed"
        value={serverSeed}
        onChange={(e) => setServerSeed(e.target.value)}
        className="p-2 bg-gray-800 rounded"
      />

      <input
        placeholder="Client Seed"
        value={clientSeed}
        onChange={(e) => setClientSeed(e.target.value)}
        className="p-2 bg-gray-800 rounded"
      />

      <input
        placeholder="Nonce"
        value={nonce}
        onChange={(e) => setNonce(e.target.value)}
        className="p-2 bg-gray-800 rounded"
      />

      <input
        type="number"
        placeholder="Drop Column"
        value={dropColumn}
        onChange={(e) => setDropColumn(Number(e.target.value))}
        className="p-2 bg-gray-800 rounded"
      />

      <button onClick={verify} className="bg-green-500 px-4 py-2 rounded">
        {loading ? "Verifying..." : "Verify"}
      </button>

      {result && (
        <div className="bg-black p-4 rounded mt-4">
          <div>
            <strong>Commit Hash:</strong>
            <p className="break-all">{result.commitHex}</p>
          </div>

          <div className="mt-2">
            <strong>Combined Seed:</strong>
            <p className="break-all">{result.combinedSeed}</p>
          </div>

          <div className="mt-2">
            <strong>Peg Map Hash:</strong>
            <p className="break-all">{result.pegMapHash}</p>
          </div>

          <div className="mt-2">
            <strong>Bin Index:</strong> {result.binIndex}
          </div>
        </div>
      )}
    </div>
  );
}
