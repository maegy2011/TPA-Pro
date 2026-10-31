#!/usr/bin/env python3
"""تجميع الكود بالكامل داخل ملف نصي واحد.

يقرأ جميع ملفات المشروع (باستثناء الملفات/المجلدات المحددة) ويكتب
اسم كل ملف (بالمسار الكامل) ثم محتواه إلى ملف نصي واحد.
"""
import os
import sys

ROOT = os.path.abspath(os.path.dirname(__file__))
OUTPUT = os.path.join(ROOT, "all_code.txt")

# مجلدات/ملفات للتجاهل
IGNORE_DIRS = {".git", "node_modules", "__pycache__", ".venv", "venv", "dist", "build"}
IGNORE_FILES = {"all_code.txt", "concat_code.py"}
# امتدادات نصية مقبولة
TEXT_EXTS = {
    ".py", ".js", ".ts", ".tsx", ".jsx", ".html", ".css", ".json", ".md",
    ".txt", ".yml", ".yaml", ".xml", ".svg", ".sh", ".sql", ".env", ".gitignore",
    ".conf", ".ini", ".toml", ".lock",
}

def is_text_file(path):
    ext = os.path.splitext(path)[1].lower()
    if ext in TEXT_EXTS:
        return True
    # ملفات بدون امتداد
    if ext == "":
        return True
    return False

def main():
    collected = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        # تجاهل المجلدات
        dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS and not d.startswith(".")]
        for fn in sorted(filenames):
            if fn in IGNORE_FILES:
                continue
            full = os.path.join(dirpath, fn)
            if not is_text_file(full):
                continue
            try:
                with open(full, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
            except Exception as e:
                content = f"<تعذر قراءة الملف: {e}>"
            rel = os.path.relpath(full, ROOT)
            collected.append((rel, full, content))

    with open(OUTPUT, "w", encoding="utf-8") as out:
        for rel, full, content in collected:
            out.write("=" * 80 + "\n")
            out.write(f"FILE: {full}\n")
            out.write("=" * 80 + "\n")
            out.write(content)
            if not content.endswith("\n"):
                out.write("\n")
            out.write("\n")

    print(f"تم تجميع {len(collected)} ملفاً في {OUTPUT}")

if __name__ == "__main__":
    main()
