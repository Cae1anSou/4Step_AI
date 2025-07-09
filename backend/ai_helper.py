"""
AI助手模块 - 用于分析错误并提供不同层次的帮助
"""

def get_filtered_errors(raw_error, code):
    """
    阶段1: AI筛选 - 从原始错误中提取关键信息
    
    在实际项目中，这里可以使用LLM API来分析原始错误信息
    本demo版本使用简化实现
    """
    # 简化版实现：提取关键错误信息
    error_lines = raw_error.strip().split('\n')
    filtered_errors = []
    
    for line in error_lines:
        # 过滤掉堆栈跟踪和非关键信息
        if "Error:" in line or "SyntaxError:" in line or "ReferenceError:" in line:
            filtered_errors.append(line)
            
        # 添加行号信息
        if "at line" in line or "at position" in line:
            filtered_errors.append(line)
    
    if not filtered_errors:
        filtered_errors = ["分析发现代码中存在错误，但无法提取具体错误信息。请检查语法和逻辑问题。"]
    
    return "\n".join(filtered_errors)

def get_detailed_explanation(raw_error, code):
    """
    阶段2: AI提示 - 提供错误的详细解释，但不给具体代码
    
    在实际项目中，这里应该调用LLM API进行分析
    """
    explanation = "根据错误信息分析，可能存在以下问题：\n\n"
    
    if "SyntaxError" in raw_error:
        explanation += "- 语法错误: 代码结构有问题，请检查括号、引号或分号是否正确\n"
        if "Unexpected token" in raw_error:
            explanation += "  可能是遇到了意外的字符，比如缺少了一个闭合的括号或引号\n"
            
    if "ReferenceError" in raw_error:
        explanation += "- 引用错误: 你可能使用了未定义的变量或方法\n"
        
    if "TypeError" in raw_error:
        explanation += "- 类型错误: 尝试对一个值进行不适当的操作，比如将一个非函数当作函数调用\n"
        
    if "v-" in code and "Vue" in code:
        explanation += "\nVue特有问题:\n"
        explanation += "- 检查组件是否正确注册\n"
        explanation += "- 检查props和data是否正确定义\n"
        explanation += "- 检查模板语法是否正确\n"
    
    return explanation + "\n请根据这些提示检查代码。"

def get_solution_code(raw_error, code):
    """
    阶段3: AI给答案 - 提供修复代码的解决方案
    
    在实际项目中，这里应该调用LLM API生成修复后的代码
    """
    # 简单的示例修复 - 真实系统中应该由LLM分析并修复
    fixed_code = code
    
    # 示例修复：处理一些常见错误
    if "SyntaxError" in raw_error:
        if "Unexpected token" in raw_error and "{" in code and "}" not in code:
            fixed_code += "\n}"
        elif "Unexpected token" in raw_error and "(" in code and ")" not in code:
            fixed_code += "\n)"
            
    if "ReferenceError" in raw_error and "is not defined" in raw_error:
        # 提取未定义的变量名
        import re
        match = re.search(r"ReferenceError: (\w+) is not defined", raw_error)
        if match:
            var_name = match.group(1)
            fixed_code = f"const {var_name} = null; // 添加变量定义\n" + fixed_code
    
    # 添加解释注释
    fixed_code = "// 修复后的代码：\n" + fixed_code
    
    return fixed_code

def analyze_error(raw_error, code):
    """
    综合分析错误并返回所有级别的信息
    """
    return {
        "filtered_error": get_filtered_errors(raw_error, code),
        "explanation": get_detailed_explanation(raw_error, code),
        "solution": get_solution_code(raw_error, code)
    }
