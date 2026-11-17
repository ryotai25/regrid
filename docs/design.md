# 設計と調査結果

2026-11-17〜18 に決めたことと、実機・ソースで確かめたことを置く。確かめた版は Foundry 14.370、dnd5e 6.1.1。**実装はまだ無い。**

## 欲しいもの

- フィートで作られたシーン・Actor・Item を、5 ft = 1.5 m でメートルに変換する。逆方向も視野に入れる
- コンペンディウムを一括で変換できる
- dnd5e では説明文の中の距離も書き換える
- 重さは扱わない（dnd5e 本体が表示時に換算する。下記）

## 2つに分ける理由

| | core（`regrid`） | dnd5e（`regrid-dnd5e`） |
|---|---|---|
| 対象 | シーンに載っている距離の欄 | Actor・Item・Activity・説明文・Journal |
| やること | グリッドの単位が変わる比率を、同じ単位に乗っている欄すべてに掛ける | dnd5e の換算関数で値と単位を書き換え、文章を置換する |
| 依存 | Foundry 14 だけ | dnd5e 6.1 以上 |
| コンペンディウム | Scene のパック | Actor・Item・Journal のパック |

**境目にあるのはトークンの視界。** 欄（`sight.range`・`detectionModes`）は本体のものだが、数値は dnd5e が Actor の感覚から入れる。core が比率を掛け、dnd5e が Actor を直す。どちらを先に実行しても同じ結果になるように作り、変換済みの印はモジュールごとに持つ。

## core: 変換する欄（本体ソースを読んだだけ。実機では未確認）

v14 の `common/documents` と `common/data/data.mjs` から拾った、距離の単位に乗っている欄。

| 文書 | 欄 |
|---|---|
| Scene | `grid.distance`、`grid.units` |
| Level | `elevation.bottom`、`elevation.top` |
| Region | `elevation.bottom`、`elevation.top` |
| Token | `elevation`、`sight.range`、`detectionModes.*.range`、`light.dim`、`light.bright` |
| AmbientLight | `config.dim`、`config.bright`、`elevation` |
| AmbientSound | `radius`、`elevation` |
| Tile・Drawing・Note | `elevation` |

- 壁と図形の座標はピクセルなので対象外
- Token の `depth`、Region の図形、非リンクトークンの差分（`delta`）は未調査
- Level の高度には `-Infinity`・`Infinity` が入りうる（`ExtendedNumberField`）。掛け算で壊さない
- Level の `elevation` を更新すると、キャンバス全体が描き直される（下記）。1シーンの変換は `scene.update` 1回にまとめる

