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
    console.log('DOM加载完成，准备加载Monaco编辑器...');
    
    // 先设置事件监听（不依赖于编辑器的部分）
    setupNavigation();
    
    // 确保在编辑器区域显示加载消息
    const codeEditorElement = document.getElementById('code-editor');
    if (codeEditorElement) {
        codeEditorElement.innerHTML = '<div style="padding: 10px; color: #666;">Monaco编辑器加载中...</div>';
    }
    
    // 使用require加载Monaco编辑器
    window.require(['vs/editor/editor.main'], function() {
        console.log('Monaco编辑器加载成功!');
        
        // 初始化编辑器
        setTimeout(() => {
            initializeEditors();
            
            // 等待编辑器初始化完成后再加载示例代码
            setTimeout(() => {
                loadExampleCode();
                // 设置事件监听（依赖于编辑器的部分）
                setupEventListeners();
            }, 500);
        }, 200);
    }, function(error) {
        console.error('Monaco编辑器加载失败:', error);
        const codeEditorElement = document.getElementById('code-editor');
        if (codeEditorElement) {
            codeEditorElement.innerHTML = '<div style="padding: 10px; color: #f00;">Monaco编辑器加载失败。请刷新页面重试。</div>';
        }
    });
});

// 初始化代码编辑器
function initializeEditors() {
    console.log('初始化编辑器...');
    try {
        // 首先检查monaco对象是否存在
        if (typeof monaco === 'undefined') {
            console.error('Monaco未定义！请确保 Monaco 加载完毕');
            return;
        }
        console.log('Monaco已成功加载，正在注册Vue语言...');
        
        // 注册 Vue 语言支持
        monaco.languages.register({ id: 'vue' });

        // 完全重写Vue的语法高亮规则
        monaco.languages.setMonarchTokensProvider('vue', {
            // 使用HTML的基本高亮规则
            defaultToken: '',
            tokenPostfix: '.vue',
            ignoreCase: true,
            
            // HTML标签匹配规则
            brackets: [
                { token: 'delimiter.bracket', open: '{', close: '}' },
                { token: 'delimiter.square', open: '[', close: ']' },
                { token: 'delimiter.parenthesis', open: '(', close: ')' },
                { token: 'delimiter.angle', open: '<', close: '>' }
            ],
            
            // 关键字
            keywords: [
                'template', 'script', 'style', 'v-if', 'v-else', 'v-for', 'v-model', 'v-on', 'v-bind', 'v-show',
                'component', 'keep-alive', 'slot', 'transition', 'transition-group',
                'v-html', 'v-cloak', 'v-once'
            ],
            
            tokenizer: {
                root: [
                    // 注释
                    [/<!--/, 'comment', '@comment'],
                    
                    // vue标签
                    [/<(template|script|style)\b/, {
                        token: '@rematch',
                        next: '@tag_$1',
                        nextEmbedded: '$1'
                    }],
                    
                    // 其他HTML标签
                    [/<\/?\w+/, 'tag', '@tag'],
                    
                    // Vue模板插值 {{ }}
                    [/{{/, { token: 'delimiter.bracket', next: '@vueExpression' }],
                    
                    // 其他内容
                    [/[^<{{]+/, 'text']
                ],
                
                // 处理Vue模板插值
                vueExpression: [
                    [/}}/, { token: 'delimiter.bracket', next: '@pop' }],
                    [/'[^']*'/, 'string'],
                    [/"[^"]*"/, 'string'],
                    [/\d+\.\d+/, 'number.float'],
                    [/\d+/, 'number'],
                    [/[a-zA-Z_$][\w$]*/, {
                        cases: {
                            '@keywords': 'keyword',
                            '@default': 'variable'
                        }
                    }],
                    [/[<>\+\-\*\/=!]+/, 'operator'],
                    [/[\[\]\(\)\{\}]/, 'delimiter.bracket'],
                    [/[,:\.]/, 'delimiter'],
                    [/\s+/, 'white']
                ],
                
                // 处理HTML标签
                tag: [
                    [/\/>|>/, 'tag', '@pop'],
                    [/v-[a-zA-Z0-9:-]+/, 'keyword'],  // Vue指令
                    [/\w+/, 'attribute.name'],
                    [/=/, 'delimiter'],
                    [/"[^"]*"/, 'attribute.value'],
                    [/'[^']*'/, 'attribute.value'],
                    [/\s+/, 'white']
                ],
                
                // 特殊处理template标签
                tag_template: [
                    [/>/, { token: 'tag', next: '@template_code', nextEmbedded: 'text/html' }]
                ],
                template_code: [
                    [/<\/template>/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }]
                ],
                
                // 特殊处理script标签
                tag_script: [
                    [/>/, { token: 'tag', next: '@script_code', nextEmbedded: 'text/javascript' }]
                ],
                script_code: [
                    [/<\/script>/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }]
                ],
                
                // 特殊处理style标签
                tag_style: [
                    [/>/, { token: 'tag', next: '@style_code', nextEmbedded: 'text/css' }]
                ],
                style_code: [
                    [/<\/style>/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }]
                ],
                
                // 注释
                comment: [
                    [/-->/, 'comment', '@pop'],
                    [/./, 'comment']
                ]
            }
        });

        // 创建Vue语言的格式化规则
        monaco.languages.registerDocumentFormattingEditProvider('vue', {
            provideDocumentFormattingEdits: function(model) {
                return [
                    {
                        range: model.getFullModelRange(),
                        text: model.getValue() // 暂不实现格式化
                    }
                ];
            }
        });

        // 创建主代码编辑器
        console.log('创建主代码编辑器...');
        const codeEditorElement = document.getElementById('code-editor');
        if (!codeEditorElement) {
            console.error('主代码编辑器元素不存在!');
            return;
        }
        
        // 清空加载信息
        codeEditorElement.innerHTML = '';
        
        try {
            codeEditor = monaco.editor.create(codeEditorElement, {
                value: '',
                language: 'vue',
                theme: 'vs',  // 也可以使用 'vs-dark' 或 'hc-black'
                automaticLayout: true,
                wordWrap: 'on',
                fontSize: 14,
                minimap: { enabled: false },
                lineNumbers: 'on',
                tabSize: 2,
                // 启用其他实用功能
                formatOnPaste: true,
                formatOnType: true,
                suggestOnTriggerCharacters: true,
                // 代码检查
                codeLens: true,
                // 自动完成功能
                quickSuggestions: true,
                acceptSuggestionOnCommitCharacter: true,
                acceptSuggestionOnEnter: 'on',
                parameterHints: { enabled: true },
                // 错误提示和修复
                lightbulb: { enabled: true },
                // 滚动设置
                scrollBeyondLastLine: false,
            });
            console.log('主编辑器创建成功!');
        } catch (err) {
            console.error('主编辑器创建失败:', err);
            return;
        }

        // 测试页面的代码编辑器
        console.log('创建测试代码编辑器...');
        const testCodeEditorElement = document.getElementById('test-code-editor');
        if (!testCodeEditorElement) {
            console.warn('测试代码编辑器元素不存在!');
            // 跳过测试编辑器创建，但不影响主编辑器
        } else {
            // 清空加载信息
            testCodeEditorElement.innerHTML = '';
            
            try {
                testCodeEditor = monaco.editor.create(testCodeEditorElement, {
                    value: '',
                    language: 'vue',
                    theme: 'vs',
                    automaticLayout: true,
                    wordWrap: 'on',
                    fontSize: 14,
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    tabSize: 2,
                });
                console.log('测试编辑器创建成功!');
            } catch (err) {
                console.error('测试编辑器创建失败:', err);
                // 继续执行，因为主编辑器已创建成功
            }
        }

        // 创建Vue代码诊断
        console.log('Configuring Vue diagnostics...');
        if (codeEditor) {
            configureVueDiagnostics(codeEditor, monaco);
        }
        
        if (testCodeEditor) {
            configureVueDiagnostics(testCodeEditor, monaco);
        }
    } catch (error) {
        console.error('Monaco编辑器初始化失败:', error);
    }
}

