# 4Step-AI


## 目录结构

```
4Step_AI/
├─ backend/               # 后端FastAPI应用
│   ├─ app.py             # FastAPI主应用
│   ├─ ai_helper.py       # AI分析模块
│   ├─ sandbox.py         # 代码沙盒环境
│   └─ requirements.txt   # 后端依赖
├─ frontend/              # 前端网页
│   ├─ index.html         # 主页面
│   ├─ css/               # 样式文件
│   ├─ js/                # JavaScript文件
│   └─ examples/          # Vue示例代码和展示
└─ README.md              # 项目说明
```

## 安装与运行

### 后端设置

1. 安装Python依赖：

```bash
cd backend
pip install -r requirements.txt
```

2. 运行FastAPI服务：

```bash
cd backend
uvicorn app:app --reload
```

### 前端设置

直接打开前端目录中的`index.html`文件，或使用任何HTTP服务器提供前端文件：

```bash
cd frontend
python -m http.server
```

然后访问 http://localhost:8000


### 待实现功能

- 实现用户情绪状态检测机制
- 自动检测用户挣扎情况并触发帮助按钮脉动提示
- 修改后端以支持四级调试模式返回不同错误信息
