# Frontline Hex

HTML/CSS/JavaScriptだけで動作する、スマホ対応のヘックス型ターン制戦略ゲームです。

## 公開ファイル

```text
index.html
manifest.json
service-worker.js
icon.svg
assets/
  styles.css
  game.js
```

GitHub Pagesはリポジトリのルートにある `index.html` を起点に表示します。ゲームのCSS、JavaScript、PWAファイルはすべて相対パスで参照しています。

## GitHub Pagesで公開する

### GitHubの画面からアップロードする方法

1. GitHubで新しいリポジトリを作成します。
2. このフォルダの `index.html`、`manifest.json`、`service-worker.js`、`icon.svg`、`assets` フォルダ、`.nojekyll` をリポジトリ直下へアップロードします。
3. リポジトリの **Settings** を開きます。
4. 左側の **Pages** を開きます。
5. **Build and deployment** の Source を **Deploy from a branch** にします。
6. Branchを `main`、フォルダを `/(root)` にして **Save** を押します。
7. 数分後、次の形式のURLで公開されます。

```text
https://ユーザー名.github.io/リポジトリ名/
```

### Gitコマンドで公開する方法

空のGitHubリポジトリを作成した後、このフォルダで実行します。

```bash
git init
git add index.html manifest.json service-worker.js icon.svg assets README.md .nojekyll
git commit -m "Publish Frontline Hex"
git branch -M main
git remote add origin https://github.com/ユーザー名/リポジトリ名.git
git push -u origin main
```

その後、GitHubの **Settings > Pages** で `main` / `/(root)` を選択してください。

## 更新方法

ファイルを更新して `main` ブランチへpushすると、GitHub Pagesも自動更新されます。

```bash
git add .
git commit -m "Update game"
git push
```

PWAの古い画面が残る場合は、`service-worker.js` の `CACHE_NAME` を変更してからpushしてください。

## セーブとPWA

- セーブデータと効果音設定はブラウザの `localStorage` に保存されます。
- セーブデータは端末、ブラウザ、公開URLごとに別管理です。
- ブラウザのデータを削除するとセーブも削除されます。
- GitHub PagesはHTTPS配信なのでService Workerとホーム画面追加を利用できます。
- Chromeではブラウザメニューの「アプリをインストール」または「ホーム画面に追加」を使用します。
- iPhone/iPadではSafariの共有メニューから「ホーム画面に追加」を使用します。

## ローカル確認

Service Workerは `file://` では動作しないため、ローカルサーバーで確認します。

```bash
python -m http.server 8000
```

ブラウザで次を開きます。

```text
http://localhost:8000/
```

## 注意

- 公開時に `index.html` をサブフォルダへ移動しないでください。
- `assets` フォルダ内のファイル名や階層を変更する場合は、`index.html` と `service-worker.js` の参照も更新してください。
- 音は最初のタップまたはクリック後に有効になります。これはスマホブラウザの自動再生制限によるものです。