// 配置Vue代码诊断 - 实现VSCode风格的静态检查
function configureVueDiagnostics(editor, monaco) {
    // 监听编辑器内容变化
    let changeTimeout = null;
    editor.onDidChangeModelContent(() => {
        // 防抖处理，避免频繁检查
        if (changeTimeout) {
            clearTimeout(changeTimeout);
        }
        
        changeTimeout = setTimeout(() => {
            const code = editor.getValue();
            validateVueCode(code, editor, monaco);
        }, 500);
    });
}

// 验证Vue代码
function validateVueCode(code, editor, monaco) {
    // 清除现有的标记
    monaco.editor.setModelMarkers(editor.getModel(), 'vue-validator', []);
    
    const markers = [];
    
    // 1. 验证HTML模板标签匹配
    validateHtmlTags(code, markers);
    
    // 2. 验证Vue指令语法
    validateVueDirectives(code, markers);
    
    // 3. 简单JavaScript语法检查（更复杂的检查通常需要使用ESLint等）
    validateJavaScript(code, markers);
    
    // 设置标记到编辑器
    monaco.editor.setModelMarkers(editor.getModel(), 'vue-validator', markers);
}

// 验证HTML标签是否匹配
function validateHtmlTags(code, markers) {
    const openTagsRegex = /<(\w+)[^>]*>/g;
    const selfClosingTagsRegex = /<(\w+)[^>]*\/>/g;
    const closeTagsRegex = /<\/(\w+)>/g;
    
    const stack = [];
    let match;
    
    // 记录所有自闭合标签
    const selfClosingTags = [];
    while ((match = selfClosingTagsRegex.exec(code)) !== null) {
        selfClosingTags.push(match.index);
    }
    
    // 检查开标签
    while ((match = openTagsRegex.exec(code)) !== null) {
        // 检查是否为自闭合标签
        let isSelfClosing = false;
        for (const pos of selfClosingTags) {
            if (match.index === pos) {
                isSelfClosing = true;
                break;
            }
        }
        
        if (!isSelfClosing) {
            stack.push({
                tag: match[1],
                index: match.index,
                length: match[0].length
            });
        }
    }
    
    // 检查关标签
    while ((match = closeTagsRegex.exec(code)) !== null) {
        const closeTag = match[1];
        
        if (stack.length > 0 && stack[stack.length - 1].tag === closeTag) {
            stack.pop(); // 匹配成功，弹出栈
        } else {
            // 关闭标签没有对应的开始标签
            const pos = getPositionFromIndex(code, match.index);
            markers.push({
                severity: monaco.MarkerSeverity.Error,
                startLineNumber: pos.line,
                startColumn: pos.column,
                endLineNumber: pos.line,
                endColumn: pos.column + match[0].length,
                message: `关闭标签 </${closeTag}> 没有匹配的开始标签`
            });
        }
    }
    
    // 检查未关闭的标签
    for (const unmatched of stack) {
        const pos = getPositionFromIndex(code, unmatched.index);
        markers.push({
            severity: monaco.MarkerSeverity.Error,
            startLineNumber: pos.line,
            startColumn: pos.column,
            endLineNumber: pos.line,
            endColumn: pos.column + unmatched.length,
            message: `标签 <${unmatched.tag}> 未关闭`
        });
    }
}

