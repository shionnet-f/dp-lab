# dp-lab

Deceptive Patterns（DP）がユーザーの意思決定に与える影響を、
操作ログに基づいて分析するための実験用Webアプリケーション。

本プロジェクトは「UIを作ること」ではなく、
**観測可能な実験装置を設計・実装すること**を目的としている。

---

## 実験概要

EC購入フローに複数のUI条件（中立 / DP条件）を設定し、
ユーザー行動の変化をログから比較分析する。

### 実験デザイン

- 条件：中立フローを基準にDP差分を実装
- 比較：教育前後（pre/post）および A/B（同一戦略内差分）
- 保存：各操作を `EventLog` に保存し、試行単位で `TrialSummary` に要約（予定）

### 主な計測指標

- 確認行動（内訳展開、terms閲覧など）
- 不適正行動（重要情報未確認での確定など）
- 所要時間・戻り・変更断念

---

## ダークパターンの分類（欧州委員会が示す類型化を参考）

1. **Misleading**：印象操作・強調による誤認誘導
2. **Omission**：重要情報の可視性低下
3. **Pressure**：初期値・流れによる誘導
4. **Obstruction**：変更・撤回の摩擦増加

各試行は `trialConfig` により一意に定義され、
URL（phase/taskSet/version/trialId）と紐付いてログ保存される。

---

## ディレクトリ構成

```text
src/
  ├─ app/
  │  ├─ components/
  │  └─ [phase]/[taskSetId]/[taskVersion]/[trialId]/
  │      ├─ product/
  │      ├─ checkout/
  │      ├─ confirm/
  │      └─ terms/
  │
  ├─ config/
  │
  └─ lib/
      └─ logger/
```

## 起動方法

### 1) 環境変数の設定

プロジェクトルートに `.env` を作成し、以下を記載します。

```env
DATABASE_URL="file:./prisma/dev.db"
```

### 2) セットアップ & 起動

```
npm install
npx prisma migrate dev
npm run dev
```

### 3) ログ確認(任意)

```
npx prisma studio
```
