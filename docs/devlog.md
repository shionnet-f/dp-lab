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

## Commit 11: 導線整合性の確立（returnTo導入）

### 目的

terms導入後に発生した導線不整合を解消し、

- checkout → terms → checkout
- confirm → terms → confirm
- product → checkout

の往復を **ログ保証付きで安定化** する。

---

### 実装内容

#### 1. confirm / checkout → terms に returnTo を付与

現在のURL（query含む）を returnTo として渡す。

```ts
redirect(`${baseUrl}/terms?productId=${productId}&returnTo=${encodeURIComponent(currentUrl)}`);
```

---

#### 2. terms側で returnTo を検証

- baseUrl配下のみ許可
- `/confirm` または `/checkout` のみ許可

```ts
if (!returnTo.startsWith(`${baseUrl}/confirm`) && !returnTo.startsWith(`${baseUrl}/checkout`)) {
  throw new Error("Invalid returnTo in terms");
}
```

---

#### 3. 戻る操作を「ログ → redirect」に統一

```ts
await track(trial, {
  page: "terms",
  type: "back_to_previous",
  payload: { productId },
});

redirect(returnTo);
```

---

#### 4. product → checkout を Link廃止

ログ漏れ防止のため ServerAction一本化。

```ts
await track(trial, {
  page: "product",
  type: "select_product",
  payload: { productId },
});

redirect(`${baseUrl}/checkout?productId=${productId}`);
```

---

### 動作確認

- checkout → terms → checkout 成立
- confirm → terms → confirm 成立
- product選択ログ保存確認
- 不正 returnTo は即エラー

---

### 到達状態

- 導線安定
- ログ保証
- URL改変による実験破壊防止

## Commit 12: checkout状態復元（URL → 初期state）

### 目的

- checkoutの状態をURLから復元し、リロード耐性を確保する

### 実装

- searchParamsに shippingId / addonGiftWrap を追加
- CheckoutClientの初期stateを initial\* から初期化

### 動作確認

- URL直打ちで状態復元
- リロードで維持
- submit_checkoutのpayloadが最終状態
- productId欠損は即エラー

## Commit 13: TrialSummary保存の導入

### 目的

1試行（1購入フロー）終了時点の状態を、
分析可能な形で1レコードに集約する。

EventLogは「行動の証拠ログ」、
TrialSummaryは「分析用データ」として役割を分離する。

---

### 実装内容

#### 1. confirm_submit時にTrialSummaryを保存

- saveTrialSummary を実装
- confirm_submit 内で呼び出し

保存項目：

- meta（trialMeta一式）
- isInappropriate（仮でfalse）
- confirmedImportantInfo（仮でfalse）
- totalTimeMs（仮で0）
- extras
  - productId
  - shippingId
  - addonGiftWrap
  - totalYen

---

### 設計判断

#### 1. EventLogとSummaryを分離

EventLog：

- 全操作の時系列ログ

TrialSummary：

- 1試行＝1行の分析用データ

後段の統計処理を簡潔にするため、
「再構築前提」ではなく「圧縮保存」を採用。

---

#### 2. 判定ロジックは未実装でOK

- confirmedImportantInfo
- isInappropriate
- totalTimeMs

これらは次コミットで実装。

今回は「保存基盤の確立」を優先。

---

### 動作確認

- confirm_submitで画面が落ちない
- EventLogにconfirm_submitが保存される
- TrialSummaryに1行追加される
- extrasが正しく保存される

---

### 到達状態

- フロー基盤：完成
- ログ基盤：完成
- TrialSummary保存：完成
- 分析可能な構造へ移行

実験装置として、
「観測→集約」まで到達。

---

### 次コミット

- confirmedImportantInfoの自動判定
- totalTimeMs計測導入
- inappropriate定義

## Commit 14: confirmedImportantInfo の自動判定（暫定境界）

### 目的

confirm_submit（submit_confirm）時点で、
「重要条件（terms）を確認したか」を TrialSummary に自動で保存する。

### 実装内容

- terms到達時に `view_terms` を自動記録（TermsViewLogger）
- confirm確定時に `confirmedImportantInfo` を自動判定して TrialSummary に保存

### 判定ロジック（暫定）

現時点では session / trial_start が未導入のため、
「直近の submit_confirm 以降に view_terms が存在するか」を境界として判定する。
過去ログ汚染（同一trialIdで過去にview_termsがある問題）を回避するための暫定策。

### 動作確認

- A: terms未閲覧で確定 → confirmedImportantInfo=false
- B: terms閲覧後に確定 → confirmedImportantInfo=true
- B→A と連続実行しても A は false（過去ログ汚染しない）

