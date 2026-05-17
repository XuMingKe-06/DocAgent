"""DocAgent Python Sidecar
文档处理入口，通过 stdin/stdout JSON 协议与 Rust 后端通信
"""

import sys
import json


def handle_request(request: dict) -> dict:
    """处理文档操作请求"""
    action = request.get("action", "")
    doc_type = request.get("type", "")
    params = request.get("params", {})

    # TODO: 实现各文档格式处理逻辑
    return {
        "success": True,
        "action": action,
        "type": doc_type,
        "message": f"文档处理请求已接收: {action}/{doc_type}",
    }


def main():
    """主循环：从 stdin 读取 JSON 请求，处理并输出到 stdout"""
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            request = json.loads(line)
            response = handle_request(request)
        except json.JSONDecodeError as e:
            response = {"success": False, "error": f"JSON 解析错误: {e}"}
        except Exception as e:
            response = {"success": False, "error": str(e)}

        sys.stdout.write(json.dumps(response, ensure_ascii=False) + "\n")
        sys.stdout.flush()


if __name__ == "__main__":
    main()
