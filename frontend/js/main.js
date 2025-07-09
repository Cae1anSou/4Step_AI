/**
 * Vue学习助手 - 主要JS文件
 */

// 全局变量
const API_URL = 'http://localhost:8000';
let codeEditor;
let testCodeEditor;
let currentDebugLevel = 0; // 当前调试级别
let originalCode = ''; // 原始代码示例
let componentParts = {
    template: '',
    script: '',
    style: ''
};

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化代码编辑器
    initializeEditors();
    
    // 加载示例代码
    loadExampleCode();
    
    // 设置事件监听
    setupEventListeners();
    
    // 设置导航切换
    setupNavigation();
});

// 初始化代码编辑器
function initializeEditors() {
    // 主代码编辑器
    codeEditor = CodeMirror(document.getElementById('code-editor'), {
        mode: 'vue',
        theme: 'default',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 2,
        tabSize: 2,
        lineWrapping: true,
        extraKeys: { 'Ctrl-Space': 'autocomplete' }
    });

    // 测试页面的代码编辑器
    testCodeEditor = CodeMirror(document.getElementById('test-code-editor'), {
        mode: 'vue',
        theme: 'default',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 2,
        tabSize: 2,
        lineWrapping: true
    });
}

// 加载示例代码
async function loadExampleCode() {
    try {
        // 在实际应用中，这里应该是一个AJAX请求获取示例代码
        // 为了演示，我们使用一个简单的Vue计数器组件作为示例
        const counterComponent = `<template>
  <div class="counter-component">
    <h2>{{ title }}</h2>
    <div class="counter-display">{{ count }}</div>
    <div class="counter-controls">
      <button @click="increment">+</button>
      <button @click="decrement">-</button>
      <button @click="reset">重置</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CounterComponent',
  data() {
    return {
      count: 0,
      title: '计数器组件'
    }
  },
  methods: {
    increment() {
      this.count++
    },
    decrement() {
      if (this.count > 0) {
        this.count--
      }
    },
    reset() {
      this.count = 0
    }
  }
}
</script>

<style scoped>
.counter-component {
  font-family: Arial, sans-serif;
  max-width: 300px;
  margin: 0 auto;
  text-align: center;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.counter-display {
  font-size: 3rem;
  font-weight: bold;
  margin: 20px 0;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.counter-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.counter-controls button {
  font-size: 1.2rem;
  padding: 5px 15px;
  border: none;
  border-radius: 4px;
  background-color: #3498db;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

.counter-controls button:hover {
  background-color: #2980b9;
}

.counter-controls button:last-child {
  background-color: #e74c3c;
}

.counter-controls button:last-child:hover {
  background-color: #c0392b;
}
</style>`;

        // 分离组件的不同部分
        componentParts = parseVueComponent(counterComponent);
        
        // 默认显示完整组件
        originalCode = counterComponent;
        codeEditor.setValue(counterComponent);
        
        // 创建示例HTML文件（在实际应用中应该已经存在）
        createExampleHtml();
        
    } catch (error) {
        console.error('加载示例代码失败:', error);
        showFeedback('error', `加载示例代码失败: ${error.message}`);
    }
}

// 解析Vue组件文件，分离template、script和style部分
function parseVueComponent(code) {
    const templateMatch = code.match(/<template>([\s\S]*?)<\/template>/);
    const scriptMatch = code.match(/<script>([\s\S]*?)<\/script>/);
    const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    
    return {
        template: templateMatch ? templateMatch[1].trim() : '',
        script: scriptMatch ? scriptMatch[1].trim() : '',
        style: styleMatch ? styleMatch[1].trim() : ''
    };
}

