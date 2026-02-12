## Commit 01: Prisma基盤

目的:
実験ログを永続化する基盤を構築する。

設計判断:

- Prisma7を採用（型安全性）
- SQLite（ローカル実験前提）
- meta/payloadはJsonで保持

結果:

- migrate成功
- Studioで確認

## Commit 02: 実験ログ保存API（logEvent）の実装

### 目的

UI操作をデータベースへ保存できる基盤を確立する。
実験ロジック実装前に、「アプリ → サーバー → DB」までの経路を保証する。

---

### 実装内容

- Server Action `logEvent()` を実装
- Prisma経由で `EventLog` テーブルへ保存
- Json型（meta / payload）を Prisma.InputJsonValue に統一
- Studioでログ増加を確認

---

### 技術的判断

#### 1. Server Actionを採用

Next.js App Routerの `"use server"` を用い、
API Routeを作成せずにサーバー側でDB保存を実行できる構成とした。

#### 2. Json型の扱い

PrismaのJsonカラムは `InputJsonValue` を要求するため、
meta/payload の入力型を Prisma.InputJsonValue に統一した。
未指定の場合は `Prisma.JsonNull` を保存する。

#### 3. 責務分離

- UIはログ内容を渡すだけ
- 永続化処理は logEvent に集約
  将来的な仕様変更時の修正範囲を限定する設計とした。

---

### 完了条件

- ボタン押下でEventLogが1件増加することを確認
- 複数回実行で複数行追加されることを確認
- DB接続エラーが発生しないことを確認

---

### 次フェーズ

- trialメタ情報（phase / taskSet / flowId など）の自動付与
- イベント命名規則の固定
- 不適正行動 / 確認行動の判定材料の収集設計

## Commit 03: track導入（trialメタ情報の自動付与）

- track(trialMeta, event) を追加し、meta.trial に条件ラベルを必ず付与して保存する。
- Studioで EventLog の増加と meta.trial の格納を確認。
- 以降、教育前後（pre/post）・AA’BB’・flowId/variant 単位で集計可能。

## Commit 04: URLからtrialメタ情報を生成（getTrialMeta）

- trialMeta をUI側に直書きしないため、params/searchParamsから TrialMeta を組み立てる getTrialMeta を追加。
- strategy/flowId/variant は暫定で searchParams から付与（後で trialConfig に置換予定）。
- 誤った条件でログが蓄積するのを防ぐため、値が不正/欠落なら例外で停止する方針とした。
- Studioで meta.trial の格納を確認。

## Commit 05: trialConfig導入による条件付与の一元化

### 背景

Commit 04 では、trialMeta を URL の params / searchParams から生成する仕組みを導入した。
しかし、strategy / flowId / variant がクエリパラメータに依存しており、
本番実験としては不安定な構造であった。

### 変更内容

- trialId をキーに strategy / flowId / variant を付与する `trialConfig` を導入
- getTrialMeta から searchParams 依存を撤廃
- URLは `/[phase]/[taskSetId]/[taskVersion]/[trialId]/product` のみで動作
- 不正な trialId の場合は例外で停止する設計を維持

### 設計意図

- 実験条件の真実源を URL + trialConfig に統一
- クエリ改変による誤条件ログの蓄積を防止
- 将来的な条件追加・順序制御を config 側で一元管理できる構造へ移行

### 動作確認

- クエリ無しでアクセス可能
- URLに異なるクエリを付与しても trialMeta は変化しない
- Prisma Studio にて `meta.trial` に以下が保存されることを確認

```json
{
  "trial": {
    "phase": "pre",
    "taskSetId": "A",
    "taskVersion": "A1",
    "trialId": "t000",
    "strategy": "misleading",
    "flowId": "misleading_01",
    "variant": "A"
  }
}
```
