const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    masteredWords: [Number], // 已掌握单词
    starredWords: [Number]   // 新增：生词本（星标单词）
});

module.exports = mongoose.model('User', userSchema);