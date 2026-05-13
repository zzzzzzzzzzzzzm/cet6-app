const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// 引入刚刚建好的单词模型
const Word = require('./models/Word');

const app = express();
app.use(cors());
app.use(express.json());


// 👇 新增的 API 接口：当前端请求 /api/words 时，把云端的单词发过去
app.get('/api/words', async (req, res) => {
    try {
        // 从数据库中拉取所有的单词，按 originalIndex (原先的顺序) 排序
        const words = await Word.find().sort({ originalIndex: 1 });
        // 将数据以 JSON 格式发送给前端
        res.json(words);
    } catch (error) {
        console.error("获取单词失败:", error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 连接 MongoDB 数据库
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ 数据库连接成功！');
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`🚀 服务器正在运行，请在浏览器访问: http://localhost:${PORT}`);
            console.log(`📚 单词接口地址: http://localhost:${PORT}/api/words`);
        });
    })
    .catch((err) => {
        console.error('❌ 数据库连接失败：', err.message);
    });
// 让服务器公开 public 文件夹里的网页
app.use(express.static('public'));
