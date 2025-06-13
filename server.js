#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// サンプル在庫データ
const currentInventory = {
  "product_001": {
    id: "product_001",
    name: "商品A",
    category: "electronics",
    currentStock: 25,
    unit: "個",
    lastUpdated: "2024-06-13T10:00:00Z",
    location: "倉庫A-1-2"
  },
  "product_002": {
    id: "product_002",
    name: "商品B",
    category: "clothing",
    currentStock: 150,
    unit: "個",
    lastUpdated: "2024-06-13T09:30:00Z",
    location: "倉庫B-2-1"
  },
  "product_003": {
    id: "product_003",
    name: "商品C",
    category: "food",
    currentStock: 8,
    unit: "箱",
    lastUpdated: "2024-06-13T11:15:00Z",
    location: "倉庫C-1-1"
  },
  "product_004": {
    id: "product_004",
    name: "商品D",
    category: "electronics",
    currentStock: 45,
    unit: "個",
    lastUpdated: "2024-06-13T08:45:00Z",
    location: "倉庫A-2-3"
  }
};

// 適正在庫データ
const optimalInventory = {
  "product_001": {
    id: "product_001",
    name: "商品A",
    minStock: 20,
    maxStock: 100,
    optimalStock: 50,
    reorderPoint: 30,
    reorderQuantity: 50,
    leadTimeDays: 7,
    seasonalFactor: 1.2
  },
  "product_002": {
    id: "product_002",
    name: "商品B",
    minStock: 100,
    maxStock: 500,
    optimalStock: 250,
    reorderPoint: 150,
    reorderQuantity: 200,
    leadTimeDays: 14,
    seasonalFactor: 0.8
  },
  "product_003": {
    id: "product_003",
    name: "商品C",
    minStock: 10,
    maxStock: 50,
    optimalStock: 25,
    reorderPoint: 15,
    reorderQuantity: 30,
    leadTimeDays: 3,
    seasonalFactor: 1.0
  },
  "product_004": {
    id: "product_004",
    name: "商品D",
    minStock: 30,
    maxStock: 150,
    optimalStock: 75,
    reorderPoint: 40,
    reorderQuantity: 60,
    leadTimeDays: 10,
    seasonalFactor: 1.1
  }
};

// 在庫状態を判定する関数
function getInventoryStatus(productId) {
  const current = currentInventory[productId];
  const optimal = optimalInventory[productId];
  
  if (!current || !optimal) {
    return null;
  }
  
  let status = "normal";
  let alerts = [];
  
  if (current.currentStock <= optimal.reorderPoint) {
    status = "reorder_needed";
    alerts.push("発注が必要です");
  } else if (current.currentStock < optimal.minStock) {
    status = "low_stock";
    alerts.push("在庫が少なくなっています");
  } else if (current.currentStock > optimal.maxStock) {
    status = "overstock";
    alerts.push("在庫過多です");
  }
  
  return {
    ...current,
    ...optimal,
    status,
    alerts,
    stockDifference: current.currentStock - optimal.optimalStock,
    stockUtilization: (current.currentStock / optimal.maxStock * 100).toFixed(1) + "%"
  };
}

// MCP Server作成
const server = new Server(
  {
    name: "inventory-manager",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ツールの定義
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_current_inventory",
        description: "現在の在庫データを取得します。商品IDを指定することで特定の商品の在庫情報を取得できます。",
        inputSchema: {
          type: "object",
          properties: {
            productId: {
              type: "string",
              description: "商品ID（オプション）。指定しない場合は全商品の在庫を返します。"
            }
          }
        }
      },
      {
        name: "get_optimal_inventory",
        description: "適正在庫データを取得します。商品IDを指定することで特定の商品の適正在庫情報を取得できます。",
        inputSchema: {
          type: "object",
          properties: {
            productId: {
              type: "string",
              description: "商品ID（オプション）。指定しない場合は全商品の適正在庫を返します。"
            }
          }
        }
      },
      {
        name: "get_inventory_status",
        description: "在庫状況を分析し、現在の在庫と適正在庫を比較した結果を返します。アラートや推奨アクションも含まれます。",
        inputSchema: {
          type: "object",
          properties: {
            productId: {
              type: "string",
              description: "商品ID（オプション）。指定しない場合は全商品の在庫状況を返します。"
            }
          }
        }
      },
      {
        name: "get_reorder_suggestions",
        description: "発注が必要な商品の一覧と推奨発注量を返します。",
        inputSchema: {
          type: "object",
          properties: {}
        }
      }
    ]
  };
});

// ツールの実行
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_current_inventory": {
        const productId = args?.productId;
        
        if (productId) {
          const inventory = currentInventory[productId];
          if (!inventory) {
            return {
              content: [
                {
                  type: "text",
                  text: `商品ID "${productId}" が見つかりませんでした。`
                }
              ]
            };
          }
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(inventory, null, 2)
              }
            ]
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(currentInventory, null, 2)
              }
            ]
          };
        }
      }

      case "get_optimal_inventory": {
        const productId = args?.productId;
        
        if (productId) {
          const optimal = optimalInventory[productId];
          if (!optimal) {
            return {
              content: [
                {
                  type: "text",
                  text: `商品ID "${productId}" の適正在庫データが見つかりませんでした。`
                }
              ]
            };
          }
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(optimal, null, 2)
              }
            ]
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(optimalInventory, null, 2)
              }
            ]
          };
        }
      }

      case "get_inventory_status": {
        const productId = args?.productId;
        
        if (productId) {
          const status = getInventoryStatus(productId);
          if (!status) {
            return {
              content: [
                {
                  type: "text",
                  text: `商品ID "${productId}" のデータが見つかりませんでした。`
                }
              ]
            };
          }
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(status, null, 2)
              }
            ]
          };
        } else {
          const allStatuses = {};
          for (const id of Object.keys(currentInventory)) {
            const status = getInventoryStatus(id);
            if (status) {
              allStatuses[id] = status;
            }
          }
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(allStatuses, null, 2)
              }
            ]
          };
        }
      }

      case "get_reorder_suggestions": {
        const suggestions = [];
        
        for (const productId of Object.keys(currentInventory)) {
          const status = getInventoryStatus(productId);
          if (status && (status.status === "reorder_needed" || status.status === "low_stock")) {
            suggestions.push({
              productId: status.id,
              productName: status.name,
              currentStock: status.currentStock,
              reorderPoint: status.reorderPoint,
              recommendedOrderQuantity: status.reorderQuantity,
              urgency: status.status === "reorder_needed" ? "high" : "medium",
              expectedDelivery: new Date(Date.now() + status.leadTimeDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
          }
        }
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                reorderSuggestions: suggestions,
                totalItemsNeedingReorder: suggestions.length,
                generatedAt: new Date().toISOString()
              }, null, 2)
            }
          ]
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `未知のツール: ${name}`
            }
          ],
          isError: true
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `エラーが発生しました: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// サーバー起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("在庫管理MCP Server が起動しました");
}

main().catch((error) => {
  console.error("サーバー起動エラー:", error);
  process.exit(1);
});