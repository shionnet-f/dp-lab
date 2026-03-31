# Logger（行動ログ機能）README

## 目的

この logger は、**EC実験におけるユーザ行動を試行単位で記録・集約する仕組み**。

- どの参加者か（participantId）
- どの試行か（trialRunId）
- どの条件か（phase / taskSet / strategy など）
- どんな操作をしたか（click / page_view など）

を **DBに記録し、最終的に試行単位でまとめる**。

---

## 全体構造（最重要）

```
[ページ]
  ↓
getTrialMeta        ← 試行条件を作る
  ↓
ensureTrialStart    ← 試行開始 + trialRunId発行
  ↓
track               ← ログ用に整形
  ↓
logEvent            ← DB保存（Prisma）
```

試行終了時：

```
hasViewedTerms
calcTotalTimeMs
saveTrialSummary    ← 試行単位の集約保存
```

---

## 技術の責任分離（ここを最初に理解する）

### 1. JavaScript / TypeScript

言語の機能

- async / await
- if / return
- 型定義

---

### 2. Prisma（DB操作）

DBとやり取りする部分

```ts
prisma.eventLog.create(...)
prisma.eventLog.findMany(...)
```

👉 これが「実際にDBを触っている処理」

---

### 3. 自作関数（このプロジェクト）

ロジックをまとめている

```ts
track(...)
logEvent(...)
getTrialMeta(...)
```

👉 Prismaを直接使わず、**ラップして使っている**

---

## 最重要データ構造

### TrialCondition

試行の条件（URL + configから生成）

```ts
{
  (phase, taskSetId, taskVersion, trialId, strategy, flowId, variant);
}
```

---

### TrialMeta

実際の試行（= 誰がどの1回をやったか）

```ts
TrialCondition +
  {
    participantId,
    trialRunId,
  };
```

👉 **すべてのログはこの情報とセットで保存される**

---

## コア関数一覧（責任だけ覚える）

### getTrialMeta

- 入力：URLパラメータ
- 出力：TrialCondition
- 役割：試行条件を作る

---

### ensureTrialStart

- 入力：TrialMeta（ridなし可）
- 出力：trialRunId
- 役割：
  - trialRunIdを生成
  - `trial_start` を1回だけ記録

---

### track（最重要）

- 入力：TrialMeta + イベント情報
- 出力：なし
- 役割：
  - イベントに試行情報を付与
  - DB保存用に整形
  - logEventを呼ぶ

---

### logEvent（DB保存）

- 入力：LogEventInput
- 出力：なし
- 役割：
  - Prismaで eventLog に1行保存

```ts
await prisma.eventLog.create(...)
```

---

### hasViewedTerms

- 役割：この試行で重要情報を見たか判定

---

### calcTotalTimeMs

- 役割：試行開始からの経過時間を計算

---

### saveTrialSummary

- 入力：TrialMeta + 指標
- 役割：試行単位の集約を保存

---

## データの流れ

### イベントログ（詳細ログ）

`eventLog` テーブル

- click
- page_view
- view_terms
  など

👉 全行動を保存

---

### 試行サマリー（分析用）

`trialSummary` テーブル

- totalTimeMs
- confirmedImportantInfo
- isInappropriate

👉 分析用に集約

---

## meta と payload の違い

### meta

- 試行文脈 + 補助情報
- 検索・分析に使う

```json
{
  "trial": {...}
}
```

---

### payload

- イベント固有のデータ

```json
{
  "shipping": "express"
}
```

---

## Prismaの使い方（最低限）

### DB保存

```ts
await prisma.eventLog.create({
  data: {...}
});
```

---

### DB取得

```ts
await prisma.eventLog.findMany({...});
```

---

👉 重要：
**DB接続は事前に済んでいるため、メソッドを呼ぶだけで使える**

---

## async / await の意味

```ts
await prisma.eventLog.create(...)
```

- DB処理は時間がかかる
- awaitで「終わるまで待つ」

---

👉 awaitしないと、保存前に次の処理が進む可能性あり

---

## 読み方ルール（重要）

コードを読むときは毎回これだけ考える：

### 1. これは誰の機能？

- JS？
- Prisma？
- 自作？

---

### 2. これは何をしている？

- 整形？
- 保存？
- 取得？
- 判定？

---

### 3. DB触ってる？

- YES → Prisma
- NO → ロジック

---

## よくある混乱ポイント

### Q. track と logEvent の違いは？

- track → 整形 + 文脈付与
- logEvent → DB保存

---

### Q. DBアクセスはどこでしてる？

👉 `prisma.xxx` の部分だけ

---

### Q. なんで関数が分かれてる？

👉 責任分離のため

---

## 最低限の理解ライン（ここまででOK）

```
イベント発生
↓
track() 呼ぶ
↓
trial情報をくっつける
↓
logEvent()
↓
PrismaでDB保存
```

---

## 次にやること

1. track.ts を読む（最優先）
2. logEvent.ts を読む
3. ページ側で track がどう呼ばれているか見る

---

## 一言まとめ

👉 **このloggerは「試行情報つきで行動ログをDBに保存する仕組み」**
