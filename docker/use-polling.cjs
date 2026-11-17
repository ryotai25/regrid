// イメージの起動スクリプトは NODE_* と TZ 以外の環境変数を Foundry に渡さない。
// 共有フォルダ越しでは inotify が届かないので、ここで chokidar をポーリングに切り替える。
process.env.CHOKIDAR_USEPOLLING = "true";
process.env.CHOKIDAR_INTERVAL ??= "300";