// 验证Vue指令语法
function validateVueDirectives(code, markers) {
    // 常见Vue指令错误检查
    const directives = [
        { regex: /v-for\s*=\s*"[^"]*"\s+(?!:key|v-bind:key)/g, message: 'v-for 指令应该始终包含 :key' },
        { regex: /v-else\s+v-if/g, message: 'v-else 和 v-if 不能用在同一个元素上，应使用 v-else-if' },
        { regex: /v-model\s*=\s*"([^"]+)\.([^"]+)"\s+v-for/g, message: 'v-model 与 v-for 一起使用时，要小心作用域问题' },
        { regex: /v-if\s*=\s*"[^"]*"\s+v-for/g, message: '不建议 v-if 与 v-for 一起使用，应优先使用计算属性过滤' }
    ];
    
    for (const directive of directives) {
        let match;
        while ((match = directive.regex.exec(code)) !== null) {
            const pos = getPositionFromIndex(code, match.index);
            markers.push({
                severity: monaco.MarkerSeverity.Warning,
                startLineNumber: pos.line,
                startColumn: pos.column,
                endLineNumber: pos.line,
                endColumn: pos.column + match[0].length,
                message: directive.message
            });
        }
    }
}

// 简单验证JavaScript部分
function validateJavaScript(code, markers) {
    // 提取<script>标签内容
    const scriptMatch = code.match(/<script>(\s*[\s\S]*?)<\/script>/);
    if (!scriptMatch) return;
    
    const scriptContent = scriptMatch[1];
    const scriptStart = code.indexOf(scriptContent);
    
    // 检查常见JS错误
    const jsChecks = [
        { regex: /(?<![\.\w])console\.log/g, message: '生产环境中应该移除 console.log 语句' },
        { regex: /var\s+/g, message: '应使用 let 或 const 替代 var' },
        { regex: /this\.\$refs\.[\w$]+\.[\w$]+/g, message: '直接修改子组件状态可能会导致问题，考虑使用props或事件' },
        { regex: /([\w$]+)\s*=\s*([\w$]+)\s*[^=><]?=\s*/g, message: '您是否想使用 === 而不是 = ?' },
    ];
    
    for (const check of jsChecks) {
        let match;
        while ((match = check.regex.exec(scriptContent)) !== null) {
            const pos = getPositionFromIndex(code, scriptStart + match.index);
            markers.push({
                severity: monaco.MarkerSeverity.Warning,
                startLineNumber: pos.line,
                startColumn: pos.column,
                endLineNumber: pos.line,
                endColumn: pos.column + match[0].length,
                message: check.message
            });
        }
    }
}

