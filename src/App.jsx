import React, { useState, useEffect, useCallback } from "react";

const App = () => {
  const [text, setText] = useState("소용돌이 텍스트 아트 생성기");
  const [radius, setRadius] = useState(12);
  const [rotations, setRotations] = useState(2.5); // 회전수
  const [density, setDensity] = useState(2.1); // 높을수록 촘촘
  const [result, setResult] = useState("");
  const [copyStatus, setCopyStatus] = useState("복사하기");

  const generateSpiral = useCallback(() => {
    const cleanText = [...text.replace(/\s/g, "")];

    if (cleanText.length === 0) {
      setResult("텍스트를 입력해주세요.");
      return;
    }

    const size = radius * 2 + 1;
    const center = Math.floor(size / 2);
    const empty = "　";

    const grid = Array.from({ length: size }, () => Array(size).fill(empty));
    const inBounds = (x, y) => y >= 0 && y < size && x >= 0 && x < size;

    const candidatePath = [];
    const candidateSet = new Set();
    const turns = Math.max(1, rotations);
    const thetaMax = turns * 2 * Math.PI;
    const sampleCount = Math.max(cleanText.length * 120, 5000);

    for (let i = 0; i < sampleCount; i++) {
      const t = sampleCount === 1 ? 0 : i / (sampleCount - 1);
      const theta = thetaMax * t;
      const radiusProgress = 1 - t;
      const currentRadius = Math.max(
        0.6,
        radius * Math.pow(radiusProgress, 0.88),
      );
      const angle = theta - Math.PI / 2;

      const x = Math.round(center + currentRadius * Math.cos(angle));
      const y = Math.round(center + currentRadius * Math.sin(angle));

      if (!inBounds(x, y)) {
        continue;
      }

      const key = `${x},${y}`;
      if (!candidateSet.has(key)) {
        candidateSet.add(key);
        candidatePath.push([x, y]);
      }
    }

    const spiralPath = [];
    const spiralSet = new Set();
    const minDistance = 1.6 - density * 0.32;
    let lastPoint = null;

    for (const [x, y] of candidatePath) {
      if (!lastPoint) {
        spiralPath.push([x, y]);
        spiralSet.add(`${x},${y}`);
        lastPoint = [x, y];
        continue;
      }

      const dx = x - lastPoint[0];
      const dy = y - lastPoint[1];
      if (Math.hypot(dx, dy) >= minDistance) {
        spiralPath.push([x, y]);
        spiralSet.add(`${x},${y}`);
        lastPoint = [x, y];
      }
    }

    if (spiralPath.length < cleanText.length) {
      for (const [x, y] of candidatePath) {
        if (spiralPath.length >= cleanText.length) {
          break;
        }
        const key = `${x},${y}`;
        if (!spiralSet.has(key)) {
          spiralSet.add(key);
          spiralPath.push([x, y]);
        }
      }
    }

    let charIndex = 0;
    for (const [x, y] of spiralPath) {
      if (charIndex >= cleanText.length) {
        break;
      }
      grid[y][x] = cleanText[charIndex];
      charIndex += 1;
    }

    if (charIndex < cleanText.length) {
      for (let y = 0; y < size && charIndex < cleanText.length; y++) {
        for (let x = 0; x < size && charIndex < cleanText.length; x++) {
          if (grid[y][x] === empty) {
            grid[y][x] = cleanText[charIndex];
            charIndex += 1;
          }
        }
      }
    }

    // 위아래 빈 줄 제거
    let lines = grid.map((row) => row.join(""));

    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();

    // 좌우 여백도 어느 정도 잘라줌
    let minLeft = Infinity;
    let maxRight = -1;

    for (const line of lines) {
      let left = 0;
      while (left < line.length && line[left] === empty) left++;

      let right = line.length - 1;
      while (right >= 0 && line[right] === empty) right--;

      if (left <= right) {
        minLeft = Math.min(minLeft, left);
        maxRight = Math.max(maxRight, right);
      }
    }

    if (minLeft !== Infinity && maxRight !== -1) {
      const trimPad = 1;
      const leftBound = Math.max(0, minLeft - trimPad);
      const rightBound = Math.min(size - 1, maxRight + trimPad);
      lines = lines.map((line) => line.slice(leftBound, rightBound + 1));
    }

    setResult(lines.join("\n"));
  }, [text, radius, rotations, density]);

  useEffect(() => {
    generateSpiral();
  }, [generateSpiral]);

  const handleCopy = () => {
    const textArea = document.createElement("textarea");
    textArea.value = result;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      setCopyStatus("복사 완료!");
      setTimeout(() => setCopyStatus("복사하기"), 2000);
    } catch (err) {
      setCopyStatus("실패");
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col items-center font-sans">
      <div className="max-w-xl w-full bg-slate-800 p-6 rounded-2xl shadow-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            소용돌이 텍스트 생성기
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            밖에서 안으로 말려들어가는 텍스트 아트
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              문구 입력
            </label>
            <textarea
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition"
              rows="3"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                크기 (반지름): {radius}
              </label>
              <input
                type="range"
                min="5"
                max="25"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                회전수: {rotations}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={rotations}
                onChange={(e) => setRotations(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                밀도: {density.toFixed(1)}
              </label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={density}
                onChange={(e) => setDensity(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20"
          >
            {copyStatus}
          </button>

          <a
            href="/infinite-spiral.html"
            target="_blank"
            rel="noreferrer"
            className="block w-full text-center py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold text-sm transition"
          >
            무한 확장 소용돌이 페이지 열기
          </a>
        </div>

        <div className="relative group">
          <label className="block text-sm font-medium text-slate-300 mb-2 text-center">
            결과 미리보기 (복사해서 사용하세요)
          </label>
          <div className="bg-black/40 rounded-xl p-6 border border-slate-700 overflow-auto flex justify-center">
            <pre
              id="spiral-output"
              className="font-mono text-cyan-400 leading-[1.15] tracking-[0.12em] text-sm md:text-base select-all"
              style={{
                fontFamily: '"Courier New", "돋움체", Dotum, monospace',
              }}
            >
              {result}
            </pre>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 bg-black/20 p-3 rounded-lg">
          <p>
            • <strong>팁:</strong> 글자 수가 적으면 소용돌이가 잘 안 보입니다.
            문구를 더 길게 쓰거나 회전수를 조절해 보세요.
          </p>
          <p className="mt-1">
            • 전각 공백을 사용해 모바일에서도 원형이 잘 유지됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
