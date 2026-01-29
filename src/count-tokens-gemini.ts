#!/usr/bin/env bun

import { GoogleGenAI } from "@google/genai";

async function main() {
  // コマンドライン引数の処理
  const args = Bun.argv.slice(2);
  let model = "gemini-2.5-flash";

  // --modelオプションの処理
  const modelIndex = args.indexOf("--model");
  if (modelIndex !== -1 && modelIndex + 1 < args.length) {
    model = args[modelIndex + 1]!;
  }

  // 標準入力からメッセージを読み取る
  const messageText = await Bun.stdin.text();

  if (!messageText.trim()) {
    console.error("エラー: メッセージが空です");
    process.exit(1);
  }

  // 環境変数の確認
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || "global";

  if (!projectId) {
    console.error("エラー: GOOGLE_CLOUD_PROJECT環境変数が設定されていません");
    process.exit(1);
  }

  // GoogleGenAI クライアントの作成（Vertex AI モード）
  const client = new GoogleGenAI({
    vertexai: true,
    project: projectId,
    location: location,
  });

  try {
    // トークン数をカウント
    const response = await client.models.countTokens({
      model: model,
      contents: messageText.trim(),
    });

    // 結果を表示
    console.log(`入力トークン数: ${response.totalTokens}`);
  } catch (error) {
    console.error("エラーが発生しました:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("予期しないエラーが発生しました:", error);
  process.exit(1);
});
