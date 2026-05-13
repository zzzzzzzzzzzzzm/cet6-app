const mongoose = require('mongoose');

// 定义单词的数据结构
const wordSchema = new mongoose.Schema({
    word: String,           // 英文单词
    meaning: String,        // 中文意思
    notes: String,          // 易混词、近义词等笔记
    originalIndex: Number   // 原始排序索引
});

// 导出模型，方便其他文件调用
module.exports = mongoose.model('Word', wordSchema);