// 设置事件监听
function setupEventListeners() {
    // 运行代码按钮
    document.getElementById('run-code-btn').addEventListener('click', runCode);
    
    // 重置代码按钮
    document.getElementById('reset-code-btn').addEventListener('click', () => {
        codeEditor.setValue(originalCode);
    });
    
    // 刷新预览按钮
    document.getElementById('refresh-preview').addEventListener('click', refreshPreview);
    
    // 调试级别选择器
    document.querySelectorAll('.debug-level').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.debug-level').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');
            currentDebugLevel = parseInt(e.target.dataset.level);
        });
    });
    
    // 组件部分选择
    document.querySelectorAll('.component-part').forEach(part => {
        part.addEventListener('click', (e) => {
            const partName = e.target.dataset.part;
            showComponentPart(partName);
        });
    });
    
    // AI聊天窗口切换
    document.getElementById('toggle-chat').addEventListener('click', toggleChatWindow);
    
    // 发送消息
    document.getElementById('send-message').addEventListener('click', sendUserMessage);
    document.getElementById('user-message').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendUserMessage();
        }
    });
    
    // 提交测试答案
    document.getElementById('submit-answer').addEventListener('click', submitTestAnswer);
    
    // AI帮助按钮
    document.getElementById('ai-help-btn').addEventListener('click', requestAIHelp);
}

// 设置导航切换
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');
    
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const targetId = e.target.id.split('-')[0] + '-section';
            
            // 更新导航按钮状态
            navButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            // 更新显示的部分
            sections.forEach(section => {
                if (section.id === targetId) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });
        });
    });
}

