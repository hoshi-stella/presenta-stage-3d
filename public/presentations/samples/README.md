# Presentation Samples

`data-structures-*` は、同じデータ構造とアルゴリズムの台本を三つの表示レイヤーで比較するPresentation Packageです。

| Package | Use case | URL |
| --- | --- | --- |
| Slides | 通常の資料として簡潔に説明する | `/presentations/samples/data-structures-slides/presentation.json` |
| 2D animation | 操作の順序や状態変化を画面上の図で補う | `/presentations/samples/data-structures-2d-animation/presentation.json` |
| 3D animation | 空間、構造、注目対象をステージで補う | `/presentations/samples/data-structures-3d-animation/presentation.json` |

各PackageはStack、Queue、Ring Buffer、Sort、計算量を扱います。`Space`または`Next`でCueを進め、Stack、Queue / Buffer、SortのCueで対応する演出を確認できます。

サンプルは公開可能なコードとJSONだけで構成しています。実際の発表で使う画像、音声、モデルは、`public/assets-local/**`やユーザーコンテンツ用ディレクトリへ置き、Gitには追加しません。