### 次

Commit15で `trial_start` を導入し、
「trial_start 以降の view_terms」のように正式な境界へ置換する。

## Commit 15: trial_start導入とtotalTimeMs計測

### 目的

1試行（1購入フロー）の所要時間を計測し、confirm確定時に TrialSummary.totalTimeMs として保存する。

### 実装内容

- product到達時に `trial_start` を記録（1試行につき1回を保証）
- confirm確定時に `trial_start` からの経過時間を `totalTimeMs` として保存
- submit_confirm後は `product` へ redirect し、試行を終了（二重submit防止）

### 設計判断

- session / trialRunId 未導入のため、境界は暫定で「直近 submit_confirm 以降」を採用
- totalTimeMs は submit_confirm ログ保存より前に算出（境界更新の影響を受けないようにする）
- 試行の終端を閉じて、同一画面での複数回submitによるデータ汚染を防止

### 動作確認

- trial_start が記録される（増殖しない）
- 1回目の確定で totalTimeMs > 0
- 確定後は product に戻る
- 2回目以降の試行でも totalTimeMs が 0 にならない

## Commit 16: isInappropriate の自動判定

### 目的

1試行の品質フラグとして `isInappropriate` を定義し、
TrialSummary に自動で保存できる状態にする。

### 定義（現時点の最小）

- `isInappropriate = !confirmedImportantInfo`
  - terms（重要条件）を未確認のまま確定した試行を「不適正」とする

### 実装内容

- confirm確定時に `confirmedImportantInfo` をもとに `isInappropriate` を算出
- `saveTrialSummary` に `isInappropriate` を保存

### 動作確認

- terms未閲覧で確定 → confirmedImportantInfo=false / isInappropriate=true
- terms閲覧後に確定 → confirmedImportantInfo=true / isInappropriate=false

### 次

- Commit17でDP4分類（misleading/omission/pressure/obstruction）を最低1本ずつ実装し、
  isInappropriate / confirmedImportantInfo / totalTimeMs を条件間で比較可能にする。

## commit 17: 各分類を1つずつ用意

misleading / omission / pressure / obstruction を最低1本ずつ実装。

## 目的

実験条件を4分類で比較可能にする。

## 内容

- trialConfigを4本化
- Homeから試行選択可能に
- obstructionのみgateを経由
- すべてのtrialで完走・集約可能

## 動作確認

- 各trialでTrialSummary保存確認
- confirmedImportantInfo / isInappropriate / totalTimeMs 正常

## Commit 18: trialRunId 導入（1試行境界の確定）

### 目的

trialId / strategy は「条件」を表すが、
同一条件での再試行や途中離脱後の再実行がある場合、
`view_terms` や `trial_start` の判定が過去ログと混ざる可能性があった。

そこで「1購入フロー（1試行）」を一意に識別する `trialRunId` を導入し、
判定・計測を run 単位に閉じる。

---

### 実装内容

- `TrialMeta` に `trialRunId` を追加
- `ensureTrialStart()` で trial_start 作成時に `trialRunId` を発行
- 各ページで `trialWithRun` を生成し、`track()` に渡すよう統一
- `hasViewedTerms` / `calcTotalTimeMs` を trialRunId 一致判定へ変更
- `TrialSummary.meta` に trialRunId を保存

---

### 設計判断

#### condition と run の分離

- condition：strategy / flowId / variant
- run：trialRunId（今回の1回の実行）

trialId は条件参照キーであり、試行境界ではない。
境界は trialRunId によって確定する。

#### 単一タブ前提

本実験は単一タブ操作を前提とする。
並行タブ操作は実験条件外とし、データ品質保証の対象外とする。

---

### 動作確認

- 1試行内の EventLog で trialRunId が一致する
- 同一 trialId を連続実行すると trialRunId が変わる
- terms未閲覧 → confirmedImportantInfo=false
- terms閲覧 → confirmedImportantInfo=true
- totalTimeMs が 0 にならない

---

### 到達状態

- 判定・時間計測が「今回の1試行」に閉じた
- 過去ログ汚染のリスクを構造的に排除できた

## Commit 19: participantId（pid）と trialRunId（rid）の導入

### 目的

実験データの分析単位を完全に固定する。

これまで trialId 単位でログを集約していたが、
同一 trialId を複数回実行した場合にログが混在する可能性があった。

本コミットでは、

- participantId（被験者ID）
- trialRunId（1試行ごとの一意ID）

を導入し、

