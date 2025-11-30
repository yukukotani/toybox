#!/usr/bin/env bun

import { $ } from "bun";

interface Repository {
  name: string;
  full_name: string;
  fork: boolean;
}

async function getRepositories(user: string): Promise<Repository[]> {
  const result =
    await $`gh api users/${user}/repos --paginate -q '.[] | {name, full_name, fork}'`.text();

  // 各行をパースして配列に変換
  const repos = result
    .trim()
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as Repository);

  return repos;
}

async function transferRepository(
  srcUser: string,
  repoName: string,
  destUser: string
): Promise<void> {
  console.log(`  移行中: ${srcUser}/${repoName} -> ${destUser}/${repoName}`);

  try {
    await $`gh api repos/${srcUser}/${repoName}/transfer -f new_owner=${destUser}`.quiet();
    console.log(`  ✓ 完了: ${repoName}`);
  } catch (error) {
    console.error(`  ✗ 失敗: ${repoName}`, error);
    throw error;
  }
}

async function main() {
  const args = Bun.argv.slice(2);

  if (args.length < 2) {
    console.error(
      "使い方: bun src/transfer-fork-repositories.ts <src_user> <dest_user>"
    );
    console.error("例: bun src/transfer-fork-repositories.ts olduser newuser");
    process.exit(1);
  }

  const srcUser = args[0]!;
  const destUser = args[1]!;

  console.log(
    `フォークリポジトリを ${srcUser} から ${destUser} に移行します\n`
  );

  // リポジトリ一覧を取得
  console.log(`${srcUser} のリポジトリを取得中...`);
  const repos = await getRepositories(srcUser);

  // フォークリポジトリをフィルタリング
  const forkRepos = repos.filter((repo) => repo.fork);

  if (forkRepos.length === 0) {
    console.log("フォークリポジトリが見つかりませんでした。");
    return;
  }

  console.log(`${forkRepos.length} 件のフォークリポジトリが見つかりました:\n`);
  for (const repo of forkRepos) {
    console.log(`  - ${repo.name}`);
  }

  const answer = prompt(
    `\nこれらのリポジトリを ${destUser} に移行しますか？ (y/N)`
  );
  if (answer?.toLowerCase() !== "y") {
    console.log("キャンセルしました。");
    return;
  }

  console.log("\n移行を開始します...\n");

  let successCount = 0;
  let failCount = 0;

  for (const repo of forkRepos) {
    try {
      await transferRepository(srcUser, repo.name, destUser);
      successCount++;
    } catch {
      failCount++;
    }
  }

  console.log(`\n完了: 成功 ${successCount} 件, 失敗 ${failCount} 件`);
}

main().catch((error) => {
  console.error("エラーが発生しました:", error);
  process.exit(1);
});
