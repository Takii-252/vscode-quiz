# フロント担当向けハンドオフ資料（VS Code Shortcut Quiz）

この資料は、現行バックエンド実装（FastAPI）にフロントを接続するための実務向けガイドです。

## 1. 接続先と前提

- API Base URL（ローカル）: `http://127.0.0.1:8000`
- CORS: 全許可（開発向け）
- レスポンスは `application/json`
- OS指定は必ず `mac` または `windows`
- フロントはデフォルトで相対パス（`/api`）を利用し、Vite proxy 経由で `127.0.0.1:8000` に接続
- バックエンドを別ホストに置く場合は `frontend/.env` に `VITE_API_BASE_URL=http://<backend-host>:8000` を設定

## 2. 先に使うAPI（最短フロー）

1. 問題取得: `GET /api/questions/next`
2. 回答判定: `POST /api/questions/judge`
3. ヒント取得: `GET /api/questions/{questionId}/hint`
4. リザルト保存: `POST /api/results`
5. 苦手復習: `GET /api/review/weakness`

ヘルスチェック:
- `GET /health`

## 3. TypeScript型（そのまま利用可）

```ts
export type OsType = "mac" | "windows";

export type Monster = {
  name: string;
  hp: number;
  imageUrl: string;
};

export type NextQuestionResponse = {
  questionId: number;
  prompt: string;
  category: string;
  difficulty: number;
  monster: Monster;
};

export type JudgeRequest = {
  questionId: number;
  os: OsType;
  input: string[] | string;
  usedHint?: boolean;
};

export type JudgeResponse = {
  isCorrect: boolean;
  normalizedInput: string;
  acceptedAnswers: string[];
  damage: number;
  message: string;
};

export type HintResponse = {
  hint: string;
};

export type SaveResultRequest = {
  userId?: string | null;
  clearedCount: number;
  correctCount: number;
  wrongCount: number;
  hintCount: number;
  score: number;
  playedAt?: string; // ISO datetime
};

export type SaveResultResponse = {
  status: "ok";
  resultId: number;
};

export type WeaknessItem = {
  questionId: number;
  prompt: string;
  wrongCount: number;
  correctCount: number;
};

export type WeaknessResponse = {
  items: WeaknessItem[];
};
```

## 4. API呼び出しサンプル

```ts
const API_BASE = "http://localhost:8000";

export async function fetchNextQuestion(params: {
  os: "mac" | "windows";
  level?: number;
  category?: string;
  excludeIds?: number[];
}) {
  const qs = new URLSearchParams();
  qs.set("os", params.os);
  if (params.level) qs.set("level", String(params.level));
  if (params.category) qs.set("category", params.category);
  if (params.excludeIds?.length) qs.set("excludeIds", params.excludeIds.join(","));

  const res = await fetch(`${API_BASE}/api/questions/next?${qs.toString()}`);
  if (!res.ok) throw await res.json();
  return (await res.json()) as NextQuestionResponse;
}

export async function judgeAnswer(body: JudgeRequest) {
  const res = await fetch(`${API_BASE}/api/questions/judge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usedHint: false, ...body }),
  });
  if (!res.ok) throw await res.json();
  return (await res.json()) as JudgeResponse;
}

export async function fetchHint(questionId: number, step: 1 | 2, os: "mac" | "windows") {
  const qs = new URLSearchParams({ step: String(step), os });
  const res = await fetch(`${API_BASE}/api/questions/${questionId}/hint?${qs.toString()}`);
  if (!res.ok) throw await res.json();
  return (await res.json()) as HintResponse;
}

export async function saveResult(body: SaveResultRequest) {
  const res = await fetch(`${API_BASE}/api/results`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await res.json();
  return (await res.json()) as SaveResultResponse;
}

export async function fetchWeakness(limit = 10) {
  const res = await fetch(`${API_BASE}/api/review/weakness?limit=${limit}`);
  if (!res.ok) throw await res.json();
  return (await res.json()) as WeaknessResponse;
}
```

## 5. UI側の実装ルール（重要）

- `judge` の `input` は `string[]` 推奨
- 表記ゆれはバックエンド正規化で吸収される（例: `Cmd`, `Command`, `⌘`）
- `usedHint=true` で判定するとダメージが `2` になる
- 不正解時は `damage=0`、`message` に正解表示が入る
- `acceptedAnswers` は表示用（OSに合わせて整形済み）

## 6. エラーハンドリング

- `404`（例: 問題ID不正）
  - `{"detail":"Question not found"}`
- `422`（バリデーション）
  - `{"detail":[...]}` の配列形式

実装推奨:
- `res.ok` を必ず確認
- `404` は問題再取得へフォールバック
- `422` はユーザー通知 + 送信パラメータのログ出力

## 7. よくあるハマりどころ

- `os` に `linux` などを入れると `422`
- `level` は `1-3`、`step` は `1-2`、`limit` は `1-50`
- `excludeIds` はカンマ区切り文字列（`101,102`）
- camelCaseのまま扱う（`questionId`, `usedHint`, `normalizedInput`）

## 8. 最小動作確認チェック

1. `GET /health` が `{"status":"ok"}`
2. `next` -> `judge` の往復ができる
3. `hint(step=1/2)` が取得できる
4. `results` 保存で `status: ok`
5. `weakness` にデータが返る

---

詳細API契約は [API_SPEC.md](/Users/yuru/Desktop/もくもく会記録用/vscode-quiz/backend/API_SPEC.md) を参照。