// 运行代码
async function runCode() {
    const code = codeEditor.getValue();
    if (!code.trim()) {
        showFeedback('warning', '请先编写代码。');
        return;
    }
    
    showFeedback('info', '正在运行代码...');
    
    try {
        // 构建请求体
        const requestBody = {
            code: code,
            debug_level: currentDebugLevel,
            template_code: {
                'App.vue': code
            }
        };
        
        // 发送请求到后端
        const response = await fetch(`${API_URL}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        const result = await response.json();
        
        // 处理结果
        if (result.success) {
            showFeedback('success', '代码运行成功!<br><pre>' + result.output + '</pre>');
            refreshPreview();
        } else {
            // 根据不同的调试级别显示不同的错误信息
            switch (result.level) {
                case 0: // 原生环境
                    showFeedback('error', `代码运行失败:<br><pre>${result.error}</pre>`);
                    break;
                case 1: // AI筛选
                    showFeedback('error', `代码运行失败:<br><pre>${result.error}</pre>`);
                    break;
                case 2: // AI提示
                    showFeedback('error', `
                        <div class="error-explanation">
                            <h4>代码运行失败</h4>
                            <pre>${result.error}</pre>
                            <h4>AI分析</h4>
                            <div class="ai-explanation">${result.explanation}</div>
                        </div>
                    `);
                    break;
                case 3: // AI给答案
                    showFeedback('error', `
                        <div class="error-explanation">
                            <h4>代码运行失败</h4>
                            <pre>${result.error}</pre>
                            <h4>AI分析</h4>
                            <div class="ai-explanation">${result.explanation}</div>
                            <h4>解决方案</h4>
                            <pre>${result.solution}</pre>
                            <button id="apply-solution" class="apply-solution-btn">应用解决方案</button>
                        </div>
                    `);
                    // 添加应用解决方案按钮的事件监听
                    document.getElementById('apply-solution').addEventListener('click', () => {
                        codeEditor.setValue(result.solution);
                        showFeedback('info', '已应用AI提供的解决方案，您可以再次运行代码查看效果。');
                    });
                    break;
            }
        }
    } catch (error) {
        console.error('代码运行出错:', error);
        showFeedback('error', `连接服务器失败: ${error.message}`);
    }
}

// 在反馈区域显示消息
function showFeedback(type, message) {
    const feedbackContent = document.getElementById('feedback-content');
    feedbackContent.innerHTML = `<div class="feedback-message ${type}">${message}</div>`;
}

// 在测试反馈区域显示消息
function showTestFeedback(type, message) {
    const feedbackContent = document.getElementById('test-feedback-content');
    feedbackContent.innerHTML = `<div class="feedback-message ${type}">${message}</div>`;
}

// 刷新预览
function refreshPreview() {
    const iframe = document.getElementById('preview-iframe');
    iframe.src = 'examples/counter.html';
}

// 显示组件的特定部分
function showComponentPart(part) {
    switch(part) {
        case 'template':
            codeEditor.setValue(`<template>\n${componentParts.template}\n</template>`);
            break;
        case 'script':
            codeEditor.setValue(`<script>\n${componentParts.script}\n</script>`);
            break;
        case 'style':
            codeEditor.setValue(`<style scoped>\n${componentParts.style}\n</style>`);
            break;
        default:
            // 完整组件代码
            codeEditor.setValue(originalCode);
    }
    
    // 更新选中状态
    document.querySelectorAll('.component-part').forEach(el => {
        if (el.dataset.part === part) {
            el.classList.add('selected');
        } else {
            el.classList.remove('selected');
        }
    });
}

// 切换AI聊天窗口
function toggleChatWindow() {
    const chatContainer = document.querySelector('.ai-chat-container');
    chatContainer.classList.toggle('collapsed');
    
    const toggleBtn = document.getElementById('toggle-chat');
    if (chatContainer.classList.contains('collapsed')) {
        toggleBtn.textContent = '展开';
    } else {
        toggleBtn.textContent = '收起';
    }
}

// 发送用户消息
async function sendUserMessage() {
    const messageInput = document.getElementById('user-message');
    const message = messageInput.value.trim();
    if (!message) return;
    
    // 添加用户消息到聊天窗口
    addChatMessage('user', message);
    messageInput.value = '';
    
    // 模拟AI回复
    setTimeout(() => {
        // 在实际应用中，这里应该是一个API调用
        const aiResponse = `我理解您的问题是关于"${message}"。在Vue中，这通常涉及到组件通信的概念。建议您查看Vue官方文档了解更多信息，或者可以尝试修改当前示例来探索这个概念。`;
        addChatMessage('ai', aiResponse);
    }, 1000);
}

// 添加消息到聊天窗口
function addChatMessage(sender, message) {
    const chatMessages = document.querySelector('.chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}-message`;
    
    messageElement.innerHTML = `
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 提交测试答案
async function submitTestAnswer() {
    const code = testCodeEditor.getValue();
    if (!code.trim()) {
        showTestFeedback('warning', '请先编写代码。');
        return;
    }
    
    showTestFeedback('info', '正在检查您的答案...');
    
    try {
        // 在实际应用中，这里应该是一个API调用
        setTimeout(() => {
            // 模拟结果
            const isCorrect = code.includes('data()') && code.includes('count') && code.includes('increment');
            
            if (isCorrect) {
                showTestFeedback('success', '恭喜！您的答案是正确的。');
            } else {
                showTestFeedback('error', '答案有些问题。请尝试实现一个完整的计数器组件。');
                
                // AI助手按钮开始闪烁，提示用户可以获取帮助
                const aiHelpBtn = document.getElementById('ai-help-btn');
                aiHelpBtn.classList.add('pulsing');
            }
        }, 1500);
    } catch (error) {
        console.error('提交答案出错:', error);
        showTestFeedback('error', `连接服务器失败: ${error.message}`);
    }
}

// 请求AI帮助
function requestAIHelp() {
    const aiHelpBtn = document.getElementById('ai-help-btn');
    aiHelpBtn.classList.remove('pulsing');
    
    showTestFeedback('info', `
        <div class="ai-help">
            <h4>AI提示</h4>
            <p>计数器组件需要包含以下几个部分：</p>
            <ol>
                <li>一个模板，显示计数值和增减按钮</li>
                <li>一个data函数，返回包含count初始值的对象</li>
                <li>methods对象，包含increment和decrement方法</li>
            </ol>
            <p>尝试使用@click指令来绑定按钮点击事件，并使用{{ count }}在模板中显示计数值。</p>
        </div>
    `);
}

// 创建示例HTML文件
function createExampleHtml() {
    // 在实际应用中，这个文件应该已经存在
    // 这里仅用于演示，实际情况下可能需要通过后端API创建
    
    // 确保examples目录存在
    const examplesDir = document.createElement('div');
    examplesDir.innerHTML = `
        <iframe id="temp-frame" style="display:none"></iframe>
    `;
    document.body.appendChild(examplesDir);
    
    // 在浏览器环境中无法直接写入文件系统
    // 这个函数在实际应用中应该由后端实现
    console.log('在实际环境中，这里应该创建示例HTML文件');
}
