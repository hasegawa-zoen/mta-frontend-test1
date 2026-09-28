# mta-frontend-template

Next.jsテナントフロントエンド（テンプレート、is_template=true）。

`mta-frontend-hasegawa`（M3垂直スライス: ログイン→見積作成→結果確認）と同じ実装を移植済み。
M4のテナントオンボーディングはこのテンプレートを起点に`POST /repos/{owner}/mta-frontend-template/generate`で
新規リポジトリを生成する。`tenant.config.json`はテナント非依存のプレースホルダのまま維持し、
生成時にオンボーディングフローまたはテナント担当開発者が実際の値へ置き換える。

## ローカル開発

`@mta/ui-kit`・`@mta/api-client`はまだGitHub Packagesに公開されていないため、`file:`依存で
ローカルの`mta-ui-kit`チェックアウトを直接参照する（暫定策、公開後に置き換え予定）。

```bash
git clone https://github.com/hasegawa-zoen/mta-ui-kit.git .deps/mta-ui-kit
cp .env.example .env.local
npm install
npm run dev
```

<!-- M0 CI verification commit -->