// 辅助函数：根据索引获取行列位置
function getPositionFromIndex(text, index) {
    const lines = text.substring(0, index).split('\n');
    return {
        line: lines.length,
        column: lines[lines.length - 1].length + 1
    };
}

// 加载示例代码
async function loadExampleCode() {
    console.log('Loading example code...');
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
        // 确保编辑器已经初始化
        console.log('Setting example code in editor...', codeEditor ? 'Editor exists' : 'Editor not initialized');
        
        if (codeEditor) {
            try {
                codeEditor.setValue(counterComponent);
                console.log('Example code set successfully!');
            } catch (err) {
                console.error('Failed to set editor value:', err);
            }
        } else {
            console.warn('Editor not initialized yet, will try again in 1 second');
            // 编辑器可能还没有初始化完成，我们尝试延迟加载
            setTimeout(() => {
                if (codeEditor) {
                    try {
                        codeEditor.setValue(counterComponent);
                        console.log('Example code set with delay!');
                    } catch (err) {
                        console.error('Failed to set editor value after delay:', err);
                    }
                } else {
                    console.error('Editor still not initialized after delay');
                }
            }, 1000);
        }
        
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
    console.log('设置事件监听...');
    
    // 运行代码按钮
    document.getElementById('run-code-btn').addEventListener('click', runCode);
    
    // 重置代码按钮
    document.getElementById('reset-code-btn').addEventListener('click', () => {
        if (codeEditor && originalCode) {
            codeEditor.setValue(originalCode);
            showFeedback('info', '代码已重置为初始示例。');
        }
    });
    
    // 刷新预览按钮
    document.getElementById('refresh-preview').addEventListener('click', refreshPreview);
    
    // 组件树点击事件
    const componentParts = document.querySelectorAll('.component-part');
    componentParts.forEach(part => {
        part.addEventListener('click', (e) => {
            const partType = e.target.getAttribute('data-part');
            showComponentPart(partType);
        });
    });
    
    // AI聊天切换
    const aiChatToggle = document.getElementById('ai-chat-toggle');
    if (aiChatToggle) {
        aiChatToggle.addEventListener('click', toggleChatWindow);
    }
    
    // AI聊天发送消息
    const sendMessageBtn = document.getElementById('send-message');
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', sendUserMessage);
    }
    
    // 提交测试答案
    const submitAnswerBtn = document.getElementById('submit-answer');
    if (submitAnswerBtn) {
        submitAnswerBtn.addEventListener('click', submitTestAnswer);
    }
    
    // 帮助按钮 - 新功能
    const helpButton = document.getElementById('help-button');
    if (helpButton) {
        helpButton.addEventListener('click', increaseHelpLevel);
    }
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
    console.log('运行代码按钮被点击');
    
    // 检查编辑器是否存在
    if (!codeEditor) {
        console.error('编辑器实例不存在!');
        showFeedback('error', '编辑器初始化失败，请刷新页面重试。');
        return;
    }
    
    // 使用Monaco Editor的API获取代码
    let code;
    try {
        code = codeEditor.getValue();
        console.log('获取到编辑器代码:', code ? '代码长度:' + code.length : '无代码');
    } catch (err) {
        console.error('获取编辑器代码失败:', err);
        showFeedback('error', '无法从编辑器获取代码。错误: ' + err.message);
        return;
    }
    
    if (!code || !code.trim()) {
        console.log('代码为空');
        showFeedback('warning', '请先编写代码。');
        return;
    }
    
    showFeedback('info', '正在运行代码...');
    console.log('准备发送请求到后端...');
    
    try {
        // 构建请求体
        const requestBody = {
            code: code,
            debug_level: currentDebugLevel,
            template_code: {
                'App.vue': code
            }
        };
        
        console.log('发送代码到后端:', API_URL + '/execute');
        
        // 发送请求到后端
        const response = await fetch(`${API_URL}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        }).catch(error => {
            console.error('请求失败:', error);
            throw new Error('连接后端服务器失败，请确保后端服务器已启动。');
        });
        
        console.log('收到后端响应:', response.status);
        
        const result = await response.json().catch(error => {
            console.error('解析响应JSON失败:', error);
            throw new Error('无法解析后端响应。');
        });
        
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
                        codeEditor && codeEditor.setValue(result.solution);
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
    // 确保编辑器已初始化
    if (!codeEditor) return;
    
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

// 增加帮助级别
function increaseHelpLevel() {
    console.log('增加帮助级别...');
    
    // 提升帮助级别，实现循环
    currentDebugLevel = (currentDebugLevel + 1) % 4;
    
    // 更新界面显示
    const levelIndicator = document.getElementById('help-level-indicator');
    
    // 更新显示文本
    switch(currentDebugLevel) {
        case 0:
            levelIndicator.textContent = '原始报错';
            break;
        case 1:
            levelIndicator.textContent = 'AI筛选';
            break;
        case 2:
            levelIndicator.textContent = 'AI提示';
            break;
        case 3:
            levelIndicator.textContent = 'AI解决';
            break;
    }
    
    console.log('当前帮助级别更新为:', currentDebugLevel);
    
    // 如果有错误结果，自动重新运行代码获取更新后的提示
    const feedbackContent = document.getElementById('feedback-content');
    if (feedbackContent && feedbackContent.querySelector('.feedback-message.error')) {
        // 有错误结果，自动重新运行获取新的提示
        runCode();
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
