const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// 引入我们的模型
const Word = require('./models/Word');
const User = require('./models/user'); // 对应你左侧新建的 user.js 文件

// 🚗 第一步：先造出 app 这辆车！
const app = express();

// 🔧 第二步：给 app 安装“配件”（中间件）
app.use(cors());
app.use(express.json());

// 🛣️ 第三步：规定 app 的行驶路线（API 接口）

// --- 注册接口 ---
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        // 1. 检查用户是否已存在
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: '用户名已被占用啦' });

        // 2. 给密码打马赛克（加密）
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. 存入数据库
        const newUser = new User({ username, password: hashedPassword, masteredWords: [] });
        await newUser.save();

        res.json({ message: '注册成功！快去登录吧' });
    } catch (err) {
        res.status(500).json({ message: '服务器开小差了' });
    }
});

// --- 登录接口 ---
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        // 1. 找人
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: '用户不存在' });

        // 2. 验暗号（比对密码）
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: '密码错啦' });

        // 3. 发放“电子准考证”(Token)，有效期7天
        const token = jwt.sign({ userId: user._id }, 'CET6_SECRET_KEY', { expiresIn: '7d' });

       res.json({ 
            token, 
            username: user.username, 
            masteredWords: user.masteredWords || [], 
            starredWords: user.starredWords || [] 
        });
    } catch (err) {
        res.status(500).json({ message: '登录失败' });
    }
});
// --- 云端存档接口 (保存用户背诵进度) ---
app.post('/api/sync', async (req, res) => {
    try {
        // 1. 检查请求头里有没有“电子准考证” (Token)
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) return res.status(401).json({ message: '请先登录哦' });

        // 2. 验证准考证是否真实有效
        const decoded = jwt.verify(token, 'CET6_SECRET_KEY');

        // 3. 拿到前端传过来的进度数据
        const { masteredWords } = req.body;

        // 4. 根据准考证里的用户 ID，去数据库更新这个人的进度
        await User.findByIdAndUpdate(decoded.userId, { masteredWords });
        
        res.json({ message: '云端同步成功！进度已保存' });
    } catch (err) {
        console.error("同步失败:", err);
        res.status(500).json({ message: '同步失败，登录可能已过期' });
    }
});

// --- 获取单词接口 ---
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

// 让服务器公开 public 文件夹里的网页
app.use(express.static('public'));

// ⛽ 第四步：连接数据库并启动服务器
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