# 4Step-AI

> 四步调试Demo（内部仓库）

## 功能速览
- 前端：纯静态 HTML/CSS/JS，模拟 IDE 场景
- 后端：FastAPI + 沙盒，按「提示 → 思考 → 行动 → 复盘」四级返回
- 一键启动，依赖极少，方便快速试用

## 目录结构
```text
4Step_AI/
├─ backend/               # FastAPI ⽇常代码
│   ├─ app.py             # 主应用
│   ├─ ai_helper.py       # AI 分析逻辑
│   ├─ sandbox.py         # 代码沙盒
│   └─ requirements.txt   # 依赖列表
├─ frontend/             
│   ├─ index.html         # 入口页
│   ├─ css/               # 样式
│   └─ js/                # 交互脚本
└─ README.md
```

## 快速开始

### 1. 后端（Python ≥3.9）
```bash
cd backend
pip install -r requirements.txt          # 建议在虚拟环境中执行
uvicorn app:app --reload                 # 默认 127.0.0.1:8000
```

### 2. 前端
直接双击 `frontend/index.html`，或启动一个静态服务器：
```bash
cd frontend
python -m http.server 8000
```
浏览器访问 <http://localhost:8000>

## 路线图
- [ ] 情绪检测：识别用户「挣扎」状态
- [ ] UI 呼吸灯：帮助按钮节奏提示
- [ ] 四级调试信息：补全栈追踪 & 建议

## 协作约定
每个人直接开分支提交 PR，命名格式：
```
<类型>/<简述>  # 例：feat/emotion-detector
```

有任何想法随时群里喊我～ 🍻
