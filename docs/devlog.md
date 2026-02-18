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

## Commit 06: 中立checkout実装と操作ログ取得の安定化

### 目的

DPを適用する前に、中立なcheckoutフローを1本通し、

- 配送方法変更
- オプション変更
- 確定操作

の各行動が正しく保存されることを確認する。

本commitはUIの完成を目的とするものではなく、

> 実験に必要な「操作ログの取得基盤」を完成させること

を主目的とする。

---

### 実装内容

#### 1. checkoutページの作成

`/[phase]/[taskSetId]/[taskVersion]/[trialId]/checkout`

- shipping（radio）
- addon（toggle）
- 合計表示
- 次へ（submit）

DPは未適用。
初期値は中立（通常配送 / オプションOFF）。

---

#### 2. option_change の取得

配送方法およびオプション変更時に `option_change` を記録。

payloadには以下を保存：

- `field`
- `value`

これにより、

- 途中変更履歴の保持
- 最終状態の復元
- 再検討行動の分析

が可能となる。

例：

```json
{
  "field": "shipping",
  "value": "express"
}
```

## Commit 07: confirmページ作成（観測点の確保）

### 目的

購入フローの最終段（confirm）を「観測可能」にする。
UI完成ではなく、確認行動・確定行動のログ導線を確保することが主目的。

### 実装内容

- `/[phase]/[taskSetId]/[taskVersion]/[trialId]/confirm` を新規実装
- confirm上で以下の行動ログを取得できるようにした
  - `page_view`（confirm到達）
  - `click_expand_breakdown`（明細確認）
  - `back_click`（戻る）
  - `confirm_submit`（確定）
- `track()` を通して `meta.trial` を必ず付与して EventLog に保存

### 技術的判断

#### 1. 「ページ完成」ではなく「観測点確保」を優先

実験装置として必要なのは、confirm上の確認行動の有無が計測できる状態。
デザインやUI洗練は後回し。

#### 2. searchParamsのPromise互換（環境差の吸収）

環境によって `searchParams` が Promise として渡るケースがあり、
`productId` を取りこぼすとログが `unknown` になり得る。
そのため `searchParams?: T | Promise<T>` とし、`await searchParams` する実装へ寄せた。

### 動作確認（Done条件）

- `http://localhost:3000/pre/A/A1/t000/confirm?productId=p1` の直打ちで表示できる
- Prisma Studio で EventLog が増加し、以下が保存される
  - `page="confirm"` かつ
    - `type="page_view"`
    - `type="click_expand_breakdown"`
    - `type="back_click"`
    - `type="confirm_submit"`
- `meta.trial` が必ず入っていること

### 次回

- checkoutで選択した `shipping / addon` を confirm に正しく引き継ぐ
- `productId` 欠損を許容せず（fail-fast）、unknownログを残さない

## Commit 08: confirmページ実装（実験最終ノードの導入）

### 目的

購入フローにおける「最終判断点」を実装する。

これにより以下を観測可能にする：

- 最終確定行動
- 確認行動（明細確認など）
- 再検討行動（checkoutへ戻る）

---

### 実装内容

#### 1. confirmページの新規作成

/[phase]/[taskSetId]/[taskVersion]/[trialId]/confirm

- `productId` 必須（無い場合は throw）
- `shippingId` / `addonGiftWrap` をクエリから受け取る
- 合計金額を計算して表示

---

#### 2. confirmで取得するログ

- `page_view`
- `click_expand_breakdown`
- `go_terms`
- `back_to_checkout`
- `confirm_submit`

payloadには必ず `productId` を含める。

---

### 設計判断

#### confirmを実験の最終ノードとする

DPの影響は最終確定行動に現れるため、
confirmを「観測の中心」と定義した。

---

#### unknownの禁止

実験装置として、
`productId` が無い状態でログが残ることを禁止。

欠損データを許容しない設計。

---

### 動作確認

- checkout → confirm 遷移
- 合計が選択に応じて変化
- `confirm_submit` が保存される
- `meta.trial` が常に格納される

---

### 実験的意味

ここで初めて、

> 「重要情報を確認せずに確定したか」

という分析が可能になった。

---

## Commit 09: termsページ実装（重要条件の分離）

### 目的

重要条件を別ページへ分離し、

- 条件閲覧行動
- 未閲覧確定行動

を判定可能にする。

---

### 実装内容

/terms?productId=xxx

- `productId` 必須
- `view_terms` ログ
- `back_to_checkout` ログ

---

### 設計判断

#### 本文はtermsにのみ配置

omission系DPの観測点として利用。

---

#### 戻り先は一旦checkout

confirmへ戻す設計は後回し。
まずはログ導線の安定性を優先。

---

### 動作確認

- confirm → terms 遷移
- terms → checkout 遷移
- `view_terms` / `back_to_checkout` が保存される

---

### 実験的意味

「条件未閲覧で確定」が定義可能になった。

---

## Commit 10: confirmを実験最終ノードとして強化

### 目的

confirmを

- 再検討可能
- 重要条件へ遷移可能
- 最終確定可能

な完全ノードへ昇格させる。

---

### 実装内容

#### 明細ログ

- `click_expand_breakdown`

#### 変更導線

- `back_to_checkout`
- shipping/addon を維持して戻る

#### 最終確定

- `confirm_submit`
- `totalYen` をpayloadに含める

---

### 設計判断

#### confirmを中心とする設計へ

今後のDP実装はすべて
「confirmでどう振る舞うか」に集約される。

---

#### 状態保持の完全化は後回し

セッション管理は後段。
まずは観測基盤の完成を優先。

---

### 動作確認

- confirmログが正しく保存される
- confirm → checkout → confirm が成立
- confirm → terms が成立

---

## 到達状態（現時点）

- product → checkout → confirm → terms → checkout
- trialMeta 常時付与
- productId 欠損禁止
- confirm_submit が取得可能

---

## 現在の実験装置レベル

- フロー基盤：完成
- ログ基盤：完成
- 最終判断観測：可能
- DP未実装：一部のみ
- TrialSummary未接続

---

## 次フェーズ

- 導線整理（unknown撲滅・戻り先設計統一）
- DP4分類の本実装
- TrialSummary導入
