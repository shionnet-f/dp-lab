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