最初の1本は「開いているシーン1つを ft から m に変換する」。試験データは Foundry 公式の無料デモ [Restored Keep: Scene Levels](https://foundryvtt.com/packages/restored-keep-levels)（4層）。**まだ入れていない。**

## dnd5e 本体がやること・やらないこと（実測）

実行時に換算するもの。保存されたデータは変わらない。

| 機能 | 中身 |
|---|---|
| 新規作成の既定 | 設定「メートル単位」（`metricLengthUnits`）がオンなら、Actor の移動・感覚、Item の射程・範囲は m で始まる |
| 新しいシーン | `preCreateScene` でグリッドを 5 ft から 1.5 m にする。距離か単位を指定して作ったシーンには触らない |
| 重さ | **表示時に換算する**（`preparePhysicalData`、設定は `metricWeightUnits`）。積載量の計算も単位をまたぐ |
| テンプレートの設置 | Activity の範囲を、置く先のシーンの単位に換算する。Fireball（20 ft）は ft でも m でも4マス |
| 落下ダメージ・瞬間移動・間合い | 単位をまたいで換算する |

換算しないもの。**単位が混ざると表示と実際がずれる。**

| 場面 | 起きること |
|---|---|
| 単位が未記入の Actor に「メートル単位」を効かせる | **数値はそのままで単位だけ m になる。** `prepareData` が `movement.units ??= defaultUnits("length")` で埋めるため。`dnd5e.actors24` は441体中434体が移動の単位を持たず（感覚は438体）、Goblin Warrior は「移動 30 m・暗視 60 m」になる |
| トークンの視界 | `computeSenseOverrides` が感覚の数値をそのまま `sight.range` に入れる。シーンの単位を見ない |
| 移動の定規の色分け | `TokenRuler5e` が「移動コスト ÷ 速度」を単位を見ずに割る |
| ラベル | Fireball は m のシーンでも「20 ft sphere」と出る |

つまり設定だけでは足りず、**既存の Actor に換算済みの数値と単位を明示的に書き込む**のが dnd5e 側の中心の仕事になる。

### 使える関数

- `dnd5e.utils.convertLength(値, "ft", { system: "metric", legacy: false })` → `{ value, unit }`。`legacy: false` を付けないと数値だけが返り、非推奨の警告が出る（6.3 で削除予定）
- 換算率は `CONFIG.DND5E.movementUnits` の `conversion`。m は 3.333（= 5 ft あたり 1.5 m）。30 ft → 9 m、150 ft → 45 m
- マイルは 1 mi → 1.584 km。慣例の 1.5 km とは違う
- ほかに `formatLength`・`formatRange`・`preferredUnit`・`isValidUnit`・`defaultUnits`

### データを変えると付いてくるもの

Fireball の `system.range`・`system.target.template` と、Activity ごとの `range`・`target.template` を換算すると、ラベルは「45 m」「6 m sphere」になり、説明文の `[[lookup @labels.description.template]]` も「6-meter Sphere」に変わった。**距離は Item 直下と Activity の両方にある。**

### 説明文に直接書かれた距離

全23パック（Actor の持ち物を含む）を数えた。

| 表記 | 件数 |
|---|---|
| `N feet` | 3,689 |
| `N-foot`（`5-foot-radius` など） | 1,216 |
| 数値の付かない `foot` / `feet` | 521 |
| `N pound(s)` | 306 |
| `N ft` | 288 |
| `N inch(es)` | 229 |
| `N mile(s)` | 97 |

距離の表記を含む文書は、spells24 が341件中187、actors24 が441件中259、equipment24 が635件中188。`5 feet to as large as 100 feet` のような範囲や、数値の付かない表記は正規表現1本では拾えない。

## 既存モジュール（2026-11-17〜18 調査）

| モジュール | やること | 状態 |
|---|---|---|
| [Metron](https://github.com/Ethaks/FVTT-Metron) | dnd5e の Actor・Item・Scene・Journal とコンペンディウムを変換 | 配布は v12 まで。main に v13・dnd5e v5 対応の 0.4.0（未リリース） |
| Metrify | dnd5e の Actor だけ。1 ft = 0.3 m | v13 |
| 5e-ft-to-m-converter | dnd5e のシート | v13 |
| Metric Ruler Labels | 定規の表示にメートルを併記。データは変えない | v11 まで |
| Foundry MGL | — | 廃止 |
| auto-ft-to-m | テンプレートの距離に 0.3048 を掛ける14行のスクリプト | v12 まで |

システムを問わずにシーンを変換するものと、v14 の Level を扱うものは見つからなかった。

### Metron から学べること（ソースを読んだ。約1,000行）

- 換算は自前（ft ÷ 5 × 1.5、mi × 1.5、lb ÷ 2）。dnd5e の関数は使っていない
- 二重変換は `flags.metron.unitSystem` で防いでいる
- 説明文は「数値 + 区切り + 単位」を正規表現1本で拾う。全角数字と、日本語の単位（フィート・マイル・ポンド）にも対応
- Scene はグリッド・トークンの視界・光源の dim と bright だけ。高度、環境音、検知モード、Region には触らない
- Activity の射程は `override` のときだけ変換する
- コンペンディウムはロックを外して `updateDocuments` し、戻す
- Scene の変換が Actor の変換を呼び、それが Item の変換を呼ぶ。この入れ子が読みにくさの元

## 知っておくこと

- **Level の `background`・`foreground`・`elevation`・`textures` を更新すると、キャンバス全体が描き直される**（`Scene##handleDescendantLevelChanges` が `canvas.draw()` を呼ぶ）。壁300・照明25・トークン41のシーンで 165〜216 ms
- ワールドは `.foundry/data/Data/worlds/<id>/world.json` を置くだけで作れる。`compatibility.verified` を世代（`"14"`）で書くと、本体を上げても自動で開く
- ホットリロードは `use-polling.cjs` でポーリングに切り替えてある。効くのは `module.json` の `flags.hotReload` に書いた拡張子とパスだけ
- join ページのユーザー選択は、14.370 では `<select name=userId>`、14.366 では `<input name=username>`

## 未決

- ビルドの有無（今は素の ESM。TypeScript や vite を入れるか）
- UIの入口（シーン設定のヘッダーボタン、右クリックメニュー、コンペンディウムの右クリック）
- 比率を設定で変えられるようにするか（5 ft = 1.5 m のほかに 5 ft = 1 m など）
- 変換済みの印の持ち方
- 日本語化（`dnd5eja`）と併用したときの、訳文側の距離の扱い
- リリースの方法（モジュールごとのタグとzip）
