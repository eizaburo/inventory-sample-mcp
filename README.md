# MCPサーバの実装サンプル（AI生成）

## 概要

在庫についていろいろ聞くことができる。
登録されてる商品は、以下。


現在登録されている商品は以下の通りです。

| 商品ID         | 商品名   |
|----------------|----------|
| product_001    | 商品A    |
| product_002    | 商品B    |
| product_003    | 商品C    |
| product_004    | 商品D    |

このリストの商品が在庫確認可能です。

## 使い方

### 利用手順

- git clone
- cd project_dir
- npm install

### MCPサーバの登録（Cursor等）

node.jsが入ってること前提。server.jsファイルへの物理Pathを設定。

```
{
  "mcpServers": {
    "inventory-manager": {
      "command": "node",
      "args": ["/Users/user_name/inventory-mcp-server/server.js"]
    }
  }
}
```