# VS Code Shortcut Quiz Backend API仕様書

この仕様書は、現行のバックエンド実装に合わせた「フロント連携用のわかりやすい版」です。

## 1. まずこれだけ

- Base URL: `http://localhost:8000`
- レスポンス: JSON
- `os` は `mac` または `windows` のみ
- 主な呼び出し順:
1. `GET /api/questions/next`
2. `POST /api/questions/judge`
3. 必要なら `GET /api/questions/{questionId}/hint`
4. 終了時 `POST /api/results`
5. 復習画面で `GET /api/review/weakness`

## 2. 共通ルール

### 2.1 Content-Type
- `GET`: Bodyなし
- `POST`: `Content-Type: application/json`

### 2.2 CORS（開発）
- 全許可設定（`*`）

### 2.3 バリデーション制約
- `os`: `mac | windows`
- `level`: `1..3`
- `step`: `1..2`
- `limit`: `1..50`
- `POST /api/results` の以下は `0` 以上
1. `clearedCount`
2. `correctCount`
3. `wrongCount`
4. `hintCount`

### 2.4 エラー形式
- 404 例:
```json
{ "detail": "Question not found" }
```
- 422 例:
```json
{
  "detail": [
    {
      "loc": ["query", "os"],
      "msg": "String should match pattern '^(mac|windows)$'",
      "type": "string_pattern_mismatch"
    }
  ]
}
```

## 3. API一覧

## 3.1 `GET /health`

### 目的
- サーバ生存確認

### 成功レスポンス
```json
{ "status": "ok" }
```

---

## 3.2 `GET /api/questions/next`

### 目的
- 次の問題を1件取得

### クエリ
- `os` (optional, default: `mac`)
- `level` (optional, `1..3`)
- `category` (optional, string)
- `excludeIds` (optional, 例: `101,102`)

### 例
```http
GET /api/questions/next?os=mac&level=1&category=search&excludeIds=101,102
```

### 成功レスポンス
```json
{
  "questionId": 101,
  "prompt": "検索（ファイル内）のショートカットは？",
  "category": "search",
  "difficulty": 1,
  "monster": {
    "name": "ショートカットスライム",
    "hp": 12,
    "imageUrl": "/monsters/slime.png"
  }
}
```

### 失敗
- `422`: `os` 不正、`level` 範囲外など

---

## 3.3 `POST /api/questions/judge`

### 目的
- 回答の正誤判定
- ダメージ計算
- 学習進捗更新（`user_progress`）

### リクエストBody
```json
{
  "questionId": 101,
  "os": "mac",
  "input": ["Meta", "F"],
  "usedHint": false
}
```

### 成功レスポンス
```json
{
  "isCorrect": true,
  "normalizedInput": "Meta+F",
  "acceptedAnswers": ["⌘+F"],
  "damage": 4,
  "message": "正解！検索のショートカットは Command(Ctrl)+F です。"
}
```

### 失敗
- `404`: 問題IDが存在しない
- `422`: Body型不一致、`os` 不正など

---

## 3.4 `GET /api/questions/{questionId}/hint`

### 目的
- 段階ヒントを取得

### パラメータ
- Path: `questionId` (required)
- Query: `step` (optional, default `1`, `1..2`)
- Query: `os` (optional, default `mac`)

### 例
```http
GET /api/questions/101/hint?step=1&os=mac
```

### 成功レスポンス
```json
{ "hint": "修飾キー + F" }
```

### 補足
- `step=1`: 軽いヒント
- `step=2`: さらに強いヒント

### 失敗
- `404`: 問題IDが存在しない
- `422`: `step` 範囲外や `os` 不正

---

## 3.5 `POST /api/results`

### 目的
- バトル結果を保存

### リクエストBody
```json
{
  "userId": null,
  "clearedCount": 5,
  "correctCount": 12,
  "wrongCount": 4,
  "hintCount": 3,
  "score": 1200
}
```

### 成功レスポンス
```json
{
  "status": "ok",
  "resultId": 1
}
```

### 失敗
- `422`: 負数、型不一致、日時形式不正

---

## 3.6 `GET /api/review/weakness`

### 目的
- 苦手問題を取得（間違いが多い順）

### クエリ
- `limit` (optional, default `10`, `1..50`)

### 例
```http
GET /api/review/weakness?limit=10
```

### 成功レスポンス
```json
{
  "items": [
    {
      "questionId": 107,
      "prompt": "コマンドパレットを開くショートカットは？",
      "wrongCount": 5,
      "correctCount": 1
    }
  ]
}
```

### 失敗
- `422`: `limit` 範囲外

## 4. 判定ロジック（重要）

### 4.1 入力正規化
- `input` は `string` または `string[]`
- `Cmd` / `Command` / `⌘` は `Meta` に統一
- `Ctrl` / `^` は `Control` に統一
- `Option` / `⌥` は `Alt` に統一
- 並び順は固定（`Meta` -> `Control` -> `Alt` -> `Shift` -> その他）
- 例:
1. `Cmd + F` -> `Meta+F`
2. `F + Cmd` -> `Meta+F`

### 4.2 ダメージ計算
- 正解: `4`
- 正解かつヒント使用 (`usedHint=true`): `2`
- 不正解: `0`

### 4.3 進捗更新
- `POST /api/questions/judge` のたびに `user_progress` を更新
- 現在は `user_id = null` で記録

## 5. フロント実装メモ

- `excludeIds` はカンマ区切り文字列で送る（例: `101,102,103`）
- `acceptedAnswers` は表示用（OS表示に整形済み）
- 状態管理の目安:
1. 問題取得中: `GET /api/questions/next`
2. 判定中: `POST /api/questions/judge`
3. 結果反映: `damage` / `message` をUI反映

## 6. 運用ルール

- この仕様書は現行実装の契約を表す
- APIを変更したら、同じPRでこの仕様書も更新する
