const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Word = require('./models/Word');
const User = require('./models/user');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: '用户名已被占用啦' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword, masteredWords: [], starredWords: [], masteryHistory: [] });
        await newUser.save();
        res.json({ message: '注册成功' });
    } catch (err) { res.status(500).json({ message: '注册失败' }); }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !await bcrypt.compare(password, user.password)) return res.status(400).json({ message: '账号或密码错啦' });
        const token = jwt.sign({ userId: user._id }, 'CET6_SECRET_KEY', { expiresIn: '7d' });
        res.json({ 
            token, 
            username: user.username, 
            masteredWords: user.masteredWords || [], 
            starredWords: user.starredWords || [],
            masteryHistory: user.masteryHistory || [] 
        });
    } catch (err) { res.status(500).json({ message: '登录失败' }); }
});

// 🌟🌟🌟 新增：每次重新打开App时，专门用来拉取云端真实数据的通道！
app.get('/api/user', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: '未登录' });
        
        const decoded = jwt.verify(token, 'CET6_SECRET_KEY');
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(404).json({ message: '找不到用户' });
        
        res.json({
            masteredWords: user.masteredWords || [],
            starredWords: user.starredWords || [],
            masteryHistory: user.masteryHistory || []
        });
    } catch (err) { res.status(401).json({ message: '登录已过期' }); }
});

app.post('/api/sync', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, 'CET6_SECRET_KEY');
        const { masteredWords, starredWords } = req.body;
        
       const user = await User.findById(decoded.userId);
        const currentMastered = new Set(user.masteredWords);
        const newWords = masteredWords.filter(idx => !currentMastered.has(idx));
        
        // 🌟 替换为安全的数组合并逻辑：
        user.masteryHistory = user.masteryHistory || [];
        if (newWords.length > 0) {
            const newHistoryEntries = newWords.map(idx => ({ wordIndex: idx, date: new Date() }));
            // 不用 .push，改用安全的 concat 进行合并，绝不崩溃
            user.masteryHistory = user.masteryHistory.concat(newHistoryEntries);
        }
        
        if (masteredWords.length === 0) user.masteryHistory = [];

        user.masteredWords = masteredWords;
        user.starredWords = starredWords;
        await user.save();
        res.json({ message: '同步成功' });
    } catch (err) { res.status(500).json({ message: '同步失败' }); }
});

app.get('/api/words', async (req, res) => {
    const words = await Word.find().sort({ originalIndex: 1 });
    res.json(words);
});

app.use(express.static('public'));
mongoose.connect(process.env.MONGODB_URI).then(() => {
    app.listen(process.env.PORT || 5000, () => console.log('🚀 Server Ready'));
});