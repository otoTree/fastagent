import mongoose from 'mongoose';
import { Agent, PublishStatus } from '@/models/Agent';
import { User } from '@/models/User';
import { connectDB } from '@/config/database';

const seedData = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // 检查是否已存在测试用户
    let testUser = await User.findOne({ email: 'test@example.com' });
    
    if (!testUser) {
      // 创建测试用户
      testUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123', // 密码会自动哈希
      });
      await testUser.save();
      console.log('Test user created');
    } else {
      console.log('Test user already exists');
    }

    // 检查是否已存在测试智能体
    const existingAgents = await Agent.find({ owner: testUser._id });
    
    if (existingAgents.length === 0) {
      // 创建测试智能体数据
      const testAgents = [
        {
          name: '编程助手',
          description: '专业的编程助手，帮助您解决各种编程问题',
          prompt: '你是一个专业的编程助手，擅长多种编程语言，能够帮助用户解决编程问题、代码调试和优化。',
          modelName: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          isPublic: true,
          tags: ['编程', '开发', '技术'],
          capabilities: ['代码生成', '调试', '优化'],
          publishStatus: PublishStatus.PUBLISHED,
          publishedAt: new Date(),
          owner: testUser._id,
          usageCount: 15,
        },
        {
          name: '写作助手',
          description: '帮助您创作优质内容的写作助手',
          prompt: '你是一个专业的写作助手，能够帮助用户创作各种类型的文章、文案和创意内容。',
          modelName: 'gpt-3.5-turbo',
          temperature: 0.8,
          maxTokens: 1500,
          isPublic: true,
          tags: ['写作', '创作', '文案'],
          capabilities: ['文章写作', '创意生成', '文案优化'],
          publishStatus: PublishStatus.PUBLISHED,
          publishedAt: new Date(),
          owner: testUser._id,
          usageCount: 23,
        },
        {
          name: '数据分析师',
          description: '专业的数据分析和可视化助手',
          prompt: '你是一个专业的数据分析师，擅长数据处理、统计分析和数据可视化。',
          modelName: 'gpt-4',
          temperature: 0.5,
          maxTokens: 2000,
          isPublic: true,
          tags: ['数据分析', '统计', '可视化'],
          capabilities: ['数据处理', '统计分析', '图表生成'],
          publishStatus: PublishStatus.PUBLISHED,
          publishedAt: new Date(),
          owner: testUser._id,
          usageCount: 8,
        },
        {
          name: '语言学习助手',
          description: '帮助您学习各种语言的智能助手',
          prompt: '你是一个专业的语言学习助手，能够帮助用户学习各种语言，提供语法指导和练习。',
          modelName: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 1000,
          isPublic: true,
          tags: ['语言学习', '教育', '练习'],
          capabilities: ['语法指导', '对话练习', '词汇学习'],
          publishStatus: PublishStatus.PUBLISHED,
          publishedAt: new Date(),
          owner: testUser._id,
          usageCount: 31,
        },
      ];

      // 插入测试智能体
      await Agent.insertMany(testAgents);
      console.log('Test agents created successfully');
    } else {
      console.log('Test agents already exist');
    }

    console.log('Seed data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating seed data:', error);
    process.exit(1);
  }
};

seedData();