> 1被験者 × 1試行 = 1境界

を明確にする。

---

### 実装内容

#### 1. participantId（pid）をURL必須化

- 全ページで `pid` を必須パラメータとした
- `requirePid()` により欠損時は即エラー（fail-fast）
- TrialSummary / EventLog の meta に participantId を保存

これにより、
被験者単位での分析が可能になった。

---

#### 2. trialRunId（rid）の導入

- `ensureTrialStart()` にて rid を発行
- trial_start イベントに rid を付与
- 全ページ遷移で rid をURLに保持
- すべてのログに trialRunId を付与

これにより、

- 同一 trialId の複数試行でもログが混在しない
- confirmedImportantInfo 判定が汚染されない
- totalTimeMs が正しい境界で算出される

---

#### 3. 判定ロジックの境界固定

- hasViewedTerms()
- calcTotalTimeMs()

を trialRunId 境界で評価する設計へ移行。

---

### 動作確認

- 1試行完走で TrialSummary に1行追加
- 同じ trialId を連続実行しても rid が異なる
- 2回目の試行が1回目の view_terms に汚染されない
- totalTimeMs が毎回 > 0
- pid 欠損時は即エラー

---

### 到達状態

- 分析単位：participantId × trialRunId
- ログ汚染：防止済
- 試行境界：完全固定

実験装置として、

> 「1行 = 1試行」

が保証された状態に到達。

---

### 次フェーズ

- Commit20：判定ロジックの完全 rid 基準化（sameTrial見直し）
- Commit21：startページ（pid入力導線）
- Commit22：CSV出力機能
- Commit23：最小分析スクリプト
- Commit24：実験運用手順の固定

## Commit 20: trialRunId(rid) を境界に判定ロジックを統一

### 目的

これまでの暫定境界（「直近 submit_confirm 以降」など）では、
同一trialIdを繰り返した場合や状態が揺れた場合に、過去ログ汚染の余地が残っていた。

Commit20では、**1試行＝1 rid** を境界として採用し、
以下の判定をすべて rid 基準に統一することで、試行の独立性を保証する。

- confirmedImportantInfo（terms閲覧の有無）
- totalTimeMs（試行時間）
- isInappropriate（confirmedImportantInfo から派生）

---

### 実装内容

#### 1. TrialMetaに participantId / trialRunId を正規化

- `TrialMeta` に `participantId(pid)` と `trialRunId(rid)` を持たせる前提に寄せた
- 以降のログは `meta.trial` に pid/rid を含む完全形で保存される

#### 2. ensureTrialStart を「rid確定関数」として固定

- product が入口となる想定で、rid が無い場合はここで新規発行
- 同時に `trial_start` を記録して「試行開始」を確定する

#### 3. 判定ロジックを rid 境界に統一

- `hasViewedTerms`：`meta.trial.trialRunId === rid` の `view_terms` が存在するか
- `calcTotalTimeMs`：同 rid の `trial_start.ts` を起点に `Date.now()` との差分を返す

#### 4. URL で pid/rid を持ち回す

- checkout/confirm/terms/gate を pid/rid 必須（欠損は fail-fast）
- これにより、試行境界の曖昧さを排除し、ログ汚染を構造的に防止する

---

### 設計判断

#### なぜ rid を導入するか

- 「同一trialIdの複数回実行」でもログを混ぜないため
- セッションやCookieに依存せず、**実験装置として再現性の高い境界**を作るため
- 境界を “ログの並び順” で推測するのではなく、**IDで確定**させるため

#### なぜURL方式か

- 実験は実験室PCで1名ずつ実施し、pre/postの別日実施・途中離脱は想定しない
- Cookieやセッション管理を増やすより、運用が単純で事故が少ない
- URLにpid/ridが見えることで、動作確認・ログ検証が容易

---

### 動作確認（Done条件）

- product?pid=xxx から完走すると、1試行内の EventLog 全行に同一 rid が付与される
- TrialSummary に pid/rid が含まれ、集約が試行単位で成立する
- terms未閲覧で確定 → confirmedImportantInfo=false / isInappropriate=true
- terms閲覧後に確定 → confirmedImportantInfo=true / isInappropriate=false
- 同一trialIdを連続実行しても、過去の view_terms が混入しない
- totalTimeMs > 0 が安定して保存される

---

### 次

- Commit21: 参加者開始導線（startページ/運用導線の整備）
- Commit22: エクスポート（CSVなど）と集計準備
- Commit23-24: 実験運用の最終固定（手順書/チェックリスト整備、最小ブラッシュアップ）
