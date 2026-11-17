# Regrid

FoundryVTT（v14以降）で、距離の単位をフィートとメートルのあいだで変換するモジュール。2つに分かれている。

| モジュール | ID | 対象 | 依存 |
|---|---|---|---|
| Regrid | `regrid` | シーン（グリッド、Level、トークン、光源、環境音など）。システムを問わない | Foundry 14 |
| Regrid for D&D 5e | `regrid-dnd5e` | dnd5e の Actor・Item・Activity・説明文・Journal | dnd5e 6.1 以上 |

**まだ何も実装されていない。** 設計と調査結果は [docs/design.md](docs/design.md)。

## 開発環境

本体はコンテナで動かす。Docker（`docker compose` か `docker-compose`）と、FoundryVTT の Node.js 版のzipが要る。

1. zipを**展開せずに** `~/.cache/foundry/foundryvtt-14.370.zip` の名前で置く（ビルド番号は `compose.yaml` の `FOUNDRY_VERSION` に合わせる）
2. `cp .env.example .env` して `FOUNDRY_LICENSE_KEY` を書く
3. `docker compose up -d` で起動し、`http://localhost:30014` を開いてEULAに同意する（初回だけ）

`packages/core` と `packages/dnd5e` は、それぞれ `Data/modules/regrid`・`Data/modules/regrid-dnd5e` にマウントされる。データは `.foundry/data`（git管理外）に溜まる。止めるときは `docker compose down`。

## ライセンス

MIT
