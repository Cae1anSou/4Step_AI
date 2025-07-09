from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import subprocess
import tempfile
import os
import json
import traceback

from ai_helper import analyze_error, get_filtered_errors, get_detailed_explanation, get_solution_code

app = FastAPI()

# 添加CORS中间件，允许前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 到时候真正部署的时候应该设置为具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeExecutionRequest(BaseModel):
    code: str
    template_code: Optional[Dict[str, str]] = None
    debug_level: int = 0  # 0: 原生环境, 1: AI筛选, 2: AI提示, 3: AI给答案

@app.post("/execute")
async def execute_code(request: CodeExecutionRequest):
    """
    执行用户提交的Vue代码，根据debug_level返回不同级别的错误信息
    """
    try:
        # 创建临时文件保存用户代码
        with tempfile.TemporaryDirectory() as temp_dir:
            # 创建基本Vue项目结构
            template_files = request.template_code or {}
            
            # 写入用户代码和模板代码到临时目录
            for file_path, content in template_files.items():
                full_path = os.path.join(temp_dir, file_path)
                os.makedirs(os.path.dirname(full_path), exist_ok=True)
                with open(full_path, 'w') as f:
                    f.write(content)
            
            # 写入用户提交的代码到main.js或其他指定文件
            with open(os.path.join(temp_dir, 'user_code.js'), 'w') as f:
                f.write(request.code)
            
            # 使用Node.js/Vue CLI进行构建检查
            result = subprocess.run(
                ['node', '-e', f'try {{ eval(require("fs").readFileSync("{os.path.join(temp_dir, "user_code.js")}", "utf8")); console.log("代码语法正确"); }} catch(e) {{ console.error(e); process.exit(1); }}'],
                capture_output=True,
                text=True
            )
            
            raw_output = result.stdout
            raw_error = result.stderr
            success = result.returncode == 0
            
            # 根据debug_level返回不同级别的信息
            if success:
                return {"success": True, "output": raw_output}
            else:
                if request.debug_level == 0:
                    # 阶段0: 原生环境，返回原始错误
                    return {"success": False, "error": raw_error, "level": 0}
                elif request.debug_level == 1:
                    # 阶段1: AI筛选，返回筛选后的错误信息
                    filtered_errors = get_filtered_errors(raw_error, request.code)
                    return {"success": False, "error": filtered_errors, "level": 1}
                elif request.debug_level == 2:
                    # 阶段2: AI提示，返回错误分析，但不提供具体代码
                    explanation = get_detailed_explanation(raw_error, request.code)
                    return {"success": False, "error": raw_error, "explanation": explanation, "level": 2}
                elif request.debug_level == 3:
                    # 阶段3: AI给答案，返回解决方案代码
                    explanation = get_detailed_explanation(raw_error, request.code)
                    solution_code = get_solution_code(raw_error, request.code)
                    return {
                        "success": False, 
                        "error": raw_error, 
                        "explanation": explanation,
                        "solution": solution_code,
                        "level": 3
                    }
    except Exception as e:
        traceback_str = traceback.format_exc()
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"服务器内部错误: {str(e)}", "traceback": traceback_str}
        )

class SandboxRequest(BaseModel):
    html: str
    css: str
    js: str

@app.post("/sandbox")
async def create_sandbox(request: SandboxRequest):
    """
    创建一个包含用户HTML/CSS/JS代码的沙盒环境
    """
    try:
        # 创建临时沙盒文件
        with tempfile.TemporaryDirectory() as temp_dir:
            # 写入HTML文件
            with open(os.path.join(temp_dir, 'index.html'), 'w') as f:
                f.write(request.html)
            
            # 写入CSS文件
            with open(os.path.join(temp_dir, 'style.css'), 'w') as f:
                f.write(request.css)
            
            # 写入JS文件
            with open(os.path.join(temp_dir, 'script.js'), 'w') as f:
                f.write(request.js)
            
            # TODO: 这里需要实现沙盒环境的创建和访问机制
            # 简化版：返回文件内容供前端直接使用
            return {
                "success": True,
                "sandbox_id": "demo_sandbox_123",  # 到时候应该是唯一动态ID
                "html": request.html,
                "css": request.css,
                "js": request.js
            }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"创建沙盒失败: {str(e)}"}
        )

# 健康检查端点
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
