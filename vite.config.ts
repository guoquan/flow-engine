import { defineConfig, Plugin } from 'vite';
import path from 'path';
import bodyParser from 'body-parser';

// 🧠 Flow Brain: Mock Backend integrated into Vite
const flowBrainPlugin = (): Plugin => {
  return {
    name: 'flow-brain-plugin',
    configureServer(server) {
      // Middleware to parse JSON bodies
      server.middlewares.use(bodyParser.json());

      // API Route Handler
      server.middlewares.use('/api/chat', (req, res, next) => {
        if (req.method === 'POST') {
          let body = (req as any).body;
          
          // Debug log
          console.log('[Brain] Received:', body);

          const userText = body?.text || "";
          
          // Logic (Same as before)
          let replyText = "我听到了。";
          let action = "idle";
          let emotion = "neutral";

          if (userText.includes("你好") || userText.includes("hello")) {
            replyText = "你好呀！很高兴见到你。";
            action = "wave";
            emotion = "happy";
          } else if (userText.includes("跳舞") || userText.includes("dance")) {
            replyText = "好的，给你表演一段！";
            action = "dance";
            emotion = "excited";
          } else if (userText.includes("再见") || userText.includes("bye")) {
            replyText = "下次再聊，拜拜！";
            action = "bow";
            emotion = "sad";
          }

          const response = {
            text: replyText,
            command: { action, emotion, duration: 2000 }
          };

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(response));
        } else {
          next();
        }
      });
    },
  };
};

export default defineConfig({
  plugins: [flowBrainPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
  }
});