---
title: 可观测性与生产验证
tags:
  - topic
---

> AI 代码生成的 **真正瓶颈不是 Code Review，而是生产环境的 Validation**。没有可观测性探针，就无从判断 AI 写的代码是否安全运行。

## 主要倡导者

- [[../people/charity-majors|Charity Majors]] — 一贯的可观测性立场延伸到 AI 时代

## 核心论点

- 代码审查只能验证 **表面正确性**，生产验证才能验证 **运行时正确性**
- AI 提高了代码产出速度 → 放大了 **验证缺口**
- 必须提前埋好可观测性基础设施，否则 AI 编程的风险会指数级放大

## 对比

- [[../people/dhh|DHH]] 的 [[agent-first|Agent-first]] 关注产出后的审查
- [[../people/birgitta-bockeler|Birgitta]] 的 [[harness-engineering|Harness Engineering]] 关注智能体运行时的约束
- Charity 关注 **部署之后的运行时真相**

## 笔记
