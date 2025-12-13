#!/usr/bin/env bun

import Anthropic from "@anthropic-ai/sdk";

async function main() {
  // コマンドライン引数の処理
  const args = Bun.argv.slice(2);
  let model = "claude-sonnet-4-5";

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

  // APIキーの確認
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("エラー: ANTHROPIC_API_KEY環境変数が設定されていません");
    process.exit(1);
  }

  // Anthropicクライアントの作成
  const client = new Anthropic();

  try {
    // トークン数をカウント
    const response = await client.messages.countTokens({
      model: model,
      messages: [
        {
          role: "user",
          content: messageText.trim(),
        },
      ],
    });

    // 結果を表示
    console.log(`入力トークン数: ${response.input_tokens}`);
  } catch (error) {
    console.error("エラーが発生しました:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("予期しないエラーが発生しました:", error);
  process.exit(1);
});
