#!/usr/bin/env python3
"""Generate the Reader AI version-evolution timeline as a dependency-free SVG.

从最初形态到今天的完善度，按里程碑阶段绘制垂直时间轴。
Data lives here so the diagram is regenerable: edit PHASES and re-run.

    python3 scripts/gen_timeline.py            # -> docs/version-timeline.svg

No third-party deps (pure SVG string), so it renders on GitHub and survives a
machine without matplotlib.
"""

from __future__ import annotations

import html
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "docs" / "version-timeline.svg"

# --- Milestone data (source: git history) -------------------------------------
# color = accent per phase; ver = milestone label; title/bullets = bilingual-lite
PHASES = [
    {
        "date": "2026-05-14",
        "ver": "v0.1 · 初版",
        "title": "WeChat Reader AI — 公众号文章分析",
        "color": "#6366f1",
        "bullets": [
            "多 Provider 支持 + 5 段结构化分析",
            "structure / conclusion / author intent",
        ],
    },
    {
        "date": "2026-06-24",
        "ver": "v0.5 · 阅读工作流",
        "title": "从「读完」到「沉淀」的闭环",
        "color": "#0ea5e9",
        "bullets": [
            "source-linked 摘录 + 划词 click-to-excerpt",
            "核心洞察优先、reader value 导向",
            "偏好 / 摘录持久化",
        ],
    },
    {
        "date": "2026-06-30 → 07-02",
        "ver": "v0.8 · 质量 + 缓存",
        "title": "分析可信度与零重复消耗 (WR-016/17/18)",
        "color": "#14b8a6",
        "bullets": [
            "状态竞态修复、评论区语义 + Reader Profile",
            "per-URL 分析缓存：重开秒出、零 API 消耗",
            "双语安装文档",
        ],
    },
    {
        "date": "2026-07-02",
        "ver": "v1.1.0 · 站点适配器",
        "title": "架构升级 + 小红书接入 (WR-019)",
        "color": "#f59e0b",
        "bullets": [
            "SITE_ADAPTERS 站点适配器模式",
            "新平台 = 1 个 adapter + 1 行 manifest match",
            "小红书图文/视频笔记捕获",
        ],
    },
    {
        "date": "2026-07-03",
        "ver": "v1.2 · 多模态识图",
        "title": "图片看得懂了 (WR-020)",
        "color": "#ec4899",
        "bullets": [
            "多模态图片分析 + [IMG#] 引用体系",
            "图片上限提到 12 + 自适应缩放",
            "新增 Gemini；智谱默认免费视觉 glm-4v-flash",
        ],
    },
    {
        "date": "2026-07-04",
        "ver": "v1.3 · 识图健壮性 + 分工",
        "title": "视觉/文字分工，绝不因图停摆",
        "color": "#ef4444",
        "bullets": [
            "识图选 GLM/Qwen，文字走 DeepSeek 主模型（融合非并列）",
            "图片分批绕过免费模型单次上限",
            "max_tokens 自适应；识图失败自动降级纯文本",
        ],
    },
]

# --- Layout constants ---------------------------------------------------------
W = 940
PAD_TOP = 96
SPINE_X = 70
CARD_X = 120
CARD_W = W - CARD_X - 40
LINE_H = 22
CARD_PAD = 16
GAP = 34          # gap between cards
TITLE_BLOCK = 70  # date + version + title height inside card before bullets


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def build() -> str:
    parts: list[str] = []
    y = PAD_TOP
    node_centers: list[tuple[int, str]] = []

    for ph in PHASES:
        n = len(ph["bullets"])
        card_h = TITLE_BLOCK + n * LINE_H + CARD_PAD
        cy = y + 26  # node aligns near card top
        node_centers.append((cy, ph["color"]))

        # card
        parts.append(
            f'<rect x="{CARD_X}" y="{y}" width="{CARD_W}" height="{card_h}" rx="12" '
            f'fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>'
        )
        # accent bar
        parts.append(
            f'<rect x="{CARD_X}" y="{y}" width="5" height="{card_h}" rx="2.5" fill="{ph["color"]}"/>'
        )
        tx = CARD_X + CARD_PAD + 4
        # date pill
        parts.append(
            f'<text x="{tx}" y="{y+24}" font-size="12.5" font-weight="600" '
            f'fill="{ph["color"]}" font-family="ui-monospace,Menlo,monospace">{esc(ph["date"])}</text>'
        )
        # version
        parts.append(
            f'<text x="{tx}" y="{y+44}" font-size="16" font-weight="700" fill="#111827">{esc(ph["ver"])}</text>'
        )
        # title
        parts.append(
            f'<text x="{tx}" y="{y+44+21}" font-size="13.5" fill="#374151">{esc(ph["title"])}</text>'
        )
        # bullets
        by = y + TITLE_BLOCK + 20
        for b in ph["bullets"]:
            parts.append(
                f'<circle cx="{tx+3}" cy="{by-4}" r="2.5" fill="{ph["color"]}"/>'
            )
            parts.append(
                f'<text x="{tx+14}" y="{by}" font-size="13" fill="#4b5563">{esc(b)}</text>'
            )
            by += LINE_H

        y += card_h + GAP

    total_h = y + 30
    spine_bottom = node_centers[-1][0]

    header = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{total_h}" '
        f'viewBox="0 0 {W} {total_h}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif">',
        f'<rect width="{W}" height="{total_h}" fill="#f9fafb"/>',
        f'<text x="{SPINE_X-14}" y="46" font-size="24" font-weight="800" fill="#111827">Reader AI — 版本演进时间轴</text>',
        f'<text x="{SPINE_X-14}" y="70" font-size="13" fill="#6b7280">从公众号单篇分析 → 多站点多模态识图分工的内容管线输入端 · 2026-05 → 2026-07</text>',
        # spine
        f'<line x1="{SPINE_X}" y1="{node_centers[0][0]}" x2="{SPINE_X}" y2="{spine_bottom}" stroke="#d1d5db" stroke-width="2"/>',
    ]

    # nodes + connectors
    nodes = []
    for (cy, color) in node_centers:
        nodes.append(
            f'<line x1="{SPINE_X}" y1="{cy}" x2="{CARD_X}" y2="{cy}" stroke="#d1d5db" stroke-width="2"/>'
        )
        nodes.append(f'<circle cx="{SPINE_X}" cy="{cy}" r="8" fill="#ffffff" stroke="{color}" stroke-width="3"/>')
        nodes.append(f'<circle cx="{SPINE_X}" cy="{cy}" r="3" fill="{color}"/>')

    return "\n".join(header + nodes + parts + ["</svg>"]) + "\n"


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(build(), encoding="utf-8")
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes, {len(PHASES)} phases)")


if __name__ == "__main__":
    main()
