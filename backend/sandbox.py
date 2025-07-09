"""
沙盒环境模块 - 用于安全执行用户提交的Vue代码
"""

import subprocess
import tempfile
import os
import json
from typing import Dict, Any, Optional, Tuple

class VueSandbox:
    """Vue代码沙盒环境，用于安全执行和测试用户提交的代码"""
    
    def __init__(self):
        """初始化沙盒环境"""
        self.temp_dir = None
        self.sandbox_id = None
    
    def create_sandbox(self) -> str:
        """创建一个新的沙盒环境，返回沙盒ID"""
        self.temp_dir = tempfile.mkdtemp(prefix="vue_sandbox_")
        self.sandbox_id = os.path.basename(self.temp_dir)
        return self.sandbox_id
    
    def setup_vue_project(self, template: str = "default") -> bool:
        """在沙盒中设置基本的Vue项目结构"""
        if not self.temp_dir:
            self.create_sandbox()
        
        try:
            # 创建基本目录结构
            os.makedirs(os.path.join(self.temp_dir, "src"), exist_ok=True)
            os.makedirs(os.path.join(self.temp_dir, "public"), exist_ok=True)
            
            # 创建基本文件
            with open(os.path.join(self.temp_dir, "package.json"), 'w') as f:
                json.dump({
                    "name": f"vue-sandbox-{self.sandbox_id}",
                    "version": "0.1.0",
                    "private": True,
                    "scripts": {
                        "serve": "vue-cli-service serve",
                        "build": "vue-cli-service build",
                        "lint": "vue-cli-service lint"
                    },
                    "dependencies": {
                        "vue": "^3.2.0"
                    },
                    "devDependencies": {
                        "@vue/cli-service": "^5.0.0"
                    }
                }, f, indent=2)
            
            # 创建主HTML文件
            with open(os.path.join(self.temp_dir, "public/index.html"), 'w') as f:
                f.write("""
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>Vue Sandbox</title>
  </head>
  <body>
    <div id="app"></div>
    <!-- built files will be auto injected -->
  </body>
</html>
                """)
            
            # 创建主Vue文件
            with open(os.path.join(self.temp_dir, "src/main.js"), 'w') as f:
                f.write("""
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
                """)
            
            # 创建App.vue模板文件
            with open(os.path.join(self.temp_dir, "src/App.vue"), 'w') as f:
                f.write("""
<template>
  <div id="app">
    <h1>Vue Sandbox</h1>
    <!-- 用户组件将在此处插入 -->
  </div>
</template>

<script>
export default {
  name: 'App',
  components: {
    // 用户组件将在此处注册
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
                """)
            
            return True
        except Exception as e:
            print(f"设置Vue项目失败: {str(e)}")
            return False
    
    def write_user_component(self, component_code: str, filename: str = "UserComponent.vue") -> str:
        """写入用户组件代码到沙盒环境"""
        if not self.temp_dir:
            self.create_sandbox()
        
        file_path = os.path.join(self.temp_dir, "src", filename)
        with open(file_path, 'w') as f:
            f.write(component_code)
        
        return file_path
    
    def write_multiple_files(self, files: Dict[str, str]) -> Dict[str, str]:
        """写入多个文件到沙盒环境"""
        if not self.temp_dir:
            self.create_sandbox()
        
        created_files = {}
        for rel_path, content in files.items():
            abs_path = os.path.join(self.temp_dir, rel_path)
            os.makedirs(os.path.dirname(abs_path), exist_ok=True)
            
            with open(abs_path, 'w') as f:
                f.write(content)
            
            created_files[rel_path] = abs_path
        
        return created_files
    
    def execute_command(self, command: str) -> Tuple[bool, str, str]:
        """在沙盒环境中执行命令"""
        if not self.temp_dir:
            return False, "", "沙盒环境尚未创建"
        
        try:
            result = subprocess.run(
                command,
                shell=True,
                cwd=self.temp_dir,
                capture_output=True,
                text=True
            )
            
            success = result.returncode == 0
            output = result.stdout
            error = result.stderr
            
            return success, output, error
        except Exception as e:
            return False, "", f"执行命令失败: {str(e)}"
    
    def validate_vue_component(self, component_code: str) -> Tuple[bool, str]:
        """验证Vue组件的语法"""
        if not self.temp_dir:
            self.create_sandbox()
            
        # 创建临时Vue文件
        temp_file = os.path.join(self.temp_dir, "temp_component.vue")
        with open(temp_file, 'w') as f:
            f.write(component_code)
        
        # 使用vue-cli进行检查
        # 注意：这是简化示例，实际实现可能需要调整
        cmd = f"npx @vue/cli-service lint {temp_file} --no-fix"
        success, output, error = self.execute_command(cmd)
        
        if success:
            return True, "组件语法正确"
        else:
            return False, error or "组件验证失败，但未返回具体错误信息"
    
    def build_preview(self) -> Tuple[bool, str]:
        """构建预览版本"""
        success, output, error = self.execute_command("npm run build")
        
        if success:
            return True, os.path.join(self.temp_dir, "dist")
        else:
            return False, error
    
    def cleanup(self):
        """清理沙盒环境"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            import shutil
            shutil.rmtree(self.temp_dir)
            self.temp_dir = None
            self.sandbox_id = None
