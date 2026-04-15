"use client";

import { useEffect, useRef, useState } from "react";

export default function Board() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [ballX, setBallX] = useState<number | null>(null);
  const [ballY, setBallY] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [balls, setBalls] = useState(5);
  const [bet] = useState(1);
  const [balance, setBalance] = useState(100);
  const [totalWin, setTotalWin] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const width = 500;
  const height = 600;

  const rows = 12;
  const spacing = 30;

  const multipliers = [0.2, 0.5, 0.8, 1, 1.5, 3, 5, 3, 1.5, 1, 0.8, 0.5, 0.2];

  const drawBoard = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "white";

    for (let r = 0; r < rows; r++) {
      const pegs = r + 1;
      const rowWidth = pegs * spacing;

      for (let p = 0; p < pegs; p++) {
        const x = width / 2 - rowWidth / 2 + p * spacing + spacing / 2;
        const y = 80 + r * spacing;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const drawBins = (ctx: CanvasRenderingContext2D) => {
    const binCount = 13;
    const binWidth = width / binCount;
    const binY = 520;

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;

    for (let i = 0; i <= binCount; i++) {
      const x = i * binWidth;

      ctx.beginPath();
      ctx.moveTo(x, binY);
      ctx.lineTo(x, binY + 40);
      ctx.stroke();
    }

    ctx.fillStyle = "orange";
    ctx.font = "12px Arial";

    for (let i = 0; i < multipliers.length; i++) {
      ctx.fillText(
        multipliers[i] + "x",
        i * binWidth + binWidth / 3,
        binY + 55,
      );
    }
  };

  const highlightBin = (binIndex: number) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const binCount = 13;
    const binWidth = width / binCount;
    const binY = 520;

    ctx.fillStyle = "rgba(0,255,0,0.4)";
    ctx.fillRect(binIndex * binWidth, binY, binWidth, 40);
  };

  const drawBall = (ctx: CanvasRenderingContext2D) => {
    if (ballX === null || ballY === null) return;

    ctx.fillStyle = "red";

    ctx.beginPath();
    ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
    ctx.fill();
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    canvas.width = width;
    canvas.height = height;

    drawBoard(ctx);
    drawBins(ctx);
    drawBall(ctx);
  }, [ballX, ballY]);

  const dropSingleBall = async () => {
    const commitRes = await fetch("/api/rounds/commit", {
      method: "POST",
    });

    if (!commitRes.ok) {
      const message = await readApiError(commitRes);
      throw new Error(message);
    }

    const commit = await commitRes.json();
    const roundId = commit.roundId;

    const startRes = await fetch(`/api/rounds/${roundId}/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientSeed: "candidate-hello",
        betCents: 100,
        dropColumn: 6,
      }),
    });

    if (!startRes.ok) {
      const message = await readApiError(startRes);
      throw new Error(message);
    }

    const start = await startRes.json();

    const path = start.pathJson;
    const binIndex = start.binIndex;

    return new Promise<void>((resolve) => {
      animatePath(path, binIndex, resolve);
    });
  };

  const dropBalls = async () => {
    if (playing) return;

    setPlaying(true);
    setError(null);
    setTotalWin(0);

    const cost = bet * balls;
    setBalance((prev) => prev - cost);

    try {
      for (let i = 0; i < balls; i++) {
        await dropSingleBall();
        await new Promise((r) => setTimeout(r, 400));
      }

      setShowResult(true);
    } catch (err) {
      setBalance((prev) => prev + cost);
      setError(err instanceof Error ? err.message : "Unable to play round.");
    } finally {
      setPlaying(false);
    }
  };

  const animatePath = (path: string[], binIndex: number, done: () => void) => {
    let pos = 0;
    let x = width / 2;
    let y = 60;

    setBallX(x);
    setBallY(y);

    const step = () => {
      if (pos >= path.length) {
        const finalY = y + 90;
        let progress = 0;

        const drop = setInterval(() => {
          progress += 0.08;

          const newY = y + (finalY - y) * progress;
          setBallY(newY);

          if (progress >= 1) {
            clearInterval(drop);

            highlightBin(binIndex);

            const multiplier = multipliers[binIndex];
            const win = bet * multiplier;

            setTotalWin((prev) => prev + win);
            setBalance((prev) => prev + win);

            done();
          }
        }, 16);

        return;
      }

      const dir = path[pos];

      const targetX = dir === "L" ? x - spacing / 2 : x + spacing / 2;

      const targetY = y + spacing;

      let progress = 0;

      const anim = setInterval(() => {
        progress += 0.08;

        const newX = x + (targetX - x) * progress;
        const newY = y + (targetY - y) * progress;

        setBallX(newX);
        setBallY(newY);

        if (progress >= 1) {
          clearInterval(anim);

          x = targetX;
          y = targetY;

          pos++;

          setTimeout(step, 40);
        }
      }, 16);
    };

    step();
  };
  return (
    <div className="flex flex-col items-center gap-4 mt-10">
      <div className="text-white text-lg">Balance: ${balance.toFixed(2)}</div>

      <canvas ref={canvasRef} className="bg-black rounded-xl shadow-lg" />

      <div className="text-green-400 text-lg">
        Total Win: ${totalWin.toFixed(2)}
      </div>

      {error && (
        <div className="max-w-md text-center text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={() => setBalls((b) => Math.max(1, b - 1))}
          className="w-10 h-10 bg-blue-600 text-white rounded-md text-xl hover:bg-blue-700"
        >
          -
        </button>

        <div className="text-white text-lg">BALLS {balls}</div>

        <button
          onClick={() => setBalls((b) => Math.min(20, b + 1))}
          className="w-10 h-10 bg-blue-600 text-white rounded-md text-xl hover:bg-blue-700"
        >
          +
        </button>
      </div>

      <button
        onClick={dropBalls}
        disabled={playing}
        className="w-56 h-14 text-xl font-bold text-white rounded-xl bg-gradient-to-r from-green-400 to-green-600 hover:scale-105 transition shadow-lg"
      >
        PLAY
      </button>

      {showResult && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e293b] p-8 rounded-xl text-center shadow-xl">
            <h2 className="text-white text-2xl mb-4">Round Complete</h2>

            <p className="text-green-400 text-xl">
              Total Win: ${totalWin.toFixed(2)}
            </p>

            <button
              onClick={() => setShowResult(false)}
              className="mt-4 px-6 py-2 bg-green-500 rounded-lg text-white hover:bg-green-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const readApiError = async (response: Response) => {
  try {
    const body = await response.json();
    return body.error ?? "Request failed.";
  } catch {
    return "Request failed. Check the server console.";
  }
};
// end code
