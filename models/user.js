const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true }, // 用户名唯一
    password: { type: String, required: true },               // 加密后的密码
    masteredWords: [Number]                                   // 专门存储该用户背过的单词索引
});

module.exports = mongoose.model('User', userSchema);