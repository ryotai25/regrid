# CLAUDE.md

FoundryVTT v14 向けの、距離の単位（フィート ⇔ メートル）を変換するモジュール2本。趣味の開発で、利用者数は目標にしない。

- 何を作るか、何が分かっているか、何が未決か: `docs/design.md`（**最初に読む**）
- 開発環境の立て方: `README.md`

## 決まっていること

- 対象は Foundry 14 以降。dnd5e 側は dnd5e 6.1 以降。それ以前との両対応はしない
- モジュールは2つ。`packages/core`（ID `regrid`、システム非依存）と `packages/dnd5e`（ID `regrid-dnd5e`）。**core は dnd5e を一切参照しない**
- core を先に作る。最初の1本は「開いているシーン1つを ft から m に変換する」
- 両方向（ft → m、m → ft）を視野に入れる

## 進め方

- 欲しいもの → 不確かな点を実機で試す → 一番細い1本を通す → 1機能ずつ足す。検査（lint・テスト・CI）は同じ間違いを2回してから足す
- **FoundryVTT と dnd5e のAPIは推測せず、ソースを読む。** 本体は `foundry/client`・`foundry/common`（zipから展開。git管理外）、dnd5e は `.foundry/data/Data/systems/dnd5e/dnd5e.mjs`
- 実機で確かめたことだけを `docs/design.md` に書く。読んだだけのものは「読んだだけ」と書く
- コミットは `prefix: 英語の要約` を1行目に、必要なら3行目以降に日本語で理由。prefix は feat / fix / refactor / style / test / docs / ci / chore。`Co-Authored-By` などのトレーラーは付けない
- PRの本文にAIの署名は付けない

@CLAUDE.local.md
