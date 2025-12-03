# mvtal
MVT (Mapbox Vector Tile) Attribute Lister

タイルURLを指定して Mapbox Vector Tile（MVT）ファイルの属性を一覧化・CSV/Markdown出力するブラウザアプリケーション。

## 機能

- 🌐 ブラウザ単体で動作（サーバー不要）
- 📦 MVT タイル（.pbf/.mvt）の解析
- 📋 レイヤ毎の属性一覧表示
  - 属性キー
  - データ型
  - 出現回数
  - サンプル値（上位N件またはすべて）
- 📥 CSV/Markdown形式でエクスポート
- 🚀 GitHub Pages でデプロイ可能

## 使い方

1. [MVT Attribute Lister](https://hfu.github.io/mvtal/) にアクセス
2. MVTタイルのURLを入力（CORS対応が必要）
3. 「解析」ボタンをクリック
4. レイヤ名をクリックして属性を確認
5. 必要に応じてCSV/Markdownをダウンロード

## 技術仕様

- ES Modules（`<script type="module">`）構成
- 依存ライブラリ:
  - [@mapbox/vector-tile](https://github.com/mapbox/vector-tile-js) v2
  - [pbf](https://github.com/mapbox/pbf) v4
- CDN: [esm.sh](https://esm.sh/)

## ローカル実行

```bash
# 任意のHTTPサーバーで docs ディレクトリを配信
cd docs
python -m http.server 8080
# または
npx serve
```

ブラウザで http://localhost:8080 にアクセス

## 注意事項

- 入力するタイルURLは**CORS対応**が必要です
- 大きなタイルの解析には時間がかかる場合があります

## ライセンス

CC0 1.0 Universal - [LICENSE](LICENSE)
